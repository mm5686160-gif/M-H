'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  TrendingUp, TrendingDown, DollarSign, CreditCard,
  AlertTriangle, Package, Banknote, Building2,
  BarChart2, RefreshCw, ChevronDown,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

// ── Types ────────────────────────────────────────────────────────────────────
interface KPIs {
  revenue: number;
  revenueTrend: number | null;
  grossProfit: number;
  gpMargin: number;
  netProfit: number;
  totalExpenses: number;
  totalReceivables: number;
  overdueReceivables: number;
  cashBalance: number;
  bankBalance: number;
  pendingCheques: number;
  dueSoonCheques: number;
  lowStockAlert: number;
  invoiceCount: number;
}

interface DayPoint { date: string; revenue: number; gp: number; }
interface ProductRow { productId: string; nameAr: string; sku: string; revenue: number; qty: number; }
interface DashboardData {
  kpis: KPIs;
  charts: {
    salesTrend: DayPoint[];
    expenseByCategory: Record<string, number>;
    topProducts: ProductRow[];
  };
  period: { days: number; from: string; to: string };
}

// ── Colors ───────────────────────────────────────────────────────────────────
const PIE_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'];

// ── Formatters ───────────────────────────────────────────────────────────────
const fmt = (n: number) => n.toLocaleString('ar-EG', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const fmtK = (n: number) => n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}م` : n >= 1000 ? `${(n / 1000).toFixed(1)}ك` : String(Math.round(n));

// ── KPI Card ─────────────────────────────────────────────────────────────────
function KPICard({
  label, value, sub, trend, icon, color = 'blue', alert = false,
}: {
  label: string; value: string; sub?: string; trend?: number | null;
  icon: React.ReactNode; color?: string; alert?: boolean;
}) {
  const colorMap: Record<string, string> = {
    blue:   'bg-blue-50 text-blue-700',
    green:  'bg-green-50 text-green-700',
    red:    'bg-red-50 text-red-700',
    amber:  'bg-amber-50 text-amber-700',
    purple: 'bg-purple-50 text-purple-700',
    gray:   'bg-gray-50 text-gray-700',
  };

  return (
    <div className={`rounded-2xl border p-5 ${alert ? 'border-red-300 bg-red-50' : 'bg-white'}`}>
      <div className="flex items-start justify-between">
        <div className={`p-2 rounded-xl ${colorMap[color] ?? colorMap.blue}`}>{icon}</div>
        {trend !== null && trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(trend).toFixed(1)}%
          </div>
        )}
      </div>
      <div className="mt-3">
        <div className="text-xs text-gray-500">{label}</div>
        <div className={`text-2xl font-bold mt-0.5 ${alert ? 'text-red-700' : 'text-gray-900'}`}>{value}</div>
        {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  const load = useCallback(async (d: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard?days=${d}`);
      const json = await res.json();
      if (json.success) setData(json);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(days); }, [days, load]);

  const kpi = data?.kpis;
  const charts = data?.charts;

  // Expense pie data
  const expensePie = charts
    ? Object.entries(charts.expenseByCategory).map(([name, value]) => ({ name, value }))
    : [];

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">لوحة التحكم</h1>
          <p className="text-sm text-gray-500 mt-1">نظرة شاملة على أداء الشركة</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="appearance-none border rounded-xl px-4 py-2 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={7}>آخر 7 أيام</option>
              <option value={30}>آخر 30 يوم</option>
              <option value={90}>آخر 90 يوم</option>
              <option value={365}>آخر سنة</option>
            </select>
            <ChevronDown className="absolute left-2 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
          <button
            onClick={() => load(days)}
            className="p-2 border rounded-xl hover:bg-gray-50"
            title="تحديث"
          >
            <RefreshCw className={`h-4 w-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Alerts row */}
      {kpi && (kpi.dueSoonCheques > 0 || kpi.overdueReceivables > 0 || kpi.lowStockAlert > 0) && (
        <div className="flex flex-wrap gap-3">
          {kpi.dueSoonCheques > 0 && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 text-sm text-amber-700">
              <AlertTriangle className="h-4 w-4" />
              <span>{kpi.dueSoonCheques} شيك يستحق خلال 7 أيام</span>
            </div>
          )}
          {kpi.overdueReceivables > 0 && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2 text-sm text-red-700">
              <AlertTriangle className="h-4 w-4" />
              <span>ذمم متأخرة: {fmt(kpi.overdueReceivables)} ج.م</span>
            </div>
          )}
          {kpi.lowStockAlert > 0 && (
            <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-4 py-2 text-sm text-orange-700">
              <Package className="h-4 w-4" />
              <span>{kpi.lowStockAlert} صنف تحت مستوى إعادة الطلب</span>
            </div>
          )}
        </div>
      )}

      {/* KPI Grid */}
      {loading && !data ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-2xl border bg-gray-50 h-32 animate-pulse" />
          ))}
        </div>
      ) : kpi ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard
            label="إجمالي المبيعات"
            value={`${fmtK(kpi.revenue)} ج.م`}
            sub={`${kpi.invoiceCount} فاتورة`}
            trend={kpi.revenueTrend}
            icon={<DollarSign className="h-5 w-5" />}
            color="blue"
          />
          <KPICard
            label="مجمل الربح"
            value={`${fmtK(kpi.grossProfit)} ج.م`}
            sub={`هامش ${kpi.gpMargin}%`}
            icon={<TrendingUp className="h-5 w-5" />}
            color={kpi.grossProfit >= 0 ? 'green' : 'red'}
          />
          <KPICard
            label="صافي الربح"
            value={`${fmtK(kpi.netProfit)} ج.م`}
            sub={`مصروفات: ${fmtK(kpi.totalExpenses)} ج.م`}
            icon={<BarChart2 className="h-5 w-5" />}
            color={kpi.netProfit >= 0 ? 'green' : 'red'}
          />
          <KPICard
            label="إجمالي الذمم"
            value={`${fmtK(kpi.totalReceivables)} ج.م`}
            sub={kpi.overdueReceivables > 0 ? `متأخر: ${fmtK(kpi.overdueReceivables)} ج.م` : 'لا توجد متأخرات'}
            icon={<CreditCard className="h-5 w-5" />}
            color={kpi.overdueReceivables > 0 ? 'red' : 'blue'}
            alert={kpi.overdueReceivables > 0}
          />
          <KPICard
            label="رصيد الخزينة"
            value={`${fmtK(kpi.cashBalance)} ج.م`}
            icon={<Banknote className="h-5 w-5" />}
            color="green"
          />
          <KPICard
            label="رصيد البنك"
            value={`${fmtK(kpi.bankBalance)} ج.م`}
            icon={<Building2 className="h-5 w-5" />}
            color="purple"
          />
          <KPICard
            label="شيكات معلقة"
            value={String(kpi.pendingCheques)}
            sub={kpi.dueSoonCheques > 0 ? `${kpi.dueSoonCheques} تستحق قريباً` : ''}
            icon={<CreditCard className="h-5 w-5" />}
            color={kpi.dueSoonCheques > 0 ? 'amber' : 'gray'}
            alert={kpi.dueSoonCheques > 0}
          />
          <KPICard
            label="تنبيهات المخزون"
            value={String(kpi.lowStockAlert)}
            sub="أصناف تحت مستوى إعادة الطلب"
            icon={<Package className="h-5 w-5" />}
            color={kpi.lowStockAlert > 0 ? 'red' : 'green'}
            alert={kpi.lowStockAlert > 0}
          />
        </div>
      ) : null}

      {/* Charts Row 1: Sales Trend + Expenses Pie */}
      {charts && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sales Trend Area Chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl border p-5">
            <h2 className="font-semibold text-gray-700 mb-4">مسار المبيعات والأرباح</h2>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={charts.salesTrend} margin={{ right: 10, left: 10 }}>
                <defs>
                  <linearGradient id="gradRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradGP" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => v.slice(5)} // MM-DD
                />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={fmtK} />
                <Tooltip
                  formatter={(v: number) => [`${fmt(v)} ج.م`, '']}
                  labelFormatter={(l) => `تاريخ: ${l}`}
                />
                <Legend formatter={(v) => (v === 'revenue' ? 'المبيعات' : 'مجمل الربح')} />
                <Area type="monotone" dataKey="revenue" stroke="#3B82F6" fill="url(#gradRev)" strokeWidth={2} />
                <Area type="monotone" dataKey="gp" stroke="#10B981" fill="url(#gradGP)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Expenses by Category Pie */}
          <div className="bg-white rounded-2xl border p-5">
            <h2 className="font-semibold text-gray-700 mb-4">توزيع المصروفات</h2>
            {expensePie.length === 0 ? (
              <div className="flex items-center justify-center h-52 text-gray-400 text-sm">لا توجد مصروفات</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={expensePie}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {expensePie.map((_, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => [`${fmt(v)} ج.م`, '']} />
                  <Legend
                    formatter={(v) => v}
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {/* Charts Row 2: Top Products */}
      {charts && charts.topProducts.length > 0 && (
        <div className="bg-white rounded-2xl border p-5">
          <h2 className="font-semibold text-gray-700 mb-4">أعلى 5 منتجات مبيعاً (بالإيراد)</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar chart */}
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={charts.topProducts} layout="vertical" margin={{ right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={fmtK} />
                <YAxis
                  type="category"
                  dataKey="nameAr"
                  tick={{ fontSize: 10 }}
                  width={120}
                />
                <Tooltip formatter={(v: number) => [`${fmt(v)} ج.م`, 'الإيراد']} />
                <Bar dataKey="revenue" fill="#3B82F6" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-gray-500 border-b">
                  <tr>
                    <th className="pb-2 text-right">المنتج</th>
                    <th className="pb-2 text-left">الكمية</th>
                    <th className="pb-2 text-left">الإيراد</th>
                  </tr>
                </thead>
                <tbody>
                  {charts.topProducts.map((p, i) => (
                    <tr key={p.productId} className="border-b last:border-0">
                      <td className="py-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                          />
                          <div>
                            <div className="font-medium text-xs leading-tight">{p.nameAr}</div>
                            <div className="text-xs text-gray-400">{p.sku}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2 text-left text-gray-600">{fmt(p.qty)}</td>
                      <td className="py-2 text-left font-semibold text-blue-700">{fmtK(p.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Net Profit summary card */}
      {kpi && (
        <div className={`rounded-2xl border p-5 flex items-center gap-6 ${kpi.netProfit >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className={`p-3 rounded-2xl ${kpi.netProfit >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
            {kpi.netProfit >= 0 ? (
              <TrendingUp className="h-8 w-8 text-green-700" />
            ) : (
              <TrendingDown className="h-8 w-8 text-red-700" />
            )}
          </div>
          <div>
            <div className="text-sm text-gray-500">صافي الربح في آخر {days} يوم</div>
            <div className={`text-3xl font-bold mt-1 ${kpi.netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              {kpi.netProfit >= 0 ? '+' : ''}{fmt(kpi.netProfit)} ج.م
            </div>
            <div className="text-xs text-gray-400 mt-1">
              مبيعات {fmt(kpi.revenue)} — مصروفات {fmt(kpi.totalExpenses)} — تكلفة بضاعة {fmt(kpi.revenue - kpi.grossProfit)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
