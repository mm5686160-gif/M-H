import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { canManagePurchases, allocateLandedCostByValue, allocateLandedCostByWeight } from '@/lib/utils';
import Decimal from 'decimal.js';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!canManagePurchases(session.user.role)) {
      return NextResponse.json(
        { error: 'You do not have permission to allocate landed costs' },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await req.json();
    const {
      freightCostEGP = 0,
      customsDutyEGP = 0,
      clearanceFeesEGP = 0,
      localTransportEGP = 0,
      otherCostsEGP = 0,
      allocationMethod = 'BY_VALUE',
      itemWeights = {}, // { poItemId: weightInKg }
    } = body;

    const po = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        items: true,
        shipment: true,
      },
    });

    if (!po) {
      return NextResponse.json({ error: 'Purchase Order not found' }, { status: 404 });
    }

    const freight = new Decimal(freightCostEGP || 0);
    const customs = new Decimal(customsDutyEGP || 0);
    const clearance = new Decimal(clearanceFeesEGP || 0);
    const transport = new Decimal(localTransportEGP || 0);
    const other = new Decimal(otherCostsEGP || 0);

    const totalLandedCost = freight.plus(customs).plus(clearance).plus(transport).plus(other);

    // Calculate total weight if BY_WEIGHT
    let totalWeight = new Decimal(0);
    if (allocationMethod === 'BY_WEIGHT') {
      po.items.forEach((item) => {
        const w = new Decimal(itemWeights[item.id] || 1);
        totalWeight = totalWeight.plus(w);
      });
    }

    // Allocate landed cost to each item
    const allocated = await prisma.$transaction(async (tx) => {
      for (const item of po.items) {
        let unitLandedCost = new Decimal(0);

        if (allocationMethod === 'BY_VALUE') {
          const itemValue = item.unitPriceEGP.times(item.quantityOrdered);
          unitLandedCost = allocateLandedCostByValue(
            itemValue,
            po.subtotalEGP,
            totalLandedCost,
            item.quantityOrdered
          );
        } else {
          const itemWeight = new Decimal(itemWeights[item.id] || 1);
          unitLandedCost = allocateLandedCostByWeight(
            itemWeight,
            totalWeight,
            totalLandedCost,
            item.quantityOrdered
          );
        }

        const totalItemLandedCost = unitLandedCost.times(item.quantityOrdered);

        await tx.pOItem.update({
          where: { id: item.id },
          data: {
            landedCostPerUnit: unitLandedCost,
            totalLandedCostEGP: totalItemLandedCost,
          },
        });
      }

      // Update shipment record
      if (po.shipment) {
        await tx.shipment.update({
          where: { id: po.shipment.id },
          data: {
            freightCostEGP: freight,
            customsDutyEGP: customs,
            clearanceFeesEGP: clearance,
            localTransportEGP: transport,
            otherCostsEGP: other,
            totalLandedCostEGP: totalLandedCost,
            allocationMethod,
          },
        });
      }

      // Audit Log
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          userName: session.user.name || 'User',
          action: 'UPDATE',
          entityType: 'PURCHASE_ORDER',
          entityId: id,
          afterData: {
            action: 'ALLOCATE_LANDED_COST',
            totalLandedCost: totalLandedCost.toNumber(),
            allocationMethod,
          },
        },
      });

      return { totalLandedCost: totalLandedCost.toNumber() };
    });

    return NextResponse.json({
      success: true,
      message: 'تم توزيع تكلفة الاستيراد على بنود الشحنة بنجاح',
      data: allocated,
    });
  } catch (error: any) {
    console.error('Error allocating landed cost:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to allocate landed cost' },
      { status: 500 }
    );
  }
}
