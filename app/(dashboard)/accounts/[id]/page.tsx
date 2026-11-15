'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowRight, TrendingUp, TrendingDown, Clock } from 'lucide-react';

interface Account {
  id: string;
  nameAr: string;
  nameEn: string;
  accountType: string;
  currency: string;
  currentBalance: number;
  isDefault: boolean;
  notes?: string;
  transactions: Transaction[];
}

interface Transaction {
  id: string;
  transactionDate: string;
  transactionType: 'DEBIT' | 'CREDIT';
  amount: number;
  balanceAfter: number;
  description?: string;
  reference?: string;
  relatedEntityType?: string;
}

export default function AccountDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/accounts/${id}?limit=100`);
      const json = await res.json();
      if (json.success) setAccount(json.data);
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <div className="p-8 text-center text-gray-400">جارٍ التحميل…</div>;
  if (!account) return <div className="p-8 text-center text-red-500">الحساب غير موجود</div>;

  const totalIn = account.transactions
    .filter((t) => t.transactionType === 'CREDIT')
    .reduce((s, t) => s + t.amount, 0);
  const totalOut = account.transactions
    .filter((t) => t.transactionType === 'DEBIT')
    .reduce((s, t) => s + t.amount, 0);

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800"
      >
        <ArrowRight className="h-4 w-4" />
        الحسابات
      </button>

      {/* Header */}
      <div className="bg-white rounded-2xl border p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{account.nameAr}</h1>
            <p className="text-sm text-gray-400 mt-1">{account.nameEn}</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-700">
              {account.currentBalance.toLocaleString('ar-EG', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-sm text-gray-400">{account.currency}</div>
          </div>
        </div>
        {account.notes && (
          <p className="mt-4 text-sm text-gray-500 border-t pt-4">{account.notes}</p>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="bg-green-50 rounded-xl p-4 flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <div>
              <div className="text-xs text-gray-500">إجمالي الوارد</div>
              <div className="font-bold text-green-700">
                +{totalIn.toLocaleString('ar-EG', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
          <div className="bg-red-50 rounded-xl p-4 flex items-center gap-3">
            <TrendingDown className="h-5 w-5 text-red-600" />
            <div>
              <div className="text-xs text-gray-500">إجمالي الصادر</div>
              <div className="font-bold text-red-700">
                -{totalOut.toLocaleString('ar-EG', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ledger */}
      <div className="bg-white rounded-2xl border overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center gap-2">
          <Clock className="h-4 w-4 text-gray-400" />
          <h2 className="font-semibold text-gray-700">سجل الحركات</h2>
          <span className="ml-auto text-xs text-gray-400">{account.transactions.length} حركة</span>
        </div>
        {account.transactions.length === 0 ? (
          <div className="text-center text-gray-400 py-12">لا توجد حركات بعد</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500">
              <tr>
                <th className="px-4 py-2 text-right">التاريخ</th>
                <th className="px-4 py-2 text-right">البيان</th>
                <th className="px-4 py-2 text-right">المرجع</th>
                <th className="px-4 py-2 text-left">وارد</th>
                <th className="px-4 py-2 text-left">صادر</th>
                <th className="px-4 py-2 text-left">الرصيد</th>
              </tr>
            </thead>
            <tbody>
              {account.transactions.map((t) => (
                <tr key={t.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {new Date(t.transactionDate).toLocaleDateString('ar-EG')}
                  </td>
                  <td className="px-4 py-3">
                    <div>{t.description ?? '—'}</div>
                    {t.relatedEntityType && (
                      <div className="text-xs text-gray-400">{t.relatedEntityType}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{t.reference ?? '—'}</td>
                  <td className="px-4 py-3 text-left font-mono text-green-700">
                    {t.transactionType === 'CREDIT'
                      ? `+${t.amount.toLocaleString('ar-EG', { minimumFractionDigits: 2 })}`
                      : ''}
                  </td>
                  <td className="px-4 py-3 text-left font-mono text-red-600">
                    {t.transactionType === 'DEBIT'
                      ? `-${t.amount.toLocaleString('ar-EG', { minimumFractionDigits: 2 })}`
                      : ''}
                  </td>
                  <td className={`px-4 py-3 text-left font-mono font-semibold ${t.balanceAfter >= 0 ? 'text-gray-800' : 'text-red-600'}`}>
                    {t.balanceAfter.toLocaleString('ar-EG', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
