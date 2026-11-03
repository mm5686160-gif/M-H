import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { canManagePurchases } from '@/lib/utils';
import Decimal from 'decimal.js';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        purchaseOrders: {
          orderBy: { orderDate: 'desc' },
          take: 20,
          include: {
            shipment: true,
            _count: { select: { items: true } },
          },
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
          take: 20,
        },
      },
    });

    if (!supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }

    const sanitized = {
      ...supplier,
      currentBalance: Number(supplier.currentBalance),
      purchaseOrders: supplier.purchaseOrders.map((po) => ({
        ...po,
        exchangeRate: Number(po.exchangeRate),
        subtotalForeign: Number(po.subtotalForeign),
        subtotalEGP: Number(po.subtotalEGP),
      })),
      payments: supplier.payments.map((p) => ({
        ...p,
        amount: Number(p.amount),
        exchangeRate: Number(p.exchangeRate),
        amountEGP: Number(p.amountEGP),
        exchangeGainLoss: Number(p.exchangeGainLoss),
      })),
    };

    return NextResponse.json({ success: true, data: sanitized });
  } catch (error: any) {
    console.error('Error fetching supplier:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch supplier' },
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

    if (!canManagePurchases(session.user.role)) {
      return NextResponse.json(
        { error: 'You do not have permission to edit suppliers' },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await req.json();

    const existing = await prisma.supplier.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }

    const updated = await prisma.supplier.update({
      where: { id },
      data: {
        nameAr: body.nameAr ?? existing.nameAr,
        nameEn: body.nameEn ?? existing.nameEn,
        country: body.country ?? existing.country,
        defaultCurrency: body.defaultCurrency ?? existing.defaultCurrency,
        paymentTermsDays: body.paymentTermsDays !== undefined ? parseInt(body.paymentTermsDays) : existing.paymentTermsDays,
        contactName: body.contactName !== undefined ? body.contactName : existing.contactName,
        phone: body.phone !== undefined ? body.phone : existing.phone,
        email: body.email !== undefined ? body.email : existing.email,
        address: body.address !== undefined ? body.address : existing.address,
        taxNumber: body.taxNumber !== undefined ? body.taxNumber : existing.taxNumber,
        notes: body.notes !== undefined ? body.notes : existing.notes,
        isActive: body.isActive !== undefined ? body.isActive : existing.isActive,
      },
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userName: session.user.name || 'User',
        action: 'UPDATE',
        entityType: 'SUPPLIER',
        entityId: id,
        afterData: body,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Error updating supplier:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update supplier' },
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

    if (!canManagePurchases(session.user.role)) {
      return NextResponse.json(
        { error: 'You do not have permission to delete suppliers' },
        { status: 403 }
      );
    }

    const { id } = params;

    const poCount = await prisma.purchaseOrder.count({ where: { supplierId: id } });
    if (poCount > 0) {
      // Soft-delete to preserve purchase history
      await prisma.supplier.update({
        where: { id },
        data: { isActive: false },
      });
      return NextResponse.json({
        success: true,
        message: 'تم تعطيل المورد (لا يمكن حذفه نهائياً لوجود أوامر شراء مسجلة له)',
      });
    }

    await prisma.supplier.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'تم حذف المورد بنجاح' });
  } catch (error: any) {
    console.error('Error deleting supplier:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete supplier' },
      { status: 500 }
    );
  }
}
