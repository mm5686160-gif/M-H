'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Layers,
  Plus,
  Folder,
  Package,
  Wrench,
  ChevronRight,
  ChevronDown,
  Edit,
  Trash2,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function CategoriesPage() {
  const { locale, isRTL } = useI18n();

  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // New category form
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [productType, setProductType] = useState<'BEARING' | 'SPARE_PART'>('BEARING');
  const [parentId, setParentId] = useState<string>('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/categories');
      const json = await res.json();
      if (json.success) {
        setCategories(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameAr || !nameEn) return;

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nameAr,
          nameEn,
          productType,
          parentId: parentId || null,
        }),
      });

      if (res.ok) {
        setNameAr('');
        setNameEn('');
        setIsDialogOpen(false);
        fetchCategories();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const bearingCategories = categories.filter((c) => c.productType === 'BEARING' || !c.productType);
  const sparePartCategories = categories.filter((c) => c.productType === 'SPARE_PART');

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
            <span className="text-xs text-muted-foreground">{locale === 'ar' ? 'الأقسام والفئات' : 'Categories'}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {locale === 'ar' ? 'شجرة الفئات والأقسام' : 'Product Categories Tree'}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {locale === 'ar'
              ? 'تصنيف المحامل (حسب النوع والتصميم) وقطع الغيار (حسب نوع الجهاز المنزلي)'
              : 'Organize bearings by mechanical type and spare parts by home appliance'}
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="h-9 bg-blue-600 hover:bg-blue-700 text-white font-semibold">
              <Plus className="h-4 w-4 rtl:ml-1.5 ltr:mr-1.5" />
              {locale === 'ar' ? 'إضافة فئة جديدة' : 'New Category'}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {locale === 'ar' ? 'إضافة قسم / فئة جديدة' : 'Add New Category'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateCategory} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="catNameAr" className="text-xs font-semibold">
                  {locale === 'ar' ? 'اسم الفئة بالعربية *' : 'Arabic Name *'}
                </Label>
                <Input
                  id="catNameAr"
                  placeholder="مثال: محامل بلي كروية، قطع غيار ثلاجات..."
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="catNameEn" className="text-xs font-semibold">
                  {locale === 'ar' ? 'اسم الفئة بالإنجليزية *' : 'English Name *'}
                </Label>
                <Input
                  id="catNameEn"
                  placeholder="e.g. Deep Groove Ball Bearings, Refrigerator Parts..."
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="catType" className="text-xs font-semibold">
                  {locale === 'ar' ? 'القطاع التابع له' : 'Sector / Domain'}
                </Label>
                <select
                  id="catType"
                  value={productType}
                  onChange={(e) => setProductType(e.target.value as any)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="BEARING">{locale === 'ar' ? 'قطاع المحامل (Bearings)' : 'Bearings'}</option>
                  <option value="SPARE_PART">{locale === 'ar' ? 'قطاع قطع الغيار (Spare Parts)' : 'Spare Parts'}</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="catParent" className="text-xs font-semibold">
                  {locale === 'ar' ? 'الفئة الرئيسية (اختياري)' : 'Parent Category (Optional)'}
                </Label>
                <select
                  id="catParent"
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">{locale === 'ar' ? '-- بدون فئة رئيسية (فئة عليا) --' : '-- Top-Level Category --'}</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameAr} ({c.nameEn})
                    </option>
                  ))}
                </select>
              </div>

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-10">
                {locale === 'ar' ? 'إنشاء الفئة' : 'Create Category'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Categories View */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bearings Categories */}
        <Card className="border shadow-sm">
          <CardHeader className="bg-blue-50/50 dark:bg-blue-950/20 border-b pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-blue-700 dark:text-blue-400">
              <Package className="h-5 w-5" />
              {locale === 'ar' ? 'فئات وأقسام المحامل (Bearings)' : 'Bearing Categories'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-2">
            {bearingCategories.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Folder className="h-4 w-4 text-blue-600" />
                  <div>
                    <div className="font-semibold text-xs sm:text-sm">{locale === 'ar' ? c.nameAr : c.nameEn}</div>
                    <div className="text-[10px] text-muted-foreground">{locale === 'ar' ? c.nameEn : c.nameAr}</div>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs font-mono">
                  {c._count?.products || 0} {locale === 'ar' ? 'صنف' : 'items'}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Spare Parts Categories */}
        <Card className="border shadow-sm">
          <CardHeader className="bg-indigo-50/50 dark:bg-indigo-950/20 border-b pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
              <Wrench className="h-5 w-5" />
              {locale === 'ar' ? 'فئات قطع الغيار (Spare Parts by Appliance)' : 'Spare Part Categories'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-2">
            {sparePartCategories.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Folder className="h-4 w-4 text-indigo-600" />
                  <div>
                    <div className="font-semibold text-xs sm:text-sm">{locale === 'ar' ? c.nameAr : c.nameEn}</div>
                    <div className="text-[10px] text-muted-foreground">{locale === 'ar' ? c.nameEn : c.nameAr}</div>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs font-mono">
                  {c._count?.products || 0} {locale === 'ar' ? 'صنف' : 'items'}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
