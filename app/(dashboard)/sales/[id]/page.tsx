'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import {
  FileText,
  Printer,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Building2,
  Calendar,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Download,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { formatEGP } from '@/lib/utils';

export default function InvoiceDetailPage() {
  const { locale, isRTL } = useI18n();
  const params = useParams();
  const searchParams = useSearchParams();
  const invoiceId = params.id as string;
  const isThermalMode = searchParams.get('mode') === 'thermal';
  const shouldOpenPay = searchParams.get('action') === 'pay';
  const { toast } = useToast();

  const [invoice, setInvoice] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Record Payment Modal State
  const [isPayOpen, setIsPayOpen] = useState(shouldOpenPay);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<'CASH' | 'BANK_TRANSFER' | 'CHEQUE' | 'MOBILE_WALLET'>('CASH');
  const [payAccountId, setPayAccountId] = useState('');
  const [chequeDetails, setChequeDetails] = useState({
    chequeNumber: '',
    bankName: 'البنك الأهلي المصري',
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });
  const [isSubmittingPay, setIsSubmittingPay] = useState(false);

  useEffect(() => {
    fetchInvoiceDetails();
    fetchAccounts();
  }, [invoiceId]);

  const fetchInvoiceDetails = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/sales/invoices/${invoiceId}`);
      const json = await res.json();
      if (json.success) {
        setInvoice(json.data);
        setPayAmount(String(json.data.balanceDue || ''));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/accounts');
      const json = await res.json();
      if (json.success && json.data?.length > 0) {
        setAccounts(json.data);
        const def = json.data.find((a: any) => a.isDefault) || json.data[0];
        setPayAccountId(def.id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const entered = parseFloat(payAmount);
    if (!entered || entered <= 0 || !payAccountId) {
      toast({
        title: isRTL ? 'بيانات غير صحيحة' : 'Invalid Data',
        description: isRTL ? 'يرجى إدخال مبلغ صحيح واختيار الحساب' : 'Please enter valid amount and select account',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmittingPay(true);
      const res = await fetch(`/api/sales/invoices/${invoiceId}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: entered,
          paymentMethod: payMethod,
          accountId: payAccountId,
          chequeDetails: payMethod === 'CHEQUE' ? chequeDetails : null,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to record payment');
      }

      toast({
        title: isRTL ? 'تم تسجيل السداد بنجاح' : 'Payment Recorded',
        description: isRTL ? `تم سداد ${formatEGP(entered)} بنجاح` : `Payment of ${formatEGP(entered)} saved`,
      });

      setIsPayOpen(false);
      fetchInvoiceDetails();
    } catch (err: any) {
      toast({
        title: isRTL ? 'خطأ' : 'Error',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingPay(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        {isRTL ? 'جاري تحميل الفاتورة...' : 'Loading invoice...'}
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="p-8 text-center space-y-3">
        <p className="text-muted-foreground">{isRTL ? 'الفاتورة غير موجودة' : 'Invoice not found'}</p>
        <Link href="/sales">
          <Button variant="outline">{isRTL ? 'العودة للمبيعات' : 'Back to Sales'}</Button>
        </Link>
      </div>
    );
  }

  // THERMAL 80MM RECEIPT VIEW
  if (isThermalMode) {
    return (
      <div className="max-w-[80mm] mx-auto bg-white text-black p-4 font-mono text-xs space-y-3 shadow-md print:shadow-none print:m-0 print:p-2">
        <div className="text-center space-y-1 border-b pb-2">
          <h2 className="font-bold text-sm">شركة النصر لاستيراد وتوزيع رولمان البلي</h2>
          <p className="text-[10px]">القاهرة - السبتية - شارع الجلاء</p>
          <p className="text-[10px]">هاتف: 01012345678</p>
          <p className="font-bold text-xs pt-1">إيصال استلام بضاعة (POS)</p>
        </div>

        <div className="text-[11px] space-y-0.5 border-b pb-2">
          <div className="flex justify-between">
            <span>رقم الفاتورة:</span>
            <span className="font-bold">{invoice.invoiceNumber}</span>
          </div>
          <div className="flex justify-between">
            <span>التاريخ:</span>
            <span>{new Date(invoice.invoiceDate).toLocaleDateString('ar-EG')}</span>
          </div>
          <div className="flex justify-between">
            <span>العميل:</span>
            <span className="font-bold">{invoice.customer?.nameAr}</span>
          </div>
        </div>

        {/* Line Items */}
        <div className="space-y-1.5 border-b pb-2 text-[10px]">
          {invoice.items?.map((it: any) => (
            <div key={it.id} className="flex justify-between items-start">
              <div>
                <div className="font-bold">{it.product?.nameAr}</div>
                <div className="text-slate-500">
                  {it.quantity} × {it.unitPrice} ج.م
                </div>
              </div>
              <div className="font-bold">{it.lineTotal} ج.م</div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="space-y-1 pt-1 text-[11px] border-b pb-2">
          <div className="flex justify-between font-bold text-sm">
            <span>الإجمالي:</span>
            <span>{formatEGP(invoice.grandTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>المدفوع:</span>
            <span>{formatEGP(invoice.paidAmount)}</span>
          </div>
          <div className="flex justify-between font-bold text-rose-600">
            <span>المتبقي:</span>
            <span>{formatEGP(invoice.balanceDue)}</span>
          </div>
        </div>

        <div className="text-center text-[10px] space-y-1 pt-2">
          <p>شكراً لتعاملكم معنا!</p>
          <p>البضاعة المباعة لا ترد ولا تستبدل بعد 14 يوماً</p>
        </div>

        <div className="print:hidden pt-4 flex gap-2">
          <Button onClick={() => window.print()} className="w-full text-xs h-8">
            <Printer className="w-3.5 h-3.5 mr-1" />
            طباعة
          </Button>
          <Link href={`/sales/${invoice.id}`} className="w-full">
            <Button variant="outline" className="w-full text-xs h-8">
              عرض A4
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // FORMAL A4 INVOICE VIEW
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header & Actions Bar (Hidden when printing) */}
      <div className="print:hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link href="/sales" className="hover:underline flex items-center gap-1">
              {isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              {isRTL ? 'فواتير المبيعات' : 'Sales Invoices'}
            </Link>
            <span>/</span>
            <span className="font-mono">{invoice.invoiceNumber}</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            {isRTL ? 'فاتورة مبيعات' : 'Sales Invoice'}{' '}
            <span className="font-mono text-primary">{invoice.invoiceNumber}</span>
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => window.print()} variant="outline" className="gap-2">
            <Printer className="w-4 h-4" />
            {isRTL ? 'طباعة A4' : 'Print A4'}
          </Button>

          <Link href={`/sales/${invoice.id}?mode=thermal`} target="_blank">
            <Button variant="outline" className="gap-2">
              <Receipt className="w-4 h-4" />
              {isRTL ? 'إيصال حراري (80mm)' : 'Thermal 80mm'}
            </Button>
          </Link>

          {invoice.balanceDue > 0 && (
            <Button onClick={() => setIsPayOpen(true)} className="gap-2">
              <DollarSign className="w-4 h-4" />
              {isRTL ? 'تسجيل سداد' : 'Record Payment'}
            </Button>
          )}
        </div>
      </div>

      {/* Formal A4 Document Card */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-lg p-8 space-y-6 print:shadow-none print:border-none print:p-0">
        {/* Company Header */}
        <div className="flex justify-between items-start border-b pb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              شركة استيراد وتوزيع رولمان البلي وقطع الغيار
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              المقر الرئيسي: القاهرة - السبتية - شارع الجلاء
            </p>
            <p className="text-xs text-muted-foreground">
              سجل تجاري: 104928 • بطاقة ضريبية: 392-482-192
            </p>
          </div>

          <div className="text-left font-mono">
            <Badge variant="outline" className="text-sm font-bold px-3 py-1 mb-2">
              {invoice.status}
            </Badge>
            <div className="text-xs text-muted-foreground">
              {isRTL ? 'تاريخ الفاتورة: ' : 'Invoice Date: '}
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {new Date(invoice.invoiceDate).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US')}
              </span>
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {isRTL ? 'تاريخ الاستحقاق: ' : 'Due Date: '}
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {new Date(invoice.dueDate).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US')}
              </span>
            </div>
          </div>
        </div>

        {/* Customer & Delivery Info */}
        <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg">
          <div>
            <span className="text-muted-foreground block text-[11px] font-semibold uppercase mb-1">
              {isRTL ? 'بيانات العميل:' : 'Bill To:'}
            </span>
            <div className="font-bold text-sm text-slate-900 dark:text-slate-100">{invoice.customer?.nameAr}</div>
            <div className="text-muted-foreground mt-0.5">{invoice.customer?.phone}</div>
            <div className="text-muted-foreground">{invoice.customer?.governorate} {invoice.customer?.address && `- ${invoice.customer.address}`}</div>
            {invoice.customer?.taxNumber && (
              <div className="text-muted-foreground mt-1">الرقم الضريبي: {invoice.customer.taxNumber}</div>
            )}
          </div>

          <div>
            <span className="text-muted-foreground block text-[11px] font-semibold uppercase mb-1">
              {isRTL ? 'تفاصيل التسليم والمندوب:' : 'Delivery & Rep:'}
            </span>
            <div>{isRTL ? 'مندوب المبيعات: ' : 'Sales Rep: '}<strong>{invoice.salesRep?.user?.name || '-'}</strong></div>
            {invoice.deliveryNote && (
              <div className="mt-1">
                {isRTL ? 'إذن التسليم: ' : 'Delivery Note: '}
                <span className="font-mono font-semibold">{invoice.deliveryNote.deliveryNumber}</span>
              </div>
            )}
            {invoice.notes && <div className="mt-1 text-slate-600 dark:text-slate-400">ملاحظات: {invoice.notes}</div>}
          </div>
        </div>

        {/* Invoice Line Items */}
        <div>
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-100 dark:bg-slate-800">
                <TableHead className="w-[40px]">#</TableHead>
                <TableHead>{isRTL ? 'كود الصنف' : 'SKU'}</TableHead>
                <TableHead>{isRTL ? 'الوصف والصنف' : 'Description'}</TableHead>
                <TableHead className="text-center">{isRTL ? 'الكمية' : 'Qty'}</TableHead>
                <TableHead className="text-right">{isRTL ? 'سعر الوحدة' : 'Unit Price'}</TableHead>
                <TableHead className="text-center">{isRTL ? 'خصم %' : 'Disc %'}</TableHead>
                <TableHead className="text-right">{isRTL ? 'الإجمالي' : 'Total'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.items?.map((it: any, idx: number) => (
                <TableRow key={it.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">{idx + 1}</TableCell>
                  <TableCell className="font-mono text-xs font-bold text-primary">{it.product?.sku}</TableCell>
                  <TableCell>
                    <div className="font-medium text-xs text-slate-900 dark:text-slate-100">{it.product?.nameAr}</div>
                    {(it.product?.bearingSpec?.bearingNumber || it.product?.sparePartSpec?.partNumber) && (
                      <div className="text-[11px] text-muted-foreground">
                        [{it.product?.bearingSpec?.bearingNumber || it.product?.sparePartSpec?.partNumber}]
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-center font-mono font-bold text-xs">
                    {it.quantity} {it.product?.unitOfMeasure === 'PIECE' ? (isRTL ? 'قطعة' : 'pcs') : it.product?.unitOfMeasure}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs">{formatEGP(it.unitPrice)}</TableCell>
                  <TableCell className="text-center font-mono text-xs">{it.discountPct > 0 ? `${it.discountPct}%` : '-'}</TableCell>
                  <TableCell className="text-right font-mono font-bold text-xs">{formatEGP(it.lineTotal)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Totals Summary */}
        <div className="flex justify-end pt-4 border-t">
          <div className="w-64 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{isRTL ? 'المجموع الفرعي:' : 'Subtotal:'}</span>
              <span className="font-mono font-semibold">{formatEGP(invoice.grandTotal)}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-muted-foreground">{isRTL ? 'المدفوع:' : 'Paid Amount:'}</span>
              <span className="font-mono font-semibold text-emerald-600">{formatEGP(invoice.paidAmount)}</span>
            </div>

            <div className="flex justify-between border-t-2 pt-2 text-sm font-bold">
              <span>{isRTL ? 'الرصيد المتبقي:' : 'Balance Due:'}</span>
              <span className="font-mono text-rose-600">{formatEGP(invoice.balanceDue)}</span>
            </div>
          </div>
        </div>

        {/* Signature Box */}
        <div className="grid grid-cols-2 gap-8 pt-12 border-t text-xs text-center text-muted-foreground">
          <div>
            <p className="mb-8">{isRTL ? 'توقيع المستلم (العميل):' : 'Received By:'}</p>
            <div className="border-b w-48 mx-auto" />
          </div>

          <div>
            <p className="mb-8">{isRTL ? 'المسؤول / أمين المستودع:' : 'Authorized Signature:'}</p>
            <div className="border-b w-48 mx-auto" />
          </div>
        </div>
      </Card>

      {/* Record Payment Dialog */}
      <Dialog open={isPayOpen} onOpenChange={setIsPayOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              {isRTL ? 'تسجيل سداد على الفاتورة' : 'Record Invoice Payment'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleRecordPayment} className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold block mb-1">
                {isRTL ? 'المبلغ المسدد (ج.م) *' : 'Amount (EGP) *'}
              </label>
              <Input
                type="number"
                step="0.01"
                required
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                {isRTL ? 'المتبقي على الفاتورة: ' : 'Balance due: '}
                <span className="font-mono font-bold text-rose-600">{formatEGP(invoice.balanceDue)}</span>
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1">
                {isRTL ? 'طريقة السداد *' : 'Payment Method *'}
              </label>
              <select
                value={payMethod}
                onChange={(e: any) => setPayMethod(e.target.value)}
                className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="CASH">{isRTL ? 'نقدي' : 'Cash'}</option>
                <option value="BANK_TRANSFER">{isRTL ? 'تحويل بنكي' : 'Bank Transfer'}</option>
                <option value="MOBILE_WALLET">{isRTL ? 'محفظة / إنستاباي' : 'InstaPay / Wallet'}</option>
                <option value="CHEQUE">{isRTL ? 'شيك مصرفي' : 'Bank Cheque'}</option>
              </select>
            </div>

            {payMethod === 'CHEQUE' && (
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg space-y-2 text-xs">
                <div>
                  <label className="block mb-1 font-semibold">{isRTL ? 'رقم الشيك *' : 'Cheque #'}</label>
                  <Input
                    required
                    value={chequeDetails.chequeNumber}
                    onChange={(e) => setChequeDetails({ ...chequeDetails, chequeNumber: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block mb-1 font-semibold">{isRTL ? 'البنك المسحوب عليه *' : 'Bank'}</label>
                  <Input
                    required
                    value={chequeDetails.bankName}
                    onChange={(e) => setChequeDetails({ ...chequeDetails, bankName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block mb-1 font-semibold">{isRTL ? 'تاريخ الاستحقاق *' : 'Due Date'}</label>
                  <Input
                    type="date"
                    required
                    value={chequeDetails.dueDate}
                    onChange={(e) => setChequeDetails({ ...chequeDetails, dueDate: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold block mb-1">
                {isRTL ? 'الحساب / الخزينة المودع بها *' : 'Deposit Account *'}
              </label>
              <select
                required
                value={payAccountId}
                onChange={(e) => setPayAccountId(e.target.value)}
                className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {isRTL ? a.nameAr : a.nameEn}
                  </option>
                ))}
              </select>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsPayOpen(false)}>
                {isRTL ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button type="submit" disabled={isSubmittingPay}>
                {isSubmittingPay ? (isRTL ? 'جاري الحفظ...' : 'Saving...') : (isRTL ? 'حفظ السداد' : 'Save Payment')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
