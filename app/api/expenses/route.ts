// app/api/expenses/route.ts – Expense management with account debit
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Decimal from 'decimal.js';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get('categoryId');
  const accountId = searchParams.get('accountId');
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const recurring = searchParams.get('recurring');
  const page = parseInt(searchParams.get('page') ?? '1');
  const limit = parseInt(searchParams.get('limit') ?? '50');
  const skip = (page - 1) * limit;

  const where: any = {};
  if (categoryId) where.categoryId = categoryId;
  if (accountId) where.financialAccountId = accountId;
  if (from || to) {
    where.expenseDate = {};
    if (from) where.expenseDate.gte = new Date(from);
    if (to) where.expenseDate.lte = new Date(to);
  }
  if (recurring === 'true') where.isRecurring = true;

  const [total, expenses] = await Promise.all([
    prisma.expense.count({ where }),
    prisma.expense.findMany({
      where,
      orderBy: { expenseDate: 'desc' },
      skip,
      take: limit,
      include: {
        category: { select: { id: true, nameAr: true, nameEn: true } },
        financialAccount: { select: { id: true, nameAr: true, nameEn: true, currency: true } },
      },
    }),
  ]);

  // Totals for filtered period
  const periodTotal = expenses.reduce(
    (sum, e) => sum.plus(new Decimal(e.amountEGP.toString())),
    new Decimal(0),
  );

  return NextResponse.json({
    success: true,
    data: expenses.map((e) => ({
      ...e,
      amount: Number(e.amount),
      amountEGP: Number(e.amountEGP),
      exchangeRate: Number(e.exchangeRate),
    })),
    meta: { total, page, limit, pages: Math.ceil(total / limit), periodTotalEGP: periodTotal.toNumber() },
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || !['ADMIN', 'ACCOUNTANT', 'MANAGER'].includes(session.user.role ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      categoryId,
      expenseDate,
      amount,
      currency = 'EGP',
      exchangeRate = 1,
      description,
      financialAccountId,
      receiptUrl,
      isRecurring = false,
      recurringFrequency,
      nextDueDate,
    } = body;

    if (!categoryId || !amount || !description || !financialAccountId) {
      return NextResponse.json(
        { error: 'categoryId, amount, description, and financialAccountId are required' },
        { status: 400 },
      );
    }

    const amountDec = new Decimal(amount);
    const rateDec = new Decimal(exchangeRate);
    const amountEGP = amountDec.mul(rateDec);
    const txDate = expenseDate ? new Date(expenseDate) : new Date();

    const expense = await prisma.$transaction(async (tx) => {
      // Debit the financial account
      const account = await tx.financialAccount.findUniqueOrThrow({
        where: { id: financialAccountId },
      });

      const prevBalance = new Decimal(account.currentBalance.toString());
      const newBalance = prevBalance.minus(amountEGP);

      await tx.financialAccount.update({
        where: { id: financialAccountId },
        data: { currentBalance: newBalance },
      });

      // Record ledger entry
      await tx.accountTransaction.create({
        data: {
          financialAccountId,
          transactionDate: txDate,
          transactionType: 'DEBIT',
          amount: amountEGP,
          balanceAfter: newBalance,
          description,
          relatedEntityType: 'EXPENSE',
        },
      });

      // Create expense record
      return tx.expense.create({
        data: {
          categoryId,
          expenseDate: txDate,
          amount: amountDec,
          currency,
          exchangeRate: rateDec,
          amountEGP,
          description,
          financialAccountId,
          receiptUrl: receiptUrl ?? null,
          isRecurring,
          recurringFrequency: isRecurring ? recurringFrequency : null,
          nextDueDate: isRecurring && nextDueDate ? new Date(nextDueDate) : null,
          createdByUserId: session.user.id ?? null,
          createdByName: session.user.name ?? null,
        },
        include: {
          category: { select: { id: true, nameAr: true, nameEn: true } },
          financialAccount: { select: { id: true, nameAr: true, nameEn: true } },
        },
      });
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id ?? null,
        userName: session.user.name ?? 'Unknown',
        action: 'CREATE',
        entityType: 'EXPENSE',
        entityId: expense.id,
        afterData: { amount: Number(amountDec), currency, description } as object,
      },
    });

    return NextResponse.json({ success: true, data: expense }, { status: 201 });
  } catch (error: any) {
    console.error('Expense creation error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
