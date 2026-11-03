'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import {
  Users,
  ChevronLeft,
  ChevronRight,
  Building2,
  Save,
  CreditCard,
  MapPin,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

export default function EditCustomerPage() {
  const { locale, isRTL } = useI18n();
  const router = useRouter();
  const params = useParams();
  const customerId = params.id as string;
  const { toast } = useToast();

  const [priceLists, setPriceLists] = useState<any[]>([]);
  const [salesReps, setSalesReps] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    nameAr: '',
    nameEn: '',
    customerType: 'WHOLESALE',
    governorate: 'القاهرة',
    area: '',
    address: '',
    phone: '',
    whatsappNumber: '',
    email: '',
    taxNumber: '',
    priceListId: '',
    salesRepId: '',
    creditLimitEGP: '0',
    creditDays: '0',
    segment: 'REGULAR',
    notes: '',
    isActive: true,
  });

  useEffect(() => {
    fetchInitialData();
  }, [customerId]);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      const [custRes, plRes, srRes] = await Promise.all([
        fetch(`/api/customers/${customerId}`),
        fetch('/api/price-lists'),
        fetch('/api/sales-reps'),
      ]);

      const custJson = await custRes.json();
      const plJson = await plRes.json();
      const srJson = await srRes.json();

      if (custJson.success) {
        const c = custJson.data;
        setFormData({
          nameAr: c.nameAr || '',
          nameEn: c.nameEn || '',
          customerType: c.customerType || 'WHOLESALE',
          governorate: c.governorate || 'القاهرة',
          area: c.area || '',
          address: c.address || '',
          phone: c.phone || '',
          whatsappNumber: c.whatsappNumber || '',
          email: c.email || '',
          taxNumber: c.taxNumber || '',
          priceListId: c.priceListId || '',
          salesRepId: c.salesRepId || '',
          creditLimitEGP: String(c.creditLimitEGP || 0),
          creditDays: String(c.creditDays || 0),
          segment: c.segment || 'REGULAR',
          notes: c.notes || '',
          isActive: c.isActive,
        });
      }

      if (plJson.success) setPriceLists(plJson.data || []);
      if (srJson.success) setSalesReps(srJson.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const governorates = [
    'القاهرة',
    'الجيزة',
    'الإسكندرية',
    'الدقهلية',
    'الشرقية',
    'الغربية',
    'القليوبية',
    'المنوفية',
    'البحيرة',
    'كفر الشيخ',
    'دمياط',
    'بورسعيد',
    'الإسماعيلية',
    'السويس',
    'بني سويف',
    'الفيوم',
    'المنيا',
    'أسيوط',
    'سوهاج',
    'قنا',
    'الأقصر',
    'أسوان',
    'مطروح',
    'شمال سيناء',
    'جنوب سيناء',
    'البحر الأحمر',
    'الوادي الجديد',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nameAr.trim() || !formData.phone.trim()) {
      toast({
        title: isRTL ? 'بيانات ناقصة' : 'Missing Information',
        description: isRTL ? 'يرجى إدخال اسم العميل ورقم الهاتف' : 'Please provide name and phone',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/customers/${customerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          creditLimitEGP: parseFloat(formData.creditLimitEGP) || 0,
          creditDays: parseInt(formData.creditDays) || 0,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to update customer');
      }

      toast({
        title: isRTL ? 'تم التحديث بنجاح' : 'Customer Updated',
        description: isRTL ? 'تم حفظ التعديلات بنجاح' : 'Customer updated successfully',
      });

      router.push(`/customers/${customerId}`);
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

  if (isLoading) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        {isRTL ? 'جاري التحميل...' : 'Loading...'}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <Link href={`/customers/${customerId}`} className="hover:underline flex items-center gap-1">
            {isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            {isRTL ? 'العودة لملف العميل' : 'Back to Profile'}
          </Link>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Users className="w-6 h-6 text-primary" />
          {isRTL ? 'تعديل بيانات العميل' : 'Edit Customer'}
        </h1>
      </div>

      <Card className="border-slate-200 dark:border-slate-800">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold block mb-1">
                  {isRTL ? 'الاسم بالعربية *' : 'Name (Arabic) *'}
                </label>
                <Input
                  required
                  value={formData.nameAr}
                  onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1">
                  {isRTL ? 'الاسم بالإنجليزية' : 'Name (English)'}
                </label>
                <Input
                  value={formData.nameEn}
                  onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold block mb-1">
                  {isRTL ? 'الهاتف *' : 'Phone *'}
                </label>
                <Input
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1">
                  {isRTL ? 'الواتساب' : 'WhatsApp'}
                </label>
                <Input
                  value={formData.whatsappNumber}
                  onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold block mb-1">
                  {isRTL ? 'المحافظة' : 'Governorate'}
                </label>
                <select
                  value={formData.governorate}
                  onChange={(e) => setFormData({ ...formData, governorate: e.target.value })}
                  className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {governorates.map((gov) => (
                    <option key={gov} value={gov}>
                      {gov}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1">
                  {isRTL ? 'المنطقة / الحي' : 'Area'}
                </label>
                <Input
                  value={formData.area}
                  onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold block mb-1">
                  {isRTL ? 'حد الائتمان (ج.م)' : 'Credit Limit (EGP)'}
                </label>
                <Input
                  type="number"
                  value={formData.creditLimitEGP}
                  onChange={(e) => setFormData({ ...formData, creditLimitEGP: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1">
                  {isRTL ? 'فترة السداد (أيام)' : 'Credit Days'}
                </label>
                <Input
                  type="number"
                  value={formData.creditDays}
                  onChange={(e) => setFormData({ ...formData, creditDays: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold block mb-1">
                  {isRTL ? 'قائمة الأسعار' : 'Price List'}
                </label>
                <select
                  value={formData.priceListId}
                  onChange={(e) => setFormData({ ...formData, priceListId: e.target.value })}
                  className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">{isRTL ? '-- اختر قائمة الأسعار --' : '-- Select --'}</option>
                  {priceLists.map((pl) => (
                    <option key={pl.id} value={pl.id}>
                      {isRTL ? pl.nameAr : pl.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1">
                  {isRTL ? 'مندوب المبيعات' : 'Sales Rep'}
                </label>
                <select
                  value={formData.salesRepId}
                  onChange={(e) => setFormData({ ...formData, salesRepId: e.target.value })}
                  className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">{isRTL ? '-- بدون مندوب --' : '-- None --'}</option>
                  {salesReps.map((sr) => (
                    <option key={sr.id} value={sr.id}>
                      {sr.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <Link href={`/customers/${customerId}`}>
                <Button type="button" variant="outline">
                  {isRTL ? 'إلغاء' : 'Cancel'}
                </Button>
              </Link>
              <Button type="submit" disabled={isSubmitting} className="gap-2">
                <Save className="w-4 h-4" />
                {isSubmitting ? (isRTL ? 'جاري الحفظ...' : 'Saving...') : (isRTL ? 'تحديث البيانات' : 'Update Customer')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
