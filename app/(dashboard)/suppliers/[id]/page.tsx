'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Truck,
  ShoppingCart,
  DollarSign,
  Phone,
  Mail,
  Calendar,
  CreditCard,
  Building,
  CheckCircle2,
  Clock,
  Plus,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatEGP, formatCurrency } from '@/lib/utils';

export default function SupplierDetailPage() {
  const params = useParams();
  const { locale, isRTL } = useI18n();

  const [supplier, setSupplier] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (params?.id) {
      fetchSupplier(params.id as string);
    }
  }, [params?.id]);

  const fetchSupplier = async (id: string) => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/suppliers/${id}`);
      const json = await res.json();
      if (json.success) {
        setSupplier(json.data);
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
        {locale === 'ar' ? 'جاري تحميل ملف المورد...' : 'Loading supplier profile...'}
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="text-destructive font-bold">{locale === 'ar' ? 'المورد غير موجود' : 'Supplier not found'}</div>
        <Button asChild variant="outline">
          <Link href="/suppliers">{locale === 'ar' ? 'الرجوع للموردين' : 'Back to Suppliers'}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild className="h-8 px-2">
              <Link href="/suppliers" className="flex items-center gap-1 text-xs">
                {isRTL ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
                <span>{locale === 'ar' ? 'الموردون' : 'Suppliers'}</span>
              </Link>
            </Button>
            <span className="text-muted-foreground">/</span>
            <span className="font-mono text-xs font-bold text-muted-foreground">{supplier.code}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {locale === 'ar' ? supplier.nameAr : supplier.nameEn}
            </h1>
            <Badge variant="outline" className="text-xs">
              🌍 {supplier.country}
            </Badge>
            <Badge variant="secondary" className="font-mono text-xs">
              {supplier.defaultCurrency}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild className="h-9 bg-blue-600 hover:bg-blue-700 text-white font-semibold">
            <Link href={`/purchases/new?supplierId=${supplier.id}`}>
              <Plus className="h-4 w-4 rtl:ml-1.5 ltr:mr-1.5" />
              {locale === 'ar' ? 'أمر شراء جديد' : 'New Purchase Order'}
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Cards: Balance Owed & Terms */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border shadow-sm bg-rose-50/50 dark:bg-rose-950/20 border-rose-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-rose-800 dark:text-rose-300">
              {locale === 'ar' ? 'إجمالي الرصيد المستحق (بالجنيه)' : 'Total Payable (EGP)'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-black text-rose-700 dark:text-rose-400 font-mono">
              {formatEGP(supplier.currentBalance)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {locale === 'ar' ? 'التزامات شحنات استيراد قائمة' : 'Outstanding import liability'}
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {locale === 'ar' ? 'شروط الائتمان والسداد' : 'Payment Terms'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold font-mono">
              {supplier.paymentTermsDays} {locale === 'ar' ? 'يوم' : 'days'}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {locale === 'ar' ? 'العملة الأساسية: ' : 'Base currency: '}
              <strong className="font-mono">{supplier.defaultCurrency}</strong>
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {locale === 'ar' ? 'بيانات الاتصال والتواصل' : 'Contact Details'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-xs">
            <div className="font-semibold">{supplier.contactName || '-'}</div>
            {supplier.phone && (
              <div className="text-muted-foreground font-mono flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" />
                {supplier.phone}
              </div>
            )}
            {supplier.email && (
              <div className="text-muted-foreground flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                {supplier.email}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Purchase Orders Table */}
      <Card className="border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-blue-600" />
              {locale === 'ar' ? 'أوامر الشراء والشحنات المرتبطة' : 'Purchase Orders & Shipments'}
            </CardTitle>
            <CardDescription className="text-xs">
              {locale === 'ar'
                ? 'متابعة الشحنات، تكلفة الاستيراد، وحالات الاستلام'
                : 'Track import orders, landed cost, and receipt status'}
            </CardDescription>
          </div>
          <Badge variant="outline" className="font-mono">
            {supplier.purchaseOrders?.length || 0}
          </Badge>
        </CardHeader>
        <CardContent>
          {supplier.purchaseOrders?.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">
              {locale === 'ar' ? 'لا توجد أوامر شراء مسجلة لهذا المورد' : 'No purchase orders yet'}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="w-28">{locale === 'ar' ? 'رقم الأمر' : 'PO #'}</TableHead>
                  <TableHead>{locale === 'ar' ? 'تاريخ الطلب' : 'Date'}</TableHead>
                  <TableHead>{locale === 'ar' ? 'الحالة' : 'Status'}</TableHead>
                  <TableHead>{locale === 'ar' ? 'القيمة الأجنبية' : 'Foreign Amt'}</TableHead>
                  <TableHead>{locale === 'ar' ? 'سعر الصرف' : 'Rate'}</TableHead>
                  <TableHead>{locale === 'ar' ? 'الإجمالي بالجنيه' : 'Total (EGP)'}</TableHead>
                  <TableHead className="text-center">{locale === 'ar' ? 'الإجراء' : 'Action'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {supplier.purchaseOrders.map((po: any) => (
                  <TableRow key={po.id} className="hover:bg-muted/40 text-xs">
                    <TableCell className="font-mono font-bold text-blue-600">
                      <Link href={`/purchases/${po.id}`}>{po.poNumber}</Link>
                    </TableCell>
                    <TableCell>{new Date(po.orderDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
                        {po.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono font-bold">
                      {formatCurrency(po.subtotalForeign, po.currency)}
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground">
                      {po.exchangeRate.toFixed(2)}
                    </TableCell>
                    <TableCell className="font-mono font-bold text-foreground">
                      {formatEGP(po.subtotalEGP)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button variant="ghost" size="sm" asChild className="h-7 text-xs">
                        <Link href={`/purchases/${po.id}`}>{locale === 'ar' ? 'تفاصيل' : 'View'}</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
