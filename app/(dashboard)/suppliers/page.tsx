'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Truck,
  Plus,
  Search,
  Globe,
  Phone,
  Mail,
  MoreHorizontal,
  Eye,
  Edit,
  DollarSign,
  ShoppingCart,
  Building,
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
import { formatEGP } from '@/lib/utils';

export default function SuppliersPage() {
  const { locale, isRTL } = useI18n();

  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setIsLoading(true);
      const url = searchQuery
        ? `/api/suppliers?q=${encodeURIComponent(searchQuery)}`
        : '/api/suppliers';
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setSuppliers(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSuppliers();
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {locale === 'ar' ? 'سجل الموردين وشركات الاستيراد' : 'Suppliers & Vendors'}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {locale === 'ar'
              ? 'إدارة حسابات المصانع العالمية، الشركات الموردة، وشروط السداد بالعملات الأجنبية'
              : 'Manage international manufacturers, vendor profiles, and foreign payment terms'}
          </p>
        </div>

        <Button asChild className="h-9 bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
          <Link href="/suppliers/new" className="flex items-center gap-1.5 text-xs font-semibold">
            <Plus className="h-4 w-4" />
            <span>{locale === 'ar' ? 'إضافة مورد جديد' : 'New Supplier'}</span>
          </Link>
        </Button>
      </div>

      {/* Search Bar */}
      <Card className="border shadow-sm">
        <CardContent className="p-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute top-2.5 h-4 w-4 text-muted-foreground rtl:right-3 ltr:left-3" />
              <Input
                placeholder={
                  locale === 'ar'
                    ? 'ابحث باسم المورد، الكود، الدولة، أو اسم الشخص المسؤول...'
                    : 'Search by supplier name, code, country, or contact...'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rtl:pr-9 ltr:pl-9 h-10 text-xs sm:text-sm"
              />
            </div>
            <Button type="submit" className="h-10 px-5 shrink-0">
              <Search className="h-4 w-4 rtl:ml-1.5 ltr:mr-1.5" />
              {locale === 'ar' ? 'بحث' : 'Search'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Table & Cards */}
      <Card className="border shadow-sm overflow-hidden">
        {/* Desktop View */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-28">{locale === 'ar' ? 'كود المورد' : 'Code'}</TableHead>
                <TableHead>{locale === 'ar' ? 'اسم المورد / الشركة' : 'Supplier Name'}</TableHead>
                <TableHead className="w-36">{locale === 'ar' ? 'الدولة والعملة' : 'Country & Currency'}</TableHead>
                <TableHead>{locale === 'ar' ? 'المسؤول والاتصال' : 'Contact Person'}</TableHead>
                <TableHead className="w-32 text-center">{locale === 'ar' ? 'شروط السداد' : 'Terms'}</TableHead>
                <TableHead className="w-36">{locale === 'ar' ? 'الرصيد المستحق' : 'Balance Owed'}</TableHead>
                <TableHead className="w-20 text-center">{locale === 'ar' ? 'الإجراءات' : 'Actions'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    {locale === 'ar' ? 'جاري تحميل الموردين...' : 'Loading suppliers...'}
                  </TableCell>
                </TableRow>
              ) : suppliers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    {locale === 'ar' ? 'لا يوجد موردين مسجلين' : 'No suppliers found'}
                  </TableCell>
                </TableRow>
              ) : (
                suppliers.map((s) => (
                  <TableRow key={s.id} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-mono text-xs font-bold text-blue-600">
                      <Link href={`/suppliers/${s.id}`}>{s.code}</Link>
                    </TableCell>

                    <TableCell>
                      <div className="font-bold text-xs sm:text-sm">
                        {locale === 'ar' ? s.nameAr : s.nameEn}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {locale === 'ar' ? s.nameEn : s.nameAr}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="text-xs">
                          🌍 {s.country}
                        </Badge>
                        <Badge variant="secondary" className="font-mono text-[10px]">
                          {s.defaultCurrency}
                        </Badge>
                      </div>
                    </TableCell>

                    <TableCell className="text-xs space-y-0.5">
                      {s.contactName && <div className="font-medium">{s.contactName}</div>}
                      <div className="flex items-center gap-3 text-muted-foreground text-[11px]">
                        {s.phone && (
                          <span className="flex items-center gap-1 font-mono">
                            <Phone className="h-3 w-3" />
                            {s.phone}
                          </span>
                        )}
                        {s.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {s.email}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="text-center font-mono text-xs">
                      {s.paymentTermsDays} {locale === 'ar' ? 'يوم' : 'days'}
                    </TableCell>

                    <TableCell>
                      <span className="font-mono font-bold text-xs text-rose-600 dark:text-rose-400">
                        {formatEGP(s.currentBalance)}
                      </span>
                    </TableCell>

                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/suppliers/${s.id}`} className="cursor-pointer">
                              <Eye className="h-4 w-4 rtl:ml-2 ltr:mr-2" />
                              {locale === 'ar' ? 'عرض الملف وكشف الحساب' : 'View Profile'}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/purchases/new?supplierId=${s.id}`} className="cursor-pointer">
                              <ShoppingCart className="h-4 w-4 rtl:ml-2 ltr:mr-2" />
                              {locale === 'ar' ? 'إنشاء أمر شراء' : 'New Purchase Order'}
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile View */}
        <div className="divide-y md:hidden">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              {locale === 'ar' ? 'جاري التحميل...' : 'Loading...'}
            </div>
          ) : suppliers.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              {locale === 'ar' ? 'لا يوجد موردين' : 'No suppliers found'}
            </div>
          ) : (
            suppliers.map((s) => (
              <div key={s.id} className="p-4 space-y-2 hover:bg-muted/30">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono font-bold text-xs text-blue-600">{s.code}</span>
                    <h3 className="font-bold text-sm">{locale === 'ar' ? s.nameAr : s.nameEn}</h3>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {s.country} ({s.defaultCurrency})
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t">
                  <span className="text-muted-foreground">
                    {locale === 'ar' ? 'الرصيد المستحق: ' : 'Balance Owed: '}
                    <strong className="font-mono text-rose-600">{formatEGP(s.currentBalance)}</strong>
                  </span>
                  <Button variant="ghost" size="sm" asChild className="h-7 text-xs">
                    <Link href={`/suppliers/${s.id}`}>{locale === 'ar' ? 'عرض' : 'View'}</Link>
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
