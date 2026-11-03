'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Sliders,
  ChevronLeft,
  ChevronRight,
  Warehouse,
  Package,
  AlertTriangle,
  Save,
  CheckCircle2,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

export default function NewAdjustmentPage() {
  const { locale, isRTL } = useI18n();
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const preselectedProductId = searchParams.get('productId') || '';

  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    warehouseId: '',
    productId: preselectedProductId,
    quantityAfter: '',
    reasonPreset: 'تلف بضاعة / كسر أثناء التخزين والتداول',
    customReason: '',
    adjustmentDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      const [whRes, prodRes] = await Promise.all([
        fetch('/api/warehouses'),
        fetch('/api/inventory'),
      ]);
      const whJson = await whRes.json();
      const prodJson = await prodRes.json();

      if (whJson.success) {
        setWarehouses(whJson.data || []);
        if (whJson.data?.length > 0 && !formData.warehouseId) {
          setFormData((prev) => ({ ...prev, warehouseId: whJson.data[0].id }));
        }
      }

      if (prodJson.success) {
        setProducts(prodJson.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedProduct = products.find((p) => p.id === formData.productId);
  const currentStock =
    selectedProduct && formData.warehouseId
      ? selectedProduct.warehouseStocks[formData.warehouseId]?.qty || 0
      : 0;

  const enteredNewQty = parseFloat(formData.quantityAfter);
  const hasEnteredQty = !isNaN(enteredNewQty);
  const difference = hasEnteredQty ? enteredNewQty - currentStock : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.warehouseId || !formData.productId || !hasEnteredQty) {
      toast({
        title: isRTL ? 'بيانات ناقصة' : 'Missing Information',
        description: isRTL ? 'يرجى تحديد المستودع والصنف والرصيد الجديد' : 'Please select warehouse, product and new count',
        variant: 'destructive',
      });
      return;
    }

    const finalReason =
      formData.reasonPreset === 'CUSTOM'
        ? formData.customReason.trim()
        : formData.customReason.trim()
        ? `${formData.reasonPreset} - ${formData.customReason.trim()}`
        : formData.reasonPreset;

    if (!finalReason) {
      toast({
        title: isRTL ? 'سبب التسوية مطلوب' : 'Reason Required',
        description: isRTL ? 'يرجى كتابة سبب التسوية الجردية' : 'Please provide an adjustment reason',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/inventory/adjustments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          warehouseId: formData.warehouseId,
          productId: formData.productId,
          quantityAfter: enteredNewQty,
          reason: finalReason,
          adjustmentDate: formData.adjustmentDate,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to execute adjustment');
      }

      toast({
        title: isRTL ? 'تمت التسوية بنجاح' : 'Adjustment Saved',
        description: isRTL
          ? `تم تعديل رصيد الصنف من ${currentStock} إلى ${enteredNewQty} بنجاح`
          : `Stock updated from ${currentStock} to ${enteredNewQty}`,
      });

      router.push('/inventory/adjustments');
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
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <Link href="/inventory/adjustments" className="hover:underline flex items-center gap-1">
            {isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            {isRTL ? 'سجل التسويات الجردية' : 'Adjustments Ledger'}
          </Link>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Sliders className="w-6 h-6 text-primary" />
          {isRTL ? 'تسجيل تسوية جردية / إهلاك تالف' : 'Stock Adjustment & Write-off'}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isRTL
            ? 'تحديث الرصيد الفعلي بعد الجرد أو تسجيل عجز وتالف البضاعة في المستودع'
            : 'Reconcile physical stock counts, record write-offs, or adjust inventory balances'}
        </p>
      </div>

      <Card className="border-slate-200 dark:border-slate-800">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Warehouse Selector */}
            <div>
              <label className="text-xs font-semibold block mb-1">
                {isRTL ? 'المستودع المراد الجرد فيه *' : 'Target Warehouse *'}
              </label>
              <select
                required
                value={formData.warehouseId}
                onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
                className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary font-medium"
              >
                <option value="">{isRTL ? '-- اختر المستودع --' : '-- Select Warehouse --'}</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {isRTL ? w.nameAr : w.nameEn}
                  </option>
                ))}
              </select>
            </div>

            {/* Product Selector */}
            <div>
              <label className="text-xs font-semibold block mb-1">
                {isRTL ? 'الصنف المطلوب تسويته *' : 'Product *'}
              </label>
              <select
                required
                value={formData.productId}
                onChange={(e) => {
                  const pid = e.target.value;
                  const p = products.find((prod) => prod.id === pid);
                  const cur = p && formData.warehouseId ? p.warehouseStocks[formData.warehouseId]?.qty || 0 : 0;
                  setFormData({
                    ...formData,
                    productId: pid,
                    quantityAfter: String(cur),
                  });
                }}
                className="w-full h-11 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">{isRTL ? '-- اختر الصنف المراد تسويته --' : '-- Select Product --'}</option>
                {products.map((p) => {
                  const avail = formData.warehouseId ? p.warehouseStocks[formData.warehouseId]?.qty || 0 : p.totalStock;
                  return (
                    <option key={p.id} value={p.id}>
                      {p.sku} - {isRTL ? p.nameAr : p.nameEn}{' '}
                      {p.bearingNumber ? `[${p.bearingNumber}]` : p.partNumber ? `[${p.partNumber}]` : ''}{' '}
                      (الرصيد الحالي: {avail})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Live Comparison Card */}
            {selectedProduct && formData.warehouseId && (
              <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                    <span className="text-[11px] text-muted-foreground block">{isRTL ? 'الرصيد الدفتري الحالي' : 'Current Book Stock'}</span>
                    <span className="font-mono font-bold text-base text-slate-800 dark:text-slate-200">{currentStock}</span>
                  </div>

                  <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                    <span className="text-[11px] text-muted-foreground block">{isRTL ? 'الرصيد الفعلي الجديد' : 'New Actual Count'}</span>
                    <span className="font-mono font-bold text-base text-primary">
                      {hasEnteredQty ? enteredNewQty : '-'}
                    </span>
                  </div>

                  <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                    <span className="text-[11px] text-muted-foreground block">{isRTL ? 'الفارق الناتج' : 'Net Difference'}</span>
                    <span
                      className={`font-mono font-bold text-base ${
                        difference > 0
                          ? 'text-emerald-600'
                          : difference < 0
                          ? 'text-rose-600'
                          : 'text-slate-600'
                      }`}
                    >
                      {difference > 0 ? `+${difference}` : difference}
                    </span>
                  </div>
                </div>

                {difference < 0 && (
                  <p className="text-xs text-rose-600 flex items-center justify-center gap-1 font-medium">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {isRTL ? `سيتم تسجيل عجز/إهلاك مقداره ${Math.abs(difference)} قطعة` : `A shortage of ${Math.abs(difference)} units will be deducted`}
                  </p>
                )}
                {difference > 0 && (
                  <p className="text-xs text-emerald-600 flex items-center justify-center gap-1 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {isRTL ? `سيتم إضافة زيادة جرد مقدارها ${difference} قطعة` : `A surplus of ${difference} units will be added`}
                  </p>
                )}
              </div>
            )}

            {/* New Quantity & Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold block mb-1">
                  {isRTL ? 'الرصيد الفعلي الجديد (بعد العد) *' : 'New Actual Count *'}
                </label>
                <Input
                  type="number"
                  step="1"
                  min="0"
                  required
                  placeholder="e.g. 95"
                  value={formData.quantityAfter}
                  onChange={(e) => setFormData({ ...formData, quantityAfter: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1">
                  {isRTL ? 'تاريخ التسوية *' : 'Adjustment Date *'}
                </label>
                <Input
                  type="date"
                  required
                  value={formData.adjustmentDate}
                  onChange={(e) => setFormData({ ...formData, adjustmentDate: e.target.value })}
                />
              </div>
            </div>

            {/* Reason Presets */}
            <div>
              <label className="text-xs font-semibold block mb-1">
                {isRTL ? 'سبب التسوية *' : 'Reason *'}
              </label>
              <select
                value={formData.reasonPreset}
                onChange={(e) => setFormData({ ...formData, reasonPreset: e.target.value })}
                className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary mb-2"
              >
                <option value="تلف بضاعة / كسر أثناء التخزين والتداول">
                  {isRTL ? 'تلف بضاعة / كسر أثناء التخزين والتداول' : 'Damaged / Broken goods in warehouse'}
                </option>
                <option value="عجز جرد فعلي (نقص بعد الجرد الدوري)">
                  {isRTL ? 'عجز جرد فعلي (نقص بعد الجرد الدوري)' : 'Physical count shortage'}
                </option>
                <option value="زيادة جرد فعلي (فائض بضاعة)">
                  {isRTL ? 'زيادة جرد فعلي (فائض بضاعة)' : 'Physical count surplus'}
                </option>
                <option value="تعديل رصيد افتتاحي أولي">
                  {isRTL ? 'تعديل رصيد افتتاحي أولي' : 'Opening stock calibration'}
                </option>
                <option value="سحب عينات فحص وتجربة للعملاء">
                  {isRTL ? 'سحب عينات فحص وتجربة للعملاء' : 'Customer testing samples'}
                </option>
                <option value="CUSTOM">{isRTL ? 'سبب مخصص آخر...' : 'Other Custom Reason...'}</option>
              </select>

              <Input
                placeholder={isRTL ? 'تفاصيل إضافية أو ملاحظات حول سبب التسوية...' : 'Additional details or notes...'}
                value={formData.customReason}
                onChange={(e) => setFormData({ ...formData, customReason: e.target.value })}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <Link href="/inventory/adjustments">
                <Button type="button" variant="outline">
                  {isRTL ? 'إلغاء' : 'Cancel'}
                </Button>
              </Link>
              <Button type="submit" disabled={isSubmitting || !hasEnteredQty} className="gap-2">
                <Save className="w-4 h-4" />
                {isSubmitting ? (isRTL ? 'جاري الحفظ...' : 'Saving...') : (isRTL ? 'حفظ وتحديث رصيد المخزون' : 'Save Adjustment')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
