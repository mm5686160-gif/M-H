import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { canManagePurchases, generateCode } from '@/lib/utils';
import Decimal from 'decimal.js';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const supplierId = searchParams.get('supplierId');
    const query = searchParams.get('q')?.trim() || '';

    const where: any = {};
    if (status) where.status = status;
    if (supplierId) where.supplierId = supplierId;
    if (query) {
      where.OR = [
        { poNumber: { contains: query, mode: 'insensitive' } },
        { supplier: { nameAr: { contains: query, mode: 'insensitive' } } },
        { supplier: { nameEn: { contains: query, mode: 'insensitive' } } },
        { shipment: { shipmentNumber: { contains: query, mode: 'insensitive' } } },
      ];
    }

    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where,
      include: {
        supplier: {
          select: { id: true, nameAr: true, nameEn: true, country: true, defaultCurrency: true },
        },
        shipment: true,
        items: {
          include: {
            product: {
              select: {
                id: true,
                sku: true,
                nameAr: true,
                nameEn: true,
                productType: true,
                unitOfMeasure: true,
                bearingSpec: { select: { bearingNumber: true, brand: true } },
                sparePartSpec: { select: { partNumber: true, brand: true } },
              },
            },
          },
        },
      },
      orderBy: { orderDate: 'desc' },
    });

    const data = purchaseOrders.map((po) => ({
      id: po.id,
      poNumber: po.poNumber,
      status: po.status,
      orderDate: po.orderDate,
      expectedDate: po.expectedDate,
      currency: po.currency,
      exchangeRate: Number(po.exchangeRate),
      subtotalForeign: Number(po.subtotalForeign),
      subtotalEGP: Number(po.subtotalEGP),
      notes: po.notes,
      supplier: po.supplier,
      shipment: po.shipment
        ? {
            ...po.shipment,
            freightCostEGP: Number(po.shipment.freightCostEGP),
            customsDutyEGP: Number(po.shipment.customsDutyEGP),
            clearanceFeesEGP: Number(po.shipment.clearanceFeesEGP),
            localTransportEGP: Number(po.shipment.localTransportEGP),
            otherCostsEGP: Number(po.shipment.otherCostsEGP),
            totalLandedCostEGP: Number(po.shipment.totalLandedCostEGP),
          }
        : null,
      itemsCount: po.items.length,
      items: po.items.map((it) => ({
        id: it.id,
        productId: it.productId,
        product: it.product,
        quantityOrdered: Number(it.quantityOrdered),
        quantityReceived: Number(it.quantityReceived),
        unitPriceForeign: Number(it.unitPriceForeign),
        unitPriceEGP: Number(it.unitPriceEGP),
        landedCostPerUnit: Number(it.landedCostPerUnit),
        totalLandedCostEGP: Number(it.totalLandedCostEGP),
      })),
    }));

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error fetching purchase orders:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch purchase orders' },
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

    if (!canManagePurchases(session.user.role)) {
      return NextResponse.json(
        { error: 'You do not have permission to create purchase orders' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      supplierId,
      poNumber: customPoNumber,
      orderDate,
      expectedDate,
      currency,
      exchangeRate,
      notes,
      items,
    } = body;

    if (!supplierId || !currency || !exchangeRate || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Supplier, currency, exchange rate, and at least 1 item are required' },
        { status: 400 }
      );
    }

    const exRate = new Decimal(exchangeRate);
    if (exRate.lte(0)) {
      return NextResponse.json(
        { error: 'Exchange rate must be greater than 0' },
        { status: 400 }
      );
    }

    // Generate PO number if not provided
    let poNumber = customPoNumber;
    if (!poNumber) {
      const count = await prisma.purchaseOrder.count();
      poNumber = generateCode('PO-', count);
    }

    // Calculate subtotal
    let subtotalForeign = new Decimal(0);
    const validatedItems = items.map((it: any) => {
      const qty = new Decimal(it.quantityOrdered || 1);
      const unitPriceForeign = new Decimal(it.unitPriceForeign || 0);
      const lineForeign = qty.times(unitPriceForeign);
      subtotalForeign = subtotalForeign.plus(lineForeign);
      const unitPriceEGP = unitPriceForeign.times(exRate);

      return {
        productId: it.productId,
        quantityOrdered: qty,
        unitPriceForeign,
        unitPriceEGP,
        notes: it.notes || null,
      };
    });

    const subtotalEGP = subtotalForeign.times(exRate);

    // Create PO and Shipment in transaction
    const createdPO = await prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.create({
        data: {
          poNumber,
          supplierId,
          status: 'ORDERED',
          orderDate: orderDate ? new Date(orderDate) : new Date(),
          expectedDate: expectedDate ? new Date(expectedDate) : null,
          currency,
          exchangeRate: exRate,
          subtotalForeign,
          subtotalEGP,
          notes: notes || null,
          createdBy: session.user.id,
          items: {
            create: validatedItems.map((it) => ({
              productId: it.productId,
              quantityOrdered: it.quantityOrdered,
              unitPriceForeign: it.unitPriceForeign,
              unitPriceEGP: it.unitPriceEGP,
            })),
          },
        },
      });

      // Create linked shipment tracking record
      const shipmentNumber = `SHP-${poNumber.replace('PO-', '')}`;
      await tx.shipment.create({
        data: {
          poId: po.id,
          shipmentNumber,
          status: 'ORDERED',
          etd: orderDate ? new Date(orderDate) : null,
          eta: expectedDate ? new Date(expectedDate) : null,
          freightCostEGP: new Decimal(0),
          customsDutyEGP: new Decimal(0),
          clearanceFeesEGP: new Decimal(0),
          localTransportEGP: new Decimal(0),
          otherCostsEGP: new Decimal(0),
          totalLandedCostEGP: new Decimal(0),
          allocationMethod: 'BY_VALUE',
        },
      });

      // Update supplier balance (accrue payable in EGP)
      await tx.supplier.update({
        where: { id: supplierId },
        data: {
          currentBalance: { increment: subtotalEGP },
        },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          userName: session.user.name || 'User',
          action: 'CREATE',
          entityType: 'PURCHASE_ORDER',
          entityId: po.id,
          afterData: { poNumber, supplierId, totalEGP: subtotalEGP.toNumber() },
        },
      });

      return po;
    });

    return NextResponse.json({ success: true, data: createdPO }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating purchase order:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create purchase order' },
      { status: 500 }
    );
  }
}
