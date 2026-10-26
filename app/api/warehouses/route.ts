import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const warehouses = await prisma.warehouse.findMany({
      where: { isActive: true },
      orderBy: { nameAr: 'asc' },
    });
    return NextResponse.json({ success: true, data: warehouses });
  } catch (error: any) {
    console.error('Error fetching warehouses:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch warehouses' },
      { status: 500 }
    );
  }
}
