import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { canSeeCosts, canManageProducts } from '@/lib/utils';
import Decimal from 'decimal.js';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    const showCost = canSeeCosts(session?.user?.role);
    const { id } = params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        bearingSpec: true,
        sparePartSpec: {
          include: { compatibleModels: true },
        },
        crossReferences: true,
        costHistory: {
          orderBy: { effectiveDate: 'desc' },
          take: 20,
        },
        warehouses: {
          include: { warehouse: true },
        },
        productPrices: {
          include: { priceList: true },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const totalStock = product.warehouses.reduce(
      (sum, w) => sum + Number(w.quantityOnHand),
      0
    );

    const sanitized = {
      ...product,
      minStockLevel: Number(product.minStockLevel),
      currentWAC: showCost ? Number(product.currentWAC) : undefined,
      totalStock,
      costHistory: showCost
        ? product.costHistory.map((c) => ({
            ...c,
            costPerUnit: Number(c.costPerUnit),
            previousCost: c.previousCost ? Number(c.previousCost) : null,
            quantityAtTime: c.quantityAtTime ? Number(c.quantityAtTime) : null,
          }))
        : [],
      warehouses: product.warehouses.map((w) => ({
        id: w.id,
        warehouseId: w.warehouseId,
        warehouseNameAr: w.warehouse.nameAr,
        warehouseNameEn: w.warehouse.nameEn,
        shelfLocation: w.shelfLocation,
        quantityOnHand: Number(w.quantityOnHand),
      })),
      productPrices: product.productPrices.map((p) => ({
        id: p.id,
        priceListId: p.priceListId,
        priceListName: p.priceList.nameAr,
        priceListType: p.priceList.type,
        unitPrice: Number(p.unitPrice),
        minQty: Number(p.minQty),
      })),
    };

    return NextResponse.json({ success: true, data: sanitized });
  } catch (error: any) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch product' },
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

    if (!canManageProducts(session.user.role)) {
      return NextResponse.json(
        { error: 'You do not have permission to edit products' },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await req.json();

    const existing = await prisma.product.findUnique({
      where: { id },
      include: { bearingSpec: true, sparePartSpec: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const prod = await tx.product.update({
        where: { id },
        data: {
          nameAr: body.nameAr ?? existing.nameAr,
          nameEn: body.nameEn ?? existing.nameEn,
          barcode: body.barcode !== undefined ? body.barcode : existing.barcode,
          categoryId: body.categoryId ?? existing.categoryId,
          unitOfMeasure: body.unitOfMeasure ?? existing.unitOfMeasure,
          piecesPerBox: body.piecesPerBox !== undefined ? parseInt(body.piecesPerBox) : existing.piecesPerBox,
          boxesPerCarton: body.boxesPerCarton !== undefined ? parseInt(body.boxesPerCarton) : existing.boxesPerCarton,
          minStockLevel: body.minStockLevel !== undefined ? new Decimal(body.minStockLevel) : existing.minStockLevel,
          images: body.images ?? existing.images,
          notes: body.notes !== undefined ? body.notes : existing.notes,
        },
      });

      // Update bearing spec
      if (existing.productType === 'BEARING' && body.bearingSpec) {
        await tx.bearingSpec.upsert({
          where: { productId: id },
          update: {
            bearingNumber: body.bearingSpec.bearingNumber,
            bearingType: body.bearingSpec.bearingType,
            innerDiameterMm: body.bearingSpec.innerDiameterMm ? new Decimal(body.bearingSpec.innerDiameterMm) : undefined,
            outerDiameterMm: body.bearingSpec.outerDiameterMm ? new Decimal(body.bearingSpec.outerDiameterMm) : undefined,
            widthMm: body.bearingSpec.widthMm ? new Decimal(body.bearingSpec.widthMm) : undefined,
            brand: body.bearingSpec.brand,
            originCountry: body.bearingSpec.originCountry,
            sealType: body.bearingSpec.sealType,
            material: body.bearingSpec.material,
            notes: body.bearingSpec.notes,
          },
          create: {
            productId: id,
            bearingNumber: body.bearingSpec.bearingNumber,
            bearingType: body.bearingSpec.bearingType || 'Deep Groove Ball',
            innerDiameterMm: new Decimal(body.bearingSpec.innerDiameterMm || 0),
            outerDiameterMm: new Decimal(body.bearingSpec.outerDiameterMm || 0),
            widthMm: new Decimal(body.bearingSpec.widthMm || 0),
            brand: body.bearingSpec.brand || 'Generic',
            originCountry: body.bearingSpec.originCountry || 'Unknown',
            sealType: body.bearingSpec.sealType || '2RS',
          },
        });
      }

      // Update spare part spec
      if (existing.productType === 'SPARE_PART' && body.sparePartSpec) {
        const spec = await tx.sparePartSpec.upsert({
          where: { productId: id },
          update: {
            partNumber: body.sparePartSpec.partNumber,
            brand: body.sparePartSpec.brand,
            oemType: body.sparePartSpec.oemType,
            originCountry: body.sparePartSpec.originCountry,
            notes: body.sparePartSpec.notes,
          },
          create: {
            productId: id,
            partNumber: body.sparePartSpec.partNumber,
            brand: body.sparePartSpec.brand || 'Generic',
            oemType: body.sparePartSpec.oemType || 'AFTERMARKET',
            originCountry: body.sparePartSpec.originCountry || 'Unknown',
          },
        });

        if (body.sparePartSpec.compatibleModels) {
          await tx.compatibleModel.deleteMany({ where: { sparePartSpecId: spec.id } });
          for (const cm of body.sparePartSpec.compatibleModels) {
            if (cm.applianceBrand) {
              await tx.compatibleModel.create({
                data: {
                  sparePartSpecId: spec.id,
                  applianceBrand: cm.applianceBrand,
                  modelNumber: cm.modelNumber || null,
                  notes: cm.notes || null,
                },
              });
            }
          }
        }
      }

      // Update cross references
      if (body.crossReferences && Array.isArray(body.crossReferences)) {
        await tx.crossReference.deleteMany({ where: { productId: id } });
        for (const cr of body.crossReferences) {
          if (cr.alternateNumber) {
            await tx.crossReference.create({
              data: {
                productId: id,
                alternateNumber: cr.alternateNumber,
                alternateBrand: cr.alternateBrand || null,
                notes: cr.notes || null,
              },
            });
          }
        }
      }

      // Update prices
      if (body.prices && Array.isArray(body.prices)) {
        for (const p of body.prices) {
          if (p.priceListId && p.unitPrice !== undefined) {
            await tx.productPrice.upsert({
              where: {
                productId_priceListId_minQty: {
                  productId: id,
                  priceListId: p.priceListId,
                  minQty: new Decimal(p.minQty || 1),
                },
              },
              update: { unitPrice: new Decimal(p.unitPrice) },
              create: {
                productId: id,
                priceListId: p.priceListId,
                unitPrice: new Decimal(p.unitPrice),
                minQty: new Decimal(p.minQty || 1),
              },
            });
          }
        }
      }

      // Audit Log
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          userName: session.user.name || 'User',
          action: 'UPDATE',
          entityType: 'PRODUCT',
          entityId: id,
          afterData: body,
        },
      });

      return prod;
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update product' },
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

    if (!canManageProducts(session.user.role)) {
      return NextResponse.json(
        { error: 'You do not have permission to delete products' },
        { status: 403 }
      );
    }

    const { id } = params;

    // Check if product is part of existing invoices
    const invoiceCount = await prisma.invoiceItem.count({ where: { productId: id } });
    if (invoiceCount > 0) {
      // Soft-delete to preserve invoice audit integrity
      await prisma.product.update({
        where: { id },
        data: { isActive: false },
      });
      return NextResponse.json({
        success: true,
        message: 'تم تعطيل المنتج بنجاح (لا يمكن حذفه نهائياً لوجود فواتير مرتبطة به)',
      });
    }

    await prisma.product.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'تم حذف المنتج بنجاح' });
  } catch (error: any) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete product' },
      { status: 500 }
    );
  }
}
