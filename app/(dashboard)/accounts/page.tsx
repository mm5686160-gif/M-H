'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Banknote,
  Building2,
  Wallet,
  Plus,
  ArrowLeftRight,
  RefreshCw,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

interface FinancialAccount {
  id: string;
  nameAr: string;
  nameEn: string;
  accountType: 'CASH' | 'BANK' | 'WALLET';
  currency: string;
  currentBalance: number;
  isDefault: boolean;
}

interface Totals {
  EGP?: number;
  USD?: number;
  EUR?: number;
  CNY?: number;
  [k: string]: number | undefined;
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  CASH: <Banknote className="h-5 w-5" />,
  BANK: <Building2 className="h-5 w-5" />,
  WALLET: <Wallet className="h-5 w-5" />,
};

const TYPE_COLOR: Record<string, string> = {
  CASH: 'bg-green-50 border-green-200 text-green-700',
  BANK: 'bg-blue-50 border-blue-200 text-blue-700',
  WALLET: 'bg-purple-50 border-purple-200 text-purple-700',
};

const TYPE_LABEL: Record<string, string> = {
  CASH: 'صندوق نقدي',
  BANK: 'حساب بنكي',
  WALLET: 'محفظة رقمية',
};

export default function AccountsPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [totals, setTotals] = useState<Totals>({});
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ nameAr: '', nameEn: '', accountType: 'CASH', currency: 'EGP', initialBalance: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/accounts');
      const json = await res.json();
      if (json.success) {
        setAccounts(json.data);
        setTotals(json.totals ?? {});
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nameAr: form.nameAr,
          nameEn: form.nameEn,
          accountType: form.accountType,
          currency: form.currency,
          initialBalance: parseFloat(form.initialBalance || '0'),
        }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || 'حدث خطأ'); return; }
      setShowNew(false);
      setForm({ nameAr: '', nameEn: '', accountType: 'CASH', currency: 'EGP', initialBalance: '' });
      load();
    } finally {
      setSaving(false);
    }
  }

  const grouped: Record<string, FinancialAccount[]> = { CASH: [], BANK: [], WALLET: [] };
  for (const acc of accounts) grouped[acc.accountType]?.push(acc);

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">الحسابات المالية</h1>
          <p className="text-sm text-gray-500 mt-1">صناديق النقدية، الحسابات البنكية، والمحافظ الرقمية</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.push('/accounts/transfers')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm hover:bg-gray-50"
          >
            <ArrowLeftRight className="h-4 w-4" />
            تحويل
          </button>
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            حساب جديد
          </button>
        </div>
      </div>

      {/* Summary totals */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(totals).map(([cur, val]) => (
          <div key={cur} className="bg-white rounded-xl border p-4">
            <div className="text-xs text-gray-500 mb-1">إجمالي {cur}</div>
            <div className={`text-xl font-bold ${(val ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {(val ?? 0).toLocaleString('ar-EG', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-gray-400">{cur}</div>
          </div>
        ))}
      </div>

      {/* Accounts by type */}
      {loading ? (
        <div className="text-center text-gray-400 py-12">جارٍ التحميل…</div>
      ) : (
        Object.entries(grouped).map(([type, accs]) =>
          accs.length === 0 ? null : (
            <div key={type} className="space-y-3">
              <h2 className="text-sm font-semibold text-gray-600 flex items-center gap-2">
                <span className={`p-1 rounded ${TYPE_COLOR[type]}`}>{TYPE_ICON[type]}</span>
                {TYPE_LABEL[type]}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {accs.map((acc) => (
                  <div
                    key={acc.id}
                    onClick={() => router.push(`/accounts/${acc.id}`)}
                    className={`rounded-xl border p-5 cursor-pointer hover:shadow-md transition-shadow ${TYPE_COLOR[acc.accountType]}`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold text-base">{acc.nameAr}</div>
                        <div className="text-xs mt-0.5 opacity-70">{acc.nameEn}</div>
                      </div>
                      {acc.isDefault && (
                        <span className="text-xs bg-white/60 px-2 py-0.5 rounded-full">افتراضي</span>
                      )}
                    </div>
                    <div className="mt-4">
                      <div className={`text-2xl font-bold ${acc.currentBalance >= 0 ? '' : 'text-red-600'}`}>
                        {acc.currentBalance.toLocaleString('ar-EG', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-xs opacity-70 mt-0.5">{acc.currency}</div>
                    </div>
                    {acc.currentBalance < 0 && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-red-600">
                        <TrendingDown className="h-3 w-3" />
                        رصيد سالب
                      </div>
                    )}
                    {acc.currentBalance > 0 && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-green-700 opacity-70">
                        <TrendingUp className="h-3 w-3" />
                        رصيد متاح
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ),
        )
      )}

      {/* New Account Modal */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md" dir="rtl">
            <h2 className="text-lg font-bold mb-4">حساب مالي جديد</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">الاسم بالعربية</label>
                  <input
                    value={form.nameAr}
                    onChange={(e) => setForm({ ...form, nameAr: e.target.value })}
                    required
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    placeholder="مثال: صندوق المحل"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">الاسم بالإنجليزية</label>
                  <input
                    value={form.nameEn}
                    onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
                    required
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    placeholder="e.g. Shop Cash"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">نوع الحساب</label>
                  <select
                    value={form.accountType}
                    onChange={(e) => setForm({ ...form, accountType: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="CASH">صندوق نقدي</option>
                    <option value="BANK">حساب بنكي</option>
                    <option value="WALLET">محفظة رقمية</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">العملة</label>
                  <select
                    value={form.currency}
                    onChange={(e) => setForm({ ...form, currency: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="EGP">جنيه مصري (EGP)</option>
                    <option value="USD">دولار (USD)</option>
                    <option value="EUR">يورو (EUR)</option>
                    <option value="CNY">يوان (CNY)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">الرصيد الافتتاحي</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.initialBalance}
                  onChange={(e) => setForm({ ...form, initialBalance: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="0.00"
                />
              </div>
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowNew(false)} className="px-4 py-2 border rounded-lg text-sm">
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'جارٍ الحفظ…' : 'حفظ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
