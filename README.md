# نظام إدارة الموارد المؤسسية (ERP) المتكامل
### لشركة استيراد وتوزيع رولمان البلي وقطع غيار الأجهزة المنزلية

نظام ERP متكامل، حديث، وسريع مبني باستخدام **Next.js 14 (App Router)**، **TypeScript**، **Tailwind CSS**، **Prisma ORM**، وقاعدة بيانات **PostgreSQL**، مصمم خصيصاً للشركات التجارية المصرية.

---

## 🌟 مميزات النظام والوحدات (Modules 1 - 9)

1. **الأساس والمصادقة (Foundation & Auth):** واجهة عربية RTL كاملة مع خيار التحويل للإنجليزية، مصادقة Auth.js v5 مع تحكم دقيق بالصلاحيات (RBAC).
2. **كتالوج الأصناف والرولمان بلي (Products & Bearings):** مواصفات هندسية دقيقة ($d \times D \times B$)، قطع غيار الأجهزة المنزلية وتوافقها، وقوائم أسعار ثلاثية المستويات (جملة، نصف جملة، قطاعي).
3. **الموردين وتكلفة الإنزال (Suppliers & Landed Cost):** أوامر شراء بالعملات الأجنبية (USD, EUR, CNY)، تتبع الشحنات الجمركية، توزيع تكاليف الشحن والجمارك وفق القيمة أو الوزن، وحساب متوسط التكلفة المرجح (WAC) آلياً.
4. **المخازن والمخزون (Inventory & Warehouses):** تعدد المخازن، تحويلات بينية، تسويات جردية، سجل حركة الصنف (Cardex)، وتنبيهات وصول حد إعادة الطلب.
5. **العملاء والديون (Customers & CRM):** ملف العميل 360°، حدود الائتمان، تقرير أعمار الديون (30، 60، 90+ يوماً)، ورابط إرسال مطالبات واتساب بنقرة واحدة للهواتف المصرية.
6. **المبيعات والشيكات (Sales POS & Cheques):** شاشة نقطة بيع سريعة، طباعة الفاتورة الضريبية A4 وإيصال الكاشير الحراري 80mm، سجل كامل للشيكات مع تنبيهات الاستحقاق.
7. **المصروفات والحسابات (Expenses & Finance):** صناديق النقدية، الحسابات البنكية، والمحافظ الإلكترونية، مع تتبع المصروفات الدورية والتحويلات.
8. **لوحة التحكم الذكية (Analytics Dashboard):** مؤشرات أداء تفاعلية (KPIs)، رسوم بيانية (Recharts)، تنبيهات المخزون الراكد والشيكات والديون.
9. **التقارير والاستيراد (Reports & Excel Bulk Import):** تقارير مبيعات وتثمين مخزون، إقرار ضريبة القيمة المضافة 14%، واستيراد جماعي من ملفات Excel عبر قوالب رسمية جاهزة.

---

## 🚀 النشر على Vercel (Deployment on Vercel)

النظام مهيأ وجاهز بالكامل للنشر بنقرة واحدة على Vercel:

### 1. إعداد قاعدة البيانات PostgreSQL
يمكن استخدام أي خدمة سحابية مجانية وسريعة مثل:
- **[Neon](https://neon.tech)** (موصى بها)
- **[Supabase](https://supabase.com)**

### 2. المتغيرات البيئية (Environment Variables) في Vercel:
قم بإضافة المتغيرات التالية في إعدادات مشروعك في Vercel (`Project Settings -> Environment Variables`):

```env
DATABASE_URL="postgresql://user:password@ep-host.region.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://user:password@ep-host.region.neon.tech/neondb?sslmode=require"
AUTH_SECRET="your-32-character-secret-key"
NEXTAUTH_URL="https://your-app.vercel.app"
NEXT_PUBLIC_APP_NAME="نظام إدارة المحامل"
NEXT_PUBLIC_DEFAULT_CURRENCY="EGP"
NEXT_PUBLIC_DEFAULT_LANGUAGE="ar"
```

> **ملاحظة:** تم ضبط أمر البناء آلياً في `vercel.json` لتوليد Prisma Client:
> `prisma generate && next build`

---

## 🧪 الاختبارات الآلية (Unit Tests)
يحتوي النظام على 97 اختباراً آلياً تغطي كافة العمليات المالية والحسابية والمنطقية:
```bash
npm test
```
