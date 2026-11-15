import Decimal from 'decimal.js';

// ─────────────────────────────────────────────────────────────────────────────
// Module 7: Expenses & Financial Accounts – Unit Tests
// ─────────────────────────────────────────────────────────────────────────────

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Convert foreign currency amount to EGP */
function toEGP(amount: number, rate: number): Decimal {
  return new Decimal(amount).mul(new Decimal(rate));
}

/** Debit an account: returns new balance */
function debitAccount(balance: Decimal, amount: Decimal): Decimal {
  return balance.minus(amount);
}

/** Credit an account: returns new balance */
function creditAccount(balance: Decimal, amount: Decimal): Decimal {
  return balance.plus(amount);
}

/** Inter-account transfer: returns [newFromBalance, newToBalance] */
function transfer(
  fromBalance: Decimal,
  toBalance: Decimal,
  amount: Decimal,
  exchangeRate: Decimal = new Decimal(1),
  fee: Decimal = new Decimal(0),
): [Decimal, Decimal] {
  const totalDebit = amount.plus(fee);
  if (fromBalance.lessThan(totalDebit)) throw new Error('Insufficient balance');
  const convertedAmount = amount.mul(exchangeRate);
  return [fromBalance.minus(totalDebit), toBalance.plus(convertedAmount)];
}

/** Compute next due date for recurring expense */
function nextDueDate(from: Date, frequency: string): Date {
  const d = new Date(from);
  switch (frequency) {
    case 'DAILY':     d.setDate(d.getDate() + 1); break;
    case 'WEEKLY':    d.setDate(d.getDate() + 7); break;
    case 'MONTHLY':   d.setMonth(d.getMonth() + 1); break;
    case 'QUARTERLY': d.setMonth(d.getMonth() + 3); break;
    case 'ANNUALLY':  d.setFullYear(d.getFullYear() + 1); break;
    default:          throw new Error(`Unknown frequency: ${frequency}`);
  }
  return d;
}

// ─────────────────────────────────────────────────────────────────────────────

describe('Module 7: Financial Accounts – Balance Operations', () => {
  test('debiting an account reduces balance correctly', () => {
    const balance = new Decimal(50000);
    const expense = new Decimal(3500);
    expect(debitAccount(balance, expense).toNumber()).toBe(46500);
  });

  test('crediting an account increases balance correctly', () => {
    const balance = new Decimal(20000);
    const payment = new Decimal(5000);
    expect(creditAccount(balance, payment).toNumber()).toBe(25000);
  });

  test('balance can go negative (overdraft / warning scenario)', () => {
    const balance = new Decimal(1000);
    const expense = new Decimal(1500);
    const result = debitAccount(balance, expense);
    expect(result.toNumber()).toBe(-500);
    expect(result.isNegative()).toBe(true);
  });

  test('running total of multiple debits', () => {
    let balance = new Decimal(100000);
    const expenses = [2500, 1200, 800, 5000];
    for (const e of expenses) balance = debitAccount(balance, new Decimal(e));
    expect(balance.toNumber()).toBe(90500);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('Module 7: Inter-Account Transfers', () => {
  test('same-currency transfer conserves total company funds', () => {
    const cash = new Decimal(80000);
    const bank = new Decimal(50000);
    const totalBefore = cash.plus(bank);

    const [newCash, newBank] = transfer(cash, bank, new Decimal(20000));
    const totalAfter = newCash.plus(newBank);

    expect(newCash.toNumber()).toBe(60000);
    expect(newBank.toNumber()).toBe(70000);
    expect(totalAfter.toNumber()).toBe(totalBefore.toNumber());
  });

  test('transfer fee reduces source balance beyond transferred amount', () => {
    const cash = new Decimal(50000);
    const wallet = new Decimal(10000);
    const [newCash, newWallet] = transfer(cash, wallet, new Decimal(5000), new Decimal(1), new Decimal(25));

    expect(newCash.toNumber()).toBe(44975);  // 50000 - 5000 - 25
    expect(newWallet.toNumber()).toBe(15000); // 10000 + 5000
  });

  test('cross-currency transfer applies exchange rate', () => {
    // Transfer 1000 USD from USD bank to EGP cash at 50.5 EGP/USD
    const usdBank = new Decimal(5000); // USD
    const egpCash = new Decimal(100000); // EGP
    const [newUSD, newEGP] = transfer(usdBank, egpCash, new Decimal(1000), new Decimal(50.5));

    expect(newUSD.toNumber()).toBe(4000);
    expect(newEGP.toNumber()).toBe(150500);
  });

  test('transfer throws when source has insufficient balance', () => {
    const cash = new Decimal(1000);
    const bank = new Decimal(5000);
    expect(() => transfer(cash, bank, new Decimal(2000))).toThrow('Insufficient balance');
  });

  test('transfer of exact remaining balance empties source', () => {
    const cash = new Decimal(5000);
    const bank = new Decimal(20000);
    const [newCash, newBank] = transfer(cash, bank, new Decimal(5000));
    expect(newCash.toNumber()).toBe(0);
    expect(newBank.toNumber()).toBe(25000);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('Module 7: Expense Currency Conversion', () => {
  test('EGP expense: exchangeRate=1 keeps amount unchanged', () => {
    expect(toEGP(2500, 1).toNumber()).toBe(2500);
  });

  test('USD expense converted to EGP correctly', () => {
    // 200 USD × 50.25 EGP/USD = 10 050 EGP
    expect(toEGP(200, 50.25).toNumber()).toBe(10050);
  });

  test('CNY expense converted to EGP correctly', () => {
    // 3000 CNY × 7.1 EGP/CNY = 21 300 EGP
    expect(toEGP(3000, 7.1).toNumber()).toBeCloseTo(21300, 6);
  });

  test('uses Decimal precision — no floating point drift', () => {
    // 0.1 + 0.2 = 0.3 exactly in Decimal
    const a = toEGP(0.1, 1).plus(toEGP(0.2, 1));
    expect(a.toNumber()).toBe(0.3);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('Module 7: Recurring Expense Scheduling', () => {
  const base = new Date('2026-11-01');

  test('DAILY: next due date is tomorrow', () => {
    expect(nextDueDate(base, 'DAILY').toISOString().split('T')[0]).toBe('2026-11-02');
  });

  test('WEEKLY: next due date is 7 days later', () => {
    expect(nextDueDate(base, 'WEEKLY').toISOString().split('T')[0]).toBe('2026-11-08');
  });

  test('MONTHLY: next due date is one month later', () => {
    expect(nextDueDate(base, 'MONTHLY').toISOString().split('T')[0]).toBe('2026-12-01');
  });

  test('QUARTERLY: next due date is 3 months later', () => {
    expect(nextDueDate(base, 'QUARTERLY').toISOString().split('T')[0]).toBe('2027-02-01');
  });

  test('ANNUALLY: next due date is one year later', () => {
    expect(nextDueDate(base, 'ANNUALLY').toISOString().split('T')[0]).toBe('2027-11-01');
  });

  test('unknown frequency throws an error', () => {
    expect(() => nextDueDate(base, 'FORTNIGHTLY')).toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('Module 7: Expense Category Aggregation', () => {
  interface ExpenseRow {
    categoryId: string;
    amountEGP: number;
  }

  function aggregateByCategory(expenses: ExpenseRow[]): Record<string, Decimal> {
    const result: Record<string, Decimal> = {};
    for (const e of expenses) {
      result[e.categoryId] = (result[e.categoryId] ?? new Decimal(0)).plus(new Decimal(e.amountEGP));
    }
    return result;
  }

  const expenses: ExpenseRow[] = [
    { categoryId: 'rent',   amountEGP: 15000 },
    { categoryId: 'salary', amountEGP: 8000  },
    { categoryId: 'rent',   amountEGP: 2000  },  // second rent payment
    { categoryId: 'util',   amountEGP: 450   },
    { categoryId: 'salary', amountEGP: 6500  },
  ];

  test('aggregates totals correctly per category', () => {
    const agg = aggregateByCategory(expenses);
    expect(agg['rent'].toNumber()).toBe(17000);
    expect(agg['salary'].toNumber()).toBe(14500);
    expect(agg['util'].toNumber()).toBe(450);
  });

  test('grand total matches sum of all amountEGP values', () => {
    const agg = aggregateByCategory(expenses);
    const grandTotal = Object.values(agg).reduce((s, v) => s.plus(v), new Decimal(0));
    const expected = expenses.reduce((s, e) => s + e.amountEGP, 0);
    expect(grandTotal.toNumber()).toBe(expected);
  });
});
