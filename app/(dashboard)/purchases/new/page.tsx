'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  ShoppingCart,
  Plus,
  Trash2,
  Save,
  Search,
  DollarSign,
  AlertCircle,
  Calculator,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatEGP, formatCurrency } from '@/lib/utils';

export default function NewPurchaseOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale, isRTL } = useI18n();

  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  const [supplierId, setSupplierId] = useState('');
  const [poNumber, setPoNumber] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedDate, setExpectedDate] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [exchangeRate, setExchangeRate] = useState('50.25');
  const [notes, setNotes] = useState('');

  // Line items
  const [items, setItems] = useState<
    Array<{
      productId: string;
      productName: string;
      quantityOrdered: string;
      unitPriceForeign: string;
    }>
  >([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Fetch suppliers and products
    Promise.all([
      fetch('/api/suppliers').then((r) => r.json()),
      fetch('/api/products?limit=100').then((r) => r.json()),
    ]).then(([supData, prodData]) => {
      if (supData.success) {
        setSuppliers(supData.data);
        const presetSupplierId = searchParams.get('supplierId');
        if (presetSupplierId) {
          setSupplierId(presetSupplierId);
          const found = supData.data.find((s: any) => s.id === presetSupplierId);
          if (found) setCurrency(found.defaultCurrency || 'USD');
        } else if (supData.data.length > 0) {
          setSupplierId(supData.data[0].id);
          setCurrency(supData.data[0].defaultCurrency || 'USD');
        }
      }
      if (prodData.success) {
        setProducts(prodData.data);
        if (prodData.data.length > 0 && items.length === 0) {
          setItems([
            {
              productId: prodData.data[0].id,
              productName: prodData.data[0].nameAr,
              quantityOrdered: '100',
              unitPriceForeign: '5.50',
            },
          ]);
        }
      }
    });
  }, []);

  const handleSupplierChange = (id: string) => {
    setSupplierId(id);
    const found = suppliers.find((s) => s.id === id);
    if (found?.defaultCurrency) {
      setCurrency(found.defaultCurrency);
    }
  };

  const addItemRow = () => {
    if (products.length > 0) {
      setItems([
        ...items,
        {
          productId: products[0].id,
          productName: products[0].nameAr,
          quantityOrdered: '50',
          unitPriceForeign: '10.00',
        },
      ]);
    }
  };

  const removeItemRow = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItemRow = (index: number, field: string, value: string) => {
    const updated = [...items];
    if (field === 'productId') {
      const prod = products.find((p) => p.id === value);
      updated[index].productId = value;
      updated[index].productName = prod ? prod.nameAr : '';
    } else {
      (updated[index] as any)[field] = value;
    }
    setItems(updated);
  };

  // Calculations
  const rate = parseFloat(exchangeRate) || 1;
  const subtotalForeign = items.reduce((sum, it) => {
    const qty = parseFloat(it.quantityOrdered) || 0;
    const price = parseFloat(it.unitPriceForeign) || 0;
    return sum + qty * price;
  }, 0);
  const subtotalEGP = subtotalForeign * rate;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!supplierId || items.length === 0) {
      setErrorMessage(
        locale === 'ar'
          ? 'يرجى اختيار المورد وإضافة بند واحد على الأقل'
          : 'Please select a supplier and add at least one line item'
      );
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        supplierId,
        poNumber: poNumber || undefined,
        orderDate,
        expectedDate: expectedDate || null,
        currency,
        exchangeRate: rate,
        notes,
        items: items.map((it) => ({
          productId: it.productId,
          quantityOrdered: parseFloat(it.quantityOrdered || '1'),
          unitPriceForeign: parseFloat(it.unitPriceForeign || '0'),
        })),
      };

      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to create purchase order');
      }

      router.push(`/purchases/${json.data.id}`);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild className="h-8 px-2">
          <Link href="/purchases" className="flex items-center gap-1 text-xs">
            {isRTL ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
            <span>{locale === 'ar' ? 'الرجوع لأوامر الشراء' : 'Back to Purchases'}</span>
          </Link>
        </Button>
        <span className="text-muted-foreground">/</span>
        <h1 className="text-xl sm:text-2xl font-bold">
          {locale === 'ar' ? 'إنشاء أمر شراء واستيراد جديد' : 'New Import Purchase Order'}
        </h1>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 rounded-lg bg-red-500/10 p-4 text-sm text-red-600 dark:text-red-400 border border-red-500/20">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: Supplier & Currency Terms */}
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-blue-600" />
              {locale === 'ar' ? 'بيانات المورد وأسعار الصرف الأجنبية' : 'Supplier & Currency Exchange'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="supplier" className="text-xs font-semibold">
                  {locale === 'ar' ? 'المورد المصنّع *' : 'Supplier *'}
                </Label>
                <select
                  id="supplier"
                  value={supplierId}
                  onChange={(e) => handleSupplierChange(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nameAr} ({s.country})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="currency" className="text-xs font-semibold">
                  {locale === 'ar' ? 'عملة الفاتورة' : 'Invoice Currency'}
                </Label>
                <select
                  id="currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-bold"
                >
                  <option value="USD">USD ($) - دولار أمريكي</option>
                  <option value="EUR">EUR (€) - يورو أوروبي</option>
                  <option value="CNY">CNY (¥) - يوان صيني</option>
                  <option value="EGP">EGP (ج.م) - جنيه مصري</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="exRate" className="text-xs font-semibold">
                  {locale === 'ar' ? 'سعر الصرف التقديري (جنيه)' : 'Exchange Rate (EGP)'}
                </Label>
                <div className="relative">
                  <Input
                    id="exRate"
                    type="number"
                    step="0.001"
                    placeholder="50.25"
                    value={exchangeRate}
                    onChange={(e) => setExchangeRate(e.target.value)}
                    className="font-mono font-bold"
                    required
                  />
                  <span className="absolute top-2.5 text-xs text-muted-foreground rtl:left-3 ltr:right-3">
                    ج.م
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="poNum" className="text-xs font-semibold">
                  {locale === 'ar' ? 'رقم أمر الشراء (اختياري)' : 'PO Number (Optional)'}
                </Label>
                <Input
                  id="poNum"
                  placeholder="PO-2026-001 (توليد تلقائي)"
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value)}
                  className="font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="orderDate" className="text-xs font-semibold">
                  {locale === 'ar' ? 'تاريخ طلب الشراء' : 'Order Date'}
                </Label>
                <Input
                  id="orderDate"
                  type="date"
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="expectedDate" className="text-xs font-semibold">
                  {locale === 'ar' ? 'تاريخ الوصول المتوقع للميناء' : 'Expected Port Arrival'}
                </Label>
                <Input
                  id="expectedDate"
                  type="date"
                  value={expectedDate}
                  onChange={(e) => setExpectedDate(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 2: Multi-Item Rows */}
        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base sm:text-lg">
                {locale === 'ar' ? 'بنود الشحنة والمنتجات المطلوبة' : 'PO Line Items'}
              </CardTitle>
              <CardDescription className="text-xs">
                {locale === 'ar'
                  ? 'اختر المحامل أو قطع الغيار وسعر الوحدة بالعملة الأجنبية'
                  : 'Select bearings or parts and enter foreign unit price'}
              </CardDescription>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addItemRow} className="h-8 text-xs font-semibold">
              <Plus className="h-3.5 w-3.5 rtl:ml-1 ltr:mr-1" />
              {locale === 'ar' ? 'إضافة بند آخر' : 'Add Item'}
            </Button>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-3">
            <div className="space-y-3">
              {items.map((it, idx) => {
                const itemQty = parseFloat(it.quantityOrdered) || 0;
                const itemForeign = parseFloat(it.unitPriceForeign) || 0;
                const lineForeign = itemQty * itemForeign;
                const lineEGP = lineForeign * rate;

                return (
                  <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-3 rounded-lg border bg-muted/20">
                    {/* Product Selector */}
                    <div className="flex-1 w-full sm:w-auto space-y-1">
                      <Label className="text-[11px] text-muted-foreground sm:hidden">
                        {locale === 'ar' ? 'المنتج' : 'Product'}
                      </Label>
                      <select
                        value={it.productId}
                        onChange={(e) => updateItemRow(idx, 'productId', e.target.value)}
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.sku} - {p.nameAr}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Quantity */}
                    <div className="w-full sm:w-28 space-y-1">
                      <Label className="text-[11px] text-muted-foreground sm:hidden">
                        {locale === 'ar' ? 'الكمية' : 'Qty'}
                      </Label>
                      <Input
                        type="number"
                        placeholder="100"
                        value={it.quantityOrdered}
                        onChange={(e) => updateItemRow(idx, 'quantityOrdered', e.target.value)}
                        className="h-9 text-xs font-mono font-bold"
                      />
                    </div>

                    {/* Unit Foreign Price */}
                    <div className="w-full sm:w-36 space-y-1">
                      <Label className="text-[11px] text-muted-foreground sm:hidden">
                        {locale === 'ar' ? `السعر (${currency})` : `Price (${currency})`}
                      </Label>
                      <div className="relative">
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="5.50"
                          value={it.unitPriceForeign}
                          onChange={(e) => updateItemRow(idx, 'unitPriceForeign', e.target.value)}
                          className="h-9 text-xs font-mono font-bold rtl:pl-8 ltr:pr-8"
                        />
                        <span className="absolute top-2 text-[10px] text-muted-foreground rtl:left-2 ltr:right-2 font-mono">
                          {currency}
                        </span>
                      </div>
                    </div>

                    {/* Line Total Equivalents */}
                    <div className="w-full sm:w-44 text-end space-y-0.5 shrink-0 py-1 sm:py-0">
                      <div className="font-mono font-bold text-xs text-foreground">
                        {formatCurrency(lineForeign, currency)}
                      </div>
                      <div className="font-mono text-[10px] text-muted-foreground">
                        ≈ {formatEGP(lineEGP)}
                      </div>
                    </div>

                    {/* Delete row */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItemRow(idx)}
                      disabled={items.length === 1}
                      className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>

            {/* Total Summary Footer */}
            <div className="flex flex-col sm:flex-row items-end sm:items-center justify-between gap-4 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 mt-4">
              <span className="text-xs text-blue-900 dark:text-blue-300 font-semibold">
                {locale === 'ar'
                  ? 'إجمالي قيمة البضاعة المستوردة (قبل مصاريف الجمارك والشحن):'
                  : 'Total PO Value (Before Customs & Freight Landed Costs):'}
              </span>

              <div className="text-end">
                <div className="text-2xl font-black font-mono text-blue-700 dark:text-blue-400">
                  {formatCurrency(subtotalForeign, currency)}
                </div>
                <div className="text-xs font-mono font-bold text-muted-foreground">
                  ≈ {formatEGP(subtotalEGP)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <Button variant="outline" type="button" asChild className="h-11 px-6">
            <Link href="/purchases">{locale === 'ar' ? 'إلغاء' : 'Cancel'}</Link>
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-11 px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md"
          >
            <Save className="h-4 w-4 rtl:ml-2 ltr:mr-2" />
            {isSubmitting
              ? locale === 'ar'
                ? 'جاري حفظ أمر الشراء...'
                : 'Saving...'
              : locale === 'ar'
              ? 'إنشاء أمر الشراء وتتبع الشحنة'
              : 'Create PO & Start Tracking'}
          </Button>
        </div>
      </form>
    </div>
  );
}
