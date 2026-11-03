'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Plus,
  Search,
  Filter,
  Phone,
  MessageSquare,
  Clock,
  AlertTriangle,
  Building2,
  Calendar,
  Wallet,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  ExternalLink,
  MoreHorizontal,
  Eye,
  Edit,
  FileText,
  RefreshCw,
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
import { formatEGP, whatsappLink } from '@/lib/utils';

export default function CustomersPage() {
  const { locale, isRTL } = useI18n();

  const [customers, setCustomers] = useState<any[]>([]);
  const [kpis, setKpis] = useState<any>({
    totalCustomers: 0,
    totalReceivables: 0,
    exceededCreditLimitCount: 0,
    inactiveCustomersCount: 0,
    overdueCustomersCount: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedGov, setSelectedGov] = useState('ALL');
  const [inactiveOnly, setInactiveOnly] = useState(false);
  const [overdueOnly, setOverdueOnly] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, [selectedType, selectedGov, inactiveOnly, overdueOnly]);

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.set('q', searchQuery);
      if (selectedType !== 'ALL') params.set('type', selectedType);
      if (selectedGov !== 'ALL') params.set('governorate', selectedGov);
      if (inactiveOnly) params.set('inactive60', 'true');
      if (overdueOnly) params.set('overdue', 'true');

      const res = await fetch(`/api/customers?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setCustomers(json.data || []);
        setKpis(json.kpis || {});
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCustomers();
  };

  const governorates = [
    'القاهرة',
    'الجيزة',
    'الإسكندرية',
    'الدقهلية',
    'الشرقية',
    'الغربية',
    'القليوبية',
    'المنوفية',
    'البحيرة',
    'دمياط',
    'بورسعيد',
    'الإسماعيلية',
    'السويس',
    'بني سويف',
    'الفيوم',
    'المنيا',
    'أسيوط',
    'سوهاج',
    'قنا',
    'الأقصر',
    'أسوان',
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            {isRTL ? 'إدارة العملاء وCRM' : 'Customers & CRM'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isRTL
              ? 'متابعة التجار ومراكز الصيانة، حدود الائتمان، كشوف الحسابات، وتذكير الواتساب بنقرة واحدة'
              : 'Wholesalers, workshops, credit limits, account statements, and 1-click WhatsApp reminders'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Link href="/customers/aging">
            <Button variant="outline" className="gap-2 border-amber-300 dark:border-amber-900 text-amber-700 dark:text-amber-400">
              <Clock className="w-4 h-4" />
              {isRTL ? 'تقرير أعمار الديون' : 'Aging Report'}
            </Button>
          </Link>

          <Link href="/customers/new">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              {isRTL ? 'إضافة عميل جديد' : 'New Customer'}
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
                {isRTL ? 'إجمالي العملاء' : 'Total Customers'}
              </p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                {kpis.totalCustomers}
              </h3>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-950/60 rounded-xl text-blue-600">
              <Users className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                {isRTL ? 'إجمالي المديونيات المستحقة' : 'Total Receivables'}
              </p>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                {formatEGP(kpis.totalReceivables || 0)}
              </h3>
            </div>
            <div className="p-3 bg-indigo-100 dark:bg-indigo-950/60 rounded-xl text-indigo-600">
              <Wallet className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                {isRTL ? 'تجاوزوا حد الائتمان' : 'Exceeded Credit Limit'}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <h3 className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                  {kpis.exceededCreditLimitCount}
                </h3>
                {kpis.exceededCreditLimitCount > 0 && (
                  <Badge variant="outline" className="text-rose-600 border-rose-300">
                    {isRTL ? 'تحذير' : 'Alert'}
                  </Badge>
                )}
              </div>
            </div>
            <div className="p-3 bg-rose-100 dark:bg-rose-950/60 rounded-xl text-rose-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                {isRTL ? 'عملاء راكدون (60+ يوم)' : 'Inactive (60+ days)'}
              </p>
              <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                {kpis.inactiveCustomersCount}
              </h3>
            </div>
            <div className="p-3 bg-amber-100 dark:bg-amber-950/60 rounded-xl text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardContent className="p-4 flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={
                isRTL
                  ? 'بحث بالاسم، كود العميل، رقم الهاتف أو الواتساب، المنطقة...'
                  : 'Search by name, code, phone, WhatsApp...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-9"
            />
          </form>

          <div className="flex flex-wrap items-center gap-2">
            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="h-10 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="ALL">{isRTL ? 'جميع الأنشطة' : 'All Types'}</option>
              <option value="WHOLESALE">{isRTL ? 'تاجر جملة' : 'Wholesaler'}</option>
              <option value="WORKSHOP">{isRTL ? 'مركز صيانة / فني' : 'Workshop'}</option>
              <option value="RETAIL">{isRTL ? 'محل تجزئة' : 'Retail Shop'}</option>
              <option value="COMPANY">{isRTL ? 'شركة / مصنع' : 'Company'}</option>
            </select>

            {/* Governorate Filter */}
            <select
              value={selectedGov}
              onChange={(e) => setSelectedGov(e.target.value)}
              className="h-10 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="ALL">{isRTL ? 'جميع المحافظات' : 'All Governorates'}</option>
              {governorates.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>

            {/* Inactive toggle */}
            <Button
              variant={inactiveOnly ? 'default' : 'outline'}
              size="sm"
              onClick={() => setInactiveOnly(!inactiveOnly)}
              className="h-10 text-xs"
            >
              <Clock className="w-3.5 h-3.5 mr-1" />
              {isRTL ? 'راكدون (60+ يوم)' : 'Inactive (60d)'}
            </Button>

            {/* Overdue toggle */}
            <Button
              variant={overdueOnly ? 'default' : 'outline'}
              size="sm"
              onClick={() => setOverdueOnly(!overdueOnly)}
              className="h-10 text-xs"
            >
              <AlertTriangle className="w-3.5 h-3.5 mr-1" />
              {isRTL ? 'متأخرات فقط' : 'Overdue Only'}
            </Button>

            <Button variant="outline" size="icon" onClick={fetchCustomers} title={isRTL ? 'تحديث' : 'Refresh'}>
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
                <TableHead>{isRTL ? 'العميل والكود' : 'Customer & Code'}</TableHead>
                <TableHead>{isRTL ? 'النشاط / الفئة' : 'Type'}</TableHead>
                <TableHead>{isRTL ? 'المحافظة والمنطقة' : 'Location'}</TableHead>
                <TableHead>{isRTL ? 'التواصل والواتساب' : 'Contact & WhatsApp'}</TableHead>
                <TableHead className="text-center">{isRTL ? 'الرصيد / حد الائتمان' : 'Balance / Credit Limit'}</TableHead>
                <TableHead>{isRTL ? 'آخر شراء' : 'Last Purchase'}</TableHead>
                <TableHead>{isRTL ? 'مندوب المبيعات' : 'Sales Rep'}</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    {isLoading
                      ? isRTL ? 'جاري التحميل...' : 'Loading customers...'
                      : isRTL ? 'لا يوجد عملاء مطابقون للبحث' : 'No customers found'}
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((c) => {
                  const balance = c.currentBalanceEGP;
                  const limit = c.creditLimitEGP;
                  const pct = limit > 0 ? Math.min(100, Math.round((balance / limit) * 100)) : 0;
                  const waMsg = `السلام عليكم ورحمة الله، عميلنا العزيز ${c.nameAr}، نود إحاطتكم بأن رصيد حسابكم طرفنا هو ${formatEGP(balance)}. شكراً لتعاملكم معنا.`;
                  const waUrl = c.whatsappNumber ? whatsappLink(c.whatsappNumber, waMsg) : null;

                  return (
                    <TableRow key={c.id}>
                      <TableCell>
                        <div className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                          <Link href={`/customers/${c.id}`} className="hover:underline flex items-center gap-1.5">
                            {isRTL ? c.nameAr : c.nameEn}
                          </Link>
                        </div>
                        <div className="font-mono text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                          <span>{c.code}</span>
                          {c.segment === 'VIP' && (
                            <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-300">
                              VIP
                            </Badge>
                          )}
                          {c.isInactive && (
                            <Badge variant="outline" className="text-[10px] bg-slate-100 text-slate-600 border-slate-300">
                              {isRTL ? 'راكد' : 'Inactive'}
                            </Badge>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {c.customerType === 'WHOLESALE'
                            ? isRTL ? 'تاجر جملة' : 'Wholesale'
                            : c.customerType === 'WORKSHOP'
                            ? isRTL ? 'مركز صيانة' : 'Workshop'
                            : c.customerType === 'COMPANY'
                            ? isRTL ? 'شركة / مصنع' : 'Company'
                            : isRTL ? 'محل تجزئة' : 'Retail'}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-xs">
                        <div className="font-medium text-slate-800 dark:text-slate-200">{c.governorate || '-'}</div>
                        {c.area && <div className="text-muted-foreground">{c.area}</div>}
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs">{c.phone}</span>
                          {waUrl && (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-600 hover:text-emerald-700 p-1 rounded hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                              title={isRTL ? 'إرسال رسالة واتساب' : 'WhatsApp Chat'}
                            >
                              <MessageSquare className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="text-center">
                        <div className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                          {formatEGP(balance)}
                        </div>
                        {limit > 0 ? (
                          <div className="space-y-1 mt-1 max-w-[120px] mx-auto">
                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  c.isExceeded ? 'bg-rose-600' : pct > 75 ? 'bg-amber-500' : 'bg-primary'
                                }`}
                                style={{ width: `${Math.min(100, pct)}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                              <span>{pct}%</span>
                              <span>{formatEGP(limit)}</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-muted-foreground font-mono">{isRTL ? 'سداد نقدي' : 'Cash'}</span>
                        )}
                        {c.isExceeded && (
                          <div className="text-[10px] text-rose-600 font-semibold mt-0.5">
                            {isRTL ? 'تجاوز الحد!' : 'Exceeded limit!'}
                          </div>
                        )}
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {c.lastPurchaseDate
                          ? new Date(c.lastPurchaseDate).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US')
                          : isRTL ? 'لا توجد فواتير' : 'Never'}
                      </TableCell>

                      <TableCell className="text-xs text-slate-700 dark:text-slate-300">
                        {c.salesRep?.name || '-'}
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
                              <Link href={`/customers/${c.id}`} className="flex items-center gap-2 cursor-pointer">
                                <Eye className="h-4 w-4" />
                                {isRTL ? 'ملف العميل وكشف الحساب' : 'Profile & Statement'}
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/customers/${c.id}/edit`} className="flex items-center gap-2 cursor-pointer">
                                <Edit className="h-4 w-4" />
                                {isRTL ? 'تعديل البيانات' : 'Edit Customer'}
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <Link href={`/sales/new?customerId=${c.id}`} className="flex items-center gap-2 cursor-pointer text-primary">
                                <FileText className="h-4 w-4" />
                                {isRTL ? 'فاتورة مبيعات جديدة' : 'New Invoice'}
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:hidden">
        {customers.length === 0 ? (
          <Card className="p-6 text-center text-muted-foreground text-sm col-span-full">
            {isLoading
              ? isRTL ? 'جاري التحميل...' : 'Loading customers...'
              : isRTL ? 'لا يوجد عملاء مطابقون للبحث' : 'No customers found'}
          </Card>
        ) : (
          customers.map((c) => {
            const balance = c.currentBalanceEGP;
            const waMsg = `السلام عليكم ورحمة الله، عميلنا العزيز ${c.nameAr}، نود إحاطتكم بأن رصيد حسابكم طرفنا هو ${formatEGP(balance)}. شكراً لتعاملكم معنا.`;
            const waUrl = c.whatsappNumber ? whatsappLink(c.whatsappNumber, waMsg) : null;

            return (
              <Card key={c.id} className="border-slate-200 dark:border-slate-800 p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <Link href={`/customers/${c.id}`} className="hover:underline">
                        {isRTL ? c.nameAr : c.nameEn}
                      </Link>
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                      <span className="font-mono">{c.code}</span>
                      <span>{c.governorate}</span>
                    </div>
                  </div>

                  <Badge variant="outline" className="text-xs">
                    {c.customerType === 'WHOLESALE'
                      ? isRTL ? 'جملة' : 'Wholesale'
                      : c.customerType === 'WORKSHOP'
                      ? isRTL ? 'مركز صيانة' : 'Workshop'
                      : isRTL ? 'تجزئة' : 'Retail'}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs py-2 bg-slate-50 dark:bg-slate-900/60 p-2 rounded">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">{isRTL ? 'الرصيد الحالي' : 'Balance'}</span>
                    <span className="font-bold font-mono text-sm">{formatEGP(balance)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">{isRTL ? 'حد الائتمان' : 'Credit Limit'}</span>
                    <span className="font-mono">{c.creditLimitEGP ? formatEGP(c.creditLimitEGP) : (isRTL ? 'نقدي' : 'Cash')}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <a href={`tel:${c.phone}`} className="flex items-center gap-1 text-slate-700 dark:text-slate-300 hover:text-primary">
                      <Phone className="w-3.5 h-3.5 text-primary" />
                      <span className="font-mono">{c.phone}</span>
                    </a>
                    {waUrl && (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-600 hover:text-emerald-700 p-1"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </a>
                    )}
                  </div>

                  <Link href={`/customers/${c.id}`}>
                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                      {isRTL ? 'كشف الحساب' : 'Statement'}
                      {isRTL ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
