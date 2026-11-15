'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  DollarSign,
  Calendar,
  Building2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  MoreHorizontal,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { formatEGP } from '@/lib/utils';

export default function ChequesPage() {
  const { locale, isRTL } = useI18n();
  const { toast } = useToast();

  const [cheques, setCheques] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [kpis, setKpis] = useState<any>({
    totalPendingAmount: 0,
    totalDepositedAmount: 0,
    totalClearedAmount: 0,
    bouncedCount: 0,
    dueSoonCount: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDirection, setSelectedDirection] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [onlyDueSoon, setOnlyDueSoon] = useState(false);

  // New Cheque Modal
  const [isNewChequeOpen, setIsNewChequeOpen] = useState(false);
  const [newChequeData, setNewChequeData] = useState({
    chequeNumber: '',
    bankName: 'البنك الأهلي المصري',
    accountHolderName: '',
    amount: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    direction: 'RECEIVED',
    relatedEntityName: '',
    notes: '',
  });

  // Clear Cheque Modal (Deposit to Bank)
  const [clearingCheque, setClearingCheque] = useState<any>(null);
  const [clearingAccountId, setClearingAccountId] = useState('');
  const [isSubmittingClear, setIsSubmittingClear] = useState(false);

  useEffect(() => {
    fetchCheques();
    fetchAccounts();
  }, [selectedDirection, selectedStatus, onlyDueSoon]);

  const fetchCheques = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.set('q', searchQuery);
      if (selectedDirection !== 'ALL') params.set('direction', selectedDirection);
      if (selectedStatus !== 'ALL') params.set('status', selectedStatus);
      if (onlyDueSoon) params.set('dueSoon', 'true');

      const res = await fetch(`/api/cheques?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setCheques(json.data || []);
        setKpis(json.kpis || {});
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
        setClearingAccountId(def.id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateCheque = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChequeData.chequeNumber || !newChequeData.bankName || !newChequeData.amount) {
      toast({
        title: isRTL ? 'بيانات ناقصة' : 'Missing Information',
        description: isRTL ? 'يرجى إدخال رقم الشيك والبنك والمبلغ' : 'Please fill all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      const res = await fetch('/api/cheques', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newChequeData,
          amount: parseFloat(newChequeData.amount),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to record cheque');
      }

      toast({
        title: isRTL ? 'تم تسجيل الشيك بنجاح' : 'Cheque Recorded',
        description: isRTL
          ? `شيك رقم ${newChequeData.chequeNumber} بقيمة ${formatEGP(newChequeData.amount)}`
          : `Cheque ${newChequeData.chequeNumber} saved`,
      });

      setIsNewChequeOpen(false);
      setNewChequeData({
        chequeNumber: '',
        bankName: 'البنك الأهلي المصري',
        accountHolderName: '',
        amount: '',
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        direction: 'RECEIVED',
        relatedEntityName: '',
        notes: '',
      });
      fetchCheques();
    } catch (err: any) {
      toast({
        title: isRTL ? 'خطأ' : 'Error',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const handleUpdateStatus = async (chequeId: string, newStatus: string, accountId?: string) => {
    try {
      const res = await fetch(`/api/cheques/${chequeId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, accountId }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to update cheque');
      }

      toast({
        title: isRTL ? 'تم تغيير حالة الشيك' : 'Status Updated',
        description: isRTL ? `أصبحت حالة الشيك: ${newStatus}` : `Cheque status is now ${newStatus}`,
      });

      setClearingCheque(null);
      fetchCheques();
    } catch (err: any) {
      toast({
        title: isRTL ? 'خطأ' : 'Error',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-primary" />
            {isRTL ? 'إدارة محفظة الشيكات البنكية' : 'Bank Cheques Portfolio'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isRTL
              ? 'متابعة الشيكات الواردة من العملاء والشيكات الصادرة للموردين، مواعيد الاستحقاق، والتحصيل'
              : 'Track received & issued post-dated cheques, maturities, banking deposits, and clearance'}
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button onClick={() => setIsNewChequeOpen(true)} className="gap-2 w-full sm:w-auto">
            <Plus className="w-4 h-4" />
            {isRTL ? 'تسجيل شيك جديد' : 'New Cheque'}
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                {isRTL ? 'قيد الانتظار (في الخزينة)' : 'Pending in Drawer'}
              </p>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                {formatEGP(kpis.totalPendingAmount || 0)}
              </h3>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-950/60 rounded-xl text-blue-600">
              <CreditCard className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                {isRTL ? 'تحت التحصيل بالبنك' : 'Deposited in Bank'}
              </p>
              <h3 className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                {formatEGP(kpis.totalDepositedAmount || 0)}
              </h3>
            </div>
            <div className="p-3 bg-indigo-100 dark:bg-indigo-950/60 rounded-xl text-indigo-600">
              <Building2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                {isRTL ? 'شيكات تم تحصيلها' : 'Successfully Cleared'}
              </p>
              <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {formatEGP(kpis.totalClearedAmount || 0)}
              </h3>
            </div>
            <div className="p-3 bg-emerald-100 dark:bg-emerald-950/60 rounded-xl text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                {isRTL ? 'شيكات مرتدة / مرفوضة' : 'Bounced Cheques'}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <h3 className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                  {kpis.bouncedCount}
                </h3>
                {kpis.bouncedCount > 0 && (
                  <Badge variant="outline" className="text-rose-600 border-rose-300">
                    {isRTL ? 'مرفوض' : 'Bounced'}
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

      {/* Filter and Direction Bar */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardContent className="p-4 flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={
                isRTL
                  ? 'بحث برقم الشيك، اسم البنك، اسم الساحب أو العميل...'
                  : 'Search by cheque #, bank, customer...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Direction Selector */}
            <select
              value={selectedDirection}
              onChange={(e) => setSelectedDirection(e.target.value)}
              className="h-10 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="ALL">{isRTL ? 'جميع الاتجاهات' : 'All Directions'}</option>
              <option value="RECEIVED">{isRTL ? 'شيكات واردة من عملاء (+)' : 'Received (+)'}</option>
              <option value="ISSUED">{isRTL ? 'شيكات صادرة لموردين (-)' : 'Issued (-)'}</option>
            </select>

            {/* Status Selector */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-10 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="ALL">{isRTL ? 'جميع الحالات' : 'All Statuses'}</option>
              <option value="PENDING">{isRTL ? 'قيد الانتظار' : 'Pending'}</option>
              <option value="DEPOSITED">{isRTL ? 'تحت التحصيل' : 'Deposited'}</option>
              <option value="CLEARED">{isRTL ? 'تم الصرف والتحصيل' : 'Cleared'}</option>
              <option value="BOUNCED">{isRTL ? 'مرتد / مرفوض' : 'Bounced'}</option>
              <option value="RETURNED">{isRTL ? 'مرتجع' : 'Returned'}</option>
            </select>

            {/* Due soon toggle */}
            <Button
              variant={onlyDueSoon ? 'default' : 'outline'}
              size="sm"
              onClick={() => setOnlyDueSoon(!onlyDueSoon)}
              className="h-10 text-xs"
            >
              <Clock className="w-3.5 h-3.5 mr-1" />
              {isRTL ? 'المستحقة خلال 7 أيام' : 'Due in 7 Days'}
            </Button>

            <Button variant="outline" size="icon" onClick={fetchCheques} title={isRTL ? 'تحديث' : 'Refresh'}>
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
                <TableHead>{isRTL ? 'رقم الشيك' : 'Cheque #'}</TableHead>
                <TableHead>{isRTL ? 'البنك المسحوب عليه' : 'Bank'}</TableHead>
                <TableHead>{isRTL ? 'الاتجاه' : 'Direction'}</TableHead>
                <TableHead>{isRTL ? 'الساحب / الجهة' : 'Drawer / Entity'}</TableHead>
                <TableHead className="text-right font-bold">{isRTL ? 'المبلغ' : 'Amount'}</TableHead>
                <TableHead>{isRTL ? 'تاريخ الاستحقاق' : 'Due Date'}</TableHead>
                <TableHead>{isRTL ? 'الحالة' : 'Status'}</TableHead>
                <TableHead className="w-[80px] text-left">{isRTL ? 'إجراء' : 'Action'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cheques.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    {isLoading
                      ? isRTL ? 'جاري التحميل...' : 'Loading cheques...'
                      : isRTL ? 'لا توجد شيكات مطابقة' : 'No cheques found'}
                  </TableCell>
                </TableRow>
              ) : (
                cheques.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-xs font-bold text-primary">
                      {c.chequeNumber}
                    </TableCell>

                    <TableCell className="text-xs font-medium text-slate-900 dark:text-slate-100">
                      {c.bankName}
                    </TableCell>

                    <TableCell>
                      {c.direction === 'RECEIVED' ? (
                        <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-300 gap-1">
                          <ArrowDownLeft className="w-3 h-3" />
                          {isRTL ? 'مقبوض من عميل' : 'Received'}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs bg-rose-50 text-rose-700 border-rose-300 gap-1">
                          <ArrowUpRight className="w-3 h-3" />
                          {isRTL ? 'صادر لمورد' : 'Issued'}
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell className="text-xs">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {c.accountHolderName || c.relatedEntityName || '-'}
                      </div>
                      {c.notes && <div className="text-[11px] text-muted-foreground">{c.notes}</div>}
                    </TableCell>

                    <TableCell className="text-right font-mono font-bold text-sm text-slate-900 dark:text-slate-100">
                      {formatEGP(c.amount)}
                    </TableCell>

                    <TableCell className="font-mono text-xs whitespace-nowrap">
                      <div className={c.isOverdue ? 'text-rose-600 font-bold' : c.isDueSoon ? 'text-amber-600 font-bold' : ''}>
                        {new Date(c.dueDate).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US')}
                      </div>
                      {c.isDueSoon && <div className="text-[10px] text-amber-600">{isRTL ? 'يستحق قريباً' : 'Due soon'}</div>}
                      {c.isOverdue && <div className="text-[10px] text-rose-600">{isRTL ? 'متأخر' : 'Overdue'}</div>}
                    </TableCell>

                    <TableCell>
                      {c.status === 'CLEARED' ? (
                        <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-300">
                          {isRTL ? 'تم الصرف' : 'Cleared'}
                        </Badge>
                      ) : c.status === 'DEPOSITED' ? (
                        <Badge variant="outline" className="text-xs bg-indigo-50 text-indigo-700 border-indigo-300">
                          {isRTL ? 'تحت التحصيل' : 'Deposited'}
                        </Badge>
                      ) : c.status === 'BOUNCED' ? (
                        <Badge variant="outline" className="text-xs bg-rose-50 text-rose-700 border-rose-300">
                          {isRTL ? 'مرتد ومرفوض' : 'Bounced'}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs bg-slate-100 text-slate-700 border-slate-300">
                          {isRTL ? 'قيد الانتظار' : 'Pending'}
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
                          {c.status !== 'DEPOSITED' && c.status !== 'CLEARED' && (
                            <DropdownMenuItem onClick={() => handleUpdateStatus(c.id, 'DEPOSITED')}>
                              {isRTL ? 'إيداع بالبنك للتحصيل' : 'Deposit in Bank'}
                            </DropdownMenuItem>
                          )}
                          {c.status !== 'CLEARED' && (
                            <DropdownMenuItem onClick={() => setClearingCheque(c)} className="text-emerald-600 font-semibold">
                              {isRTL ? 'تم التحصيل والصرف' : 'Mark as Cleared'}
                            </DropdownMenuItem>
                          )}
                          {c.status !== 'BOUNCED' && c.status !== 'CLEARED' && (
                            <DropdownMenuItem onClick={() => handleUpdateStatus(c.id, 'BOUNCED')} className="text-rose-600">
                              {isRTL ? 'شيك مرتد ومرفوض' : 'Mark as Bounced'}
                            </DropdownMenuItem>
                          )}
                          {c.status !== 'RETURNED' && (
                            <DropdownMenuItem onClick={() => handleUpdateStatus(c.id, 'RETURNED')}>
                              {isRTL ? 'مرتجع / ملغى' : 'Mark as Returned'}
                            </DropdownMenuItem>
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
        {cheques.length === 0 ? (
          <Card className="p-6 text-center text-muted-foreground text-sm col-span-full">
            {isLoading
              ? isRTL ? 'جاري التحميل...' : 'Loading cheques...'
              : isRTL ? 'لا توجد شيكات مطابقة' : 'No cheques found'}
          </Card>
        ) : (
          cheques.map((c) => (
            <Card key={c.id} className="border-slate-200 dark:border-slate-800 p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-mono text-xs font-bold text-primary">
                    #{c.chequeNumber}
                  </div>
                  <div className="font-semibold text-sm text-slate-900 dark:text-slate-100 mt-0.5">
                    {c.bankName}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {c.accountHolderName || c.relatedEntityName}
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100">
                    {formatEGP(c.amount)}
                  </div>
                  <Badge variant="outline" className="text-[11px] mt-1">
                    {c.status}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
                <span className="text-muted-foreground">
                  {isRTL ? 'استحقاق: ' : 'Due: '}
                  {new Date(c.dueDate).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US')}
                </span>

                {c.status !== 'CLEARED' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setClearingCheque(c)}
                    className="h-7 text-xs text-emerald-600 border-emerald-300"
                  >
                    {isRTL ? 'تم التحصيل' : 'Clear'}
                  </Button>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Record Standalone Cheque Dialog */}
      <Dialog open={isNewChequeOpen} onOpenChange={setIsNewChequeOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              {isRTL ? 'تسجيل شيك بنكي جديد' : 'Record New Cheque'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateCheque} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold block mb-1">{isRTL ? 'اتجاه الشيك *' : 'Direction *'}</label>
                <select
                  value={newChequeData.direction}
                  onChange={(e) => setNewChequeData({ ...newChequeData, direction: e.target.value })}
                  className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="RECEIVED">{isRTL ? 'مقبوض من عميل (+)' : 'Received from Customer'}</option>
                  <option value="ISSUED">{isRTL ? 'صادر لمورد (-)' : 'Issued to Supplier'}</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1">{isRTL ? 'المبلغ (ج.م) *' : 'Amount (EGP) *'}</label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 25000"
                  value={newChequeData.amount}
                  onChange={(e) => setNewChequeData({ ...newChequeData, amount: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold block mb-1">{isRTL ? 'رقم الشيك *' : 'Cheque # *'}</label>
                <Input
                  required
                  placeholder="e.g. 0004928"
                  value={newChequeData.chequeNumber}
                  onChange={(e) => setNewChequeData({ ...newChequeData, chequeNumber: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1">{isRTL ? 'البنك المسحوب عليه *' : 'Bank *'}</label>
                <Input
                  required
                  placeholder="البنك الأهلي / CIB"
                  value={newChequeData.bankName}
                  onChange={(e) => setNewChequeData({ ...newChequeData, bankName: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold block mb-1">{isRTL ? 'اسم الساحب / العميل' : 'Drawer Name'}</label>
                <Input
                  placeholder="اسم محرر الشيك"
                  value={newChequeData.accountHolderName}
                  onChange={(e) => setNewChequeData({ ...newChequeData, accountHolderName: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1">{isRTL ? 'تاريخ الاستحقاق *' : 'Due Date *'}</label>
                <Input
                  type="date"
                  required
                  value={newChequeData.dueDate}
                  onChange={(e) => setNewChequeData({ ...newChequeData, dueDate: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1">{isRTL ? 'ملاحظات' : 'Notes'}</label>
              <Input
                placeholder={isRTL ? 'ملاحظات حول الشيك...' : 'Notes...'}
                value={newChequeData.notes}
                onChange={(e) => setNewChequeData({ ...newChequeData, notes: e.target.value })}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsNewChequeOpen(false)}>
                {isRTL ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button type="submit">
                {isRTL ? 'حفظ الشيك' : 'Save Cheque'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Clear Cheque Dialog (Deposit into Financial Account) */}
      {clearingCheque && (
        <Dialog open={true} onOpenChange={() => setClearingCheque(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                {isRTL ? 'تأكيد تحصيل الشيك وإضافته للحساب البنكي' : 'Clear & Deposit Cheque'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg space-y-1">
                <div>{isRTL ? 'رقم الشيك: ' : 'Cheque #: '}<strong>{clearingCheque.chequeNumber}</strong></div>
                <div>{isRTL ? 'البنك: ' : 'Bank: '}<strong>{clearingCheque.bankName}</strong></div>
                <div>{isRTL ? 'المبلغ: ' : 'Amount: '}<strong className="text-emerald-600 font-mono text-sm">{formatEGP(clearingCheque.amount)}</strong></div>
              </div>

              <div>
                <label className="font-semibold block mb-1">
                  {isRTL ? 'اختر الحساب البنكي المودع به المبلغ *' : 'Select Bank Account *'}
                </label>
                <select
                  value={clearingAccountId}
                  onChange={(e) => setClearingAccountId(e.target.value)}
                  className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {isRTL ? a.nameAr : a.nameEn} ({formatEGP(a.currentBalance)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setClearingCheque(null)}>
                {isRTL ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button
                onClick={() => handleUpdateStatus(clearingCheque.id, 'CLEARED', clearingAccountId)}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isRTL ? 'تأكيد التحصيل والإيداع' : 'Confirm Clearance'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
