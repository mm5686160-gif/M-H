'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  FileText,
  Search,
  Plus,
  Trash2,
  Printer,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Wallet,
  AlertTriangle,
  Building2,
  CheckCircle2,
  DollarSign,
  Package,
  Layers,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { formatEGP } from '@/lib/utils';

export default function FastInvoicePage() {
  const { locale, isRTL } = useI18n();
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const preselectedCustomerId = searchParams.get('customerId') || '';

  const [customers, setCustomers] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [salesReps, setSalesReps] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [priceLists, setPriceLists] = useState<any[]>([]);

  // Search & Cart
  const [productSearch, setProductSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [cart, setCart] = useState<any[]>([]);

  // Invoice Configuration
  const [customerId, setCustomerId] = useState(preselectedCustomerId);
  const [warehouseId, setWarehouseId] = useState('');
  const [salesRepId, setSalesRepId] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  // Payment Setup
  const [paymentType, setPaymentType] = useState<'CASH' | 'CREDIT' | 'CHEQUE' | 'BANK_TRANSFER' | 'MOBILE_WALLET' | 'SPLIT'>('CASH');
  const [amountPaidImmediately, setAmountPaidImmediately] = useState('');
  const [accountId, setAccountId] = useState('');
  const [chequeDetails, setChequeDetails] = useState({
    chequeNumber: '',
    bankName: 'البنك الأهلي المصري (NBE)',
    accountHolderName: '',
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  // Modal / Submit state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedInvoice, setCompletedInvoice] = useState<any>(null);

  useEffect(() => {
    fetchAuxiliaryData();
  }, []);

  const fetchAuxiliaryData = async () => {
    try {
      const [cRes, wRes, srRes, accRes, plRes] = await Promise.all([
        fetch('/api/customers'),
        fetch('/api/warehouses'),
        fetch('/api/sales-reps'),
        fetch('/api/accounts'),
        fetch('/api/price-lists'),
      ]);

      const [cJson, wJson, srJson, accJson, plJson] = await Promise.all([
        cRes.json(),
        wRes.json(),
        srRes.json(),
        accRes.json(),
        plRes.json(),
      ]);

      if (cJson.success) setCustomers(cJson.data || []);
      if (wJson.success && wJson.data?.length > 0) {
        setWarehouses(wJson.data);
        setWarehouseId(wJson.data[0].id);
      }
      if (srJson.success) setSalesReps(srJson.data || []);
      if (accJson.success && accJson.data?.length > 0) {
        setAccounts(accJson.data);
        const def = accJson.data.find((a: any) => a.isDefault) || accJson.data[0];
        setAccountId(def.id);
      }
      if (plJson.success) setPriceLists(plJson.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  // When customer changes, update due date based on credit days
  const selectedCustomer = customers.find((c) => c.id === customerId);
  useEffect(() => {
    if (selectedCustomer) {
      const days = selectedCustomer.creditDays || 30;
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + days);
      setDueDate(targetDate.toISOString().split('T')[0]);

      if (selectedCustomer.salesRepId && !salesRepId) {
        setSalesRepId(selectedCustomer.salesRepId);
      }
    }
  }, [customerId, selectedCustomer]);

  // Product Search handler
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (productSearch.trim().length >= 2) {
        searchProducts(productSearch.trim());
      } else {
        setSearchResults([]);
      }
    }, 250);

    return () => clearTimeout(delayDebounce);
  }, [productSearch]);

  const searchProducts = async (query: string) => {
    try {
      setIsSearching(true);
      const res = await fetch(`/api/products/search?q=${encodeURIComponent(query)}`);
      const json = await res.json();
      if (json.success) {
        setSearchResults(json.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };

  // Add Product to Cart
  const addToCart = (product: any) => {
    // Check if already in cart
    const existingIndex = cart.findIndex((item) => item.productId === product.id);
    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].quantity += 1;
      setCart(updated);
      setProductSearch('');
      setSearchResults([]);
      return;
    }

    // Determine default unit price based on customer's price list or wholesale default
    let defaultPrice = 100;
    if (product.productPrices && product.productPrices.length > 0) {
      if (selectedCustomer?.priceListId) {
        const match = product.productPrices.find((pp: any) => pp.priceListId === selectedCustomer.priceListId);
        if (match) defaultPrice = Number(match.price);
      } else {
        defaultPrice = Number(product.productPrices[0].price);
      }
    }

    // Find available stock in selected warehouse
    const whStock = product.warehouses?.find((w: any) => w.warehouseId === warehouseId);
    const availableStock = whStock ? Number(whStock.quantityOnHand) : 0;

    setCart([
      ...cart,
      {
        productId: product.id,
        sku: product.sku,
        barcode: product.barcode,
        nameAr: product.nameAr,
        nameEn: product.nameEn,
        bearingNumber: product.bearingSpec?.bearingNumber || null,
        partNumber: product.sparePartSpec?.partNumber || null,
        unitOfMeasure: product.unitOfMeasure,
        availableStock,
        quantity: 1,
        unitPrice: defaultPrice,
        discountPct: 0,
      },
    ]);

    setProductSearch('');
    setSearchResults([]);
  };

  const updateCartItem = (index: number, field: string, value: any) => {
    const updated = [...cart];
    updated[index][field] = value;
    setCart(updated);
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  // Cart Calculations
  const grandTotal = cart.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unitPrice) || 0;
    const disc = parseFloat(item.discountPct) || 0;
    const line = qty * price * (1 - disc / 100);
    return sum + line;
  }, 0);

  // Immediate payment calculation
  let paidAmount = 0;
  if (paymentType === 'CASH' || paymentType === 'BANK_TRANSFER' || paymentType === 'MOBILE_WALLET') {
    paidAmount = grandTotal;
  } else if (paymentType === 'CHEQUE') {
    paidAmount = grandTotal;
  } else if (paymentType === 'CREDIT') {
    paidAmount = 0;
  } else if (paymentType === 'SPLIT') {
    paidAmount = Math.min(grandTotal, parseFloat(amountPaidImmediately) || 0);
  }
  const balanceDue = Math.max(0, grandTotal - paidAmount);

  // Credit Limit Verification
  const currentCustomerBalance = selectedCustomer?.currentBalanceEGP || 0;
  const customerCreditLimit = selectedCustomer?.creditLimitEGP || 0;
  const projectedBalance = currentCustomerBalance + balanceDue;
  const isExceedingCreditLimit = customerCreditLimit > 0 && projectedBalance > customerCreditLimit;
  const excessAmount = Math.max(0, projectedBalance - customerCreditLimit);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerId || !warehouseId || cart.length === 0) {
      toast({
        title: isRTL ? 'بيانات ناقصة' : 'Missing Information',
        description: isRTL
          ? 'يرجى اختيار العميل والمستودع وإضافة صنف واحد على الأقل للفاتورة'
          : 'Please select customer, warehouse, and add at least one product',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/sales/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          warehouseId,
          salesRepId: salesRepId || null,
          invoiceDate,
          dueDate: dueDate || null,
          items: cart.map((item) => ({
            productId: item.productId,
            quantity: parseFloat(item.quantity),
            unitPrice: parseFloat(item.unitPrice),
            discountPct: parseFloat(item.discountPct) || 0,
          })),
          paymentMethod: paymentType === 'SPLIT' ? 'CASH' : paymentType,
          amountPaidImmediately: paidAmount,
          accountId: paidAmount > 0 ? accountId : null,
          chequeDetails: paymentType === 'CHEQUE' ? chequeDetails : null,
          notes,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to create invoice');
      }

      toast({
        title: isRTL ? 'تم إصدار الفاتورة بنجاح' : 'Invoice Issued',
        description: isRTL
          ? `فاتورة رقم ${json.data.invoice.invoiceNumber} بقيمة ${formatEGP(grandTotal)}`
          : `Invoice ${json.data.invoice.invoiceNumber} generated successfully`,
      });

      setCompletedInvoice(json.data.invoice);
    } catch (err: any) {
      toast({
        title: isRTL ? 'خطأ' : 'Error',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link href="/sales" className="hover:underline flex items-center gap-1">
              {isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              {isRTL ? 'قائمة الفواتير' : 'Invoices'}
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            {isRTL ? 'شاشة الفاتورة السريعة (POS)' : 'Fast Invoice POS'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isRTL
              ? 'إصدار فواتير البيع بالباركود، رقم البلية، أو كود القطعة، وتحديد شروط الدفع والطباعة الفورية'
              : 'Barcode & part search, live warehouse stock check, multi-tier prices, and instant printing'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Top Controls: Customer, Warehouse, Rep, Date */}
        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Customer Selector */}
            <div>
              <label className="text-xs font-semibold block mb-1">
                {isRTL ? 'العميل *' : 'Customer *'}
              </label>
              <select
                required
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary font-medium"
              >
                <option value="">{isRTL ? '-- اختر العميل --' : '-- Select Customer --'}</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {isRTL ? c.nameAr : c.nameEn} ({c.code}) - {c.governorate}
                  </option>
                ))}
              </select>
            </div>

            {/* Warehouse Selector */}
            <div>
              <label className="text-xs font-semibold block mb-1">
                {isRTL ? 'المستودع المصدر *' : 'Source Warehouse *'}
              </label>
              <select
                required
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary font-medium"
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {isRTL ? w.nameAr : w.nameEn}
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="text-xs font-semibold block mb-1">
                {isRTL ? 'تاريخ الفاتورة *' : 'Invoice Date *'}
              </label>
              <Input
                type="date"
                required
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
              />
            </div>

            {/* Sales Rep */}
            <div>
              <label className="text-xs font-semibold block mb-1">
                {isRTL ? 'مندوب المبيعات' : 'Sales Representative'}
              </label>
              <select
                value={salesRepId}
                onChange={(e) => setSalesRepId(e.target.value)}
                className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">{isRTL ? '-- بدون مندوب --' : '-- Direct Sale --'}</option>
                {salesReps.map((sr) => (
                  <option key={sr.id} value={sr.id}>
                    {sr.name}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Selected Customer Financial Status Alert */}
        {selectedCustomer && (
          <div
            className={`p-3 rounded-lg border text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 ${
              isExceedingCreditLimit
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-100'
                : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {isExceedingCreditLimit ? (
                <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0" />
              ) : (
                <CreditCard className="w-4 h-4 text-primary flex-shrink-0" />
              )}
              <span>
                <strong>{isRTL ? selectedCustomer.nameAr : selectedCustomer.nameEn}</strong> •{' '}
                {isRTL ? 'المديونية الحالية: ' : 'Current Debt: '}
                <span className="font-mono font-bold">{formatEGP(currentCustomerBalance)}</span> •{' '}
                {isRTL ? 'حد الائتمان: ' : 'Credit Limit: '}
                <span className="font-mono font-bold">{customerCreditLimit > 0 ? formatEGP(customerCreditLimit) : (isRTL ? 'نقدي فقط' : 'Cash')}</span>
              </span>
            </div>

            {isExceedingCreditLimit && (
              <Badge variant="outline" className="text-rose-600 border-rose-300 font-semibold whitespace-nowrap">
                {isRTL ? `تنبيه: يتجاوز حد الائتمان بمقدار ${formatEGP(excessAmount)}` : `Exceeds credit limit by ${formatEGP(excessAmount)}`}
              </Badge>
            )}
          </div>
        )}

        {/* Fast Search Product Input */}
        <div className="relative">
          <Search className="absolute right-3.5 top-3.5 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder={
              isRTL
                ? 'مسح الباركود، أو كتابة رقم المحمل (مثل: 6204-2RS)، أو رقم القطعة، أو اسم الصنف...'
                : 'Scan barcode, type bearing # (e.g. 6204-2RS), part #, or product name...'
            }
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            className="h-12 pr-11 text-base font-medium shadow-sm border-primary/40 focus-visible:ring-primary"
            autoFocus
          />

          {/* Autocomplete Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl max-h-72 overflow-y-auto">
              {searchResults.map((prod) => {
                const whStock = prod.warehouses?.find((w: any) => w.warehouseId === warehouseId);
                const stock = whStock ? Number(whStock.quantityOnHand) : 0;

                return (
                  <div
                    key={prod.id}
                    onClick={() => addToCart(prod)}
                    className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/80 cursor-pointer flex items-center justify-between border-b last:border-b-0"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-primary">{prod.sku}</span>
                        {(prod.bearingSpec?.bearingNumber || prod.sparePartSpec?.partNumber) && (
                          <Badge variant="outline" className="text-xs">
                            {prod.bearingSpec?.bearingNumber || prod.sparePartSpec?.partNumber}
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm font-medium text-slate-900 dark:text-slate-100 mt-0.5">
                        {isRTL ? prod.nameAr : prod.nameEn}
                      </div>
                    </div>

                    <div className="text-left font-mono text-xs">
                      <span className={stock > 0 ? 'text-emerald-600 font-semibold' : 'text-rose-600'}>
                        {isRTL ? 'المتاح بالمستودع: ' : 'Stock: '}
                        {stock} {prod.unitOfMeasure === 'PIECE' ? (isRTL ? 'قطعة' : 'pcs') : prod.unitOfMeasure}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Invoice Items Cart Table */}
        <Card className="border-slate-200 dark:border-slate-800 overflow-hidden">
          <CardHeader className="py-3 px-4 bg-slate-50 dark:bg-slate-900/50 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" />
              {isRTL ? 'بنود الفاتورة' : 'Invoice Items'} ({cart.length})
            </CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">#</TableHead>
                  <TableHead>{isRTL ? 'الصنف والرقم' : 'Product & Code'}</TableHead>
                  <TableHead className="w-[120px] text-center">{isRTL ? 'الكمية' : 'Qty'}</TableHead>
                  <TableHead className="w-[140px] text-right">{isRTL ? 'سعر الوحدة' : 'Unit Price'}</TableHead>
                  <TableHead className="w-[100px] text-center">{isRTL ? 'خصم %' : 'Disc %'}</TableHead>
                  <TableHead className="w-[140px] text-right">{isRTL ? 'الإجمالي' : 'Total'}</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cart.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground text-sm">
                      {isRTL
                        ? 'الفاتورة فارغة. استخدم شريط البحث أعلاه أو امسح الباركود لإضافة الأصناف'
                        : 'Cart is empty. Use search bar above or scan barcode to add items'}
                    </TableCell>
                  </TableRow>
                ) : (
                  cart.map((item, idx) => {
                    const lineTotal =
                      (parseFloat(item.quantity) || 0) *
                      (parseFloat(item.unitPrice) || 0) *
                      (1 - (parseFloat(item.discountPct) || 0) / 100);

                    return (
                      <TableRow key={item.productId}>
                        <TableCell className="font-mono text-xs text-muted-foreground">{idx + 1}</TableCell>
                        <TableCell>
                          <div className="font-semibold text-xs font-mono text-primary">
                            {item.sku}{' '}
                            {(item.bearingNumber || item.partNumber) && (
                              <span className="text-slate-600 dark:text-slate-400">
                                [{item.bearingNumber || item.partNumber}]
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-800 dark:text-slate-200">
                            {isRTL ? item.nameAr : item.nameEn}
                          </div>
                        </TableCell>

                        <TableCell>
                          <Input
                            type="number"
                            min="1"
                            step="1"
                            value={item.quantity}
                            onChange={(e) => updateCartItem(idx, 'quantity', e.target.value)}
                            className="h-8 text-center font-mono font-bold"
                          />
                        </TableCell>

                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => updateCartItem(idx, 'unitPrice', e.target.value)}
                            className="h-8 text-right font-mono"
                          />
                        </TableCell>

                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={item.discountPct}
                            onChange={(e) => updateCartItem(idx, 'discountPct', e.target.value)}
                            className="h-8 text-center font-mono text-xs"
                          />
                        </TableCell>

                        <TableCell className="text-right font-mono font-bold text-sm">
                          {formatEGP(lineTotal)}
                        </TableCell>

                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFromCart(idx)}
                            className="h-7 w-7 text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Payment & Settlement Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="border-slate-200 dark:border-slate-800 lg:col-span-2">
            <CardHeader className="py-3 px-4 border-b">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-primary" />
                {isRTL ? 'طريقة السداد والتحصيل' : 'Payment & Settlement'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {/* Payment Type Selection */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant={paymentType === 'CASH' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPaymentType('CASH')}
                  className="h-10 text-xs"
                >
                  {isRTL ? 'نقدي فوري (Cash)' : 'Immediate Cash'}
                </Button>

                <Button
                  type="button"
                  variant={paymentType === 'CREDIT' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPaymentType('CREDIT')}
                  className="h-10 text-xs"
                >
                  {isRTL ? 'آجل على الحساب (Credit)' : 'Credit / On Account'}
                </Button>

                <Button
                  type="button"
                  variant={paymentType === 'CHEQUE' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPaymentType('CHEQUE')}
                  className="h-10 text-xs"
                >
                  {isRTL ? 'شيك بنكي (Cheque)' : 'Bank Cheque'}
                </Button>

                <Button
                  type="button"
                  variant={paymentType === 'MOBILE_WALLET' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPaymentType('MOBILE_WALLET')}
                  className="h-10 text-xs"
                >
                  {isRTL ? 'إنستاباي / محفظة' : 'InstaPay / Wallet'}
                </Button>

                <Button
                  type="button"
                  variant={paymentType === 'BANK_TRANSFER' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPaymentType('BANK_TRANSFER')}
                  className="h-10 text-xs"
                >
                  {isRTL ? 'تحويل بنكي' : 'Bank Transfer'}
                </Button>

                <Button
                  type="button"
                  variant={paymentType === 'SPLIT' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPaymentType('SPLIT')}
                  className="h-10 text-xs"
                >
                  {isRTL ? 'سداد مجزأ (نقدي + آجل)' : 'Split Payment'}
                </Button>
              </div>

              {/* Cheque Specific Fields */}
              {paymentType === 'CHEQUE' && (
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-3">
                  <h4 className="text-xs font-semibold text-primary">{isRTL ? 'بيانات الشيك البنكي' : 'Cheque Details'}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold block mb-1">{isRTL ? 'رقم الشيك *' : 'Cheque #'}</label>
                      <Input
                        required
                        placeholder="e.g. 0004928"
                        value={chequeDetails.chequeNumber}
                        onChange={(e) => setChequeDetails({ ...chequeDetails, chequeNumber: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold block mb-1">{isRTL ? 'اسم البنك المسحوب عليه *' : 'Bank'}</label>
                      <Input
                        required
                        placeholder="البنك الأهلي / بنك مصر / CIB"
                        value={chequeDetails.bankName}
                        onChange={(e) => setChequeDetails({ ...chequeDetails, bankName: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold block mb-1">{isRTL ? 'اسم الساحب (صاحب الشيك)' : 'Drawee Name'}</label>
                      <Input
                        placeholder={selectedCustomer?.nameAr || ''}
                        value={chequeDetails.accountHolderName}
                        onChange={(e) => setChequeDetails({ ...chequeDetails, accountHolderName: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold block mb-1">{isRTL ? 'تاريخ استحقاق الشيك *' : 'Due Date'}</label>
                      <Input
                        type="date"
                        required
                        value={chequeDetails.dueDate}
                        onChange={(e) => setChequeDetails({ ...chequeDetails, dueDate: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Split Payment Immediate Field */}
              {paymentType === 'SPLIT' && (
                <div>
                  <label className="text-xs font-semibold block mb-1">
                    {isRTL ? 'المبلغ المدفوع نقداً الآن (ج.م) *' : 'Amount Paid in Cash Now *'}
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 5000"
                    value={amountPaidImmediately}
                    onChange={(e) => setAmountPaidImmediately(e.target.value)}
                  />
                </div>
              )}

              {/* Account Selector (for cash/bank/wallet) */}
              {(paymentType === 'CASH' || paymentType === 'BANK_TRANSFER' || paymentType === 'MOBILE_WALLET' || paymentType === 'SPLIT') && (
                <div>
                  <label className="text-xs font-semibold block mb-1">
                    {isRTL ? 'الخزينة أو الحساب المستلم *' : 'Deposit Account *'}
                  </label>
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {isRTL ? acc.nameAr : acc.nameEn} ({formatEGP(acc.currentBalance)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Invoice Notes */}
              <div>
                <label className="text-xs font-semibold block mb-1">
                  {isRTL ? 'ملاحظات الفاتورة' : 'Invoice Notes'}
                </label>
                <Input
                  placeholder={isRTL ? 'أي تعليمات تسليم أو خصومات خاصة...' : 'Delivery instructions or notes...'}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Invoice Summary & Checkout */}
          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader className="py-3 px-4 border-b">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" />
                {isRTL ? 'ملخص الحساب والإصدار' : 'Total & Checkout'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{isRTL ? 'إجمالي البنود:' : 'Subtotal:'}</span>
                  <span className="font-mono font-semibold">{formatEGP(grandTotal)}</span>
                </div>

                <div className="flex justify-between border-t pt-2">
                  <span className="text-muted-foreground">{isRTL ? 'المسدد فوراً:' : 'Paid Now:'}</span>
                  <span className="font-mono font-semibold text-emerald-600">{formatEGP(paidAmount)}</span>
                </div>

                <div className="flex justify-between border-t pt-2">
                  <span className="text-muted-foreground">{isRTL ? 'المتبقي (آجل):' : 'Balance Due:'}</span>
                  <span className="font-mono font-bold text-rose-600">{formatEGP(balanceDue)}</span>
                </div>

                <div className="flex justify-between border-t-2 border-slate-900 dark:border-slate-100 pt-2 text-base font-bold">
                  <span>{isRTL ? 'المطلوب سداده:' : 'Grand Total:'}</span>
                  <span className="font-mono text-primary">{formatEGP(grandTotal)}</span>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || cart.length === 0}
                className="w-full h-12 text-base font-bold gap-2 shadow-md"
              >
                <CheckCircle2 className="w-5 h-5" />
                {isSubmitting ? (isRTL ? 'جاري الإصدار...' : 'Issuing...') : (isRTL ? 'إصدار الفاتورة وحفظ البيع' : 'Issue Invoice')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </form>

      {/* Completion Modal */}
      {completedInvoice && (
        <Dialog open={true} onOpenChange={() => router.push('/sales')}>
          <DialogContent className="max-w-md text-center space-y-4">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-950/60 rounded-full w-14 h-14 mx-auto flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <DialogHeader>
              <DialogTitle className="text-center text-xl">
                {isRTL ? 'تم إصدار الفاتورة بنجاح!' : 'Invoice Created Successfully!'}
              </DialogTitle>
            </DialogHeader>

            <div className="font-mono text-sm bg-slate-50 dark:bg-slate-900 p-3 rounded border">
              <div>{completedInvoice.invoiceNumber}</div>
              <div className="font-bold text-base text-primary mt-1">{formatEGP(completedInvoice.grandTotal)}</div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Link href={`/sales/${completedInvoice.id}?mode=thermal`} target="_blank">
                <Button className="w-full gap-2 bg-slate-800 hover:bg-slate-900 text-white">
                  <Printer className="w-4 h-4" />
                  {isRTL ? 'طباعة إيصال حراري (80mm)' : 'Print Thermal Receipt (80mm)'}
                </Button>
              </Link>

              <Link href={`/sales/${completedInvoice.id}`} target="_blank">
                <Button variant="outline" className="w-full gap-2">
                  <FileText className="w-4 h-4" />
                  {isRTL ? 'عرض وطباعة فاتورة ضريبية A4' : 'View / Print Formal A4 Invoice'}
                </Button>
              </Link>

              <Button variant="ghost" onClick={() => router.push('/sales')} className="w-full">
                {isRTL ? 'العودة لقائمة الفواتير' : 'Back to Invoices'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
