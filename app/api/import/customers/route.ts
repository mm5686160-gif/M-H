// app/api/import/customers/route.ts
// Bulk import customers from Excel (.xlsx) file
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import ExcelJS from 'exceljs';
import Decimal from 'decimal.js';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || !['ADMIN', 'MANAGER', 'ACCOUNTANT'].includes(session.user.role ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'يرجى اختيار ملف Excel للرفع' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      return NextResponse.json({ error: 'الملف لا يحتوي على أوراق عمل' }, { status: 400 });
    }

    const rows: any[] = [];
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return; // Skip headers

      const values = row.values as any[];
      const name = String(values[1] ?? '').trim();
      const companyName = values[2] ? String(values[2]).trim() : '';
      const rawType = String(values[3] ?? 'WHOLESALE').trim().toUpperCase();
      let customerType: 'WHOLESALE' | 'WORKSHOP' | 'RETAIL' | 'COMPANY' = 'WHOLESALE';
      if (rawType.includes('WORKSHOP')) customerType = 'WORKSHOP';
      else if (rawType.includes('RETAIL')) customerType = 'RETAIL';
      else if (rawType.includes('COMPANY')) customerType = 'COMPANY';

      const phone = String(values[4] ?? '').trim();
      const governorate = values[5] ? String(values[5]).trim() : null;
      const address = values[6] ? String(values[6]).trim() : null;
      const taxNumber = values[8] ? String(values[8]).trim() : null;
      const creditLimit = parseFloat(values[9] ?? '0');
      const creditDays = parseInt(values[10] ?? '0');
      const openingBalance = parseFloat(values[11] ?? '0');

      if (name && phone) {
        rows.push({
          name,
          companyName,
          customerType,
          phone,
          governorate,
          address,
          taxNumber,
          creditLimit,
          creditDays,
          openingBalance,
        });
      }
    });

    if (rows.length === 0) {
      return NextResponse.json({ error: 'الملف لا يحتوي على صفوف بيانات صالحة' }, { status: 400 });
    }

    let createdCount = 0;
    let updatedCount = 0;
    const errors: string[] = [];

    // Get current customer count for code sequence
    const existingCount = await prisma.customer.count();
    let codeSeq = existingCount + 1;

    for (const item of rows) {
      try {
        const existing = await prisma.customer.findFirst({
          where: { phone: item.phone },
        });

        if (existing) {
          await prisma.customer.update({
            where: { id: existing.id },
            data: {
              nameAr: item.name,
              customerType: item.customerType,
              governorate: item.governorate ?? existing.governorate,
              address: item.address ?? existing.address,
              taxNumber: item.taxNumber ?? existing.taxNumber,
              creditLimitEGP: item.creditLimit > 0 ? new Decimal(item.creditLimit) : existing.creditLimitEGP,
              creditDays: item.creditDays > 0 ? item.creditDays : existing.creditDays,
            },
          });
          updatedCount++;
        } else {
          const code = `CUST-${String(codeSeq++).padStart(4, '0')}`;
          await prisma.customer.create({
            data: {
              code,
              nameAr: item.name,
              nameEn: item.companyName || item.name,
              customerType: item.customerType,
              phone: item.phone,
              governorate: item.governorate,
              address: item.address,
              taxNumber: item.taxNumber,
              creditLimitEGP: new Decimal(item.creditLimit),
              creditDays: item.creditDays,
              currentBalanceEGP: new Decimal(item.openingBalance),
            },
          });
          createdCount++;
        }
      } catch (err: any) {
        errors.push(`خطأ في العميل ${item.name}: ${err.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        totalRows: rows.length,
        createdCount,
        updatedCount,
        errorCount: errors.length,
        errors,
      },
    });
  } catch (error: any) {
    console.error('Customers import error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
