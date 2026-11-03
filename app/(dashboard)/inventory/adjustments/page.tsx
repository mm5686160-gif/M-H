'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sliders,
  Plus,
  Search,
  Warehouse,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Building2,
  Calendar,
  AlertOctagon,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function AdjustmentsPage() {
  const { locale, isRTL } = useI18n();

  const [adjustments, setAdjustments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchAdjustments();
  }, []);

  const fetchAdjustments = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/inventory/adjustments');
      const json = await res.json();
      if (json.success) {
        setAdjustments(json.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAdjustments = adjustments.filter((a) => {
    return (
      !searchQuery ||
      a.product?.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.product?.nameAr?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.product?.bearingNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.warehouse?.nameAr?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.reason?.toLowerCase().includes(searchQuery.toLowerCase())
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
            <Sliders className="w-6 h-6 text-primary" />
            {isRTL ? 'تسويات الجرد والعجز والتالف' : 'Stock Adjustments'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isRTL
              ? 'تسجيل الفروقات الجردية، إهلاك البضاعة التالفة أو المكسورة، ومطابقة الأرصدة الدفترية مع الفعلية'
              : 'Physical stocktake reconciliations, scrap/damage write-offs, and stock adjustments'}
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Link href="/inventory/adjustments/new" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto gap-2">
              <Plus className="w-4 h-4" />
              {isRTL ? 'تسجيل تسوية جديدة' : 'New Adjustment'}
            </Button>
          </Link>
        </div>
      </div>

      {/* Search Bar */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardContent className="p-4 flex items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={
                isRTL
                  ? 'بحث بالصنف، المستودع، سبب التسوية...'
                  : 'Search by product, warehouse, reason...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-9"
            />
          </div>

          <Button variant="outline" size="icon" onClick={fetchAdjustments} title={isRTL ? 'تحديث' : 'Refresh'}>
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </CardContent>
      </Card>

      {/* Desktop Table View */}
      <div className="hidden md:block">
        <Card className="border-slate-200 dark:border-slate-800 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-900/50">
                <TableHead>{isRTL ? 'تاريخ التسوية' : 'Date'}</TableHead>
                <TableHead>{isRTL ? 'المستودع' : 'Warehouse'}</TableHead>
                <TableHead>{isRTL ? 'الصنف' : 'Product'}</TableHead>
                <TableHead className="text-center">{isRTL ? 'الرصيد السابق' : 'Qty Before'}</TableHead>
                <TableHead className="text-center">{isRTL ? 'الرصيد الجديد' : 'Qty After'}</TableHead>
                <TableHead className="text-center">{isRTL ? 'الفارق' : 'Difference'}</TableHead>
                <TableHead>{isRTL ? 'سبب التسوية' : 'Reason'}</TableHead>
                <TableHead>{isRTL ? 'المسؤول' : 'By'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAdjustments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    {isLoading
                      ? isRTL ? 'جاري التحميل...' : 'Loading...'
                      : isRTL ? 'لا توجد تسويات مسجلة' : 'No adjustments recorded'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredAdjustments.map((a) => {
                  const diff = a.difference;
                  return (
                    <TableRow key={a.id}>
                      <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(a.adjustmentDate).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US')}
                      </TableCell>

                      <TableCell className="font-medium text-slate-900 dark:text-slate-100">
                        {isRTL ? a.warehouse?.nameAr : a.warehouse?.nameEn}
                      </TableCell>

                      <TableCell>
                        <div className="font-semibold text-xs font-mono text-primary">
                          <Link href={`/products/${a.productId}`} className="hover:underline">
                            {a.product?.sku}
                          </Link>
                          {(a.product?.bearingNumber || a.product?.partNumber) && (
                            <span className="text-slate-600 dark:text-slate-400 mr-2">
                              [{a.product?.bearingNumber || a.product?.partNumber}]
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-700 dark:text-slate-300">
                          {isRTL ? a.product?.nameAr : a.product?.nameEn}
                        </div>
                      </TableCell>

                      <TableCell className="text-center font-mono text-xs text-muted-foreground">
                        {a.quantityBefore}
                      </TableCell>

                      <TableCell className="text-center font-mono text-xs font-bold">
                        {a.quantityAfter}
                      </TableCell>

                      <TableCell className="text-center font-mono font-bold text-sm">
                        {diff > 0 ? (
                          <span className="text-emerald-600">+{diff}</span>
                        ) : diff < 0 ? (
                          <span className="text-rose-600">{diff}</span>
                        ) : (
                          <span className="text-slate-500">0</span>
                        )}
                      </TableCell>

                      <TableCell className="text-xs text-slate-800 dark:text-slate-200">
                        {a.reason}
                      </TableCell>

                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {a.adjustedBy || '-'}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Mobile Card View */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {filteredAdjustments.length === 0 ? (
          <Card className="p-6 text-center text-muted-foreground text-sm">
            {isLoading
              ? isRTL ? 'جاري التحميل...' : 'Loading...'
              : isRTL ? 'لا توجد تسويات مسجلة' : 'No adjustments recorded'}
          </Card>
        ) : (
          filteredAdjustments.map((a) => {
            const diff = a.difference;
            return (
              <Card key={a.id} className="border-slate-200 dark:border-slate-800 p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-mono text-xs font-bold text-primary">
                      {a.product?.sku} {a.product?.bearingNumber && `[${a.product?.bearingNumber}]`}
                    </div>
                    <div className="text-xs font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                      {isRTL ? a.product?.nameAr : a.product?.nameEn}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {isRTL ? a.warehouse?.nameAr : a.warehouse?.nameEn}
                    </div>
                  </div>

                  <div className="text-left font-mono font-bold text-sm">
                    {diff > 0 ? (
                      <span className="text-emerald-600">+{diff}</span>
                    ) : diff < 0 ? (
                      <span className="text-rose-600">{diff}</span>
                    ) : (
                      <span>0</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs py-1.5 border-y border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-muted-foreground block">{isRTL ? 'قبل التسوية' : 'Before'}</span>
                    <span className="font-mono">{a.quantityBefore}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">{isRTL ? 'الرصيد الفعلي بعد التسوية' : 'After'}</span>
                    <span className="font-mono font-bold">{a.quantityAfter}</span>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground">
                  <span className="font-medium text-slate-700 dark:text-slate-300">{isRTL ? 'السبب: ' : 'Reason: '}</span>
                  {a.reason}
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
