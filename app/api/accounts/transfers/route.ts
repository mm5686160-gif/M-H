// app/api/accounts/transfers/route.ts – Inter-account transfers
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Decimal from 'decimal.js';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const transfers = await prisma.accountTransfer.findMany({
    orderBy: { transferDate: 'desc' },
    take: 100,
    include: {
      fromAccount: { select: { id: true, nameAr: true, nameEn: true, currency: true } },
      toAccount: { select: { id: true, nameAr: true, nameEn: true, currency: true } },
    },
  });

  return NextResponse.json({
    success: true,
    data: transfers.map((t) => ({
      ...t,
      amount: Number(t.amount),
      exchangeRate: Number(t.exchangeRate),
      fee: Number(t.fee),
    })),
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || !['ADMIN', 'ACCOUNTANT'].includes(session.user.role ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      fromAccountId,
      toAccountId,
      amount,
      exchangeRate = 1,
      fee = 0,
      reference,
      notes,
      transferDate,
    } = body;

    if (!fromAccountId || !toAccountId || !amount) {
      return NextResponse.json({ error: 'fromAccountId, toAccountId, and amount are required' }, { status: 400 });
    }

    if (fromAccountId === toAccountId) {
      return NextResponse.json({ error: 'Cannot transfer to the same account' }, { status: 400 });
    }

    const amountDec = new Decimal(amount);
    const rateDec = new Decimal(exchangeRate);
    const feeDec = new Decimal(fee);
    const convertedAmount = amountDec.mul(rateDec);

    const result = await prisma.$transaction(async (tx) => {
      // Fetch accounts
      const [fromAcc, toAcc] = await Promise.all([
        tx.financialAccount.findUniqueOrThrow({ where: { id: fromAccountId } }),
        tx.financialAccount.findUniqueOrThrow({ where: { id: toAccountId } }),
      ]);

      const fromBalance = new Decimal(fromAcc.currentBalance.toString());
      const totalDebit = amountDec.plus(feeDec);

      if (fromBalance.lessThan(totalDebit)) {
        throw new Error('Insufficient balance in source account');
      }

      const newFromBalance = fromBalance.minus(totalDebit);
      const newToBalance = new Decimal(toAcc.currentBalance.toString()).plus(convertedAmount);

      // Update balances
      await Promise.all([
        tx.financialAccount.update({
          where: { id: fromAccountId },
          data: { currentBalance: newFromBalance },
        }),
        tx.financialAccount.update({
          where: { id: toAccountId },
          data: { currentBalance: newToBalance },
        }),
      ]);

      const txDate = transferDate ? new Date(transferDate) : new Date();

      // Record transactions
      await Promise.all([
        tx.accountTransaction.create({
          data: {
            financialAccountId: fromAccountId,
            transactionDate: txDate,
            transactionType: 'DEBIT',
            amount: totalDebit,
            balanceAfter: newFromBalance,
            reference: reference ?? null,
            description: `تحويل إلى ${toAcc.nameAr}`,
            relatedEntityType: 'TRANSFER',
          },
        }),
        tx.accountTransaction.create({
          data: {
            financialAccountId: toAccountId,
            transactionDate: txDate,
            transactionType: 'CREDIT',
            amount: convertedAmount,
            balanceAfter: newToBalance,
            reference: reference ?? null,
            description: `تحويل من ${fromAcc.nameAr}`,
            relatedEntityType: 'TRANSFER',
          },
        }),
      ]);

      // Save transfer record
      const transfer = await tx.accountTransfer.create({
        data: {
          fromAccountId,
          toAccountId,
          transferDate: txDate,
          amount: amountDec,
          fromCurrency: fromAcc.currency,
          toCurrency: toAcc.currency,
          exchangeRate: rateDec,
          fee: feeDec,
          reference: reference ?? null,
          notes: notes ?? null,
        },
      });

      return transfer;
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error: any) {
    console.error('Transfer error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
