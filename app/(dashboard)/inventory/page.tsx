'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Warehouse,
  Search,
  Filter,
  ArrowRightLeft,
  Sliders,
  History,
  AlertTriangle,
  Package,
  Layers,
  Building2,
  DollarSign,
  Plus,
  RefreshCw,
  Eye,
  CheckCircle2,
  XCircle,
  MapPin,
  MoreHorizontal,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatEGP } from '@/lib/utils';

export default function InventoryPage() {
  const { locale, isRTL } = useI18n();

  const [products, setProducts] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [kpis, setKpis] = useState<any>({
    totalSKUs: 0,
    totalUnitsInStock: 0,
    lowStockCount: 0,
    totalInventoryValue: null,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [onlyLowStock, setOnlyLowStock] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchInventory();
  }, [selectedWarehouse, selectedCategory, onlyLowStock]);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const json = await res.json();
      if (json.success) setCategories(json.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchInventory = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.set('q', searchQuery);
      if (selectedWarehouse !== 'ALL') params.set('warehouseId', selectedWarehouse);
      if (selectedCategory !== 'ALL') params.set('categoryId', selectedCategory);
      if (onlyLowStock) params.set('lowStock', 'true');

      const res = await fetch(`/api/inventory?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setProducts(json.data || []);
        setWarehouses(json.warehouses || []);
        setKpis(json.kpis || {});
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInventory();
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Fast Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Warehouse className="w-6 h-6 text-primary" />
            {isRTL ? 'إدارة المخزون والمستودعات' : 'Inventory & Warehouses'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isRTL
              ? 'متابعة أرصدة رولمان البلي وقطع الغيار، الرفوف، التحويلات، وتسويات الجرد في كافة الفروع'
              : 'Multi-warehouse stock overview, shelf locations, transfers, and inventory adjustments'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Link href="/inventory/transfers/new">
            <Button variant="outline" size="sm" className="gap-1.5">
              <ArrowRightLeft className="w-4 h-4 text-blue-600" />
              {isRTL ? 'تحويل بين المستودعات' : 'Transfer Stock'}
            </Button>
          </Link>

          <Link href="/inventory/adjustments/new">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Sliders className="w-4 h-4 text-amber-600" />
              {isRTL ? 'تسوية جردية' : 'Stock Adjustment'}
            </Button>
          </Link>

          <Link href="/inventory/alerts">
            <Button variant="outline" size="sm" className="gap-1.5 border-rose-200 text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-400">
              <AlertTriangle className="w-4 h-4" />
              {isRTL ? 'نواقص وإعادة طلب' : 'Reorder Alerts'}
              {kpis.lowStockCount > 0 && (
                <span className="bg-rose-600 text-white text-[11px] font-bold px-1.5 py-0.2 rounded-full mr-1">
                  {kpis.lowStockCount}
                </span>
              )}
            </Button>
          </Link>

          <Link href="/inventory/movements">
            <Button size="sm" className="gap-1.5">
              <History className="w-4 h-4" />
              {isRTL ? 'كارت حركة الصنف' : 'Stock Ledger'}
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                {isRTL ? 'إجمالي الأصناف' : 'Total SKUs'}
              </p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                {kpis.totalSKUs}
              </h3>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-950/60 rounded-xl text-blue-600">
              <Package className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                {isRTL ? 'إجمالي القطع المتاحة' : 'Total Units'}
              </p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                {kpis.totalUnitsInStock?.toLocaleString()}
              </h3>
            </div>
            <div className="p-3 bg-emerald-100 dark:bg-emerald-950/60 rounded-xl text-emerald-600">
              <Warehouse className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                {isRTL ? 'أصناف بلغت حد الطلب' : 'Low Stock Items'}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <h3 className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                  {kpis.lowStockCount}
                </h3>
                {kpis.lowStockCount > 0 && (
                  <Badge variant="outline" className="text-rose-600 border-rose-300">
                    {isRTL ? 'تنبيه' : 'Alert'}
                  </Badge>
                )}
              </div>
            </div>
            <div className="p-3 bg-rose-100 dark:bg-rose-950/60 rounded-xl text-rose-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                {isRTL ? 'قيمة المخزون (بالتكلفة)' : 'Stock Valuation'}
              </p>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                {kpis.totalInventoryValue !== null ? formatEGP(kpis.totalInventoryValue) : '***'}
              </h3>
            </div>
            <div className="p-3 bg-indigo-100 dark:bg-indigo-950/60 rounded-xl text-indigo-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters Bar */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardContent className="p-4 flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={
                isRTL
                  ? 'بحث برقم المحمل (6204)، رقم القطعة، الباركود، الكود...'
                  : 'Search by bearing #, part #, barcode, SKU...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-9"
            />
          </form>

          <div className="flex flex-wrap items-center gap-2">
            {/* Warehouse Filter */}
            <select
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              className="h-10 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="ALL">{isRTL ? 'جميع المستودعات' : 'All Warehouses'}</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {isRTL ? w.nameAr : w.nameEn}
                </option>
              ))}
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

            {/* Low stock toggle */}
            <Button
              variant={onlyLowStock ? 'default' : 'outline'}
              size="sm"
              onClick={() => setOnlyLowStock(!onlyLowStock)}
              className="h-10"
            >
              <AlertTriangle className="w-3.5 h-3.5 mr-1" />
              {isRTL ? 'النواقص فقط' : 'Low Stock Only'}
            </Button>

            <Button variant="outline" size="icon" onClick={fetchInventory} title={isRTL ? 'تحديث' : 'Refresh'}>
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Desktop Multi-Warehouse Table */}
      <div className="hidden lg:block">
        <Card className="border-slate-200 dark:border-slate-800 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-900/50">
                <TableHead>{isRTL ? 'كود الصنف / الرقم' : 'SKU / Part #'}</TableHead>
                <TableHead>{isRTL ? 'اسم الصنف والفئة' : 'Product & Category'}</TableHead>
                {warehouses.map((w) => (
                  <TableHead key={w.id} className="text-center whitespace-nowrap">
                    {isRTL ? w.nameAr : w.nameEn}
                  </TableHead>
                ))}
                <TableHead className="text-center">{isRTL ? 'إجمالي الرصيد' : 'Total Stock'}</TableHead>
                <TableHead className="text-center">{isRTL ? 'حد الطلب' : 'Min Stock'}</TableHead>
                {kpis.totalInventoryValue !== null && (
                  <TableHead className="text-right">{isRTL ? 'متوسط التكلفة (WAC)' : 'Unit WAC'}</TableHead>
                )}
                <TableHead>{isRTL ? 'الحالة' : 'Status'}</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={warehouses.length + 6} className="text-center py-8 text-muted-foreground">
                    {isLoading
                      ? isRTL ? 'جاري تحميل المخزون...' : 'Loading inventory...'
                      : isRTL ? 'لا توجد أصناف مطابقة للبحث' : 'No products found'}
                  </TableCell>
                </TableRow>
              ) : (
                products.map((p) => {
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-xs">
                        <Link href={`/products/${p.id}`} className="font-bold text-primary hover:underline">
                          {p.sku}
                        </Link>
                        {(p.bearingNumber || p.partNumber) && (
                          <div className="text-[11px] text-muted-foreground font-semibold">
                            {p.bearingNumber || p.partNumber}
                          </div>
                        )}
                      </TableCell>

                      <TableCell>
                        <div className="font-medium text-slate-900 dark:text-slate-100 text-sm">
                          {isRTL ? p.nameAr : p.nameEn}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {isRTL ? p.category?.nameAr : p.category?.nameEn}
                        </div>
                      </TableCell>

                      {/* Warehouse specific stock columns */}
                      {warehouses.map((w) => {
                        const ws = p.warehouseStocks[w.id];
                        const qty = ws ? ws.qty : 0;
                        const shelf = ws ? ws.shelf : null;
                        return (
                          <TableCell key={w.id} className="text-center font-mono text-xs">
                            <span className={qty > 0 ? 'font-semibold text-slate-800 dark:text-slate-200' : 'text-slate-400'}>
                              {qty}
                            </span>
                            {shelf && (
                              <div className="text-[10px] text-muted-foreground flex items-center justify-center gap-0.5">
                                <MapPin className="w-2.5 h-2.5 text-primary" />
                                {shelf}
                              </div>
                            )}
                          </TableCell>
                        );
                      })}

                      <TableCell className="text-center font-bold text-sm font-mono">
                        <span className={p.isOutOfStock ? 'text-rose-600' : p.isLowStock ? 'text-amber-600' : 'text-emerald-600'}>
                          {p.totalStock} {p.unitOfMeasure === 'PIECE' ? (isRTL ? 'قطعة' : 'pcs') : p.unitOfMeasure}
                        </span>
                      </TableCell>

                      <TableCell className="text-center font-mono text-xs text-muted-foreground">
                        {p.minStockLevel}
                      </TableCell>

                      {kpis.totalInventoryValue !== null && (
                        <TableCell className="text-right font-mono text-xs font-semibold">
                          {p.unitCost ? formatEGP(p.unitCost) : '-'}
                        </TableCell>
                      )}

                      <TableCell>
                        {p.isOutOfStock ? (
                          <Badge variant="outline" className="text-rose-600 border-rose-300 bg-rose-50 dark:bg-rose-950/40">
                            {isRTL ? 'نفذ المخزون' : 'Out of Stock'}
                          </Badge>
                        ) : p.isLowStock ? (
                          <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/40">
                            {isRTL ? 'نواقص' : 'Low Stock'}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-emerald-600 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/40">
                            {isRTL ? 'متوفر' : 'In Stock'}
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/products/${p.id}`} className="flex items-center gap-2 cursor-pointer">
                                <Eye className="h-4 w-4" />
                                {isRTL ? 'تفاصيل الصنف' : 'View Product'}
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/inventory/movements?productId=${p.id}`} className="flex items-center gap-2 cursor-pointer">
                                <History className="h-4 w-4" />
                                {isRTL ? 'كارت حركة الصنف' : 'Stock Ledger'}
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <Link href={`/inventory/transfers/new?productId=${p.id}`} className="flex items-center gap-2 cursor-pointer">
                                <ArrowRightLeft className="h-4 w-4" />
                                {isRTL ? 'تحويل لمستودع آخر' : 'Transfer Stock'}
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/inventory/adjustments/new?productId=${p.id}`} className="flex items-center gap-2 cursor-pointer">
                                <Sliders className="h-4 w-4" />
                                {isRTL ? 'تسوية عجز/تالف' : 'Stock Adjustment'}
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Mobile & Tablet Card View */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:hidden">
        {products.length === 0 ? (
          <Card className="p-6 text-center text-muted-foreground text-sm col-span-full">
            {isLoading
              ? isRTL ? 'جاري تحميل المخزون...' : 'Loading inventory...'
              : isRTL ? 'لا توجد أصناف مطابقة للبحث' : 'No products found'}
          </Card>
        ) : (
          products.map((p) => (
            <Card key={p.id} className="border-slate-200 dark:border-slate-800 p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-primary">{p.sku}</span>
                    {(p.bearingNumber || p.partNumber) && (
                      <Badge variant="outline" className="text-[10px]">
                        {p.bearingNumber || p.partNumber}
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 mt-1">
                    {isRTL ? p.nameAr : p.nameEn}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {isRTL ? p.category?.nameAr : p.category?.nameEn}
                  </p>
                </div>

                <div>
                  {p.isOutOfStock ? (
                    <Badge variant="outline" className="text-rose-600 border-rose-300">
                      {isRTL ? 'نفذ' : 'Out'}
                    </Badge>
                  ) : p.isLowStock ? (
                    <Badge variant="outline" className="text-amber-600 border-amber-300">
                      {isRTL ? 'نواقص' : 'Low'}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-emerald-600 border-emerald-300">
                      {isRTL ? 'متوفر' : 'In Stock'}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Multi-Warehouse breakdown pills */}
              <div className="p-2.5 bg-slate-50 dark:bg-slate-900/60 rounded-lg space-y-1 text-xs">
                <span className="text-muted-foreground font-medium block mb-1">
                  {isRTL ? 'الأرصدة بالمستودعات:' : 'Warehouses:'}
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {warehouses.map((w) => {
                    const ws = p.warehouseStocks[w.id];
                    const qty = ws ? ws.qty : 0;
                    return (
                      <div key={w.id} className="flex justify-between items-center bg-white dark:bg-slate-800 p-1.5 rounded border border-slate-100 dark:border-slate-700">
                        <span className="truncate text-muted-foreground text-[11px]">{isRTL ? w.nameAr : w.nameEn}</span>
                        <span className="font-bold font-mono">{qty}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-muted-foreground">{isRTL ? 'إجمالي الرصيد: ' : 'Total: '}</span>
                  <span className="font-bold font-mono text-sm">{p.totalStock}</span>
                </div>
                {p.unitCost && (
                  <div>
                    <span className="text-muted-foreground">{isRTL ? 'التكلفة: ' : 'Cost: '}</span>
                    <span className="font-mono font-semibold">{formatEGP(p.unitCost)}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Link href={`/inventory/transfers/new?productId=${p.id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full text-xs h-8">
                    <ArrowRightLeft className="w-3.5 h-3.5 mr-1" />
                    {isRTL ? 'تحويل' : 'Transfer'}
                  </Button>
                </Link>
                <Link href={`/inventory/adjustments/new?productId=${p.id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full text-xs h-8">
                    <Sliders className="w-3.5 h-3.5 mr-1" />
                    {isRTL ? 'تسوية' : 'Adjust'}
                  </Button>
                </Link>
                <Link href={`/inventory/movements?productId=${p.id}`}>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <History className="w-4 h-4" />
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
