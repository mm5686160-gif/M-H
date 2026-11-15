'use client';

import { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Filter,
  DollarSign,
  Package,
  Receipt,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<'sales' | 'inventory' | 'tax'>('sales');
  const [loading, setLoading] = useState(false);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  // Report state
  const [salesData, setSalesData] = useState<any>(null);
  const [inventoryData, setInventoryData] = useState<any>(null);
  const [taxData, setTaxData] = useState<any>(null);

  async function fetchReport() {
    setLoading(true);
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);

    try {
      if (activeTab === 'sales') {
        const res = await fetch(`/api/reports/sales?${params}`);
        const data = await res.json();
        if (data.success) setSalesData(data);
      } else if (activeTab === 'inventory') {
        const res = await fetch(`/api/reports/inventory?${params}`);
        const data = await res.json();
        if (data.success) setInventoryData(data);
      } else if (activeTab === 'tax') {
        const res = await fetch(`/api/reports/tax?${params}`);
        const data = await res.json();
        if (data.success) setTaxData(data);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchReport();
  }, [activeTab]);

  function exportExcel() {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    params.set('export', 'excel');

    const url = `/api/reports/${activeTab}?${params}`;
    window.open(url, '_blank');
  }

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6 text-blue-600" />
            مركز التقارير والإقرارات المالية
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            تقارير المبيعات، تقييم المخزون بمتوسط التكلفة WAC، وإقرارات ضريبة القيمة المضافة 14%
          </p>
        </div>
        <button
          onClick={exportExcel}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm transition-colors text-sm"
        >
          <Download className="h-4 w-4" />
          تصدير التقرير Excel
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('sales')}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'sales'
              ? 'border-blue-600 text-blue-600 font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <DollarSign className="h-4 w-4" />
          تقرير المبيعات التفصيلي
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'inventory'
              ? 'border-blue-600 text-blue-600 font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Package className="h-4 w-4" />
          تقييم المخزون والركود (WAC)
        </button>
        <button
          onClick={() => setActiveTab('tax')}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'tax'
              ? 'border-blue-600 text-blue-600 font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Receipt className="h-4 w-4" />
          إقرار ضريبة القيمة المضافة 14%
        </button>
      </div>

      {/* Date Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border shadow-sm flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">الفترة من:</span>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="border rounded-lg px-3 py-1.5 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">إلى:</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="border rounded-lg px-3 py-1.5 text-sm"
          />
        </div>
        <button
          onClick={fetchReport}
          disabled={loading}
          className="flex items-center gap-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Filter className="h-3.5 w-3.5" />
          تطبيق الفلتر
        </button>
        {loading && <RefreshCw className="h-4 w-4 text-blue-600 animate-spin mr-auto" />}
      </div>

      {/* TAB 1: SALES */}
      {activeTab === 'sales' && salesData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border shadow-sm">
              <div className="text-xs text-gray-500 font-medium">إجمالي المبيعات (ج.م)</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {salesData.summary.totalSales.toLocaleString('ar-EG', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-gray-400 mt-1">{salesData.summary.totalInvoices} فاتورة</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border shadow-sm">
              <div className="text-xs text-gray-500 font-medium">مجمل الربح (ج.م)</div>
              <div className="text-2xl font-bold text-emerald-600 mt-1">
                {salesData.summary.totalGrossProfit.toLocaleString('ar-EG', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-emerald-700 mt-1">
                هامش ربح:{' '}
                {salesData.summary.totalSales > 0
                  ? ((salesData.summary.totalGrossProfit / salesData.summary.totalSales) * 100).toFixed(1)
                  : 0}
                %
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border shadow-sm">
              <div className="text-xs text-gray-500 font-medium">إجمالي ضريبة 14% المحصلة</div>
              <div className="text-2xl font-bold text-blue-600 mt-1">
                {salesData.summary.totalTax.toLocaleString('ar-EG', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-gray-400 mt-1">ضريبة المبيعات</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border shadow-sm">
              <div className="text-xs text-gray-500 font-medium">إجمالي الخصومات الممنوحة</div>
              <div className="text-2xl font-bold text-amber-600 mt-1">
                {salesData.summary.totalDiscounts.toLocaleString('ar-EG', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-gray-400 mt-1">خصومات تجارية ونقدية</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <div className="p-4 border-b font-semibold text-gray-800">بيانات الفواتير والأصناف المبيعة</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500">
                  <tr>
                    <th className="px-4 py-3 text-right">رقم الفاتورة</th>
                    <th className="px-4 py-3 text-right">التاريخ</th>
                    <th className="px-4 py-3 text-right">العميل</th>
                    <th className="px-4 py-3 text-right">كود الصنف SKU</th>
                    <th className="px-4 py-3 text-right">اسم الصنف</th>
                    <th className="px-4 py-3 text-left">الكمية</th>
                    <th className="px-4 py-3 text-left">سعر الوحدة</th>
                    <th className="px-4 py-3 text-left">الخصم %</th>
                    <th className="px-4 py-3 text-left">الإجمالي (ج.م)</th>
                    <th className="px-4 py-3 text-left">مجمل الربح</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {salesData.rows.slice(0, 50).map((r: any, idx: number) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-blue-600">{r.invoiceNumber}</td>
                      <td className="px-4 py-3 text-gray-500">{r.invoiceDate}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{r.customerName}</td>
                      <td className="px-4 py-3 text-xs font-mono text-gray-600">{r.sku}</td>
                      <td className="px-4 py-3 text-gray-800">{r.productName}</td>
                      <td className="px-4 py-3 text-left font-mono">{r.quantity}</td>
                      <td className="px-4 py-3 text-left font-mono">{r.unitPrice.toFixed(2)}</td>
                      <td className="px-4 py-3 text-left font-mono text-amber-600">
                        {r.discountPct > 0 ? `${r.discountPct}%` : '—'}
                      </td>
                      <td className="px-4 py-3 text-left font-mono font-bold text-gray-900">
                        {r.lineTotal.toLocaleString('ar-EG', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-left font-mono font-bold text-emerald-600">
                        {r.grossProfit.toLocaleString('ar-EG', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INVENTORY */}
      {activeTab === 'inventory' && inventoryData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border shadow-sm">
              <div className="text-xs text-gray-500 font-medium">إجمالي قيمة المخزون (WAC)</div>
              <div className="text-2xl font-bold text-blue-700 mt-1">
                {inventoryData.summary.totalValuationEGP.toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م
              </div>
              <div className="text-xs text-gray-400 mt-1">بمتوسط التكلفة المرجح الحقيقي</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border shadow-sm">
              <div className="text-xs text-gray-500 font-medium">إجمالي قطع البضاعة</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {inventoryData.summary.totalUnits.toLocaleString('ar-EG')} قطعة
              </div>
              <div className="text-xs text-gray-400 mt-1">{inventoryData.summary.totalProducts} صنف مسجل</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border shadow-sm">
              <div className="text-xs text-gray-500 font-medium">أصناف راكدة (+90 يوم بدون بيع)</div>
              <div className="text-2xl font-bold text-red-600 mt-1">
                {inventoryData.summary.deadStockCount} صنف
              </div>
              <div className="text-xs text-red-700 mt-1">تتطلب عروض ترويجية لتسييل السيولة</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <div className="p-4 border-b font-semibold text-gray-800">بيانات أرصدة المخازن وتقييمها</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500">
                  <tr>
                    <th className="px-4 py-3 text-right">كود الصنف SKU</th>
                    <th className="px-4 py-3 text-right">اسم الصنف</th>
                    <th className="px-4 py-3 text-right">الفئة</th>
                    <th className="px-4 py-3 text-left">الكمية الإجمالية</th>
                    <th className="px-4 py-3 text-left">متوسط التكلفة WAC</th>
                    <th className="px-4 py-3 text-left">القيمة الإجمالية (ج.م)</th>
                    <th className="px-4 py-3 text-right">توزيع المخازن</th>
                    <th className="px-4 py-3 text-right">آخر بيع</th>
                    <th className="px-4 py-3 text-right">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {inventoryData.rows.slice(0, 50).map((r: any, idx: number) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono font-medium text-gray-900">{r.sku}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{r.nameAr}</td>
                      <td className="px-4 py-3 text-gray-500">{r.categoryName}</td>
                      <td className="px-4 py-3 text-left font-mono font-bold">{r.totalQuantity}</td>
                      <td className="px-4 py-3 text-left font-mono text-gray-700">{r.wac.toFixed(2)}</td>
                      <td className="px-4 py-3 text-left font-mono font-bold text-emerald-600">
                        {r.totalValue.toLocaleString('ar-EG', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{r.warehouses || '—'}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{r.lastSaleDate}</td>
                      <td className="px-4 py-3 text-xs font-semibold">
                        {r.isDeadStock.includes('راكد') ? (
                          <span className="text-red-600 bg-red-50 px-2 py-0.5 rounded-full">راكد</span>
                        ) : (
                          <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">نشط</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TAX */}
      {activeTab === 'tax' && taxData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border shadow-sm">
              <div className="text-xs text-gray-500 font-medium">ضريبة المبيعات 14% (المحصلة)</div>
              <div className="text-2xl font-bold text-blue-700 mt-1">
                {taxData.summary.totalOutputVAT.toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م
              </div>
              <div className="text-xs text-gray-400 mt-1">
                من إجمالي مبيعات خاضعة: {taxData.summary.totalSalesNet.toLocaleString('ar-EG')} ج.م
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border shadow-sm">
              <div className="text-xs text-gray-500 font-medium">ضريبة المشتريات 14% (المدخلات القابلة للخصم)</div>
              <div className="text-2xl font-bold text-emerald-700 mt-1">
                {taxData.summary.totalInputVAT.toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م
              </div>
              <div className="text-xs text-gray-400 mt-1">
                من إجمالي مشتريات محلية: {taxData.summary.totalPurchasesNet.toLocaleString('ar-EG')} ج.م
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border-2 border-red-300 shadow-sm bg-red-50/50">
              <div className="text-xs text-red-700 font-bold">صافي الضريبة المستحقة للسداد (مصلحة الضرائب)</div>
              <div className="text-3xl font-extrabold text-red-700 mt-1">
                {taxData.summary.netVATPayable.toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م
              </div>
              <div className="text-xs text-red-600 mt-1">الفرق بين ضريبة المخرجات وضريبة المدخلات</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <div className="p-4 border-b font-semibold text-gray-800">بيان فواتير المبيعات والمشتريات الخاضعة للضريبة</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500">
                  <tr>
                    <th className="px-4 py-3 text-right">النوع</th>
                    <th className="px-4 py-3 text-right">رقم المستند</th>
                    <th className="px-4 py-3 text-right">التاريخ</th>
                    <th className="px-4 py-3 text-right">الطرف الآخر</th>
                    <th className="px-4 py-3 text-right">التسجيل الضريبي</th>
                    <th className="px-4 py-3 text-left">الوعاء الخاضع (ج.م)</th>
                    <th className="px-4 py-3 text-left">نسبة الضريبة</th>
                    <th className="px-4 py-3 text-left">مبلغ الضريبة (ج.م)</th>
                    <th className="px-4 py-3 text-left">الإجمالي شامل الضريبة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {taxData.sales.map((r: any, idx: number) => (
                    <tr key={`sale-${idx}`} className="hover:bg-blue-50/40">
                      <td className="px-4 py-3">
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                          {r.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono font-medium">{r.docNumber}</td>
                      <td className="px-4 py-3 text-gray-500">{r.date}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{r.partyName}</td>
                      <td className="px-4 py-3 text-xs font-mono text-gray-600">{r.taxNumber}</td>
                      <td className="px-4 py-3 text-left font-mono">{r.taxableBase.toFixed(2)}</td>
                      <td className="px-4 py-3 text-left font-mono text-gray-600">{r.vatRate}%</td>
                      <td className="px-4 py-3 text-left font-mono font-bold text-blue-700">
                        {r.vatAmount.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-left font-mono font-bold text-gray-900">
                        {r.grandTotal.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  {taxData.purchases.map((r: any, idx: number) => (
                    <tr key={`pur-${idx}`} className="hover:bg-emerald-50/40">
                      <td className="px-4 py-3">
                        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                          {r.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono font-medium">{r.docNumber}</td>
                      <td className="px-4 py-3 text-gray-500">{r.date}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{r.partyName}</td>
                      <td className="px-4 py-3 text-xs font-mono text-gray-600">{r.taxNumber}</td>
                      <td className="px-4 py-3 text-left font-mono">{r.taxableBase.toFixed(2)}</td>
                      <td className="px-4 py-3 text-left font-mono text-gray-600">{r.vatRate}%</td>
                      <td className="px-4 py-3 text-left font-mono font-bold text-emerald-700">
                        {r.vatAmount.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-left font-mono font-bold text-gray-900">
                        {r.grandTotal.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
