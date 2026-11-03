'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Truck,
  Save,
  AlertCircle,
  Globe,
  Phone,
  Mail,
  Building,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function NewSupplierPage() {
  const router = useRouter();
  const { locale, isRTL } = useI18n();

  const [code, setCode] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [country, setCountry] = useState('China');
  const [defaultCurrency, setDefaultCurrency] = useState('USD');
  const [paymentTermsDays, setPaymentTermsDays] = useState('30');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!code || !nameAr || !nameEn || !country) {
      setErrorMessage(
        locale === 'ar'
          ? 'يرجى إكمال الحقول الإلزامية: كود المورد، الاسم بالعربية، والإنجليزية، والدولة'
          : 'Please complete required fields: Code, Arabic Name, English Name, and Country'
      );
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          nameAr,
          nameEn,
          country,
          defaultCurrency,
          paymentTermsDays,
          contactName,
          phone,
          email,
          address,
          taxNumber,
          notes,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to save supplier');
      }

      router.push(`/suppliers/${json.data.id}`);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild className="h-8 px-2">
          <Link href="/suppliers" className="flex items-center gap-1 text-xs">
            {isRTL ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
            <span>{locale === 'ar' ? 'الرجوع للموردين' : 'Back to Suppliers'}</span>
          </Link>
        </Button>
        <span className="text-muted-foreground">/</span>
        <h1 className="text-xl sm:text-2xl font-bold">
          {locale === 'ar' ? 'تسجيل مورد / شركة استيراد جديدة' : 'New Supplier Profile'}
        </h1>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 rounded-lg bg-red-500/10 p-4 text-sm text-red-600 dark:text-red-400 border border-red-500/20">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Truck className="h-5 w-5 text-blue-600" />
              {locale === 'ar' ? 'البيانات التجارية والقانونية للمورد' : 'Supplier Commercial Information'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="code" className="text-xs font-semibold">
                  {locale === 'ar' ? 'كود المورد *' : 'Supplier Code *'}
                </Label>
                <Input
                  id="code"
                  placeholder="SUP-001"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  className="font-mono font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="country" className="text-xs font-semibold">
                  {locale === 'ar' ? 'دولة المورد *' : 'Country *'}
                </Label>
                <Input
                  id="country"
                  placeholder="China, Germany, Turkey, Italy..."
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="currency" className="text-xs font-semibold">
                  {locale === 'ar' ? 'عملة التعامل الافتراضية' : 'Default Currency'}
                </Label>
                <select
                  id="currency"
                  value={defaultCurrency}
                  onChange={(e) => setDefaultCurrency(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="USD">USD ($) - الدولار الأمريكي</option>
                  <option value="EUR">EUR (€) - اليورو الأوروبي</option>
                  <option value="CNY">CNY (¥) - اليوان الصيني</option>
                  <option value="EGP">EGP (ج.م) - الجنيه المصري</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="terms" className="text-xs font-semibold">
                  {locale === 'ar' ? 'فترة الائتمان والسداد (أيام)' : 'Credit Terms (Days)'}
                </Label>
                <Input
                  id="terms"
                  type="number"
                  placeholder="30"
                  value={paymentTermsDays}
                  onChange={(e) => setPaymentTermsDays(e.target.value)}
                  className="font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="nameAr" className="text-xs font-semibold">
                  {locale === 'ar' ? 'اسم المورد بالعربية *' : 'Arabic Name *'}
                </Label>
                <Input
                  id="nameAr"
                  placeholder="شركة تشجيانغ للمحامل المحدودة..."
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="nameEn" className="text-xs font-semibold">
                  {locale === 'ar' ? 'اسم المورد بالإنجليزية *' : 'English Name *'}
                </Label>
                <Input
                  id="nameEn"
                  placeholder="Zhejiang Bearing Manufacturing Co., Ltd..."
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t">
              <div className="space-y-1.5">
                <Label htmlFor="contact" className="text-xs font-semibold">
                  {locale === 'ar' ? 'الشخص المسؤول (Contact Person)' : 'Contact Person'}
                </Label>
                <Input
                  id="contact"
                  placeholder="Mr. Chen Wei / John Miller"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs font-semibold">
                  {locale === 'ar' ? 'رقم الهاتف / واتساب' : 'Phone / WhatsApp'}
                </Label>
                <Input
                  id="phone"
                  placeholder="+86 571 8888 8888"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold">
                  {locale === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="export@bearingfactory.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="address" className="text-xs font-semibold">
                  {locale === 'ar' ? 'العنوان والميناء الرئيسي' : 'Address & Port'}
                </Label>
                <Input
                  id="address"
                  placeholder="Ningbo Industrial Zone, China..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="tax" className="text-xs font-semibold">
                  {locale === 'ar' ? 'السجل الضريبي / التجاري' : 'Tax / Reg Number'}
                </Label>
                <Input
                  id="tax"
                  placeholder="91330200MA2..."
                  value={taxNumber}
                  onChange={(e) => setTaxNumber(e.target.value)}
                  className="font-mono"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <Button variant="outline" type="button" asChild className="h-11 px-6">
            <Link href="/suppliers">{locale === 'ar' ? 'إلغاء' : 'Cancel'}</Link>
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-11 px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md"
          >
            <Save className="h-4 w-4 rtl:ml-2 ltr:mr-2" />
            {isSubmitting
              ? locale === 'ar'
                ? 'جاري الحفظ...'
                : 'Saving...'
              : locale === 'ar'
              ? 'حفظ المورد'
              : 'Save Supplier'}
          </Button>
        </div>
      </form>
    </div>
  );
}
