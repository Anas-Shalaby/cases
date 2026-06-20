# نظام إدارة القضايا

لوحة تحكم عربية (RTL) لإدارة القضايا، متابعة الأطراف، فريق العمل، والمراحل الزمنية — مبنية على **Next.js** و **Supabase**.

---

## المميزات

- واجهة عربية كاملة مع دعم **RTL**
- تسجيل دخول عبر **Supabase Auth**
- **Onboarding** للمستخدمين الجدد (إدخال الاسم عند أول دخول)
- إدارة القضايا: إضافة، تعديل، عرض، حذف (حسب الصلاحية)
- **رقم القضية** و **اسم القضية** — يُدخلان يدوياً
- جدول شامل بفلاتر الحالة والبحث
- بطاقات إحصائية (مفتوحة / متأخرة / مغلقة)
- **مراحل إنجاز القضية** (checkbox) في صفحة التعديل — يُسجَّل تاريخ اليوم تلقائياً عند الإتمام
- زر عائم (+) لإضافة قضية جديدة (للمنسقين)
- صلاحيات حسب الدور (**Row Level Security**)

---

## التقنيات

| التقنية | الاستخدام |
|---------|-----------|
| Next.js 16 (App Router) | الإطار الأساسي |
| TypeScript | الأنواع والأمان |
| Tailwind CSS v4 | التنسيق |
| shadcn/ui + Base UI | مكوّنات الواجهة |
| Supabase | PostgreSQL + Auth + RLS |
| React Hook Form + Zod | النماذج والتحقق |
| Lucide React | الأيقونات |

---

## البدء السريع

### 1. المتطلبات

- Node.js 20+
- npm
- حساب [Supabase](https://supabase.com)

### 2. تثبيت الحزم

```bash
npm install
```

### 3. متغيرات البيئة

انسخ الملف النموذجي وأضف بيانات مشروع Supabase:

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. قاعدة البيانات

#### مشروع جديد (من الصفر)

نفّذ في **Supabase → SQL Editor**:

```
supabase/migrations/001_initial_schema.sql
```

#### مشروع قائم (تحديثات تدريجية)

نفّذ الملفات بالترتيب:

```
002_onboarding.sql
003_case_number.sql      # أو 004_manual_case_number.sql
005_case_name.sql
006_case_milestones.sql
```

### 5. إنشاء مستخدم

1. من Supabase: **Authentication → Users → Add user**
2. سجّل الدخول من `/login`
3. أكمل **Onboarding** عند أول دخول

### 6. تشغيل المشروع

```bash
npm run dev
```

افتح [http://localhost:3000](http://localhost:3000)

---

## الأدوار والصلاحيات

| الدور | الوصف |
|-------|--------|
| `coordinator` (منسق) | صلاحيات كاملة — إنشاء وحذف القضايا |
| `expert` (خبير) | عرض وتعديل القضايا المعيّنة له |
| `assistant` (مساعد) | عرض وتعديل القضايا المعيّنة له |

---

## الصفحات

| المسار | الوصف |
|--------|--------|
| `/login` | تسجيل الدخول |
| `/onboarding` | إعداد الحساب (أول مرة) |
| `/` | لوحة التحكم |
| `/cases` | قائمة القضايا |
| `/cases/new` | إضافة قضية |
| `/cases/[id]` | تفاصيل القضية |
| `/cases/[id]/edit` | تعديل القضية + مراحل الإنجاز |
| `/settings` | إعدادات الملف الشخصي |

---

## بيانات القضية

| الحقل | الوصف |
|-------|--------|
| `case_number` | رقم القضية (يدوي، فريد) |
| `case_name` | اسم القضية (يدوي) |
| `status` | `open` · `delayed` · `closed` |
| `plaintiff_*` | بيانات المدعي |
| `defendant_*` | بيانات المدعي عليه |
| `assignment_date` | تاريخ التكليف |
| `meeting_date` | تاريخ الاجتماع |
| `initial_report_date` | تاريخ التقرير الأولي |
| `final_report_date` | تاريخ التقرير النهائي |
| `coordinator_id` | المنسق |
| `expert_id` | الخبير |
| `assistant_id` | المساعد |

### مراحل الإنجاز (صفحة التعديل)

عند وضع ✓ على مرحلة، يُحفظ تاريخ اليوم في الحقل المقابل:

1. استلام القضية — `case_received_at`
2. دعوة الأطراف — `parties_invited_at`
3. اجتماع الخبراء — `experts_meeting_at`
4. استلام مستندات المدعي عليه — `defendant_documents_received_at`
5. استلام مستندات المدعي — `plaintiff_documents_received_at`
6. إعداد التقرير المبدئي — `initial_report_prepared_at`
7. إعداد التقرير النهائي — `final_report_prepared_at`
8. غلق القضية — `case_closed_at` (يغيّر الحالة إلى `closed` أيضاً)

---

## هيكل المشروع

```
src/
├── app/
│   ├── (dashboard)/       # لوحة التحكم والقضايا
│   ├── login/
│   └── onboarding/
├── components/
│   ├── cases/             # جدول، نموذج، مراحل الإنجاز
│   ├── layout/            # الشريط الجانبي، الزر العائم
│   └── ui/                # shadcn components
├── lib/
│   ├── actions/           # Server Actions
│   ├── supabase/          # عميل Supabase
│   └── validations/       # مخططات Zod
└── types/database.ts

supabase/migrations/       # ملفات SQL
```

---

## أوامر npm

```bash
npm run dev      # التطوير
npm run build    # بناء الإنتاج
npm run start    # تشغيل الإنتاج
npm run lint     # فحص ESLint
```

---

## ملاحظات

- الواجهة بالكامل **عربية** مع `dir="rtl"` وخط **Noto Sans Arabic**
- تأكد من تشغيل جميع migrations قبل استخدام الميزات الجديدة
- في الإنتاج: اضبط **Site URL** و **Redirect URLs** في Supabase Auth

---

## الترخيص

مشروع خاص — للاستخدام الداخلي.
