'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowRightLeft,
  ChevronLeft,
  ChevronRight,
  Warehouse,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Save,
  Package,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

export default function NewTransferPage() {
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
    fromWarehouseId: '',
    toWarehouseId: '',
    productId: preselectedProductId,
    quantity: '',
    transferDate: new Date().toISOString().split('T')[0],
    reference: `TR-${Date.now().toString().slice(-6)}`,
    notes: '',
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
        if (whJson.data?.length >= 2) {
          setFormData((prev) => ({
            ...prev,
            fromWarehouseId: whJson.data[0].id,
            toWarehouseId: whJson.data[1].id,
          }));
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

  // Find currently selected product and available stock in source warehouse
  const selectedProduct = products.find((p) => p.id === formData.productId);
  const availableInSource =
    selectedProduct && formData.fromWarehouseId
      ? selectedProduct.warehouseStocks[formData.fromWarehouseId]?.qty || 0
      : 0;

  const enteredQty = parseFloat(formData.quantity) || 0;
  const isExceedingStock = enteredQty > availableInSource;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fromWarehouseId || !formData.toWarehouseId || !formData.productId || !formData.quantity) {
      toast({
        title: isRTL ? 'بيانات ناقصة' : 'Missing Information',
        description: isRTL ? 'يرجى استيفاء جميع الحقول المطلوبة' : 'Please fill all required fields',
        variant: 'destructive',
      });
      return;
    }

    if (formData.fromWarehouseId === formData.toWarehouseId) {
      toast({
        title: isRTL ? 'خطأ في تحديد المستودع' : 'Warehouse Conflict',
        description: isRTL ? 'لا يمكن التحويل لنفس المستودع' : 'Source and destination cannot be identical',
        variant: 'destructive',
      });
      return;
    }

    if (isExceedingStock) {
      toast({
        title: isRTL ? 'الكمية غير متاحة' : 'Insufficient Stock',
        description: isRTL
          ? `الكمية المطلوبة (${enteredQty}) أكبر من الرصيد المتوفر في المستودع المصدر (${availableInSource})`
          : `Requested quantity exceeds available source stock (${availableInSource})`,
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/inventory/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          quantity: enteredQty,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to execute transfer');
      }

      toast({
        title: isRTL ? 'تم التحويل بنجاح' : 'Transfer Completed',
        description: isRTL
          ? `تم تحويل ${enteredQty} قطعة بنجاح وتحديث الأرصدة`
          : `Successfully transferred ${enteredQty} units`,
      });

      router.push('/inventory/transfers');
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
      {/* Top Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <Link href="/inventory/transfers" className="hover:underline flex items-center gap-1">
            {isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            {isRTL ? 'سجل التحويلات' : 'Transfers Ledger'}
          </Link>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <ArrowRightLeft className="w-6 h-6 text-primary" />
          {isRTL ? 'إجراء تحويل بضاعة بين المستودعات' : 'New Stock Transfer'}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isRTL
            ? 'نقل فوري للبضائع بين الفروع والمستودعات مع الخصم والإضافة التلقائية'
            : 'Atomic stock movement between warehouses with instant balance synchronization'}
        </p>
      </div>

      <Card className="border-slate-200 dark:border-slate-800">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Source & Destination Warehouses */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
              <div>
                <label className="text-xs font-semibold block mb-1 text-rose-600 dark:text-rose-400">
                  {isRTL ? 'التحويل من مستودع (المصدر) *' : 'From Warehouse (Source) *'}
                </label>
                <select
                  required
                  value={formData.fromWarehouseId}
                  onChange={(e) => setFormData({ ...formData, fromWarehouseId: e.target.value })}
                  className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary font-medium"
                >
                  <option value="">{isRTL ? '-- اختر المستودع المصدر --' : '-- Select Source Warehouse --'}</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {isRTL ? w.nameAr : w.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1 text-emerald-600 dark:text-emerald-400">
                  {isRTL ? 'التحويل إلى مستودع (الوجهة) *' : 'To Warehouse (Destination) *'}
                </label>
                <select
                  required
                  value={formData.toWarehouseId}
                  onChange={(e) => setFormData({ ...formData, toWarehouseId: e.target.value })}
                  className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary font-medium"
                >
                  <option value="">{isRTL ? '-- اختر المستودع الوجهة --' : '-- Select Destination Warehouse --'}</option>
                  {warehouses
                    .filter((w) => w.id !== formData.fromWarehouseId)
                    .map((w) => (
                      <option key={w.id} value={w.id}>
                        {isRTL ? w.nameAr : w.nameEn}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Product Selector */}
            <div>
              <label className="text-xs font-semibold block mb-1">
                {isRTL ? 'الصنف المراد تحويله *' : 'Select Product *'}
              </label>
              <select
                required
                value={formData.productId}
                onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                className="w-full h-11 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">{isRTL ? '-- اختر الصنف المطلوب نقله --' : '-- Select Product --'}</option>
                {products.map((p) => {
                  const avail = formData.fromWarehouseId ? p.warehouseStocks[formData.fromWarehouseId]?.qty || 0 : p.totalStock;
                  return (
                    <option key={p.id} value={p.id}>
                      {p.sku} - {isRTL ? p.nameAr : p.nameEn}{' '}
                      {p.bearingNumber ? `[${p.bearingNumber}]` : p.partNumber ? `[${p.partNumber}]` : ''}{' '}
                      (المتوفر: {avail})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Stock Availability Info Banner */}
            {selectedProduct && formData.fromWarehouseId && (
              <div
                className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
                  availableInSource > 0
                    ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100'
                    : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-primary" />
                  <span>
                    {isRTL ? 'الرصيد المتوفر حالياً في المستودع المصدر:' : 'Available stock in source:'}
                  </span>
                </div>
                <span className="font-bold font-mono text-sm">
                  {availableInSource} {selectedProduct.unitOfMeasure === 'PIECE' ? (isRTL ? 'قطعة' : 'pcs') : selectedProduct.unitOfMeasure}
                </span>
              </div>
            )}

            {/* Quantity & Transfer Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold block mb-1">
                  {isRTL ? 'الكمية المحولة *' : 'Quantity to Transfer *'}
                </label>
                <Input
                  type="number"
                  step="1"
                  min="1"
                  required
                  placeholder="e.g. 50"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className={isExceedingStock ? 'border-rose-500 focus-visible:ring-rose-500' : ''}
                />
                {isExceedingStock && (
                  <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {isRTL ? 'الكمية تتجاوز الرصيد المتوفر!' : 'Quantity exceeds available stock!'}
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1">
                  {isRTL ? 'تاريخ التحويل *' : 'Transfer Date *'}
                </label>
                <Input
                  type="date"
                  required
                  value={formData.transferDate}
                  onChange={(e) => setFormData({ ...formData, transferDate: e.target.value })}
                />
              </div>
            </div>

            {/* Reference & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold block mb-1">
                  {isRTL ? 'رقم الإذن / المرجع' : 'Reference / Transfer No.'}
                </label>
                <Input
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1">
                  {isRTL ? 'ملاحظات وسائق النقل' : 'Notes / Driver'}
                </label>
                <Input
                  placeholder={isRTL ? 'اسم السائق، رقم السيارة...' : 'Driver name, vehicle no...'}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <Link href="/inventory/transfers">
                <Button type="button" variant="outline">
                  {isRTL ? 'إلغاء' : 'Cancel'}
                </Button>
              </Link>
              <Button type="submit" disabled={isSubmitting || isExceedingStock} className="gap-2">
                <Save className="w-4 h-4" />
                {isSubmitting ? (isRTL ? 'جاري التحويل...' : 'Transferring...') : (isRTL ? 'تنفيذ التحويل وتحديث الأرصدة' : 'Complete Transfer')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
