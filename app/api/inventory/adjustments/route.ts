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
    if (warehouseId) where.warehouseId = warehouseId;
    if (productId) where.productId = productId;

    const adjustments = await prisma.stockAdjustment.findMany({
      where,
      include: {
        warehouse: { select: { id: true, nameAr: true, nameEn: true } },
      },
      orderBy: { adjustmentDate: 'desc' },
      take: 100,
    });

    // Fetch product details for the adjustments
    const productIds = Array.from(new Set(adjustments.map((a) => a.productId)));
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

    const data = adjustments.map((a) => {
      const prod = productMap.get(a.productId);
      const qBefore = Number(a.quantityBefore);
      const qAfter = Number(a.quantityAfter);
      return {
        ...a,
        quantityBefore: qBefore,
        quantityAfter: qAfter,
        difference: qAfter - qBefore,
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
    console.error('Error fetching stock adjustments:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch adjustments' },
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
      warehouseId,
      productId,
      quantityAfter,
      reason,
      adjustmentDate,
    } = body;

    if (!warehouseId || !productId || quantityAfter === undefined || quantityAfter === null || !reason) {
      return NextResponse.json(
        { error: 'Warehouse, product, new quantity, and reason are required' },
        { status: 400 }
      );
    }

    const newQty = new Decimal(quantityAfter);
    if (newQty.isNegative()) {
      return NextResponse.json(
        { error: 'Quantity cannot be negative' },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Get current stock
      const currentPW = await tx.productWarehouse.findUnique({
        where: {
          productId_warehouseId: {
            productId,
            warehouseId,
          },
        },
      });

      const quantityBefore = currentPW
        ? new Decimal(currentPW.quantityOnHand.toString())
        : new Decimal(0);

      // 2. Upsert ProductWarehouse with new quantity
      await tx.productWarehouse.upsert({
        where: {
          productId_warehouseId: {
            productId,
            warehouseId,
          },
        },
        update: {
          quantityOnHand: newQty,
        },
        create: {
          productId,
          warehouseId,
          quantityOnHand: newQty,
          shelfLocation: null,
        },
      });

      // 3. Create StockAdjustment record
      const adjustment = await tx.stockAdjustment.create({
        data: {
          warehouseId,
          productId,
          adjustmentDate: adjustmentDate ? new Date(adjustmentDate) : new Date(),
          quantityBefore,
          quantityAfter: newQty,
          reason,
          adjustedBy: session.user.name || session.user.email || 'User',
        },
      });

      // 4. Audit Log
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          userName: session.user.name || 'User',
          action: 'UPDATE',
          entityType: 'PRODUCT',
          entityId: productId,
          afterData: {
            warehouseId,
            productId,
            quantityBefore: quantityBefore.toNumber(),
            quantityAfter: newQty.toNumber(),
            reason,
          },
        },
      });

      return adjustment;
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error: any) {
    console.error('Error executing stock adjustment:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to execute adjustment' },
      { status: 400 }
    );
  }
}
