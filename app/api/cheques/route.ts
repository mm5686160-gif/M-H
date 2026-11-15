import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import Decimal from 'decimal.js';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const direction = searchParams.get('direction'); // 'ALL' | 'RECEIVED' | 'ISSUED'
    const status = searchParams.get('status');
    const dueSoon = searchParams.get('dueSoon') === 'true';
    const q = searchParams.get('q');

    const where: any = {};

    if (direction && direction !== 'ALL') {
      where.direction = direction;
    }

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (q) {
      where.OR = [
        { chequeNumber: { contains: q, mode: 'insensitive' } },
        { bankName: { contains: q, mode: 'insensitive' } },
        { accountHolderName: { contains: q, mode: 'insensitive' } },
        { relatedEntityName: { contains: q, mode: 'insensitive' } },
      ];
    }

    // Due in next 7 days filter
    const now = new Date();
    const next7Days = new Date();
    next7Days.setDate(next7Days.getDate() + 7);

    if (dueSoon) {
      where.dueDate = {
        gte: now,
        lte: next7Days,
      };
      where.status = { in: ['PENDING', 'DEPOSITED'] };
    }

    const cheques = await prisma.cheque.findMany({
      where,
      orderBy: { dueDate: 'asc' },
    });

    const data = cheques.map((c) => ({
      ...c,
      amount: Number(c.amount),
      isDueSoon: c.status !== 'CLEARED' && c.status !== 'RETURNED' && new Date(c.dueDate) <= next7Days && new Date(c.dueDate) >= now,
      isOverdue: c.status !== 'CLEARED' && c.status !== 'RETURNED' && new Date(c.dueDate) < now,
    }));

    // Summary KPIs
    const totalPendingAmount = data
      .filter((c) => c.status === 'PENDING')
      .reduce((sum, c) => sum + c.amount, 0);

    const totalDepositedAmount = data
      .filter((c) => c.status === 'DEPOSITED')
      .reduce((sum, c) => sum + c.amount, 0);

    const totalClearedAmount = data
      .filter((c) => c.status === 'CLEARED')
      .reduce((sum, c) => sum + c.amount, 0);

    const bouncedCount = data.filter((c) => c.status === 'BOUNCED').length;
    const dueSoonCount = data.filter((c) => c.isDueSoon || c.isOverdue).length;

    return NextResponse.json({
      success: true,
      kpis: {
        totalPendingAmount,
        totalDepositedAmount,
        totalClearedAmount,
        bouncedCount,
        dueSoonCount,
      },
      data,
    });
  } catch (error: any) {
    console.error('Error fetching cheques:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch cheques' },
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

    const body = await req.json();
    const {
      chequeNumber,
      bankName,
      accountHolderName,
      amount,
      issueDate,
      dueDate,
      direction, // 'RECEIVED' | 'ISSUED'
      relatedEntityType, // 'CUSTOMER' | 'SUPPLIER'
      relatedEntityId,
      relatedEntityName,
      notes,
    } = body;

    if (!chequeNumber || !bankName || !amount || !dueDate || !direction) {
      return NextResponse.json(
        { error: 'Cheque number, bank name, amount, due date, and direction are required' },
        { status: 400 }
      );
    }

    const chequeAmount = new Decimal(amount);

    const cheque = await prisma.cheque.create({
      data: {
        chequeNumber,
        bankName,
        accountHolderName: accountHolderName || relatedEntityName || 'N/A',
        amount: chequeAmount,
        issueDate: issueDate ? new Date(issueDate) : new Date(),
        dueDate: new Date(dueDate),
        direction,
        status: 'PENDING',
        relatedEntityType: relatedEntityType || null,
        relatedEntityId: relatedEntityId || null,
        relatedEntityName: relatedEntityName || null,
        notes: notes || null,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userName: session.user.name || 'User',
        action: 'CREATE',
        entityType: 'CHEQUE',
        entityId: cheque.id,
        afterData: {
          chequeNumber,
          bankName,
          amount: chequeAmount.toNumber(),
          direction,
        },
      },
    });

    return NextResponse.json({ success: true, data: cheque }, { status: 201 });
  } catch (error: any) {
    console.error('Error recording cheque:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to record cheque' },
      { status: 500 }
    );
  }
}
