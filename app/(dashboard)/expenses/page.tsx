'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Filter, RefreshCw, TrendingDown, Calendar, Tag, RotateCcw } from 'lucide-react';

interface Expense {
  id: string;
  expenseDate: string;
  amount: number;
  amountEGP: number;
  currency: string;
  description: string;
  isRecurring: boolean;
  recurringFrequency?: string;
  nextDueDate?: string;
  receiptUrl?: string;
  category: { nameAr: string };
  financialAccount: { nameAr: string };
}

interface Meta {
  total: number;
  page: number;
  pages: number;
  periodTotalEGP: number;
}

const FREQ_LABEL: Record<string, string> = {
  DAILY: 'يومي',
  WEEKLY: 'أسبوعي',
  MONTHLY: 'شهري',
  QUARTERLY: 'ربع سنوي',
  ANNUALLY: 'سنوي',
};

export default function ExpensesPage() {
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ from: '', to: '', recurring: '' });
  const [page, setPage] = useState(1);

  async function load(p = 1) {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: '50' });
    if (filters.from) params.append('from', filters.from);
    if (filters.to) params.append('to', filters.to);
    if (filters.recurring) params.append('recurring', filters.recurring);
    const res = await fetch(`/api/expenses?${params}`);
    const json = await res.json();
    if (json.success) {
      setExpenses(json.data);
      setMeta(json.meta);
    }
    setLoading(false);
  }

  useEffect(() => { load(page); }, [page]);

  function applyFilters(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    load(1);
  }

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">المصروفات</h1>
          <p className="text-sm text-gray-500 mt-1">تتبع ومراقبة جميع نفقات الشركة</p>
        </div>
        <button
          onClick={() => router.push('/expenses/new')}
          className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700"
        >
          <Plus className="h-4 w-4" />
          مصروف جديد
        </button>
      </div>

      {/* Filters */}
      <form onSubmit={applyFilters} className="bg-white rounded-xl border p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">من تاريخ</label>
          <input
            type="date"
            value={filters.from}
            onChange={(e) => setFilters({ ...filters, from: e.target.value })}
            className="border rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">إلى تاريخ</label>
          <input
            type="date"
            value={filters.to}
            onChange={(e) => setFilters({ ...filters, to: e.target.value })}
            className="border rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">النوع</label>
          <select
            value={filters.recurring}
            onChange={(e) => setFilters({ ...filters, recurring: e.target.value })}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="">الكل</option>
            <option value="true">متكرر فقط</option>
          </select>
        </div>
        <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200">
          <Filter className="h-4 w-4" />
          فلتر
        </button>
        <button
          type="button"
          onClick={() => { setFilters({ from: '', to: '', recurring: '' }); setPage(1); load(1); }}
          className="flex items-center gap-2 px-3 py-2 border rounded-lg text-sm text-gray-500 hover:bg-gray-50"
        >
          <RefreshCw className="h-3 w-3" />
          إعادة تعيين
        </button>
      </form>

      {/* Period total */}
      {meta && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <TrendingDown className="h-6 w-6 text-red-600" />
          <div>
            <div className="text-xs text-gray-500">إجمالي المصروفات في الفترة المحددة</div>
            <div className="text-2xl font-bold text-red-700">
              {meta.periodTotalEGP.toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م
            </div>
          </div>
          <div className="mr-auto text-sm text-gray-400">{meta.total} مصروف</div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border overflow-hidden">
        {loading ? (
          <div className="text-center text-gray-400 py-12">جارٍ التحميل…</div>
        ) : expenses.length === 0 ? (
          <div className="text-center text-gray-400 py-12">لا توجد مصروفات</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500">
              <tr>
                <th className="px-4 py-3 text-right">التاريخ</th>
                <th className="px-4 py-3 text-right">البيان</th>
                <th className="px-4 py-3 text-right">الفئة</th>
                <th className="px-4 py-3 text-right">الحساب</th>
                <th className="px-4 py-3 text-right">التكرار</th>
                <th className="px-4 py-3 text-left">المبلغ (ج.م)</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((exp) => (
                <tr key={exp.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3 w-3" />
                      {new Date(exp.expenseDate).toLocaleDateString('ar-EG')}
                    </div>
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    <div className="truncate">{exp.description}</div>
                    {exp.receiptUrl && (
                      <a href={exp.receiptUrl} target="_blank" className="text-xs text-blue-600 hover:underline">
                        عرض الإيصال
                      </a>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full w-fit">
                      <Tag className="h-2.5 w-2.5" />
                      {exp.category.nameAr}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{exp.financialAccount.nameAr}</td>
                  <td className="px-4 py-3">
                    {exp.isRecurring ? (
                      <span className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full w-fit">
                        <RotateCcw className="h-2.5 w-2.5" />
                        {FREQ_LABEL[exp.recurringFrequency ?? ''] ?? exp.recurringFrequency}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">مرة واحدة</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-left font-mono font-semibold text-red-700">
                    {exp.amountEGP.toLocaleString('ar-EG', { minimumFractionDigits: 2 })}
                    {exp.currency !== 'EGP' && (
                      <div className="text-xs text-gray-400 font-normal">
                        {exp.amount.toLocaleString('ar-EG', { minimumFractionDigits: 2 })} {exp.currency}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {meta && meta.pages > 1 && (
          <div className="px-6 py-4 border-t flex items-center justify-between text-sm">
            <span className="text-gray-500">صفحة {meta.page} من {meta.pages}</span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                السابق
              </button>
              <button
                onClick={() => setPage((p) => Math.min(meta.pages, p + 1))}
                disabled={page === meta.pages}
                className="px-3 py-1 border rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                التالي
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
