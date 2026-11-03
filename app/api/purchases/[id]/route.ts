import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { canManagePurchases } from '@/lib/utils';
import Decimal from 'decimal.js';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const po = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: true,
        shipment: true,
        items: {
          include: {
            product: {
              include: {
                category: true,
                bearingSpec: true,
                sparePartSpec: true,
                warehouses: {
                  include: { warehouse: true },
                },
              },
            },
          },
        },
        receipts: {
          include: {
            items: true,
          },
          orderBy: { receiptDate: 'desc' },
        },
        supplierPayments: {
          orderBy: { paymentDate: 'desc' },
        },
      },
    });

    if (!po) {
      return NextResponse.json({ error: 'Purchase Order not found' }, { status: 404 });
    }

    const sanitized = {
      ...po,
      exchangeRate: Number(po.exchangeRate),
      subtotalForeign: Number(po.subtotalForeign),
      subtotalEGP: Number(po.subtotalEGP),
      supplier: {
        ...po.supplier,
        currentBalance: Number(po.supplier.currentBalance),
      },
      shipment: po.shipment
        ? {
            ...po.shipment,
            freightCostEGP: Number(po.shipment.freightCostEGP),
            customsDutyEGP: Number(po.shipment.customsDutyEGP),
            clearanceFeesEGP: Number(po.shipment.clearanceFeesEGP),
            localTransportEGP: Number(po.shipment.localTransportEGP),
            otherCostsEGP: Number(po.shipment.otherCostsEGP),
            totalLandedCostEGP: Number(po.shipment.totalLandedCostEGP),
          }
        : null,
      items: po.items.map((it) => ({
        ...it,
        quantityOrdered: Number(it.quantityOrdered),
        quantityReceived: Number(it.quantityReceived),
        unitPriceForeign: Number(it.unitPriceForeign),
        unitPriceEGP: Number(it.unitPriceEGP),
        landedCostPerUnit: Number(it.landedCostPerUnit),
        totalLandedCostEGP: Number(it.totalLandedCostEGP),
        trueUnitCostEGP: Number(it.unitPriceEGP) + Number(it.landedCostPerUnit),
        product: {
          ...it.product,
          minStockLevel: Number(it.product.minStockLevel),
          currentWAC: Number(it.product.currentWAC),
          totalStock: it.product.warehouses.reduce((sum, w) => sum + Number(w.quantityOnHand), 0),
        },
      })),
      receipts: po.receipts.map((r) => ({
        ...r,
        items: r.items.map((ri) => ({
          ...ri,
          quantityReceived: Number(ri.quantityReceived),
          unitCostEGP: Number(ri.unitCostEGP),
          totalCostEGP: Number(ri.totalCostEGP),
          previousWAC: ri.previousWAC ? Number(ri.previousWAC) : null,
          newWAC: ri.newWAC ? Number(ri.newWAC) : null,
        })),
      })),
    };

    return NextResponse.json({ success: true, data: sanitized });
  } catch (error: any) {
    console.error('Error fetching purchase order:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch purchase order' },
      { status: 500 }
    );
  }
}

export async function PUT(
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
        { error: 'You do not have permission to update purchase orders' },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await req.json();
    const { status, shipment } = body;

    const existing = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: { shipment: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Purchase Order not found' }, { status: 404 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.update({
        where: { id },
        data: {
          status: status || existing.status,
          notes: body.notes !== undefined ? body.notes : existing.notes,
        },
      });

      if (shipment && existing.shipment) {
        await tx.shipment.update({
          where: { id: existing.shipment.id },
          data: {
            status: status || existing.shipment.status,
            etd: shipment.etd ? new Date(shipment.etd) : existing.shipment.etd,
            eta: shipment.eta ? new Date(shipment.eta) : existing.shipment.eta,
            portArrivalDate: shipment.portArrivalDate ? new Date(shipment.portArrivalDate) : existing.shipment.portArrivalDate,
            customsClearanceDate: shipment.customsClearanceDate ? new Date(shipment.customsClearanceDate) : existing.shipment.customsClearanceDate,
            receivedDate: shipment.receivedDate ? new Date(shipment.receivedDate) : existing.shipment.receivedDate,
            carrierName: shipment.carrierName ?? existing.shipment.carrierName,
            trackingNumber: shipment.trackingNumber ?? existing.shipment.trackingNumber,
            notes: shipment.notes ?? existing.shipment.notes,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          userName: session.user.name || 'User',
          action: 'UPDATE',
          entityType: 'PURCHASE_ORDER',
          entityId: id,
          afterData: body,
        },
      });

      return po;
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Error updating purchase order:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update purchase order' },
      { status: 500 }
    );
  }
}
