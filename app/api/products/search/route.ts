import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { canSeeCosts } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const showCost = canSeeCosts(session?.user?.role);

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q')?.trim() || '';
    const innerDiameter = searchParams.get('innerDiameter');
    const outerDiameter = searchParams.get('outerDiameter');
    const width = searchParams.get('width');
    const applianceBrand = searchParams.get('applianceBrand');
    const priceListId = searchParams.get('priceListId');

    const where: any = { isActive: true };

    if (query) {
      where.OR = [
        { sku: { contains: query, mode: 'insensitive' } },
        { barcode: { contains: query, mode: 'insensitive' } },
        { nameAr: { contains: query, mode: 'insensitive' } },
        { nameEn: { contains: query, mode: 'insensitive' } },
        // Bearing number
        {
          bearingSpec: {
            OR: [
              { bearingNumber: { contains: query, mode: 'insensitive' } },
              { brand: { contains: query, mode: 'insensitive' } },
              { bearingType: { contains: query, mode: 'insensitive' } },
            ],
          },
        },
        // Spare part number & compatible models
        {
          sparePartSpec: {
            OR: [
              { partNumber: { contains: query, mode: 'insensitive' } },
              { brand: { contains: query, mode: 'insensitive' } },
              {
                compatibleModels: {
                  some: {
                    OR: [
                      { applianceBrand: { contains: query, mode: 'insensitive' } },
                      { modelNumber: { contains: query, mode: 'insensitive' } },
                    ],
                  },
                },
              },
            ],
          },
        },
        // Cross reference numbers
        {
          crossReferences: {
            some: {
              OR: [
                { alternateNumber: { contains: query, mode: 'insensitive' } },
                { alternateBrand: { contains: query, mode: 'insensitive' } },
              ],
            },
          },
        },
      ];
    }

    // Dimension search for bearings
    if (innerDiameter || outerDiameter || width) {
      where.bearingSpec = {
        ...(where.bearingSpec || {}),
        ...(innerDiameter ? { innerDiameterMm: parseFloat(innerDiameter) } : {}),
        ...(outerDiameter ? { outerDiameterMm: parseFloat(outerDiameter) } : {}),
        ...(width ? { widthMm: parseFloat(width) } : {}),
      };
    }

    // Specific appliance brand search for spare parts
    if (applianceBrand) {
      where.sparePartSpec = {
        ...(where.sparePartSpec || {}),
        compatibleModels: {
          some: {
            applianceBrand: { contains: applianceBrand, mode: 'insensitive' },
          },
        },
      };
    }

    const products = await prisma.product.findMany({
      where,
      take: 50,
      include: {
        category: { select: { id: true, nameAr: true, nameEn: true } },
        bearingSpec: true,
        sparePartSpec: {
          include: { compatibleModels: true },
        },
        crossReferences: true,
        warehouses: {
          include: {
            warehouse: { select: { id: true, nameAr: true, nameEn: true } },
          },
        },
        productPrices: {
          where: priceListId ? { priceListId } : undefined,
          include: {
            priceList: { select: { id: true, nameAr: true, nameEn: true, type: true } },
          },
        },
      },
      orderBy: { nameAr: 'asc' },
    });

    // Sanitize cost if user is not authorized
    const sanitized = products.map((prod) => {
      const totalStock = prod.warehouses.reduce(
        (sum, w) => sum + Number(w.quantityOnHand),
        0
      );

      return {
        id: prod.id,
        sku: prod.sku,
        barcode: prod.barcode,
        nameAr: prod.nameAr,
        nameEn: prod.nameEn,
        productType: prod.productType,
        unitOfMeasure: prod.unitOfMeasure,
        piecesPerBox: prod.piecesPerBox,
        boxesPerCarton: prod.boxesPerCarton,
        minStockLevel: Number(prod.minStockLevel),
        images: prod.images,
        totalStock,
        currentWAC: showCost ? Number(prod.currentWAC) : undefined,
        category: prod.category,
        bearingSpec: prod.bearingSpec,
        sparePartSpec: prod.sparePartSpec,
        crossReferences: prod.crossReferences,
        warehouses: prod.warehouses.map((w) => ({
          warehouseId: w.warehouseId,
          warehouseNameAr: w.warehouse.nameAr,
          warehouseNameEn: w.warehouse.nameEn,
          shelfLocation: w.shelfLocation,
          quantityOnHand: Number(w.quantityOnHand),
        })),
        prices: prod.productPrices.map((p) => ({
          priceListId: p.priceListId,
          priceListName: p.priceList.nameAr,
          priceListType: p.priceList.type,
          unitPrice: Number(p.unitPrice),
          minQty: Number(p.minQty),
        })),
      };
    });

    return NextResponse.json({ success: true, data: sanitized });
  } catch (error: any) {
    console.error('Error searching products:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Product search failed' },
      { status: 500 }
    );
  }
}
