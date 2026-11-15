// app/api/import/opening-stock/route.ts
// Bulk import opening stock per warehouse from Excel (.xlsx) file
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import ExcelJS from 'exceljs';
import Decimal from 'decimal.js';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || !['ADMIN', 'MANAGER', 'WAREHOUSE'].includes(session.user.role ?? '')) {
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
      const sku = String(values[1] ?? '').trim();
      const warehouseName = String(values[2] ?? '').trim();
      const shelfLocation = values[3] ? String(values[3]).trim() : null;
      const quantity = parseFloat(values[4] ?? '0');
      const unitCost = parseFloat(values[5] ?? '0');

      if (sku && warehouseName && quantity >= 0) {
        rows.push({
          sku,
          warehouseName,
          shelfLocation,
          quantity,
          unitCost,
        });
      }
    });

    if (rows.length === 0) {
      return NextResponse.json({ error: 'الملف لا يحتوي على صفوف بيانات صالحة' }, { status: 400 });
    }

    let processedCount = 0;
    const errors: string[] = [];

    // Pre-cache warehouses
    const warehouses = await prisma.warehouse.findMany();
    const warehouseMap = new Map(warehouses.map((w) => [w.nameAr, w]));

    for (const item of rows) {
      try {
        // Find product
        const product = await prisma.product.findUnique({
          where: { sku: item.sku },
        });

        if (!product) {
          errors.push(`الصنف ${item.sku} غير مسجل بالنظام`);
          continue;
        }

        // Find or create warehouse
        let warehouse = warehouseMap.get(item.warehouseName);
        if (!warehouse) {
          warehouse = await prisma.warehouse.create({
            data: {
              nameAr: item.warehouseName,
              nameEn: item.warehouseName,
              location: item.warehouseName,
            },
          });
          warehouseMap.set(item.warehouseName, warehouse);
        }

        // Upsert ProductWarehouse
        const qtyDec = new Decimal(item.quantity);
        await prisma.productWarehouse.upsert({
          where: {
            productId_warehouseId: {
              productId: product.id,
              warehouseId: warehouse.id,
            },
          },
          update: {
            quantityOnHand: qtyDec,
            shelfLocation: item.shelfLocation ?? undefined,
          },
          create: {
            productId: product.id,
            warehouseId: warehouse.id,
            quantityOnHand: qtyDec,
            shelfLocation: item.shelfLocation,
          },
        });

        // Update WAC if provided and current is 0
        if (item.unitCost > 0 && product.currentWAC.isZero()) {
          await prisma.product.update({
            where: { id: product.id },
            data: { currentWAC: new Decimal(item.unitCost) },
          });
        }

        processedCount++;
      } catch (err: any) {
        errors.push(`خطأ في ${item.sku}: ${err.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        totalRows: rows.length,
        processedCount,
        errorCount: errors.length,
        errors,
      },
    });
  } catch (error: any) {
    console.error('Opening stock import error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
