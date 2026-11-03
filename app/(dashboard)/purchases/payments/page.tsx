'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  Plus,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
  Calendar,
  CreditCard,
  FileText,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Wallet,
  CheckCircle2,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { formatEGP, formatCurrency } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

export default function SupplierPaymentsPage() {
  const { locale, isRTL } = useI18n();
  const { toast } = useToast();

  const [payments, setPayments] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('ALL');

  // Modal State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    supplierId: '',
    poId: '',
    paymentDate: new Date().toISOString().split('T')[0],
    amount: '',
    currency: 'USD',
    exchangeRate: '48.50',
    paymentMethod: 'BANK_TRANSFER',
    accountId: '',
    reference: '',
    notes: '',
  });

  useEffect(() => {
    fetchPayments();
    fetchSuppliers();
    fetchAccounts();
    fetchPurchaseOrders();
  }, []);

  const fetchPayments = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/purchases/payments');
      const json = await res.json();
      if (json.success) {
        setPayments(json.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await fetch('/api/suppliers');
      const json = await res.json();
      if (json.success) {
        setSuppliers(json.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/accounts');
      const json = await res.json();
      if (json.success) {
        setAccounts(json.data || []);
        if (json.data?.length > 0 && !formData.accountId) {
          const def = json.data.find((a: any) => a.isDefault) || json.data[0];
          setFormData((prev) => ({ ...prev, accountId: def.id }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPurchaseOrders = async () => {
    try {
      const res = await fetch('/api/purchases');
      const json = await res.json();
      if (json.success) {
        setPurchaseOrders(json.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSupplierChange = (supId: string) => {
    const sup = suppliers.find((s) => s.id === supId);
    setFormData((prev) => ({
      ...prev,
      supplierId: supId,
      currency: sup?.currency || 'USD',
      poId: '',
    }));
  };

  const handlePOChange = (poId: string) => {
    const po = purchaseOrders.find((p) => p.id === poId);
    setFormData((prev) => ({
      ...prev,
      poId,
      currency: po?.currency || prev.currency,
      exchangeRate: po ? String(po.exchangeRate) : prev.exchangeRate,
    }));
  };

  // Calculations for preview in modal
  const enteredAmount = parseFloat(formData.amount) || 0;
  const enteredRate = parseFloat(formData.exchangeRate) || 0;
  const calculatedEGP = enteredAmount * enteredRate;

  // Selected PO comparison
  const selectedPO = purchaseOrders.find((p) => p.id === formData.poId);
  const poRate = selectedPO ? Number(selectedPO.exchangeRate) : null;
  // If we pay less EGP per USD than PO rate, it's a gain: (PO_rate - Pay_rate) * Amount
  const projectedGainLoss = poRate ? (poRate - enteredRate) * enteredAmount : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.supplierId || !formData.amount || !formData.exchangeRate || !formData.accountId) {
      toast({
        title: isRTL ? 'بيانات ناقصة' : 'Missing Information',
        description: isRTL
          ? 'يرجى ملء المورد والمبلغ وسعر الصرف والحساب المالي'
          : 'Please specify supplier, amount, exchange rate and account',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/purchases/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
          exchangeRate: parseFloat(formData.exchangeRate),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to save payment');
      }

      toast({
        title: isRTL ? 'تم التسجيل بنجاح' : 'Payment Recorded',
        description: isRTL
          ? `تم قيد سداد بقيمة ${formatCurrency(enteredAmount, formData.currency)} بنجاح`
          : `Payment of ${formatCurrency(enteredAmount, formData.currency)} has been recorded`,
      });

      setIsDialogOpen(false);
      setFormData({
        supplierId: '',
        poId: '',
        paymentDate: new Date().toISOString().split('T')[0],
        amount: '',
        currency: 'USD',
        exchangeRate: '48.50',
        paymentMethod: 'BANK_TRANSFER',
        accountId: accounts[0]?.id || '',
        reference: '',
        notes: '',
      });
      fetchPayments();
    } catch (err: any) {
      toast({
        title: isRTL ? 'خطأ' : 'Error',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered payments list
  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      !searchQuery ||
      p.supplier?.nameAr?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.supplier?.nameEn?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.reference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.purchaseOrder?.poNumber?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCurrency = selectedCurrency === 'ALL' || p.currency === selectedCurrency;

    return matchesSearch && matchesCurrency;
  });

  // Totals for KPIs
  const totalPaidEGP = filteredPayments.reduce((acc, p) => acc + (p.amountEGP || 0), 0);
  const totalGainLoss = filteredPayments.reduce((acc, p) => acc + (p.exchangeGainLoss || 0), 0);
  const foreignPaymentsCount = filteredPayments.filter((p) => p.currency !== 'EGP').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-primary" />
            {isRTL ? 'سداد الموردين وفروق العملة' : 'Supplier Payments & FX'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isRTL
              ? 'متابعة سداد فواتير الاستيراد بالعملات الأجنبية، تقييم سعر الصرف، وأرباح/خسائر فروق العملة'
              : 'Track foreign currency import payments, exchange rates, and realized FX gain/loss'}
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button onClick={() => setIsDialogOpen(true)} className="flex-1 sm:flex-none gap-2">
            <Plus className="w-4 h-4" />
            {isRTL ? 'تسجيل سداد جديد' : 'Record Payment'}
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                {isRTL ? 'إجمالي المدفوعات (بالجنيه)' : 'Total Paid (EGP)'}
              </p>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                {formatEGP(totalPaidEGP)}
              </h3>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-950/60 rounded-xl text-blue-600">
              <Wallet className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                {isRTL ? 'صافي فروق العملة المحققة' : 'Realized FX Gain/Loss'}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <h3
                  className={`text-xl font-bold ${
                    totalGainLoss >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {totalGainLoss >= 0 ? '+' : ''}
                  {formatEGP(totalGainLoss)}
                </h3>
                {totalGainLoss >= 0 ? (
                  <Badge variant="outline" className="text-emerald-600 border-emerald-300">
                    {isRTL ? 'أرباح صرف' : 'Gain'}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-rose-600 border-rose-300">
                    {isRTL ? 'خسائر صرف' : 'Loss'}
                  </Badge>
                )}
              </div>
            </div>
            <div
              className={`p-3 rounded-xl ${
                totalGainLoss >= 0
                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600'
                  : 'bg-rose-100 dark:bg-rose-950/60 text-rose-600'
              }`}
            >
              {totalGainLoss >= 0 ? (
                <TrendingUp className="w-5 h-5" />
              ) : (
                <TrendingDown className="w-5 h-5" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                {isRTL ? 'دفعات العملات الأجنبية' : 'Foreign Payments'}
              </p>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                {foreignPaymentsCount} {isRTL ? 'عملية سداد' : 'Payments'}
              </h3>
            </div>
            <div className="p-3 bg-amber-100 dark:bg-amber-950/60 rounded-xl text-amber-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={
                isRTL
                  ? 'بحث باسم المورد، أمر الشراء، رقم الحوالة...'
                  : 'Search by supplier, PO, reference...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-9"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              className="h-10 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary w-full sm:w-auto"
            >
              <option value="ALL">{isRTL ? 'جميع العملات' : 'All Currencies'}</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="CNY">CNY (¥)</option>
              <option value="EGP">EGP (ج.م)</option>
            </select>

            <Button variant="outline" size="icon" onClick={fetchPayments} title={isRTL ? 'تحديث' : 'Refresh'}>
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Desktop Table View */}
      <div className="hidden md:block">
        <Card className="border-slate-200 dark:border-slate-800 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-900/50">
                <TableHead>{isRTL ? 'التاريخ' : 'Date'}</TableHead>
                <TableHead>{isRTL ? 'المورد' : 'Supplier'}</TableHead>
                <TableHead>{isRTL ? 'أمر الشراء المرتبط' : 'Linked PO'}</TableHead>
                <TableHead>{isRTL ? 'المبلغ بالعملة' : 'Foreign Amount'}</TableHead>
                <TableHead>{isRTL ? 'سعر الصرف' : 'Rate'}</TableHead>
                <TableHead>{isRTL ? 'المعادل بالجنيه' : 'Amount (EGP)'}</TableHead>
                <TableHead>{isRTL ? 'فرق العملة' : 'FX Gain/Loss'}</TableHead>
                <TableHead>{isRTL ? 'طريقة السداد / الحساب' : 'Method / Account'}</TableHead>
                <TableHead>{isRTL ? 'المرجع / ملاحظات' : 'Ref / Notes'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    {isLoading
                      ? isRTL ? 'جاري التحميل...' : 'Loading...'
                      : isRTL ? 'لا توجد مدفوعات مسجلة' : 'No payments found'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredPayments.map((p) => {
                  const gainLoss = Number(p.exchangeGainLoss || 0);
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(p.paymentDate).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US')}
                      </TableCell>
                      <TableCell className="font-medium text-slate-900 dark:text-slate-100">
                        <Link href={`/suppliers/${p.supplierId}`} className="hover:underline flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                          {isRTL ? p.supplier?.nameAr : p.supplier?.nameEn || p.supplier?.nameAr}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {p.purchaseOrder ? (
                          <Link href={`/purchases/${p.poId}`} className="text-xs font-mono text-primary hover:underline">
                            {p.purchaseOrder.poNumber}
                          </Link>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="font-bold text-slate-800 dark:text-slate-200">
                        {formatCurrency(p.amount, p.currency)}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        1 {p.currency} = {p.exchangeRate} ج.م
                        {p.purchaseOrder?.exchangeRate && (
                          <div className="text-[10px] text-muted-foreground">
                            (PO: {p.purchaseOrder.exchangeRate})
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-semibold text-slate-900 dark:text-slate-100">
                        {formatEGP(p.amountEGP)}
                      </TableCell>
                      <TableCell>
                        {gainLoss === 0 ? (
                          <span className="text-xs text-muted-foreground">0.00</span>
                        ) : gainLoss > 0 ? (
                          <span className="text-xs font-semibold text-emerald-600 flex items-center gap-0.5">
                            <ArrowUpRight className="w-3 h-3" />
                            +{formatEGP(gainLoss)}
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-rose-600 flex items-center gap-0.5">
                            <ArrowDownRight className="w-3 h-3" />
                            {formatEGP(gainLoss)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-xs font-medium">
                          {p.paymentMethod === 'BANK_TRANSFER' ? (isRTL ? 'تحويل بنكي' : 'Bank Transfer') : p.paymentMethod}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {isRTL ? p.account?.nameAr : p.account?.nameEn}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate" title={p.notes || p.reference || ''}>
                        {p.reference && <div className="font-mono text-[11px] text-slate-700 dark:text-slate-300">{p.reference}</div>}
                        {p.notes || '-'}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Mobile Cards View */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {filteredPayments.length === 0 ? (
          <Card className="p-6 text-center text-muted-foreground text-sm">
            {isLoading
              ? isRTL ? 'جاري التحميل...' : 'Loading...'
              : isRTL ? 'لا توجد مدفوعات مسجلة' : 'No payments found'}
          </Card>
        ) : (
          filteredPayments.map((p) => {
            const gainLoss = Number(p.exchangeGainLoss || 0);
            return (
              <Card key={p.id} className="border-slate-200 dark:border-slate-800 p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      {isRTL ? p.supplier?.nameAr : p.supplier?.nameEn}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                      <span>{new Date(p.paymentDate).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US')}</span>
                      {p.purchaseOrder && (
                        <Link href={`/purchases/${p.poId}`} className="font-mono text-primary hover:underline">
                          {p.purchaseOrder.poNumber}
                        </Link>
                      )}
                    </div>
                  </div>
                  <div className="text-left font-bold text-sm">
                    {formatCurrency(p.amount, p.currency)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-muted-foreground block">{isRTL ? 'المعادل بالجنيه' : 'Amount EGP'}</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{formatEGP(p.amountEGP)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">{isRTL ? 'سعر الصرف' : 'Rate'}</span>
                    <span className="font-mono">1 {p.currency} = {p.exchangeRate}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">{isRTL ? 'فرق العملة' : 'FX Result'}</span>
                    {gainLoss > 0 ? (
                      <span className="font-semibold text-emerald-600">+{formatEGP(gainLoss)}</span>
                    ) : gainLoss < 0 ? (
                      <span className="font-semibold text-rose-600">{formatEGP(gainLoss)}</span>
                    ) : (
                      <span>-</span>
                    )}
                  </div>
                  <div>
                    <span className="text-muted-foreground block">{isRTL ? 'الحساب' : 'Account'}</span>
                    <span className="truncate block">{isRTL ? p.account?.nameAr : p.account?.nameEn}</span>
                  </div>
                </div>

                {(p.reference || p.notes) && (
                  <div className="text-xs text-muted-foreground bg-slate-50 dark:bg-slate-900/50 p-2 rounded">
                    {p.reference && <div className="font-mono font-medium">{p.reference}</div>}
                    {p.notes}
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* Record Payment Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              {isRTL ? 'تسجيل سداد لمورد أجنبي' : 'Record Supplier Foreign Payment'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            {/* Supplier Selector */}
            <div>
              <label className="text-xs font-semibold block mb-1">
                {isRTL ? 'المورد *' : 'Supplier *'}
              </label>
              <select
                required
                value={formData.supplierId}
                onChange={(e) => handleSupplierChange(e.target.value)}
                className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">{isRTL ? '-- اختر المورد --' : '-- Select Supplier --'}</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {isRTL ? s.nameAr : s.nameEn} ({s.country || 'External'}) - {s.currency}
                  </option>
                ))}
              </select>
            </div>

            {/* Linked Purchase Order (optional) */}
            <div>
              <label className="text-xs font-semibold block mb-1">
                {isRTL ? 'أمر الشراء المرتبط (اختياري)' : 'Linked Purchase Order (Optional)'}
              </label>
              <select
                value={formData.poId}
                onChange={(e) => handlePOChange(e.target.value)}
                className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">{isRTL ? '-- غير مرتبط بأمر شراء معين --' : '-- General Payment (Not linked to PO) --'}</option>
                {purchaseOrders
                  .filter((po) => !formData.supplierId || po.supplierId === formData.supplierId)
                  .map((po) => (
                    <option key={po.id} value={po.id}>
                      {po.poNumber} ({formatCurrency(po.totalAmount, po.currency)} @ {po.exchangeRate}) - {po.status}
                    </option>
                  ))}
              </select>
            </div>

            {/* Date & Currency */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold block mb-1">
                  {isRTL ? 'تاريخ السداد *' : 'Payment Date *'}
                </label>
                <Input
                  type="date"
                  required
                  value={formData.paymentDate}
                  onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1">
                  {isRTL ? 'العملة *' : 'Currency *'}
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="CNY">CNY (¥)</option>
                  <option value="EGP">EGP (ج.م)</option>
                </select>
              </div>
            </div>

            {/* Amount & Exchange Rate */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold block mb-1">
                  {isRTL ? 'المبلغ بالعملة الأجنبية *' : 'Amount in Currency *'}
                </label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 5000"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1">
                  {isRTL ? 'سعر صرف السداد (ج.م) *' : 'Payment Rate (EGP) *'}
                </label>
                <Input
                  type="number"
                  step="0.0001"
                  required
                  placeholder="e.g. 48.75"
                  value={formData.exchangeRate}
                  onChange={(e) => setFormData({ ...formData, exchangeRate: e.target.value })}
                />
              </div>
            </div>

            {/* Live Calculation Preview Card */}
            {enteredAmount > 0 && enteredRate > 0 && (
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{isRTL ? 'المعادل بالجنيه المصري:' : 'EGP Equivalent:'}</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{formatEGP(calculatedEGP)}</span>
                </div>
                {poRate !== null && (
                  <div className="flex justify-between items-center pt-1 border-t border-slate-200 dark:border-slate-800">
                    <span className="text-muted-foreground">
                      {isRTL ? 'فروق العملة الناتجة (مقارنة بـ PO):' : 'Projected FX Result:'}
                    </span>
                    <span
                      className={`font-semibold ${
                        projectedGainLoss >= 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {projectedGainLoss >= 0 ? '+' : ''}
                      {formatEGP(projectedGainLoss)}{' '}
                      ({projectedGainLoss >= 0 ? (isRTL ? 'ربح صرف' : 'Gain') : (isRTL ? 'خسارة صرف' : 'Loss')})
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Account & Payment Method */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold block mb-1">
                  {isRTL ? 'الحساب المالي المسدد منه *' : 'Paid From Account *'}
                </label>
                <select
                  required
                  value={formData.accountId}
                  onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                  className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">{isRTL ? '-- اختر الحساب --' : '-- Select Account --'}</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {isRTL ? a.nameAr : a.nameEn} ({formatEGP(a.currentBalance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1">
                  {isRTL ? 'طريقة الدفع *' : 'Payment Method *'}
                </label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="BANK_TRANSFER">{isRTL ? 'تحويل بنكي' : 'Bank Transfer'}</option>
                  <option value="CASH">{isRTL ? 'نقدي' : 'Cash'}</option>
                  <option value="CHEQUE">{isRTL ? 'شيك مصرفي' : 'Bank Cheque'}</option>
                </select>
              </div>
            </div>

            {/* Reference and Notes */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold block mb-1">
                  {isRTL ? 'رقم الحوالة / السويفت' : 'Transfer Ref / Swift'}
                </label>
                <Input
                  placeholder="e.g. SWIFT-882193"
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1">
                  {isRTL ? 'ملاحظات' : 'Notes'}
                </label>
                <Input
                  placeholder={isRTL ? 'ملاحظات إضافية...' : 'Additional notes...'}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                {isRTL ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (isRTL ? 'جاري الحفظ...' : 'Saving...') : (isRTL ? 'حفظ السداد' : 'Save Payment')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
