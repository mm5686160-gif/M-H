// app/api/dashboard/route.ts
// Aggregated KPIs and chart data for the analytics dashboard
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Decimal from 'decimal.js';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const periodDays = parseInt(searchParams.get('days') ?? '30');

  const now = new Date();
  const periodStart = new Date(now);
  periodStart.setDate(now.getDate() - periodDays);

  const prevStart = new Date(periodStart);
  prevStart.setDate(prevStart.getDate() - periodDays);

  // ── Sales KPIs ─────────────────────────────────────────────────────────────
  const [currentInvoices, prevInvoices] = await Promise.all([
    prisma.invoice.findMany({
      where: { createdAt: { gte: periodStart } },
      select: {
        grandTotal: true,
        status: true,
        createdAt: true,
        items: {
          select: {
            lineTotal: true,
            costAtSale: true,
            grossProfit: true,
          },
        },
      },
    }),
    prisma.invoice.findMany({
      where: { createdAt: { gte: prevStart, lt: periodStart } },
      select: { grandTotal: true },
    }),
  ]);

  const currentRevenue = currentInvoices.reduce(
    (s, i) => s.plus(new Decimal(i.grandTotal.toString())),
    new Decimal(0),
  );

  let currentGP = new Decimal(0);
  for (const inv of currentInvoices) {
    for (const item of inv.items) {
      currentGP = currentGP.plus(new Decimal(item.grossProfit.toString()));
    }
  }

  const gpMargin = currentRevenue.isZero()
    ? 0
    : currentGP.div(currentRevenue).mul(100).toDecimalPlaces(1).toNumber();

  const prevRevenue = prevInvoices.reduce(
    (s, i) => s.plus(new Decimal(i.grandTotal.toString())),
    new Decimal(0),
  );
  const revenueTrend = prevRevenue.isZero()
    ? null
    : currentRevenue.minus(prevRevenue).div(prevRevenue).mul(100).toDecimalPlaces(1).toNumber();

  // ── Unpaid / overdue receivables ────────────────────────────────────────────
  const unpaidInvoices = await prisma.invoice.findMany({
    where: { status: { in: ['ISSUED', 'PARTIALLY_PAID', 'OVERDUE'] } },
    select: { balanceDue: true, dueDate: true },
  });

  const totalReceivables = unpaidInvoices.reduce(
    (s, i) => s.plus(new Decimal(i.balanceDue.toString())),
    new Decimal(0),
  );
  const overdueReceivables = unpaidInvoices
    .filter((i) => i.dueDate && i.dueDate < now)
    .reduce(
      (s, i) => s.plus(new Decimal(i.balanceDue.toString())),
      new Decimal(0),
    );

  // ── Expenses in period ──────────────────────────────────────────────────────
  const expenses = await prisma.expense.findMany({
    where: { expenseDate: { gte: periodStart } },
    select: { amountEGP: true, categoryId: true, category: { select: { nameAr: true } } },
  });

  const totalExpenses = expenses.reduce(
    (s, e) => s.plus(new Decimal(e.amountEGP.toString())),
    new Decimal(0),
  );

  // Expenses by category
  const expenseByCategory: Record<string, number> = {};
  for (const e of expenses) {
    const name = e.category?.nameAr ?? 'أخرى';
    expenseByCategory[name] = (expenseByCategory[name] ?? 0) + Number(e.amountEGP);
  }

  const netProfit = currentGP.minus(totalExpenses);

  // ── Financial accounts totals ───────────────────────────────────────────────
  const accounts = await prisma.financialAccount.findMany({
    where: { isActive: true },
    select: { accountType: true, currency: true, currentBalance: true },
  });

  const cashBalance = accounts
    .filter((a) => a.accountType === 'CASH' && a.currency === 'EGP')
    .reduce((s, a) => s.plus(new Decimal(a.currentBalance.toString())), new Decimal(0));

  const bankBalance = accounts
    .filter((a) => a.accountType === 'BANK' && a.currency === 'EGP')
    .reduce((s, a) => s.plus(new Decimal(a.currentBalance.toString())), new Decimal(0));

  // ── Pending cheques ─────────────────────────────────────────────────────────
  const sevenDaysOut = new Date(now);
  sevenDaysOut.setDate(now.getDate() + 7);

  const [pendingCheques, dueSoonCheques] = await Promise.all([
    prisma.cheque.count({ where: { status: 'PENDING' } }),
    prisma.cheque.count({
      where: { status: 'PENDING', dueDate: { gte: now, lte: sevenDaysOut } },
    }),
  ]);

  // ── Daily sales trend (last 30 days) ───────────────────────────────────────
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 29);

  const dailyInvoices = await prisma.invoice.findMany({
    where: { createdAt: { gte: thirtyDaysAgo } },
    select: {
      grandTotal: true,
      createdAt: true,
      items: { select: { grossProfit: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  // Build day-by-day map
  const dayMap: Record<string, { revenue: number; gp: number }> = {};
  for (let i = 0; i < 30; i++) {
    const d = new Date(thirtyDaysAgo);
    d.setDate(thirtyDaysAgo.getDate() + i);
    const key = d.toISOString().split('T')[0];
    dayMap[key] = { revenue: 0, gp: 0 };
  }

  for (const inv of dailyInvoices) {
    const key = inv.createdAt.toISOString().split('T')[0];
    if (dayMap[key]) {
      const rev = Number(inv.grandTotal);
      const gp = inv.items.reduce((sum, item) => sum + Number(item.grossProfit), 0);
      dayMap[key].revenue += rev;
      dayMap[key].gp += gp;
    }
  }

  const salesTrend = Object.entries(dayMap).map(([date, v]) => ({ date, ...v }));

  // ── Top products by revenue ─────────────────────────────────────────────────
  const topProductsRaw = await prisma.invoiceItem.groupBy({
    by: ['productId'],
    where: { invoice: { createdAt: { gte: periodStart } } },
    _sum: { lineTotal: true, quantity: true },
    orderBy: { _sum: { lineTotal: 'desc' } },
    take: 5,
  });

  const productIds = topProductsRaw.map((p) => p.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, nameAr: true, sku: true },
  });
  const productMap = Object.fromEntries(products.map((p) => [p.id, p]));

  const topProducts = topProductsRaw.map((p) => ({
    productId: p.productId,
    nameAr: productMap[p.productId]?.nameAr ?? 'غير معروف',
    sku: productMap[p.productId]?.sku ?? '',
    revenue: Number(p._sum.lineTotal ?? 0),
    qty: Number(p._sum.quantity ?? 0),
  }));

  // ── Low stock alert ─────────────────────────────────────────────────────────
  const lowStockProducts = await prisma.product.findMany({
    where: {
      isActive: true,
      minStockLevel: { gt: 0 },
    },
    select: {
      id: true,
      minStockLevel: true,
      warehouses: { select: { quantityOnHand: true } },
    },
  });

  let lowStockAlert = 0;
  for (const p of lowStockProducts) {
    const totalStock = p.warehouses.reduce(
      (sum, w) => sum.plus(new Decimal(w.quantityOnHand.toString())),
      new Decimal(0),
    );
    if (totalStock.lessThanOrEqualTo(new Decimal(p.minStockLevel.toString()))) {
      lowStockAlert++;
    }
  }

  // ── Response ───────────────────────────────────────────────────────────────
  return NextResponse.json({
    success: true,
    period: { days: periodDays, from: periodStart, to: now },
    kpis: {
      revenue: currentRevenue.toNumber(),
      revenueTrend,
      grossProfit: currentGP.toNumber(),
      gpMargin,
      netProfit: netProfit.toNumber(),
      totalExpenses: totalExpenses.toNumber(),
      totalReceivables: totalReceivables.toNumber(),
      overdueReceivables: overdueReceivables.toNumber(),
      cashBalance: cashBalance.toNumber(),
      bankBalance: bankBalance.toNumber(),
      pendingCheques,
      dueSoonCheques,
      lowStockAlert,
      invoiceCount: currentInvoices.length,
    },
    charts: {
      salesTrend,
      expenseByCategory,
      topProducts,
    },
  });
}
