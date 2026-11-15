import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { canSeeCosts, canSeeProfit, generateCode } from '@/lib/utils';
import Decimal from 'decimal.js';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const userRole = session?.user?.role;
    const showCost = canSeeCosts(userRole);
    const showProfit = canSeeProfit(userRole);

    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q');
    const status = searchParams.get('status');
    const customerId = searchParams.get('customerId');
    const salesRepId = searchParams.get('salesRepId');

    const where: any = {};

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (salesRepId) {
      where.salesRepId = salesRepId;
    }

    if (q) {
      where.OR = [
        { invoiceNumber: { contains: q, mode: 'insensitive' } },
        { customer: { nameAr: { contains: q, mode: 'insensitive' } } },
        { customer: { nameEn: { contains: q, mode: 'insensitive' } } },
        { customer: { phone: { contains: q } } },
      ];
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        customer: { select: { id: true, code: true, nameAr: true, nameEn: true, phone: true } },
        salesRep: { select: { id: true, user: { select: { name: true } } } },
        items: {
          include: {
            product: {
              select: {
                id: true,
                sku: true,
                nameAr: true,
                nameEn: true,
                unitOfMeasure: true,
                bearingSpec: { select: { bearingNumber: true } },
                sparePartSpec: { select: { partNumber: true } },
              },
            },
          },
        },
        deliveryNote: { select: { id: true, status: true, deliveryNumber: true } },
      },
      orderBy: { invoiceDate: 'desc' },
      take: 100,
    });

    const data = invoices.map((inv) => {
      const grandTotal = Number(inv.grandTotal);
      const paidAmount = Number(inv.paidAmount);
      const balanceDue = Number(inv.balanceDue);

      const items = inv.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        warehouseId: item.warehouseId,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        discountPct: Number(item.discountPct),
        lineTotal: Number(item.lineTotal),
        costAtSale: showCost ? Number(item.costAtSale) : null,
        grossProfit: showProfit ? Number(item.grossProfit) : null,
        product: item.product,
      }));

      const totalCost = showCost
        ? items.reduce((acc, it) => acc + (it.costAtSale ? it.costAtSale * it.quantity : 0), 0)
        : null;

      const totalGrossProfit = showProfit && totalCost !== null ? grandTotal - totalCost : null;

      return {
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        invoiceDate: inv.invoiceDate,
        dueDate: inv.dueDate,
        status: inv.status,
        customer: inv.customer,
        salesRep: inv.salesRep ? { id: inv.salesRep.id, name: inv.salesRep.user.name } : null,
        grandTotal,
        paidAmount,
        balanceDue,
        totalCost,
        totalGrossProfit,
        itemCount: items.length,
        items,
        deliveryNote: inv.deliveryNote,
        notes: inv.notes,
      };
    });

    // Summary KPIs
    const totalSales = data.reduce((acc, inv) => acc + inv.grandTotal, 0);
    const totalCollected = data.reduce((acc, inv) => acc + inv.paidAmount, 0);
    const totalBalanceDue = data.reduce((acc, inv) => acc + inv.balanceDue, 0);
    const overdueCount = data.filter((inv) => inv.status === 'OVERDUE' || (inv.balanceDue > 0 && new Date(inv.dueDate) < new Date())).length;

    return NextResponse.json({
      success: true,
      kpis: {
        totalSales,
        totalCollected,
        totalBalanceDue,
        overdueCount,
      },
      data,
    });
  } catch (error: any) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch invoices' },
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

    const body = await req.json();
    const {
      customerId,
      warehouseId,
      salesRepId,
      invoiceDate,
      dueDate,
      items, // array of { productId, quantity, unitPrice, discountPct }
      paymentMethod, // 'CASH' | 'BANK_TRANSFER' | 'CHEQUE' | 'MOBILE_WALLET' | 'CREDIT'
      amountPaidImmediately,
      accountId,
      chequeDetails, // { chequeNumber, bankName, accountHolderName, dueDate }
      notes,
    } = body;

    if (!customerId || !warehouseId || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Customer, warehouse, and at least one item are required' },
        { status: 400 }
      );
    }

    // 1. Fetch customer and verify credit limit
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Auto-generate sequential invoice number
    const lastInvoice = await prisma.invoice.findFirst({
      orderBy: { invoiceNumber: 'desc' },
      select: { invoiceNumber: true },
    });
    const lastNum = lastInvoice?.invoiceNumber?.match(/\d+/)
      ? parseInt(lastInvoice.invoiceNumber.match(/\d+/)![0])
      : 0;
    const invoiceNumber = generateCode('INV-', lastNum);

    // 2. Fetch products for cost and stock validation
    const productIds = items.map((it: any) => it.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: {
        warehouses: { where: { warehouseId } },
      },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    // Calculate line items with WAC costs and stock checks
    let subtotal = new Decimal(0);
    const processedItems: any[] = [];

    for (const it of items) {
      const prod = productMap.get(it.productId);
      if (!prod) {
        return NextResponse.json(
          { error: `Product not found: ${it.productId}` },
          { status: 400 }
        );
      }

      const pw = prod.warehouses[0];
      const stockOnHand = pw ? new Decimal(pw.quantityOnHand.toString()) : new Decimal(0);
      const requestedQty = new Decimal(it.quantity);

      if (stockOnHand.lessThan(requestedQty)) {
        return NextResponse.json(
          {
            error: `Insufficient stock for ${prod.nameAr} (${prod.sku}) in selected warehouse. Available: ${stockOnHand}, Requested: ${requestedQty}`,
          },
          { status: 400 }
        );
      }

      const unitPrice = new Decimal(it.unitPrice);
      const discountPct = new Decimal(it.discountPct || 0);
      const discountMultiplier = new Decimal(1).minus(discountPct.dividedBy(100));
      const lineTotal = requestedQty.times(unitPrice).times(discountMultiplier);
      const costAtSale = new Decimal(prod.currentWAC.toString());
      const lineCost = requestedQty.times(costAtSale);
      const grossProfit = lineTotal.minus(lineCost);
      const grossProfitPct = lineTotal.isZero()
        ? new Decimal(0)
        : grossProfit.dividedBy(lineTotal).times(100);

      subtotal = subtotal.plus(lineTotal);

      processedItems.push({
        productId: it.productId,
        warehouseId,
        quantity: requestedQty,
        unitPrice,
        discountPct,
        lineTotal,
        costAtSale,
        grossProfit,
        grossProfitPct,
      });
    }

    const grandTotal = subtotal; // EGP
    const paidInitial = new Decimal(amountPaidImmediately || 0);
    const balanceDue = grandTotal.minus(paidInitial);

    // Check Credit Limit
    const currentBalance = new Decimal(customer.currentBalanceEGP.toString());
    const newProjectedBalance = currentBalance.plus(balanceDue);
    const creditLimit = new Decimal(customer.creditLimitEGP.toString());
    const isExceedingCreditLimit = creditLimit.greaterThan(0) && newProjectedBalance.greaterThan(creditLimit);

    let status: 'PAID' | 'PARTIALLY_PAID' | 'ISSUED' = 'ISSUED';
    if (balanceDue.isZero()) {
      status = 'PAID';
    } else if (paidInitial.greaterThan(0)) {
      status = 'PARTIALLY_PAID';
    }

    // Execute atomic transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Invoice
      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber,
          customerId,
          salesRepId: salesRepId || customer.salesRepId || null,
          invoiceDate: invoiceDate ? new Date(invoiceDate) : new Date(),
          dueDate: dueDate
            ? new Date(dueDate)
            : new Date(Date.now() + (customer.creditDays || 30) * 24 * 60 * 60 * 1000),
          status,
          currency: 'EGP',
          exchangeRate: 1,
          subtotal,
          discountTotal: 0,
          taxPct: 0,
          taxTotal: 0,
          grandTotal,
          paidAmount: paidInitial,
          balanceDue,
          notes: notes || null,
          createdBy: session.user.name || 'User',
          items: {
            create: processedItems.map((pi) => ({
              productId: pi.productId,
              warehouseId: pi.warehouseId,
              quantity: pi.quantity,
              unitPrice: pi.unitPrice,
              discountPct: pi.discountPct,
              lineTotal: pi.lineTotal,
              costAtSale: pi.costAtSale,
              grossProfit: pi.grossProfit,
              grossProfitPct: pi.grossProfitPct,
            })),
          },
        },
      });

      // 2. Decrement stock from ProductWarehouse
      for (const pi of processedItems) {
        await tx.productWarehouse.update({
          where: {
            productId_warehouseId: {
              productId: pi.productId,
              warehouseId: pi.warehouseId,
            },
          },
          data: {
            quantityOnHand: { decrement: pi.quantity },
          },
        });
      }

      // 3. Update customer balance and last purchase date
      await tx.customer.update({
        where: { id: customerId },
        data: {
          currentBalanceEGP: { increment: balanceDue },
          lastPurchaseDate: new Date(),
        },
      });

      // 4. Record Initial Payment (if paidInitial > 0)
      if (paidInitial.greaterThan(0) && accountId && paymentMethod) {
        let chequeId: string | null = null;

        // If paid by cheque, record Cheque first
        if (paymentMethod === 'CHEQUE' && chequeDetails) {
          const cheque = await tx.cheque.create({
            data: {
              chequeNumber: chequeDetails.chequeNumber,
              bankName: chequeDetails.bankName,
              accountHolderName: chequeDetails.accountHolderName || customer.nameAr,
              amount: paidInitial,
              issueDate: new Date(),
              dueDate: chequeDetails.dueDate ? new Date(chequeDetails.dueDate) : new Date(),
              direction: 'RECEIVED',
              status: 'PENDING',
              relatedEntityType: 'CUSTOMER',
              relatedEntityId: customerId,
              relatedEntityName: customer.nameAr,
              notes: `سداد فاتورة ${invoiceNumber}`,
            },
          });
          chequeId = cheque.id;
        }

        // Create CustomerPayment
        await tx.customerPayment.create({
          data: {
            invoiceId: invoice.id,
            customerId,
            paymentDate: invoiceDate ? new Date(invoiceDate) : new Date(),
            amount: paidInitial,
            paymentMethod: paymentMethod === 'CREDIT' ? 'CASH' : paymentMethod,
            accountId,
            chequeId,
            reference: `سداد فاتورة ${invoiceNumber}`,
            notes: `دفعة فورية مع إصدار الفاتورة`,
          },
        });

        // Increment financial account balance (for non-cheque cash/bank/wallet)
        if (paymentMethod !== 'CHEQUE') {
          await tx.financialAccount.update({
            where: { id: accountId },
            data: {
              currentBalance: { increment: paidInitial },
            },
          });

          await tx.accountTransaction.create({
            data: {
              financialAccountId: accountId,
              transactionDate: new Date(),
              transactionType: 'CREDIT',
              amount: paidInitial,
              balanceAfter: new Decimal(0), // Updated in background
              reference: invoiceNumber,
              description: `تحصيل فاتورة ${invoiceNumber} من العميل ${customer.nameAr}`,
              relatedEntityType: 'CUSTOMER',
              relatedEntityId: customerId,
            },
          });
        }
      }

      // 5. Create Delivery Note
      const lastDN = await tx.deliveryNote.findFirst({
        orderBy: { deliveryNumber: 'desc' },
        select: { deliveryNumber: true },
      });
      const lastDNNum = lastDN?.deliveryNumber?.match(/\d+/)
        ? parseInt(lastDN.deliveryNumber.match(/\d+/)![0])
        : 0;
      const deliveryNumber = generateCode('DN-', lastDNNum);

      await tx.deliveryNote.create({
        data: {
          deliveryNumber,
          invoiceId: invoice.id,
          deliveryDate: new Date(),
          status: 'PENDING',
          notes: `إذن تسليم تلقائي لفاتورة ${invoiceNumber}`,
        },
      });

      // 6. Audit Log
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          userName: session.user.name || 'User',
          action: 'CREATE',
          entityType: 'INVOICE',
          entityId: invoice.id,
          afterData: {
            invoiceNumber,
            customerId,
            grandTotal: grandTotal.toNumber(),
            paidAmount: paidInitial.toNumber(),
            balanceDue: balanceDue.toNumber(),
          },
        },
      });

      return { invoice, isExceedingCreditLimit, balanceDue: balanceDue.toNumber() };
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating sales invoice:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create invoice' },
      { status: 400 }
    );
  }
}
