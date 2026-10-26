import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Decimal from 'decimal.js';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Money formatting
export function formatEGP(amount: Decimal | number | string): string {
  const num = new Decimal(amount.toString());
  return `${num.toFixed(2)} ج.م`;
}

export function formatCurrency(amount: Decimal | number | string, currency: string = 'EGP'): string {
  const num = new Decimal(amount.toString());
  const symbols: Record<string, string> = { EGP: 'ج.م', USD: '$', EUR: '€', CNY: '¥' };
  return `${symbols[currency] ?? currency} ${num.toFixed(2)}`;
}

// Decimal arithmetic helpers
export function toDecimal(value: any): Decimal {
  try {
    return new Decimal(value?.toString() ?? '0');
  } catch {
    return new Decimal(0);
  }
}

export function safeDecimal(value: any): string {
  return toDecimal(value).toFixed(2);
}

// Weighted average cost (WAC)
export function calculateWAC(
  currentQty: Decimal | number | string,
  currentWAC: Decimal | number | string,
  receivedQty: Decimal | number | string,
  newUnitCost: Decimal | number | string
): Decimal {
  const cQty = new Decimal(currentQty.toString());
  const cWAC = new Decimal(currentWAC.toString());
  const rQty = new Decimal(receivedQty.toString());
  const rCost = new Decimal(newUnitCost.toString());

  const totalQty = cQty.plus(rQty);
  if (totalQty.isZero()) return rCost;
  const totalValue = cQty.times(cWAC).plus(rQty.times(rCost));
  return totalValue.dividedBy(totalQty);
}

// Landed cost allocation by value
export function allocateLandedCostByValue(
  itemValue: Decimal | number | string,
  totalValue: Decimal | number | string,
  totalLandedCost: Decimal | number | string,
  quantity: Decimal | number | string
): Decimal {
  const iVal = new Decimal(itemValue.toString());
  const tVal = new Decimal(totalValue.toString());
  const tCost = new Decimal(totalLandedCost.toString());
  const qty = new Decimal(quantity.toString());

  if (tVal.isZero() || qty.isZero()) return new Decimal(0);
  const itemShare = iVal.dividedBy(tVal).times(tCost);
  return itemShare.dividedBy(qty);
}

// Landed cost allocation by weight
export function allocateLandedCostByWeight(
  itemWeight: Decimal | number | string,
  totalWeight: Decimal | number | string,
  totalLandedCost: Decimal | number | string,
  quantity: Decimal | number | string
): Decimal {
  const iWeight = new Decimal(itemWeight.toString());
  const tWeight = new Decimal(totalWeight.toString());
  const tCost = new Decimal(totalLandedCost.toString());
  const qty = new Decimal(quantity.toString());

  if (tWeight.isZero() || qty.isZero()) return new Decimal(0);
  const itemShare = iWeight.dividedBy(tWeight).times(tCost);
  return itemShare.dividedBy(qty);
}

// Exchange gain/loss
export function calculateExchangeGainLoss(
  invoiceRate: Decimal | number | string,
  paymentRate: Decimal | number | string,
  amountForeign: Decimal | number | string
): Decimal {
  const invRate = new Decimal(invoiceRate.toString());
  const payRate = new Decimal(paymentRate.toString());
  const amt = new Decimal(amountForeign.toString());
  return invRate.minus(payRate).times(amt);
}

// Customer aging buckets
export function getAgingBucket(dueDate: Date): '0-30' | '31-60' | '61-90' | '90+' {
  const today = new Date();
  const diffDays = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 30) return '0-30';
  if (diffDays <= 60) return '31-60';
  if (diffDays <= 90) return '61-90';
  return '90+';
}

// Date helpers
export function formatDate(date: Date | string, locale = 'ar-EG'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function daysBetween(date1: Date, date2: Date): number {
  return Math.floor((date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24));
}

// Generate sequential codes
export function generateCode(prefix: string, lastNumber: number): string {
  return `${prefix}${String(lastNumber + 1).padStart(5, '0')}`;
}

// Truncate string
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength)}...`;
}

// WhatsApp link generator
export function whatsappLink(phone: string, message: string): string {
  const cleaned = phone.replace(/[^0-9]/g, '');
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${cleaned}?text=${encoded}`;
}

// Role-based capability checks
export function canSeeCosts(role?: string): boolean {
  return ['OWNER', 'MANAGER', 'ACCOUNTANT'].includes(role ?? '');
}

export function canSeeProfit(role?: string): boolean {
  return ['OWNER', 'MANAGER', 'ACCOUNTANT'].includes(role ?? '');
}

export function canCreateInvoices(role?: string): boolean {
  return ['OWNER', 'MANAGER', 'SALES_REP', 'CASHIER'].includes(role ?? '');
}

export function canManageProducts(role?: string): boolean {
  return ['OWNER', 'MANAGER', 'WAREHOUSE'].includes(role ?? '');
}

export function canManagePurchases(role?: string): boolean {
  return ['OWNER', 'MANAGER'].includes(role ?? '');
}
