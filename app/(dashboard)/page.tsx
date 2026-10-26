'use client';

import React from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Users,
  AlertTriangle,
  CreditCard,
  ShoppingCart,
  FileSpreadsheet,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatEGP } from '@/lib/utils';

export default function DashboardPage() {
  const { locale, t, isRTL } = useI18n();

  const kpis = [
    {
      titleAr: 'إجمالي المبيعات (الشهر)',
      titleEn: 'Monthly Sales',
      value: '485,250 ج.م',
      change: '+14.2%',
      isPositive: true,
      subAr: 'مقارنة بالشهر السابق',
      subEn: 'vs. last month',
      icon: TrendingUp,
      color: 'text-blue-600 bg-blue-500/10 dark:text-blue-400',
    },
    {
      titleAr: 'إجمالي أرباح المبيعات',
      titleEn: 'Gross Profit',
      value: '112,400 ج.م',
      change: '+8.5%',
      isPositive: true,
      subAr: 'هامش ربح حقيقي: 23.1%',
      subEn: 'True margin: 23.1%',
      icon: DollarSign,
      color: 'text-emerald-600 bg-emerald-500/10 dark:text-emerald-400',
    },
    {
      titleAr: 'الذمم المدينة (العملاء)',
      titleEn: 'Customer Receivables',
      value: '294,800 ج.م',
      change: '18 عميل',
      isPositive: false,
      subAr: 'منها 42,000 ج.م متأخرة > 60 يوم',
      subEn: '42k EGP overdue > 60d',
      icon: Users,
      color: 'text-amber-600 bg-amber-500/10 dark:text-amber-400',
    },
    {
      titleAr: 'قيمة المخزون (بالتكلفة الفعلية)',
      titleEn: 'Inventory Value (Landed Cost)',
      value: '1,840,650 ج.م',
      change: '1,420 صنف',
      isPositive: true,
      subAr: 'بناء على المتوسط المرجح WAC',
      subEn: 'Based on true WAC',
      icon: Package,
      color: 'text-indigo-600 bg-indigo-500/10 dark:text-indigo-400',
    },
    {
      titleAr: 'شيكات مستحقة قادمة',
      titleEn: 'Cheques Due (Next 7 Days)',
      value: '78,500 ج.م',
      change: '5 شيكات',
      isPositive: false,
      subAr: '4 شيكات عملاء + 1 مورد',
      subEn: '4 customer + 1 supplier',
      icon: CreditCard,
      color: 'text-purple-600 bg-purple-500/10 dark:text-purple-400',
    },
    {
      titleAr: 'تنبيهات نواقص المخزون',
      titleEn: 'Low Stock Alerts',
      value: '14 صنف',
      change: 'عاجل',
      isPositive: false,
      subAr: 'أقل من الحد الأدنى للمخزون',
      subEn: 'Below minimum threshold',
      icon: AlertTriangle,
      color: 'text-rose-600 bg-rose-500/10 dark:text-rose-400',
    },
  ];

  const quickActions = [
    {
      href: '/sales/new',
      labelAr: 'فاتورة بيع سريعة (POS)',
      labelEn: 'Fast Invoice POS',
      icon: FileSpreadsheet,
      color: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
    {
      href: '/products/new',
      labelAr: 'إضافة محمل أو قطعة غيار',
      labelEn: 'Add Product / Part',
      icon: Package,
      color: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    },
    {
      href: '/purchases/new',
      labelAr: 'أمر استيراد وشحنة',
      labelEn: 'New Import PO',
      icon: ShoppingCart,
      color: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    },
    {
      href: '/cheques/new',
      labelAr: 'تسجيل شيك جديد',
      labelEn: 'Record Cheque',
      icon: CreditCard,
      color: 'bg-purple-600 hover:bg-purple-700 text-white',
    },
  ];

  const smartInsights = [
    {
      type: 'warning',
      textAr: 'محمل 6204-2RS وصل رصيده إلى 15 قطعة فقط، ومعدل السحب الأسبوعي 40 قطعة. يقترح إعادة الطلب فوراً.',
      textEn: 'Bearing 6204-2RS down to 15 pcs. Weekly burn rate is 40 pcs. Immediate reorder recommended.',
    },
    {
      type: 'alert',
      textAr: 'العميل "شركة الأهرام للهندسة" تجاوز الحد الائتماني بمقدار 28,000 ج.م وتأخر في السداد منذ 45 يوماً.',
      textEn: 'Customer "Al Ahram Engineering" exceeded credit limit by 28,000 EGP (overdue 45 days).',
    },
    {
      type: 'info',
      textAr: 'تم حساب تكلفة الاستيراد Landed Cost للشحنة CN-2025-08 بنجاح وتحديث أسعار التكلفة للـ 18 منتج المشمولين.',
      textEn: 'Landed cost calculated for shipment CN-2025-08; WAC updated for 18 imported items.',
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Welcome & Fast Actions Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {locale === 'ar' ? 'لوحة القيادة التشغيلية' : 'Executive Dashboard'}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {locale === 'ar'
              ? 'متابعة حية للمبيعات، النواقص، الشحنات المستوردة، والشيكات البنكية'
              : 'Live tracking of sales, low stock, import shipments, and bank cheques'}
          </p>
        </div>

        {/* Fast Action Buttons Grid */}
        <div className="flex flex-wrap items-center gap-2">
          {quickActions.map((action, i) => {
            const Icon = action.icon;
            return (
              <Button
                key={i}
                asChild
                className={`h-9 px-3 text-xs font-semibold shadow-sm ${action.color}`}
              >
                <Link href={action.href} className="flex items-center gap-1.5">
                  <Icon className="h-4 w-4" />
                  <span>{locale === 'ar' ? action.labelAr : action.labelEn}</span>
                </Link>
              </Button>
            );
          })}
        </div>
      </div>

      {/* KPI Cards Grid - Responsive 1 -> 2 -> 3 columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <Card key={index} className="relative overflow-hidden transition-all hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                  {locale === 'ar' ? kpi.titleAr : kpi.titleEn}
                </CardTitle>
                <div className={`p-2 rounded-lg ${kpi.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold tracking-tight">
                  {kpi.value}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    variant={kpi.isPositive ? 'success' : 'warning'}
                    className="text-[10px] px-1.5 py-0"
                  >
                    {kpi.change}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground">
                    {locale === 'ar' ? kpi.subAr : kpi.subEn}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Middle Section: Smart Insights Panel & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Smart Insights & Alerts */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500" />
                {locale === 'ar' ? 'التنبيهات الذكية والرؤى التشغيلية' : 'Smart Insights & Actions'}
              </CardTitle>
              <CardDescription className="text-xs">
                {locale === 'ar'
                  ? 'تحليلات ذكية مستخرجة آلياً من حركة المبيعات والمخزون'
                  : 'Automated intelligence from sales and inventory velocity'}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {smartInsights.map((insight, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 rounded-lg border p-3.5 transition-colors bg-muted/20 hover:bg-muted/40"
              >
                <div className="mt-0.5 shrink-0">
                  {insight.type === 'warning' && (
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                  )}
                  {insight.type === 'alert' && (
                    <Clock className="h-5 w-5 text-rose-500" />
                  )}
                  {insight.type === 'info' && (
                    <CheckCircle2 className="h-5 w-5 text-blue-500" />
                  )}
                </div>
                <div className="flex-1 text-xs sm:text-sm leading-relaxed">
                  {locale === 'ar' ? insight.textAr : insight.textEn}
                </div>
                <Button variant="ghost" size="sm" className="h-7 text-xs shrink-0">
                  {locale === 'ar' ? 'معالجة' : 'Resolve'}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Right Col: Quick Access Links */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">
              {locale === 'ar' ? 'الوصول السريع للأقسام' : 'Quick Navigation'}
            </CardTitle>
            <CardDescription className="text-xs">
              {locale === 'ar' ? 'شاشات العمل اليومية الأساسية' : 'Primary daily work screens'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              {
                href: '/sales/new',
                titleAr: 'شاشة الفاتورة السريعة (POS)',
                titleEn: 'Fast Invoice POS',
                descAr: 'باركود + أرقام مكافئة + تسعير فوري',
                descEn: 'Barcode + cross-refs + instant pricing',
              },
              {
                href: '/products',
                titleAr: 'دليل المحامل وقطع الغيار',
                titleEn: 'Products Catalog',
                descAr: 'بحث بالمقاس، الموديل، والمكافئ',
                descEn: 'Search by size, model, OEM',
              },
              {
                href: '/purchases',
                titleAr: 'أوامر الشراء وحساب التكلفة',
                titleEn: 'Import & Landed Cost',
                descAr: 'شحن + جمارك + متوسط مرجح WAC',
                descEn: 'Customs + freight + WAC',
              },
              {
                href: '/cheques',
                titleAr: 'سجل الشيكات والتنبيهات',
                titleEn: 'Cheques Register',
                descAr: 'تحصيل، إيداع، ومرتدات البنوك',
                descEn: 'Deposited, cleared, bounced alerts',
              },
              {
                href: '/customers',
                titleAr: 'حسابات العملاء وكشف الحساب',
                titleEn: 'Customers & CRM',
                descAr: 'حد ائتماني، أعمار ديون، رسائل واتساب',
                descEn: 'Credit limits, aging, WhatsApp link',
              },
            ].map((link, idx) => (
              <Link
                key={idx}
                href={link.href}
                className="group flex items-center justify-between rounded-lg border p-2.5 transition-all hover:bg-muted/50 hover:border-blue-500/50"
              >
                <div>
                  <div className="font-semibold text-xs sm:text-sm group-hover:text-blue-600 transition-colors">
                    {locale === 'ar' ? link.titleAr : link.titleEn}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {locale === 'ar' ? link.descAr : link.descEn}
                  </div>
                </div>
                {isRTL ? (
                  <ChevronLeft className="h-4 w-4 text-muted-foreground group-hover:text-blue-600 group-hover:-translate-x-1 transition-all" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                )}
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
