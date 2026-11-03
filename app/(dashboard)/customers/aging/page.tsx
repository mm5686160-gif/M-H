'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Search,
  Filter,
  Phone,
  Building2,
  Calendar,
  AlertTriangle,
  RefreshCw,
  Wallet,
  Users,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatEGP } from '@/lib/utils';

export default function AgingReportPage() {
  const { locale, isRTL } = useI18n();

  const [agingData, setAgingData] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({
    totalReceivables: 0,
    bucket0_30: 0,
    bucket31_60: 0,
    bucket61_90: 0,
    bucket90Plus: 0,
    debtorCount: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [selectedGov, setSelectedGov] = useState('ALL');
  const [selectedMinDays, setSelectedMinDays] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchAging();
  }, [selectedGov, selectedMinDays]);

  const fetchAging = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (selectedGov !== 'ALL') params.set('governorate', selectedGov);
      if (selectedMinDays !== 'ALL') params.set('minDays', selectedMinDays);

      const res = await fetch(`/api/customers/aging?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setAgingData(json.data || []);
        setSummary(json.summary || {});
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCustomers = agingData.filter((c) => {
    return (
      !searchQuery ||
      c.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.nameAr?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.nameEn?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone?.includes(searchQuery)
    );
  });

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
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link href="/customers" className="hover:underline flex items-center gap-1">
              {isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              {isRTL ? 'العودة للعملاء' : 'Back to Customers'}
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Clock className="w-6 h-6 text-amber-600" />
            {isRTL ? 'تقرير أعمار الديون والتحصيل' : 'Accounts Receivable Aging Report'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isRTL
              ? 'متابعة الديون المستحقة مقسمة حسب فترات التأخير (30، 60، 90 يوماً) وتذكير العملاء عبر الواتساب بنقرة واحدة'
              : 'Aging matrix (0-30, 31-60, 61-90, 90+ days) with 1-click WhatsApp payment reminders'}
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={fetchAging} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          {isRTL ? 'تحديث التقرير' : 'Refresh'}
        </Button>
      </div>

      {/* Aging KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Card className="border-slate-200 dark:border-slate-800 col-span-2 lg:col-span-1">
          <CardContent className="p-3 text-center">
            <span className="text-xs text-muted-foreground block">{isRTL ? 'إجمالي المديونيات' : 'Total Receivables'}</span>
            <span className="font-mono font-bold text-lg text-slate-900 dark:text-slate-100 mt-1 block">
              {formatEGP(summary.totalReceivables || 0)}
            </span>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-3 text-center">
            <span className="text-xs text-muted-foreground block">{isRTL ? '0-30 يوماً (جارية)' : '0-30 Days'}</span>
            <span className="font-mono font-bold text-base text-slate-800 dark:text-slate-200 mt-1 block">
              {formatEGP(summary.bucket0_30 || 0)}
            </span>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-3 text-center">
            <span className="text-xs text-amber-600 font-medium block">{isRTL ? '31-60 يوماً' : '31-60 Days'}</span>
            <span className="font-mono font-bold text-base text-amber-600 mt-1 block">
              {formatEGP(summary.bucket31_60 || 0)}
            </span>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-3 text-center">
            <span className="text-xs text-orange-600 font-medium block">{isRTL ? '61-90 يوماً' : '61-90 Days'}</span>
            <span className="font-mono font-bold text-base text-orange-600 mt-1 block">
              {formatEGP(summary.bucket61_90 || 0)}
            </span>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 bg-rose-50/20">
          <CardContent className="p-3 text-center">
            <span className="text-xs text-rose-600 font-semibold block">{isRTL ? '90+ يوماً (حرجة)' : '90+ Days'}</span>
            <span className="font-mono font-bold text-base text-rose-600 mt-1 block">
              {formatEGP(summary.bucket90Plus || 0)}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Filters Bar */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardContent className="p-4 flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={isRTL ? 'بحث بالاسم، الكود، الهاتف...' : 'Search by customer, phone...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter by Aging threshold */}
            <select
              value={selectedMinDays}
              onChange={(e) => setSelectedMinDays(e.target.value)}
              className="h-10 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="ALL">{isRTL ? 'جميع الآجال' : 'All Durations'}</option>
              <option value="60">{isRTL ? 'متأخرة أكثر من 60 يوماً' : 'Overdue > 60 Days'}</option>
              <option value="90">{isRTL ? 'متأخرة أكثر من 90 يوماً' : 'Overdue > 90 Days'}</option>
            </select>

            {/* Governorate Filter */}
            <select
              value={selectedGov}
              onChange={(e) => setSelectedGov(e.target.value)}
              className="h-10 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="ALL">{isRTL ? 'جميع المحافظات' : 'All Governorates'}</option>
              {governorates.map((gov) => (
                <option key={gov} value={gov}>
                  {gov}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Desktop Table View */}
      <div className="hidden lg:block">
        <Card className="border-slate-200 dark:border-slate-800 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-900/50">
                <TableHead>{isRTL ? 'العميل' : 'Customer'}</TableHead>
                <TableHead>{isRTL ? 'المحافظة والهاتف' : 'Contact'}</TableHead>
                <TableHead className="text-right font-bold">{isRTL ? 'إجمالي المديونية' : 'Total Debt'}</TableHead>
                <TableHead className="text-right">{isRTL ? '0-30 يوم' : '0-30 Days'}</TableHead>
                <TableHead className="text-right text-amber-600">{isRTL ? '31-60 يوم' : '31-60 Days'}</TableHead>
                <TableHead className="text-right text-orange-600">{isRTL ? '61-90 يوم' : '61-90 Days'}</TableHead>
                <TableHead className="text-right text-rose-600 font-bold">{isRTL ? '90+ يوم' : '90+ Days'}</TableHead>
                <TableHead className="text-left">{isRTL ? 'تذكير واتساب' : 'Reminder'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    {isLoading
                      ? isRTL ? 'جاري التحميل...' : 'Loading aging report...'
                      : isRTL ? 'لا توجد مديونيات متأخرة مطابقة' : 'No overdue accounts found'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                        <Link href={`/customers/${c.id}`} className="hover:underline">
                          {isRTL ? c.nameAr : c.nameEn}
                        </Link>
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {c.code}
                      </div>
                    </TableCell>

                    <TableCell className="text-xs">
                      <div>{c.governorate}</div>
                      <div className="font-mono text-muted-foreground">{c.phone}</div>
                    </TableCell>

                    <TableCell className="text-right font-mono font-bold text-sm text-slate-900 dark:text-slate-100">
                      {formatEGP(c.currentBalanceEGP)}
                    </TableCell>

                    <TableCell className="text-right font-mono text-xs text-slate-700 dark:text-slate-300">
                      {c.buckets['0-30'] > 0 ? formatEGP(c.buckets['0-30']) : '-'}
                    </TableCell>

                    <TableCell className="text-right font-mono text-xs font-semibold text-amber-600">
                      {c.buckets['31-60'] > 0 ? formatEGP(c.buckets['31-60']) : '-'}
                    </TableCell>

                    <TableCell className="text-right font-mono text-xs font-semibold text-orange-600">
                      {c.buckets['61-90'] > 0 ? formatEGP(c.buckets['61-90']) : '-'}
                    </TableCell>

                    <TableCell className="text-right font-mono text-xs font-bold text-rose-600">
                      {c.buckets['90+'] > 0 ? formatEGP(c.buckets['90+']) : '-'}
                    </TableCell>

                    <TableCell className="text-left">
                      {c.whatsappUrl ? (
                        <a href={c.whatsappUrl} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="outline" className="h-8 gap-1 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50">
                            <MessageSquare className="w-3.5 h-3.5" />
                            {isRTL ? 'مطالبة واتساب' : 'WhatsApp'}
                          </Button>
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Mobile Card View */}
      <div className="grid grid-cols-1 gap-3 lg:hidden">
        {filteredCustomers.length === 0 ? (
          <Card className="p-6 text-center text-muted-foreground text-sm">
            {isLoading
              ? isRTL ? 'جاري التحميل...' : 'Loading...'
              : isRTL ? 'لا توجد مديونيات متأخرة مطابقة' : 'No overdue accounts found'}
          </Card>
        ) : (
          filteredCustomers.map((c) => (
            <Card key={c.id} className="border-slate-200 dark:border-slate-800 p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                    <Link href={`/customers/${c.id}`} className="hover:underline">
                      {isRTL ? c.nameAr : c.nameEn}
                    </Link>
                  </h3>
                  <div className="text-xs text-muted-foreground font-mono">
                    {c.code} • {c.governorate}
                  </div>
                </div>

                <div className="text-right font-mono font-bold text-sm text-slate-900 dark:text-slate-100">
                  {formatEGP(c.currentBalanceEGP)}
                </div>
              </div>

              <div className="grid grid-cols-4 gap-1 text-center text-xs py-2 bg-slate-50 dark:bg-slate-900/60 p-2 rounded">
                <div>
                  <span className="text-muted-foreground block text-[10px]">0-30</span>
                  <span className="font-mono text-[11px]">{c.buckets['0-30'] > 0 ? formatEGP(c.buckets['0-30']) : '-'}</span>
                </div>
                <div>
                  <span className="text-amber-600 block text-[10px]">31-60</span>
                  <span className="font-mono text-[11px] text-amber-600">{c.buckets['31-60'] > 0 ? formatEGP(c.buckets['31-60']) : '-'}</span>
                </div>
                <div>
                  <span className="text-orange-600 block text-[10px]">61-90</span>
                  <span className="font-mono text-[11px] text-orange-600">{c.buckets['61-90'] > 0 ? formatEGP(c.buckets['61-90']) : '-'}</span>
                </div>
                <div>
                  <span className="text-rose-600 block text-[10px]">90+</span>
                  <span className="font-mono text-[11px] font-bold text-rose-600">{c.buckets['90+'] > 0 ? formatEGP(c.buckets['90+']) : '-'}</span>
                </div>
              </div>

              {c.whatsappUrl && (
                <div className="pt-1">
                  <a href={c.whatsappUrl} target="_blank" rel="noopener noreferrer" className="w-full block">
                    <Button size="sm" variant="outline" className="w-full gap-2 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50">
                      <MessageSquare className="w-3.5 h-3.5" />
                      {isRTL ? 'إرسال مطالبة بالواتساب بنقرة واحدة' : 'Send WhatsApp Reminder'}
                    </Button>
                  </a>
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
