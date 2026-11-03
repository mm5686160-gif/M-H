'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Warehouse,
  CheckCircle2,
  AlertCircle,
  Package,
  Layers,
  Save,
  TrendingUp,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatEGP, calculateWAC } from '@/lib/utils';
import Decimal from 'decimal.js';

export default function ReceiveGoodsPage() {
  const params = useParams();
  const router = useRouter();
  const { locale, isRTL } = useI18n();

  const [po, setPo] = useState<any>(null);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // Per item input
  const [receivedQtys, setReceivedQtys] = useState<Record<string, string>>({});
  const [itemWarehouses, setItemWarehouses] = useState<Record<string, string>>({});
  const [shelfLocations, setShelfLocations] = useState<Record<string, string>>({});

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/purchases/${params?.id}`).then((r) => r.json()),
      fetch('/api/warehouses').then((r) => r.json()),
    ]).then(([poData, whData]) => {
      if (poData.success) {
        setPo(poData.data);
        const initialQtys: Record<string, string> = {};
        poData.data.items.forEach((it: any) => {
          const remaining = Math.max(0, it.quantityOrdered - it.quantityReceived);
          initialQtys[it.id] = remaining.toString();
        });
        setReceivedQtys(initialQtys);
      }
      if (whData.success && whData.data.length > 0) {
        setWarehouses(whData.data);
        setSelectedWarehouseId(whData.data[0].id);
      }
      setIsLoading(false);
    });
  }, [params?.id]);

  const handleBulkWarehouseChange = (whId: string) => {
    setSelectedWarehouseId(whId);
    const updated: Record<string, string> = {};
    po?.items?.forEach((it: any) => {
      updated[it.id] = whId;
    });
    setItemWarehouses(updated);
  };

  const handleReceiveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const itemsToReceive = po.items
      .map((it: any) => ({
        poItemId: it.id,
        quantityReceived: parseFloat(receivedQtys[it.id] || '0'),
        warehouseId: itemWarehouses[it.id] || selectedWarehouseId,
        shelfLocation: shelfLocations[it.id] || '',
      }))
      .filter((it: any) => it.quantityReceived > 0);

    if (itemsToReceive.length === 0) {
      setErrorMessage(
        locale === 'ar'
          ? 'يرجى تحديد كمية مستلمة أكبر من صفر لبند واحد على الأقل'
          : 'Please enter a received quantity > 0 for at least one item'
      );
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/purchases/${params.id}/receive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiptDate,
          notes,
          items: itemsToReceive,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to receive goods');
      }

      router.push(`/purchases/${params.id}`);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        {locale === 'ar' ? 'جاري التحميل...' : 'Loading...'}
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild className="h-8 px-2">
          <Link href={`/purchases/${params.id}`} className="flex items-center gap-1 text-xs">
            {isRTL ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
            <span>{locale === 'ar' ? `الرجوع لأمر ${po?.poNumber}` : 'Back to PO'}</span>
          </Link>
        </Button>
        <span className="text-muted-foreground">/</span>
        <h1 className="text-xl sm:text-2xl font-bold">
          {locale === 'ar' ? 'استلام البضائع وفحص الوارد بالمستودعات' : 'Receive Goods & Increment Stock'}
        </h1>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 rounded-lg bg-red-500/10 p-4 text-sm text-red-600 dark:text-red-400 border border-red-500/20">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleReceiveSubmit} className="space-y-6">
        {/* Receipt Setup */}
        <Card className="border shadow-sm">
          <CardHeader className="bg-muted/20 border-b pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Warehouse className="h-5 w-5 text-emerald-600" />
              {locale === 'ar' ? 'بيانات إذن الاستلام المخزني' : 'Goods Receipt Header'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="rcvDate" className="text-xs font-semibold">
                  {locale === 'ar' ? 'تاريخ الاستلام الفعلي' : 'Receipt Date'}
                </Label>
                <Input
                  id="rcvDate"
                  type="date"
                  value={receiptDate}
                  onChange={(e) => setReceiptDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="bulkWh" className="text-xs font-semibold">
                  {locale === 'ar' ? 'المستودع الرئيسي للاستلام' : 'Primary Destination Warehouse'}
                </Label>
                <select
                  id="bulkWh"
                  value={selectedWarehouseId}
                  onChange={(e) => handleBulkWarehouseChange(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-semibold"
                  required
                >
                  {warehouses.map((wh) => (
                    <option key={wh.id} value={wh.id}>
                      {wh.nameAr} ({wh.location || 'الفرع'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="rcvNotes" className="text-xs font-semibold">
                  {locale === 'ar' ? 'ملاحظات الفحص وحالة الكراتين' : 'Inspection Notes'}
                </Label>
                <Input
                  id="rcvNotes"
                  placeholder="حالة البضاعة سليمة، مطابقة للمواصفات..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Line Items Receiving Table */}
        <Card className="border shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/20 border-b pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span>{locale === 'ar' ? 'الكميات الواردة وتأثير متوسط التكلفة WAC' : 'Received Quantities & WAC Impact'}</span>
              <Badge variant="outline" className="font-mono text-xs">
                {po?.items?.length} {locale === 'ar' ? 'أصناف' : 'items'}
              </Badge>
            </CardTitle>
            <CardDescription className="text-xs">
              {locale === 'ar'
                ? 'يتم تحديث رصيد المخزن ومتوسط التكلفة المرجح (WAC) وحفظ سجل تاريخ التكلفة تلقائياً'
                : 'Stock and weighted-average cost are updated atomically upon receiving'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 text-xs">
                  <TableHead>{locale === 'ar' ? 'الصنف / SKU' : 'SKU'}</TableHead>
                  <TableHead className="text-center">{locale === 'ar' ? 'المطلوب' : 'Ordered'}</TableHead>
                  <TableHead className="text-center">{locale === 'ar' ? 'المستلم سابقاً' : 'Prev Recv'}</TableHead>
                  <TableHead className="w-32 text-center text-blue-600 font-bold">{locale === 'ar' ? 'المستلم الآن *' : 'Receive Now'}</TableHead>
                  <TableHead className="w-40">{locale === 'ar' ? 'المستودع' : 'Warehouse'}</TableHead>
                  <TableHead className="w-28">{locale === 'ar' ? 'موقع الرف' : 'Shelf'}</TableHead>
                  <TableHead>{locale === 'ar' ? 'تكلفة الاستيراد' : 'Landed Cost'}</TableHead>
                  <TableHead className="text-emerald-700 font-bold">{locale === 'ar' ? 'متوسط التكلفة الجديد WAC' : 'New WAC'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {po.items.map((it: any) => {
                  const remaining = Math.max(0, it.quantityOrdered - it.quantityReceived);
                  const receivingNow = parseFloat(receivedQtys[it.id] || '0');
                  const trueCost = it.trueUnitCostEGP;

                  // Live WAC calculation preview
                  const currentStock = it.product.totalStock || 0;
                  const currentWAC = it.product.currentWAC || 0;
                  const newWAC = calculateWAC(currentStock, currentWAC, receivingNow, trueCost);

                  return (
                    <TableRow key={it.id} className="text-xs hover:bg-muted/30">
                      <TableCell>
                        <div className="font-mono font-bold text-blue-600">{it.product.sku}</div>
                        <div className="text-[11px] text-muted-foreground">{it.product.nameAr}</div>
                      </TableCell>

                      <TableCell className="text-center font-mono font-bold">{it.quantityOrdered}</TableCell>
                      <TableCell className="text-center font-mono text-muted-foreground">{it.quantityReceived}</TableCell>

                      {/* Quantity Receiving Now */}
                      <TableCell className="text-center">
                        <Input
                          type="number"
                          min="0"
                          max={remaining}
                          value={receivedQtys[it.id] || ''}
                          onChange={(e) =>
                            setReceivedQtys({
                              ...receivedQtys,
                              [it.id]: e.target.value,
                            })
                          }
                          className="h-8 text-xs font-mono font-bold text-center border-blue-500/50 bg-blue-50/20"
                        />
                        <span className="text-[10px] text-muted-foreground">
                          {locale === 'ar' ? `المتبقي: ${remaining}` : `Rem: ${remaining}`}
                        </span>
                      </TableCell>

                      {/* Warehouse */}
                      <TableCell>
                        <select
                          value={itemWarehouses[it.id] || selectedWarehouseId}
                          onChange={(e) =>
                            setItemWarehouses({
                              ...itemWarehouses,
                              [it.id]: e.target.value,
                            })
                          }
                          className="flex h-8 w-full rounded border border-input bg-background px-2 py-1 text-xs"
                        >
                          {warehouses.map((wh) => (
                            <option key={wh.id} value={wh.id}>
                              {wh.nameAr}
                            </option>
                          ))}
                        </select>
                      </TableCell>

                      {/* Shelf */}
                      <TableCell>
                        <Input
                          placeholder="A-1-2"
                          value={shelfLocations[it.id] || ''}
                          onChange={(e) =>
                            setShelfLocations({
                              ...shelfLocations,
                              [it.id]: e.target.value,
                            })
                          }
                          className="h-8 text-xs font-mono"
                        />
                      </TableCell>

                      {/* Unit Landed Cost */}
                      <TableCell className="font-mono font-semibold">
                        {formatEGP(trueCost)}
                      </TableCell>

                      {/* New WAC Preview */}
                      <TableCell>
                        <div className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                          {formatEGP(newWAC.toNumber())}
                        </div>
                        <div className="text-[9px] text-muted-foreground">
                          {locale === 'ar' ? `السابق: ${formatEGP(currentWAC)}` : `Prev: ${formatEGP(currentWAC)}`}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <Button variant="outline" type="button" asChild className="h-11 px-6">
            <Link href={`/purchases/${params.id}`}>{locale === 'ar' ? 'إلغاء' : 'Cancel'}</Link>
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-11 px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md"
          >
            <CheckCircle2 className="h-4 w-4 rtl:ml-2 ltr:mr-2" />
            {isSubmitting
              ? (locale === 'ar' ? 'جاري الاستلام وتحديث المخزن...' : 'Processing...')
              : (locale === 'ar' ? 'تأكيد الاستلام وإدخال المخزن' : 'Confirm Receipt & Update Stock')}
          </Button>
        </div>
      </form>
    </div>
  );
}
