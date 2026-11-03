'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users,
  ChevronLeft,
  ChevronRight,
  Building2,
  Phone,
  Save,
  CreditCard,
  Tag,
  MapPin,
  FileText,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

export default function NewCustomerPage() {
  const { locale, isRTL } = useI18n();
  const router = useRouter();
  const { toast } = useToast();

  const [priceLists, setPriceLists] = useState<any[]>([]);
  const [salesReps, setSalesReps] = useState<any[]>([]);
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
    creditLimitEGP: '50000',
    creditDays: '30',
    openingBalanceEGP: '0',
    segment: 'REGULAR',
    notes: '',
  });

  useEffect(() => {
    fetchAuxiliaryData();
  }, []);

  const fetchAuxiliaryData = async () => {
    try {
      const [plRes, srRes] = await Promise.all([
        fetch('/api/price-lists'),
        fetch('/api/sales-reps'),
      ]);
      const plJson = await plRes.json();
      const srJson = await srRes.json();

      if (plJson.success) {
        setPriceLists(plJson.data || []);
        if (plJson.data?.length > 0) {
          const wholesale = plJson.data.find((p: any) => p.type === 'WHOLESALE') || plJson.data[0];
          setFormData((prev) => ({ ...prev, priceListId: wholesale.id }));
        }
      }

      if (srJson.success) {
        setSalesReps(srJson.data || []);
      }
    } catch (e) {
      console.error(e);
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
        description: isRTL ? 'يرجى إدخال اسم العميل ورقم الهاتف' : 'Please provide customer name and phone',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          creditLimitEGP: parseFloat(formData.creditLimitEGP) || 0,
          creditDays: parseInt(formData.creditDays) || 0,
          openingBalanceEGP: parseFloat(formData.openingBalanceEGP) || 0,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to create customer');
      }

      toast({
        title: isRTL ? 'تم إنشاء العميل بنجاح' : 'Customer Created',
        description: isRTL
          ? `تم تسجيل العميل (${formData.nameAr}) بنجاح بكود ${json.data.code}`
          : `Customer (${formData.nameAr}) created successfully`,
      });

      router.push('/customers');
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
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <Link href="/customers" className="hover:underline flex items-center gap-1">
            {isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            {isRTL ? 'دليل العملاء' : 'Customers Directory'}
          </Link>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Users className="w-6 h-6 text-primary" />
          {isRTL ? 'تسجيل عميل جديد' : 'New Customer Profile'}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isRTL
            ? 'إضافة تاجر جملة، مركز صيانة، أو محل تجزئة مع تحديد حد الائتمان وقائمة الأسعار'
            : 'Register a wholesaler, workshop, or retail shop with credit limits and price tier'}
        </p>
      </div>

      <Card className="border-slate-200 dark:border-slate-800">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 border-b pb-2">
                <Building2 className="w-4 h-4 text-primary" />
                {isRTL ? 'البيانات الأساسية ونوع النشاط' : 'Basic & Business Info'}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold block mb-1">
                    {isRTL ? 'اسم العميل / الشركة (بالعربية) *' : 'Customer Name (Arabic) *'}
                  </label>
                  <Input
                    required
                    placeholder="مثال: شركة النصر للمعدات والمحامل"
                    value={formData.nameAr}
                    onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold block mb-1">
                    {isRTL ? 'اسم العميل (بالإنجليزية / اختياري)' : 'Customer Name (English)'}
                  </label>
                  <Input
                    placeholder="e.g. Al-Nasr Equipment & Bearings"
                    value={formData.nameEn}
                    onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold block mb-1">
                    {isRTL ? 'نوع النشاط *' : 'Customer Type *'}
                  </label>
                  <select
                    value={formData.customerType}
                    onChange={(e) => setFormData({ ...formData, customerType: e.target.value })}
                    className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="WHOLESALE">{isRTL ? 'تاجر جملة' : 'Wholesaler'}</option>
                    <option value="WORKSHOP">{isRTL ? 'مركز صيانة وفني أجهزة' : 'Workshop / Technician'}</option>
                    <option value="RETAIL">{isRTL ? 'محل تجزئة وقطع غيار' : 'Retail Shop'}</option>
                    <option value="COMPANY">{isRTL ? 'شركة / مصنع' : 'Company / Factory'}</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold block mb-1">
                    {isRTL ? 'تصنيف العميل' : 'Customer Segment'}
                  </label>
                  <select
                    value={formData.segment}
                    onChange={(e) => setFormData({ ...formData, segment: e.target.value })}
                    className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="REGULAR">{isRTL ? 'عميل منتظم (Regular)' : 'Regular'}</option>
                    <option value="VIP">{isRTL ? 'عميل مميز (VIP)' : 'VIP'}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Contact & Location */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 border-b pb-2">
                <MapPin className="w-4 h-4 text-primary" />
                {isRTL ? 'الاتصال والعنوان في مصر' : 'Contact & Address'}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold block mb-1">
                    {isRTL ? 'رقم الهاتف الأساسي *' : 'Phone Number *'}
                  </label>
                  <Input
                    required
                    placeholder="01012345678"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold block mb-1">
                    {isRTL ? 'رقم الواتساب (لإرسال كشوف الحسابات والتنبيهات)' : 'WhatsApp Number'}
                  </label>
                  <Input
                    placeholder="01012345678"
                    value={formData.whatsappNumber}
                    onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold block mb-1">
                    {isRTL ? 'المحافظة *' : 'Governorate *'}
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
                    {isRTL ? 'الحي / المنطقة' : 'Area / District'}
                  </label>
                  <Input
                    placeholder="مثال: السبتية / وسط البلد / العاشر"
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1">
                  {isRTL ? 'العنوان التفصيلي' : 'Detailed Address'}
                </label>
                <Input
                  placeholder="مثال: 15 شارع الجلاء، بجوار بنك مصر"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold block mb-1">
                    {isRTL ? 'البريد الإلكتروني (اختياري)' : 'Email'}
                  </label>
                  <Input
                    type="email"
                    placeholder="info@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold block mb-1">
                    {isRTL ? 'البطاقة الضريبية / السجل التجاري' : 'Tax / Commercial Reg. No.'}
                  </label>
                  <Input
                    placeholder="123-456-789"
                    value={formData.taxNumber}
                    onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Credit & Financial Settings */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 border-b pb-2">
                <CreditCard className="w-4 h-4 text-primary" />
                {isRTL ? 'شروط الائتمان والأسعار والمندوب' : 'Credit Terms, Price List & Sales Rep'}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold block mb-1">
                    {isRTL ? 'حد الائتمان (ج.م)' : 'Credit Limit (EGP)'}
                  </label>
                  <Input
                    type="number"
                    step="1000"
                    placeholder="50000"
                    value={formData.creditLimitEGP}
                    onChange={(e) => setFormData({ ...formData, creditLimitEGP: e.target.value })}
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {isRTL ? 'أدخل 0 للعملاء النقدي فقط' : '0 for cash-only customers'}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold block mb-1">
                    {isRTL ? 'مدة سداد الآجل (بالأيام)' : 'Credit Terms (Days)'}
                  </label>
                  <select
                    value={formData.creditDays}
                    onChange={(e) => setFormData({ ...formData, creditDays: e.target.value })}
                    className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="0">{isRTL ? 'نقدي فوري (Cash)' : 'Immediate Cash'}</option>
                    <option value="15">{isRTL ? '15 يوماً' : '15 Days'}</option>
                    <option value="30">{isRTL ? '30 يوماً (شهر)' : '30 Days'}</option>
                    <option value="45">{isRTL ? '45 يوماً' : '45 Days'}</option>
                    <option value="60">{isRTL ? '60 يوماً (شهرين)' : '60 Days'}</option>
                    <option value="90">{isRTL ? '90 يوماً (3 أشهر)' : '90 Days'}</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold block mb-1">
                    {isRTL ? 'الرصيد الافتتاحي (إن وجد)' : 'Opening Debt (EGP)'}
                  </label>
                  <Input
                    type="number"
                    step="100"
                    placeholder="0"
                    value={formData.openingBalanceEGP}
                    onChange={(e) => setFormData({ ...formData, openingBalanceEGP: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold block mb-1">
                    {isRTL ? 'قائمة الأسعار المطبقة *' : 'Assigned Price List *'}
                  </label>
                  <select
                    value={formData.priceListId}
                    onChange={(e) => setFormData({ ...formData, priceListId: e.target.value })}
                    className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">{isRTL ? '-- اختر قائمة الأسعار --' : '-- Select Price List --'}</option>
                    {priceLists.map((pl) => (
                      <option key={pl.id} value={pl.id}>
                        {isRTL ? pl.nameAr : pl.nameEn} ({pl.type})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold block mb-1">
                    {isRTL ? 'مندوب المبيعات المسؤول' : 'Sales Representative'}
                  </label>
                  <select
                    value={formData.salesRepId}
                    onChange={(e) => setFormData({ ...formData, salesRepId: e.target.value })}
                    className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">{isRTL ? '-- بدون مندوب معين --' : '-- No Specific Rep --'}</option>
                    {salesReps.map((sr) => (
                      <option key={sr.id} value={sr.id}>
                        {sr.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-semibold block mb-1">
                {isRTL ? 'ملاحظات إضافية' : 'Additional Notes'}
              </label>
              <Input
                placeholder={isRTL ? 'أي شروط خاصة أو ملاحظات تسليم...' : 'Delivery instructions or notes...'}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <Link href="/customers">
                <Button type="button" variant="outline">
                  {isRTL ? 'إلغاء' : 'Cancel'}
                </Button>
              </Link>
              <Button type="submit" disabled={isSubmitting} className="gap-2">
                <Save className="w-4 h-4" />
                {isSubmitting ? (isRTL ? 'جاري الحفظ...' : 'Saving...') : (isRTL ? 'حفظ العميل' : 'Save Customer')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
