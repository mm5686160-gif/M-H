import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { canManagePurchases, calculateExchangeGainLoss } from '@/lib/utils';
import Decimal from 'decimal.js';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const supplierId = searchParams.get('supplierId');
    const poId = searchParams.get('poId');

    const where: any = {};
    if (supplierId) where.supplierId = supplierId;
    if (poId) where.poId = poId;

    const payments = await prisma.supplierPayment.findMany({
      where,
      include: {
        supplier: { select: { id: true, nameAr: true, nameEn: true } },
        purchaseOrder: { select: { id: true, poNumber: true, exchangeRate: true } },
        account: { select: { id: true, nameAr: true, nameEn: true, accountType: true } },
      },
      orderBy: { paymentDate: 'desc' },
    });

    const data = payments.map((p) => ({
      ...p,
      amount: Number(p.amount),
      exchangeRate: Number(p.exchangeRate),
      amountEGP: Number(p.amountEGP),
      exchangeGainLoss: Number(p.exchangeGainLoss),
      purchaseOrder: p.purchaseOrder
        ? {
            ...p.purchaseOrder,
            exchangeRate: Number(p.purchaseOrder.exchangeRate),
          }
        : null,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error fetching supplier payments:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch payments' },
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

    if (!canManagePurchases(session.user.role)) {
      return NextResponse.json(
        { error: 'You do not have permission to record supplier payments' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      supplierId,
      poId,
      paymentDate,
      amount,
      currency,
      exchangeRate,
      paymentMethod,
      accountId,
      chequeId,
      reference,
      notes,
    } = body;

    if (!supplierId || !amount || !currency || !exchangeRate || !paymentMethod || !accountId) {
      return NextResponse.json(
        { error: 'Supplier, amount, currency, exchange rate, payment method, and account are required' },
        { status: 400 }
      );
    }

    const payAmount = new Decimal(amount);
    const payRate = new Decimal(exchangeRate);
    const amountEGP = payAmount.times(payRate);

    // Calculate FX gain/loss if linked to a PO
    let exchangeGainLoss = new Decimal(0);
    if (poId) {
      const po = await prisma.purchaseOrder.findUnique({ where: { id: poId } });
      if (po) {
        exchangeGainLoss = calculateExchangeGainLoss(po.exchangeRate, payRate, payAmount);
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Supplier Payment
      const payment = await tx.supplierPayment.create({
        data: {
          supplierId,
          poId: poId || null,
          paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
          amount: payAmount,
          currency,
          exchangeRate: payRate,
          amountEGP,
          paymentMethod,
          accountId,
          chequeId: chequeId || null,
          exchangeGainLoss,
          reference: reference || null,
          notes: notes || null,
        },
      });

      // 2. Decrement supplier balance in EGP
      await tx.supplier.update({
        where: { id: supplierId },
        data: {
          currentBalance: { decrement: amountEGP },
        },
      });

      // 3. Decrement FinancialAccount balance and record transaction
      const account = await tx.financialAccount.findUnique({ where: { id: accountId } });
      if (account) {
        const newBalance = account.currentBalance.minus(amountEGP);
        await tx.financialAccount.update({
          where: { id: accountId },
          data: { currentBalance: newBalance },
        });

        await tx.accountTransaction.create({
          data: {
            financialAccountId: accountId,
            transactionDate: paymentDate ? new Date(paymentDate) : new Date(),
            transactionType: 'DEBIT',
            amount: amountEGP,
            balanceAfter: newBalance,
            reference: reference || `سداد مورد ${payment.id}`,
            description: `سداد للمورد (${payAmount} ${currency} @ ${payRate})`,
            relatedEntityType: 'SUPPLIER',
            relatedEntityId: supplierId,
          },
        });
      }

      // 4. Audit Log
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          userName: session.user.name || 'User',
          action: 'CREATE',
          entityType: 'PAYMENT',
          entityId: payment.id,
          afterData: {
            supplierId,
            amountForeign: payAmount.toNumber(),
            currency,
            amountEGP: amountEGP.toNumber(),
            exchangeGainLoss: exchangeGainLoss.toNumber(),
          },
        },
      });

      return payment;
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating supplier payment:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create payment' },
      { status: 500 }
    );
  }
}
