import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { canSeeCosts } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const showCost = canSeeCosts(session?.user?.role);

    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');
    const warehouseId = searchParams.get('warehouseId');
    const limit = parseInt(searchParams.get('limit') || '100');

    const movements: any[] = [];

    // 1. Goods Receipts (Incoming)
    const receiptItems = await prisma.goodsReceiptItem.findMany({
      where: {
        ...(productId ? { productId } : {}),
        ...(warehouseId ? { warehouseId } : {}),
      },
      include: {
        goodsReceipt: {
          select: {
            id: true,
            receiptNumber: true,
            receiptDate: true,
            purchaseOrder: { select: { poNumber: true } },
          },
        },
        poItem: {
          include: {
            product: {
              select: {
                id: true,
                sku: true,
                nameAr: true,
                nameEn: true,
                unitOfMeasure: true,
                bearingSpec: { select: { bearingNumber: true } },
                sparePartSpec: { select: { partNumber: true } },
              },
            },
          },
        },
        warehouse: { select: { id: true, nameAr: true, nameEn: true } },
      },
      orderBy: { id: 'desc' },
      take: limit,
    });

    receiptItems.forEach((ri: any) => {
      movements.push({
        id: `rcpt-${ri.id}`,
        type: 'PURCHASE_RECEIPT',
        typeLabelAr: 'استلام شحنة استيراد',
        typeLabelEn: 'Import Receipt',
        direction: 'IN',
        date: ri.goodsReceipt?.receiptDate || new Date(),
        productId: ri.productId,
        product: ri.poItem?.product,
        warehouseId: ri.warehouseId,
        warehouse: ri.warehouse,
        quantity: Number(ri.quantityReceived),
        unitCost: showCost ? Number(ri.unitCostEGP) : null,
        reference: ri.goodsReceipt?.receiptNumber,
        notes: ri.goodsReceipt?.purchaseOrder?.poNumber
          ? `PO: ${ri.goodsReceipt.purchaseOrder.poNumber}`
          : null,
      });
    });

    // 2. Sales Invoices (Outgoing)
    const invoiceItems = await prisma.invoiceItem.findMany({
      where: {
        ...(productId ? { productId } : {}),
        ...(warehouseId ? { warehouseId } : {}),
      },
      include: {
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            invoiceDate: true,
            customer: { select: { nameAr: true, nameEn: true } },
          },
        },
        product: {
          select: {
            id: true,
            sku: true,
            nameAr: true,
            nameEn: true,
            unitOfMeasure: true,
            bearingSpec: { select: { bearingNumber: true } },
            sparePartSpec: { select: { partNumber: true } },
          },
        },
        warehouse: { select: { id: true, nameAr: true, nameEn: true } },
      },
      orderBy: { id: 'desc' },
      take: limit,
    });

    invoiceItems.forEach((ii: any) => {
      movements.push({
        id: `inv-${ii.id}`,
        type: 'SALE_INVOICE',
        typeLabelAr: 'فاتورة مبيعات',
        typeLabelEn: 'Sales Invoice',
        direction: 'OUT',
        date: ii.invoice?.invoiceDate || new Date(),
        productId: ii.productId,
        product: ii.product,
        warehouseId: ii.warehouseId,
        warehouse: ii.warehouse,
        quantity: Number(ii.quantity),
        unitCost: null,
        reference: ii.invoice?.invoiceNumber,
        notes: ii.invoice?.customer?.nameAr || ii.invoice?.customer?.nameEn || null,
      });
    });

    // 3. Stock Transfers (In & Out)
    const transfers = await prisma.stockTransfer.findMany({
      where: {
        ...(productId ? { productId } : {}),
        ...(warehouseId
          ? {
              OR: [{ fromWarehouseId: warehouseId }, { toWarehouseId: warehouseId }],
            }
          : {}),
      },
      include: {
        fromWarehouse: { select: { id: true, nameAr: true, nameEn: true } },
        toWarehouse: { select: { id: true, nameAr: true, nameEn: true } },
      },
      orderBy: { transferDate: 'desc' },
      take: limit,
    });

    const transferProductIds = Array.from(new Set(transfers.map((t) => t.productId)));
    const transferProducts = await prisma.product.findMany({
      where: { id: { in: transferProductIds } },
      select: {
        id: true,
        sku: true,
        nameAr: true,
        nameEn: true,
        unitOfMeasure: true,
        bearingSpec: { select: { bearingNumber: true } },
        sparePartSpec: { select: { partNumber: true } },
      },
    });
    const trProdMap = new Map(transferProducts.map((p) => [p.id, p]));

    transfers.forEach((t) => {
      const prod = trProdMap.get(t.productId);
      movements.push({
        id: `tr-${t.id}`,
        type: 'STOCK_TRANSFER',
        typeLabelAr: 'تحويل بين المستودعات',
        typeLabelEn: 'Inter-warehouse Transfer',
        direction: 'TRANSFER',
        date: t.transferDate,
        productId: t.productId,
        product: prod,
        warehouseId: t.toWarehouseId,
        warehouse: t.toWarehouse,
        fromWarehouse: t.fromWarehouse,
        quantity: Number(t.quantity),
        unitCost: null,
        reference: t.reference || `TR-${t.id.slice(-6)}`,
        notes: `${t.fromWarehouse.nameAr} ➔ ${t.toWarehouse.nameAr}`,
      });
    });

    // 4. Stock Adjustments (Add / Subtract)
    const adjustments = await prisma.stockAdjustment.findMany({
      where: {
        ...(productId ? { productId } : {}),
        ...(warehouseId ? { warehouseId } : {}),
      },
      include: {
        warehouse: { select: { id: true, nameAr: true, nameEn: true } },
      },
      orderBy: { adjustmentDate: 'desc' },
      take: limit,
    });

    const adjProductIds = Array.from(new Set(adjustments.map((a) => a.productId)));
    const adjProducts = await prisma.product.findMany({
      where: { id: { in: adjProductIds } },
      select: {
        id: true,
        sku: true,
        nameAr: true,
        nameEn: true,
        unitOfMeasure: true,
        bearingSpec: { select: { bearingNumber: true } },
        sparePartSpec: { select: { partNumber: true } },
      },
    });
    const adjProdMap = new Map(adjProducts.map((p) => [p.id, p]));

    adjustments.forEach((adj) => {
      const prod = adjProdMap.get(adj.productId);
      const diff = Number(adj.quantityAfter) - Number(adj.quantityBefore);
      movements.push({
        id: `adj-${adj.id}`,
        type: diff >= 0 ? 'ADJUSTMENT_ADD' : 'ADJUSTMENT_SUB',
        typeLabelAr: diff >= 0 ? 'تسوية جردية (إضافة)' : 'تسوية جردية (عجز/تالف)',
        typeLabelEn: diff >= 0 ? 'Adjustment (+)' : 'Adjustment (-)',
        direction: diff >= 0 ? 'IN' : 'OUT',
        date: adj.adjustmentDate,
        productId: adj.productId,
        product: prod,
        warehouseId: adj.warehouseId,
        warehouse: adj.warehouse,
        quantity: Math.abs(diff),
        unitCost: null,
        reference: `ADJ-${adj.id.slice(-6)}`,
        notes: adj.reason,
      });
    });

    // Sort all movements by date desc
    movements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({
      success: true,
      data: movements.slice(0, limit),
    });
  } catch (error: any) {
    console.error('Error fetching stock movements:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch movements' },
      { status: 500 }
    );
  }
}
