// app/api/import/template/route.ts
// Download template Excel files for bulk imports (products, customers, opening stock)
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import ExcelJS from 'exceljs';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') ?? 'products';

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'ERP System';
  workbook.created = new Date();

  if (type === 'products') {
    const ws = workbook.addWorksheet('قالب_المنتجات', {
      views: [{ rightToLeft: true }],
    });

    ws.columns = [
      { header: 'كود الصنف (SKU) *', key: 'sku', width: 20 },
      { header: 'الباركود', key: 'barcode', width: 18 },
      { header: 'اسم الصنف بالعربية *', key: 'nameAr', width: 30 },
      { header: 'اسم الصنف بالإنجليزية *', key: 'nameEn', width: 30 },
      { header: 'نوع الصنف (BEARING / SPARE_PART) *', key: 'productType', width: 25 },
      { header: 'اسم الفئة (Category) *', key: 'categoryName', width: 20 },
      { header: 'وحدة القياس (PIECE / SET / PAIR)', key: 'uom', width: 20 },
      { header: 'تكلفة الشراء التقديرية (WAC ج.م) *', key: 'wac', width: 22 },
      { header: 'سعر الجملة (ج.م) *', key: 'priceWholesale', width: 18 },
      { header: 'سعر نصف الجملة (ج.م)', key: 'priceSemi', width: 18 },
      { header: 'سعر القطاعي (ج.م) *', key: 'priceRetail', width: 18 },
      { header: 'الحد الأدنى للمخزون (طلب جديد)', key: 'minStock', width: 22 },
      // Bearing specs
      { header: 'رقم الرولمان بلي (Bearing #)', key: 'bearingNumber', width: 20 },
      { header: 'القطر الداخلي d (مم)', key: 'd', width: 18 },
      { header: 'القطر الخارجي D (مم)', key: 'D', width: 18 },
      { header: 'العرض B (مم)', key: 'B', width: 15 },
      { header: 'نوع الخلوص (C3, Normal...)', key: 'clearance', width: 18 },
    ];

    // Styling header
    ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    ws.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E40AF' }, // Blue
    };

    // Sample data rows
    ws.addRow({
      sku: '6204-2RS-SKF',
      barcode: '7316570534212',
      nameAr: 'رولمان بلي 6204 2RS أصلي',
      nameEn: 'Ball Bearing 6204 2RS SKF',
      productType: 'BEARING',
      categoryName: 'رولمان بلي كروي',
      uom: 'PIECE',
      wac: 120.0,
      priceWholesale: 145.0,
      priceSemi: 155.0,
      priceRetail: 175.0,
      minStock: 50,
      bearingNumber: '6204',
      d: 20,
      D: 47,
      B: 14,
      clearance: 'Normal',
    });

    ws.addRow({
      sku: 'WASH-MOTOR-TOSH',
      barcode: '',
      nameAr: 'موتور غسالة توشيبا فوق أوتوماتيك 10 كجم',
      nameEn: 'Toshiba Washing Machine Motor 10KG',
      productType: 'SPARE_PART',
      categoryName: 'مواتير وأجهزة',
      uom: 'PIECE',
      wac: 1450.0,
      priceWholesale: 1650.0,
      priceSemi: 1720.0,
      priceRetail: 1850.0,
      minStock: 10,
      bearingNumber: '',
      d: '',
      D: '',
      B: '',
      clearance: '',
    });
  } else if (type === 'customers') {
    const ws = workbook.addWorksheet('قالب_العملاء', {
      views: [{ rightToLeft: true }],
    });

    ws.columns = [
      { header: 'اسم العميل / الورشة *', key: 'name', width: 30 },
      { header: 'اسم الشركة / النشاط', key: 'companyName', width: 25 },
      { header: 'نوع العميل (WHOLESALE/WORKSHOP/RETAIL/COMPANY) *', key: 'customerType', width: 25 },
      { header: 'رقم الهاتف *', key: 'phone', width: 20 },
      { header: 'المحافظة *', key: 'governorate', width: 18 },
      { header: 'العنوان التفصيلي', key: 'address', width: 30 },
      { header: 'السجل التجاري', key: 'commercialReg', width: 20 },
      { header: 'الرقم الضريبي', key: 'taxNumber', width: 20 },
      { header: 'الحد الائتماني (ج.م)', key: 'creditLimit', width: 18 },
      { header: 'فترة الائتمان (أيام)', key: 'creditDays', width: 18 },
      { header: 'الرصيد الافتتاحي (ج.م مدين)', key: 'openingBalance', width: 22 },
    ];

    ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    ws.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF047857' }, // Emerald green
    };

    ws.addRow({
      name: 'ورشة الأمل لصيانة الأجهزة',
      companyName: 'الأمل الهندسية',
      customerType: 'WORKSHOP',
      phone: '01012345678',
      governorate: 'القاهرة',
      address: 'شارع شبرا الرئيسي، القاهرة',
      commercialReg: '123456',
      taxNumber: '100-200-300',
      creditLimit: 50000,
      creditDays: 30,
      openingBalance: 12500,
    });
  } else if (type === 'opening-stock') {
    const ws = workbook.addWorksheet('قالب_رصيد_أول_المدة', {
      views: [{ rightToLeft: true }],
    });

    ws.columns = [
      { header: 'كود الصنف (SKU) *', key: 'sku', width: 25 },
      { header: 'اسم المخزن *', key: 'warehouseName', width: 25 },
      { header: 'رقم / مكان الرف (Shelf Location)', key: 'shelfLocation', width: 20 },
      { header: 'الكمية الموجودة فعلياً *', key: 'quantity', width: 22 },
      { header: 'تكلفة الوحدة (WAC ج.م) *', key: 'unitCost', width: 20 },
    ];

    ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    ws.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFB45309' }, // Amber
    };

    ws.addRow({
      sku: '6204-2RS-SKF',
      warehouseName: 'المخزن الرئيسي - القاهرة',
      shelfLocation: 'A-12-03',
      quantity: 250,
      unitCost: 120.0,
    });
  } else {
    return NextResponse.json({ error: 'Invalid template type' }, { status: 400 });
  }

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="template-${type}.xlsx"`,
    },
  });
}
