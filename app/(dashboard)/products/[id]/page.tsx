'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Package,
  Wrench,
  Edit,
  Trash2,
  Barcode,
  Layers,
  Warehouse,
  History,
  TrendingUp,
  Tag,
  AlertTriangle,
  CheckCircle2,
  Share2,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatEGP } from '@/lib/utils';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { locale, isRTL } = useI18n();

  const [product, setProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params?.id) {
      fetchProduct(params.id as string);
    }
  }, [params?.id]);

  const fetchProduct = async (id: string) => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/products/${id}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Product not found');
      }
      setProduct(json.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (confirm(locale === 'ar' ? 'هل أنت متأكد من حذف هذا المنتج؟' : 'Are you sure you want to delete this product?')) {
      const res = await fetch(`/api/products/${params.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        router.push('/products');
      } else {
        alert(json.error || json.message);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        {locale === 'ar' ? 'جاري تحميل تفاصيل الصنف...' : 'Loading product details...'}
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="text-destructive font-bold">{error || 'Product not found'}</div>
        <Button asChild variant="outline">
          <Link href="/products">{locale === 'ar' ? 'الرجوع للمنتجات' : 'Back to products'}</Link>
        </Button>
      </div>
    );
  }

  const isLowStock = product.totalStock <= product.minStockLevel;

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild className="h-8 px-2">
              <Link href="/products" className="flex items-center gap-1 text-xs">
                {isRTL ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
                <span>{locale === 'ar' ? 'الكتالوج' : 'Catalog'}</span>
              </Link>
            </Button>
            <span className="text-muted-foreground">/</span>
            <span className="font-mono text-xs font-bold text-muted-foreground">{product.sku}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {locale === 'ar' ? product.nameAr : product.nameEn}
            </h1>
            {product.productType === 'BEARING' ? (
              <Badge variant="info" className="text-xs">
                ⚙️ {locale === 'ar' ? 'محمل (Bearing)' : 'Bearing'}
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs">
                🔧 {locale === 'ar' ? 'قطعة غيار' : 'Spare Part'}
              </Badge>
            )}
            {isLowStock && (
              <Badge variant="destructive" className="text-xs">
                <AlertTriangle className="h-3 w-3 rtl:ml-1 ltr:mr-1" />
                {locale === 'ar' ? 'تنبيه: مخزون منخفض' : 'Low Stock Alert'}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild className="h-9">
            <Link href={`/products/${product.id}/edit`}>
              <Edit className="h-4 w-4 rtl:ml-1.5 ltr:mr-1.5" />
              {locale === 'ar' ? 'تعديل البيانات' : 'Edit'}
            </Link>
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            className="h-9"
          >
            <Trash2 className="h-4 w-4 rtl:ml-1.5 ltr:mr-1.5" />
            {locale === 'ar' ? 'حذف' : 'Delete'}
          </Button>
        </div>
      </div>

      {/* Main Details Grid: Left 2 cols specifications, Right 1 col stock & pricing */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Specifications, Fits, Cross-References */}
        <div className="lg:col-span-2 space-y-6">
          {/* Specifications Card */}
          {product.productType === 'BEARING' && product.bearingSpec ? (
            <Card className="border shadow-sm">
              <CardHeader className="bg-muted/30 border-b">
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-600" />
                  {locale === 'ar' ? 'المواصفات الهندسية للمحمل' : 'Bearing Engineering Specs'}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 text-sm">
                  <div>
                    <span className="text-xs text-muted-foreground block">{locale === 'ar' ? 'رقم المحمل' : 'Bearing #'}</span>
                    <span className="font-mono font-bold text-base text-blue-600">{product.bearingSpec.bearingNumber}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">{locale === 'ar' ? 'الماركة' : 'Brand'}</span>
                    <span className="font-semibold">{product.bearingSpec.brand}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">{locale === 'ar' ? 'بلد المنشأ' : 'Origin'}</span>
                    <span>{product.bearingSpec.originCountry}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">{locale === 'ar' ? 'القطر الداخلي (d)' : 'Inner Diameter (d)'}</span>
                    <span className="font-mono font-bold">{Number(product.bearingSpec.innerDiameterMm)} mm</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">{locale === 'ar' ? 'القطر الخارجي (D)' : 'Outer Diameter (D)'}</span>
                    <span className="font-mono font-bold">{Number(product.bearingSpec.outerDiameterMm)} mm</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">{locale === 'ar' ? 'العرض (B)' : 'Width (B)'}</span>
                    <span className="font-mono font-bold">{Number(product.bearingSpec.widthMm)} mm</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">{locale === 'ar' ? 'نوع الحشوة' : 'Seal Type'}</span>
                    <span className="font-mono font-semibold">{product.bearingSpec.sealType}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">{locale === 'ar' ? 'الخامة' : 'Material'}</span>
                    <span>{product.bearingSpec.material || 'Standard'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">{locale === 'ar' ? 'نوع المحمل' : 'Type'}</span>
                    <span>{product.bearingSpec.bearingType}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : product.productType === 'SPARE_PART' && product.sparePartSpec ? (
            <Card className="border shadow-sm">
              <CardHeader className="bg-muted/30 border-b">
                <CardTitle className="text-base flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-indigo-600" />
                  {locale === 'ar' ? 'بيانات قطعة الغيار والأجهزة المتوافقة' : 'Spare Part & Compatibility'}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-xs text-muted-foreground block">{locale === 'ar' ? 'كود القطعة' : 'Part #'}</span>
                    <span className="font-mono font-bold text-base text-indigo-600">{product.sparePartSpec.partNumber}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">{locale === 'ar' ? 'الماركة' : 'Brand'}</span>
                    <span className="font-semibold">{product.sparePartSpec.brand}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">{locale === 'ar' ? 'النوع' : 'OEM / Aftermarket'}</span>
                    <Badge variant={product.sparePartSpec.oemType === 'OEM' ? 'success' : 'secondary'}>
                      {product.sparePartSpec.oemType}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">{locale === 'ar' ? 'بلد المنشأ' : 'Origin'}</span>
                    <span>{product.sparePartSpec.originCountry}</span>
                  </div>
                </div>

                {/* Fits models list */}
                <div className="space-y-2 pt-4 border-t">
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground">
                    {locale === 'ar' ? 'الأجهزة المتوافقة المعتمدة' : 'Verified Appliance Compatibility'}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {product.sparePartSpec.compatibleModels?.map((cm: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg border bg-muted/20 text-xs">
                        <span className="font-bold">{cm.applianceBrand}</span>
                        <span className="font-mono text-muted-foreground">{cm.modelNumber || (locale === 'ar' ? 'جميع الموديلات' : 'All Models')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* Cross References (Equivalent Parts) */}
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span>{locale === 'ar' ? 'الأرقام المكافئة والبدائل المتاحة' : 'Cross-Reference & Alternate Numbers'}</span>
                <Badge variant="outline">{product.crossReferences?.length || 0}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {product.crossReferences?.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  {locale === 'ar' ? 'لا توجد أرقام مكافئة مسجلة لهذا الصنف' : 'No cross-references registered'}
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {product.crossReferences.map((cr: any) => (
                    <div key={cr.id} className="flex items-center justify-between p-3 rounded-lg border bg-card text-xs">
                      <span className="font-mono font-bold text-sm">{cr.alternateNumber}</span>
                      <span className="text-muted-foreground">{cr.alternateBrand || '-'}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cost History (Owner & Manager Only) */}
          {product.currentWAC !== undefined && (
            <Card className="border shadow-sm">
              <CardHeader className="bg-muted/20 border-b">
                <CardTitle className="text-base flex items-center gap-2">
                  <History className="h-4 w-4 text-emerald-600" />
                  {locale === 'ar' ? 'سجل أسعار الاستيراد والتكلفة الفعلية (WAC)' : 'Cost History & Landed WAC'}
                </CardTitle>
                <CardDescription className="text-xs">
                  {locale === 'ar'
                    ? 'متوسط التكلفة الحالي المحسوب شاملاً مصاريف الشحن والتخليص الجمركي'
                    : 'Current true weighted-average cost including customs and freight'}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mb-4">
                  <div>
                    <span className="text-xs text-emerald-800 dark:text-emerald-300 block">
                      {locale === 'ar' ? 'متوسط التكلفة الحالي (Current WAC)' : 'Current True Unit Cost'}
                    </span>
                    <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
                      {formatEGP(product.currentWAC)}
                    </span>
                  </div>
                  <Badge variant="success" className="text-xs">
                    {locale === 'ar' ? 'محدث آلياً مع كل استلام' : 'Auto Updated'}
                  </Badge>
                </div>

                {product.costHistory?.length > 0 && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{locale === 'ar' ? 'التاريخ' : 'Date'}</TableHead>
                        <TableHead>{locale === 'ar' ? 'المصدر' : 'Source'}</TableHead>
                        <TableHead>{locale === 'ar' ? 'تكلفة الوحدة' : 'Unit Cost'}</TableHead>
                        <TableHead>{locale === 'ar' ? 'الكمية' : 'Qty'}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {product.costHistory.map((ch: any) => (
                        <TableRow key={ch.id} className="text-xs">
                          <TableCell>{new Date(ch.effectiveDate).toLocaleDateString()}</TableCell>
                          <TableCell><Badge variant="outline">{ch.source}</Badge></TableCell>
                          <TableCell className="font-bold">{formatEGP(ch.costPerUnit)}</TableCell>
                          <TableCell>{ch.quantityAtTime || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right 1 Col: Stock By Warehouse & Selling Prices */}
        <div className="space-y-6">
          {/* Total Stock Summary */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                <span>{locale === 'ar' ? 'المخزون الإجمالي' : 'Total Stock On-Hand'}</span>
                <Warehouse className="h-4 w-4 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-baseline justify-between border-b pb-3">
                <span className={`text-3xl font-black ${isLowStock ? 'text-destructive' : 'text-foreground'}`}>
                  {product.totalStock}
                </span>
                <span className="text-xs text-muted-foreground">
                  {locale === 'ar' ? 'الحد الأدنى: ' : 'Min alert: '}
                  <strong className="font-mono">{product.minStockLevel}</strong>
                </span>
              </div>

              {/* By warehouse */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-muted-foreground block">
                  {locale === 'ar' ? 'الأرصدة بالمستودعات:' : 'By Warehouse:'}
                </span>
                {product.warehouses?.map((w: any) => (
                  <div key={w.id} className="flex items-center justify-between p-2.5 rounded-lg border bg-muted/20 text-xs">
                    <div>
                      <div className="font-bold">{w.warehouseNameAr}</div>
                      {w.shelfLocation && (
                        <div className="text-[10px] text-muted-foreground">
                          {locale === 'ar' ? 'الرف: ' : 'Shelf: '}
                          <span className="font-mono">{w.shelfLocation}</span>
                        </div>
                      )}
                    </div>
                    <span className="font-mono font-bold text-sm">{w.quantityOnHand}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Price Lists Table */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                <span>{locale === 'ar' ? 'أسعار البيع المعتمدة' : 'Selling Price Lists'}</span>
                <Tag className="h-4 w-4 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {product.productPrices?.map((p: any) => {
                // If user can see cost, calculate gross profit margin
                let marginPct = null;
                if (product.currentWAC !== undefined && product.currentWAC > 0) {
                  marginPct = ((p.unitPrice - product.currentWAC) / p.unitPrice) * 100;
                }

                return (
                  <div key={p.id} className="p-3 rounded-lg border bg-card space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold">{p.priceListName}</span>
                      <span className="font-mono font-bold text-sm text-foreground">
                        {formatEGP(p.unitPrice)}
                      </span>
                    </div>
                    {marginPct !== null && (
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>{locale === 'ar' ? 'هامش الربح:' : 'Profit Margin:'}</span>
                        <span className={`font-semibold ${marginPct >= 20 ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {marginPct.toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
