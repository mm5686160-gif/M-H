import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { canSeeCosts } from '@/lib/utils';
import Decimal from 'decimal.js';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const showCost = canSeeCosts(session?.user?.role);

    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('categoryId');
    const urgency = searchParams.get('urgency'); // 'ALL' | 'OUT_OF_STOCK' | 'CRITICAL' | 'LOW'

    const where: any = { isActive: true };
    if (categoryId && categoryId !== 'ALL') {
      where.categoryId = categoryId;
    }

    const products = await prisma.product.findMany({
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
        poItems: {
          select: {
            purchaseOrder: {
              select: {
                id: true,
                poNumber: true,
                supplier: {
                  select: {
                    id: true,
                    nameAr: true,
                    nameEn: true,
                    country: true,
                    defaultCurrency: true,
                  },
                },
              },
            },
          },
          orderBy: { id: 'desc' },
          take: 1,
        },
      },
      orderBy: { nameAr: 'asc' },
    });

    const alerts: any[] = [];

    products.forEach((prod: any) => {
      let totalStock = new Decimal(0);
      prod.warehouses.forEach((pw: any) => {
        totalStock = totalStock.plus(new Decimal(pw.quantityOnHand.toString()));
      });

      const minStock = new Decimal(prod.minStockLevel.toString());

      // Check if stock is low or out
      if (totalStock.lessThanOrEqualTo(minStock)) {
        const isOutOfStock = totalStock.isZero();
        const halfMin = minStock.dividedBy(2);
        const isCritical = !isOutOfStock && totalStock.lessThanOrEqualTo(halfMin);

        let urgencyLevel: 'OUT_OF_STOCK' | 'CRITICAL' | 'LOW' = 'LOW';
        if (isOutOfStock) urgencyLevel = 'OUT_OF_STOCK';
        else if (isCritical) urgencyLevel = 'CRITICAL';

        // Suggested reorder = (minStock * 2) - totalStock, at least minStock
        const targetStock = minStock.times(2);
        const suggestedQty = targetStock.minus(totalStock).ceil().toNumber();

        const lastSupplier = prod.poItems[0]?.purchaseOrder?.supplier || null;

        // Lead time estimation based on supplier country
        let estimatedLeadTimeDays = 45; // default import lead time
        if (lastSupplier?.country) {
          const c = lastSupplier.country.toLowerCase();
          if (c.includes('egypt') || c.includes('مصر')) estimatedLeadTimeDays = 7;
          else if (c.includes('china') || c.includes('صين')) estimatedLeadTimeDays = 50;
          else if (c.includes('germany') || c.includes('japan') || c.includes('ألمان')) estimatedLeadTimeDays = 35;
        }

        alerts.push({
          id: prod.id,
          sku: prod.sku,
          nameAr: prod.nameAr,
          nameEn: prod.nameEn,
          productType: prod.productType,
          category: prod.category,
          unitOfMeasure: prod.unitOfMeasure,
          totalStock: totalStock.toNumber(),
          minStockLevel: minStock.toNumber(),
          suggestedReorderQuantity: Math.max(suggestedQty, minStock.toNumber() || 10),
          urgency: urgencyLevel,
          estimatedLeadTimeDays,
          unitCost: showCost ? Number(prod.currentWAC) : null,
          lastSupplier,
          bearingNumber: prod.bearingSpec?.bearingNumber || null,
          partNumber: prod.sparePartSpec?.partNumber || null,
          warehouseBreakdown: prod.warehouses.map((w: any) => ({
            warehouse: w.warehouse.nameAr,
            qty: Number(w.quantityOnHand),
            shelf: w.shelfLocation,
          })),
        });
      }
    });

    let filtered = alerts;
    if (urgency && urgency !== 'ALL') {
      filtered = alerts.filter((a) => a.urgency === urgency);
    }

    // Sort: OUT_OF_STOCK first, then CRITICAL, then LOW
    const urgencyOrder: Record<string, number> = { OUT_OF_STOCK: 1, CRITICAL: 2, LOW: 3 };
    filtered.sort((a, b) => (urgencyOrder[a.urgency] || 99) - (urgencyOrder[b.urgency] || 99));

    return NextResponse.json({
      success: true,
      summary: {
        totalAlerts: alerts.length,
        outOfStockCount: alerts.filter((a) => a.urgency === 'OUT_OF_STOCK').length,
        criticalCount: alerts.filter((a) => a.urgency === 'CRITICAL').length,
        lowCount: alerts.filter((a) => a.urgency === 'LOW').length,
      },
      data: filtered,
    });
  } catch (error: any) {
    console.error('Error fetching inventory alerts:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch inventory alerts' },
      { status: 500 }
    );
  }
}
