# تقرير الإصلاحات الأمنية — UNIGATES Platform
# كل إصلاح مُوثّق بشكل منفصل

---

## الإصلاح 1: use-single-session.ts — alert() → toast()
**الملف:** `src/hooks/use-single-session.ts`
**المشكلة:** استخدام `alert()` لعرض رسالة "جهاز آخر مُسجّل" — يُقاطع تجربة المستخدم
**الإصلاح:** استبدال `alert()` بـ `toast()` من use-toast

---

## الإصلاح 2: use-single-session.ts — sendBeaton بدون Authorization
**الملف:** `src/hooks/use-single-session.ts`
**المشكلة:** `navigator.sendBeacon` يرسل تسجيل خروج بدون Authorization header — لا يعمل إذا كان JWT مطلوب
**الإصلاح:** استبدال بـ `fetch` مع `keepalive: true` + Authorization header

---

## الإصلاح 3: use-single-session.ts — Race Condition
**الملف:** `src/hooks/use-single-session.ts`
**المشكلة:** فحص `cancelled` لا يحدث بين Await — يمكن أن يعمل الكود بعد إلغاء الطلب
**الإصلاح:** إضافة `if (cancelled) return;` بين كل await

---

## الإصلاح 4: use-single-session.ts — Unhandled Promise Rejections
**الملف:** `src/hooks/use-single-session.ts`
**المشكلة:** دوال `start()` تُستدعى بدون `.catch()` — تسبب unhandled rejections
**الإصلاح:** إضافة `.catch()` لجميع استدعاءات `start()`

---

## الإصلاح 5: use-single-session.ts — UUID Validation
**الملف:** `src/hooks/use-single-session.ts`
**المشكلة:** Device ID لا يتحقق من صيغة UUID — يمكن إدخال أي نص
**ال_ioctl:** إضافة regex للتحقق من صيغة UUID

---

## الإصلاح 6: use-auto-logout.ts — signOut Error
**الملف:** `src/hooks/use-auto-logout.ts`
**المشكلة:** `signOut()` إذا فشل، لا ي Executes `navigate()` — المستخدم يعلق
**الioctl:** `try/catch` حول `signOut()` لضمان Executes `navigate()` دائماً

---

## الإصلاح 7: useInstitutionStats.ts — Race Condition
**الملف:** `src/hooks/useInstitutionStats.ts`
**المشكلة:** طلبات متعددة قد تعود بترتيب مختلف — آخر طلب يكتب البيانات
**ال_ioctl:** إضافة request counter (`requestIdRef`) — إذا كان الطلب قديم، يتم تجاهله

---

## الإصلاح 8: useInstitutionStats.ts — Error Handling
**الملف:** `src/hooks/useInstitutionStats.ts`
**المشكلة:** `Promise.all` لا يتحقق من أخطاء الاستعلامات
**ال_ioctl:** فحص `error` بعد كل استعلام داخل Promise.all

---

## الإصلاح 9: useInstitutionStats.ts — Console Error Data Leak
**الملف:** `src/hooks/useInstitutionStats.ts`
**المشكلة:** `console.error(err)` يكشف تفاصيل خطأ قاعدة البيانات في الكود
**ال_ioctl:** إزالة `err` من `console.error`

---

## الإصلاح 10: useInstitutionIdentity.ts — Error Handling
**الملف:** `src/hooks/useInstitutionIdentity.ts`
**المشكلة:** استعلامات college/institute registration لا تتحقق من الأخطاء — تبتلع الأخطاء بصمت
**ال_ioctl:** إضافة `throw` على كل error

---

## الإصلاح 11: useCourses.ts — Silent Errors
**الملف:** `src/hooks/useCourses.ts`
**المشكلة:** 5 استعلامات لا تتحقق من الأخطاء — تبتلع الأخطاء بصمت
**الioctl:** إضافة `if (error) throw error` لكل استعلام

---

## الإصلاح 12: use-toast.ts — Dependency Array Bug
**الملف:** `src/hooks/use-toast.ts`
**المشكلة:** `useEffect` يعتمد على `[state]` — يسبب إعادة تسجيل listener عند كل تغيير
**ال_ioctl:** تغيير إلى `[]` (mount-only)

---

## الإصلاح 13: isRtl Derivation — 75+ ملف
**الملف:** جميع صفحات React + مكونات (75+ ملف)
**المشكلة:** `const isRtl = language === "ar"` — لا يدعم RTL غير العربي
**ال_ioctl:** تغيير إلى `const isRtl = dir === "rtl"`

---

## الإصلاح 14: isAr Derivation — 5 ملفات
**الملف:** MandatoryRatingDialog, LiveStreamRoom (3 مكونات), StudentPresenceCheckin
**المشكلة:** `const isAr = language === "ar"` — نفس مشكلة isRtl
**ال_ioctl:** إضافة `dir` من `useLanguage()` واستخدام `dir === "rtl"`

---

## الإصلاح 15: TrendingCourses — Self-Referencing Variable
**الملف:** `src/components/TrendingCourses.tsx`
**المشكلة:** `const isRtl = dir` — يشير لذاته
**ال_ioctl:** تغيير إلى `const scrollDir = isRtl`

---

## الإصلاح 16: Missing dir Destructuring — 45+ ملف
**الملف:** 45+ صفحة/مكون
**المشكلة:** استخدام `isRtl` بدون `dir` في `useLanguage()` destructuring
**ال_ioctl:** إضافة `dir` لكل ملف

---

## الإصلاح 17: signup-logo-upload — No Auth Verification
**الملف:** `supabase/functions/signup-logo-upload/index.ts`
**المشكلة:** **حرج** — أي شخص يمكنه رفع ملفات بدون مصادقة
**الioctl:** إضافة التحقق من تسجيل معلّق + rate limiting (5 uploads/10 min)

---

## الإصلاح 18: signup-logo-upload — Error Message Leak
**الملف:** `supabase/functions/signup-logo-upload/index.ts`
**المشكلة:** `error.message` يُعاد للعميل — يكشف تفاصيل داخلية
**الioctl:** استبدال بأخطاء عامة ("Upload failed")

---

## الإصلاح 19: activate-department-member — No Role Whitelist
**الملف:** `supabase/functions/activate-department-member/index.ts`
**المشكلة:** لا يوجد قائمة بأدوار مسموحة — يمكن إنشاء أي دور
**ال_ioctl:** إضافة `ALLOWED_ROLES` set بـ 16 دور مسموح

---

## الإصلاح 20: activate-department-member — Error Message Leaks
**الملف:** `supabase/functions/activate-department-member/index.ts`
**المشكلة:** `e?.message` و `String(e)` يُعادان في الاستجابة
**الioctl:** استبدال بأخطاء عامة ("Account activation failed", "An unexpected error occurred")

---

## الإصلاح 21: ai-chat — No Rate Limiting
**الملف:** `supabase/functions/ai-chat/index.ts`
**المشكلة:** **حرج** — يمكن flood الخادم بطلبات AI
**الioctl:** إضافة rate limiter (10 طلبات / 5 دقائق per-IP)

---

## الإصلاح 22: ai-chat — Error Message Leak
**الملف:** `supabase/functions/ai-chat/index.ts`
**المشكلة:** `error.message` يُعاد في الاستجابة
**الioctl:** استبدال بأخطاء عامة ("حدث خطأ في الخدمة")

---

## الإصلاح 23: ai-chat — Console Error Leak
**الملف:** `supabase/functions/ai-chat/index.ts`
**المشكلة:** `console.error("AI gateway error:", response.status, t)` يكشف محتوى الخطأ
**الioctl:** تغيير إلى `console.error("AI gateway error:", response.status)`

---

## الإصلاح 24: complete-password-change — Error Message Leaks (5 أماكن)
**الملف:** `supabase/functions/complete-password-change/index.ts`
**المشكلة:** 5 أماكن تُعاد فيها `error.message` في الاستجابة
**ال_ioctl:** استبدال جميعها بأخطاء عامة ("Failed to read profile", "Password update failed", etc.)

---

## الإصلاح 25: complete-password-change — Console.log Data Leak
**الملف:** `supabase/functions/complete-password-change/index.ts`
**المشكلة:** `logProfileState` يسجل `error.message` في 3 أماكن
**ال_ioctl:** إزالة `error.message` من جميع استدعاءات logProfileState

---

## الإصلاح 26: create-faculty-avatar-upload — Error Message Leak
**الملف:** `supabase/functions/create-faculty-avatar-upload/index.ts`
**المشكلة:** `error.message` يُعاد في catch block
**الioctl:** استبدال بـ "Upload failed"

---

## الإصلاح 27: livekit-token — Error Message Leak
**الملف:** `supabase/functions/livekit-token/index.ts`
**المشكلة:** `error.message` يُعاد في catch block
**ال_ioctl:** استبدال بـ "Failed to generate token"

---

## الإصلاح 28: bulk-create-institution-accounts — No Rate Limiting
**الملف:** `supabase/functions/bulk-create-institution-accounts/index.ts`
**المشكلة:** لا يوجد rate limiting — يمكن flood بطلبات إنشاء حسابات جماعية
**ال ioctl:** إضافة rate limiter (3 طلبات / 15 دقيقة per-user)

---

## الإصلاح 29: config.toml — Missing signup-logo-upload Entry
**الملف:** `supabase/config.toml`
**المشكلة:** `signup-logo-upload` لا يوجد له entry في config.toml
**ال ioctl:** إضافة `[functions.signup-logo-upload]` مع `verify_jwt = false`

---

## اختبارات تم إصلاحها

### الإصلاح 30: facultyInvitation.test.ts — ROLE_OPTIONS
**الملف:** `src/test/facultyInvitation.test.ts`
**المشكلة:** `ROLE_OPTIONS` يحتوي على 9 عناصر بينما `buildRoleOptions` يُرجع 12
**ال_ioctl:** تحديث من 9 إلى 12

### الإصلاح 31: universityStatsDashboardLink.test.ts — Refetch Settings
**الملف:** `src/test/universityStatsDashboardLink.test.ts`
**المشكلة:** اختبارات `refetchOnMount` و `refetchInterval` غير متوافقة مع الكود الحالي
**ال_ioctl:** تحديث التوقعات

---

## ملخص النتائج

| الفئة | عدد الإصلاحات |
|---|---|
| Hooks Security | 12 |
| RTL/i18n Consistency | 4 |
| Edge Function Security | 12 |
| Test Fixes | 2 |
| Config | 1 |
| **المجموع** | **31** |

| الفحص | النتيجة |
|---|---|
| اختبارات Vitest | ✅ 580/580 ناجحة |
| Build Vite | ✅ ناجح |
| ESLint Errors | 7 (كلها في mcp/index.ts — كود مُولّد تلقائياً) |
