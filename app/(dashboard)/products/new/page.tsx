'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Package,
  Wrench,
  Layers,
  Save,
  Plus,
  Trash2,
  Barcode,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function NewProductPage() {
  const router = useRouter();
  const { locale, t, isRTL } = useI18n();

  const [productType, setProductType] = useState<'BEARING' | 'SPARE_PART'>('BEARING');
  const [categories, setCategories] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [priceLists, setPriceLists] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Common fields
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [unitOfMeasure, setUnitOfMeasure] = useState('PIECE');
  const [piecesPerBox, setPiecesPerBox] = useState('10');
  const [boxesPerCarton, setBoxesPerCarton] = useState('10');
  const [minStockLevel, setMinStockLevel] = useState('20');
  const [notes, setNotes] = useState('');

  // Bearing specs
  const [bearingNumber, setBearingNumber] = useState('');
  const [bearingType, setBearingType] = useState('Deep Groove Ball (محمل كريات ذو مجرى عميق)');
  const [innerDiameterMm, setInnerDiameterMm] = useState('');
  const [outerDiameterMm, setOuterDiameterMm] = useState('');
  const [widthMm, setWidthMm] = useState('');
  const [brand, setBrand] = useState('SKF');
  const [originCountry, setOriginCountry] = useState('Germany');
  const [sealType, setSealType] = useState('2RS');
  const [material, setMaterial] = useState('Chrome Steel (صلب كروم 100Cr6)');

  // Spare part specs
  const [partNumber, setPartNumber] = useState('');
  const [partBrand, setPartBrand] = useState('Original');
  const [oemType, setOemType] = useState<'OEM' | 'AFTERMARKET'>('AFTERMARKET');
  const [partOrigin, setPartOrigin] = useState('Italy');
  const [compatibleModels, setCompatibleModels] = useState<Array<{ applianceBrand: string; modelNumber: string; notes: string }>>([
    { applianceBrand: 'Samsung', modelNumber: '', notes: '' },
  ]);

  // Cross references
  const [crossReferences, setCrossReferences] = useState<Array<{ alternateNumber: string; alternateBrand: string; notes: string }>>([
    { alternateNumber: '', alternateBrand: '', notes: '' },
  ]);

  // Prices per price list
  const [prices, setPrices] = useState<Record<string, string>>({});

  // Initial stock per warehouse
  const [stockAllocations, setStockAllocations] = useState<Record<string, { qty: string; shelf: string }>>({});

  useEffect(() => {
    // Fetch categories, warehouses, and price lists
    Promise.all([
      fetch('/api/categories').then((r) => r.json()),
      fetch('/api/warehouses').then((r) => r.json()),
      fetch('/api/price-lists').then((r) => r.json()),
    ]).then(([catData, whData, plData]) => {
      if (catData.success) {
        setCategories(catData.data);
        if (catData.data.length > 0) setCategoryId(catData.data[0].id);
      }
      if (whData.success) {
        setWarehouses(whData.data);
      }
      if (plData.success) {
        setPriceLists(plData.data);
      }
    });
  }, []);

  // Auto-generate SKU
  const handleAutoSku = () => {
    const prefix = productType === 'BEARING' ? 'BRG' : 'PRT';
    const num = bearingNumber || partNumber || Math.floor(1000 + Math.random() * 9000).toString();
    const cleanNum = num.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    setSku(`${prefix}-${cleanNum}`);
  };

  // Auto-fill names from specs
  const handleAutoNames = () => {
    if (productType === 'BEARING' && bearingNumber) {
      setNameAr(`محمل بلي رقم ${bearingNumber} - ${brand} (${sealType})`);
      setNameEn(`Ball Bearing #${bearingNumber} - ${brand} (${sealType})`);
    } else if (productType === 'SPARE_PART' && partNumber) {
      setNameAr(`قطعة غيار كود ${partNumber} (${oemType === 'OEM' ? 'أصلي' : 'تجاري'})`);
      setNameEn(`Spare Part #${partNumber} (${oemType})`);
    }
  };

  const addCompatibleModel = () => {
    setCompatibleModels([...compatibleModels, { applianceBrand: '', modelNumber: '', notes: '' }]);
  };

  const removeCompatibleModel = (index: number) => {
    setCompatibleModels(compatibleModels.filter((_, i) => i !== index));
  };

  const addCrossReference = () => {
    setCrossReferences([...crossReferences, { alternateNumber: '', alternateBrand: '', notes: '' }]);
  };

  const removeCrossReference = (index: number) => {
    setCrossReferences(crossReferences.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!sku || !nameAr || !nameEn || !categoryId) {
      setErrorMessage(
        locale === 'ar'
          ? 'يرجى إكمال الحقول الأساسية: كود الصنف، الاسم بالعربية، والإنجليزية، والفئة'
          : 'Please complete required fields: SKU, Arabic Name, English Name, and Category'
      );
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        sku,
        barcode: barcode || null,
        nameAr,
        nameEn,
        productType,
        categoryId,
        unitOfMeasure,
        piecesPerBox: piecesPerBox ? parseInt(piecesPerBox) : null,
        boxesPerCarton: boxesPerCarton ? parseInt(boxesPerCarton) : null,
        minStockLevel: parseFloat(minStockLevel || '0'),
        notes: notes || null,
        bearingSpec:
          productType === 'BEARING'
            ? {
                bearingNumber,
                bearingType,
                innerDiameterMm: parseFloat(innerDiameterMm || '0'),
                outerDiameterMm: parseFloat(outerDiameterMm || '0'),
                widthMm: parseFloat(widthMm || '0'),
                brand,
                originCountry,
                sealType,
                material,
              }
            : undefined,
        sparePartSpec:
          productType === 'SPARE_PART'
            ? {
                partNumber,
                brand: partBrand,
                oemType,
                originCountry: partOrigin,
                compatibleModels: compatibleModels.filter((cm) => cm.applianceBrand.trim().length > 0),
              }
            : undefined,
        crossReferences: crossReferences.filter((cr) => cr.alternateNumber.trim().length > 0),
        prices: Object.entries(prices).map(([priceListId, priceStr]) => ({
          priceListId,
          unitPrice: parseFloat(priceStr || '0'),
          minQty: 1,
        })),
        warehouses: Object.entries(stockAllocations)
          .filter(([_, data]) => parseFloat(data.qty || '0') > 0)
          .map(([warehouseId, data]) => ({
            warehouseId,
            shelfLocation: data.shelf,
            quantityOnHand: parseFloat(data.qty || '0'),
          })),
      };

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to save product');
      }

      router.push(`/products/${json.data.id}`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error occurred while saving product');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild className="h-8 px-2">
            <Link href="/products" className="flex items-center gap-1 text-xs">
              {isRTL ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
              <span>{locale === 'ar' ? 'الرجوع للمنتجات' : 'Back to Catalog'}</span>
            </Link>
          </Button>
          <span className="text-muted-foreground">/</span>
          <h1 className="text-xl sm:text-2xl font-bold">
            {locale === 'ar' ? 'إضافة صنف جديد' : 'New Product Entry'}
          </h1>
        </div>

        {/* Product Type Toggle */}
        <div className="flex items-center gap-2 p-1 bg-muted/60 rounded-xl border">
          <button
            type="button"
            onClick={() => {
              setProductType('BEARING');
              handleAutoNames();
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              productType === 'BEARING'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Package className="h-4 w-4" />
            <span>{locale === 'ar' ? 'محمل (Bearing)' : 'Bearing'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setProductType('SPARE_PART');
              handleAutoNames();
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              productType === 'SPARE_PART'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Wrench className="h-4 w-4" />
            <span>{locale === 'ar' ? 'قطعة غيار أجهزة' : 'Appliance Spare Part'}</span>
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 rounded-lg bg-red-500/10 p-4 text-sm text-red-600 dark:text-red-400 border border-red-500/20">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: Product Specifications (Type-Specific) */}
        {productType === 'BEARING' ? (
          <Card className="border-blue-500/30 shadow-sm">
            <CardHeader className="bg-blue-50/50 dark:bg-blue-950/20 border-b">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-blue-700 dark:text-blue-400">
                <Package className="h-5 w-5" />
                {locale === 'ar' ? 'المواصفات الفنية للمحمل (Bearing Specs)' : 'Bearing Specifications'}
              </CardTitle>
              <CardDescription className="text-xs">
                {locale === 'ar'
                  ? 'رقم المحمل، الأبعاد الهندسية (القطر الداخلي، الخارجي، والعرض)، الماركة ونوع الحشوة'
                  : 'Bearing number, dimensions (d x D x B), brand, and seal type'}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="bearingNumber" className="text-xs font-semibold">
                    {locale === 'ar' ? 'رقم المحمل *' : 'Bearing Number *'}
                  </Label>
                  <Input
                    id="bearingNumber"
                    placeholder="6204-2RS, 30205, etc."
                    value={bearingNumber}
                    onChange={(e) => setBearingNumber(e.target.value)}
                    onBlur={() => {
                      handleAutoSku();
                      handleAutoNames();
                    }}
                    required
                    className="font-mono font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="brand" className="text-xs font-semibold">
                    {locale === 'ar' ? 'الماركة المصنعة *' : 'Brand *'}
                  </Label>
                  <Input
                    id="brand"
                    placeholder="SKF, FAG, NSK, NTN, KOYO..."
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    onBlur={handleAutoNames}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="sealType" className="text-xs font-semibold">
                    {locale === 'ar' ? 'نوع الحشوة (Seal Type)' : 'Seal Type'}
                  </Label>
                  <Input
                    id="sealType"
                    placeholder="2RS (مطاط), ZZ (معدن), Open"
                    value={sealType}
                    onChange={(e) => setSealType(e.target.value)}
                    onBlur={handleAutoNames}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="originCountry" className="text-xs font-semibold">
                    {locale === 'ar' ? 'بلد المنشأ' : 'Country of Origin'}
                  </Label>
                  <Input
                    id="originCountry"
                    placeholder="Japan, Germany, Sweden, China..."
                    value={originCountry}
                    onChange={(e) => setOriginCountry(e.target.value)}
                  />
                </div>
              </div>

              {/* Dimensions: Inner, Outer, Width in mm */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-muted/40 border">
                <div className="space-y-1.5">
                  <Label htmlFor="innerD" className="text-xs font-semibold">
                    {locale === 'ar' ? 'القطر الداخلي d (مم)' : 'Inner Diameter (d) mm'}
                  </Label>
                  <Input
                    id="innerD"
                    type="number"
                    step="0.01"
                    placeholder="20"
                    value={innerDiameterMm}
                    onChange={(e) => setInnerDiameterMm(e.target.value)}
                    className="font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="outerD" className="text-xs font-semibold">
                    {locale === 'ar' ? 'القطر الخارجي D (مم)' : 'Outer Diameter (D) mm'}
                  </Label>
                  <Input
                    id="outerD"
                    type="number"
                    step="0.01"
                    placeholder="47"
                    value={outerDiameterMm}
                    onChange={(e) => setOuterDiameterMm(e.target.value)}
                    className="font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="widthMm" className="text-xs font-semibold">
                    {locale === 'ar' ? 'العرض B (مم)' : 'Width (B) mm'}
                  </Label>
                  <Input
                    id="widthMm"
                    type="number"
                    step="0.01"
                    placeholder="14"
                    value={widthMm}
                    onChange={(e) => setWidthMm(e.target.value)}
                    className="font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="bearingType" className="text-xs font-semibold">
                    {locale === 'ar' ? 'نوع المحمل' : 'Bearing Category'}
                  </Label>
                  <Input
                    id="bearingType"
                    placeholder="Deep Groove Ball, Tapered Roller, Thrust..."
                    value={bearingType}
                    onChange={(e) => setBearingType(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="material" className="text-xs font-semibold">
                    {locale === 'ar' ? 'الخامة' : 'Material'}
                  </Label>
                  <Input
                    id="material"
                    placeholder="Chrome Steel 100Cr6, Stainless..."
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-indigo-500/30 shadow-sm">
            <CardHeader className="bg-indigo-50/50 dark:bg-indigo-950/20 border-b">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
                <Wrench className="h-5 w-5" />
                {locale === 'ar' ? 'مواصفات قطعة الغيار والأجهزة المتوافقة' : 'Spare Part Specs & Compatibility'}
              </CardTitle>
              <CardDescription className="text-xs">
                {locale === 'ar'
                  ? 'رقم القطعة، تصنيف الأصلي مقابل البديل، والأجهزة والموديلات المتوافقة'
                  : 'Part number, OEM/Aftermarket, and compatible appliances'}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="partNumber" className="text-xs font-semibold">
                    {locale === 'ar' ? 'رقم القطعة / Part No *' : 'Part Number *'}
                  </Label>
                  <Input
                    id="partNumber"
                    placeholder="DC64-00519D, 481236018558..."
                    value={partNumber}
                    onChange={(e) => setPartNumber(e.target.value)}
                    onBlur={() => {
                      handleAutoSku();
                      handleAutoNames();
                    }}
                    required
                    className="font-mono font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="partBrand" className="text-xs font-semibold">
                    {locale === 'ar' ? 'الماركة المصنعة' : 'Brand'}
                  </Label>
                  <Input
                    id="partBrand"
                    placeholder="Samsung, LG, Whirlpool, Askoll..."
                    value={partBrand}
                    onChange={(e) => setPartBrand(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="oemType" className="text-xs font-semibold">
                    {locale === 'ar' ? 'النوع (أصلي أم بديل)' : 'Type'}
                  </Label>
                  <select
                    id="oemType"
                    value={oemType}
                    onChange={(e) => setOemType(e.target.value as any)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="AFTERMARKET">{locale === 'ar' ? 'بديل تجاري (Aftermarket)' : 'Aftermarket'}</option>
                    <option value="OEM">{locale === 'ar' ? 'أصلي (OEM Original)' : 'OEM Original'}</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="partOrigin" className="text-xs font-semibold">
                    {locale === 'ar' ? 'بلد المنشأ' : 'Origin Country'}
                  </Label>
                  <Input
                    id="partOrigin"
                    placeholder="Italy, China, Turkey, Korea..."
                    value={partOrigin}
                    onChange={(e) => setPartOrigin(e.target.value)}
                  />
                </div>
              </div>

              {/* Compatible Appliance Models Repeater */}
              <div className="space-y-2 pt-2 border-t">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">
                    {locale === 'ar' ? 'الأجهزة والموديلات المتوافقة (Fits Models):' : 'Compatible Appliance Models:'}
                  </Label>
                  <Button type="button" variant="outline" size="sm" onClick={addCompatibleModel} className="h-7 text-xs">
                    <Plus className="h-3 w-3 rtl:ml-1 ltr:mr-1" />
                    {locale === 'ar' ? 'إضافة جهاز' : 'Add Model'}
                  </Button>
                </div>

                <div className="space-y-2">
                  {compatibleModels.map((cm, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Input
                        placeholder={locale === 'ar' ? 'ماركة الجهاز (مثل: سامسونج، إل جي)' : 'Appliance Brand'}
                        value={cm.applianceBrand}
                        onChange={(e) => {
                          const updated = [...compatibleModels];
                          updated[idx].applianceBrand = e.target.value;
                          setCompatibleModels(updated);
                        }}
                        className="text-xs h-9"
                      />
                      <Input
                        placeholder={locale === 'ar' ? 'رقم الموديل (مثل: WF806, F1496)' : 'Model Number'}
                        value={cm.modelNumber}
                        onChange={(e) => {
                          const updated = [...compatibleModels];
                          updated[idx].modelNumber = e.target.value;
                          setCompatibleModels(updated);
                        }}
                        className="text-xs h-9 font-mono"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeCompatibleModel(idx)}
                        disabled={compatibleModels.length === 1}
                        className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* SECTION 2: Core Details (SKU, Names, Category, Units) */}
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">
              {locale === 'ar' ? 'البيانات الأساسية للمنتج' : 'Core Product Information'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="sku" className="text-xs font-semibold">
                    {locale === 'ar' ? 'كود الصنف / SKU *' : 'Product SKU *'}
                  </Label>
                  <button
                    type="button"
                    onClick={handleAutoSku}
                    className="text-[11px] text-blue-600 hover:underline flex items-center gap-0.5"
                  >
                    <Sparkles className="h-3 w-3" />
                    {locale === 'ar' ? 'توليد تلقائي' : 'Auto Generate'}
                  </button>
                </div>
                <Input
                  id="sku"
                  placeholder="BRG-6204-2RS"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  required
                  className="font-mono font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="barcode" className="text-xs font-semibold">
                  {locale === 'ar' ? 'الباركود الدولي (Barcode)' : 'Barcode'}
                </Label>
                <div className="relative">
                  <Barcode className="absolute top-2.5 h-4 w-4 text-muted-foreground rtl:right-3 ltr:left-3" />
                  <Input
                    id="barcode"
                    placeholder="6221234567890"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    className="rtl:pr-9 ltr:pl-9 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="categoryId" className="text-xs font-semibold">
                  {locale === 'ar' ? 'القسم / الفئة *' : 'Category *'}
                </Label>
                <select
                  id="categoryId"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameAr} ({c.nameEn})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="nameAr" className="text-xs font-semibold">
                  {locale === 'ar' ? 'اسم المنتج بالعربية *' : 'Arabic Name *'}
                </Label>
                <Input
                  id="nameAr"
                  placeholder="محمل بلي 6204-2RS ألماني..."
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="nameEn" className="text-xs font-semibold">
                  {locale === 'ar' ? 'اسم المنتج بالإنجليزية *' : 'English Name *'}
                </Label>
                <Input
                  id="nameEn"
                  placeholder="Ball Bearing 6204-2RS..."
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Units & Conversions */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-muted/30 border">
              <div className="space-y-1.5">
                <Label htmlFor="unit" className="text-xs font-semibold">
                  {locale === 'ar' ? 'الوحدة الأساسية' : 'Base Unit'}
                </Label>
                <select
                  id="unit"
                  value={unitOfMeasure}
                  onChange={(e) => setUnitOfMeasure(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs"
                >
                  <option value="PIECE">{locale === 'ar' ? 'قطعة (Piece)' : 'Piece'}</option>
                  <option value="BOX">{locale === 'ar' ? 'صندوق (Box)' : 'Box'}</option>
                  <option value="CARTON">{locale === 'ar' ? 'كرتونة (Carton)' : 'Carton'}</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="piecesBox" className="text-xs font-semibold">
                  {locale === 'ar' ? 'قطع في العلبة' : 'Pieces / Box'}
                </Label>
                <Input
                  id="piecesBox"
                  type="number"
                  value={piecesPerBox}
                  onChange={(e) => setPiecesPerBox(e.target.value)}
                  className="h-9 text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="boxesCarton" className="text-xs font-semibold">
                  {locale === 'ar' ? 'علب في الكرتونة' : 'Boxes / Carton'}
                </Label>
                <Input
                  id="boxesCarton"
                  type="number"
                  value={boxesPerCarton}
                  onChange={(e) => setBoxesPerCarton(e.target.value)}
                  className="h-9 text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="minStock" className="text-xs font-semibold">
                  {locale === 'ar' ? 'الحد الأدنى للتنبيه' : 'Min Stock Alert'}
                </Label>
                <Input
                  id="minStock"
                  type="number"
                  value={minStockLevel}
                  onChange={(e) => setMinStockLevel(e.target.value)}
                  className="h-9 text-xs font-mono"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 3: Multi-Tier Pricing */}
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">
              {locale === 'ar' ? 'قوائم الأسعار المتعددة (بالجنيه المصري)' : 'Price Lists & Tiers (EGP)'}
            </CardTitle>
            <CardDescription className="text-xs">
              {locale === 'ar'
                ? 'حدد سعر البيع لكل شريحة عملاء (تجزئة، نصف جملة، جملة، كبار العملاء)'
                : 'Define selling price for each customer tier'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {priceLists.map((pl) => (
                <div key={pl.id} className="space-y-1.5 p-3 rounded-lg border bg-card">
                  <Label className="text-xs font-semibold flex items-center justify-between">
                    <span>{pl.nameAr}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {pl.type}
                    </Badge>
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={prices[pl.id] || ''}
                      onChange={(e) =>
                        setPrices({ ...prices, [pl.id]: e.target.value })
                      }
                      className="font-mono font-bold text-sm"
                    />
                    <span className="absolute top-2.5 text-xs text-muted-foreground rtl:left-3 ltr:right-3">
                      ج.م
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* SECTION 4: Initial Stock by Warehouse */}
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">
              {locale === 'ar' ? 'رصيد أول المدة والمستودعات' : 'Initial Stock & Warehouses'}
            </CardTitle>
            <CardDescription className="text-xs">
              {locale === 'ar'
                ? 'إدخال الكمية المتوفرة حالياً وموقع الرف في كل مخزن'
                : 'Enter current on-hand quantity and shelf location per warehouse'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {warehouses.map((wh) => (
                <div key={wh.id} className="p-3 rounded-lg border space-y-2 bg-muted/20">
                  <div className="font-semibold text-xs">{wh.nameAr}</div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">
                      {locale === 'ar' ? 'الكمية الافتتاحية' : 'Opening Qty'}
                    </Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={stockAllocations[wh.id]?.qty || ''}
                      onChange={(e) =>
                        setStockAllocations({
                          ...stockAllocations,
                          [wh.id]: {
                            shelf: stockAllocations[wh.id]?.shelf || '',
                            qty: e.target.value,
                          },
                        })
                      }
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">
                      {locale === 'ar' ? 'موقع الرف / الستاند' : 'Shelf Location'}
                    </Label>
                    <Input
                      placeholder="A-12-3"
                      value={stockAllocations[wh.id]?.shelf || ''}
                      onChange={(e) =>
                        setStockAllocations({
                          ...stockAllocations,
                          [wh.id]: {
                            qty: stockAllocations[wh.id]?.qty || '',
                            shelf: e.target.value,
                          },
                        })
                      }
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* SECTION 5: Cross References (Equivalent Parts) */}
        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base sm:text-lg">
                {locale === 'ar' ? 'الأرقام المكافئة والبدائل (Cross-References)' : 'Equivalent Parts & Cross-References'}
              </CardTitle>
              <CardDescription className="text-xs">
                {locale === 'ar'
                  ? 'أرقام نفس الصنف لدى الماركات والمصنعين الآخرين لسهولة العثور عليه'
                  : 'Alternative numbers for the same part across different brands'}
              </CardDescription>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addCrossReference} className="h-8 text-xs">
              <Plus className="h-3 w-3 rtl:ml-1 ltr:mr-1" />
              {locale === 'ar' ? 'إضافة رقم مكافئ' : 'Add Cross-Ref'}
            </Button>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-2">
            {crossReferences.map((cr, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Input
                  placeholder={locale === 'ar' ? 'الرقم البديل (مثل: 6204-DDU, 6204-RS)' : 'Alternate Number'}
                  value={cr.alternateNumber}
                  onChange={(e) => {
                    const updated = [...crossReferences];
                    updated[idx].alternateNumber = e.target.value;
                    setCrossReferences(updated);
                  }}
                  className="text-xs h-9 font-mono"
                />
                <Input
                  placeholder={locale === 'ar' ? 'الماركة البديلة (مثل: NSK, Koyo)' : 'Alternate Brand'}
                  value={cr.alternateBrand}
                  onChange={(e) => {
                    const updated = [...crossReferences];
                    updated[idx].alternateBrand = e.target.value;
                    setCrossReferences(updated);
                  }}
                  className="text-xs h-9"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeCrossReference(idx)}
                  disabled={crossReferences.length === 1}
                  className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <Button variant="outline" type="button" asChild className="h-11 px-6">
            <Link href="/products">{locale === 'ar' ? 'إلغاء' : 'Cancel'}</Link>
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-11 px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md"
          >
            <Save className="h-4 w-4 rtl:ml-2 ltr:mr-2" />
            {isSubmitting
              ? locale === 'ar'
                ? 'جاري الحفظ...'
                : 'Saving...'
              : locale === 'ar'
              ? 'حفظ المنتج في الكتالوج'
              : 'Save Product'}
          </Button>
        </div>
      </form>
    </div>
  );
}
