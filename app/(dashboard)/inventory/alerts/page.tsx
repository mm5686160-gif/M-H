'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ShoppingCart,
  Search,
  Filter,
  Warehouse,
  ChevronLeft,
  ChevronRight,
  Clock,
  Building2,
  Package,
  Layers,
  RefreshCw,
  Plus,
  ArrowRight,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function InventoryAlertsPage() {
  const { locale, isRTL } = useI18n();

  const [alerts, setAlerts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({
    totalAlerts: 0,
    outOfStockCount: 0,
    criticalCount: 0,
    lowCount: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [selectedUrgency, setSelectedUrgency] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCategories();
    fetchAlerts();
  }, [selectedUrgency, selectedCategory]);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const json = await res.json();
      if (json.success) setCategories(json.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAlerts = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (selectedUrgency !== 'ALL') params.set('urgency', selectedUrgency);
      if (selectedCategory !== 'ALL') params.set('categoryId', selectedCategory);

      const res = await fetch(`/api/inventory/alerts?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setAlerts(json.data || []);
        setSummary(json.summary || {});
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAlerts = alerts.filter((a) => {
    return (
      !searchQuery ||
      a.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.nameAr?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.nameEn?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.bearingNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.partNumber?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link href="/inventory" className="hover:underline flex items-center gap-1">
              {isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              {isRTL ? 'العودة للمخزون' : 'Back to Inventory'}
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-rose-600" />
            {isRTL ? 'نواقص المخزون ومقترحات إعادة الطلب' : 'Low Stock Alerts & Reorder Intelligence'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isRTL
              ? 'تحليل ذكي للأصناف التي أوشكت على النفاد وحساب الكميات المطلوبة مع الأخذ في الاعتبار فترة الشحن والاستيراد'
              : 'Smart stock exhaustion alerts and reorder suggestions considering international shipping lead times'}
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Link href="/purchases/new" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto gap-2">
              <ShoppingCart className="w-4 h-4" />
              {isRTL ? 'إنشاء أمر شراء' : 'New Purchase Order'}
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                {isRTL ? 'إجمالي الأصناف الناقصة' : 'Total Low Stock Items'}
              </p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                {summary.totalAlerts}
              </h3>
            </div>
            <div className="p-3 bg-amber-100 dark:bg-amber-950/60 rounded-xl text-amber-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                {isRTL ? 'أصناف نفدت بالكامل (رصيد صفر)' : 'Completely Out of Stock'}
              </p>
              <h3 className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
                {summary.outOfStockCount}
              </h3>
            </div>
            <div className="p-3 bg-rose-100 dark:bg-rose-950/60 rounded-xl text-rose-600">
              <Package className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                {isRTL ? 'أصناف في مرحلة الخطر (< 50% من الحد)' : 'Critical Level (< 50%)'}
              </p>
              <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                {summary.criticalCount}
              </h3>
            </div>
            <div className="p-3 bg-indigo-100 dark:bg-indigo-950/60 rounded-xl text-indigo-600">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardContent className="p-4 flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={
                isRTL
                  ? 'بحث برقم المحمل (6204)، رقم القطعة، كود الصنف...'
                  : 'Search by bearing #, part #, SKU...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Urgency Filter */}
            <select
              value={selectedUrgency}
              onChange={(e) => setSelectedUrgency(e.target.value)}
              className="h-10 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="ALL">{isRTL ? 'جميع درجات النقص' : 'All Urgency Levels'}</option>
              <option value="OUT_OF_STOCK">{isRTL ? 'نفد بالكامل (0)' : 'Out of Stock (0)'}</option>
              <option value="CRITICAL">{isRTL ? 'حرج جداً (< 50%)' : 'Critical (< 50%)'}</option>
              <option value="LOW">{isRTL ? 'أقل من حد الأمان' : 'Below Minimum'}</option>
            </select>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-10 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="ALL">{isRTL ? 'جميع الفئات' : 'All Categories'}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {isRTL ? c.nameAr : c.nameEn}
                </option>
              ))}
            </select>

            <Button variant="outline" size="icon" onClick={fetchAlerts} title={isRTL ? 'تحديث' : 'Refresh'}>
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Desktop Table View */}
      <div className="hidden lg:block">
        <Card className="border-slate-200 dark:border-slate-800 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-900/50">
                <TableHead>{isRTL ? 'الصنف / الكود' : 'Product / SKU'}</TableHead>
                <TableHead>{isRTL ? 'الفئة' : 'Category'}</TableHead>
                <TableHead className="text-center">{isRTL ? 'الرصيد المتاح' : 'Current Stock'}</TableHead>
                <TableHead className="text-center">{isRTL ? 'حد الأمان' : 'Min Level'}</TableHead>
                <TableHead className="text-center">{isRTL ? 'الكمية المقترحة للطلب' : 'Suggested Reorder'}</TableHead>
                <TableHead>{isRTL ? 'المورد وفترة التوريد' : 'Supplier & Lead Time'}</TableHead>
                <TableHead>{isRTL ? 'الحالة' : 'Urgency'}</TableHead>
                <TableHead className="text-left">{isRTL ? 'إجراء سريع' : 'Action'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAlerts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    {isLoading
                      ? isRTL ? 'جاري الفحص...' : 'Checking stock...'
                      : isRTL ? 'ممتاز! لا توجد نواقص في المخزون حالياً' : 'All items are above minimum stock levels'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredAlerts.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      <div className="font-semibold text-xs font-mono text-primary">
                        <Link href={`/products/${a.id}`} className="hover:underline">
                          {a.sku}
                        </Link>
                        {(a.bearingNumber || a.partNumber) && (
                          <span className="text-slate-600 dark:text-slate-400 mr-2">
                            [{a.bearingNumber || a.partNumber}]
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-800 dark:text-slate-200">
                        {isRTL ? a.nameAr : a.nameEn}
                      </div>
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground">
                      {isRTL ? a.category?.nameAr : a.category?.nameEn}
                    </TableCell>

                    <TableCell className="text-center font-mono font-bold text-sm">
                      <span className={a.totalStock === 0 ? 'text-rose-600' : 'text-amber-600'}>
                        {a.totalStock} {isRTL ? 'قطعة' : 'pcs'}
                      </span>
                    </TableCell>

                    <TableCell className="text-center font-mono text-xs text-muted-foreground">
                      {a.minStockLevel}
                    </TableCell>

                    <TableCell className="text-center font-mono font-bold text-sm text-primary">
                      {a.suggestedReorderQuantity} {isRTL ? 'قطعة' : 'pcs'}
                    </TableCell>

                    <TableCell>
                      <div className="text-xs font-medium text-slate-800 dark:text-slate-200">
                        {a.lastSupplier ? (isRTL ? a.lastSupplier.nameAr : a.lastSupplier.nameEn) : (isRTL ? 'مورد استيراد عام' : 'General')}
                      </div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-amber-600" />
                        <span>{a.estimatedLeadTimeDays} {isRTL ? 'يوم شحن واستيراد' : 'days lead time'}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      {a.urgency === 'OUT_OF_STOCK' ? (
                        <Badge variant="outline" className="text-rose-600 border-rose-300 bg-rose-50 dark:bg-rose-950/40">
                          {isRTL ? 'نفد تماماً' : 'Out of Stock'}
                        </Badge>
                      ) : a.urgency === 'CRITICAL' ? (
                        <Badge variant="outline" className="text-rose-500 border-rose-300 bg-rose-50/50">
                          {isRTL ? 'حرج جداً' : 'Critical'}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/40">
                          {isRTL ? 'تحت الحد' : 'Low Stock'}
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell className="text-left">
                      <Link href={`/purchases/new?supplierId=${a.lastSupplier?.id || ''}&productId=${a.id}&quantity=${a.suggestedReorderQuantity}`}>
                        <Button size="sm" variant="outline" className="gap-1 text-xs h-8 hover:bg-primary hover:text-white">
                          <ShoppingCart className="w-3 h-3" />
                          {isRTL ? 'طلب شراء' : 'Order'}
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Mobile Card View */}
      <div className="grid grid-cols-1 gap-3 lg:hidden">
        {filteredAlerts.length === 0 ? (
          <Card className="p-6 text-center text-muted-foreground text-sm">
            {isLoading
              ? isRTL ? 'جاري الفحص...' : 'Checking stock...'
              : isRTL ? 'ممتاز! لا توجد نواقص في المخزون حالياً' : 'All items are above minimum stock levels'}
          </Card>
        ) : (
          filteredAlerts.map((a) => (
            <Card key={a.id} className="border-slate-200 dark:border-slate-800 p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-mono text-xs font-bold text-primary">
                    {a.sku} {a.bearingNumber && `[${a.bearingNumber}]`}
                  </div>
                  <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 mt-0.5">
                    {isRTL ? a.nameAr : a.nameEn}
                  </h3>
                  <div className="text-xs text-muted-foreground">
                    {isRTL ? a.category?.nameAr : a.category?.nameEn}
                  </div>
                </div>

                <div>
                  {a.urgency === 'OUT_OF_STOCK' ? (
                    <Badge variant="outline" className="text-rose-600 border-rose-300">
                      {isRTL ? 'نفد تماماً' : 'Out'}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-amber-600 border-amber-300">
                      {isRTL ? 'نواقص' : 'Low'}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs py-2 bg-slate-50 dark:bg-slate-900/60 p-2 rounded">
                <div>
                  <span className="text-muted-foreground block text-[11px]">{isRTL ? 'الرصيد المتاح' : 'Stock'}</span>
                  <span className="font-mono font-bold text-rose-600">{a.totalStock}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">{isRTL ? 'حد الأمان' : 'Min'}</span>
                  <span className="font-mono">{a.minStockLevel}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">{isRTL ? 'الطلب المقترح' : 'Suggested'}</span>
                  <span className="font-mono font-bold text-primary">{a.suggestedReorderQuantity}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <div className="text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>{a.estimatedLeadTimeDays} {isRTL ? 'يوم شحن' : 'days'}</span>
                </div>
                <Link href={`/purchases/new?supplierId=${a.lastSupplier?.id || ''}&productId=${a.id}&quantity=${a.suggestedReorderQuantity}`}>
                  <Button size="sm" className="gap-1 text-xs h-8">
                    <ShoppingCart className="w-3.5 h-3.5" />
                    {isRTL ? 'إنشاء أمر شراء' : 'Order Now'}
                  </Button>
                </Link>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
