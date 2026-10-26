import Decimal from 'decimal.js';
import {
  calculateWAC,
  allocateLandedCostByValue,
  allocateLandedCostByWeight,
  calculateExchangeGainLoss,
  getAgingBucket,
  formatEGP,
  formatCurrency,
} from '@/lib/utils';

describe('ERP Critical Calculations', () => {
  describe('Weighted-Average Cost (WAC)', () => {
    test('calculates correct WAC when receiving new batch', () => {
      // Existing stock: 100 units at 50 EGP each
      // New receipt: 50 units at 80 EGP each
      // Expected: ((100 * 50) + (50 * 80)) / 150 = (5000 + 4000) / 150 = 9000 / 150 = 60 EGP
      const wac = calculateWAC(100, 50, 50, 80);
      expect(wac.toNumber()).toBe(60);
    });

    test('handles zero initial stock correctly', () => {
      const wac = calculateWAC(0, 0, 100, 75);
      expect(wac.toNumber()).toBe(75);
    });

    test('preserves high precision without floating-point drift', () => {
      // 3 items at 10.3333 + 7 items at 20.6667
      const wac = calculateWAC('3', '10.3333', '7', '20.6667');
      expect(wac.toFixed(4)).toBe('17.5667');
    });
  });

  describe('Landed Cost Allocation', () => {
    test('allocates landed cost by value correctly across shipment items', () => {
      // Item line value: 10,000 EGP
      // Total PO shipment value: 50,000 EGP (Item represents 20% of shipment value)
      // Total landed expenses (customs + freight + clearance): 15,000 EGP
      // Quantity received: 200 units
      // Item share of landed cost = 20% of 15,000 = 3,000 EGP
      // Landed cost per unit = 3,000 / 200 = 15 EGP
      const unitLanded = allocateLandedCostByValue(10000, 50000, 15000, 200);
      expect(unitLanded.toNumber()).toBe(15);
    });

    test('allocates landed cost by weight correctly across shipment items', () => {
      // Item weight: 500 kg
      // Total shipment weight: 2000 kg (25%)
      // Total freight & transport: 8,000 EGP
      // Quantity: 100 units
      // Item share = 25% of 8,000 = 2,000 EGP
      // Unit landed cost = 2,000 / 100 = 20 EGP
      const unitLanded = allocateLandedCostByWeight(500, 2000, 8000, 100);
      expect(unitLanded.toNumber()).toBe(20);
    });

    test('returns 0 when total value or quantity is 0', () => {
      expect(allocateLandedCostByValue(0, 0, 5000, 100).toNumber()).toBe(0);
      expect(allocateLandedCostByValue(1000, 5000, 5000, 0).toNumber()).toBe(0);
    });
  });

  describe('Foreign Exchange Gain / Loss', () => {
    test('calculates gain when EGP strengthens (invoice rate > payment rate)', () => {
      // Invoice was entered at 50 EGP per USD for $1,000 (liability = 50,000 EGP)
      // Paid when rate dropped to 48 EGP per USD (paid = 48,000 EGP)
      // Gain = (50 - 48) * 1000 = +2,000 EGP
      const gainLoss = calculateExchangeGainLoss(50, 48, 1000);
      expect(gainLoss.toNumber()).toBe(2000);
    });

    test('calculates loss when EGP weakens (invoice rate < payment rate)', () => {
      // Invoice at 48, paid at 51 EGP per USD for $2,000
      // Loss = (48 - 51) * 2000 = -6,000 EGP
      const gainLoss = calculateExchangeGainLoss(48, 51, 2000);
      expect(gainLoss.toNumber()).toBe(-6000);
    });
  });

  describe('Customer Debt Aging Buckets', () => {
    test('categorizes 10 days overdue into 0-30 bucket', () => {
      const due = new Date();
      due.setDate(due.getDate() - 10);
      expect(getAgingBucket(due)).toBe('0-30');
    });

    test('categorizes 45 days overdue into 31-60 bucket', () => {
      const due = new Date();
      due.setDate(due.getDate() - 45);
      expect(getAgingBucket(due)).toBe('31-60');
    });

    test('categorizes 75 days overdue into 61-90 bucket', () => {
      const due = new Date();
      due.setDate(due.getDate() - 75);
      expect(getAgingBucket(due)).toBe('61-90');
    });

    test('categorizes 120 days overdue into 90+ bucket', () => {
      const due = new Date();
      due.setDate(due.getDate() - 120);
      expect(getAgingBucket(due)).toBe('90+');
    });
  });

  describe('Currency & Money Formatting', () => {
    test('formats EGP correctly with decimal accuracy', () => {
      expect(formatEGP(1250.5)).toBe('1250.50 ج.م');
      expect(formatCurrency(500, 'USD')).toBe('$ 500.00');
      expect(formatCurrency(350.75, 'EUR')).toBe('€ 350.75');
      expect(formatCurrency(1000, 'CNY')).toBe('¥ 1000.00');
    });
  });
});
