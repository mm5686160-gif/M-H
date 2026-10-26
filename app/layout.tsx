import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/layout/theme-provider';
import { I18nProvider } from '@/lib/i18n/context';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: 'نظام إدارة استيراد وتوزيع المحامل وقطع الغيار | EgyBearings ERP',
  description: 'نظام ERP متكامل لإدارة المحامل، قطع الغيار، فواتير المبيعات، الشيكات، وحساب تكلفة الاستيراد Landed Cost',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <I18nProvider defaultLocale="ar">
            {children}
            <Toaster />
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
