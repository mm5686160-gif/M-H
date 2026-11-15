'use client';

import { useState } from 'react';
import {
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Package,
  Users,
  Warehouse,
  RefreshCw,
} from 'lucide-react';

type ImportType = 'products' | 'customers' | 'opening-stock';

export default function ImportPage() {
  const [selectedType, setSelectedType] = useState<ImportType>('products');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const importTypes: { id: ImportType; title: string; desc: string; icon: any; color: string }[] = [
    {
      id: 'products',
      title: 'دليل المنتجات والرولمان بلي',
      desc: 'استيراد الأصناف مع مواصفات الرولمان بلي (d×D×B) وأسعار الجملة والقطاعي ومتوسط التكلفة',
      icon: Package,
      color: 'blue',
    },
    {
      id: 'customers',
      title: 'سجل العملاء والورش',
      desc: 'استيراد بيانات العملاء، الحدود الائتمانية، وأرصدة الديون الافتتاحية السابقة',
      icon: Users,
      color: 'emerald',
    },
    {
      id: 'opening-stock',
      title: 'رصيد أول المدة للمخازن',
      desc: 'استيراد الكميات الفعلية الموجودة بكل مخزن مع أماكن الأرفف وتكلفة البداية',
      icon: Warehouse,
      color: 'amber',
    },
  ];

  function downloadTemplate(type: ImportType) {
    window.open(`/api/import/template?type=${type}`, '_blank');
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError('يرجى اختيار ملف Excel بصيغة .xlsx أولاً');
      return;
    }

    setUploading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const endpoint =
        selectedType === 'products'
          ? '/api/import/products'
          : selectedType === 'customers'
          ? '/api/import/customers'
          : '/api/import/opening-stock';

      const res = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'حدث خطأ أثناء استيراد البيانات');
      } else {
        setResult(data.summary);
      }
    } catch (err: any) {
      setError(err.message || 'فشل الاتصال بالخادم');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileSpreadsheet className="h-6 w-6 text-blue-600" />
          مركز الاستيراد السريع من ملفات Excel
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          قم بتحميل قوالب الإكسل المجهزة، واملأ بيانات الأصناف والعملاء والمخزون، وارفعها بنقرة واحدة
        </p>
      </div>

      {/* Type selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {importTypes.map((t) => {
          const Icon = t.icon;
          const isSelected = selectedType === t.id;
          return (
            <div
              key={t.id}
              onClick={() => {
                setSelectedType(t.id);
                setFile(null);
                setResult(null);
                setError(null);
              }}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                isSelected
                  ? 'border-blue-600 bg-blue-50/40 shadow-md ring-2 ring-blue-500/20'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`p-2.5 rounded-xl ${
                    isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadTemplate(t.id);
                  }}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium bg-white px-2.5 py-1 rounded-lg border border-blue-200 shadow-sm"
                  title="تحميل قالب Excel جاهز"
                >
                  <Download className="h-3.5 w-3.5" />
                  تحميل القالب
                </button>
              </div>
              <h3 className="font-bold text-gray-900 text-base">{t.title}</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">{t.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Upload Box */}
      <form onSubmit={handleUpload} className="bg-white rounded-2xl border shadow-sm p-6 space-y-6">
        <div className="border-2 border-dashed border-gray-300 hover:border-blue-500 rounded-2xl p-8 text-center transition-colors">
          <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
          <div className="text-sm font-semibold text-gray-800">
            {file ? file.name : 'اسحب وأفلت ملف الـ Excel هنا، أو انقر للاختيار'}
          </div>
          <p className="text-xs text-gray-400 mt-1">يدعم صيغ xlsx و xls فقط</p>
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={(e) => {
              if (e.target.files?.[0]) setFile(e.target.files[0]);
            }}
            className="hidden"
            id="excel-file-input"
          />
          <label
            htmlFor="excel-file-input"
            className="inline-block mt-4 px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium cursor-pointer transition-colors"
          >
            استعراض الملفات
          </label>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => downloadTemplate(selectedType)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <Download className="h-4 w-4" />
            تحميل النموذج الفارغ
          </button>
          <button
            type="submit"
            disabled={!file || uploading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-8 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all"
          >
            {uploading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                جارٍ فحص واستيراد البيانات…
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                بدء الاستيراد الآن
              </>
            )}
          </button>
        </div>
      </form>

      {/* Results View */}
      {result && (
        <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-lg">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            تم الانتهاء من عملية الاستيراد بنجاح!
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div className="bg-white p-3.5 rounded-xl border border-emerald-100 shadow-sm">
              <div className="text-xs text-gray-500">إجمالي الصفوف المفحوصة</div>
              <div className="text-xl font-bold text-gray-900 mt-0.5">{result.totalRows}</div>
            </div>
            {result.createdCount !== undefined && (
              <div className="bg-white p-3.5 rounded-xl border border-emerald-100 shadow-sm">
                <div className="text-xs text-gray-500">سجلات جديدة تم إنشاؤها</div>
                <div className="text-xl font-bold text-emerald-600 mt-0.5">{result.createdCount}</div>
              </div>
            )}
            {result.updatedCount !== undefined && (
              <div className="bg-white p-3.5 rounded-xl border border-emerald-100 shadow-sm">
                <div className="text-xs text-gray-500">سجلات تم تحديثها</div>
                <div className="text-xl font-bold text-blue-600 mt-0.5">{result.updatedCount}</div>
              </div>
            )}
            {result.processedCount !== undefined && (
              <div className="bg-white p-3.5 rounded-xl border border-emerald-100 shadow-sm">
                <div className="text-xs text-gray-500">سجلات تم معالجتها</div>
                <div className="text-xl font-bold text-emerald-600 mt-0.5">{result.processedCount}</div>
              </div>
            )}
            <div className="bg-white p-3.5 rounded-xl border border-emerald-100 shadow-sm">
              <div className="text-xs text-gray-500">أخطاء التنسيق / تخطي</div>
              <div
                className={`text-xl font-bold mt-0.5 ${
                  result.errorCount > 0 ? 'text-red-600' : 'text-gray-900'
                }`}
              >
                {result.errorCount}
              </div>
            </div>
          </div>

          {result.errors && result.errors.length > 0 && (
            <div className="mt-4 bg-white p-4 rounded-xl border border-red-200">
              <div className="text-xs font-bold text-red-700 mb-2">ملاحظات وسجلات لم يتم استيرادها:</div>
              <ul className="text-xs text-red-600 space-y-1 list-disc list-inside max-h-40 overflow-y-auto">
                {result.errors.map((e: string, i: number) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
