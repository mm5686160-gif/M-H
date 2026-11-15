// app/api/expenses/categories/route.ts – Expense categories CRUD
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const categories = await prisma.expenseCategory.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    include: { _count: { select: { expenses: true } } },
  });

  return NextResponse.json({ success: true, data: categories });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || !['ADMIN', 'ACCOUNTANT'].includes(session.user.role ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const { nameAr, nameEn, sortOrder } = body;

  if (!nameAr || !nameEn) {
    return NextResponse.json({ error: 'nameAr and nameEn are required' }, { status: 400 });
  }

  const category = await prisma.expenseCategory.create({
    data: { nameAr, nameEn, sortOrder: sortOrder ?? 0 },
  });

  return NextResponse.json({ success: true, data: category }, { status: 201 });
}
