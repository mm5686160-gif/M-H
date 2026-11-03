'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Users,
  ChevronLeft,
  ChevronRight,
  Phone,
  MessageSquare,
  Building2,
  Calendar,
  CreditCard,
  Wallet,
  AlertTriangle,
  Clock,
  Printer,
  FileText,
  DollarSign,
  Edit,
  Tag,
  MapPin,
  CheckCircle2,
  ExternalLink,
  Plus,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatEGP, whatsappLink } from '@/lib/utils';

export default function CustomerDetailPage() {
  const { locale, isRTL } = useI18n();
  const params = useParams();
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'statement' | 'invoices' | 'payments'>('statement');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCustomerDetails();
  }, [customerId]);

  const fetchCustomerDetails = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/customers/${customerId}`);
      const json = await res.json();
      if (json.success) {
        setCustomer(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        {isRTL ? 'جاري تحميل بيانات العميل...' : 'Loading customer details...'}
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-8 text-center space-y-3">
        <p className="text-muted-foreground">{isRTL ? 'العميل غير موجود' : 'Customer not found'}</p>
        <Link href="/customers">
          <Button variant="outline">{isRTL ? 'العودة لقائمة العملاء' : 'Back to Customers'}</Button>
        </Link>
      </div>
    );
  }

  const balance = customer.currentBalanceEGP || 0;
  const limit = customer.creditLimitEGP || 0;
  const pct = customer.creditUtilizationPct || 0;

  // Compose WhatsApp Statement Reminder
  const statementText = `السلام عليكم ورحمة الله، عميلنا العزيز (${customer.nameAr})،\nتحية طيبة وبعد،\nنرفق لسيادتكم كشف حسابكم طرفنا:\n- إجمالي الرصيد المستحق: ${formatEGP(balance)}\n${
    customer.aging?.totalOverdue > 0 ? `- مبالغ متأخرة عن موعدها: ${formatEGP(customer.aging.totalOverdue)}\n` : ''
  }- حد الائتمان الممنوح: ${formatEGP(limit)}\nشاكرين ومقدرين حسن تعاونكم الدائم.\nشركة استيراد وتوزيع رولمان البلي وقطع الغيار.`;

  const waUrl = customer.whatsappNumber || customer.phone
    ? whatsappLink(customer.whatsappNumber || customer.phone, statementText)
    : null;

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link href="/customers" className="hover:underline flex items-center gap-1">
              {isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              {isRTL ? 'دليل العملاء' : 'Customers'}
            </Link>
            <span>/</span>
            <span className="font-mono">{customer.code}</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-primary" />
            {isRTL ? customer.nameAr : customer.nameEn}
            {customer.segment === 'VIP' && (
              <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-300">
                VIP
              </Badge>
            )}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            {customer.customerType === 'WHOLESALE'
              ? isRTL ? 'تاجر جملة' : 'Wholesaler'
              : customer.customerType === 'WORKSHOP'
              ? isRTL ? 'مركز صيانة وفني' : 'Workshop'
              : customer.customerType === 'COMPANY'
              ? isRTL ? 'شركة / مصنع' : 'Company'
              : isRTL ? 'محل تجزئة' : 'Retail'}{' '}
            • {customer.governorate} {customer.area && `(${customer.area})`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {waUrl && (
            <a href={waUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="gap-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400">
                <MessageSquare className="w-4 h-4" />
                {isRTL ? 'واتساب كشف الحساب' : 'Send WhatsApp Statement'}
              </Button>
            </a>
          )}

          <Link href={`/sales/new?customerId=${customer.id}`}>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              {isRTL ? 'فاتورة بيع جديدة' : 'New Invoice'}
            </Button>
          </Link>

          <Link href={`/customers/${customer.id}/edit`}>
            <Button variant="outline" size="icon" title={isRTL ? 'تعديل البيانات' : 'Edit Customer'}>
              <Edit className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Credit Limit & Contact Summary Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Contact & Location Info */}
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              {isRTL ? 'بيانات التواصل والعنوان' : 'Contact & Address'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex justify-between items-center py-1 border-b">
              <span className="text-muted-foreground">{isRTL ? 'الهاتف الأساسي:' : 'Phone:'}</span>
              <a href={`tel:${customer.phone}`} className="font-mono font-semibold hover:underline text-primary">
                {customer.phone}
              </a>
            </div>

            <div className="flex justify-between items-center py-1 border-b">
              <span className="text-muted-foreground">{isRTL ? 'رقم الواتساب:' : 'WhatsApp:'}</span>
              <span className="font-mono">{customer.whatsappNumber || customer.phone}</span>
            </div>

            <div className="flex justify-between items-center py-1 border-b">
              <span className="text-muted-foreground">{isRTL ? 'المحافظة والمنطقة:' : 'Location:'}</span>
              <span>{customer.governorate} {customer.area && `- ${customer.area}`}</span>
            </div>

            {customer.address && (
              <div className="flex justify-between items-center py-1 border-b">
                <span className="text-muted-foreground">{isRTL ? 'العنوان:' : 'Address:'}</span>
                <span className="truncate max-w-[180px]">{customer.address}</span>
              </div>
            )}

            <div className="flex justify-between items-center py-1">
              <span className="text-muted-foreground">{isRTL ? 'قائمة الأسعار:' : 'Price List:'}</span>
              <span className="font-semibold">{customer.priceList ? (isRTL ? customer.priceList.nameAr : customer.priceList.nameEn) : (isRTL ? 'افتراضي' : 'Default')}</span>
            </div>
          </CardContent>
        </Card>

        {/* Credit Limit Progress & Balance */}
        <Card className={`border-slate-200 dark:border-slate-800 lg:col-span-2 ${customer.isExceeded ? 'border-rose-300 dark:border-rose-900 bg-rose-50/20' : ''}`}>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary" />
              {isRTL ? 'الموقف المالي وحد الائتمان' : 'Credit & Financial Standing'}
            </CardTitle>
            {customer.isExceeded && (
              <Badge variant="outline" className="text-rose-600 border-rose-300 bg-rose-50">
                {isRTL ? 'تجاوز حد الائتمان المسموح!' : 'Credit Limit Exceeded!'}
              </Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
                <span className="text-[11px] text-muted-foreground block">{isRTL ? 'المديونية الحالية' : 'Current Balance'}</span>
                <span className={`font-mono font-bold text-lg ${customer.isExceeded ? 'text-rose-600' : 'text-slate-900 dark:text-slate-100'}`}>
                  {formatEGP(balance)}
                </span>
              </div>

              <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
                <span className="text-[11px] text-muted-foreground block">{isRTL ? 'حد الائتمان الممنوح' : 'Credit Limit'}</span>
                <span className="font-mono font-bold text-lg text-slate-900 dark:text-slate-100">
                  {limit > 0 ? formatEGP(limit) : (isRTL ? 'نقدي فقط' : 'Cash')}
                </span>
              </div>

              <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
                <span className="text-[11px] text-muted-foreground block">{isRTL ? 'فترة السداد' : 'Terms'}</span>
                <span className="font-mono font-bold text-lg text-primary">
                  {customer.creditDays} {isRTL ? 'يوم' : 'Days'}
                </span>
              </div>
            </div>

            {limit > 0 && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{isRTL ? 'نسبة استغلال الائتمان:' : 'Credit Utilization:'}</span>
                  <span className="font-mono font-semibold">{pct}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      customer.isExceeded ? 'bg-rose-600' : pct > 75 ? 'bg-amber-500' : 'bg-primary'
                    }`}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Debt Aging Buckets Summary */}
      {balance > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Card className="border-slate-200 dark:border-slate-800">
            <CardContent className="p-3 text-center">
              <span className="text-[11px] text-muted-foreground block">{isRTL ? 'فواتير جارية (0-30 يوم)' : '0-30 Days'}</span>
              <span className="font-mono font-bold text-sm text-slate-800 dark:text-slate-200">
                {formatEGP(customer.aging?.['0-30'] || 0)}
              </span>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800">
            <CardContent className="p-3 text-center">
              <span className="text-[11px] text-muted-foreground block">{isRTL ? 'متأخرة (31-60 يوم)' : '31-60 Days'}</span>
              <span className="font-mono font-bold text-sm text-amber-600">
                {formatEGP(customer.aging?.['31-60'] || 0)}
              </span>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800">
            <CardContent className="p-3 text-center">
              <span className="text-[11px] text-muted-foreground block">{isRTL ? 'متأخرة (61-90 يوم)' : '61-90 Days'}</span>
              <span className="font-mono font-bold text-sm text-orange-600">
                {formatEGP(customer.aging?.['61-90'] || 0)}
              </span>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800">
            <CardContent className="p-3 text-center">
              <span className="text-[11px] text-muted-foreground block">{isRTL ? 'متأخرة (90+ يوم)' : '90+ Days'}</span>
              <span className="font-mono font-bold text-sm text-rose-600">
                {formatEGP(customer.aging?.['90+'] || 0)}
              </span>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800 col-span-2 sm:col-span-1 bg-rose-50/30">
            <CardContent className="p-3 text-center">
              <span className="text-[11px] text-rose-700 font-semibold block">{isRTL ? 'إجمالي المتأخرات' : 'Total Overdue'}</span>
              <span className="font-mono font-bold text-sm text-rose-600">
                {formatEGP(customer.aging?.totalOverdue || 0)}
              </span>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs Header */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        <Button
          variant={activeTab === 'statement' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('statement')}
          className="rounded-b-none gap-2 text-xs"
        >
          <FileText className="w-3.5 h-3.5" />
          {isRTL ? 'كشف الحساب التفصيلي' : 'Statement of Account'}
        </Button>

        <Button
          variant={activeTab === 'invoices' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('invoices')}
          className="rounded-b-none gap-2 text-xs"
        >
          <DollarSign className="w-3.5 h-3.5" />
          {isRTL ? 'سجل الفواتير' : 'Invoices History'}
          <span className="bg-slate-200 dark:bg-slate-700 text-xs px-1.5 py-0.2 rounded-full mr-1">
            {customer.invoices?.length || 0}
          </span>
        </Button>

        <Button
          variant={activeTab === 'payments' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('payments')}
          className="rounded-b-none gap-2 text-xs"
        >
          <Wallet className="w-3.5 h-3.5" />
          {isRTL ? 'المدفوعات والشيكات' : 'Payments & Cheques'}
          <span className="bg-slate-200 dark:bg-slate-700 text-xs px-1.5 py-0.2 rounded-full mr-1">
            {customer.payments?.length || 0}
          </span>
        </Button>
      </div>

      {/* TAB 1: Statement of Account */}
      {activeTab === 'statement' && (
        <Card className="border-slate-200 dark:border-slate-800 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-900/50">
                <TableHead>{isRTL ? 'التاريخ' : 'Date'}</TableHead>
                <TableHead>{isRTL ? 'نوع العملية' : 'Transaction'}</TableHead>
                <TableHead>{isRTL ? 'رقم الإذن / الفاتورة' : 'Reference'}</TableHead>
                <TableHead className="text-right text-rose-600">{isRTL ? 'مدين (+)' : 'Debit (+)'}</TableHead>
                <TableHead className="text-right text-emerald-600">{isRTL ? 'دائن (-)' : 'Credit (-)'}</TableHead>
                <TableHead className="text-right font-bold">{isRTL ? 'الرصيد التراكمي' : 'Running Balance'}</TableHead>
                <TableHead>{isRTL ? 'ملاحظات' : 'Notes'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customer.statementOfAccount?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {isRTL ? 'لا توجد حركات مسجلة على كشف الحساب' : 'No transactions recorded on this account'}
                  </TableCell>
                </TableRow>
              ) : (
                customer.statementOfAccount?.map((evt: any) => (
                  <TableRow key={evt.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(evt.date).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US')}
                    </TableCell>

                    <TableCell>
                      {evt.type === 'INVOICE' ? (
                        <Badge variant="outline" className="text-xs text-rose-700 bg-rose-50 border-rose-300">
                          {isRTL ? evt.typeLabelAr : evt.typeLabelEn}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-emerald-700 bg-emerald-50 border-emerald-300">
                          {isRTL ? evt.typeLabelAr : evt.typeLabelEn}
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell className="font-mono text-xs font-semibold text-primary">
                      {evt.reference}
                    </TableCell>

                    <TableCell className="text-right font-mono text-xs font-semibold text-rose-600">
                      {evt.debit > 0 ? formatEGP(evt.debit) : '-'}
                    </TableCell>

                    <TableCell className="text-right font-mono text-xs font-semibold text-emerald-600">
                      {evt.credit > 0 ? formatEGP(evt.credit) : '-'}
                    </TableCell>

                    <TableCell className="text-right font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                      {formatEGP(evt.runningBalance)}
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate" title={evt.notes || ''}>
                      {evt.notes || '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* TAB 2: Invoices History */}
      {activeTab === 'invoices' && (
        <Card className="border-slate-200 dark:border-slate-800 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-900/50">
                <TableHead>{isRTL ? 'رقم الفاتورة' : 'Invoice #'}</TableHead>
                <TableHead>{isRTL ? 'تاريخ الفاتورة' : 'Date'}</TableHead>
                <TableHead>{isRTL ? 'تاريخ الاستحقاق' : 'Due Date'}</TableHead>
                <TableHead className="text-right">{isRTL ? 'الإجمالي' : 'Total'}</TableHead>
                <TableHead className="text-right text-emerald-600">{isRTL ? 'المدفوع' : 'Paid'}</TableHead>
                <TableHead className="text-right text-rose-600 font-bold">{isRTL ? 'المتبقي' : 'Balance Due'}</TableHead>
                <TableHead>{isRTL ? 'الحالة' : 'Status'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customer.invoices?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {isRTL ? 'لا توجد فواتير سابقة' : 'No invoices found'}
                  </TableCell>
                </TableRow>
              ) : (
                customer.invoices?.map((inv: any) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-mono text-xs font-bold text-primary">
                      <Link href={`/sales/${inv.id}`} className="hover:underline">
                        {inv.invoiceNumber}
                      </Link>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {new Date(inv.invoiceDate).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US')}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {new Date(inv.dueDate).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US')}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">{formatEGP(inv.grandTotal)}</TableCell>
                    <TableCell className="text-right font-mono text-xs text-emerald-600">{formatEGP(inv.paidAmount)}</TableCell>
                    <TableCell className="text-right font-mono text-xs font-bold text-rose-600">{formatEGP(inv.balanceDue)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {inv.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* TAB 3: Payments & Cheques */}
      {activeTab === 'payments' && (
        <Card className="border-slate-200 dark:border-slate-800 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-900/50">
                <TableHead>{isRTL ? 'تاريخ السداد' : 'Date'}</TableHead>
                <TableHead>{isRTL ? 'المبلغ' : 'Amount'}</TableHead>
                <TableHead>{isRTL ? 'طريقة الدفع' : 'Method'}</TableHead>
                <TableHead>{isRTL ? 'الحساب / الخزينة' : 'Account'}</TableHead>
                <TableHead>{isRTL ? 'بيانات الشيك (إن وجد)' : 'Cheque Details'}</TableHead>
                <TableHead>{isRTL ? 'ملاحظات' : 'Notes'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customer.payments?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {isRTL ? 'لا توجد مدفوعات مسجلة' : 'No payments recorded'}
                  </TableCell>
                </TableRow>
              ) : (
                customer.payments?.map((pay: any) => (
                  <TableRow key={pay.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {new Date(pay.paymentDate).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US')}
                    </TableCell>
                    <TableCell className="font-mono font-bold text-xs text-emerald-600">
                      {formatEGP(pay.amount)}
                    </TableCell>
                    <TableCell className="text-xs">
                      {pay.paymentMethod === 'CHEQUE' ? (isRTL ? 'شيك بنكي' : 'Cheque') : pay.paymentMethod}
                    </TableCell>
                    <TableCell className="text-xs">
                      {isRTL ? pay.account?.nameAr : pay.account?.nameEn}
                    </TableCell>
                    <TableCell className="text-xs font-mono">
                      {pay.cheque ? (
                        <div>
                          <span>رقم: {pay.cheque.chequeNumber}</span>
                          <span className="block text-[11px] text-muted-foreground">بنك {pay.cheque.bankName}</span>
                        </div>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {pay.notes || '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
