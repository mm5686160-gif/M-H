import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import Decimal from 'decimal.js';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      amount,
      paymentMethod,
      accountId,
      chequeDetails,
      paymentDate,
      reference,
      notes,
    } = body;

    if (!amount || !paymentMethod || !accountId) {
      return NextResponse.json(
        { error: 'Amount, payment method, and account are required' },
        { status: 400 }
      );
    }

    const payAmount = new Decimal(amount);
    if (payAmount.lessThanOrEqualTo(0)) {
      return NextResponse.json(
        { error: 'Amount must be greater than zero' },
        { status: 400 }
      );
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: { customer: true },
    });
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const currentBalanceDue = new Decimal(invoice.balanceDue.toString());
    const currentPaid = new Decimal(invoice.paidAmount.toString());

    if (payAmount.greaterThan(currentBalanceDue)) {
      return NextResponse.json(
        { error: `Payment amount (${payAmount}) exceeds invoice balance due (${currentBalanceDue})` },
        { status: 400 }
      );
    }

    const newBalanceDue = currentBalanceDue.minus(payAmount);
    const newPaidAmount = currentPaid.plus(payAmount);
    const newStatus = newBalanceDue.isZero() ? 'PAID' : 'PARTIALLY_PAID';

    const result = await prisma.$transaction(async (tx) => {
      let chequeId: string | null = null;

      // 1. If cheque, record Cheque
      if (paymentMethod === 'CHEQUE' && chequeDetails) {
        const cheque = await tx.cheque.create({
          data: {
            chequeNumber: chequeDetails.chequeNumber,
            bankName: chequeDetails.bankName,
            accountHolderName: chequeDetails.accountHolderName || invoice.customer.nameAr,
            amount: payAmount,
            issueDate: new Date(),
            dueDate: chequeDetails.dueDate ? new Date(chequeDetails.dueDate) : new Date(),
            direction: 'RECEIVED',
            status: 'PENDING',
            relatedEntityType: 'CUSTOMER',
            relatedEntityId: invoice.customerId,
            relatedEntityName: invoice.customer.nameAr,
            notes: `سداد فاتورة ${invoice.invoiceNumber}`,
          },
        });
        chequeId = cheque.id;
      }

      // 2. Create CustomerPayment
      const payment = await tx.customerPayment.create({
        data: {
          invoiceId: invoice.id,
          customerId: invoice.customerId,
          paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
          amount: payAmount,
          paymentMethod,
          accountId,
          chequeId,
          reference: reference || `سداد فاتورة ${invoice.invoiceNumber}`,
          notes: notes || null,
        },
      });

      // 3. Update Invoice
      await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          paidAmount: newPaidAmount,
          balanceDue: newBalanceDue,
          status: newStatus,
        },
      });

      // 4. Decrement Customer current balance
      await tx.customer.update({
        where: { id: invoice.customerId },
        data: {
          currentBalanceEGP: { decrement: payAmount },
        },
      });

      // 5. Increment Financial Account balance (if not Cheque)
      if (paymentMethod !== 'CHEQUE') {
        await tx.financialAccount.update({
          where: { id: accountId },
          data: {
            currentBalance: { increment: payAmount },
          },
        });

        await tx.accountTransaction.create({
          data: {
            financialAccountId: accountId,
            transactionDate: paymentDate ? new Date(paymentDate) : new Date(),
            transactionType: 'CREDIT',
            amount: payAmount,
            balanceAfter: new Decimal(0),
            reference: invoice.invoiceNumber,
            description: `تحصيل من العميل ${invoice.customer.nameAr} لفاتورة ${invoice.invoiceNumber}`,
            relatedEntityType: 'CUSTOMER',
            relatedEntityId: invoice.customerId,
          },
        });
      }

      // 6. Audit Log
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          userName: session.user.name || 'User',
          action: 'CREATE',
          entityType: 'PAYMENT',
          entityId: payment.id,
          afterData: {
            invoiceId: invoice.id,
            customerId: invoice.customerId,
            amount: payAmount.toNumber(),
            paymentMethod,
            newBalanceDue: newBalanceDue.toNumber(),
          },
        },
      });

      return payment;
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error: any) {
    console.error('Error recording invoice payment:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to record payment' },
      { status: 500 }
    );
  }
}
