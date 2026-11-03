import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { canManagePurchases } from '@/lib/utils';
import Decimal from 'decimal.js';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q')?.trim() || '';

    const where: any = { isActive: true };
    if (query) {
      where.OR = [
        { code: { contains: query, mode: 'insensitive' } },
        { nameAr: { contains: query, mode: 'insensitive' } },
        { nameEn: { contains: query, mode: 'insensitive' } },
        { country: { contains: query, mode: 'insensitive' } },
        { contactName: { contains: query, mode: 'insensitive' } },
      ];
    }

    const suppliers = await prisma.supplier.findMany({
      where,
      include: {
        _count: {
          select: { purchaseOrders: true, payments: true },
        },
      },
      orderBy: { nameAr: 'asc' },
    });

    const data = suppliers.map((s) => ({
      ...s,
      currentBalance: Number(s.currentBalance),
    }));

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error fetching suppliers:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch suppliers' },
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
        { error: 'You do not have permission to create suppliers' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      code,
      nameAr,
      nameEn,
      country,
      defaultCurrency,
      paymentTermsDays,
      contactName,
      phone,
      email,
      address,
      taxNumber,
      notes,
    } = body;

    if (!code || !nameAr || !nameEn || !country) {
      return NextResponse.json(
        { error: 'Code, Arabic Name, English Name, and Country are required' },
        { status: 400 }
      );
    }

    // Check duplicate code
    const existing = await prisma.supplier.findUnique({ where: { code } });
    if (existing) {
      return NextResponse.json(
        { error: 'كود المورد مسجل مسبقاً' },
        { status: 409 }
      );
    }

    const supplier = await prisma.supplier.create({
      data: {
        code,
        nameAr,
        nameEn,
        country,
        defaultCurrency: defaultCurrency || 'USD',
        paymentTermsDays: paymentTermsDays ? parseInt(paymentTermsDays) : 30,
        contactName: contactName || null,
        phone: phone || null,
        email: email || null,
        address: address || null,
        taxNumber: taxNumber || null,
        notes: notes || null,
        currentBalance: new Decimal(0),
      },
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userName: session.user.name || 'User',
        action: 'CREATE',
        entityType: 'SUPPLIER',
        entityId: supplier.id,
        afterData: { code, nameAr, country },
      },
    });

    return NextResponse.json({ success: true, data: supplier }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating supplier:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create supplier' },
      { status: 500 }
    );
  }
}
