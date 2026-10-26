/**
 * Prisma Seed Script — Bearings & Spare Parts ERP
 * Run with: npm run db:seed
 */
import { PrismaClient, UserRole, ProductType, UnitOfMeasure, OemType, POStatus,
  ShipmentAllocationMethod, InvoiceStatus, PaymentMethod, ChequeDirection, ChequeStatus,
  AccountType, CustomerType, CustomerSegment, PriceListType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const SALT_ROUNDS = 12;

async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

function d(value: number | string) {
  return value.toString();
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log("🌱  Starting seed...");

  // -------------------------------------------------------------------------
  // 1. USERS
  // -------------------------------------------------------------------------
  console.log("  → Creating users...");

  const ownerHash    = await hashPassword("Password123!");
  const managerHash  = await hashPassword("Password123!");
  const salesRepHash = await hashPassword("Password123!");
  const cashierHash  = await hashPassword("Password123!");

  const owner = await prisma.user.upsert({
    where: { email: "owner@erp.local" },
    update: {},
    create: {
      name:           "أحمد محمد السيد",
      email:          "owner@erp.local",
      hashedPassword: ownerHash,
      role:           UserRole.OWNER,
      isActive:       true,
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: "manager@erp.local" },
    update: {},
    create: {
      name:           "محمد عبد الرحمن",
      email:          "manager@erp.local",
      hashedPassword: managerHash,
      role:           UserRole.MANAGER,
      isActive:       true,
    },
  });

  const salesRepUser = await prisma.user.upsert({
    where: { email: "sales@erp.local" },
    update: {},
    create: {
      name:           "خالد إبراهيم حسن",
      email:          "sales@erp.local",
      hashedPassword: salesRepHash,
      role:           UserRole.SALES_REP,
      isActive:       true,
    },
  });

  const cashier = await prisma.user.upsert({
    where: { email: "cashier@erp.local" },
    update: {},
    create: {
      name:           "فاطمة علي محمود",
      email:          "cashier@erp.local",
      hashedPassword: cashierHash,
      role:           UserRole.CASHIER,
      isActive:       true,
    },
  });

  // SalesRep record for the sales user
  const salesRep = await prisma.salesRep.upsert({
    where: { userId: salesRepUser.id },
    update: {},
    create: {
      userId:            salesRepUser.id,
      commissionRatePct: d(3),
      isActive:          true,
    },
  });

  console.log(`     ✓ Users: ${owner.email}, ${manager.email}, ${salesRepUser.email}, ${cashier.email}`);

  // -------------------------------------------------------------------------
  // 2. SETTINGS
  // -------------------------------------------------------------------------
  console.log("  → Creating settings...");

  const settingsData = [
    { key: "company_name_ar",   value: "شركة المحامل والقطع المتخصصة" },
    { key: "company_name_en",   value: "Specialized Bearings & Spare Parts Co." },
    { key: "fiscal_year_start", value: "2025-01-01" },
    { key: "fiscal_year_end",   value: "2025-12-31" },
    { key: "default_currency",  value: "EGP" },
    { key: "tax_number",        value: "123-456-789" },
    { key: "address",           value: "42 شارع التجارة، الصناعية، القاهرة" },
    { key: "phone",             value: "+20-2-1234-5678" },
    { key: "email",             value: "info@bearings-eg.com" },
  ];

  for (const s of settingsData) {
    await prisma.setting.upsert({
      where:  { key: s.key },
      update: { value: s.value, updatedBy: owner.id },
      create: { key: s.key, value: s.value, updatedBy: owner.id },
    });
  }

  console.log(`     ✓ ${settingsData.length} settings saved`);

  // -------------------------------------------------------------------------
  // 3. WAREHOUSES
  // -------------------------------------------------------------------------
  console.log("  → Creating warehouses...");

  const wMain = await prisma.warehouse.upsert({
    where:  { id: "wh-main" },
    update: {},
    create: { id: "wh-main", nameAr: "المخزن الرئيسي",  nameEn: "Main Warehouse", location: "القاهرة، منطقة الصناعية", isActive: true },
  });

  const wBranchA = await prisma.warehouse.upsert({
    where:  { id: "wh-branch-a" },
    update: {},
    create: { id: "wh-branch-a", nameAr: "الفرع أ", nameEn: "Branch A", location: "الإسكندرية، المنطقة الصناعية", isActive: true },
  });

  const wBranchB = await prisma.warehouse.upsert({
    where:  { id: "wh-branch-b" },
    update: {},
    create: { id: "wh-branch-b", nameAr: "الفرع ب", nameEn: "Branch B", location: "الجيزة، العجوزة", isActive: true },
  });

  console.log(`     ✓ Warehouses: Main, Branch A, Branch B`);

  // -------------------------------------------------------------------------
  // 4. PRICE LISTS
  // -------------------------------------------------------------------------
  console.log("  → Creating price lists...");

  const plWholesale = await prisma.priceList.upsert({
    where:  { id: "pl-wholesale" },
    update: {},
    create: { id: "pl-wholesale", nameAr: "الجملة", nameEn: "Wholesale", type: PriceListType.WHOLESALE, isDefault: true, isActive: true },
  });

  const plSemiWholesale = await prisma.priceList.upsert({
    where:  { id: "pl-semi" },
    update: {},
    create: { id: "pl-semi", nameAr: "نصف الجملة", nameEn: "Semi-Wholesale", type: PriceListType.SEMI_WHOLESALE, isDefault: false, isActive: true },
  });

  const plRetail = await prisma.priceList.upsert({
    where:  { id: "pl-retail" },
    update: {},
    create: { id: "pl-retail", nameAr: "التجزئة", nameEn: "Retail", type: PriceListType.RETAIL, isDefault: false, isActive: true },
  });

  const plVip = await prisma.priceList.upsert({
    where:  { id: "pl-vip" },
    update: {},
    create: { id: "pl-vip", nameAr: "VIP التجزئة", nameEn: "VIP Retail", type: PriceListType.CUSTOM, isDefault: false, isActive: true },
  });

  console.log(`     ✓ Price lists: Wholesale, Semi-Wholesale, Retail, VIP Retail`);

  // -------------------------------------------------------------------------
  // 5. CATEGORIES
  // -------------------------------------------------------------------------
  console.log("  → Creating categories...");

  // Bearing parent
  const catBearings = await prisma.category.upsert({
    where:  { id: "cat-bearings" },
    update: {},
    create: { id: "cat-bearings", nameAr: "المحامل", nameEn: "Bearings", productType: ProductType.BEARING, isActive: true, sortOrder: 1 },
  });

  const bearingSubcats = [
    { id: "cat-dg",  nameAr: "محامل كرات عميقة",     nameEn: "Deep Groove Ball Bearings",     sortOrder: 1 },
    { id: "cat-ac",  nameAr: "محامل تلامس زاوي",      nameEn: "Angular Contact Bearings",      sortOrder: 2 },
    { id: "cat-tr",  nameAr: "محامل مخروطية",          nameEn: "Tapered Roller Bearings",       sortOrder: 3 },
    { id: "cat-nr",  nameAr: "محامل إبرة",             nameEn: "Needle Roller Bearings",        sortOrder: 4 },
    { id: "cat-th",  nameAr: "محامل دفعية",            nameEn: "Thrust Bearings",               sortOrder: 5 },
    { id: "cat-sa",  nameAr: "محامل كرات ذاتية المحاذاة", nameEn: "Self-Aligning Ball Bearings", sortOrder: 6 },
    { id: "cat-cr",  nameAr: "محامل أسطوانية",         nameEn: "Cylindrical Roller Bearings",   sortOrder: 7 },
    { id: "cat-pb",  nameAr: "وحدات تحمل على قاعدة",  nameEn: "Pillow Block Bearing Units",    sortOrder: 8 },
  ];

  for (const sc of bearingSubcats) {
    await prisma.category.upsert({
      where:  { id: sc.id },
      update: {},
      create: { ...sc, productType: ProductType.BEARING, parentId: catBearings.id, isActive: true },
    });
  }

  // Spare parts parent
  const catSpareParts = await prisma.category.upsert({
    where:  { id: "cat-spare-parts" },
    update: {},
    create: { id: "cat-spare-parts", nameAr: "قطع الغيار", nameEn: "Spare Parts", productType: ProductType.SPARE_PART, isActive: true, sortOrder: 2 },
  });

  const spareSubcats = [
    { id: "cat-sp-wm",  nameAr: "قطع غسالات", nameEn: "Washing Machine Parts", sortOrder: 1 },
    { id: "cat-sp-rf",  nameAr: "قطع ثلاجات", nameEn: "Refrigerator Parts",    sortOrder: 2 },
    { id: "cat-sp-ac",  nameAr: "قطع تكييف",   nameEn: "AC Parts",              sortOrder: 3 },
    { id: "cat-sp-ov",  nameAr: "قطع أفران",   nameEn: "Oven Parts",            sortOrder: 4 },
    { id: "cat-sp-dw",  nameAr: "قطع غسالات أطباق", nameEn: "Dishwasher Parts",sortOrder: 5 },
  ];

  for (const sc of spareSubcats) {
    await prisma.category.upsert({
      where:  { id: sc.id },
      update: {},
      create: { ...sc, productType: ProductType.SPARE_PART, parentId: catSpareParts.id, isActive: true },
    });
  }

  console.log(`     ✓ 8 bearing + 5 spare-part categories`);

  // -------------------------------------------------------------------------
  // 6. FINANCIAL ACCOUNTS
  // -------------------------------------------------------------------------
  console.log("  → Creating financial accounts...");

  const accCash = await prisma.financialAccount.upsert({
    where:  { id: "acc-cash" },
    update: {},
    create: {
      id: "acc-cash", nameAr: "الخزنة الرئيسية", nameEn: "Cash Box",
      accountType: AccountType.CASH, currency: "EGP",
      currentBalance: d(50000), isDefault: true, isActive: true,
    },
  });

  const accBank = await prisma.financialAccount.upsert({
    where:  { id: "acc-cib" },
    update: {},
    create: {
      id: "acc-cib", nameAr: "بنك CIB", nameEn: "Bank - CIB",
      accountType: AccountType.BANK, currency: "EGP",
      currentBalance: d(250000), isDefault: false, isActive: true,
    },
  });

  const accWallet = await prisma.financialAccount.upsert({
    where:  { id: "acc-vodafone" },
    update: {},
    create: {
      id: "acc-vodafone", nameAr: "فودافون كاش", nameEn: "Vodafone Cash",
      accountType: AccountType.WALLET, currency: "EGP",
      currentBalance: d(5000), isDefault: false, isActive: true,
    },
  });

  console.log(`     ✓ Financial accounts: Cash Box, Bank CIB, Vodafone Cash`);

  // -------------------------------------------------------------------------
  // 7. EXPENSE CATEGORIES
  // -------------------------------------------------------------------------
  console.log("  → Creating expense categories...");

  const expCats = [
    { id: "exp-cat-rent",      nameAr: "إيجار",           nameEn: "Rent",          sortOrder: 1 },
    { id: "exp-cat-salaries",  nameAr: "رواتب",           nameEn: "Salaries",      sortOrder: 2 },
    { id: "exp-cat-electric",  nameAr: "كهرباء",          nameEn: "Electricity",   sortOrder: 3 },
    { id: "exp-cat-transport", nameAr: "نقل وشحن",        nameEn: "Transport",     sortOrder: 4 },
    { id: "exp-cat-marketing", nameAr: "تسويق وإعلان",   nameEn: "Marketing",     sortOrder: 5 },
    { id: "exp-cat-other",     nameAr: "أخرى",            nameEn: "Other",         sortOrder: 6 },
  ];

  for (const ec of expCats) {
    await prisma.expenseCategory.upsert({
      where:  { id: ec.id },
      update: {},
      create: { ...ec, isActive: true },
    });
  }

  console.log(`     ✓ 6 expense categories`);

  // -------------------------------------------------------------------------
  // 8. SUPPLIERS
  // -------------------------------------------------------------------------
  console.log("  → Creating suppliers...");

  const supplierCN = await prisma.supplier.upsert({
    where:  { code: "SUP-CN-001" },
    update: {},
    create: {
      code: "SUP-CN-001", nameAr: "مصنع الصين للمحامل",
      nameEn: "China Bearings Manufacturing Co.", country: "CN",
      defaultCurrency: "USD", paymentTermsDays: 45,
      contactName: "Mr. Wang Lei", phone: "+86-21-5555-1234",
      email: "wanglei@chinabearings.com",
      address: "No.88 Industry Rd, Wuxi, Jiangsu, China",
      isActive: true, currentBalance: d(0),
    },
  });

  const supplierDE = await prisma.supplier.upsert({
    where:  { code: "SUP-DE-001" },
    update: {},
    create: {
      code: "SUP-DE-001", nameAr: "شركة ألمانيا للمحامل",
      nameEn: "German Precision Bearings GmbH", country: "DE",
      defaultCurrency: "EUR", paymentTermsDays: 30,
      contactName: "Herr Klaus Müller", phone: "+49-211-9876-5432",
      email: "k.muller@german-bearings.de",
      address: "Industriestraße 42, 40210 Düsseldorf, Germany",
      isActive: true, currentBalance: d(0),
    },
  });

  const supplierTR = await prisma.supplier.upsert({
    where:  { code: "SUP-TR-001" },
    update: {},
    create: {
      code: "SUP-TR-001", nameAr: "شركة تركيا لقطع الغيار",
      nameEn: "Türkiye Spare Parts A.Ş.", country: "TR",
      defaultCurrency: "USD", paymentTermsDays: 30,
      contactName: "Mehmet Yılmaz", phone: "+90-312-555-7890",
      email: "m.yilmaz@turkiye-spareparts.com.tr",
      address: "Organize Sanayi Bölgesi, Ankara, Türkiye",
      isActive: true, currentBalance: d(0),
    },
  });

  console.log(`     ✓ Suppliers: China, Germany, Türkiye`);

  // -------------------------------------------------------------------------
  // 9. BEARING PRODUCTS (10 products)
  // -------------------------------------------------------------------------
  console.log("  → Creating bearing products...");

  type BearingProductDef = {
    id: string; sku: string; nameAr: string; nameEn: string; categoryId: string;
    wac: string; minStock: string;
    spec: {
      bearingNumber: string; bearingType: string; innerMm: string; outerMm: string;
      widthMm: string; brand: string; origin: string; sealType: string;
    };
    prices: { plId: string; price: string }[];
  };

  const bearingDefs: BearingProductDef[] = [
    {
      id: "prod-b-6204", sku: "BRG-6204-2RS", nameAr: "محمل كرات 6204-2RS", nameEn: "Ball Bearing 6204-2RS",
      categoryId: "cat-dg", wac: "18.50", minStock: "20",
      spec: { bearingNumber: "6204-2RS", bearingType: "Deep Groove Ball Bearing", innerMm: "20", outerMm: "47", widthMm: "14", brand: "NSK", origin: "CN", sealType: "2RS" },
      prices: [{ plId: "pl-wholesale", price: "25" }, { plId: "pl-semi", price: "30" }, { plId: "pl-retail", price: "38" }, { plId: "pl-vip", price: "35" }],
    },
    {
      id: "prod-b-6205", sku: "BRG-6205-2RS", nameAr: "محمل كرات 6205-2RS", nameEn: "Ball Bearing 6205-2RS",
      categoryId: "cat-dg", wac: "22.00", minStock: "20",
      spec: { bearingNumber: "6205-2RS", bearingType: "Deep Groove Ball Bearing", innerMm: "25", outerMm: "52", widthMm: "15", brand: "NSK", origin: "CN", sealType: "2RS" },
      prices: [{ plId: "pl-wholesale", price: "30" }, { plId: "pl-semi", price: "36" }, { plId: "pl-retail", price: "45" }, { plId: "pl-vip", price: "42" }],
    },
    {
      id: "prod-b-6206", sku: "BRG-6206-ZZ", nameAr: "محمل كرات 6206-ZZ", nameEn: "Ball Bearing 6206-ZZ",
      categoryId: "cat-dg", wac: "28.00", minStock: "15",
      spec: { bearingNumber: "6206-ZZ", bearingType: "Deep Groove Ball Bearing", innerMm: "30", outerMm: "62", widthMm: "16", brand: "FAG", origin: "DE", sealType: "ZZ" },
      prices: [{ plId: "pl-wholesale", price: "38" }, { plId: "pl-semi", price: "46" }, { plId: "pl-retail", price: "58" }, { plId: "pl-vip", price: "53" }],
    },
    {
      id: "prod-b-6207", sku: "BRG-6207-2RS", nameAr: "محمل كرات 6207-2RS", nameEn: "Ball Bearing 6207-2RS",
      categoryId: "cat-dg", wac: "35.00", minStock: "15",
      spec: { bearingNumber: "6207-2RS", bearingType: "Deep Groove Ball Bearing", innerMm: "35", outerMm: "72", widthMm: "17", brand: "SKF", origin: "DE", sealType: "2RS" },
      prices: [{ plId: "pl-wholesale", price: "48" }, { plId: "pl-semi", price: "58" }, { plId: "pl-retail", price: "72" }, { plId: "pl-vip", price: "66" }],
    },
    {
      id: "prod-b-30205", sku: "BRG-30205", nameAr: "محمل مخروطي 30205", nameEn: "Tapered Roller Bearing 30205",
      categoryId: "cat-tr", wac: "55.00", minStock: "10",
      spec: { bearingNumber: "30205", bearingType: "Tapered Roller Bearing", innerMm: "25", outerMm: "52", widthMm: "16.25", brand: "TIMKEN", origin: "CN", sealType: "open" },
      prices: [{ plId: "pl-wholesale", price: "75" }, { plId: "pl-semi", price: "90" }, { plId: "pl-retail", price: "115" }, { plId: "pl-vip", price: "105" }],
    },
    {
      id: "prod-b-30206", sku: "BRG-30206", nameAr: "محمل مخروطي 30206", nameEn: "Tapered Roller Bearing 30206",
      categoryId: "cat-tr", wac: "65.00", minStock: "10",
      spec: { bearingNumber: "30206", bearingType: "Tapered Roller Bearing", innerMm: "30", outerMm: "62", widthMm: "17.25", brand: "TIMKEN", origin: "CN", sealType: "open" },
      prices: [{ plId: "pl-wholesale", price: "88" }, { plId: "pl-semi", price: "106" }, { plId: "pl-retail", price: "135" }, { plId: "pl-vip", price: "123" }],
    },
    {
      id: "prod-b-nu205", sku: "BRG-NU205", nameAr: "محمل أسطواني NU205", nameEn: "Cylindrical Roller Bearing NU205",
      categoryId: "cat-cr", wac: "80.00", minStock: "8",
      spec: { bearingNumber: "NU205", bearingType: "Cylindrical Roller Bearing", innerMm: "25", outerMm: "52", widthMm: "15", brand: "NTN", origin: "CN", sealType: "open" },
      prices: [{ plId: "pl-wholesale", price: "110" }, { plId: "pl-semi", price: "132" }, { plId: "pl-retail", price: "168" }, { plId: "pl-vip", price: "153" }],
    },
    {
      id: "prod-b-51105", sku: "BRG-51105", nameAr: "محمل دفعي 51105", nameEn: "Thrust Ball Bearing 51105",
      categoryId: "cat-th", wac: "45.00", minStock: "10",
      spec: { bearingNumber: "51105", bearingType: "Thrust Ball Bearing", innerMm: "25", outerMm: "42", widthMm: "11", brand: "NSK", origin: "CN", sealType: "open" },
      prices: [{ plId: "pl-wholesale", price: "62" }, { plId: "pl-semi", price: "74" }, { plId: "pl-retail", price: "95" }, { plId: "pl-vip", price: "87" }],
    },
    {
      id: "prod-b-1205", sku: "BRG-1205-ETN9", nameAr: "محمل ذاتي المحاذاة 1205", nameEn: "Self-Aligning Ball Bearing 1205",
      categoryId: "cat-sa", wac: "52.00", minStock: "8",
      spec: { bearingNumber: "1205 ETN9", bearingType: "Self-Aligning Ball Bearing", innerMm: "25", outerMm: "52", widthMm: "15", brand: "SKF", origin: "DE", sealType: "open" },
      prices: [{ plId: "pl-wholesale", price: "72" }, { plId: "pl-semi", price: "86" }, { plId: "pl-retail", price: "110" }, { plId: "pl-vip", price: "100" }],
    },
    {
      id: "prod-b-ucf205", sku: "BRG-UCF205", nameAr: "وحدة تحمل على قاعدة UCF205", nameEn: "Pillow Block Bearing Unit UCF205",
      categoryId: "cat-pb", wac: "120.00", minStock: "5",
      spec: { bearingNumber: "UCF205", bearingType: "Flange Block Bearing Unit", innerMm: "25", outerMm: "52", widthMm: "15", brand: "NTN", origin: "CN", sealType: "2RS" },
      prices: [{ plId: "pl-wholesale", price: "165" }, { plId: "pl-semi", price: "198" }, { plId: "pl-retail", price: "250" }, { plId: "pl-vip", price: "228" }],
    },
  ];

  for (const bp of bearingDefs) {
    await prisma.product.upsert({
      where:  { id: bp.id },
      update: {},
      create: {
        id: bp.id, sku: bp.sku, nameAr: bp.nameAr, nameEn: bp.nameEn,
        productType: ProductType.BEARING, categoryId: bp.categoryId,
        unitOfMeasure: UnitOfMeasure.PIECE, piecesPerBox: 10, boxesPerCarton: 5,
        minStockLevel: d(bp.minStock), isActive: true, currentWAC: d(bp.wac),
      },
    });

    await prisma.bearingSpec.upsert({
      where:  { productId: bp.id },
      update: {},
      create: {
        productId: bp.id,
        bearingNumber: bp.spec.bearingNumber, bearingType: bp.spec.bearingType,
        innerDiameterMm: d(bp.spec.innerMm), outerDiameterMm: d(bp.spec.outerMm),
        widthMm: d(bp.spec.widthMm), brand: bp.spec.brand,
        originCountry: bp.spec.origin, sealType: bp.spec.sealType,
      },
    });

    for (const price of bp.prices) {
      await prisma.productPrice.upsert({
        where:  { productId_priceListId_minQty: { productId: bp.id, priceListId: price.plId, minQty: d(1) } },
        update: { unitPrice: d(price.price) },
        create: { productId: bp.id, priceListId: price.plId, unitPrice: d(price.price), minQty: d(1) },
      });
    }
  }

  console.log(`     ✓ 10 bearing products with specs and prices`);

  // -------------------------------------------------------------------------
  // 10. SPARE PART PRODUCTS (10 products)
  // -------------------------------------------------------------------------
  console.log("  → Creating spare part products...");

  type SparePartDef = {
    id: string; sku: string; nameAr: string; nameEn: string; categoryId: string;
    wac: string; minStock: string;
    spec: { partNumber: string; brand: string; oemType: OemType; origin: string };
    compatible: { applianceBrand: string; modelNumber: string }[];
    prices: { plId: string; price: string }[];
  };

  const sparePartDefs: SparePartDef[] = [
    {
      id: "prod-sp-wm-drum", sku: "SP-WM-DRUM-6204", nameAr: "محمل أسطوانة غسالة 6204",
      nameEn: "Washing Machine Drum Bearing 6204", categoryId: "cat-sp-wm",
      wac: "25.00", minStock: "30",
      spec: { partNumber: "WM-DRUM-6204", brand: "Generic", oemType: OemType.AFTERMARKET, origin: "CN" },
      compatible: [
        { applianceBrand: "Samsung", modelNumber: "WF1702" },
        { applianceBrand: "LG",      modelNumber: "WM3700" },
        { applianceBrand: "Toshiba", modelNumber: "AW-DC1100" },
      ],
      prices: [{ plId: "pl-wholesale", price: "35" }, { plId: "pl-semi", price: "42" }, { plId: "pl-retail", price: "55" }, { plId: "pl-vip", price: "50" }],
    },
    {
      id: "prod-sp-wm-pump", sku: "SP-WM-PUMP-LG", nameAr: "مضخة تصريف غسالة LG",
      nameEn: "LG Washing Machine Drain Pump", categoryId: "cat-sp-wm",
      wac: "85.00", minStock: "15",
      spec: { partNumber: "5859EA1004D", brand: "LG", oemType: OemType.OEM, origin: "KR" },
      compatible: [
        { applianceBrand: "LG", modelNumber: "WD-14310FD" },
        { applianceBrand: "LG", modelNumber: "WD-14380TP" },
      ],
      prices: [{ plId: "pl-wholesale", price: "115" }, { plId: "pl-semi", price: "138" }, { plId: "pl-retail", price: "175" }, { plId: "pl-vip", price: "160" }],
    },
    {
      id: "prod-sp-rf-comp", sku: "SP-RF-COMP-SAMSUNG", nameAr: "كمبروسر ثلاجة سامسونج",
      nameEn: "Samsung Refrigerator Compressor", categoryId: "cat-sp-rf",
      wac: "350.00", minStock: "5",
      spec: { partNumber: "DA97-07584A", brand: "Samsung", oemType: OemType.OEM, origin: "KR" },
      compatible: [
        { applianceBrand: "Samsung", modelNumber: "RT29K" },
        { applianceBrand: "Samsung", modelNumber: "RF23R" },
      ],
      prices: [{ plId: "pl-wholesale", price: "480" }, { plId: "pl-semi", price: "576" }, { plId: "pl-retail", price: "720" }, { plId: "pl-vip", price: "660" }],
    },
    {
      id: "prod-sp-rf-therm", sku: "SP-RF-THERM-001", nameAr: "ترموستات ثلاجة عام",
      nameEn: "Universal Refrigerator Thermostat", categoryId: "cat-sp-rf",
      wac: "28.00", minStock: "20",
      spec: { partNumber: "K59-L1102", brand: "Ranco", oemType: OemType.AFTERMARKET, origin: "TR" },
      compatible: [
        { applianceBrand: "Sharp",   modelNumber: "SJ-58C" },
        { applianceBrand: "Toshiba", modelNumber: "GR-RG395EX" },
        { applianceBrand: "LG",      modelNumber: "GR-B207BLCU" },
      ],
      prices: [{ plId: "pl-wholesale", price: "38" }, { plId: "pl-semi", price: "46" }, { plId: "pl-retail", price: "58" }, { plId: "pl-vip", price: "53" }],
    },
    {
      id: "prod-sp-ac-fan", sku: "SP-AC-FANMOTOR-CARRIER", nameAr: "موتور مروحة تكييف كاريير",
      nameEn: "Carrier AC Fan Motor", categoryId: "cat-sp-ac",
      wac: "180.00", minStock: "8",
      spec: { partNumber: "HC39GE233", brand: "Carrier", oemType: OemType.OEM, origin: "US" },
      compatible: [
        { applianceBrand: "Carrier", modelNumber: "42QHC012" },
        { applianceBrand: "Carrier", modelNumber: "42QHC018" },
      ],
      prices: [{ plId: "pl-wholesale", price: "245" }, { plId: "pl-semi", price: "295" }, { plId: "pl-retail", price: "375" }, { plId: "pl-vip", price: "343" }],
    },
    {
      id: "prod-sp-ac-cap", sku: "SP-AC-CAPACITOR-45UF", nameAr: "مكثف تكييف 45 ميكروفاراد",
      nameEn: "AC Run Capacitor 45μF 450V", categoryId: "cat-sp-ac",
      wac: "22.00", minStock: "25",
      spec: { partNumber: "CAP-45UF-450V", brand: "Generic", oemType: OemType.AFTERMARKET, origin: "CN" },
      compatible: [
        { applianceBrand: "Carrier", modelNumber: "" },
        { applianceBrand: "LG",      modelNumber: "" },
        { applianceBrand: "Samsung", modelNumber: "" },
      ],
      prices: [{ plId: "pl-wholesale", price: "30" }, { plId: "pl-semi", price: "36" }, { plId: "pl-retail", price: "45" }, { plId: "pl-vip", price: "41" }],
    },
    {
      id: "prod-sp-ov-ignit", sku: "SP-OV-IGNITOR-001", nameAr: "مشعل موقد فرن عام",
      nameEn: "Universal Gas Oven Ignitor", categoryId: "cat-sp-ov",
      wac: "15.00", minStock: "30",
      spec: { partNumber: "IGN-G001", brand: "Generic", oemType: OemType.AFTERMARKET, origin: "CN" },
      compatible: [
        { applianceBrand: "Sharp", modelNumber: "" },
        { applianceBrand: "Toshiba", modelNumber: "" },
      ],
      prices: [{ plId: "pl-wholesale", price: "22" }, { plId: "pl-semi", price: "26" }, { plId: "pl-retail", price: "33" }, { plId: "pl-vip", price: "30" }],
    },
    {
      id: "prod-sp-ov-sensor", sku: "SP-OV-TEMP-SENSOR", nameAr: "حساس حرارة فرن",
      nameEn: "Oven Temperature Sensor NTC", categoryId: "cat-sp-ov",
      wac: "32.00", minStock: "15",
      spec: { partNumber: "NTC-OV-100K", brand: "Generic", oemType: OemType.AFTERMARKET, origin: "TR" },
      compatible: [
        { applianceBrand: "Sharp",   modelNumber: "R-72A0" },
        { applianceBrand: "Samsung", modelNumber: "NQ70M7770DG" },
      ],
      prices: [{ plId: "pl-wholesale", price: "44" }, { plId: "pl-semi", price: "53" }, { plId: "pl-retail", price: "67" }, { plId: "pl-vip", price: "61" }],
    },
    {
      id: "prod-sp-dw-pump", sku: "SP-DW-PUMP-BOSCH", nameAr: "مضخة غسالة أطباق بوش",
      nameEn: "Bosch Dishwasher Circulation Pump", categoryId: "cat-sp-dw",
      wac: "220.00", minStock: "6",
      spec: { partNumber: "00651956", brand: "Bosch", oemType: OemType.OEM, origin: "DE" },
      compatible: [
        { applianceBrand: "Bosch",   modelNumber: "SMS46II01E" },
        { applianceBrand: "Bosch",   modelNumber: "SMV46IX01E" },
      ],
      prices: [{ plId: "pl-wholesale", price: "300" }, { plId: "pl-semi", price: "360" }, { plId: "pl-retail", price: "455" }, { plId: "pl-vip", price: "416" }],
    },
    {
      id: "prod-sp-dw-spray", sku: "SP-DW-SPRAY-ARM", nameAr: "ذراع رش مياه غسالة أطباق",
      nameEn: "Dishwasher Spray Arm Universal", categoryId: "cat-sp-dw",
      wac: "35.00", minStock: "12",
      spec: { partNumber: "DW-SPRAY-UNI", brand: "Generic", oemType: OemType.AFTERMARKET, origin: "CN" },
      compatible: [
        { applianceBrand: "Bosch",   modelNumber: "" },
        { applianceBrand: "Samsung", modelNumber: "" },
        { applianceBrand: "LG",      modelNumber: "" },
      ],
      prices: [{ plId: "pl-wholesale", price: "48" }, { plId: "pl-semi", price: "58" }, { plId: "pl-retail", price: "73" }, { plId: "pl-vip", price: "67" }],
    },
  ];

  for (const sp of sparePartDefs) {
    await prisma.product.upsert({
      where:  { id: sp.id },
      update: {},
      create: {
        id: sp.id, sku: sp.sku, nameAr: sp.nameAr, nameEn: sp.nameEn,
        productType: ProductType.SPARE_PART, categoryId: sp.categoryId,
        unitOfMeasure: UnitOfMeasure.PIECE, minStockLevel: d(sp.minStock),
        isActive: true, currentWAC: d(sp.wac),
      },
    });

    const specRecord = await prisma.sparePartSpec.upsert({
      where:  { productId: sp.id },
      update: {},
      create: {
        productId: sp.id, partNumber: sp.spec.partNumber,
        brand: sp.spec.brand, oemType: sp.spec.oemType,
        originCountry: sp.spec.origin,
      },
    });

    for (const cm of sp.compatible) {
      await prisma.compatibleModel.upsert({
        where:  { sparePartSpecId_applianceBrand_modelNumber: { sparePartSpecId: specRecord.id, applianceBrand: cm.applianceBrand, modelNumber: (cm.modelNumber || '') as any } },
        update: {},
        create: { sparePartSpecId: specRecord.id, applianceBrand: cm.applianceBrand, modelNumber: cm.modelNumber || null },
      });
    }

    for (const price of sp.prices) {
      await prisma.productPrice.upsert({
        where:  { productId_priceListId_minQty: { productId: sp.id, priceListId: price.plId, minQty: d(1) } },
        update: { unitPrice: d(price.price) },
        create: { productId: sp.id, priceListId: price.plId, unitPrice: d(price.price), minQty: d(1) },
      });
    }
  }

  console.log(`     ✓ 10 spare part products with specs, compatible models, and prices`);

  // -------------------------------------------------------------------------
  // 11. CUSTOMERS
  // -------------------------------------------------------------------------
  console.log("  → Creating customers...");

  const custA = await prisma.customer.upsert({
    where:  { code: "CUST-0001" },
    update: {},
    create: {
      code: "CUST-0001", nameAr: "محلات النور للمحامل", nameEn: "Al-Nour Bearings Shop",
      customerType: CustomerType.WHOLESALE, governorate: "القاهرة", area: "السيدة زينب",
      phone: "+201001234567", whatsappNumber: "+201001234567",
      salesRepId: salesRep.id, priceListId: plWholesale.id,
      creditLimitEGP: d(50000), creditDays: 30,
      segment: CustomerSegment.VIP, tags: ["bearings", "wholesale"],
      isActive: true, currentBalanceEGP: d(0),
    },
  });

  const custB = await prisma.customer.upsert({
    where:  { code: "CUST-0002" },
    update: {},
    create: {
      code: "CUST-0002", nameAr: "ورشة الأمل لصيانة الأجهزة", nameEn: "Al-Amal Appliance Repair Workshop",
      customerType: CustomerType.WORKSHOP, governorate: "الإسكندرية", area: "سيدي بشر",
      phone: "+201113456789", whatsappNumber: "+201113456789",
      salesRepId: salesRep.id, priceListId: plSemiWholesale.id,
      creditLimitEGP: d(10000), creditDays: 15,
      segment: CustomerSegment.REGULAR, tags: ["repair", "spare-parts"],
      isActive: true, currentBalanceEGP: d(0),
    },
  });

  const custC = await prisma.customer.upsert({
    where:  { code: "CUST-0003" },
    update: {},
    create: {
      code: "CUST-0003", nameAr: "شركة الشروق للتوزيع", nameEn: "El-Shorouk Distribution Co.",
      customerType: CustomerType.COMPANY, governorate: "الجيزة", area: "6 أكتوبر",
      phone: "+201222345678", email: "orders@shorouk-dist.com",
      taxNumber: "987-654-321",
      salesRepId: salesRep.id, priceListId: plWholesale.id,
      creditLimitEGP: d(100000), creditDays: 45,
      segment: CustomerSegment.VIP, tags: ["distribution", "company"],
      isActive: true, currentBalanceEGP: d(0),
    },
  });

  const custD = await prisma.customer.upsert({
    where:  { code: "CUST-0004" },
    update: {},
    create: {
      code: "CUST-0004", nameAr: "أحمد سامي - متجر تجزئة", nameEn: "Ahmed Sami Retail Store",
      customerType: CustomerType.RETAIL, governorate: "الدقهلية", area: "المنصورة",
      phone: "+201551234567",
      priceListId: plRetail.id, creditLimitEGP: d(0), creditDays: 0,
      segment: CustomerSegment.REGULAR, tags: ["retail"],
      isActive: true, currentBalanceEGP: d(0),
    },
  });

  const custE = await prisma.customer.upsert({
    where:  { code: "CUST-0005" },
    update: {},
    create: {
      code: "CUST-0005", nameAr: "ورشة الأصيل لصيانة التكييف", nameEn: "Al-Aseel AC Maintenance",
      customerType: CustomerType.WORKSHOP, governorate: "أسوان", area: "مدينة أسوان",
      phone: "+201661234567", whatsappNumber: "+201661234567",
      priceListId: plSemiWholesale.id, creditLimitEGP: d(5000), creditDays: 7,
      segment: CustomerSegment.REGULAR, tags: ["ac", "repair"],
      isActive: true, currentBalanceEGP: d(0),
    },
  });

  console.log(`     ✓ 5 customers created`);

  // -------------------------------------------------------------------------
  // 12. PURCHASE ORDER 1 — Chinese bearings (RECEIVED)
  // -------------------------------------------------------------------------
  console.log("  → Creating Purchase Order 1 (bearings from China)...");

  const po1 = await prisma.purchaseOrder.upsert({
    where:  { poNumber: "PO-2025-001" },
    update: {},
    create: {
      poNumber: "PO-2025-001", supplierId: supplierCN.id,
      status: POStatus.RECEIVED, orderDate: new Date("2025-01-10"),
      expectedDate: new Date("2025-02-20"),
      currency: "USD", exchangeRate: d("48.50"),
      subtotalForeign: d("2500.00"), subtotalEGP: d("121250.00"),
      createdBy: owner.id,
    },
  });

  // PO Items for PO1
  const po1Items = [
    { id: "poi-1-6204", productId: "prod-b-6204", qtyOrdered: "100", unitForeign: "0.38", unitEGP: "18.43" },
    { id: "poi-1-6205", productId: "prod-b-6205", qtyOrdered: "100", unitForeign: "0.45", unitEGP: "21.83" },
    { id: "poi-1-6206", productId: "prod-b-6206", qtyOrdered: "80",  unitForeign: "0.57", unitEGP: "27.65" },
    { id: "poi-1-6207", productId: "prod-b-6207", qtyOrdered: "60",  unitForeign: "0.72", unitEGP: "34.92" },
    { id: "poi-1-30205",productId: "prod-b-30205",qtyOrdered: "50",  unitForeign: "1.10", unitEGP: "53.35" },
  ];

  for (const item of po1Items) {
    await prisma.pOItem.upsert({
      where:  { id: item.id },
      update: {},
      create: {
        id: item.id, poId: po1.id, productId: item.productId,
        quantityOrdered: d(item.qtyOrdered), quantityReceived: d(item.qtyOrdered),
        unitPriceForeign: d(item.unitForeign), unitPriceEGP: d(item.unitEGP),
        landedCostPerUnit: d(item.unitEGP), totalLandedCostEGP: d((parseFloat(item.qtyOrdered) * parseFloat(item.unitEGP)).toFixed(2)),
      },
    });
  }

  // Shipment for PO1
  const ship1 = await prisma.shipment.upsert({
    where:  { poId: po1.id },
    update: {},
    create: {
      poId: po1.id, shipmentNumber: "SHP-2025-001",
      status: POStatus.RECEIVED,
      etd: new Date("2025-01-25"), eta: new Date("2025-02-15"),
      portArrivalDate: new Date("2025-02-18"), customsClearanceDate: new Date("2025-02-22"),
      receivedDate: new Date("2025-02-25"),
      freightCostEGP: d("3500.00"), customsDutyEGP: d("4800.00"),
      clearanceFeesEGP: d("1200.00"), localTransportEGP: d("800.00"),
      otherCostsEGP: d("200.00"), totalLandedCostEGP: d("10500.00"),
      allocationMethod: ShipmentAllocationMethod.BY_VALUE,
      carrierName: "COSCO Shipping", trackingNumber: "COSU1234567890",
    },
  });

  // Goods Receipt for PO1
  const gr1 = await prisma.goodsReceipt.upsert({
    where:  { receiptNumber: "GR-2025-001" },
    update: {},
    create: {
      poId: po1.id, shipmentId: ship1.id,
      receiptNumber: "GR-2025-001", receiptDate: new Date("2025-02-25"),
      receivedByUserId: manager.id, receivedByName: manager.name,
    },
  });

  const grItems1 = [
    { id: "gri-1-6204", poItemId: "poi-1-6204", productId: "prod-b-6204", qty: "100", unitCost: "18.50" },
    { id: "gri-1-6205", poItemId: "poi-1-6205", productId: "prod-b-6205", qty: "100", unitCost: "22.00" },
    { id: "gri-1-6206", poItemId: "poi-1-6206", productId: "prod-b-6206", qty: "80",  unitCost: "28.00" },
    { id: "gri-1-6207", poItemId: "poi-1-6207", productId: "prod-b-6207", qty: "60",  unitCost: "35.00" },
    { id: "gri-1-30205",poItemId: "poi-1-30205",productId: "prod-b-30205",qty: "50",  unitCost: "55.00" },
  ];

  for (const gri of grItems1) {
    await prisma.goodsReceiptItem.upsert({
      where:  { id: gri.id },
      update: {},
      create: {
        id: gri.id, receiptId: gr1.id, poItemId: gri.poItemId,
        productId: gri.productId, warehouseId: wMain.id,
        quantityReceived: d(gri.qty), unitCostEGP: d(gri.unitCost),
        totalCostEGP: d((parseFloat(gri.qty) * parseFloat(gri.unitCost)).toFixed(2)),
        previousWAC: d(0), newWAC: d(gri.unitCost),
      },
    });

    // Update product warehouse stock
    await prisma.productWarehouse.upsert({
      where:  { productId_warehouseId: { productId: gri.productId, warehouseId: wMain.id } },
      update: { quantityOnHand: { increment: parseFloat(gri.qty) } },
      create: {
        productId: gri.productId, warehouseId: wMain.id,
        quantityOnHand: d(gri.qty), shelfLocation: "A-01",
      },
    });
  }

  console.log(`     ✓ PO-2025-001: 5 bearing items received into Main Warehouse`);

  // -------------------------------------------------------------------------
  // 13. PURCHASE ORDER 2 — Turkish spare parts (RECEIVED)
  // -------------------------------------------------------------------------
  console.log("  → Creating Purchase Order 2 (spare parts from Türkiye)...");

  const po2 = await prisma.purchaseOrder.upsert({
    where:  { poNumber: "PO-2025-002" },
    update: {},
    create: {
      poNumber: "PO-2025-002", supplierId: supplierTR.id,
      status: POStatus.RECEIVED, orderDate: new Date("2025-02-01"),
      expectedDate: new Date("2025-03-01"),
      currency: "USD", exchangeRate: d("48.80"),
      subtotalForeign: d("3200.00"), subtotalEGP: d("156160.00"),
      createdBy: owner.id,
    },
  });

  const po2Items = [
    { id: "poi-2-rf-therm", productId: "prod-sp-rf-therm", qtyOrdered: "100", unitForeign: "0.56", unitEGP: "27.33" },
    { id: "poi-2-ov-ignit",  productId: "prod-sp-ov-ignit",  qtyOrdered: "200", unitForeign: "0.30", unitEGP: "14.64" },
    { id: "poi-2-ov-sensor", productId: "prod-sp-ov-sensor", qtyOrdered: "80",  unitForeign: "0.64", unitEGP: "31.23" },
    { id: "poi-2-ac-cap",    productId: "prod-sp-ac-cap",    qtyOrdered: "150", unitForeign: "0.44", unitEGP: "21.47" },
    { id: "poi-2-wm-drum",   productId: "prod-sp-wm-drum",   qtyOrdered: "120", unitForeign: "0.50", unitEGP: "24.40" },
  ];

  for (const item of po2Items) {
    await prisma.pOItem.upsert({
      where:  { id: item.id },
      update: {},
      create: {
        id: item.id, poId: po2.id, productId: item.productId,
        quantityOrdered: d(item.qtyOrdered), quantityReceived: d(item.qtyOrdered),
        unitPriceForeign: d(item.unitForeign), unitPriceEGP: d(item.unitEGP),
        landedCostPerUnit: d(item.unitEGP), totalLandedCostEGP: d((parseFloat(item.qtyOrdered) * parseFloat(item.unitEGP)).toFixed(2)),
      },
    });
  }

  const ship2 = await prisma.shipment.upsert({
    where:  { poId: po2.id },
    update: {},
    create: {
      poId: po2.id, shipmentNumber: "SHP-2025-002",
      status: POStatus.RECEIVED,
      etd: new Date("2025-02-10"), eta: new Date("2025-03-05"),
      portArrivalDate: new Date("2025-03-07"), customsClearanceDate: new Date("2025-03-10"),
      receivedDate: new Date("2025-03-12"),
      freightCostEGP: d("2800.00"), customsDutyEGP: d("3500.00"),
      clearanceFeesEGP: d("950.00"), localTransportEGP: d("600.00"),
      otherCostsEGP: d("150.00"), totalLandedCostEGP: d("8000.00"),
      allocationMethod: ShipmentAllocationMethod.BY_VALUE,
      carrierName: "Turkish Cargo Lines", trackingNumber: "TCL9876543210",
    },
  });

  const gr2 = await prisma.goodsReceipt.upsert({
    where:  { receiptNumber: "GR-2025-002" },
    update: {},
    create: {
      poId: po2.id, shipmentId: ship2.id,
      receiptNumber: "GR-2025-002", receiptDate: new Date("2025-03-12"),
      receivedByUserId: manager.id, receivedByName: manager.name,
    },
  });

  const grItems2 = [
    { id: "gri-2-rf-therm", poItemId: "poi-2-rf-therm", productId: "prod-sp-rf-therm", qty: "100", unitCost: "28.00" },
    { id: "gri-2-ov-ignit",  poItemId: "poi-2-ov-ignit",  productId: "prod-sp-ov-ignit",  qty: "200", unitCost: "15.00" },
    { id: "gri-2-ov-sensor", poItemId: "poi-2-ov-sensor", productId: "prod-sp-ov-sensor", qty: "80",  unitCost: "32.00" },
    { id: "gri-2-ac-cap",    poItemId: "poi-2-ac-cap",    productId: "prod-sp-ac-cap",    qty: "150", unitCost: "22.00" },
    { id: "gri-2-wm-drum",   poItemId: "poi-2-wm-drum",   productId: "prod-sp-wm-drum",   qty: "120", unitCost: "25.00" },
  ];

  for (const gri of grItems2) {
    await prisma.goodsReceiptItem.upsert({
      where:  { id: gri.id },
      update: {},
      create: {
        id: gri.id, receiptId: gr2.id, poItemId: gri.poItemId,
        productId: gri.productId, warehouseId: wMain.id,
        quantityReceived: d(gri.qty), unitCostEGP: d(gri.unitCost),
        totalCostEGP: d((parseFloat(gri.qty) * parseFloat(gri.unitCost)).toFixed(2)),
        previousWAC: d(0), newWAC: d(gri.unitCost),
      },
    });

    await prisma.productWarehouse.upsert({
      where:  { productId_warehouseId: { productId: gri.productId, warehouseId: wMain.id } },
      update: { quantityOnHand: { increment: parseFloat(gri.qty) } },
      create: {
        productId: gri.productId, warehouseId: wMain.id,
        quantityOnHand: d(gri.qty), shelfLocation: "B-01",
      },
    });
  }

  console.log(`     ✓ PO-2025-002: 5 spare-part items received into Main Warehouse`);

  // -------------------------------------------------------------------------
  // 14. INVOICES
  // -------------------------------------------------------------------------
  console.log("  → Creating invoices...");

  // Invoice 1 — PAID
  const inv1 = await prisma.invoice.upsert({
    where:  { invoiceNumber: "INV-2025-001" },
    update: {},
    create: {
      invoiceNumber: "INV-2025-001", customerId: custA.id,
      salesRepId: salesRep.id, invoiceDate: new Date("2025-03-15"),
      dueDate: new Date("2025-04-14"), status: InvoiceStatus.PAID,
      currency: "EGP", exchangeRate: d(1),
      subtotal: d("3050.00"), discountTotal: d("150.00"),
      taxPct: d(0), taxTotal: d(0),
      grandTotal: d("2900.00"), paidAmount: d("2900.00"), balanceDue: d(0),
      createdBy: salesRepUser.id,
    },
  });

  await prisma.invoiceItem.upsert({
    where:  { id: "ii-1-6204" },
    update: {},
    create: {
      id: "ii-1-6204", invoiceId: inv1.id, productId: "prod-b-6204",
      warehouseId: wMain.id, quantity: d(50), unitPrice: d("25.00"),
      discountPct: d(0), lineTotal: d("1250.00"),
      costAtSale: d("18.50"), grossProfit: d("325.00"), grossProfitPct: d("26.00"),
    },
  });

  await prisma.invoiceItem.upsert({
    where:  { id: "ii-1-6205" },
    update: {},
    create: {
      id: "ii-1-6205", invoiceId: inv1.id, productId: "prod-b-6205",
      warehouseId: wMain.id, quantity: d(40), unitPrice: d("30.00"),
      discountPct: d(0), lineTotal: d("1200.00"),
      costAtSale: d("22.00"), grossProfit: d("320.00"), grossProfitPct: d("26.67"),
    },
  });

  await prisma.invoiceItem.upsert({
    where:  { id: "ii-1-wmdrum" },
    update: {},
    create: {
      id: "ii-1-wmdrum", invoiceId: inv1.id, productId: "prod-sp-wm-drum",
      warehouseId: wMain.id, quantity: d(17), unitPrice: d("35.00"),
      discountPct: d(0), lineTotal: d("595.00"),
      costAtSale: d("25.00"), grossProfit: d("170.00"), grossProfitPct: d("28.57"),
    },
  });

  // Payment for Invoice 1
  await prisma.customerPayment.upsert({
    where:  { id: "cpay-1-cash" },
    update: {},
    create: {
      id: "cpay-1-cash", invoiceId: inv1.id, customerId: custA.id,
      paymentDate: new Date("2025-03-20"), amount: d("2900.00"),
      paymentMethod: PaymentMethod.CASH, accountId: accCash.id,
      reference: "RCPT-0001", notes: "دفع نقدي كامل",
    },
  });

  // Invoice 2 — PARTIALLY_PAID
  const inv2 = await prisma.invoice.upsert({
    where:  { invoiceNumber: "INV-2025-002" },
    update: {},
    create: {
      invoiceNumber: "INV-2025-002", customerId: custB.id,
      salesRepId: salesRep.id, invoiceDate: new Date("2025-04-01"),
      dueDate: new Date("2025-04-16"), status: InvoiceStatus.PARTIALLY_PAID,
      currency: "EGP", exchangeRate: d(1),
      subtotal: d("5400.00"), discountTotal: d("0"),
      taxPct: d(0), taxTotal: d(0),
      grandTotal: d("5400.00"), paidAmount: d("2000.00"), balanceDue: d("3400.00"),
      createdBy: salesRepUser.id,
    },
  });

  await prisma.invoiceItem.upsert({
    where:  { id: "ii-2-rfcomp" },
    update: {},
    create: {
      id: "ii-2-rfcomp", invoiceId: inv2.id, productId: "prod-sp-rf-comp",
      warehouseId: wMain.id, quantity: d(6), unitPrice: d("480.00"),
      discountPct: d(0), lineTotal: d("2880.00"),
      costAtSale: d("350.00"), grossProfit: d("780.00"), grossProfitPct: d("27.08"),
    },
  });

  await prisma.invoiceItem.upsert({
    where:  { id: "ii-2-acfan" },
    update: {},
    create: {
      id: "ii-2-acfan", invoiceId: inv2.id, productId: "prod-sp-ac-fan",
      warehouseId: wMain.id, quantity: d(8), unitPrice: d("245.00"),
      discountPct: d(0), lineTotal: d("1960.00"),
      costAtSale: d("180.00"), grossProfit: d("520.00"), grossProfitPct: d("26.53"),
    },
  });

  await prisma.invoiceItem.upsert({
    where:  { id: "ii-2-rftherm" },
    update: {},
    create: {
      id: "ii-2-rftherm", invoiceId: inv2.id, productId: "prod-sp-rf-therm",
      warehouseId: wMain.id, quantity: d(15), unitPrice: d("37.33"),
      discountPct: d(0), lineTotal: d("560.00"),
      costAtSale: d("28.00"), grossProfit: d("138.00"), grossProfitPct: d("24.64"),
    },
  });

  // Partial payment for Invoice 2
  await prisma.customerPayment.upsert({
    where:  { id: "cpay-2-bank" },
    update: {},
    create: {
      id: "cpay-2-bank", invoiceId: inv2.id, customerId: custB.id,
      paymentDate: new Date("2025-04-05"), amount: d("2000.00"),
      paymentMethod: PaymentMethod.BANK_TRANSFER, accountId: accBank.id,
      reference: "TRF-20250405-001",
    },
  });

  // Invoice 3 — OVERDUE
  const inv3 = await prisma.invoice.upsert({
    where:  { invoiceNumber: "INV-2025-003" },
    update: {},
    create: {
      invoiceNumber: "INV-2025-003", customerId: custC.id,
      salesRepId: salesRep.id, invoiceDate: new Date("2025-03-01"),
      dueDate: new Date("2025-04-15"), status: InvoiceStatus.OVERDUE,
      currency: "EGP", exchangeRate: d(1),
      subtotal: d("12750.00"), discountTotal: d("750.00"),
      taxPct: d(0), taxTotal: d(0),
      grandTotal: d("12000.00"), paidAmount: d(0), balanceDue: d("12000.00"),
      createdBy: salesRepUser.id,
      internalNotes: "العميل يتأخر في السداد — يتطلب متابعة",
    },
  });

  await prisma.invoiceItem.upsert({
    where:  { id: "ii-3-30205" },
    update: {},
    create: {
      id: "ii-3-30205", invoiceId: inv3.id, productId: "prod-b-30205",
      warehouseId: wMain.id, quantity: d(80), unitPrice: d("75.00"),
      discountPct: d(0), lineTotal: d("6000.00"),
      costAtSale: d("55.00"), grossProfit: d("1600.00"), grossProfitPct: d("26.67"),
    },
  });

  await prisma.invoiceItem.upsert({
    where:  { id: "ii-3-30206" },
    update: {},
    create: {
      id: "ii-3-30206", invoiceId: inv3.id, productId: "prod-b-30206",
      warehouseId: wMain.id, quantity: d(60), unitPrice: d("88.00"),
      discountPct: d(0), lineTotal: d("5280.00"),
      costAtSale: d("65.00"), grossProfit: d("1380.00"), grossProfitPct: d("26.14"),
    },
  });

  await prisma.invoiceItem.upsert({
    where:  { id: "ii-3-nu205" },
    update: {},
    create: {
      id: "ii-3-nu205", invoiceId: inv3.id, productId: "prod-b-nu205",
      warehouseId: wMain.id, quantity: d(13), unitPrice: d("110.00"),
      discountPct: d(0), lineTotal: d("1430.00"),
      costAtSale: d("80.00"), grossProfit: d("390.00"), grossProfitPct: d("27.27"),
    },
  });

  console.log(`     ✓ 3 invoices (INV-2025-001 PAID, INV-2025-002 PARTIALLY_PAID, INV-2025-003 OVERDUE)`);

  // -------------------------------------------------------------------------
  // 15. CHEQUES
  // -------------------------------------------------------------------------
  console.log("  → Creating cheques...");

  const cheque1 = await prisma.cheque.upsert({
    where:  { id: "chq-001" },
    update: {},
    create: {
      id: "chq-001", chequeNumber: "001234",
      bankName: "بنك مصر", accountHolderName: custA.nameAr,
      amount: d("5000.00"), issueDate: new Date("2025-04-01"),
      dueDate: new Date("2025-05-01"),
      direction: ChequeDirection.RECEIVED, status: ChequeStatus.PENDING,
      relatedEntityType: "CUSTOMER", relatedEntityId: custA.id,
      relatedEntityName: custA.nameAr,
      notes: "شيك لأجل دفعة جزئية INV-2025-003",
    },
  });

  const cheque2 = await prisma.cheque.upsert({
    where:  { id: "chq-002" },
    update: {},
    create: {
      id: "chq-002", chequeNumber: "009876",
      bankName: "البنك الأهلي المصري", accountHolderName: custB.nameAr,
      amount: d("3400.00"), issueDate: new Date("2025-03-15"),
      dueDate: new Date("2025-04-15"),
      direction: ChequeDirection.RECEIVED, status: ChequeStatus.CLEARED,
      relatedEntityType: "CUSTOMER", relatedEntityId: custB.id,
      relatedEntityName: custB.nameAr,
      depositedDate: new Date("2025-04-10"), clearedDate: new Date("2025-04-15"),
      notes: "تم صرفه وتحصيله بنجاح",
    },
  });

  console.log(`     ✓ 2 cheques (PENDING, CLEARED)`);

  // -------------------------------------------------------------------------
  // 16. EXPENSES
  // -------------------------------------------------------------------------
  console.log("  → Creating expenses...");

  await prisma.expense.upsert({
    where:  { id: "exp-001" },
    update: {},
    create: {
      id: "exp-001",
      categoryId: "exp-cat-rent", expenseDate: new Date("2025-04-01"),
      amount: d("8000.00"), currency: "EGP", exchangeRate: d(1), amountEGP: d("8000.00"),
      description: "إيجار المخزن الرئيسي — أبريل 2025",
      financialAccountId: accCash.id,
      isRecurring: true, recurringFrequency: "MONTHLY",
      nextDueDate: new Date("2025-05-01"),
      createdByUserId: owner.id, createdByName: owner.name,
    },
  });

  await prisma.expense.upsert({
    where:  { id: "exp-002" },
    update: {},
    create: {
      id: "exp-002",
      categoryId: "exp-cat-electric", expenseDate: new Date("2025-04-05"),
      amount: d("1250.00"), currency: "EGP", exchangeRate: d(1), amountEGP: d("1250.00"),
      description: "فاتورة كهرباء المخزن — مارس 2025",
      financialAccountId: accCash.id,
      isRecurring: false,
      createdByUserId: cashier.id, createdByName: cashier.name,
    },
  });

  console.log(`     ✓ 2 expenses (Rent, Electricity)`);

  // -------------------------------------------------------------------------
  // DONE
  // -------------------------------------------------------------------------
  console.log("\n✅  Seed completed successfully!");
  console.log("    Users:");
  console.log(`      owner@erp.local   / Password123!  (OWNER)`);
  console.log(`      manager@erp.local / Password123!  (MANAGER)`);
  console.log(`      sales@erp.local   / Password123!  (SALES_REP)`);
  console.log(`      cashier@erp.local / Password123!  (CASHIER)`);
}

main()
  .catch((e) => {
    console.error("❌  Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
