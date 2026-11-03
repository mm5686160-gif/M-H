'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  ShoppingCart,
  Truck,
  Ship,
  Anchor,
  ShieldCheck,
  CheckCircle2,
  Calculator,
  Download,
  AlertTriangle,
  FileText,
  DollarSign,
  Package,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatEGP, formatCurrency } from '@/lib/utils';

export default function PurchaseOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { locale, isRTL } = useI18n();

  const [po, setPo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (params?.id) {
      fetchPO(params.id as string);
    }
  }, [params?.id]);

  const fetchPO = async (id: string) => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/purchases/${id}`);
      const json = await res.json();
      if (json.success) {
        setPo(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        {locale === 'ar' ? 'جاري تحميل تفاصيل أمر الشراء...' : 'Loading PO details...'}
      </div>
    );
  }

  if (!po) {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="text-destructive font-bold">{locale === 'ar' ? 'أمر الشراء غير موجود' : 'PO not found'}</div>
        <Button asChild variant="outline">
          <Link href="/purchases">{locale === 'ar' ? 'الرجوع للمشتريات' : 'Back to Purchases'}</Link>
        </Button>
      </div>
    );
  }

  const milestones = [
    { key: 'ORDERED', labelAr: 'تم الطلب', labelEn: 'Ordered', icon: ShoppingCart },
    { key: 'SHIPPED', labelAr: 'تم الشحن البحري', labelEn: 'Shipped', icon: Ship },
    { key: 'AT_PORT', labelAr: 'وصول الميناء', labelEn: 'At Port', icon: Anchor },
    { key: 'CUSTOMS', labelAr: 'التخليص الجمركي', labelEn: 'In Customs', icon: ShieldCheck },
    { key: 'RECEIVED', labelAr: 'تم الاستلام بالمخزن', labelEn: 'Received', icon: CheckCircle2 },
  ];

  const currentStepIndex = milestones.findIndex((m) => m.key === po.status);
  const hasLandedCost = po.shipment && po.shipment.totalLandedCostEGP > 0;

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header & Fast Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild className="h-8 px-2">
              <Link href="/purchases" className="flex items-center gap-1 text-xs">
                {isRTL ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
                <span>{locale === 'ar' ? 'أوامر الشراء' : 'Purchases'}</span>
              </Link>
            </Button>
            <span className="text-muted-foreground">/</span>
            <span className="font-mono text-xs font-bold text-muted-foreground">{po.poNumber}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {po.poNumber}
            </h1>
            <Badge variant="outline" className="text-xs">
              {po.supplier?.nameAr} ({po.supplier?.country})
            </Badge>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild className="h-9">
            <Link href={`/purchases/${po.id}/landed-cost`}>
              <Calculator className="h-4 w-4 rtl:ml-1.5 ltr:mr-1.5" />
              <span>{locale === 'ar' ? 'حساب تكلفة الاستيراد' : 'Landed Cost'}</span>
            </Link>
          </Button>

          <Button size="sm" asChild className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
            <Link href={`/purchases/${po.id}/receive`}>
              <CheckCircle2 className="h-4 w-4 rtl:ml-1.5 ltr:mr-1.5" />
              <span>{locale === 'ar' ? 'استلام البضائع بالمستودع' : 'Receive Goods'}</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Visual Shipment Milestone Tracker */}
      <Card className="border shadow-sm overflow-hidden">
        <CardHeader className="pb-3 bg-muted/20 border-b">
          <CardTitle className="text-sm font-semibold flex items-center justify-between">
            <span>{locale === 'ar' ? 'متابعة مسار الشحنة والاستيراد' : 'Import Shipment Tracker'}</span>
            {po.shipment?.trackingNumber && (
              <span className="text-xs font-mono text-muted-foreground">
                {locale === 'ar' ? 'رقم البوليصة: ' : 'B/L #: '}
                <strong>{po.shipment.trackingNumber}</strong>
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {milestones.map((m, idx) => {
              const Icon = m.icon;
              const isPassed = currentStepIndex >= idx;
              const isCurrent = currentStepIndex === idx;

              return (
                <div
                  key={m.key}
                  className={`flex flex-col items-center text-center p-3 rounded-xl border transition-all ${
                    isCurrent
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-500/20'
                      : isPassed
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                      : 'bg-muted/20 border-dashed text-muted-foreground'
                  }`}
                >
                  <div
                    className={`h-9 w-9 rounded-full flex items-center justify-center mb-1.5 ${
                      isCurrent
                        ? 'bg-white text-blue-600 font-bold'
                        : isPassed
                        ? 'bg-emerald-600 text-white'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="font-bold text-xs">{locale === 'ar' ? m.labelAr : m.labelEn}</span>
                  <span className="text-[10px] opacity-80 mt-0.5">
                    {idx === 0 && new Date(po.orderDate).toLocaleDateString()}
                    {idx === 4 && po.shipment?.receivedDate && new Date(po.shipment.receivedDate).toLocaleDateString()}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards: Foreign Value, Rate, EGP Total, Landed Cost */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">
              {locale === 'ar' ? 'إجمالي الفاتورة الأجنبية' : 'Foreign Invoice Total'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold font-mono text-foreground">
              {formatCurrency(po.subtotalForeign, po.currency)}
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {locale === 'ar' ? 'قيمة البضاعة لدى المورد' : 'Supplier goods total'}
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">
              {locale === 'ar' ? 'سعر الصرف المعتمد' : 'Exchange Rate'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold font-mono text-foreground">
              {po.exchangeRate.toFixed(2)} ج.م
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {locale === 'ar' ? `لكل 1 ${po.currency}` : `per 1 ${po.currency}`}
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">
              {locale === 'ar' ? 'إجمالي البضاعة بالجنيه' : 'Goods Total (EGP)'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold font-mono text-blue-600">
              {formatEGP(po.subtotalEGP)}
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {locale === 'ar' ? 'سعر الصرف × القيمة' : 'Rate × Foreign Amt'}
            </p>
          </CardContent>
        </Card>

        <Card className={`border shadow-sm ${hasLandedCost ? 'bg-emerald-500/10 border-emerald-500/30' : ''}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">
              {locale === 'ar' ? 'تكاليف الاستيراد (جمارك + شحن)' : 'Total Landed Expenses'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-400">
              {hasLandedCost ? formatEGP(po.shipment.totalLandedCostEGP) : (locale === 'ar' ? 'معلق التوزيع' : 'Pending')}
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {hasLandedCost
                ? (locale === 'ar' ? `موزع ${po.shipment.allocationMethod === 'BY_VALUE' ? 'بالقيمة' : 'بالوزن'}` : 'Allocated')
                : (locale === 'ar' ? 'اضغط لتوزيع التكلفة' : 'Click to allocate')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* PO Items Table */}
      <Card className="border shadow-sm overflow-hidden">
        <CardHeader className="pb-3 bg-muted/20 border-b">
          <CardTitle className="text-base sm:text-lg">
            {locale === 'ar' ? 'بنود أمر الشراء وتفاصيل تكلفة الوحدة' : 'PO Line Items & True Cost'}
          </CardTitle>
          <CardDescription className="text-xs">
            {locale === 'ar'
              ? 'مقارنة سعر شراء الوحدة بالعملة الأجنبية مع تكلفة الاستيراد الموزعة والتكلفة الحقيقية بالجنيه'
              : 'Foreign purchase price vs. allocated landed cost vs. true landed unit cost in EGP'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>{locale === 'ar' ? 'كود الصنف / SKU' : 'SKU'}</TableHead>
                <TableHead>{locale === 'ar' ? 'اسم الصنف' : 'Product'}</TableHead>
                <TableHead className="text-center">{locale === 'ar' ? 'الكمية المطلوبة' : 'Ordered'}</TableHead>
                <TableHead className="text-center">{locale === 'ar' ? 'الكمية المستلمة' : 'Received'}</TableHead>
                <TableHead>{locale === 'ar' ? 'السعر الأجنبي' : 'Foreign Unit'}</TableHead>
                <TableHead>{locale === 'ar' ? 'السعر بالجنيه' : 'Unit EGP'}</TableHead>
                <TableHead>{locale === 'ar' ? 'نصيب الاستيراد/وحدة' : 'Landed/Unit'}</TableHead>
                <TableHead className="font-bold text-emerald-700">{locale === 'ar' ? 'التكلفة الحقيقية/وحدة' : 'True Unit Cost'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {po.items.map((it: any) => {
                const isFullyReceived = it.quantityReceived >= it.quantityOrdered;

                return (
                  <TableRow key={it.id} className="text-xs hover:bg-muted/30">
                    <TableCell className="font-mono font-bold text-blue-600">
                      <Link href={`/products/${it.productId}`}>{it.product.sku}</Link>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold">{it.product.nameAr}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {it.product.bearingSpec?.bearingNumber || it.product.sparePartSpec?.partNumber}
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-mono font-bold">{it.quantityOrdered}</TableCell>
                    <TableCell className="text-center font-mono">
                      <span className={isFullyReceived ? 'text-emerald-600 font-bold' : 'text-amber-600'}>
                        {it.quantityReceived}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono font-semibold">
                      {formatCurrency(it.unitPriceForeign, po.currency)}
                    </TableCell>
                    <TableCell className="font-mono">{formatEGP(it.unitPriceEGP)}</TableCell>
                    <TableCell className="font-mono text-muted-foreground">
                      {it.landedCostPerUnit > 0 ? `+ ${formatEGP(it.landedCostPerUnit)}` : '-'}
                    </TableCell>
                    <TableCell className="font-mono font-black text-emerald-700 dark:text-emerald-400">
                      {formatEGP(it.trueUnitCostEGP)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
