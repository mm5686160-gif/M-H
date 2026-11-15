// app/api/reports/sales/route.ts
// Sales report with JSON preview and Excel export
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
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const customerId = searchParams.get('customerId');
  const isExport = searchParams.get('export') === 'excel';

  const where: any = {};
  if (from || to) {
    where.invoiceDate = {};
    if (from) where.invoiceDate.gte = new Date(from);
    if (to) where.invoiceDate.lte = new Date(to);
  }
  if (customerId) where.customerId = customerId;

  const invoices = await prisma.invoice.findMany({
    where,
    orderBy: { invoiceDate: 'desc' },
    include: {
      customer: { select: { nameAr: true, code: true, phone: true } },
      items: {
        include: {
          product: { select: { sku: true, nameAr: true } },
        },
      },
    },
  });

  let totalSales = new Decimal(0);
  let totalDiscounts = new Decimal(0);
  let totalTax = new Decimal(0);
  let totalGrossProfit = new Decimal(0);

  const flatRows: any[] = [];

  for (const inv of invoices) {
    totalSales = totalSales.plus(new Decimal(inv.grandTotal.toString()));
    totalDiscounts = totalDiscounts.plus(new Decimal(inv.discountTotal.toString()));
    totalTax = totalTax.plus(new Decimal(inv.taxTotal.toString()));

    for (const item of inv.items) {
      totalGrossProfit = totalGrossProfit.plus(new Decimal(item.grossProfit.toString()));
      flatRows.push({
        invoiceNumber: inv.invoiceNumber,
        invoiceDate: inv.invoiceDate.toISOString().split('T')[0],
        customerName: inv.customer.nameAr,
        customerCode: inv.customer.code,
        sku: item.product.sku,
        productName: item.product.nameAr,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        discountPct: Number(item.discountPct),
        lineTotal: Number(item.lineTotal),
        grossProfit: Number(item.grossProfit),
      });
    }
  }

  if (isExport) {
    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet('تقرير_المبيعات', {
      views: [{ rightToLeft: true }],
    });

    ws.columns = [
      { header: 'رقم الفاتورة', key: 'invoiceNumber', width: 18 },
      { header: 'التاريخ', key: 'invoiceDate', width: 14 },
      { header: 'العميل', key: 'customerName', width: 25 },
      { header: 'كود العميل', key: 'customerCode', width: 14 },
      { header: 'كود الصنف SKU', key: 'sku', width: 18 },
      { header: 'اسم الصنف', key: 'productName', width: 28 },
      { header: 'الكمية', key: 'quantity', width: 12 },
      { header: 'سعر الوحدة (ج.م)', key: 'unitPrice', width: 16 },
      { header: 'الخصم %', key: 'discountPct', width: 12 },
      { header: 'إجمالي السطر (ج.م)', key: 'lineTotal', width: 18 },
      { header: 'مجمل الربح (ج.م)', key: 'grossProfit', width: 16 },
    ];

    ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    ws.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E3A8A' },
    };

    flatRows.forEach((r) => ws.addRow(r));

    const buffer = await workbook.xlsx.writeBuffer();
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="sales-report-${Date.now()}.xlsx"`,
      },
    });
  }

  return NextResponse.json({
    success: true,
    summary: {
      totalInvoices: invoices.length,
      totalSales: totalSales.toNumber(),
      totalDiscounts: totalDiscounts.toNumber(),
      totalTax: totalTax.toNumber(),
      totalGrossProfit: totalGrossProfit.toNumber(),
    },
    rows: flatRows,
  });
}
