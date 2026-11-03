'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Calculator,
  Ship,
  ShieldCheck,
  Truck,
  CheckCircle2,
  Save,
  AlertCircle,
  Scale,
  DollarSign,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatEGP, formatCurrency, allocateLandedCostByValue, allocateLandedCostByWeight } from '@/lib/utils';
import Decimal from 'decimal.js';

export default function LandedCostAllocationPage() {
  const params = useParams();
  const router = useRouter();
  const { locale, isRTL } = useI18n();

  const [po, setPo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Landed cost inputs in EGP
  const [freightCost, setFreightCost] = useState('25000');
  const [customsDuty, setCustomsDuty] = useState('45000');
  const [clearanceFees, setClearanceFees] = useState('8500');
  const [localTransport, setLocalTransport] = useState('6000');
  const [otherCosts, setOtherCosts] = useState('3500');
  const [allocationMethod, setAllocationMethod] = useState<'BY_VALUE' | 'BY_WEIGHT'>('BY_VALUE');
  const [itemWeights, setItemWeights] = useState<Record<string, string>>({});

  useEffect(() => {
    if (params?.id) {
      fetchPO(params.id as string);
    }
  }, [params?.id]);

  const fetchPO = async (id: string) => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/purchases/${id}`);
      const json = await res.json();
      if (json.success) {
        setPo(json.data);
        if (json.data.shipment) {
          const shp = json.data.shipment;
          if (shp.freightCostEGP > 0) setFreightCost(shp.freightCostEGP.toString());
          if (shp.customsDutyEGP > 0) setCustomsDuty(shp.customsDutyEGP.toString());
          if (shp.clearanceFeesEGP > 0) setClearanceFees(shp.clearanceFeesEGP.toString());
          if (shp.localTransportEGP > 0) setLocalTransport(shp.localTransportEGP.toString());
          if (shp.otherCostsEGP > 0) setOtherCosts(shp.otherCostsEGP.toString());
          if (shp.allocationMethod) setAllocationMethod(shp.allocationMethod);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fCost = parseFloat(freightCost) || 0;
  const cDuty = parseFloat(customsDuty) || 0;
  const cFees = parseFloat(clearanceFees) || 0;
  const lTrans = parseFloat(localTransport) || 0;
  const oCosts = parseFloat(otherCosts) || 0;
  const totalLandedCost = fCost + cDuty + cFees + lTrans + oCosts;

  // Calculate live item allocations
  const calculateAllocations = () => {
    if (!po || !po.items) return [];

    let totalWeight = 0;
    if (allocationMethod === 'BY_WEIGHT') {
      po.items.forEach((it: any) => {
        totalWeight += parseFloat(itemWeights[it.id] || '1');
      });
    }

    return po.items.map((it: any) => {
      let landedPerUnit = 0;
      if (allocationMethod === 'BY_VALUE') {
        const itemTotalVal = it.unitPriceEGP * it.quantityOrdered;
        landedPerUnit = allocateLandedCostByValue(
          itemTotalVal,
          po.subtotalEGP,
          totalLandedCost,
          it.quantityOrdered
        ).toNumber();
      } else {
        const itemWeight = parseFloat(itemWeights[it.id] || '1');
        landedPerUnit = allocateLandedCostByWeight(
          itemWeight,
          totalWeight,
          totalLandedCost,
          it.quantityOrdered
        ).toNumber();
      }

      const trueUnitCost = it.unitPriceEGP + landedPerUnit;
      const pctIncrease = it.unitPriceEGP > 0 ? (landedPerUnit / it.unitPriceEGP) * 100 : 0;

      return {
        ...it,
        landedPerUnit,
        trueUnitCost,
        pctIncrease,
      };
    });
  };

  const allocatedItems = calculateAllocations();

  const handleApply = async () => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const payload = {
        freightCostEGP: fCost,
        customsDutyEGP: cDuty,
        clearanceFeesEGP: cFees,
        localTransportEGP: lTrans,
        otherCostsEGP: oCosts,
        allocationMethod,
        itemWeights,
      };

      const res = await fetch(`/api/purchases/${params.id}/landed-cost`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to allocate landed cost');
      }

      router.push(`/purchases/${params.id}`);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        {locale === 'ar' ? 'جاري التحميل...' : 'Loading...'}
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild className="h-8 px-2">
          <Link href={`/purchases/${params.id}`} className="flex items-center gap-1 text-xs">
            {isRTL ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
            <span>{locale === 'ar' ? `الرجوع لأمر ${po?.poNumber}` : 'Back to PO'}</span>
          </Link>
        </Button>
        <span className="text-muted-foreground">/</span>
        <h1 className="text-xl sm:text-2xl font-bold">
          {locale === 'ar' ? 'حساب وتوزيع تكلفة الاستيراد الحقيقية (Landed Cost)' : 'Landed Cost Calculator'}
        </h1>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 rounded-lg bg-red-500/10 p-4 text-sm text-red-600 dark:text-red-400 border border-red-500/20">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Inputs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Expense Breakdown Inputs */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border shadow-sm">
            <CardHeader className="bg-muted/20 border-b pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-blue-600" />
                  {locale === 'ar' ? 'بنود ومصاريف الإفراج الجمركي والشحن (بالجنيه)' : 'Import Expenses (EGP)'}
                </span>
                <Badge variant="outline" className="font-mono text-xs">
                  {po?.poNumber}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 p-3 rounded-lg border bg-card">
                  <Label htmlFor="freight" className="text-xs font-semibold flex items-center gap-1.5">
                    <Ship className="h-4 w-4 text-blue-600" />
                    {locale === 'ar' ? 'مصاريف الشحن البحري / الجوي' : 'Freight Shipping Cost'}
                  </Label>
                  <div className="relative">
                    <Input
                      id="freight"
                      type="number"
                      value={freightCost}
                      onChange={(e) => setFreightCost(e.target.value)}
                      className="font-mono font-bold"
                    />
                    <span className="absolute top-2.5 text-xs text-muted-foreground rtl:left-3 ltr:right-3">
                      ج.م
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 p-3 rounded-lg border bg-card">
                  <Label htmlFor="customs" className="text-xs font-semibold flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-purple-600" />
                    {locale === 'ar' ? 'الرسوم الجمركية وضريبة الوارد' : 'Customs Duty & Import Tax'}
                  </Label>
                  <div className="relative">
                    <Input
                      id="customs"
                      type="number"
                      value={customsDuty}
                      onChange={(e) => setCustomsDuty(e.target.value)}
                      className="font-mono font-bold"
                    />
                    <span className="absolute top-2.5 text-xs text-muted-foreground rtl:left-3 ltr:right-3">
                      ج.م
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 p-3 rounded-lg border bg-card">
                  <Label htmlFor="clearance" className="text-xs font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    {locale === 'ar' ? 'أتعاب التخليص الجمركي والأرضيات' : 'Clearance & Demurrage Fees'}
                  </Label>
                  <div className="relative">
                    <Input
                      id="clearance"
                      type="number"
                      value={clearanceFees}
                      onChange={(e) => setClearanceFees(e.target.value)}
                      className="font-mono font-bold"
                    />
                    <span className="absolute top-2.5 text-xs text-muted-foreground rtl:left-3 ltr:right-3">
                      ج.م
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 p-3 rounded-lg border bg-card">
                  <Label htmlFor="transport" className="text-xs font-semibold flex items-center gap-1.5">
                    <Truck className="h-4 w-4 text-amber-600" />
                    {locale === 'ar' ? 'النقل والتعتيق الداخلي' : 'Local Inland Transport'}
                  </Label>
                  <div className="relative">
                    <Input
                      id="transport"
                      type="number"
                      value={localTransport}
                      onChange={(e) => setLocalTransport(e.target.value)}
                      className="font-mono font-bold"
                    />
                    <span className="absolute top-2.5 text-xs text-muted-foreground rtl:left-3 ltr:right-3">
                      ج.م
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 p-3 rounded-lg border bg-card">
                <Label htmlFor="other" className="text-xs font-semibold">
                  {locale === 'ar' ? 'مصاريف أخرى (فحص فني، تأمين، عينات مصلحة الكيمياء)' : 'Other Inspections & Testing'}
                </Label>
                <div className="relative">
                  <Input
                    id="other"
                    type="number"
                    value={otherCosts}
                    onChange={(e) => setOtherCosts(e.target.value)}
                    className="font-mono font-bold"
                  />
                  <span className="absolute top-2.5 text-xs text-muted-foreground rtl:left-3 ltr:right-3">
                    ج.م
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Col: Summary & Method Selection */}
        <div className="space-y-6">
          <Card className="border shadow-sm bg-blue-50/50 dark:bg-blue-950/20 border-blue-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-blue-900 dark:text-blue-300">
                {locale === 'ar' ? 'إجمالي تكاليف الاستيراد للشحنة' : 'Total Landed Cost'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-3xl font-black font-mono text-blue-700 dark:text-blue-400">
                {formatEGP(totalLandedCost)}
              </div>

              {/* Method Selection */}
              <div className="space-y-2 pt-2 border-t border-blue-500/20">
                <Label className="text-xs font-bold text-foreground">
                  {locale === 'ar' ? 'طريقة توزيع التكلفة على الأصناف:' : 'Cost Allocation Method:'}
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAllocationMethod('BY_VALUE')}
                    className={`p-2.5 rounded-lg border text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                      allocationMethod === 'BY_VALUE'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-card text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <DollarSign className="h-4 w-4" />
                    <span>{locale === 'ar' ? 'حسب القيمة (BY_VALUE)' : 'By Value'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAllocationMethod('BY_WEIGHT')}
                    className={`p-2.5 rounded-lg border text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                      allocationMethod === 'BY_WEIGHT'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-card text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <Scale className="h-4 w-4" />
                    <span>{locale === 'ar' ? 'حسب الوزن (BY_WEIGHT)' : 'By Weight'}</span>
                  </button>
                </div>
              </div>

              <Button
                type="button"
                onClick={handleApply}
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 shadow-md"
              >
                <Save className="h-4 w-4 rtl:ml-2 ltr:mr-2" />
                {isSubmitting
                  ? (locale === 'ar' ? 'جاري الاعتماد...' : 'Saving...')
                  : (locale === 'ar' ? 'تطبيق واعتماد تكلفة الاستيراد' : 'Apply & Save Allocation')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Live Preview Table */}
      <Card className="border shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/20 border-b pb-3">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            {locale === 'ar' ? 'معاينة حية لتكلفة الوحدة الحقيقية بعد توزيع مصاريف الاستيراد' : 'Live Unit True Cost Preview'}
          </CardTitle>
          <CardDescription className="text-xs">
            {locale === 'ar'
              ? 'يوضح نصيب كل قطعة من الشحن والجمارك وسعر التكلفة النهائي الذي سيدخل به المخزن'
              : 'Shows each unit share of freight/customs and final true landed cost in EGP'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 text-xs">
                <TableHead>{locale === 'ar' ? 'الصنف / SKU' : 'SKU'}</TableHead>
                <TableHead className="text-center">{locale === 'ar' ? 'الكمية' : 'Qty'}</TableHead>
                <TableHead>{locale === 'ar' ? 'سعر الشراء الأجنبي' : 'Foreign Price'}</TableHead>
                <TableHead>{locale === 'ar' ? 'سعر الشراء بالجنيه' : 'Base EGP'}</TableHead>
                <TableHead className="text-amber-600 font-semibold">{locale === 'ar' ? 'نصيب الاستيراد/وحدة' : 'Landed Exp/Unit'}</TableHead>
                <TableHead className="text-emerald-700 font-bold">{locale === 'ar' ? 'التكلفة الحقيقية للوحدة' : 'True Unit Cost'}</TableHead>
                <TableHead className="text-center">{locale === 'ar' ? 'نسبة الزيادة' : '% Landed'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allocatedItems.map((it: any) => (
                <TableRow key={it.id} className="text-xs hover:bg-muted/30">
                  <TableCell>
                    <div className="font-mono font-bold text-blue-600">{it.product.sku}</div>
                    <div className="text-[11px] text-muted-foreground">{it.product.nameAr}</div>
                  </TableCell>
                  <TableCell className="text-center font-mono font-bold">{it.quantityOrdered}</TableCell>
                  <TableCell className="font-mono font-semibold">
                    {formatCurrency(it.unitPriceForeign, po?.currency)}
                  </TableCell>
                  <TableCell className="font-mono">{formatEGP(it.unitPriceEGP)}</TableCell>
                  <TableCell className="font-mono font-bold text-amber-600">
                    + {formatEGP(it.landedPerUnit)}
                  </TableCell>
                  <TableCell className="font-mono font-black text-sm text-emerald-700 dark:text-emerald-400">
                    {formatEGP(it.trueUnitCost)}
                  </TableCell>
                  <TableCell className="text-center font-mono text-[11px] font-semibold text-muted-foreground">
                    +{it.pctIncrease.toFixed(1)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
