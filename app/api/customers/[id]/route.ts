import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { getAgingBucket } from '@/lib/utils';
import Decimal from 'decimal.js';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: params.id },
      include: {
        priceList: true,
        salesRep: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        invoices: {
          orderBy: { invoiceDate: 'desc' },
          include: {
            items: true,
          },
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
          include: {
            account: { select: { nameAr: true, nameEn: true } },
            cheque: { select: { chequeNumber: true, bankName: true, status: true, dueDate: true } },
          },
        },
        quotes: {
          orderBy: { quoteDate: 'desc' },
          take: 5,
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // 1. Calculate Debt Aging Buckets from unpaid invoices
    const aging = {
      '0-30': 0,
      '31-60': 0,
      '61-90': 0,
      '90+': 0,
      totalOverdue: 0,
    };

    const now = new Date();
    customer.invoices.forEach((inv) => {
      const balanceDue = Number(inv.balanceDue);
      if (balanceDue > 0 && inv.status !== 'CANCELLED' && inv.status !== 'DRAFT') {
        const dueDate = new Date(inv.dueDate);
        if (dueDate < now) {
          const bucket = getAgingBucket(dueDate);
          aging[bucket] += balanceDue;
          aging.totalOverdue += balanceDue;
        }
      }
    });

    // 2. Build Chronological Statement of Account (كشف الحساب التفصيلي)
    const ledgerEvents: any[] = [];

    // Invoices are Debit (+) for the customer
    customer.invoices
      .filter((inv) => inv.status !== 'CANCELLED' && inv.status !== 'DRAFT')
      .forEach((inv) => {
        ledgerEvents.push({
          id: `inv-${inv.id}`,
          date: inv.invoiceDate,
          type: 'INVOICE',
          typeLabelAr: 'فاتورة مبيعات',
          typeLabelEn: 'Sales Invoice',
          reference: inv.invoiceNumber,
          debit: Number(inv.grandTotal),
          credit: 0,
          notes: inv.notes || `${inv.items.length} أصناف`,
        });
      });

    // Payments are Credit (-) for the customer
    customer.payments.forEach((pay) => {
      ledgerEvents.push({
        id: `pay-${pay.id}`,
        date: pay.paymentDate,
        type: 'PAYMENT',
        typeLabelAr: 'سداد دفعة / تحصيل',
        typeLabelEn: 'Payment Received',
        reference: pay.reference || (pay.cheque ? `شيك ${pay.cheque.chequeNumber}` : `PAY-${pay.id.slice(-6)}`),
        debit: 0,
        credit: Number(pay.amount),
        notes: pay.cheque ? `بنك ${pay.cheque.bankName} - استحقاق ${new Date(pay.cheque.dueDate).toLocaleDateString('ar-EG')}` : pay.notes,
      });
    });

    // Sort ascending by date for ledger calculation
    ledgerEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let runningBalance = 0;
    const statementOfAccount = ledgerEvents.map((event) => {
      runningBalance = runningBalance + event.debit - event.credit;
      return {
        ...event,
        runningBalance,
      };
    });

    // Reverse for UI display (newest first)
    statementOfAccount.reverse();

    const currentBalance = Number(customer.currentBalanceEGP);
    const creditLimit = Number(customer.creditLimitEGP);
    const isExceeded = creditLimit > 0 && currentBalance > creditLimit;

    const data = {
      ...customer,
      currentBalanceEGP: currentBalance,
      creditLimitEGP: creditLimit,
      isExceeded,
      creditUtilizationPct: creditLimit > 0 ? Math.min(100, Math.round((currentBalance / creditLimit) * 100)) : 0,
      aging,
      statementOfAccount,
      invoices: customer.invoices.map((inv) => ({
        ...inv,
        subtotal: Number(inv.subtotal),
        discountTotal: Number(inv.discountTotal),
        taxTotal: Number(inv.taxTotal),
        grandTotal: Number(inv.grandTotal),
        paidAmount: Number(inv.paidAmount),
        balanceDue: Number(inv.balanceDue),
      })),
      payments: customer.payments.map((p) => ({
        ...p,
        amount: Number(p.amount),
      })),
    };

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error fetching customer details:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch customer' },
      { status: 500 }
    );
  }
}

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
      segment,
      tags,
      notes,
      isActive,
    } = body;

    const updated = await prisma.customer.update({
      where: { id: params.id },
      data: {
        ...(nameAr ? { nameAr } : {}),
        ...(nameEn ? { nameEn } : {}),
        ...(customerType ? { customerType } : {}),
        ...(governorate !== undefined ? { governorate } : {}),
        ...(area !== undefined ? { area } : {}),
        ...(address !== undefined ? { address } : {}),
        ...(phone ? { phone } : {}),
        ...(whatsappNumber !== undefined ? { whatsappNumber } : {}),
        ...(email !== undefined ? { email } : {}),
        ...(taxNumber !== undefined ? { taxNumber } : {}),
        ...(salesRepId !== undefined ? { salesRepId: salesRepId || null } : {}),
        ...(priceListId !== undefined ? { priceListId: priceListId || null } : {}),
        ...(creditLimitEGP !== undefined ? { creditLimitEGP: new Decimal(creditLimitEGP) } : {}),
        ...(creditDays !== undefined ? { creditDays: parseInt(creditDays) } : {}),
        ...(segment ? { segment } : {}),
        ...(tags !== undefined ? { tags } : {}),
        ...(notes !== undefined ? { notes } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      },
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userName: session.user.name || 'User',
        action: 'UPDATE',
        entityType: 'CUSTOMER',
        entityId: updated.id,
        afterData: {
          nameAr: updated.nameAr,
          phone: updated.phone,
          creditLimit: Number(updated.creditLimitEGP),
        },
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Error updating customer:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update customer' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Soft delete customer
    const updated = await prisma.customer.update({
      where: { id: params.id },
      data: { isActive: false },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userName: session.user.name || 'User',
        action: 'DELETE',
        entityType: 'CUSTOMER',
        entityId: updated.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting customer:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete customer' },
      { status: 500 }
    );
  }
}
