'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Package,
  Plus,
  Search,
  Filter,
  Layers,
  AlertTriangle,
  ArrowUpDown,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  XCircle,
  Tag,
  Warehouse,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatEGP } from '@/lib/utils';

export default function ProductsPage() {
  const { locale, t, isRTL } = useI18n();

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [lowStockFilter, setLowStockFilter] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [selectedType, selectedCategory, lowStockFilter]);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.set('q', searchQuery);
      if (selectedType !== 'ALL') params.set('type', selectedType);
      if (selectedCategory !== 'ALL') params.set('categoryId', selectedCategory);
      if (lowStockFilter) params.set('lowStock', 'true');

      const res = await fetch(`/api/products?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setProducts(json.data);
      }
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const json = await res.json();
      if (json.success) {
        setCategories(json.data);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {locale === 'ar' ? 'كتالوج المنتجات والمحامل' : 'Products & Catalog'}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {locale === 'ar'
              ? 'إدارة المحامل، قطع غيار الأجهزة المنزلية، الأرقام المكافئة، والأسعار'
              : 'Manage bearings, appliance spare parts, cross-references, and multi-tier prices'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild className="h-9">
            <Link href="/products/categories" className="flex items-center gap-1.5 text-xs">
              <Layers className="h-4 w-4" />
              <span>{locale === 'ar' ? 'الفئات والأقسام' : 'Categories'}</span>
            </Link>
          </Button>

          <Button variant="outline" size="sm" asChild className="h-9">
            <Link href="/products/price-lists" className="flex items-center gap-1.5 text-xs">
              <Tag className="h-4 w-4" />
              <span>{locale === 'ar' ? 'قوائم الأسعار' : 'Price Lists'}</span>
            </Link>
          </Button>

          <Button asChild className="h-9 bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
            <Link href="/products/new" className="flex items-center gap-1.5 text-xs font-semibold">
              <Plus className="h-4 w-4" />
              <span>{locale === 'ar' ? 'إضافة منتج جديد' : 'New Product'}</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border shadow-sm">
        <CardContent className="p-4 space-y-3">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute top-2.5 h-4 w-4 text-muted-foreground rtl:right-3 ltr:left-3" />
              <Input
                placeholder={
                  locale === 'ar'
                    ? 'ابحث برقم المحمل (مثل 6204)، كود القطعة، الباركود، أو ماركة الجهاز...'
                    : 'Search by bearing # (e.g. 6204), part #, barcode, or brand...'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rtl:pr-9 ltr:pl-9 h-10 text-xs sm:text-sm"
              />
            </div>
            <Button type="submit" className="h-10 px-5 shrink-0">
              <Search className="h-4 w-4 rtl:ml-1.5 ltr:mr-1.5" />
              {locale === 'ar' ? 'بحث' : 'Search'}
            </Button>
          </form>

          {/* Type and Category Quick Chips */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t">
            <div className="flex flex-wrap items-center gap-1.5">
              <Button
                variant={selectedType === 'ALL' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedType('ALL')}
                className="h-7 text-xs"
              >
                {locale === 'ar' ? 'الكل' : 'All'}
              </Button>
              <Button
                variant={selectedType === 'BEARING' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedType('BEARING')}
                className="h-7 text-xs"
              >
                ⚙️ {locale === 'ar' ? 'المحامل (Bearings)' : 'Bearings'}
              </Button>
              <Button
                variant={selectedType === 'SPARE_PART' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedType('SPARE_PART')}
                className="h-7 text-xs"
              >
                🔧 {locale === 'ar' ? 'قطع الغيار (Spare Parts)' : 'Spare Parts'}
              </Button>

              {/* Low Stock Toggle */}
              <Button
                variant={lowStockFilter ? 'destructive' : 'outline'}
                size="sm"
                onClick={() => setLowStockFilter(!lowStockFilter)}
                className="h-7 text-xs"
              >
                <AlertTriangle className="h-3 w-3 rtl:ml-1 ltr:mr-1" />
                {locale === 'ar' ? 'النواقص فقط' : 'Low Stock Only'}
              </Button>
            </div>

            <span className="text-xs text-muted-foreground font-medium">
              {locale === 'ar' ? `إجمالي: ${products.length} صنف` : `Total: ${products.length} items`}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Products Table (Desktop) / Cards (Mobile) */}
      <Card className="border shadow-sm overflow-hidden">
        {/* Desktop View */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-32">{locale === 'ar' ? 'كود الصنف / SKU' : 'SKU'}</TableHead>
                <TableHead>{locale === 'ar' ? 'اسم المنتج والماركة' : 'Product & Brand'}</TableHead>
                <TableHead className="w-28">{locale === 'ar' ? 'النوع' : 'Type'}</TableHead>
                <TableHead>{locale === 'ar' ? 'المواصفات الفنية / الموديل' : 'Specs / Fit'}</TableHead>
                <TableHead className="w-28 text-center">{locale === 'ar' ? 'المخزون' : 'Stock'}</TableHead>
                <TableHead className="w-32">{locale === 'ar' ? 'سعر التجزئة' : 'Retail'}</TableHead>
                <TableHead className="w-32">{locale === 'ar' ? 'سعر الجملة' : 'Wholesale'}</TableHead>
                <TableHead className="w-20 text-center">{locale === 'ar' ? 'الإجراءات' : 'Actions'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                    {locale === 'ar' ? 'جاري تحميل المنتجات...' : 'Loading products...'}
                  </TableCell>
                </TableRow>
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                    {locale === 'ar' ? 'لا توجد منتجات مطابقة لخيارات البحث' : 'No products found'}
                  </TableCell>
                </TableRow>
              ) : (
                products.map((p) => {
                  const retailPrice = p.prices?.find((pr: any) => pr.priceListType === 'RETAIL')?.unitPrice;
                  const wholesalePrice = p.prices?.find((pr: any) => pr.priceListType === 'WHOLESALE')?.unitPrice;

                  return (
                    <TableRow key={p.id} className="hover:bg-muted/40 transition-colors">
                      {/* SKU & Barcode */}
                      <TableCell className="font-mono text-xs">
                        <Link
                          href={`/products/${p.id}`}
                          className="font-bold text-blue-600 hover:underline"
                        >
                          {p.sku}
                        </Link>
                        {p.barcode && (
                          <div className="text-[10px] text-muted-foreground">{p.barcode}</div>
                        )}
                      </TableCell>

                      {/* Name & Brand */}
                      <TableCell>
                        <div className="font-semibold text-xs sm:text-sm">
                          {locale === 'ar' ? p.nameAr : p.nameEn}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[11px] text-muted-foreground">
                            {p.bearingSpec?.brand || p.sparePartSpec?.brand || p.category?.nameAr}
                          </span>
                          {p.bearingSpec?.originCountry && (
                            <span className="text-[10px] bg-muted px-1.5 py-0.2 rounded text-muted-foreground">
                              {p.bearingSpec.originCountry}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Type */}
                      <TableCell>
                        {p.productType === 'BEARING' ? (
                          <Badge variant="info" className="text-[10px]">
                            ⚙️ {locale === 'ar' ? 'محمل' : 'Bearing'}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">
                            🔧 {locale === 'ar' ? 'قطعة غيار' : 'Spare Part'}
                          </Badge>
                        )}
                      </TableCell>

                      {/* Specifications Summary */}
                      <TableCell className="text-xs">
                        {p.productType === 'BEARING' && p.bearingSpec ? (
                          <div className="space-y-0.5 font-mono text-[11px]">
                            <span className="font-semibold text-foreground">
                              #{p.bearingSpec.bearingNumber}
                            </span>
                            <div className="text-muted-foreground text-[10px]">
                              d:{Number(p.bearingSpec.innerDiameterMm)} × D:
                              {Number(p.bearingSpec.outerDiameterMm)} × B:
                              {Number(p.bearingSpec.widthMm)} mm ({p.bearingSpec.sealType})
                            </div>
                          </div>
                        ) : p.productType === 'SPARE_PART' && p.sparePartSpec ? (
                          <div className="space-y-0.5 text-[11px]">
                            <span className="font-mono font-semibold">
                              #{p.sparePartSpec.partNumber}
                            </span>
                            <div className="text-muted-foreground text-[10px] truncate max-w-xs">
                              {p.sparePartSpec.compatibleModels?.length > 0 ? (
                                <span>
                                  {locale === 'ar' ? 'يناسب: ' : 'Fits: '}
                                  {p.sparePartSpec.compatibleModels
                                    .slice(0, 2)
                                    .map((cm: any) => `${cm.applianceBrand} ${cm.modelNumber || ''}`)
                                    .join(', ')}
                                  {p.sparePartSpec.compatibleModels.length > 2 && '...'}
                                </span>
                              ) : (
                                <span>{p.sparePartSpec.oemType}</span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>

                      {/* Stock */}
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center">
                          <span
                            className={`font-bold text-xs ${
                              p.isLowStock ? 'text-destructive font-black' : 'text-foreground'
                            }`}
                          >
                            {p.totalStock} {p.unitOfMeasure === 'PIECE' ? (locale === 'ar' ? 'ق' : 'pcs') : ''}
                          </span>
                          {p.isLowStock && (
                            <Badge variant="destructive" className="text-[9px] px-1 py-0 h-4">
                              {locale === 'ar' ? 'منخفض' : 'Low'}
                            </Badge>
                          )}
                        </div>
                      </TableCell>

                      {/* Retail Price */}
                      <TableCell className="font-semibold text-xs text-foreground">
                        {retailPrice !== undefined ? formatEGP(retailPrice) : '-'}
                      </TableCell>

                      {/* Wholesale Price */}
                      <TableCell className="font-semibold text-xs text-emerald-600 dark:text-emerald-400">
                        {wholesalePrice !== undefined ? formatEGP(wholesalePrice) : '-'}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/products/${p.id}`} className="cursor-pointer">
                                <Eye className="h-4 w-4 rtl:ml-2 ltr:mr-2" />
                                {locale === 'ar' ? 'عرض التفاصيل' : 'View Details'}
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/products/${p.id}/edit`} className="cursor-pointer">
                                <Edit className="h-4 w-4 rtl:ml-2 ltr:mr-2" />
                                {locale === 'ar' ? 'تعديل الصنف' : 'Edit Product'}
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive cursor-pointer"
                              onClick={async () => {
                                if (confirm(locale === 'ar' ? 'هل أنت متأكد من حذف هذا المنتج؟' : 'Delete this product?')) {
                                  await fetch(`/api/products/${p.id}`, { method: 'DELETE' });
                                  fetchProducts();
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 rtl:ml-2 ltr:mr-2" />
                              {locale === 'ar' ? 'حذف' : 'Delete'}
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
        </div>

        {/* Mobile View: Cards */}
        <div className="divide-y md:hidden">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              {locale === 'ar' ? 'جاري تحميل المنتجات...' : 'Loading products...'}
            </div>
          ) : products.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              {locale === 'ar' ? 'لا توجد منتجات' : 'No products found'}
            </div>
          ) : (
            products.map((p) => {
              const retailPrice = p.prices?.find((pr: any) => pr.priceListType === 'RETAIL')?.unitPrice;
              const wholesalePrice = p.prices?.find((pr: any) => pr.priceListType === 'WHOLESALE')?.unitPrice;

              return (
                <div key={p.id} className="p-4 space-y-2 hover:bg-muted/30">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/products/${p.id}`}
                          className="font-mono font-bold text-blue-600 text-sm hover:underline"
                        >
                          {p.sku}
                        </Link>
                        {p.productType === 'BEARING' ? (
                          <Badge variant="info" className="text-[10px]">
                            ⚙️ {locale === 'ar' ? 'محمل' : 'Bearing'}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">
                            🔧 {locale === 'ar' ? 'قطع غيار' : 'Spare Part'}
                          </Badge>
                        )}
                      </div>
                      <div className="font-semibold text-sm mt-0.5">
                        {locale === 'ar' ? p.nameAr : p.nameEn}
                      </div>
                    </div>

                    <div className="text-end shrink-0">
                      <div className={`font-bold text-sm ${p.isLowStock ? 'text-destructive' : ''}`}>
                        {p.totalStock} {locale === 'ar' ? 'قطعة' : 'pcs'}
                      </div>
                      {p.isLowStock && (
                        <Badge variant="destructive" className="text-[9px] px-1 py-0">
                          {locale === 'ar' ? 'مخزون منخفض' : 'Low Stock'}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Specs row */}
                  {p.bearingSpec && (
                    <div className="text-xs text-muted-foreground font-mono bg-muted/40 p-1.5 rounded">
                      #{p.bearingSpec.bearingNumber} · {p.bearingSpec.brand} ·{' '}
                      {Number(p.bearingSpec.innerDiameterMm)}×{Number(p.bearingSpec.outerDiameterMm)}×
                      {Number(p.bearingSpec.widthMm)} mm ({p.bearingSpec.sealType})
                    </div>
                  )}

                  {p.sparePartSpec && (
                    <div className="text-xs text-muted-foreground bg-muted/40 p-1.5 rounded">
                      <span className="font-mono font-bold">#{p.sparePartSpec.partNumber}</span> ·{' '}
                      {p.sparePartSpec.brand} · {p.sparePartSpec.oemType}
                    </div>
                  )}

                  {/* Price & Actions Row */}
                  <div className="flex items-center justify-between pt-1 border-t text-xs">
                    <div className="flex items-center gap-3">
                      <span>
                        <span className="text-muted-foreground">{locale === 'ar' ? 'تجزئة: ' : 'Retail: '}</span>
                        <span className="font-bold">{retailPrice !== undefined ? formatEGP(retailPrice) : '-'}</span>
                      </span>
                      <span>
                        <span className="text-muted-foreground">{locale === 'ar' ? 'جملة: ' : 'Whsl: '}</span>
                        <span className="font-bold text-emerald-600">{wholesalePrice !== undefined ? formatEGP(wholesalePrice) : '-'}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" asChild className="h-7 px-2 text-xs">
                        <Link href={`/products/${p.id}`}>
                          {locale === 'ar' ? 'عرض' : 'View'}
                        </Link>
                      </Button>
                      <Button variant="ghost" size="sm" asChild className="h-7 px-2 text-xs">
                        <Link href={`/products/${p.id}/edit`}>
                          {locale === 'ar' ? 'تعديل' : 'Edit'}
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
}
