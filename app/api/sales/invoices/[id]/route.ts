import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { canSeeCosts, canSeeProfit } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    const userRole = session?.user?.role;
    const showCost = canSeeCosts(userRole);
    const showProfit = canSeeProfit(userRole);

    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: {
        customer: {
          select: {
            id: true,
            code: true,
            nameAr: true,
            nameEn: true,
            phone: true,
            whatsappNumber: true,
            address: true,
            governorate: true,
            taxNumber: true,
            currentBalanceEGP: true,
            creditLimitEGP: true,
          },
        },
        salesRep: { select: { id: true, user: { select: { name: true } } } },
        items: {
          include: {
            product: {
              select: {
                id: true,
                sku: true,
                barcode: true,
                nameAr: true,
                nameEn: true,
                unitOfMeasure: true,
                bearingSpec: true,
                sparePartSpec: true,
              },
            },
            warehouse: { select: { id: true, nameAr: true, nameEn: true } },
          },
        },
        payments: {
          include: {
            account: { select: { nameAr: true, nameEn: true } },
            cheque: true,
          },
        },
        deliveryNote: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const items = invoice.items.map((it) => ({
      ...it,
      quantity: Number(it.quantity),
      unitPrice: Number(it.unitPrice),
      discountPct: Number(it.discountPct),
      lineTotal: Number(it.lineTotal),
      costAtSale: showCost ? Number(it.costAtSale) : null,
      grossProfit: showProfit ? Number(it.grossProfit) : null,
      grossProfitPct: showProfit ? Number(it.grossProfitPct) : null,
    }));

    const data = {
      ...invoice,
      subtotal: Number(invoice.subtotal),
      discountTotal: Number(invoice.discountTotal),
      taxTotal: Number(invoice.taxTotal),
      grandTotal: Number(invoice.grandTotal),
      paidAmount: Number(invoice.paidAmount),
      balanceDue: Number(invoice.balanceDue),
      customer: {
        ...invoice.customer,
        currentBalanceEGP: Number(invoice.customer.currentBalanceEGP),
        creditLimitEGP: Number(invoice.customer.creditLimitEGP),
      },
      items,
      payments: invoice.payments.map((p) => ({
        ...p,
        amount: Number(p.amount),
      })),
    };

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error fetching invoice details:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch invoice' },
      { status: 500 }
    );
  }
}
