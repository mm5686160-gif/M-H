'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowRightLeft,
  Plus,
  Search,
  Warehouse,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Building2,
  Calendar,
  Package,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function TransfersPage() {
  const { locale, isRTL } = useI18n();

  const [transfers, setTransfers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchTransfers();
  }, []);

  const fetchTransfers = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/inventory/transfers');
      const json = await res.json();
      if (json.success) {
        setTransfers(json.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTransfers = transfers.filter((t) => {
    return (
      !searchQuery ||
      t.product?.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.product?.nameAr?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.product?.bearingNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.fromWarehouse?.nameAr?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.toWarehouse?.nameAr?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.reference?.toLowerCase().includes(searchQuery.toLowerCase())
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
            <ArrowRightLeft className="w-6 h-6 text-primary" />
            {isRTL ? 'سجل التحويلات بين المستودعات' : 'Inter-Warehouse Transfers'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isRTL
              ? 'متابعة نقل البضائع بين المستودع الرئيسي، مستودع العاشر، ومنافذ التوزيع'
              : 'Track stock transfers between central warehouses, regional hubs, and retail outlets'}
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Link href="/inventory/transfers/new" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto gap-2">
              <Plus className="w-4 h-4" />
              {isRTL ? 'إجراء تحويل جديد' : 'New Transfer'}
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
                  ? 'بحث بالصنف، المستودع، رقم الإذن...'
                  : 'Search by product, warehouse, reference...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-9"
            />
          </div>

          <Button variant="outline" size="icon" onClick={fetchTransfers} title={isRTL ? 'تحديث' : 'Refresh'}>
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
                <TableHead>{isRTL ? 'تاريخ التحويل' : 'Transfer Date'}</TableHead>
                <TableHead>{isRTL ? 'من مستودع' : 'From Warehouse'}</TableHead>
                <TableHead>{isRTL ? 'إلى مستودع' : 'To Warehouse'}</TableHead>
                <TableHead>{isRTL ? 'الصنف المحول' : 'Product'}</TableHead>
                <TableHead className="text-center">{isRTL ? 'الكمية المحولة' : 'Transferred Qty'}</TableHead>
                <TableHead>{isRTL ? 'رقم الإذن / المرجع' : 'Reference'}</TableHead>
                <TableHead>{isRTL ? 'المسؤول / ملاحظات' : 'By / Notes'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransfers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {isLoading
                      ? isRTL ? 'جاري التحميل...' : 'Loading...'
                      : isRTL ? 'لا توجد تحويلات مسجلة' : 'No transfers recorded'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransfers.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(t.transferDate).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US')}
                    </TableCell>

                    <TableCell className="font-semibold text-rose-600 dark:text-rose-400">
                      {isRTL ? t.fromWarehouse?.nameAr : t.fromWarehouse?.nameEn}
                    </TableCell>

                    <TableCell className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {isRTL ? t.toWarehouse?.nameAr : t.toWarehouse?.nameEn}
                    </TableCell>

                    <TableCell>
                      <div className="font-semibold text-xs font-mono text-primary">
                        <Link href={`/products/${t.productId}`} className="hover:underline">
                          {t.product?.sku}
                        </Link>
                        {(t.product?.bearingNumber || t.product?.partNumber) && (
                          <span className="text-slate-600 dark:text-slate-400 mr-2">
                            [{t.product?.bearingNumber || t.product?.partNumber}]
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-700 dark:text-slate-300">
                        {isRTL ? t.product?.nameAr : t.product?.nameEn}
                      </div>
                    </TableCell>

                    <TableCell className="text-center font-mono font-bold text-base text-blue-600">
                      {t.quantity} {isRTL ? 'قطعة' : 'pcs'}
                    </TableCell>

                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {t.reference || `TR-${t.id.slice(-6)}`}
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate" title={t.notes || ''}>
                      {t.transferredBy && <span className="font-medium text-slate-700 dark:text-slate-300 block">{t.transferredBy}</span>}
                      {t.notes || '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Mobile Card View */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {filteredTransfers.length === 0 ? (
          <Card className="p-6 text-center text-muted-foreground text-sm">
            {isLoading
              ? isRTL ? 'جاري التحميل...' : 'Loading...'
              : isRTL ? 'لا توجد تحويلات مسجلة' : 'No transfers recorded'}
          </Card>
        ) : (
          filteredTransfers.map((t) => (
            <Card key={t.id} className="border-slate-200 dark:border-slate-800 p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-mono text-xs font-bold text-primary">
                    {t.product?.sku} {t.product?.bearingNumber && `[${t.product?.bearingNumber}]`}
                  </div>
                  <div className="text-xs font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                    {isRTL ? t.product?.nameAr : t.product?.nameEn}
                  </div>
                </div>

                <div className="font-mono font-bold text-base text-blue-600">
                  {t.quantity}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs py-2 bg-slate-50 dark:bg-slate-900/60 p-2 rounded">
                <span className="font-medium text-rose-600">{isRTL ? t.fromWarehouse?.nameAr : t.fromWarehouse?.nameEn}</span>
                <ArrowRightLeft className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="font-medium text-emerald-600">{isRTL ? t.toWarehouse?.nameAr : t.toWarehouse?.nameEn}</span>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                <span>{new Date(t.transferDate).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US')}</span>
                <span>{t.reference || `TR-${t.id.slice(-6)}`}</span>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
