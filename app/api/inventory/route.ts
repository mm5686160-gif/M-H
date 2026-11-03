import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { canSeeCosts } from '@/lib/utils';
import Decimal from 'decimal.js';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const userRole = session?.user?.role;
    const showCost = canSeeCosts(userRole);

    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q');
    const warehouseId = searchParams.get('warehouseId');
    const categoryId = searchParams.get('categoryId');
    const lowStock = searchParams.get('lowStock') === 'true';

    const where: any = { isActive: true };

    if (categoryId && categoryId !== 'ALL') {
      where.categoryId = categoryId;
    }

    if (q) {
      where.OR = [
        { sku: { contains: q, mode: 'insensitive' } },
        { barcode: { contains: q, mode: 'insensitive' } },
        { nameAr: { contains: q, mode: 'insensitive' } },
        { nameEn: { contains: q, mode: 'insensitive' } },
        { bearingSpec: { bearingNumber: { contains: q, mode: 'insensitive' } } },
        { sparePartSpec: { partNumber: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const [products, warehouses] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: { select: { id: true, nameAr: true, nameEn: true } },
          bearingSpec: true,
          sparePartSpec: true,
          warehouses: {
            include: {
              warehouse: { select: { id: true, nameAr: true, nameEn: true } },
            },
          },
        },
        orderBy: { nameAr: 'asc' },
      }),
      prisma.warehouse.findMany({
        where: { isActive: true },
        select: { id: true, nameAr: true, nameEn: true, location: true },
        orderBy: { nameAr: 'asc' },
      }),
    ]);

    let data = products.map((prod) => {
      const warehouseStockMap: Record<string, { qty: number; shelf: string | null }> = {};
      let totalStock = new Decimal(0);

      prod.warehouses.forEach((pw) => {
        const qty = new Decimal(pw.quantityOnHand.toString());
        totalStock = totalStock.plus(qty);
        warehouseStockMap[pw.warehouseId] = {
          qty: qty.toNumber(),
          shelf: pw.shelfLocation,
        };
      });

      const minStock = new Decimal(prod.minStockLevel.toString());
      const isLowStock = totalStock.lessThanOrEqualTo(minStock);
      const isOutOfStock = totalStock.isZero();

      const unitCost = showCost ? Number(prod.currentWAC) : null;
      const totalCostValue = showCost ? totalStock.times(prod.currentWAC).toNumber() : null;

      return {
        id: prod.id,
        sku: prod.sku,
        barcode: prod.barcode,
        nameAr: prod.nameAr,
        nameEn: prod.nameEn,
        productType: prod.productType,
        category: prod.category,
        unitOfMeasure: prod.unitOfMeasure,
        piecesPerBox: prod.piecesPerBox,
        boxesPerCarton: prod.boxesPerCarton,
        minStockLevel: minStock.toNumber(),
        totalStock: totalStock.toNumber(),
        isLowStock,
        isOutOfStock,
        unitCost,
        totalCostValue,
        warehouseStocks: warehouseStockMap,
        bearingNumber: prod.bearingSpec?.bearingNumber || null,
        partNumber: prod.sparePartSpec?.partNumber || null,
      };
    });

    if (warehouseId && warehouseId !== 'ALL') {
      data = data.filter((p) => {
        const ws = p.warehouseStocks[warehouseId];
        return ws && ws.qty > 0;
      });
    }

    if (lowStock) {
      data = data.filter((p) => p.isLowStock);
    }

    // Summary KPIs
    const totalSKUs = data.length;
    const totalUnitsInStock = data.reduce((acc, p) => acc + p.totalStock, 0);
    const lowStockCount = data.filter((p) => p.isLowStock).length;
    const totalInventoryValue = showCost
      ? data.reduce((acc, p) => acc + (p.totalCostValue || 0), 0)
      : null;

    return NextResponse.json({
      success: true,
      warehouses,
      kpis: {
        totalSKUs,
        totalUnitsInStock,
        lowStockCount,
        totalInventoryValue,
      },
      data,
    });
  } catch (error: any) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch inventory' },
      { status: 500 }
    );
  }
}
