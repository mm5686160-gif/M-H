'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Locale, Translations, getTranslations } from './index';

interface I18nContextType {
  locale: Locale;
  t: Translations;
  setLocale: (locale: Locale) => void;
  isRTL: boolean;
  dir: 'rtl' | 'ltr';
  formatCurrency: (amount: number | string, currency?: string) => string;
  formatDate: (date: Date | string) => string;
  formatNumber: (num: number | string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({
  children,
  defaultLocale = 'ar',
}: {
  children: React.ReactNode;
  defaultLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);

  useEffect(() => {
    const saved = localStorage.getItem('erp-locale') as Locale | null;
    if (saved && (saved === 'ar' || saved === 'en')) {
      setLocaleState(saved);
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('erp-locale', newLocale);
    document.documentElement.setAttribute('dir', newLocale === 'ar' ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', newLocale);
  };

  useEffect(() => {
    document.documentElement.setAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', locale);
  }, [locale]);

  const t = getTranslations(locale);
  const isRTL = locale === 'ar';
  const dir = isRTL ? 'rtl' : 'ltr';

  const formatCurrency = (amount: number | string, currency = 'EGP') => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return '0.00';
    try {
      return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(num);
    } catch {
      return `${currency} ${num.toFixed(2)}`;
    }
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d);
  };

  const formatNumber = (num: number | string) => {
    const n = typeof num === 'string' ? parseFloat(num) : num;
    if (isNaN(n)) return '0';
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-US').format(n);
  };

  return (
    <I18nContext.Provider
      value={{ locale, t, setLocale, isRTL, dir, formatCurrency, formatDate, formatNumber }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used within I18nProvider');
  return context;
}
