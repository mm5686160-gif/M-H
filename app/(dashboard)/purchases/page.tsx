'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShoppingCart,
  Plus,
  Search,
  Truck,
  Ship,
  Anchor,
  ShieldCheck,
  CheckCircle2,
  Clock,
  MoreHorizontal,
  Eye,
  Calculator,
  Download,
  AlertTriangle,
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
import { formatEGP, formatCurrency } from '@/lib/utils';

export default function PurchasesPage() {
  const { locale, isRTL } = useI18n();

  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  useEffect(() => {
    fetchOrders();
  }, [selectedStatus]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.set('q', searchQuery);
      if (selectedStatus !== 'ALL') params.set('status', selectedStatus);

      const res = await fetch(`/api/purchases?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setOrders(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ORDERED':
        return (
          <Badge variant="outline" className="text-amber-600 border-amber-500/30 bg-amber-500/10 text-[10px]">
            <Clock className="h-3 w-3 rtl:ml-1 ltr:mr-1" />
            {locale === 'ar' ? 'تم الطلب' : 'Ordered'}
          </Badge>
        );
      case 'SHIPPED':
        return (
          <Badge variant="info" className="text-[10px]">
            <Ship className="h-3 w-3 rtl:ml-1 ltr:mr-1" />
            {locale === 'ar' ? 'تم الشحن' : 'Shipped'}
          </Badge>
        );
      case 'AT_PORT':
        return (
          <Badge variant="outline" className="text-purple-600 border-purple-500/30 bg-purple-500/10 text-[10px]">
            <Anchor className="h-3 w-3 rtl:ml-1 ltr:mr-1" />
            {locale === 'ar' ? 'في الميناء' : 'At Port'}
          </Badge>
        );
      case 'CUSTOMS':
        return (
          <Badge variant="warning" className="text-[10px]">
            <ShieldCheck className="h-3 w-3 rtl:ml-1 ltr:mr-1" />
            {locale === 'ar' ? 'في الجمارك' : 'In Customs'}
          </Badge>
        );
      case 'RECEIVED':
        return (
          <Badge variant="success" className="text-[10px]">
            <CheckCircle2 className="h-3 w-3 rtl:ml-1 ltr:mr-1" />
            {locale === 'ar' ? 'تم الاستلام' : 'Received'}
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {locale === 'ar' ? 'أوامر الشراء ومتابعة الاستيراد' : 'Import Purchase Orders'}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {locale === 'ar'
              ? 'تتبع الشحنات المستوردة من المصانع حتى وصول الميناء والتخليص الجمركي وحساب التكلفة'
              : 'Track overseas shipments through port arrival, customs clearance, and landed cost'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild className="h-9 bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
            <Link href="/purchases/new" className="flex items-center gap-1.5 text-xs font-semibold">
              <Plus className="h-4 w-4" />
              <span>{locale === 'ar' ? 'أمر شراء واستيراد جديد' : 'New Purchase Order'}</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border shadow-sm">
        <CardContent className="p-4 space-y-3">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute top-2.5 h-4 w-4 text-muted-foreground rtl:right-3 ltr:left-3" />
              <Input
                placeholder={
                  locale === 'ar'
                    ? 'ابحث برقم أمر الشراء (PO-001)، اسم المورد، أو رقم بوليصة الشحن...'
                    : 'Search by PO #, supplier name, or tracking number...'
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

          {/* Status Chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t">
            {[
              { id: 'ALL', labelAr: 'الكل', labelEn: 'All' },
              { id: 'ORDERED', labelAr: 'تم الطلب', labelEn: 'Ordered' },
              { id: 'SHIPPED', labelAr: 'تم الشحن', labelEn: 'Shipped' },
              { id: 'AT_PORT', labelAr: 'في الميناء', labelEn: 'At Port' },
              { id: 'CUSTOMS', labelAr: 'في الجمارك', labelEn: 'In Customs' },
              { id: 'RECEIVED', labelAr: 'تم الاستلام', labelEn: 'Received' },
            ].map((st) => (
              <Button
                key={st.id}
                variant={selectedStatus === st.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedStatus(st.id)}
                className="h-7 text-xs"
              >
                {locale === 'ar' ? st.labelAr : st.labelEn}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card className="border shadow-sm overflow-hidden">
        {/* Desktop View */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-28">{locale === 'ar' ? 'رقم الأمر' : 'PO #'}</TableHead>
                <TableHead>{locale === 'ar' ? 'المورد والدولة' : 'Supplier & Country'}</TableHead>
                <TableHead>{locale === 'ar' ? 'تاريخ الطلب' : 'Date'}</TableHead>
                <TableHead className="w-32">{locale === 'ar' ? 'حالة الشحنة' : 'Shipment'}</TableHead>
                <TableHead>{locale === 'ar' ? 'القيمة الأجنبية' : 'Foreign Total'}</TableHead>
                <TableHead>{locale === 'ar' ? 'سعر الصرف' : 'Rate'}</TableHead>
                <TableHead>{locale === 'ar' ? 'الإجمالي بالجنيه' : 'Total (EGP)'}</TableHead>
                <TableHead className="w-32 text-center">{locale === 'ar' ? 'تكلفة الاستيراد' : 'Landed Cost'}</TableHead>
                <TableHead className="w-16 text-center">{locale === 'ar' ? 'الإجراءات' : 'Actions'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                    {locale === 'ar' ? 'جاري تحميل أوامر الشراء...' : 'Loading purchase orders...'}
                  </TableCell>
                </TableRow>
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                    {locale === 'ar' ? 'لا توجد أوامر شراء مطابقة' : 'No purchase orders found'}
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((po) => {
                  const hasLandedCost = po.shipment && po.shipment.totalLandedCostEGP > 0;

                  return (
                    <TableRow key={po.id} className="hover:bg-muted/40 transition-colors text-xs">
                      <TableCell className="font-mono font-bold text-blue-600">
                        <Link href={`/purchases/${po.id}`}>{po.poNumber}</Link>
                      </TableCell>

                      <TableCell>
                        <div className="font-semibold">{po.supplier?.nameAr}</div>
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <span>🌍 {po.supplier?.country}</span>
                        </div>
                      </TableCell>

                      <TableCell>{new Date(po.orderDate).toLocaleDateString()}</TableCell>

                      <TableCell>{getStatusBadge(po.status)}</TableCell>

                      <TableCell className="font-mono font-bold">
                        {formatCurrency(po.subtotalForeign, po.currency)}
                      </TableCell>

                      <TableCell className="font-mono text-muted-foreground">
                        {po.exchangeRate.toFixed(2)}
                      </TableCell>

                      <TableCell className="font-mono font-bold text-foreground">
                        {formatEGP(po.subtotalEGP)}
                      </TableCell>

                      <TableCell className="text-center">
                        {hasLandedCost ? (
                          <Badge variant="success" className="text-[10px]">
                            {formatEGP(po.shipment.totalLandedCostEGP)}
                          </Badge>
                        ) : (
                          <Button variant="outline" size="sm" asChild className="h-6 text-[10px] px-2">
                            <Link href={`/purchases/${po.id}/landed-cost`}>
                              <Calculator className="h-3 w-3 rtl:ml-1 ltr:mr-1" />
                              {locale === 'ar' ? 'توزيع التكلفة' : 'Allocate'}
                            </Link>
                          </Button>
                        )}
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
                              <Link href={`/purchases/${po.id}`} className="cursor-pointer">
                                <Eye className="h-4 w-4 rtl:ml-2 ltr:mr-2" />
                                {locale === 'ar' ? 'عرض تفاصيل الشحنة' : 'View PO Details'}
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/purchases/${po.id}/landed-cost`} className="cursor-pointer">
                                <Calculator className="h-4 w-4 rtl:ml-2 ltr:mr-2" />
                                {locale === 'ar' ? 'حساب تكلفة الاستيراد' : 'Landed Cost Calculator'}
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/purchases/${po.id}/receive`} className="cursor-pointer text-emerald-600 font-semibold">
                                <CheckCircle2 className="h-4 w-4 rtl:ml-2 ltr:mr-2" />
                                {locale === 'ar' ? 'استلام البضائع والمخزن' : 'Receive Goods & Stock'}
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
        </div>

        {/* Mobile View */}
        <div className="divide-y md:hidden">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              {locale === 'ar' ? 'جاري التحميل...' : 'Loading...'}
            </div>
          ) : orders.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              {locale === 'ar' ? 'لا توجد أوامر شراء' : 'No purchase orders'}
            </div>
          ) : (
            orders.map((po) => (
              <div key={po.id} className="p-4 space-y-2 hover:bg-muted/30">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono font-bold text-xs text-blue-600">{po.poNumber}</span>
                    <h3 className="font-bold text-sm">{po.supplier?.nameAr}</h3>
                  </div>
                  <div>{getStatusBadge(po.status)}</div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t">
                  <span className="font-mono font-bold text-emerald-600">
                    {formatCurrency(po.subtotalForeign, po.currency)} ({formatEGP(po.subtotalEGP)})
                  </span>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" asChild className="h-7 text-xs">
                      <Link href={`/purchases/${po.id}`}>{locale === 'ar' ? 'عرض' : 'View'}</Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild className="h-7 text-xs">
                      <Link href={`/purchases/${po.id}/receive`}>{locale === 'ar' ? 'استلام' : 'Receive'}</Link>
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
