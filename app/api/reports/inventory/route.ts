// app/api/reports/inventory/route.ts
// Inventory valuation and dead stock report with Excel export
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import ExcelJS from 'exceljs';
import Decimal from 'decimal.js';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const warehouseId = searchParams.get('warehouseId');
  const categoryId = searchParams.get('categoryId');
  const isExport = searchParams.get('export') === 'excel';

  const whereProduct: any = { isActive: true };
  if (categoryId) whereProduct.categoryId = categoryId;

  const products = await prisma.product.findMany({
    where: whereProduct,
    include: {
      category: { select: { nameAr: true } },
      warehouses: {
        where: warehouseId ? { warehouseId } : undefined,
        include: { warehouse: { select: { nameAr: true } } },
      },
      invoiceItems: {
        take: 1,
        orderBy: { invoice: { createdAt: 'desc' } },
        select: { invoice: { select: { createdAt: true } } },
      },
    },
  });

  const now = new Date();
  const ninetyDaysAgo = new Date(now);
  ninetyDaysAgo.setDate(now.getDate() - 90);

  let totalValuation = new Decimal(0);
  let totalUnits = new Decimal(0);
  let deadStockCount = 0;

  const rows: any[] = [];

  for (const p of products) {
    const totalQty = p.warehouses.reduce(
      (sum, w) => sum.plus(new Decimal(w.quantityOnHand.toString())),
      new Decimal(0),
    );
    const wac = new Decimal(p.currentWAC.toString());
    const val = totalQty.mul(wac);

    totalValuation = totalValuation.plus(val);
    totalUnits = totalUnits.plus(totalQty);

    const lastSaleDate = p.invoiceItems[0]?.invoice?.createdAt ?? null;
    const isDeadStock = totalQty.gt(0) && (!lastSaleDate || lastSaleDate < ninetyDaysAgo);

    if (isDeadStock) deadStockCount++;

    const whBreakdown = p.warehouses
      .map((w) => `${w.warehouse.nameAr}: ${Number(w.quantityOnHand)}`)
      .join(' | ');

    rows.push({
      sku: p.sku,
      nameAr: p.nameAr,
      categoryName: p.category.nameAr,
      totalQuantity: totalQty.toNumber(),
      wac: wac.toNumber(),
      totalValue: val.toNumber(),
      warehouses: whBreakdown,
      lastSaleDate: lastSaleDate ? lastSaleDate.toISOString().split('T')[0] : 'لا يوجد مبيعات',
      isDeadStock: isDeadStock ? 'راكد (90+ يوم)' : 'نشط',
    });
  }

  if (isExport) {
    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet('تقييم_المخزون', {
      views: [{ rightToLeft: true }],
    });

    ws.columns = [
      { header: 'كود الصنف SKU', key: 'sku', width: 20 },
      { header: 'اسم الصنف', key: 'nameAr', width: 30 },
      { header: 'الفئة', key: 'categoryName', width: 20 },
      { header: 'الكمية الإجمالية', key: 'totalQuantity', width: 16 },
      { header: 'متوسط التكلفة WAC (ج.م)', key: 'wac', width: 22 },
      { header: 'القيمة الإجمالية (ج.م)', key: 'totalValue', width: 22 },
      { header: 'توزيع المخازن', key: 'warehouses', width: 35 },
      { header: 'تاريخ آخر بيع', key: 'lastSaleDate', width: 16 },
      { header: 'حالة الركود', key: 'isDeadStock', width: 16 },
    ];

    ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    ws.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF065F46' }, // Forest green
    };

    rows.forEach((r) => ws.addRow(r));

    const buffer = await workbook.xlsx.writeBuffer();
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="inventory-valuation-${Date.now()}.xlsx"`,
      },
    });
  }

  return NextResponse.json({
    success: true,
    summary: {
      totalProducts: products.length,
      totalUnits: totalUnits.toNumber(),
      totalValuationEGP: totalValuation.toNumber(),
      deadStockCount,
    },
    rows,
  });
}
