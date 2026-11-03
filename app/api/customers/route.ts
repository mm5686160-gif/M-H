import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { generateCode } from '@/lib/utils';
import Decimal from 'decimal.js';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q');
    const type = searchParams.get('type');
    const segment = searchParams.get('segment');
    const governorate = searchParams.get('governorate');
    const inactive60 = searchParams.get('inactive60') === 'true';
    const overdueOnly = searchParams.get('overdue') === 'true';

    const where: any = { isActive: true };

    if (type && type !== 'ALL') {
      where.customerType = type;
    }

    if (segment && segment !== 'ALL') {
      where.segment = segment;
    }

    if (governorate && governorate !== 'ALL') {
      where.governorate = governorate;
    }

    if (q) {
      where.OR = [
        { code: { contains: q, mode: 'insensitive' } },
        { nameAr: { contains: q, mode: 'insensitive' } },
        { nameEn: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q } },
        { whatsappNumber: { contains: q } },
        { area: { contains: q, mode: 'insensitive' } },
      ];
    }

    // Inactive 60+ days condition: lastPurchaseDate < (now - 60 days) or null
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    if (inactive60) {
      where.OR = [
        { lastPurchaseDate: { lt: sixtyDaysAgo } },
        { lastPurchaseDate: null },
      ];
    }

    const customers = await prisma.customer.findMany({
      where,
      include: {
        priceList: { select: { id: true, nameAr: true, nameEn: true, type: true } },
        salesRep: {
          select: {
            id: true,
            user: { select: { name: true } },
          },
        },
        invoices: {
          where: {
            balanceDue: { gt: 0 },
            status: { notIn: ['CANCELLED', 'DRAFT'] },
          },
          select: {
            id: true,
            invoiceNumber: true,
            dueDate: true,
            balanceDue: true,
          },
        },
      },
      orderBy: { nameAr: 'asc' },
    });

    const now = new Date();

    let data = customers.map((c) => {
      const balance = Number(c.currentBalanceEGP);
      const creditLimit = Number(c.creditLimitEGP);
      const isExceeded = creditLimit > 0 && balance > creditLimit;

      // Overdue invoices check
      const overdueInvoices = c.invoices.filter((inv) => new Date(inv.dueDate) < now);
      const overdueBalance = overdueInvoices.reduce((sum, inv) => sum + Number(inv.balanceDue), 0);
      const isOverdue = overdueBalance > 0;

      // Inactive check
      const isInactive = !c.lastPurchaseDate || new Date(c.lastPurchaseDate) < sixtyDaysAgo;

      return {
        id: c.id,
        code: c.code,
        nameAr: c.nameAr,
        nameEn: c.nameEn,
        customerType: c.customerType,
        governorate: c.governorate,
        area: c.area,
        address: c.address,
        phone: c.phone,
        whatsappNumber: c.whatsappNumber || c.phone,
        email: c.email,
        taxNumber: c.taxNumber,
        creditLimitEGP: creditLimit,
        creditDays: c.creditDays,
        currentBalanceEGP: balance,
        availableCreditEGP: Math.max(0, creditLimit - balance),
        segment: c.segment,
        tags: c.tags,
        notes: c.notes,
        lastPurchaseDate: c.lastPurchaseDate,
        priceList: c.priceList,
        salesRep: c.salesRep ? { id: c.salesRep.id, name: c.salesRep.user.name } : null,
        isExceeded,
        isOverdue,
        overdueBalance,
        isInactive,
      };
    });

    if (overdueOnly) {
      data = data.filter((c) => c.isOverdue);
    }

    // Summary KPIs
    const totalCustomers = data.length;
    const totalReceivables = data.reduce((acc, c) => acc + c.currentBalanceEGP, 0);
    const exceededCreditLimitCount = data.filter((c) => c.isExceeded).length;
    const inactiveCustomersCount = data.filter((c) => c.isInactive).length;
    const overdueCustomersCount = data.filter((c) => c.isOverdue).length;

    return NextResponse.json({
      success: true,
      kpis: {
        totalCustomers,
        totalReceivables,
        exceededCreditLimitCount,
        inactiveCustomersCount,
        overdueCustomersCount,
      },
      data,
    });
  } catch (error: any) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch customers' },
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
      nameAr,
      nameEn,
      customerType,
      governorate,
      area,
      address,
      phone,
      whatsappNumber,
      email,
      taxNumber,
      salesRepId,
      priceListId,
      creditLimitEGP,
      creditDays,
      openingBalanceEGP,
      segment,
      tags,
      notes,
    } = body;

    if (!nameAr || !phone) {
      return NextResponse.json(
        { error: 'Customer Arabic name and phone are required' },
        { status: 400 }
      );
    }

    // Auto-generate Customer code
    const lastCustomer = await prisma.customer.findFirst({
      orderBy: { code: 'desc' },
      select: { code: true },
    });
    const lastNum = lastCustomer?.code?.match(/\d+/)
      ? parseInt(lastCustomer.code.match(/\d+/)![0])
      : 0;
    const code = generateCode('CUST-', lastNum);

    const creditLimit = new Decimal(creditLimitEGP || 0);
    const openingBalance = new Decimal(openingBalanceEGP || 0);

    const customer = await prisma.customer.create({
      data: {
        code,
        nameAr,
        nameEn: nameEn || nameAr,
        customerType: customerType || 'RETAIL',
        governorate: governorate || 'القاهرة',
        area: area || null,
        address: address || null,
        phone,
        whatsappNumber: whatsappNumber || phone,
        email: email || null,
        taxNumber: taxNumber || null,
        salesRepId: salesRepId || null,
        priceListId: priceListId || null,
        creditLimitEGP: creditLimit,
        creditDays: parseInt(creditDays || '0'),
        currentBalanceEGP: openingBalance,
        segment: segment || 'REGULAR',
        tags: tags || [],
        notes: notes || null,
      },
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userName: session.user.name || 'User',
        action: 'CREATE',
        entityType: 'CUSTOMER',
        entityId: customer.id,
        afterData: {
          code: customer.code,
          nameAr: customer.nameAr,
          phone: customer.phone,
          creditLimit: creditLimit.toNumber(),
          balance: openingBalance.toNumber(),
        },
      },
    });

    return NextResponse.json({ success: true, data: customer }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating customer:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create customer' },
      { status: 500 }
    );
  }
}
