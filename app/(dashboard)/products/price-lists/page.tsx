'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Tag,
  Plus,
  Users,
  CheckCircle2,
  DollarSign,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function PriceListsPage() {
  const { locale, isRTL } = useI18n();

  const [priceLists, setPriceLists] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // New price list form
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [type, setType] = useState('RETAIL');
  const [isDefault, setIsDefault] = useState(false);

  useEffect(() => {
    fetchPriceLists();
  }, []);

  const fetchPriceLists = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/price-lists');
      const json = await res.json();
      if (json.success) {
        setPriceLists(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePriceList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameAr || !nameEn) return;

    try {
      const res = await fetch('/api/price-lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nameAr, nameEn, type, isDefault }),
      });

      if (res.ok) {
        setNameAr('');
        setNameEn('');
        setIsDialogOpen(false);
        fetchPriceLists();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild className="h-8 px-2">
              <Link href="/products" className="flex items-center gap-1 text-xs">
                {isRTL ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
                <span>{locale === 'ar' ? 'الرجوع للمنتجات' : 'Back to Products'}</span>
              </Link>
            </Button>
            <span className="text-muted-foreground">/</span>
            <span className="text-xs text-muted-foreground">{locale === 'ar' ? 'قوائم الأسعار' : 'Price Lists'}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {locale === 'ar' ? 'إدارة قوائم وشرائح الأسعار' : 'Multi-Tier Price Lists'}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {locale === 'ar'
              ? 'تحديد شرائح الأسعار (تجزئة، نصف جملة، جملة، VIP) وربطها بالعملاء'
              : 'Define customer-specific pricing tiers and assign them to accounts'}
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="h-9 bg-blue-600 hover:bg-blue-700 text-white font-semibold">
              <Plus className="h-4 w-4 rtl:ml-1.5 ltr:mr-1.5" />
              {locale === 'ar' ? 'إضافة قائمة أسعار' : 'New Price List'}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {locale === 'ar' ? 'إضافة قائمة أسعار جديدة' : 'Add Price List'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreatePriceList} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="plNameAr" className="text-xs font-semibold">
                  {locale === 'ar' ? 'اسم القائمة بالعربية *' : 'Arabic Name *'}
                </Label>
                <Input
                  id="plNameAr"
                  placeholder="مثال: أسعار الجملة، كبار التجار..."
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="plNameEn" className="text-xs font-semibold">
                  {locale === 'ar' ? 'اسم القائمة بالإنجليزية *' : 'English Name *'}
                </Label>
                <Input
                  id="plNameEn"
                  placeholder="e.g. Wholesale Tier, VIP Wholesalers..."
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="plType" className="text-xs font-semibold">
                  {locale === 'ar' ? 'نوع الشريحة' : 'Tier Type'}
                </Label>
                <select
                  id="plType"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="RETAIL">{locale === 'ar' ? 'تجزئة (Retail)' : 'Retail'}</option>
                  <option value="SEMI_WHOLESALE">{locale === 'ar' ? 'نصف جملة (Semi-Wholesale)' : 'Semi-Wholesale'}</option>
                  <option value="WHOLESALE">{locale === 'ar' ? 'جملة (Wholesale)' : 'Wholesale'}</option>
                  <option value="CUSTOM">{locale === 'ar' ? 'مخصص / VIP' : 'Custom / VIP'}</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="rounded border-input h-4 w-4 text-blue-600"
                />
                <Label htmlFor="isDefault" className="text-xs cursor-pointer">
                  {locale === 'ar' ? 'تعيين كقائمة افتراضية للمبيعات العامة' : 'Set as default price list'}
                </Label>
              </div>

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-10">
                {locale === 'ar' ? 'حفظ القائمة' : 'Save Price List'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Price Lists Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {priceLists.map((pl) => (
          <Card key={pl.id} className="border shadow-sm hover:shadow-md transition-all">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base font-bold">
                    {locale === 'ar' ? pl.nameAr : pl.nameEn}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {locale === 'ar' ? pl.nameEn : pl.nameAr}
                  </CardDescription>
                </div>
                {pl.isDefault && (
                  <Badge variant="success" className="text-[10px]">
                    {locale === 'ar' ? 'افتراضية' : 'Default'}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-1">
              <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-muted/40">
                <span className="text-muted-foreground">{locale === 'ar' ? 'النوع:' : 'Type:'}</span>
                <Badge variant="outline" className="font-mono text-[10px]">{pl.type}</Badge>
              </div>

              <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-muted/40">
                <span className="text-muted-foreground">{locale === 'ar' ? 'العملاء المرتبطين:' : 'Assigned Customers:'}</span>
                <span className="font-bold flex items-center gap-1">
                  <Users className="h-3.5 w-3.5 text-blue-600" />
                  {pl._count?.customers || 0}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-muted/40">
                <span className="text-muted-foreground">{locale === 'ar' ? 'المنتجات المسعرة:' : 'Priced Products:'}</span>
                <span className="font-bold flex items-center gap-1">
                  <Tag className="h-3.5 w-3.5 text-emerald-600" />
                  {pl._count?.productPrices || 0}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
