'use client';

import React, { createContext, useContext, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Layers,
  Tag,
  Truck,
  ShoppingCart,
  Warehouse,
  AlertTriangle,
  Users,
  FileText,
  FileCheck,
  RotateCcw,
  CreditCard,
  Receipt,
  Wallet,
  BarChart3,
  PieChart,
  Settings,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  LogOut,
  Moon,
  Sun,
  Globe,
  ArrowRightLeft,
  Sliders,
  Clock,
  DollarSign,
  History,
  Shield,
  FileSpreadsheet,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { signOut } from 'next-auth/react';

interface SidebarContextType {
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType>({
  isMobileOpen: false,
  setIsMobileOpen: () => {},
  isCollapsed: false,
  setIsCollapsed: () => {},
});

export const useSidebar = () => useContext(SidebarContext);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <SidebarContext.Provider
      value={{ isMobileOpen, setIsMobileOpen, isCollapsed, setIsCollapsed }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

interface NavItem {
  href: string;
  labelAr: string;
  labelEn: string;
  icon: React.ElementType;
  badge?: string;
}

interface NavGroup {
  titleAr: string;
  titleEn: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    titleAr: 'الرئيسية',
    titleEn: 'Overview',
    items: [
      {
        href: '/',
        labelAr: 'لوحة التحكم',
        labelEn: 'Dashboard',
        icon: LayoutDashboard,
      },
    ],
  },
  {
    titleAr: 'الكتالوج والمنتجات',
    titleEn: 'Products & Catalog',
    items: [
      {
        href: '/products',
        labelAr: 'جميع المنتجات',
        labelEn: 'All Products',
        icon: Package,
      },
      {
        href: '/products/categories',
        labelAr: 'الفئات والأقسام',
        labelEn: 'Categories',
        icon: Layers,
      },
      {
        href: '/products/price-lists',
        labelAr: 'قوائم الأسعار',
        labelEn: 'Price Lists',
        icon: Tag,
      },
    ],
  },
  {
    titleAr: 'المشتريات والاستيراد',
    titleEn: 'Purchases & Import',
    items: [
      {
        href: '/suppliers',
        labelAr: 'الموردون',
        labelEn: 'Suppliers',
        icon: Truck,
      },
      {
        href: '/purchases',
        labelAr: 'أوامر الشراء والشحنات',
        labelEn: 'Purchase Orders',
        icon: ShoppingCart,
      },
      {
        href: '/purchases/payments',
        labelAr: 'سداد الموردين وفروق العملة',
        labelEn: 'Supplier Payments & FX',
        icon: DollarSign,
      },
    ],
  },
  {
    titleAr: 'المخزون والمستودعات',
    titleEn: 'Inventory',
    items: [
      {
        href: '/inventory',
        labelAr: 'أرصدة المخزون',
        labelEn: 'Stock Overview',
        icon: Warehouse,
      },
      {
        href: '/inventory/transfers',
        labelAr: 'التحويلات بين الفروع',
        labelEn: 'Stock Transfers',
        icon: ArrowRightLeft,
      },
      {
        href: '/inventory/adjustments',
        labelAr: 'تسويات الجرد والتالف',
        labelEn: 'Adjustments & Scrap',
        icon: Sliders,
      },
      {
        href: '/inventory/movements',
        labelAr: 'كارت حركة الصنف',
        labelEn: 'Stock Ledger',
        icon: History,
      },
      {
        href: '/inventory/alerts',
        labelAr: 'نواقص وإعادة طلب',
        labelEn: 'Reorder Alerts',
        icon: AlertTriangle,
        badge: 'تنبيه',
      },
    ],
  },
  {
    titleAr: 'العملاء والمبيعات',
    titleEn: 'Sales & Customers',
    items: [
      {
        href: '/customers',
        labelAr: 'العملاء وCRM',
        labelEn: 'Customers',
        icon: Users,
      },
      {
        href: '/customers/aging',
        labelAr: 'أعمار الديون والتحصيل',
        labelEn: 'Aging Report',
        icon: Clock,
      },
      {
        href: '/sales/new',
        labelAr: 'شاشة الفاتورة السريعة',
        labelEn: 'Fast Invoice POS',
        icon: FileSpreadsheet,
        badge: 'POS',
      },
      {
        href: '/sales',
        labelAr: 'الفواتير وعروض الأسعار',
        labelEn: 'Invoices & Quotes',
        icon: FileText,
      },
      {
        href: '/cheques',
        labelAr: 'إدارة الشيكات',
        labelEn: 'Cheques Register',
        icon: CreditCard,
      },
    ],
  },
  {
    titleAr: 'المالية والحسابات',
    titleEn: 'Finance & Accounts',
    items: [
      {
        href: '/expenses',
        labelAr: 'المصروفات',
        labelEn: 'Expenses',
        icon: Receipt,
      },
      {
        href: '/accounts',
        labelAr: 'الخزينة والحسابات',
        labelEn: 'Accounts & Cash',
        icon: Wallet,
      },
    ],
  },
  {
    titleAr: 'التقارير والإعدادات',
    titleEn: 'Reports & Settings',
    items: [
      {
        href: '/analytics',
        labelAr: 'التحليلات الذكية',
        labelEn: 'Analytics',
        icon: BarChart3,
      },
      {
        href: '/reports',
        labelAr: 'التقارير وتصدير Excel',
        labelEn: 'Reports',
        icon: PieChart,
      },
      {
        href: '/settings',
        labelAr: 'الإعدادات والصلاحيات',
        labelEn: 'Settings',
        icon: Settings,
      },
    ],
  },
];

export function Sidebar({ user }: { user?: any }) {
  const pathname = usePathname();
  const { locale, isRTL, setLocale, t } = useI18n();
  const { theme, setTheme } = useTheme();
  const { isMobileOpen, setIsMobileOpen, isCollapsed, setIsCollapsed } =
    useSidebar();

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  const sidebarContent = (
    <div className="flex h-full flex-col bg-slate-900 text-slate-200">
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between border-b border-slate-800 px-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-bold text-white shadow-lg shadow-blue-500/30">
            ⚙️
          </div>
          {!isCollapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="truncate font-bold text-white text-base">
                {locale === 'ar' ? 'إيجي بيلينج للحلول' : 'EgyBearings ERP'}
              </span>
              <span className="truncate text-xs text-slate-400">
                {locale === 'ar' ? 'المحامل وقطع الغيار' : 'Bearings & Spare Parts'}
              </span>
            </div>
          )}
        </Link>
        <button
          onClick={() => setIsMobileOpen(false)}
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 md:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-1">
            {!isCollapsed && (
              <h4 className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {locale === 'ar' ? group.titleAr : group.titleEn}
              </h4>
            )}
            <div className="space-y-1 mt-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href === '/'
                    ? pathname === '/'
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white',
                      isCollapsed && 'justify-center px-2'
                    )}
                    title={locale === 'ar' ? item.labelAr : item.labelEn}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {!isCollapsed && (
                      <span className="flex-1 truncate">
                        {locale === 'ar' ? item.labelAr : item.labelEn}
                      </span>
                    )}
                    {!isCollapsed && item.badge && (
                      <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-blue-300">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* User & Utilities Footer */}
      <div className="border-t border-slate-800 p-3 space-y-2">
        {/* Quick Toggles */}
        <div
          className={cn(
            'flex items-center justify-between gap-1 px-1',
            isCollapsed && 'flex-col'
          )}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocale(locale === 'ar' ? 'en' : 'ar')}
            className="h-8 text-xs text-slate-300 hover:bg-slate-800 hover:text-white"
            title="تبديل اللغة / Switch Language"
          >
            <Globe className="h-3.5 w-3.5 ltr:mr-1.5 rtl:ml-1.5" />
            {!isCollapsed && (locale === 'ar' ? 'English' : 'عربي')}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="h-8 w-8 p-0 text-slate-300 hover:bg-slate-800 hover:text-white"
            title="تبديل المظهر"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-blue-300" />
            )}
          </Button>
        </div>

        {/* User Info & Logout */}
        <div className="flex items-center justify-between rounded-lg bg-slate-800/60 p-2">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-white text-xs">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'U'}
            </div>
            {!isCollapsed && (
              <div className="flex flex-col overflow-hidden">
                <span className="truncate text-xs font-semibold text-white">
                  {user?.name || 'المستخدم'}
                </span>
                <span className="truncate text-[10px] text-slate-400">
                  {user?.role || 'SALES_REP'}
                </span>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="h-7 w-7 text-slate-400 hover:bg-red-500/20 hover:text-red-400"
            title="تسجيل الخروج"
          >
            <LogOut className="h-3.5 w-3.5 rtl:rotate-180" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden md:flex flex-col border-r border-slate-800 transition-all duration-200 z-30',
          isCollapsed ? 'w-16' : 'w-64'
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (with backdrop) */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsMobileOpen(false)}
          />
          <div
            className={cn(
              'fixed inset-y-0 w-72 max-w-[80vw] shadow-2xl transition-transform duration-200',
              isRTL ? 'right-0' : 'left-0'
            )}
          >
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
