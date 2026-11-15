import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAgingBucket, whatsappLink, formatEGP } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const governorate = searchParams.get('governorate');
    const minDays = searchParams.get('minDays'); // e.g. '60' for 60+ days

    const where: any = {
      isActive: true,
      currentBalanceEGP: { gt: 0 },
    };

    if (governorate && governorate !== 'ALL') {
      where.governorate = governorate;
    }

    const customers = await prisma.customer.findMany({
      where,
      include: {
        salesRep: {
          select: {
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
            invoiceDate: true,
            dueDate: true,
            grandTotal: true,
            balanceDue: true,
          },
          orderBy: { dueDate: 'asc' },
        },
      },
      orderBy: { currentBalanceEGP: 'desc' },
    });

    const now = new Date();

    const summary = {
      totalReceivables: 0,
      bucket0_30: 0,
      bucket31_60: 0,
      bucket61_90: 0,
      bucket90Plus: 0,
      debtorCount: customers.length,
    };

    const data = customers.map((c) => {
      const balance = Number(c.currentBalanceEGP);
      const creditLimit = Number(c.creditLimitEGP);

      const buckets = {
        '0-30': 0,
        '31-60': 0,
        '61-90': 0,
        '90+': 0,
      };

      let oldestDueDate: Date | null = null;
      let totalOverdue = 0;

      c.invoices.forEach((inv) => {
        const due = new Date(inv.dueDate);
        const invBalance = Number(inv.balanceDue);

        if (due < now) {
          const b = getAgingBucket(due);
          buckets[b] += invBalance;
          totalOverdue += invBalance;

          if (!oldestDueDate || due < oldestDueDate) {
            oldestDueDate = due;
          }
        }
      });

      // Update global summary
      summary.totalReceivables += balance;
      summary.bucket0_30 += buckets['0-30'];
      summary.bucket31_60 += buckets['31-60'];
      summary.bucket61_90 += buckets['61-90'];
      summary.bucket90Plus += buckets['90+'];

      // Generate polite Egyptian Arabic reminder text
      const reminderText = `السلام عليكم ورحمة الله وبركاته، عميلنا العزيز (${c.nameAr})،\nتحية طيبة وبعد،\nنود تذكير سيادتكم بأن إجمالي الرصيد المستحق لحسابكم طرفنا هو ${formatEGP(balance)}${
        totalOverdue > 0 ? `، منها ${formatEGP(totalOverdue)} متأخرة عن موعد الاستحقاق` : ''
      }.\nنرجو من سيادتكم التكرم بمراجعة الحساب وتأكيد موعد السداد.\nشاكرين ومقدرين حسن تعاونكم الدائم معنا.\nشركة استيراد وتوزيع رولمان البلي وقطع الغيار.`;

      const whatsappUrl = c.whatsappNumber || c.phone
        ? whatsappLink(c.whatsappNumber || c.phone, reminderText)
        : null;

      return {
        id: c.id,
        code: c.code,
        nameAr: c.nameAr,
        nameEn: c.nameEn,
        customerType: c.customerType,
        governorate: c.governorate,
        phone: c.phone,
        whatsappNumber: c.whatsappNumber || c.phone,
        currentBalanceEGP: balance,
        creditLimitEGP: creditLimit,
        creditDays: c.creditDays,
        isExceeded: creditLimit > 0 && balance > creditLimit,
        buckets,
        totalOverdue,
        oldestDueDate,
        salesRep: c.salesRep?.user?.name || null,
        whatsappUrl,
        unpaidInvoicesCount: c.invoices.length,
      };
    });

    let filtered = data;
    if (minDays === '60') {
      filtered = data.filter((c) => c.buckets['61-90'] > 0 || c.buckets['90+'] > 0);
    } else if (minDays === '90') {
      filtered = data.filter((c) => c.buckets['90+'] > 0);
    }

    return NextResponse.json({
      success: true,
      summary,
      data: filtered,
    });
  } catch (error: any) {
    console.error('Error fetching aging report:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch aging report' },
      { status: 500 }
    );
  }
}
