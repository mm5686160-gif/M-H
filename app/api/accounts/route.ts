// app/api/accounts/route.ts – Full replace with complete CRUD
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const accounts = await prisma.financialAccount.findMany({
      where: { isActive: true },
      orderBy: [{ isDefault: 'desc' }, { nameAr: 'asc' }],
    });

    // Group totals by currency
    const totals: Record<string, number> = {};
    for (const acc of accounts) {
      const cur = acc.currency;
      totals[cur] = (totals[cur] ?? 0) + Number(acc.currentBalance);
    }

    const data = accounts.map((acc) => ({
      ...acc,
      currentBalance: Number(acc.currentBalance),
    }));

    return NextResponse.json({ success: true, data, totals });
  } catch (error: any) {
    console.error('Error fetching accounts:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch accounts' },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || !['ADMIN', 'ACCOUNTANT'].includes(session.user.role ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { nameAr, nameEn, accountType, currency, initialBalance, isDefault, notes } = body;

    if (!nameAr || !nameEn || !accountType) {
      return NextResponse.json({ error: 'nameAr, nameEn, and accountType are required' }, { status: 400 });
    }

    const account = await prisma.financialAccount.create({
      data: {
        nameAr,
        nameEn,
        accountType,
        currency: currency ?? 'EGP',
        currentBalance: initialBalance ?? 0,
        isDefault: isDefault ?? false,
        notes: notes ?? null,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id ?? null,
        userName: session.user.name ?? 'Unknown',
        action: 'CREATE',
        entityType: 'ACCOUNT',
        entityId: account.id,
        afterData: account as object,
      },
    });

    return NextResponse.json({ success: true, data: account }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating account:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create account' },
      { status: 500 },
    );
  }
}
