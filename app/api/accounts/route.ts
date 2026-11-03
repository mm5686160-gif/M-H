import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const accounts = await prisma.financialAccount.findMany({
      where: { isActive: true },
      orderBy: [{ isDefault: 'desc' }, { nameAr: 'asc' }],
    });

    const data = accounts.map((acc) => ({
      ...acc,
      currentBalance: Number(acc.currentBalance),
    }));

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error fetching accounts:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch accounts' },
      { status: 500 }
    );
  }
}
