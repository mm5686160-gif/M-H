// app/api/import/products/route.ts
// Bulk import products from Excel (.xlsx) file
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import ExcelJS from 'exceljs';
import Decimal from 'decimal.js';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || !['ADMIN', 'MANAGER'].includes(session.user.role ?? '')) {
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
      // Indexing in exceljs row.values is 1-based:
      const sku = String(values[1] ?? '').trim();
      const barcode = values[2] ? String(values[2]).trim() : null;
      const nameAr = String(values[3] ?? '').trim();
      const nameEn = String(values[4] ?? '').trim();
      const rawType = String(values[5] ?? '').trim().toUpperCase();
      const productType = rawType.includes('BEARING') ? 'BEARING' : 'SPARE_PART';
      const categoryName = String(values[6] ?? '').trim() || 'عام';
      const uom = String(values[7] ?? 'PIECE').trim().toUpperCase();
      const wac = parseFloat(values[8] ?? '0');
      const priceWholesale = parseFloat(values[9] ?? '0');
      const priceSemi = parseFloat(values[10] ?? '0');
      const priceRetail = parseFloat(values[11] ?? '0');
      const minStock = parseFloat(values[12] ?? '0');
      const bearingNumber = values[13] ? String(values[13]).trim() : null;
      const d = values[14] ? parseFloat(values[14]) : null;
      const D = values[15] ? parseFloat(values[15]) : null;
      const B = values[16] ? parseFloat(values[16]) : null;
      const clearance = values[17] ? String(values[17]).trim() : null;

      if (sku && nameAr) {
        rows.push({
          sku,
          barcode,
          nameAr,
          nameEn: nameEn || nameAr,
          productType,
          categoryName,
          uom,
          wac,
          priceWholesale,
          priceSemi,
          priceRetail,
          minStock,
          bearingNumber,
          d,
          D,
          B,
          clearance,
        });
      }
    });

    if (rows.length === 0) {
      return NextResponse.json({ error: 'الملف لا يحتوي على صفوف بيانات صالحة' }, { status: 400 });
    }

    let createdCount = 0;
    let updatedCount = 0;
    const errors: string[] = [];

    // Process each row
    for (const item of rows) {
      try {
        // Ensure category exists
        let category = await prisma.category.findFirst({
          where: { nameAr: item.categoryName },
        });

        if (!category) {
          category = await prisma.category.create({
            data: {
              nameAr: item.categoryName,
              nameEn: item.categoryName,
            },
          });
        }

        // Upsert Product
        const existing = await prisma.product.findUnique({
          where: { sku: item.sku },
        });

        let productId: string;

        if (existing) {
          const updated = await prisma.product.update({
            where: { sku: item.sku },
            data: {
              barcode: item.barcode ?? existing.barcode,
              nameAr: item.nameAr,
              nameEn: item.nameEn,
              productType: item.productType,
              categoryId: category.id,
              currentWAC: item.wac > 0 ? new Decimal(item.wac) : existing.currentWAC,
              minStockLevel: new Decimal(item.minStock),
            },
          });
          productId = updated.id;
          updatedCount++;
        } else {
          const created = await prisma.product.create({
            data: {
              sku: item.sku,
              barcode: item.barcode,
              nameAr: item.nameAr,
              nameEn: item.nameEn,
              productType: item.productType,
              categoryId: category.id,
              currentWAC: new Decimal(item.wac),
              minStockLevel: new Decimal(item.minStock),
            },
          });
          productId = created.id;
          createdCount++;
        }

        // Bearing spec if bearing
        if (item.productType === 'BEARING' && item.bearingNumber) {
          await prisma.bearingSpec.upsert({
            where: { productId },
            update: {
              bearingNumber: item.bearingNumber,
              bearingType: 'Deep Groove Ball Bearing',
              innerDiameterMm: item.d ? new Decimal(item.d) : new Decimal(0),
              outerDiameterMm: item.D ? new Decimal(item.D) : new Decimal(0),
              widthMm: item.B ? new Decimal(item.B) : new Decimal(0),
              brand: 'Generic',
              originCountry: 'Imported',
              sealType: item.clearance ?? '2RS',
            },
            create: {
              productId,
              bearingNumber: item.bearingNumber,
              bearingType: 'Deep Groove Ball Bearing',
              innerDiameterMm: item.d ? new Decimal(item.d) : new Decimal(0),
              outerDiameterMm: item.D ? new Decimal(item.D) : new Decimal(0),
              widthMm: item.B ? new Decimal(item.B) : new Decimal(0),
              brand: 'Generic',
              originCountry: 'Imported',
              sealType: item.clearance ?? '2RS',
            },
          });
        }
      } catch (err: any) {
        errors.push(`خطأ في الصنف ${item.sku}: ${err.message}`);
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
    console.error('Products import error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
