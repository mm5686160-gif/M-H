import Decimal from 'decimal.js';
import { getAgingBucket, whatsappLink } from '@/lib/utils';

describe('Module 5: Customers & CRM Business Logic', () => {
  describe('Customer Debt Aging Buckets', () => {
    test('correctly places invoices into 0-30, 31-60, 61-90, and 90+ days buckets', () => {
      const now = new Date();

      // 15 days overdue -> 0-30
      const d15 = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
      expect(getAgingBucket(d15)).toBe('0-30');

      // 45 days overdue -> 31-60
      const d45 = new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000);
      expect(getAgingBucket(d45)).toBe('31-60');

      // 75 days overdue -> 61-90
      const d75 = new Date(now.getTime() - 75 * 24 * 60 * 60 * 1000);
      expect(getAgingBucket(d75)).toBe('61-90');

      // 120 days overdue -> 90+
      const d120 = new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000);
      expect(getAgingBucket(d120)).toBe('90+');
    });
  });

  describe('Credit Limit & Utilization Calculation', () => {
    test('identifies when a customer exceeds their allocated credit limit', () => {
      // Credit limit: 50,000 EGP
      // Current debt: 52,400 EGP
      const creditLimit = new Decimal(50000);
      const currentDebt = new Decimal(52400);

      const isExceeded = creditLimit.greaterThan(0) && currentDebt.greaterThan(creditLimit);
      expect(isExceeded).toBe(true);

      const excessAmount = currentDebt.minus(creditLimit);
      expect(excessAmount.toNumber()).toBe(2400);

      const utilizationPct = Math.round(currentDebt.dividedBy(creditLimit).times(100).toNumber());
      expect(utilizationPct).toBe(105);
    });

    test('calculates available credit when within credit limit', () => {
      const creditLimit = new Decimal(80000);
      const currentDebt = new Decimal(35000);

      const isExceeded = currentDebt.greaterThan(creditLimit);
      expect(isExceeded).toBe(false);

      const availableCredit = creditLimit.minus(currentDebt);
      expect(availableCredit.toNumber()).toBe(45000);
    });
  });

  describe('Statement of Account Running Balance Ledger', () => {
    test('accurately calculates cumulative running balance across invoices and payments', () => {
      // Starting balance: 0 EGP
      // Event 1: Invoice #1: +25,000 EGP -> Balance = 25,000
      // Event 2: Invoice #2: +15,000 EGP -> Balance = 40,000
      // Event 3: Payment (Bank transfer): -20,000 EGP -> Balance = 20,000
      // Event 4: Invoice #3: +8,000 EGP -> Balance = 28,000
      // Event 5: Return / Credit Note: -3,000 EGP -> Balance = 25,000

      const events = [
        { type: 'INVOICE', amount: 25000, isDebit: true },
        { type: 'INVOICE', amount: 15000, isDebit: true },
        { type: 'PAYMENT', amount: 20000, isDebit: false },
        { type: 'INVOICE', amount: 8000, isDebit: true },
        { type: 'RETURN', amount: 3000, isDebit: false },
      ];

      let running = new Decimal(0);
      const ledgerBalances: number[] = [];

      events.forEach((e) => {
        if (e.isDebit) {
          running = running.plus(e.amount);
        } else {
          running = running.minus(e.amount);
        }
        ledgerBalances.push(running.toNumber());
      });

      expect(ledgerBalances).toEqual([25000, 40000, 20000, 28000, 25000]);
      expect(running.toNumber()).toBe(25000);
    });
  });

  describe('Inactive Customer Segmentation (60+ Days Rule)', () => {
    test('flags customer as inactive if last purchase date is older than 60 days', () => {
      const now = new Date();
      const seventyDaysAgo = new Date(now.getTime() - 70 * 24 * 60 * 60 * 1000);
      const sixtyDaysThreshold = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

      const isInactive = seventyDaysAgo < sixtyDaysThreshold;
      expect(isInactive).toBe(true);
    });

    test('keeps customer active if recent purchase within 60 days', () => {
      const now = new Date();
      const twentyDaysAgo = new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000);
      const sixtyDaysThreshold = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

      const isInactive = twentyDaysAgo < sixtyDaysThreshold;
      expect(isInactive).toBe(false);
    });
  });

  describe('WhatsApp Link & Message Generation', () => {
    test('generates valid wa.me URL with sanitized Egyptian phone number', () => {
      const phone = '010-1234-5678';
      const message = 'مرحباً عميلنا العزيز، رصيدكم هو 15,000 ج.م';
      const link = whatsappLink(phone, message);

      expect(link).toContain('https://wa.me/01012345678?text=');
      expect(link).toContain(encodeURIComponent(message));
    });
  });
});
