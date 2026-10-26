'use client';

import React from 'react';
import { Menu, Search, Bell, Sun, Moon, Globe, User } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { useTheme } from 'next-themes';
import { useSidebar } from './sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { signOut } from 'next-auth/react';

export function Topbar({ user }: { user?: any }) {
  const { locale, setLocale, isRTL, t } = useI18n();
  const { theme, setTheme } = useTheme();
  const { setIsMobileOpen } = useSidebar();

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Left side: Hamburger (Mobile) + Search (Desktop) */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileOpen(true)}
          className="md:hidden"
          title="القائمة"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Global Search Bar */}
        <div className="relative w-full hidden sm:block">
          <Search className="absolute top-2.5 h-4 w-4 text-muted-foreground rtl:right-3 ltr:left-3" />
          <Input
            placeholder={
              locale === 'ar'
                ? 'بحث سريع (رقم المحمل، كود الصنف، العميل، الفاتورة)...'
                : 'Quick search (bearing #, SKU, customer, invoice)...'
            }
            className="w-full bg-muted/40 rtl:pr-9 ltr:pl-9 text-xs sm:text-sm h-9 rounded-lg"
          />
        </div>
      </div>

      {/* Right side: Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Language switch */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocale(locale === 'ar' ? 'en' : 'ar')}
          className="h-8 px-2 text-xs font-semibold"
          title="Language / اللغة"
        >
          <Globe className="h-3.5 w-3.5 ltr:mr-1 rtl:ml-1" />
          <span>{locale === 'ar' ? 'EN' : 'عربي'}</span>
        </Button>

        {/* Dark / Light mode */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          title="المظهر"
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4 text-amber-400" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>

        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8 text-muted-foreground hover:text-foreground"
          title="التنبيهات"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1 rtl:left-1 ltr:right-1 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
        </Button>

        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 h-9 px-2 hover:bg-muted"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground text-xs">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : 'U'}
              </div>
              <div className="hidden text-start lg:block">
                <p className="text-xs font-medium leading-none">{user?.name || 'مستخدم'}</p>
                <p className="text-[10px] text-muted-foreground leading-none mt-1">
                  {user?.role || 'SALES_REP'}
                </p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name || 'مستخدم'}</p>
                <p className="text-xs text-muted-foreground leading-none">
                  {user?.email || 'user@erp.local'}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href="/settings" className="cursor-pointer">
                {locale === 'ar' ? 'الإعدادات الشخصية' : 'Profile Settings'}
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="text-destructive cursor-pointer"
            >
              {locale === 'ar' ? 'تسجيل الخروج' : 'Sign Out'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
