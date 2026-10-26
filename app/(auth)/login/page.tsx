'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Lock, Mail, ShieldAlert, Sparkles } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const loginSchema = z.object({
  email: z.string().email({ message: 'البريد الإلكتروني غير صحيح' }),
  password: z.string().min(6, { message: 'كلمة المرور يجب أن لا تقل عن 6 أحرف' }),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { locale, setLocale, t, isRTL } = useI18n();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'owner@erp.local',
      password: 'Password123!',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setErrorMessage(
          locale === 'ar'
            ? 'بيانات الدخول غير صحيحة، يرجى التأكد والمحاولة مرة أخرى'
            : 'Invalid credentials. Please verify and try again.'
        );
      } else {
        router.push('/');
        router.refresh();
      }
    } catch (err: any) {
      setErrorMessage(
        locale === 'ar'
          ? 'حدث خطأ في الاتصال بالخادم'
          : 'Server connection error.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const setDemoUser = (email: string) => {
    setValue('email', email);
    setValue('password', 'Password123!');
    setErrorMessage(null);
  };

  return (
    <Card className="w-full border-slate-200 shadow-xl dark:border-slate-800">
      <CardHeader className="space-y-2 text-center pb-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-2xl text-white shadow-lg shadow-blue-500/30">
          ⚙️
        </div>
        <CardTitle className="text-xl sm:text-2xl font-bold">
          {locale === 'ar' ? 'نظام إدارة المحامل وقطع الغيار' : 'EgyBearings ERP System'}
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          {locale === 'ar'
            ? 'سجّل دخولك للوصول إلى لوحة المبيعات والمخزون والاستيراد'
            : 'Sign in to access sales, inventory, and import operations'}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {errorMessage && (
          <div className="flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-xs sm:text-sm text-red-600 dark:text-red-400 border border-red-500/20">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs sm:text-sm font-medium">
              {locale === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
            </Label>
            <div className="relative">
              <Mail className="absolute top-2.5 h-4 w-4 text-muted-foreground rtl:right-3 ltr:left-3" />
              <Input
                id="email"
                type="email"
                placeholder="name@company.com"
                {...register('email')}
                className="rtl:pr-9 ltr:pl-9"
              />
            </div>
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-xs sm:text-sm font-medium">
                {locale === 'ar' ? 'كلمة المرور' : 'Password'}
              </Label>
            </div>
            <div className="relative">
              <Lock className="absolute top-2.5 h-4 w-4 text-muted-foreground rtl:right-3 ltr:left-3" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                {...register('password')}
                className="rtl:pr-9 rtl:pl-9 ltr:pl-9 ltr:pr-9"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-2.5 text-muted-foreground hover:text-foreground rtl:left-3 ltr:right-3"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 h-11"
            disabled={isLoading}
          >
            {isLoading
              ? locale === 'ar'
                ? 'جاري التحقق...'
                : 'Signing in...'
              : locale === 'ar'
              ? 'تسجيل الدخول'
              : 'Sign In'}
          </Button>
        </form>

        {/* Demo Roles Quick Pick */}
        <div className="pt-2 border-t border-dashed">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-amber-500" />
              {locale === 'ar' ? 'حسابات تجريبية سريعة:' : 'Quick Demo Accounts:'}
            </span>
            <Badge variant="outline" className="text-[10px]">
              {locale === 'ar' ? 'كلمة المرور: Password123!' : 'Pass: Password123!'}
            </Badge>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDemoUser('owner@erp.local')}
              className="text-[11px] h-7 px-1.5 justify-start truncate"
            >
              👑 {locale === 'ar' ? 'المالك (Owner)' : 'Owner'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDemoUser('manager@erp.local')}
              className="text-[11px] h-7 px-1.5 justify-start truncate"
            >
              💼 {locale === 'ar' ? 'المدير' : 'Manager'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDemoUser('accountant@erp.local')}
              className="text-[11px] h-7 px-1.5 justify-start truncate"
            >
              📊 {locale === 'ar' ? 'المحاسب' : 'Accountant'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDemoUser('salesrep@erp.local')}
              className="text-[11px] h-7 px-1.5 justify-start truncate"
            >
              🤝 {locale === 'ar' ? 'المندوب' : 'Sales Rep'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDemoUser('cashier@erp.local')}
              className="text-[11px] h-7 px-1.5 justify-start truncate"
            >
              🧾 {locale === 'ar' ? 'الكاشير' : 'Cashier'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDemoUser('warehouse@erp.local')}
              className="text-[11px] h-7 px-1.5 justify-start truncate"
            >
              📦 {locale === 'ar' ? 'أمين المخزن' : 'Warehouse'}
            </Button>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between border-t p-3 text-xs text-muted-foreground">
        <span>© 2026 EgyBearings Distribution</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocale(locale === 'ar' ? 'en' : 'ar')}
          className="h-7 text-xs"
        >
          {locale === 'ar' ? 'English' : 'عربي'}
        </Button>
      </CardFooter>
    </Card>
  );
}
