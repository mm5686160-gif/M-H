'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ArrowLeftRight, Info } from 'lucide-react';

interface Account {
  id: string;
  nameAr: string;
  nameEn: string;
  currency: string;
  currentBalance: number;
  accountType: string;
}

interface Transfer {
  id: string;
  transferDate: string;
  amount: number;
  fromCurrency: string;
  toCurrency: string;
  exchangeRate: number;
  fee: number;
  reference?: string;
  notes?: string;
  fromAccount: { nameAr: string };
  toAccount: { nameAr: string };
}

export default function TransfersPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    fromAccountId: '',
    toAccountId: '',
    amount: '',
    exchangeRate: '1',
    fee: '0',
    reference: '',
    notes: '',
  });

  async function load() {
    const [accRes, trRes] = await Promise.all([
      fetch('/api/accounts'),
      fetch('/api/accounts/transfers'),
    ]);
    const [accJson, trJson] = await Promise.all([accRes.json(), trRes.json()]);
    if (accJson.success) setAccounts(accJson.data);
    if (trJson.success) setTransfers(trJson.data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const fromAcc = accounts.find((a) => a.id === form.fromAccountId);
  const toAcc = accounts.find((a) => a.id === form.toAccountId);
  const isCrossCurrency = fromAcc && toAcc && fromAcc.currency !== toAcc.currency;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/accounts/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromAccountId: form.fromAccountId,
          toAccountId: form.toAccountId,
          amount: parseFloat(form.amount),
          exchangeRate: parseFloat(form.exchangeRate || '1'),
          fee: parseFloat(form.fee || '0'),
          reference: form.reference || undefined,
          notes: form.notes || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || 'حدث خطأ'); return; }
      setForm({ fromAccountId: '', toAccountId: '', amount: '', exchangeRate: '1', fee: '0', reference: '', notes: '' });
      load();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800">
        <ArrowRight className="h-4 w-4" />
        الحسابات
      </button>

      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <ArrowLeftRight className="h-6 w-6 text-blue-600" />
        تحويل بين الحسابات
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transfer form */}
        <div className="bg-white rounded-2xl border p-6">
          <h2 className="font-semibold text-gray-700 mb-4">تحويل جديد</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">من حساب</label>
              <select
                value={form.fromAccountId}
                onChange={(e) => setForm({ ...form, fromAccountId: e.target.value })}
                required
                className="w-full border rounded-lg px-3 py-2 text-sm"
              >
                <option value="">اختر الحساب المصدر</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nameAr} — {a.currentBalance.toLocaleString('ar-EG', { minimumFractionDigits: 2 })} {a.currency}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">إلى حساب</label>
              <select
                value={form.toAccountId}
                onChange={(e) => setForm({ ...form, toAccountId: e.target.value })}
                required
                className="w-full border rounded-lg px-3 py-2 text-sm"
              >
                <option value="">اختر الحساب الوجهة</option>
                {accounts
                  .filter((a) => a.id !== form.fromAccountId)
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nameAr} — {a.currency}
                    </option>
                  ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  المبلغ {fromAcc ? `(${fromAcc.currency})` : ''}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  required
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">العمولة / الرسوم</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.fee}
                  onChange={(e) => setForm({ ...form, fee: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="0.00"
                />
              </div>
            </div>

            {isCrossCurrency && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                <Info className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800">
                  <strong>تحويل بعملة مختلفة:</strong> {fromAcc?.currency} → {toAcc?.currency}
                  <div className="mt-1">
                    <label className="block font-medium mb-1">سعر الصرف</label>
                    <input
                      type="number"
                      step="0.000001"
                      min="0.000001"
                      value={form.exchangeRate}
                      onChange={(e) => setForm({ ...form, exchangeRate: e.target.value })}
                      className="w-32 border border-amber-300 rounded px-2 py-1 text-sm bg-white"
                    />
                    <span className="mr-2 text-xs">
                      ≈ {(parseFloat(form.amount || '0') * parseFloat(form.exchangeRate || '1')).toLocaleString('ar-EG', { minimumFractionDigits: 2 })} {toAcc?.currency}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">رقم مرجعي</label>
                <input
                  value={form.reference}
                  onChange={(e) => setForm({ ...form, reference: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="اختياري"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">ملاحظات</label>
                <input
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="اختياري"
                />
              </div>
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'جارٍ التحويل…' : 'تأكيد التحويل'}
            </button>
          </form>
        </div>

        {/* Recent transfers */}
        <div className="bg-white rounded-2xl border overflow-hidden">
          <div className="px-6 py-4 border-b font-semibold text-gray-700">آخر التحويلات</div>
          {loading ? (
            <div className="text-center text-gray-400 py-12">جارٍ التحميل…</div>
          ) : transfers.length === 0 ? (
            <div className="text-center text-gray-400 py-12">لا توجد تحويلات بعد</div>
          ) : (
            <div className="divide-y max-h-[500px] overflow-y-auto">
              {transfers.map((t) => (
                <div key={t.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">{t.fromAccount.nameAr}</span>
                      <ArrowLeftRight className="h-3 w-3 text-gray-400" />
                      <span className="font-medium">{t.toAccount.nameAr}</span>
                    </div>
                    <div className="font-bold text-blue-700 text-sm">
                      {t.amount.toLocaleString('ar-EG', { minimumFractionDigits: 2 })} {t.fromCurrency}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 mt-1 flex items-center justify-between">
                    <span>{new Date(t.transferDate).toLocaleDateString('ar-EG')}</span>
                    {t.fee > 0 && <span>رسوم: {t.fee.toFixed(2)}</span>}
                    {t.reference && <span>#{t.reference}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
