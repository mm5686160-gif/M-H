import Decimal from 'decimal.js';

// ─────────────────────────────────────────────────────────────────────────────
// Module 8 & 9: Analytics, Reports & Excel Import – Unit Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('Module 9: Egyptian Tax Authority (ETA) 14% VAT Return Logic', () => {
  function calculateVATReturn(
    salesLines: { taxableAmount: number; vatRate: number }[],
    purchaseLines: { taxableAmount: number; vatRate: number }[],
  ) {
    const outputVAT = salesLines.reduce(
      (sum, line) => sum.plus(new Decimal(line.taxableAmount).mul(line.vatRate / 100)),
      new Decimal(0),
    );

    const inputVAT = purchaseLines.reduce(
      (sum, line) => sum.plus(new Decimal(line.taxableAmount).mul(line.vatRate / 100)),
      new Decimal(0),
    );

    const netVATPayable = outputVAT.minus(inputVAT);

    return {
      outputVAT: outputVAT.toNumber(),
      inputVAT: inputVAT.toNumber(),
      netVATPayable: netVATPayable.toNumber(),
    };
  }

  test('calculates correct 14% output VAT on sales invoices', () => {
    const sales = [
      { taxableAmount: 10000, vatRate: 14 },
      { taxableAmount: 5000, vatRate: 14 },
    ];
    const purchases = [{ taxableAmount: 8000, vatRate: 14 }];

    const result = calculateVATReturn(sales, purchases);

    // Output: 15,000 * 0.14 = 2,100
    expect(result.outputVAT).toBe(2100);
    // Input: 8,000 * 0.14 = 1,120
    expect(result.inputVAT).toBe(1120);
    // Net Payable: 2,100 - 1,120 = 980
    expect(result.netVATPayable).toBe(980);
  });

  test('handles tax credit (refund/carryforward) when input VAT exceeds output VAT', () => {
    // Heavy import/purchase month: input VAT > output VAT
    const sales = [{ taxableAmount: 20000, vatRate: 14 }];
    const purchases = [{ taxableAmount: 50000, vatRate: 14 }];

    const result = calculateVATReturn(sales, purchases);

    expect(result.outputVAT).toBe(2800);
    expect(result.inputVAT).toBe(7000);
    expect(result.netVATPayable).toBe(-4200);
    expect(result.netVATPayable < 0).toBe(true);
  });

  test('precision calculation with decimals prevents cent/piastre rounding errors', () => {
    const sales = [
      { taxableAmount: 1234.56, vatRate: 14 },
      { taxableAmount: 7890.12, vatRate: 14 },
    ];
    const purchases = [{ taxableAmount: 4567.89, vatRate: 14 }];

    const result = calculateVATReturn(sales, purchases);

    // 1234.56 * 0.14 = 172.8384
    // 7890.12 * 0.14 = 1104.6168
    // Output = 1277.4552
    // Input = 4567.89 * 0.14 = 639.5046
    // Net = 637.9506
    expect(result.netVATPayable).toBeCloseTo(637.9506, 4);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('Module 8 & 9: Inventory Valuation & Dead Stock Analytics', () => {
  interface InventoryValuationItem {
    sku: string;
    quantity: number;
    wac: number;
    daysSinceLastSale: number;
  }

  function evaluateInventory(items: InventoryValuationItem[]) {
    let totalValuation = new Decimal(0);
    let totalUnits = new Decimal(0);
    const deadStock: string[] = [];

    for (const item of items) {
      const qty = new Decimal(item.quantity);
      const wac = new Decimal(item.wac);
      totalValuation = totalValuation.plus(qty.mul(wac));
      totalUnits = totalUnits.plus(qty);

      if (qty.gt(0) && item.daysSinceLastSale > 90) {
        deadStock.push(item.sku);
      }
    }

    return {
      totalValuation: totalValuation.toNumber(),
      totalUnits: totalUnits.toNumber(),
      deadStock,
    };
  }

  test('calculates accurate company-wide stock valuation based on WAC', () => {
    const stock: InventoryValuationItem[] = [
      { sku: '6204-2RS', quantity: 200, wac: 120, daysSinceLastSale: 5 },
      { sku: '6308-ZZ', quantity: 80, wac: 350, daysSinceLastSale: 20 },
      { sku: 'MOTOR-10KG', quantity: 15, wac: 1450, daysSinceLastSale: 12 },
    ];

    const result = evaluateInventory(stock);

    // 200*120 + 80*350 + 15*1450 = 24000 + 28000 + 21750 = 73750
    expect(result.totalUnits).toBe(295);
    expect(result.totalValuation).toBe(73750);
    expect(result.deadStock.length).toBe(0);
  });

  test('accurately identifies dead stock items not sold in > 90 days', () => {
    const stock: InventoryValuationItem[] = [
      { sku: 'SLOW-BEARING-01', quantity: 50, wac: 400, daysSinceLastSale: 120 },
      { sku: 'FAST-BEARING-02', quantity: 100, wac: 150, daysSinceLastSale: 3 },
      { sku: 'DEAD-SPARE-03', quantity: 10, wac: 900, daysSinceLastSale: 240 },
      { sku: 'OUT-OF-STOCK', quantity: 0, wac: 50, daysSinceLastSale: 180 }, // 0 qty is not dead stock on shelf
    ];

    const result = evaluateInventory(stock);

    expect(result.deadStock).toEqual(['SLOW-BEARING-01', 'DEAD-SPARE-03']);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('Module 9: Excel Bulk Import Parsers and Sanitize Logic', () => {
  interface RawProductRow {
    sku: string;
    nameAr: string;
    productType: string;
    wac: number;
    priceWholesale: number;
    priceRetail: number;
    d?: number;
    D?: number;
    B?: number;
  }

  function validateProductImportRow(row: RawProductRow) {
    if (!row.sku || row.sku.trim().length === 0) return { valid: false, error: 'SKU is required' };
    if (!row.nameAr || row.nameAr.trim().length === 0) return { valid: false, error: 'nameAr is required' };
    if (row.priceRetail < row.priceWholesale) {
      return { valid: false, error: 'Retail price cannot be lower than wholesale price' };
    }
    if (row.productType === 'BEARING') {
      if (row.d && row.D && row.d >= row.D) {
        return { valid: false, error: 'Inner diameter d must be less than outer diameter D' };
      }
    }
    return { valid: true };
  }

  test('validates correct product and bearing dimensions (d < D)', () => {
    const validBearing: RawProductRow = {
      sku: '6000-2RS',
      nameAr: 'رولمان بلي 6000',
      productType: 'BEARING',
      wac: 35,
      priceWholesale: 45,
      priceRetail: 55,
      d: 10,
      D: 26,
      B: 8,
    };

    expect(validateProductImportRow(validBearing).valid).toBe(true);
  });

  test('rejects bearing with impossible physical dimensions (d >= D)', () => {
    const invalidBearing: RawProductRow = {
      sku: 'INVALID-BEARING',
      nameAr: 'بلي خاطئ',
      productType: 'BEARING',
      wac: 50,
      priceWholesale: 70,
      priceRetail: 90,
      d: 50,
      D: 40, // Outer smaller than inner
      B: 10,
    };

    const res = validateProductImportRow(invalidBearing);
    expect(res.valid).toBe(false);
    expect(res.error).toContain('Inner diameter d must be less than outer diameter D');
  });

  test('rejects row where retail price is lower than wholesale price', () => {
    const invertedPricing: RawProductRow = {
      sku: 'PRICING-ERR',
      nameAr: 'صنف تسعير خاطئ',
      productType: 'SPARE_PART',
      wac: 100,
      priceWholesale: 150,
      priceRetail: 120, // Lower than wholesale!
    };

    const res = validateProductImportRow(invertedPricing);
    expect(res.valid).toBe(false);
    expect(res.error).toContain('Retail price cannot be lower than wholesale price');
  });
});
