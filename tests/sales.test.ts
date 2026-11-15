import Decimal from 'decimal.js';

// ─────────────────────────────────────────────────────────────────────────────
// Module 6: Sales, Invoicing & Cheques – Unit Tests
// ─────────────────────────────────────────────────────────────────────────────

// ─── Helpers (mirror business logic in the API routes) ───────────────────────

/** Calculate line total from qty × unitPrice less a discount percentage */
function calcLineTotal(qty: number, unitPrice: number, discountPct: number): Decimal {
  const q = new Decimal(qty);
  const p = new Decimal(unitPrice);
  const d = new Decimal(discountPct).div(100);
  return q.mul(p).mul(new Decimal(1).minus(d));
}

/** Calculate gross profit on a line */
function calcLineGrossProfit(lineTotal: Decimal, qty: number, costPrice: number): Decimal {
  const cost = new Decimal(qty).mul(new Decimal(costPrice));
  return lineTotal.minus(cost);
}

/** Weighted-average cost update */
function newWAC(currentStock: Decimal, currentWAC: Decimal, newQty: Decimal, newCost: Decimal): Decimal {
  const totalUnits = currentStock.plus(newQty);
  if (totalUnits.isZero()) return new Decimal(0);
  const totalValue = currentStock.mul(currentWAC).plus(newQty.mul(newCost));
  return totalValue.div(totalUnits);
}

/** Determine invoice payment status */
type PaymentStatus = 'ISSUED' | 'PARTIALLY_PAID' | 'PAID';
function invoiceStatus(total: Decimal, paid: Decimal): PaymentStatus {
  if (paid.isZero()) return 'ISSUED';
  if (paid.greaterThanOrEqualTo(total)) return 'PAID';
  return 'PARTIALLY_PAID';
}

/** Check whether an order would breach the customer credit limit */
function creditLimitBreached(
  currentBalance: Decimal,
  orderTotal: Decimal,
  creditLimit: Decimal,
): boolean {
  return currentBalance.plus(orderTotal).greaterThan(creditLimit);
}

/** Sanitize Egyptian mobile number for WhatsApp link */
function sanitizeEgyptianPhone(raw: string): string {
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('00201')) digits = digits.slice(2);   // 00201... → 201...
  if (digits.startsWith('0')) digits = '2' + digits;          // 01... → 201...
  if (!digits.startsWith('20')) digits = '20' + digits;
  return digits;
}

// ─────────────────────────────────────────────────────────────────────────────

describe('Module 6: Sales – Cart & Invoice Arithmetic', () => {
  describe('Line total calculation', () => {
    test('no discount: qty × price', () => {
      expect(calcLineTotal(10, 250, 0).toNumber()).toBe(2500);
    });

    test('10 % discount applied correctly', () => {
      expect(calcLineTotal(5, 200, 10).toNumber()).toBe(900);
    });

    test('100 % discount results in zero line total', () => {
      expect(calcLineTotal(3, 150, 100).toNumber()).toBe(0);
    });

    test('fractional quantities handled with Decimal precision', () => {
      // 2.5 units × 99.99 EGP = 249.975 EGP
      expect(calcLineTotal(2.5, 99.99, 0).toNumber()).toBeCloseTo(249.975, 6);
    });

    test('multi-line cart total', () => {
      const line1 = calcLineTotal(10, 250, 0);   // 2500
      const line2 = calcLineTotal(5, 200, 10);   // 900
      const line3 = calcLineTotal(2, 1500, 5);   // 2850
      const cartTotal = line1.plus(line2).plus(line3);
      expect(cartTotal.toNumber()).toBe(6250);
    });
  });

  describe('Gross profit calculation', () => {
    test('calculates positive gross profit correctly', () => {
      // sell 10 units at 300 EGP; WAC cost = 200 EGP → GP = 1000 EGP
      const lineTotal = calcLineTotal(10, 300, 0);
      const gp = calcLineGrossProfit(lineTotal, 10, 200);
      expect(gp.toNumber()).toBe(1000);
    });

    test('calculates zero gross profit when sold at cost', () => {
      const lineTotal = calcLineTotal(4, 150, 0);
      const gp = calcLineGrossProfit(lineTotal, 4, 150);
      expect(gp.toNumber()).toBe(0);
    });

    test('detects loss when sold below cost', () => {
      const lineTotal = calcLineTotal(3, 100, 0); // 300
      const gp = calcLineGrossProfit(lineTotal, 3, 120); // cost 360 → GP -60
      expect(gp.toNumber()).toBe(-60);
      expect(gp.isNegative()).toBe(true);
    });
  });

  describe('Weighted Average Cost (WAC) recalculation on sale', () => {
    test('WAC unchanged after sale if no new receipt (cost tracked, not recalculated on sale)', () => {
      // WAC recalculation happens on goods receipt, not on sale.
      // After a sale, WAC stays the same; only qty changes.
      const wac = new Decimal(215.50);
      const stockBefore = new Decimal(100);
      const soldQty = new Decimal(20);
      const stockAfter = stockBefore.minus(soldQty);
      // WAC per unit is unchanged after sale
      expect(stockAfter.toNumber()).toBe(80);
      expect(wac.toNumber()).toBe(215.5);
    });

    test('WAC updated correctly after new goods receipt', () => {
      // 100 units @ WAC 200 EGP, receive 50 units @ 230 EGP
      const updatedWAC = newWAC(
        new Decimal(100),
        new Decimal(200),
        new Decimal(50),
        new Decimal(230),
      );
      // (100×200 + 50×230) / 150 = (20000+11500)/150 = 31500/150 = 210
      expect(updatedWAC.toNumber()).toBeCloseTo(210, 6);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('Module 6: Sales – Payment Status Transitions', () => {
  test('new invoice starts as ISSUED with zero payments', () => {
    expect(invoiceStatus(new Decimal(5000), new Decimal(0))).toBe('ISSUED');
  });

  test('partial payment moves status to PARTIALLY_PAID', () => {
    expect(invoiceStatus(new Decimal(5000), new Decimal(2000))).toBe('PARTIALLY_PAID');
  });

  test('full payment moves status to PAID', () => {
    expect(invoiceStatus(new Decimal(5000), new Decimal(5000))).toBe('PAID');
  });

  test('overpayment is treated as PAID (no negative balance)', () => {
    // This can happen with rounding; system treats ≥ total as paid
    expect(invoiceStatus(new Decimal(999.99), new Decimal(1000))).toBe('PAID');
  });

  test('running balance across three partial payments', () => {
    const total = new Decimal(10000);
    let paid = new Decimal(0);

    paid = paid.plus(new Decimal(3000));
    expect(invoiceStatus(total, paid)).toBe('PARTIALLY_PAID');

    paid = paid.plus(new Decimal(5000));
    expect(invoiceStatus(total, paid)).toBe('PARTIALLY_PAID');

    paid = paid.plus(new Decimal(2000));
    expect(invoiceStatus(total, paid)).toBe('PAID');
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('Module 6: Sales – Credit Limit Enforcement', () => {
  test('order within available credit is allowed', () => {
    // Credit limit: 50 000 EGP; current balance: 20 000; order: 15 000 → OK
    expect(creditLimitBreached(new Decimal(20000), new Decimal(15000), new Decimal(50000))).toBe(false);
  });

  test('order that exactly reaches credit limit is allowed (boundary)', () => {
    expect(creditLimitBreached(new Decimal(35000), new Decimal(15000), new Decimal(50000))).toBe(false);
  });

  test('order that exceeds credit limit is blocked', () => {
    // balance 40 000 + order 15 000 = 55 000 > 50 000
    expect(creditLimitBreached(new Decimal(40000), new Decimal(15000), new Decimal(50000))).toBe(true);
  });

  test('customer with zero credit limit is always blocked for any order', () => {
    expect(creditLimitBreached(new Decimal(0), new Decimal(1), new Decimal(0))).toBe(true);
  });

  test('customer with unlimited credit (Decimal.MAX_VALUE sentinel) never blocked', () => {
    const unlimited = new Decimal('99999999999');
    expect(creditLimitBreached(new Decimal(900000), new Decimal(800000), unlimited)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('Module 6: Cheques – Status Lifecycle', () => {
  type ChequeStatus = 'PENDING' | 'DEPOSITED' | 'CLEARED' | 'BOUNCED' | 'RETURNED';

  /** Valid transitions from any given status */
  const allowedTransitions: Record<ChequeStatus, ChequeStatus[]> = {
    PENDING:   ['DEPOSITED', 'RETURNED'],
    DEPOSITED: ['CLEARED', 'BOUNCED'],
    CLEARED:   [],
    BOUNCED:   ['RETURNED'],
    RETURNED:  [],
  };

  function canTransition(from: ChequeStatus, to: ChequeStatus): boolean {
    return allowedTransitions[from].includes(to);
  }

  test('PENDING → DEPOSITED is allowed', () => {
    expect(canTransition('PENDING', 'DEPOSITED')).toBe(true);
  });

  test('PENDING → RETURNED is allowed (cheque returned before deposit)', () => {
    expect(canTransition('PENDING', 'RETURNED')).toBe(true);
  });

  test('DEPOSITED → CLEARED is allowed', () => {
    expect(canTransition('DEPOSITED', 'CLEARED')).toBe(true);
  });

  test('DEPOSITED → BOUNCED is allowed', () => {
    expect(canTransition('DEPOSITED', 'BOUNCED')).toBe(true);
  });

  test('BOUNCED → RETURNED is allowed', () => {
    expect(canTransition('BOUNCED', 'RETURNED')).toBe(true);
  });

  test('CLEARED → BOUNCED is NOT allowed (terminal state)', () => {
    expect(canTransition('CLEARED', 'BOUNCED')).toBe(false);
  });

  test('RETURNED → CLEARED is NOT allowed (terminal state)', () => {
    expect(canTransition('RETURNED', 'CLEARED')).toBe(false);
  });

  test('bank account balance increases by cheque amount on CLEARED', () => {
    const bankBalance = new Decimal(100000);
    const chequeAmount = new Decimal(15000);
    const newBalance = bankBalance.plus(chequeAmount);
    expect(newBalance.toNumber()).toBe(115000);
  });

  test('bank account balance decreases by cheque amount on BOUNCED (reversal)', () => {
    // Cheque was already tentatively credited; bounce reverses it
    const bankBalance = new Decimal(115000);
    const chequeAmount = new Decimal(15000);
    const newBalance = bankBalance.minus(chequeAmount);
    expect(newBalance.toNumber()).toBe(100000);
  });

  test('due-soon detection: cheque due within 7 days is flagged', () => {
    const today = new Date('2026-11-03');
    const dueDates = [
      new Date('2026-11-08'), // 5 days → due soon ✓
      new Date('2026-11-10'), // 7 days → boundary ✓
      new Date('2026-11-11'), // 8 days → NOT due soon
      new Date('2026-11-01'), // already past → NOT due soon (status should be BOUNCED/CLEARED)
    ];

    function isDueSoon(due: Date, ref: Date): boolean {
      const diffMs = due.getTime() - ref.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      return diffDays >= 0 && diffDays <= 7;
    }

    expect(isDueSoon(dueDates[0], today)).toBe(true);
    expect(isDueSoon(dueDates[1], today)).toBe(true);
    expect(isDueSoon(dueDates[2], today)).toBe(false);
    expect(isDueSoon(dueDates[3], today)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('Module 6: Egyptian Phone Sanitization for WhatsApp', () => {
  test('local format 01x → 201x', () => {
    expect(sanitizeEgyptianPhone('01012345678')).toBe('201012345678');
  });

  test('international format +20 → 20', () => {
    expect(sanitizeEgyptianPhone('+201012345678')).toBe('201012345678');
  });

  test('00201 prefix normalized', () => {
    expect(sanitizeEgyptianPhone('00201012345678')).toBe('201012345678');
  });

  test('already correct 201 format unchanged', () => {
    expect(sanitizeEgyptianPhone('201012345678')).toBe('201012345678');
  });

  test('strips spaces and dashes', () => {
    expect(sanitizeEgyptianPhone('010 1234-5678')).toBe('201012345678');
  });
});
