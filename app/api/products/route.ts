import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { canSeeCosts, canManageProducts } from '@/lib/utils';
import Decimal from 'decimal.js';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const showCost = canSeeCosts(session?.user?.role);

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const skip = (page - 1) * limit;

    const query = searchParams.get('q')?.trim() || '';
    const type = searchParams.get('type'); // BEARING | SPARE_PART
    const categoryId = searchParams.get('categoryId');
    const lowStockOnly = searchParams.get('lowStock') === 'true';

    const where: any = { isActive: true };

    if (type) where.productType = type;
    if (categoryId) where.categoryId = categoryId;

    if (query) {
      where.OR = [
        { sku: { contains: query, mode: 'insensitive' } },
        { barcode: { contains: query, mode: 'insensitive' } },
        { nameAr: { contains: query, mode: 'insensitive' } },
        { nameEn: { contains: query, mode: 'insensitive' } },
        {
          bearingSpec: {
            OR: [
              { bearingNumber: { contains: query, mode: 'insensitive' } },
              { brand: { contains: query, mode: 'insensitive' } },
            ],
          },
        },
        {
          sparePartSpec: {
            OR: [
              { partNumber: { contains: query, mode: 'insensitive' } },
              { brand: { contains: query, mode: 'insensitive' } },
            ],
          },
        },
        {
          crossReferences: {
            some: {
              alternateNumber: { contains: query, mode: 'insensitive' },
            },
          },
        },
      ];
    }

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        skip,
        take: limit,
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
            include: {
              priceList: { select: { id: true, nameAr: true, nameEn: true, type: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    let data = products.map((prod) => {
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
        isLowStock: totalStock <= Number(prod.minStockLevel),
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

    if (lowStockOnly) {
      data = data.filter((item) => item.isLowStock);
    }

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!canManageProducts(session.user.role)) {
      return NextResponse.json(
        { error: 'You do not have permission to create products' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      sku,
      barcode,
      nameAr,
      nameEn,
      productType,
      categoryId,
      unitOfMeasure,
      piecesPerBox,
      boxesPerCarton,
      minStockLevel,
      images,
      notes,
      bearingSpec,
      sparePartSpec,
      crossReferences,
      prices,
      warehouses,
    } = body;

    if (!sku || !nameAr || !nameEn || !productType || !categoryId) {
      return NextResponse.json(
        { error: 'Missing required product fields (sku, nameAr, nameEn, productType, categoryId)' },
        { status: 400 }
      );
    }

    // Check duplicate SKU or barcode
    const existing = await prisma.product.findFirst({
      where: {
        OR: [
          { sku },
          ...(barcode ? [{ barcode }] : []),
        ],
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: existing.sku === sku ? 'كود الصنف (SKU) مستخدم بالفعل' : 'الباركود مسجل بالفعل' },
        { status: 409 }
      );
    }

    // Transactional creation
    const product = await prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          sku,
          barcode: barcode || null,
          nameAr,
          nameEn,
          productType,
          categoryId,
          unitOfMeasure: unitOfMeasure || 'PIECE',
          piecesPerBox: piecesPerBox ? parseInt(piecesPerBox) : null,
          boxesPerCarton: boxesPerCarton ? parseInt(boxesPerCarton) : null,
          minStockLevel: new Decimal(minStockLevel || 0),
          images: images || [],
          notes: notes || null,
          currentWAC: new Decimal(0),
        },
      });

      // Bearing specs
      if (productType === 'BEARING' && bearingSpec) {
        await tx.bearingSpec.create({
          data: {
            productId: created.id,
            bearingNumber: bearingSpec.bearingNumber,
            bearingType: bearingSpec.bearingType || 'Deep Groove Ball',
            innerDiameterMm: new Decimal(bearingSpec.innerDiameterMm || 0),
            outerDiameterMm: new Decimal(bearingSpec.outerDiameterMm || 0),
            widthMm: new Decimal(bearingSpec.widthMm || 0),
            brand: bearingSpec.brand || 'Generic',
            originCountry: bearingSpec.originCountry || 'Unknown',
            sealType: bearingSpec.sealType || '2RS',
            material: bearingSpec.material || 'Chrome Steel',
            notes: bearingSpec.notes || null,
          },
        });
      }

      // Spare part specs
      if (productType === 'SPARE_PART' && sparePartSpec) {
        const createdSpec = await tx.sparePartSpec.create({
          data: {
            productId: created.id,
            partNumber: sparePartSpec.partNumber,
            brand: sparePartSpec.brand || 'Generic',
            oemType: sparePartSpec.oemType || 'AFTERMARKET',
            originCountry: sparePartSpec.originCountry || 'Unknown',
            notes: sparePartSpec.notes || null,
          },
        });

        if (sparePartSpec.compatibleModels && Array.isArray(sparePartSpec.compatibleModels)) {
          for (const cm of sparePartSpec.compatibleModels) {
            if (cm.applianceBrand) {
              await tx.compatibleModel.create({
                data: {
                  sparePartSpecId: createdSpec.id,
                  applianceBrand: cm.applianceBrand,
                  modelNumber: cm.modelNumber || null,
                  notes: cm.notes || null,
                },
              });
            }
          }
        }
      }

      // Cross references
      if (crossReferences && Array.isArray(crossReferences)) {
        for (const cr of crossReferences) {
          if (cr.alternateNumber) {
            await tx.crossReference.create({
              data: {
                productId: created.id,
                alternateNumber: cr.alternateNumber,
                alternateBrand: cr.alternateBrand || null,
                notes: cr.notes || null,
              },
            });
          }
        }
      }

      // Price lists prices
      if (prices && Array.isArray(prices)) {
        for (const p of prices) {
          if (p.priceListId && p.unitPrice !== undefined) {
            await tx.productPrice.create({
              data: {
                productId: created.id,
                priceListId: p.priceListId,
                unitPrice: new Decimal(p.unitPrice),
                minQty: new Decimal(p.minQty || 1),
              },
            });
          }
        }
      }

      // Warehouse stock initial allocations
      if (warehouses && Array.isArray(warehouses)) {
        for (const wh of warehouses) {
          if (wh.warehouseId) {
            await tx.productWarehouse.create({
              data: {
                productId: created.id,
                warehouseId: wh.warehouseId,
                shelfLocation: wh.shelfLocation || null,
                quantityOnHand: new Decimal(wh.quantityOnHand || 0),
              },
            });
          }
        }
      }

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          userName: session.user.name || 'User',
          action: 'CREATE',
          entityType: 'PRODUCT',
          entityId: created.id,
          afterData: { sku, nameAr, productType },
        },
      });

      return created;
    });

    return NextResponse.json({ success: true, data: product }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create product' },
      { status: 500 }
    );
  }
}
