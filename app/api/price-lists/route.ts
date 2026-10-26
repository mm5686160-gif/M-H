import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const priceLists = await prisma.priceList.findMany({
      where: { isActive: true },
      include: {
        _count: { select: { productPrices: true, customers: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ success: true, data: priceLists });
  } catch (error: any) {
    console.error('Error fetching price lists:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch price lists' },
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
    const { nameAr, nameEn, type, isDefault } = body;

    if (!nameAr || !nameEn || !type) {
      return NextResponse.json(
        { error: 'nameAr, nameEn, and type are required' },
        { status: 400 }
      );
    }

    // If default, unset previous default
    if (isDefault) {
      await prisma.priceList.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const priceList = await prisma.priceList.create({
      data: {
        nameAr,
        nameEn,
        type,
        isDefault: !!isDefault,
      },
    });

    return NextResponse.json({ success: true, data: priceList }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating price list:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create price list' },
      { status: 500 }
    );
  }
}
