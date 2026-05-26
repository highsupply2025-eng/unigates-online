# إصلاح صفحة البث التجريبي للطالب

## المشكلة
في `src/pages/StudentLiveDetail.tsx` (صفحة البث التجريبي) زر **"انضم للبث"** عبارة عن `<Button>` بدون `onClick` ولا أي تنقل — لذلك لا يعمل عند الضغط.

## الخطة

### 1. تفعيل زر الانضمام
- إضافة `useNavigate` وتوجيه الزر عند الضغط إلى `/stream/${streamId}` (نفس المسار الموجود في `App.tsx` لمشغّل `WatchStream` + `LiveStreamRoom`).
- لو لم يوجد `streamId` (الحالة التجريبية المباشرة) نمرّر `demo-1`.
- تحويل قسم الشاشة العلوية (الـ aspect-video) إلى عنصر قابل للنقر أيضاً (cursor-pointer + نفس التنقل) لتجربة أوضح.

### 2. إبراز الألوان والأيقونات والخط (داخل نفس الصفحة فقط)
- **العنوان**: تكبير الخط إلى `text-2xl sm:text-3xl font-extrabold` مع `tracking-tight` وإضافة accent gradient أحمر/وردي تحت العنوان.
- **شارة LIVE**: تكبير الحجم، إضافة حلقة توهج (`ring-2 ring-red-500/40` + `shadow-lg shadow-red-500/40`).
- **أيقونات المعلومات** (المحاضر/التاريخ/المشاهدين): وضعها داخل دوائر ملوّنة صغيرة (`bg-primary/10 text-primary rounded-full p-2`) بدل أيقونات عادية، مع تكبير الخط بجانبها إلى `text-base font-semibold`.
- **زر الانضمام**: تكبيره (`size="lg"`)، gradient أحمر (`bg-gradient-to-r from-red-500 to-rose-600`)، أيقونة Radio أكبر مع `animate-pulse`، تأثير hover (`hover:shadow-xl hover:shadow-red-500/40 hover:scale-[1.02]`).
- **عنوان قسم الدردشة**: تكبير الخط مع أيقونة داخل خلفية ملوّنة.
- الالتزام بالـ design tokens (primary, foreground, muted) ولا نضيف ألوان مخصصة جديدة خارج الأحمر الموجود للبث المباشر.

## الملفات المتأثرة
- `src/pages/StudentLiveDetail.tsx` (تعديل فقط — لا تغييرات على قاعدة البيانات أو منطق الـ backend).
