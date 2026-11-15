'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, RotateCcw, AlertCircle } from 'lucide-react';

interface Category { id: string; nameAr: string; nameEn: string; }
interface Account { id: string; nameAr: string; currency: string; currentBalance: number; }

const CATEGORIES_DEFAULT = [
  { nameAr: 'إيجار', nameEn: 'Rent' },
  { nameAr: 'رواتب وأجور', nameEn: 'Salaries' },
  { nameAr: 'شحن ولوجستيات', nameEn: 'Logistics' },
  { nameAr: 'مرافق (كهرباء/ماء)', nameEn: 'Utilities' },
  { nameAr: 'رسوم ميناء وجمارك', nameEn: 'Port & Customs' },
  { nameAr: 'تسويق وإعلان', nameEn: 'Marketing' },
  { nameAr: 'صيانة وإصلاح', nameEn: 'Maintenance' },
  { nameAr: 'مصروفات متنوعة', nameEn: 'Miscellaneous' },
];

const RECURRING_FREQ = [
  { value: 'DAILY', label: 'يومي' },
  { value: 'WEEKLY', label: 'أسبوعي' },
  { value: 'MONTHLY', label: 'شهري' },
  { value: 'QUARTERLY', label: 'ربع سنوي' },
  { value: 'ANNUALLY', label: 'سنوي' },
];

export default function NewExpensePage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    categoryId: '',
    expenseDate: new Date().toISOString().split('T')[0],
    amount: '',
    currency: 'EGP',
    exchangeRate: '1',
    description: '',
    financialAccountId: '',
    receiptUrl: '',
    isRecurring: false,
    recurringFrequency: 'MONTHLY',
    nextDueDate: '',
  });

  useEffect(() => {
    (async () => {
      const [catRes, accRes] = await Promise.all([
        fetch('/api/expenses/categories'),
        fetch('/api/accounts'),
      ]);
      const [catJson, accJson] = await Promise.all([catRes.json(), accRes.json()]);
      setCategories(catJson.success ? catJson.data : []);
      setAccounts(accJson.success ? accJson.data : []);
    })();
  }, []);

  const selectedAccount = accounts.find((a) => a.id === form.financialAccountId);
  const amountEGP = parseFloat(form.amount || '0') * parseFloat(form.exchangeRate || '1');
  const isForeignCurrency = form.currency !== 'EGP';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: form.categoryId,
          expenseDate: form.expenseDate,
          amount: parseFloat(form.amount),
          currency: form.currency,
          exchangeRate: parseFloat(form.exchangeRate || '1'),
          description: form.description,
          financialAccountId: form.financialAccountId,
          receiptUrl: form.receiptUrl || undefined,
          isRecurring: form.isRecurring,
          recurringFrequency: form.isRecurring ? form.recurringFrequency : undefined,
          nextDueDate: form.isRecurring && form.nextDueDate ? form.nextDueDate : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || 'حدث خطأ'); return; }
      router.push('/expenses');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto" dir="rtl">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6">
        <ArrowRight className="h-4 w-4" />
        المصروفات
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">تسجيل مصروف جديد</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border p-6 space-y-5">
        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">فئة المصروف *</label>
          <select
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            required
            className="w-full border rounded-xl px-3 py-2.5 text-sm"
          >
            <option value="">اختر الفئة</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.nameAr}</option>
            ))}
          </select>
          {categories.length === 0 && (
            <p className="text-xs text-amber-600 mt-1">
              ⚠ لا توجد فئات. يرجى إضافة فئات أولاً من إعدادات الفئات.
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">البيان / الوصف *</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
            rows={2}
            className="w-full border rounded-xl px-3 py-2.5 text-sm resize-none"
            placeholder="وصف المصروف بالتفصيل"
          />
        </div>

        {/* Date + Account */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ المصروف *</label>
            <input
              type="date"
              value={form.expenseDate}
              onChange={(e) => setForm({ ...form, expenseDate: e.target.value })}
              required
              className="w-full border rounded-xl px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">سداد من حساب *</label>
            <select
              value={form.financialAccountId}
              onChange={(e) => setForm({ ...form, financialAccountId: e.target.value })}
              required
              className="w-full border rounded-xl px-3 py-2.5 text-sm"
            >
              <option value="">اختر الحساب</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nameAr} ({a.currentBalance.toLocaleString('ar-EG', { minimumFractionDigits: 2 })} {a.currency})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Amount + Currency */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">المبلغ *</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              required
              className="w-full border rounded-xl px-3 py-2.5 text-sm"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">العملة</label>
            <select
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value, exchangeRate: e.target.value === 'EGP' ? '1' : form.exchangeRate })}
              className="w-full border rounded-xl px-3 py-2.5 text-sm"
            >
              <option value="EGP">جنيه (EGP)</option>
              <option value="USD">دولار (USD)</option>
              <option value="EUR">يورو (EUR)</option>
              <option value="CNY">يوان (CNY)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">سعر الصرف</label>
            <input
              type="number"
              step="0.000001"
              min="0.000001"
              value={form.exchangeRate}
              onChange={(e) => setForm({ ...form, exchangeRate: e.target.value })}
              disabled={!isForeignCurrency}
              className="w-full border rounded-xl px-3 py-2.5 text-sm disabled:bg-gray-50"
            />
          </div>
        </div>

        {/* EGP equivalent */}
        {isForeignCurrency && form.amount && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-sm text-blue-800">
            المكافئ بالجنيه المصري:{' '}
            <strong>{amountEGP.toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م</strong>
          </div>
        )}

        {/* Receipt URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">رابط الإيصال (اختياري)</label>
          <input
            value={form.receiptUrl}
            onChange={(e) => setForm({ ...form, receiptUrl: e.target.value })}
            className="w-full border rounded-xl px-3 py-2.5 text-sm"
            placeholder="https://drive.google.com/..."
          />
        </div>

        {/* Recurring */}
        <div className="bg-gray-50 border rounded-xl p-4 space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isRecurring}
              onChange={(e) => setForm({ ...form, isRecurring: e.target.checked })}
              className="w-4 h-4 rounded"
            />
            <RotateCcw className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">مصروف متكرر</span>
          </label>
          {form.isRecurring && (
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">تكرار كل</label>
                <select
                  value={form.recurringFrequency}
                  onChange={(e) => setForm({ ...form, recurringFrequency: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  {RECURRING_FREQ.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">تاريخ الاستحقاق القادم</label>
                <input
                  type="date"
                  value={form.nextDueDate}
                  onChange={(e) => setForm({ ...form, nextDueDate: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
          )}
        </div>

        {/* Balance warning */}
        {selectedAccount && form.amount && amountEGP > selectedAccount.currentBalance && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>
              تحذير: رصيد الحساب ({selectedAccount.currentBalance.toLocaleString('ar-EG', { minimumFractionDigits: 2 })} {selectedAccount.currency}) أقل من المبلغ المطلوب. سيصبح الرصيد سالباً.
            </span>
          </div>
        )}

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 border rounded-xl py-2.5 text-sm hover:bg-gray-50"
          >
            إلغاء
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-red-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
          >
            {saving ? 'جارٍ الحفظ…' : 'تسجيل المصروف'}
          </button>
        </div>
      </form>
    </div>
  );
}
