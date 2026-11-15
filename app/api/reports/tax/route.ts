// app/api/reports/tax/route.ts
// Egyptian Tax Authority (ETA) 14% VAT return report with Excel export
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
  const isExport = searchParams.get('export') === 'excel';

  const dateFilter: any = {};
  if (from || to) {
    if (from) dateFilter.gte = new Date(from);
    if (to) dateFilter.lte = new Date(to);
  }

  // 1. Sales (Output VAT)
  const invoices = await prisma.invoice.findMany({
    where: {
      status: { notIn: ['DRAFT', 'CANCELLED'] },
      ...(Object.keys(dateFilter).length > 0 && { invoiceDate: dateFilter }),
    },
    include: { customer: { select: { nameAr: true, taxNumber: true } } },
    orderBy: { invoiceDate: 'desc' },
  });

  let totalSalesNet = new Decimal(0);
  let totalOutputVAT = new Decimal(0);

  const salesRows = invoices.map((inv) => {
    const subtotal = new Decimal(inv.subtotal.toString());
    const discount = new Decimal(inv.discountTotal.toString());
    const taxableBase = subtotal.minus(discount);
    const vat = new Decimal(inv.taxTotal.toString());

    totalSalesNet = totalSalesNet.plus(taxableBase);
    totalOutputVAT = totalOutputVAT.plus(vat);

    return {
      type: 'مبيعات',
      docNumber: inv.invoiceNumber,
      date: inv.invoiceDate.toISOString().split('T')[0],
      partyName: inv.customer.nameAr,
      taxNumber: inv.customer.taxNumber ?? 'غير مسجل',
      taxableBase: taxableBase.toNumber(),
      vatRate: Number(inv.taxPct),
      vatAmount: vat.toNumber(),
      grandTotal: Number(inv.grandTotal),
    };
  });

  // 2. Purchases (Input VAT)
  const purchaseOrders = await prisma.purchaseOrder.findMany({
    where: {
      status: 'RECEIVED',
      ...(Object.keys(dateFilter).length > 0 && { orderDate: dateFilter }),
    },
    include: { supplier: { select: { nameAr: true, taxNumber: true } } },
    orderBy: { orderDate: 'desc' },
  });

  let totalPurchasesNet = new Decimal(0);
  let totalInputVAT = new Decimal(0);

  const purchaseRows = purchaseOrders.map((po) => {
    // Standard 14% Egyptian VAT for local purchase receipts
    const net = new Decimal(po.subtotalEGP.toString());
    const vat = net.mul(0.14);

    totalPurchasesNet = totalPurchasesNet.plus(net);
    totalInputVAT = totalInputVAT.plus(vat);

    return {
      type: 'مشتريات',
      docNumber: po.poNumber,
      date: po.orderDate.toISOString().split('T')[0],
      partyName: po.supplier.nameAr,
      taxNumber: po.supplier.taxNumber ?? 'غير مسجل',
      taxableBase: net.toNumber(),
      vatRate: 14,
      vatAmount: vat.toNumber(),
      grandTotal: net.plus(vat).toNumber(),
    };
  });

  // Net VAT payable to ETA: Output VAT - Input VAT
  const netVATPayable = totalOutputVAT.minus(totalInputVAT);

  if (isExport) {
    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet('إقرار_ضريبة_القيمة_المضافة', {
      views: [{ rightToLeft: true }],
    });

    ws.columns = [
      { header: 'النوع', key: 'type', width: 12 },
      { header: 'رقم المستند', key: 'docNumber', width: 18 },
      { header: 'التاريخ', key: 'date', width: 14 },
      { header: 'الجهة / الطرف الآخر', key: 'partyName', width: 25 },
      { header: 'التسجيل الضريبي', key: 'taxNumber', width: 18 },
      { header: 'الوعاء الخاضع للضريبة (ج.م)', key: 'taxableBase', width: 24 },
      { header: 'نسبة الضريبة %', key: 'vatRate', width: 14 },
      { header: 'ضريبة القيمة المضافة (ج.م)', key: 'vatAmount', width: 22 },
      { header: 'الإجمالي شاملاً الضريبة (ج.م)', key: 'grandTotal', width: 24 },
    ];

    ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    ws.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF991B1B' }, // Red
    };

    [...salesRows, ...purchaseRows].forEach((r) => ws.addRow(r));

    const buffer = await workbook.xlsx.writeBuffer();
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="vat-return-report-${Date.now()}.xlsx"`,
      },
    });
  }

  return NextResponse.json({
    success: true,
    summary: {
      totalSalesNet: totalSalesNet.toNumber(),
      totalOutputVAT: totalOutputVAT.toNumber(),
      totalPurchasesNet: totalPurchasesNet.toNumber(),
      totalInputVAT: totalInputVAT.toNumber(),
      netVATPayable: netVATPayable.toNumber(),
      vatRateDefault: 14,
    },
    sales: salesRows,
    purchases: purchaseRows,
  });
}
