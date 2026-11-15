'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  Plus,
  Search,
  Filter,
  DollarSign,
  CreditCard,
  Printer,
  Calendar,
  Building2,
  Clock,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  ShoppingBag,
  MoreHorizontal,
  RefreshCw,
  Wallet,
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

export default function SalesInvoicesPage() {
  const { locale, isRTL } = useI18n();

  const [invoices, setInvoices] = useState<any[]>([]);
  const [kpis, setKpis] = useState<any>({
    totalSales: 0,
    totalCollected: 0,
    totalBalanceDue: 0,
    overdueCount: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  useEffect(() => {
    fetchInvoices();
  }, [selectedStatus]);

  const fetchInvoices = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.set('q', searchQuery);
      if (selectedStatus !== 'ALL') params.set('status', selectedStatus);

      const res = await fetch(`/api/sales/invoices?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setInvoices(json.data || []);
        setKpis(json.kpis || {});
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInvoices();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            {isRTL ? 'فواتير المبيعات والتوزيع' : 'Sales Invoices & Distribution'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isRTL
              ? 'إصدار الفواتير الفورية، المبيعات الآجلة، متابعة التحصيل، والطباعة الحرارية وA4'
              : 'POS invoicing, wholesale credit sales, payments tracking, and printable receipts'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Link href="/cheques">
            <Button variant="outline" className="gap-2">
              <CreditCard className="w-4 h-4 text-primary" />
              {isRTL ? 'إدارة الشيكات' : 'Cheques Register'}
            </Button>
          </Link>

          <Link href="/sales/new">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              {isRTL ? 'فاتورة سريعة POS' : 'Fast Invoice POS'}
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                {isRTL ? 'إجمالي المبيعات' : 'Total Sales'}
              </p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                {formatEGP(kpis.totalSales || 0)}
              </h3>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-950/60 rounded-xl text-blue-600">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                {isRTL ? 'إجمالي المحصل' : 'Total Collected'}
              </p>
              <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {formatEGP(kpis.totalCollected || 0)}
              </h3>
            </div>
            <div className="p-3 bg-emerald-100 dark:bg-emerald-950/60 rounded-xl text-emerald-600">
              <Wallet className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                {isRTL ? 'الآجل والمتبقي' : 'Outstanding Balance'}
              </p>
              <h3 className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                {formatEGP(kpis.totalBalanceDue || 0)}
              </h3>
            </div>
            <div className="p-3 bg-amber-100 dark:bg-amber-950/60 rounded-xl text-amber-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                {isRTL ? 'فواتير متأخرة السداد' : 'Overdue Invoices'}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <h3 className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                  {kpis.overdueCount}
                </h3>
                {kpis.overdueCount > 0 && (
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
      </div>

      {/* Filter and Status Bar */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardContent className="p-4 flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={
                isRTL
                  ? 'بحث برقم الفاتورة، اسم العميل، رقم الهاتف...'
                  : 'Search by invoice #, customer, phone...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-9"
            />
          </form>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status Select */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-10 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="ALL">{isRTL ? 'جميع الحالات' : 'All Statuses'}</option>
              <option value="PAID">{isRTL ? 'مسددة بالكامل' : 'Paid'}</option>
              <option value="PARTIALLY_PAID">{isRTL ? 'مسددة جزئياً' : 'Partially Paid'}</option>
              <option value="ISSUED">{isRTL ? 'آجلة / غير مسددة' : 'Unpaid'}</option>
              <option value="OVERDUE">{isRTL ? 'متأخرة عن موعدها' : 'Overdue'}</option>
            </select>

            <Button variant="outline" size="icon" onClick={fetchInvoices} title={isRTL ? 'تحديث' : 'Refresh'}>
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
                <TableHead>{isRTL ? 'رقم الفاتورة' : 'Invoice #'}</TableHead>
                <TableHead>{isRTL ? 'العميل' : 'Customer'}</TableHead>
                <TableHead>{isRTL ? 'تاريخ الإصدار / الاستحقاق' : 'Date / Due Date'}</TableHead>
                <TableHead className="text-center">{isRTL ? 'عدد البنود' : 'Items'}</TableHead>
                <TableHead className="text-right">{isRTL ? 'الإجمالي' : 'Total'}</TableHead>
                <TableHead className="text-right text-emerald-600">{isRTL ? 'المدفوع' : 'Paid'}</TableHead>
                <TableHead className="text-right text-rose-600 font-bold">{isRTL ? 'المتبقي' : 'Balance Due'}</TableHead>
                <TableHead>{isRTL ? 'الحالة' : 'Status'}</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    {isLoading
                      ? isRTL ? 'جاري التحميل...' : 'Loading invoices...'
                      : isRTL ? 'لا توجد فواتير مطابقة' : 'No invoices found'}
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-mono text-xs font-bold text-primary">
                      <Link href={`/sales/${inv.id}`} className="hover:underline">
                        {inv.invoiceNumber}
                      </Link>
                    </TableCell>

                    <TableCell>
                      <div className="font-medium text-sm text-slate-900 dark:text-slate-100">
                        <Link href={`/customers/${inv.customer?.id}`} className="hover:underline">
                          {isRTL ? inv.customer?.nameAr : inv.customer?.nameEn}
                        </Link>
                      </div>
                      <div className="font-mono text-xs text-muted-foreground">
                        {inv.customer?.phone}
                      </div>
                    </TableCell>

                    <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                      <div>{new Date(inv.invoiceDate).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US')}</div>
                      <div className="text-[11px] text-slate-500">
                        {isRTL ? 'استحقاق: ' : 'Due: '}
                        {new Date(inv.dueDate).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US')}
                      </div>
                    </TableCell>

                    <TableCell className="text-center font-mono text-xs">
                      {inv.itemCount} {isRTL ? 'صنف' : 'items'}
                    </TableCell>

                    <TableCell className="text-right font-mono font-bold text-sm text-slate-900 dark:text-slate-100">
                      {formatEGP(inv.grandTotal)}
                    </TableCell>

                    <TableCell className="text-right font-mono text-xs font-semibold text-emerald-600">
                      {inv.paidAmount > 0 ? formatEGP(inv.paidAmount) : '-'}
                    </TableCell>

                    <TableCell className="text-right font-mono text-xs font-bold text-rose-600">
                      {inv.balanceDue > 0 ? formatEGP(inv.balanceDue) : '0.00'}
                    </TableCell>

                    <TableCell>
                      {inv.status === 'PAID' ? (
                        <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-300">
                          {isRTL ? 'خالصة' : 'Paid'}
                        </Badge>
                      ) : inv.status === 'PARTIALLY_PAID' ? (
                        <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-300">
                          {isRTL ? 'سداد جزئي' : 'Partial'}
                        </Badge>
                      ) : inv.status === 'OVERDUE' ? (
                        <Badge variant="outline" className="text-xs bg-rose-50 text-rose-700 border-rose-300">
                          {isRTL ? 'متأخرة' : 'Overdue'}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-300">
                          {isRTL ? 'آجلة' : 'Issued'}
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
                            <Link href={`/sales/${inv.id}`} className="flex items-center gap-2 cursor-pointer">
                              <Eye className="h-4 w-4" />
                              {isRTL ? 'عرض الفاتورة والطباعة' : 'View & Print'}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/sales/${inv.id}?mode=thermal`} className="flex items-center gap-2 cursor-pointer">
                              <Printer className="h-4 w-4" />
                              {isRTL ? 'طباعة إيصال حراري (80mm)' : 'Thermal Receipt'}
                            </Link>
                          </DropdownMenuItem>
                          {inv.balanceDue > 0 && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem asChild>
                                <Link href={`/sales/${inv.id}?action=pay`} className="flex items-center gap-2 cursor-pointer text-emerald-600 font-semibold">
                                  <DollarSign className="h-4 w-4" />
                                  {isRTL ? 'تسجيل دفعة سداد' : 'Record Payment'}
                                </Link>
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Mobile Card View */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:hidden">
        {invoices.length === 0 ? (
          <Card className="p-6 text-center text-muted-foreground text-sm col-span-full">
            {isLoading
              ? isRTL ? 'جاري التحميل...' : 'Loading invoices...'
              : isRTL ? 'لا توجد فواتير مطابقة' : 'No invoices found'}
          </Card>
        ) : (
          invoices.map((inv) => (
            <Card key={inv.id} className="border-slate-200 dark:border-slate-800 p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-mono text-xs font-bold text-primary">
                    <Link href={`/sales/${inv.id}`} className="hover:underline">
                      {inv.invoiceNumber}
                    </Link>
                  </div>
                  <div className="font-semibold text-sm text-slate-900 dark:text-slate-100 mt-0.5">
                    {isRTL ? inv.customer?.nameAr : inv.customer?.nameEn}
                  </div>
                </div>

                {inv.status === 'PAID' ? (
                  <Badge variant="outline" className="text-xs text-emerald-700 bg-emerald-50">
                    {isRTL ? 'خالصة' : 'Paid'}
                  </Badge>
                ) : inv.status === 'PARTIALLY_PAID' ? (
                  <Badge variant="outline" className="text-xs text-amber-700 bg-amber-50">
                    {isRTL ? 'جزئي' : 'Partial'}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs text-blue-700 bg-blue-50">
                    {isRTL ? 'آجلة' : 'Issued'}
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs py-2 bg-slate-50 dark:bg-slate-900/60 p-2 rounded">
                <div>
                  <span className="text-muted-foreground block text-[11px]">{isRTL ? 'الإجمالي' : 'Total'}</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{formatEGP(inv.grandTotal)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">{isRTL ? 'المدفوع' : 'Paid'}</span>
                  <span className="font-mono text-emerald-600">{formatEGP(inv.paidAmount)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">{isRTL ? 'المتبقي' : 'Balance'}</span>
                  <span className="font-mono font-bold text-rose-600">{formatEGP(inv.balanceDue)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
                <span className="text-muted-foreground">
                  {new Date(inv.invoiceDate).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US')}
                </span>
                <div className="flex items-center gap-2">
                  <Link href={`/sales/${inv.id}`}>
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      {isRTL ? 'عرض' : 'View'}
                    </Button>
                  </Link>
                  <Link href={`/sales/${inv.id}?mode=thermal`}>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <Printer className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
