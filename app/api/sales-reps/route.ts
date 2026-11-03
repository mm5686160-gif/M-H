import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const salesReps = await prisma.salesRep.findMany({
      where: { isActive: true },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { user: { name: 'asc' } },
    });

    const data = salesReps.map((sr) => ({
      id: sr.id,
      name: sr.user.name,
      email: sr.user.email,
      commissionRatePct: Number(sr.commissionRatePct),
      notes: sr.notes,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error fetching sales reps:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch sales reps' },
      { status: 500 }
    );
  }
}
