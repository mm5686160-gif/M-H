import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import Decimal from 'decimal.js';

export const dynamic = 'force-dynamic';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { status, accountId, notes } = body; // status: 'DEPOSITED' | 'CLEARED' | 'BOUNCED' | 'RETURNED'

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    const cheque = await prisma.cheque.findUnique({
      where: { id: params.id },
    });
    if (!cheque) {
      return NextResponse.json({ error: 'Cheque not found' }, { status: 404 });
    }

    const now = new Date();
    const updateData: any = { status };
    if (notes) updateData.notes = notes;

    if (status === 'DEPOSITED') {
      updateData.depositedDate = now;
    } else if (status === 'CLEARED') {
      updateData.clearedDate = now;
    } else if (status === 'BOUNCED') {
      updateData.bouncedDate = now;
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update Cheque Status
      const updatedCheque = await tx.cheque.update({
        where: { id: cheque.id },
        data: updateData,
      });

      // 2. If CLEARED and accountId provided, update Bank Account
      if (status === 'CLEARED' && accountId) {
        const chequeAmount = new Decimal(cheque.amount.toString());

        if (cheque.direction === 'RECEIVED') {
          // Increment bank balance
          await tx.financialAccount.update({
            where: { id: accountId },
            data: { currentBalance: { increment: chequeAmount } },
          });

          await tx.accountTransaction.create({
            data: {
              financialAccountId: accountId,
              transactionDate: now,
              transactionType: 'CREDIT',
              amount: chequeAmount,
              balanceAfter: new Decimal(0),
              reference: `تحصيل شيك ${cheque.chequeNumber}`,
              description: `تحصيل شيك بنكي رقم ${cheque.chequeNumber} مسحوب على بنك ${cheque.bankName} لصالح العميل/المؤسسة`,
              relatedEntityType: cheque.relatedEntityType,
              relatedEntityId: cheque.relatedEntityId,
            },
          });
        } else if (cheque.direction === 'ISSUED') {
          // Decrement bank balance
          await tx.financialAccount.update({
            where: { id: accountId },
            data: { currentBalance: { decrement: chequeAmount } },
          });

          await tx.accountTransaction.create({
            data: {
              financialAccountId: accountId,
              transactionDate: now,
              transactionType: 'DEBIT',
              amount: chequeAmount,
              balanceAfter: new Decimal(0),
              reference: `صرف شيك ${cheque.chequeNumber}`,
              description: `صرف شيك مسحوب على بنك ${cheque.bankName} رقم ${cheque.chequeNumber}`,
              relatedEntityType: cheque.relatedEntityType,
              relatedEntityId: cheque.relatedEntityId,
            },
          });
        }
      }

      // 3. Audit Log
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          userName: session.user.name || 'User',
          action: 'UPDATE',
          entityType: 'CHEQUE',
          entityId: cheque.id,
          afterData: {
            chequeNumber: cheque.chequeNumber,
            oldStatus: cheque.status,
            newStatus: status,
          },
        },
      });

      return updatedCheque;
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Error updating cheque status:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update cheque status' },
      { status: 500 }
    );
  }
}
