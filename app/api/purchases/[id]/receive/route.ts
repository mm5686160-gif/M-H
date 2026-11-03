import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { canManagePurchases, calculateWAC, generateCode } from '@/lib/utils';
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
        { error: 'You do not have permission to receive goods' },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await req.json();
    const { receiptDate, notes, items } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'At least one item must be received' },
        { status: 400 }
      );
    }

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

    const receiptCount = await prisma.goodsReceipt.count();
    const receiptNumber = generateCode('RCV-', receiptCount);

    // Execute atomic Goods Receipt, Stock Increment, and WAC recalculation
    const result = await prisma.$transaction(async (tx) => {
      const receipt = await tx.goodsReceipt.create({
        data: {
          poId: po.id,
          shipmentId: po.shipment?.id || null,
          receiptNumber,
          receiptDate: receiptDate ? new Date(receiptDate) : new Date(),
          receivedByUserId: session.user.id,
          receivedByName: session.user.name || 'User',
          notes: notes || null,
        },
      });

      for (const itemInput of items) {
        const receivedQty = new Decimal(itemInput.quantityReceived || 0);
        if (receivedQty.lte(0)) continue;

        const poItem = po.items.find((it) => it.id === itemInput.poItemId);
        if (!poItem) continue;

        const targetWarehouseId = itemInput.warehouseId;
        if (!targetWarehouseId) {
          throw new Error(`Warehouse is required for product ${poItem.productId}`);
        }

        // True Unit Landed Cost in EGP
        const trueUnitCost = poItem.unitPriceEGP.plus(poItem.landedCostPerUnit);
        const totalLineCost = trueUnitCost.times(receivedQty);

        // Fetch product & calculate new WAC
        const product = await tx.product.findUnique({
          where: { id: poItem.productId },
          include: { warehouses: true },
        });

        if (!product) continue;

        const currentTotalStock = product.warehouses.reduce(
          (sum, w) => sum.plus(w.quantityOnHand),
          new Decimal(0)
        );

        const previousWAC = product.currentWAC;
        const newWAC = calculateWAC(
          currentTotalStock,
          previousWAC,
          receivedQty,
          trueUnitCost
        );

        // Update product WAC
        await tx.product.update({
          where: { id: product.id },
          data: { currentWAC: newWAC },
        });

        // Upsert ProductWarehouse stock
        await tx.productWarehouse.upsert({
          where: {
            productId_warehouseId: {
              productId: product.id,
              warehouseId: targetWarehouseId,
            },
          },
          update: {
            quantityOnHand: { increment: receivedQty },
            shelfLocation: itemInput.shelfLocation || undefined,
          },
          create: {
            productId: product.id,
            warehouseId: targetWarehouseId,
            quantityOnHand: receivedQty,
            shelfLocation: itemInput.shelfLocation || null,
          },
        });

        // Record in CostHistory
        await tx.costHistory.create({
          data: {
            productId: product.id,
            effectiveDate: receiptDate ? new Date(receiptDate) : new Date(),
            costPerUnit: trueUnitCost,
            previousCost: previousWAC,
            quantityAtTime: receivedQty,
            source: 'PURCHASE',
            referenceId: po.id,
            notes: `استلام من أمر شراء ${po.poNumber} بسعر استيراد ${trueUnitCost.toFixed(2)} ج.م للوحدة`,
          },
        });

        // Create GoodsReceiptItem
        await tx.goodsReceiptItem.create({
          data: {
            receiptId: receipt.id,
            poItemId: poItem.id,
            productId: product.id,
            warehouseId: targetWarehouseId,
            quantityReceived: receivedQty,
            unitCostEGP: trueUnitCost,
            totalCostEGP: totalLineCost,
            previousWAC,
            newWAC,
          },
        });

        // Update POItem received quantity
        await tx.pOItem.update({
          where: { id: poItem.id },
          data: {
            quantityReceived: { increment: receivedQty },
          },
        });
      }

      // Check if all items are fully received
      const updatedPOItems = await tx.pOItem.findMany({ where: { poId: po.id } });
      const allFullyReceived = updatedPOItems.every((it) =>
        it.quantityReceived.gte(it.quantityOrdered)
      );

      const newStatus = allFullyReceived ? 'RECEIVED' : 'CUSTOMS';
      await tx.purchaseOrder.update({
        where: { id: po.id },
        data: { status: newStatus },
      });

      if (po.shipment) {
        await tx.shipment.update({
          where: { id: po.shipment.id },
          data: {
            status: newStatus,
            receivedDate: new Date(),
          },
        });
      }

      // Audit Log
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          userName: session.user.name || 'User',
          action: 'CREATE',
          entityType: 'SHIPMENT',
          entityId: receipt.id,
          afterData: {
            receiptNumber,
            poNumber: po.poNumber,
            allFullyReceived,
          },
        },
      });

      return receipt;
    });

    return NextResponse.json({
      success: true,
      message: 'تم استلام البضاعة وتحديث أرصدة المخزون ومتوسط التكلفة WAC بنجاح',
      data: result,
    });
  } catch (error: any) {
    console.error('Error receiving goods:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to receive goods' },
      { status: 500 }
    );
  }
}
