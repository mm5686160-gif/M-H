'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  History,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  Filter,
  Search,
  Warehouse,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Building2,
  Calendar,
  Layers,
  FileText,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function StockMovementsPage() {
  const { locale, isRTL } = useI18n();
  const searchParams = useSearchParams();
  const initialProductId = searchParams.get('productId') || '';

  const [movements, setMovements] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedWarehouse, setSelectedWarehouse] = useState('ALL');
  const [selectedDirection, setSelectedDirection] = useState('ALL'); // 'ALL' | 'IN' | 'OUT' | 'TRANSFER'
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchWarehouses();
    fetchMovements();
  }, [selectedWarehouse, selectedDirection]);

  const fetchWarehouses = async () => {
    try {
      const res = await fetch('/api/warehouses');
      const json = await res.json();
      if (json.success) setWarehouses(json.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMovements = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (initialProductId) params.set('productId', initialProductId);
      if (selectedWarehouse !== 'ALL') params.set('warehouseId', selectedWarehouse);

      const res = await fetch(`/api/inventory/movements?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setMovements(json.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredMovements = movements.filter((m) => {
    const matchesDirection = selectedDirection === 'ALL' || m.direction === selectedDirection;
    const matchesSearch =
      !searchQuery ||
      m.product?.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.product?.nameAr?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.product?.nameEn?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.product?.bearingNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.product?.partNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.reference?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesDirection && matchesSearch;
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
            <History className="w-6 h-6 text-primary" />
            {isRTL ? 'كارت حركة الصنف وسجل المخزون' : 'Stock Card Ledger & Movements'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isRTL
              ? 'سجل تفصيلي بكافة حركات الوارد والمنصرف والتحويلات وتسويات الجرد'
              : 'Detailed chronological movement history of inbound, outbound, transfers, and adjustments'}
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={fetchMovements} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          {isRTL ? 'تحديث السجل' : 'Refresh'}
        </Button>
      </div>

      {/* Filters Bar */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardContent className="p-4 flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={
                isRTL
                  ? 'بحث برقم الصنف، المحمل، رقم الفاتورة أو الإذن...'
                  : 'Search by SKU, bearing #, reference...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Direction Filter */}
            <select
              value={selectedDirection}
              onChange={(e) => setSelectedDirection(e.target.value)}
              className="h-10 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="ALL">{isRTL ? 'جميع الحركات' : 'All Movements'}</option>
              <option value="IN">{isRTL ? 'وارد (+)' : 'Inbound (+)'}</option>
              <option value="OUT">{isRTL ? 'منصرف (-)' : 'Outbound (-)'}</option>
              <option value="TRANSFER">{isRTL ? 'تحويل (↔)' : 'Transfers (↔)'}</option>
            </select>

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
          </div>
        </CardContent>
      </Card>

      {/* Desktop Table View */}
      <div className="hidden md:block">
        <Card className="border-slate-200 dark:border-slate-800 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-900/50">
                <TableHead>{isRTL ? 'التاريخ والوقت' : 'Date / Time'}</TableHead>
                <TableHead>{isRTL ? 'نوع الحركة' : 'Movement Type'}</TableHead>
                <TableHead>{isRTL ? 'الصنف / الكود' : 'Product / SKU'}</TableHead>
                <TableHead>{isRTL ? 'المستودع' : 'Warehouse'}</TableHead>
                <TableHead className="text-center">{isRTL ? 'الكمية' : 'Quantity'}</TableHead>
                <TableHead>{isRTL ? 'رقم الإذن / المرجع' : 'Reference'}</TableHead>
                <TableHead>{isRTL ? 'الجهة / الملاحظات' : 'Entity / Notes'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMovements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {isLoading
                      ? isRTL ? 'جاري تحميل الحركات...' : 'Loading movements...'
                      : isRTL ? 'لا توجد حركات مطابقة' : 'No movements found'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredMovements.map((m) => {
                  return (
                    <TableRow key={m.id}>
                      <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(m.date).toLocaleString(locale === 'ar' ? 'ar-EG' : 'en-US', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </TableCell>

                      <TableCell>
                        {m.direction === 'IN' ? (
                          <Badge variant="outline" className="text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 gap-1">
                            <ArrowDownLeft className="w-3 h-3" />
                            {isRTL ? m.typeLabelAr : m.typeLabelEn}
                          </Badge>
                        ) : m.direction === 'OUT' ? (
                          <Badge variant="outline" className="text-rose-700 bg-rose-50 dark:bg-rose-950/40 border-rose-300 gap-1">
                            <ArrowUpRight className="w-3 h-3" />
                            {isRTL ? m.typeLabelAr : m.typeLabelEn}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-blue-700 bg-blue-50 dark:bg-blue-950/40 border-blue-300 gap-1">
                            <ArrowRightLeft className="w-3 h-3" />
                            {isRTL ? m.typeLabelAr : m.typeLabelEn}
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell>
                        <div className="font-semibold text-xs font-mono text-primary">
                          <Link href={`/products/${m.productId}`} className="hover:underline">
                            {m.product?.sku}
                          </Link>
                          {(m.product?.bearingNumber || m.product?.partNumber) && (
                            <span className="text-slate-600 dark:text-slate-400 mr-2">
                              [{m.product?.bearingNumber || m.product?.partNumber}]
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-700 dark:text-slate-300">
                          {isRTL ? m.product?.nameAr : m.product?.nameEn}
                        </div>
                      </TableCell>

                      <TableCell className="text-xs font-medium">
                        {m.direction === 'TRANSFER' && m.fromWarehouse ? (
                          <div className="flex items-center gap-1 font-mono text-[11px]">
                            <span>{m.fromWarehouse.nameAr}</span>
                            <ArrowRightLeft className="w-3 h-3 text-muted-foreground" />
                            <span className="font-semibold">{m.warehouse?.nameAr}</span>
                          </div>
                        ) : (
                          <span>{isRTL ? m.warehouse?.nameAr : m.warehouse?.nameEn}</span>
                        )}
                      </TableCell>

                      <TableCell className="text-center font-bold font-mono text-sm">
                        {m.direction === 'IN' ? (
                          <span className="text-emerald-600">+{m.quantity}</span>
                        ) : m.direction === 'OUT' ? (
                          <span className="text-rose-600">-{m.quantity}</span>
                        ) : (
                          <span className="text-blue-600">{m.quantity}</span>
                        )}
                      </TableCell>

                      <TableCell className="font-mono text-xs text-slate-600 dark:text-slate-400">
                        {m.reference || '-'}
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate" title={m.notes || ''}>
                        {m.notes || '-'}
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
        {filteredMovements.length === 0 ? (
          <Card className="p-6 text-center text-muted-foreground text-sm">
            {isLoading
              ? isRTL ? 'جاري التحميل...' : 'Loading...'
              : isRTL ? 'لا توجد حركات مطابقة' : 'No movements found'}
          </Card>
        ) : (
          filteredMovements.map((m) => (
            <Card key={m.id} className="border-slate-200 dark:border-slate-800 p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-mono text-xs font-bold text-primary">
                    {m.product?.sku} {m.product?.bearingNumber && `[${m.product?.bearingNumber}]`}
                  </div>
                  <div className="text-xs font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                    {isRTL ? m.product?.nameAr : m.product?.nameEn}
                  </div>
                </div>

                <div className="font-mono font-bold text-base">
                  {m.direction === 'IN' ? (
                    <span className="text-emerald-600">+{m.quantity}</span>
                  ) : m.direction === 'OUT' ? (
                    <span className="text-rose-600">-{m.quantity}</span>
                  ) : (
                    <span className="text-blue-600">{m.quantity}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
                <span className="text-muted-foreground">
                  {new Date(m.date).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US')}
                </span>
                <span className="font-medium">{isRTL ? m.warehouse?.nameAr : m.warehouse?.nameEn}</span>
              </div>

              {m.notes && (
                <div className="text-xs text-muted-foreground bg-slate-50 dark:bg-slate-900 p-2 rounded">
                  {m.notes}
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
