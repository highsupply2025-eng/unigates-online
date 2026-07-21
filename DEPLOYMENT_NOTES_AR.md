# نشر إصلاح حفظ عضو هيئة التدريس

## سبب المشكلة

الواجهة ترسل `department_id: null` للعضو غير المعيّن لقسم، لكن نسخة قديمة من
`update-faculty-member` ما زالت منشورة وتشترط وجود القسم. كذلك كانت دالة قاعدة
البيانات القديمة تحدّث `department_members` فقط ولا تحفظ السجل الأساسي في
`institution_faculty_members`.

## الملفات المعدلة

- `src/pages/InstitutionFacultyEdit.tsx`
- `supabase/functions/update-faculty-member/index.ts`
- `supabase/migrations/20260721010000_fix_faculty_edit_without_department.sql`

## ترتيب النشر الإلزامي

1. ارفع المشروع المعدل إلى GitHub/Lovable.
2. طبّق Migration الجديدة على Supabase.
3. انشر Edge Function `update-faculty-member` من النسخة الجديدة.
4. انشر الواجهة بعد نجاح الخطوتين السابقتين.

عند استخدام Supabase CLI:

```bash
npx supabase link --project-ref tgdkxzzkvfyazmnawkpw
npx supabase db push
npx supabase functions deploy update-faculty-member --project-ref tgdkxzzkvfyazmnawkpw
```

ظهور `Missing department_id` بعد تحديث الواجهة يعني أن Edge Function القديمة
ما زالت منشورة. النسخة الصحيحة تعيد القيمة التالية ضمن الاستجابة:

```text
function_version: 2026-07-21-nullable-department-v2
```

## اختبار القبول

1. عدّل الاسم أو المؤهل أو التخصص لعضو بدون قسم ثم احفظ.
2. أعد فتح الصفحة وتأكد أن القيمة الجديدة محفوظة.
3. امسح الملاحظات واحفظ، ثم تأكد أنها أصبحت فارغة.
4. عيّن قسمًا واحفظ.
5. اختر «غير مُعيّن لقسم» واحفظ مرة أخرى.
6. غيّر الصورة، ثم أعد تحميل الصفحة وتأكد أن الصورة الجديدة ما زالت ظاهرة.
