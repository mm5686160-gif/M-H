import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import Decimal from 'decimal.js';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const warehouseId = searchParams.get('warehouseId');
    const productId = searchParams.get('productId');

    const where: any = {};
    if (warehouseId) {
      where.OR = [
        { fromWarehouseId: warehouseId },
        { toWarehouseId: warehouseId },
      ];
    }
    if (productId) {
      where.productId = productId;
    }

    const transfers = await prisma.stockTransfer.findMany({
      where,
      include: {
        fromWarehouse: { select: { id: true, nameAr: true, nameEn: true } },
        toWarehouse: { select: { id: true, nameAr: true, nameEn: true } },
      },
      orderBy: { transferDate: 'desc' },
      take: 100,
    });

    // Fetch product details for the transfers
    const productIds = Array.from(new Set(transfers.map((t) => t.productId)));
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
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

    const productMap = new Map(products.map((p) => [p.id, p]));

    const data = transfers.map((t) => {
      const prod = productMap.get(t.productId);
      return {
        ...t,
        quantity: Number(t.quantity),
        product: prod
          ? {
              id: prod.id,
              sku: prod.sku,
              nameAr: prod.nameAr,
              nameEn: prod.nameEn,
              unitOfMeasure: prod.unitOfMeasure,
              bearingNumber: prod.bearingSpec?.bearingNumber,
              partNumber: prod.sparePartSpec?.partNumber,
            }
          : null,
      };
    });

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error fetching stock transfers:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch transfers' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      fromWarehouseId,
      toWarehouseId,
      productId,
      quantity,
      transferDate,
      reference,
      notes,
    } = body;

    if (!fromWarehouseId || !toWarehouseId || !productId || !quantity) {
      return NextResponse.json(
        { error: 'Source warehouse, destination warehouse, product, and quantity are required' },
        { status: 400 }
      );
    }

    if (fromWarehouseId === toWarehouseId) {
      return NextResponse.json(
        { error: 'Source and destination warehouses cannot be the same' },
        { status: 400 }
      );
    }

    const transferQty = new Decimal(quantity);
    if (transferQty.lessThanOrEqualTo(0)) {
      return NextResponse.json(
        { error: 'Transfer quantity must be greater than zero' },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Verify source warehouse stock
      const sourcePW = await tx.productWarehouse.findUnique({
        where: {
          productId_warehouseId: {
            productId,
            warehouseId: fromWarehouseId,
          },
        },
      });

      if (!sourcePW || new Decimal(sourcePW.quantityOnHand.toString()).lessThan(transferQty)) {
        throw new Error(
          `Insufficient stock in source warehouse. Available: ${
            sourcePW ? Number(sourcePW.quantityOnHand) : 0
          }, Requested: ${transferQty}`
        );
      }

      // 2. Decrement source warehouse stock
      await tx.productWarehouse.update({
        where: {
          productId_warehouseId: {
            productId,
            warehouseId: fromWarehouseId,
          },
        },
        data: {
          quantityOnHand: { decrement: transferQty },
        },
      });

      // 3. Increment destination warehouse stock (or create if not present)
      await tx.productWarehouse.upsert({
        where: {
          productId_warehouseId: {
            productId,
            warehouseId: toWarehouseId,
          },
        },
        update: {
          quantityOnHand: { increment: transferQty },
        },
        create: {
          productId,
          warehouseId: toWarehouseId,
          quantityOnHand: transferQty,
          shelfLocation: null,
        },
      });

      // 4. Record StockTransfer
      const transfer = await tx.stockTransfer.create({
        data: {
          fromWarehouseId,
          toWarehouseId,
          productId,
          quantity: transferQty,
          transferDate: transferDate ? new Date(transferDate) : new Date(),
          reference: reference || null,
          notes: notes || null,
          transferredBy: session.user.name || session.user.email || 'User',
        },
      });

      // 5. Audit Log
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          userName: session.user.name || 'User',
          action: 'UPDATE',
          entityType: 'PRODUCT',
          entityId: productId,
          afterData: {
            fromWarehouseId,
            toWarehouseId,
            productId,
            quantity: transferQty.toNumber(),
            reference,
          },
        },
      });

      return transfer;
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error: any) {
    console.error('Error executing stock transfer:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to execute transfer' },
      { status: 400 }
    );
  }
}
