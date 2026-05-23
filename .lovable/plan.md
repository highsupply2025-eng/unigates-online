# تقييمات منفصلة لكل عنصر

## الهدف
كل محاضرة/بث/اختبار/جدول يحصل على تقييم نجوم من الطالب، ويُعرض في صفحة التقييمات للمحاضر ورئيس القسم والعميد والوكلاء، مقسّماً إلى أربعة أقسام.

## التغييرات على قاعدة البيانات
إضافة جداول تقييم لكل نوع (بنفس نمط `live_stream_ratings`):
- `lecture_ratings` (lecture_id → course_episodes, course_id, user_id, rating 1-5, comment)
- `quiz_ratings` (quiz_id, course_id, user_id, rating, comment)
- `schedule_ratings` (schedule_id, course_id, user_id, rating, comment)

سياسات RLS:
- الطالب يقرأ/يضيف تقييمه فقط (UNIQUE على user_id+target_id)
- المحاضر صاحب الكورس يرى تقييمات عناصره
- رئيس القسم/العميد/الوكلاء (has_approved_role) يرون كل التقييمات
- في `schedule_ratings` يُسمح للوكيل المختار في `lecture_schedules.vice_dean_type` أيضاً (نكتفي بصلاحية الوكلاء عموماً للبساطة)

## الواجهة
1. **MandatoryRatingDialog**: توسيع `kind` ليشمل `"quiz"` و`"schedule"`.
2. **StudentQuizDetail**: عند انتهاء الاختبار يظهر الـ dialog ويُدرج في `quiz_ratings`، مع منع التكرار عبر `rating-storage` و الجدول.
3. **StudentScheduleDetail**: عند الضغط على "إنهاء/حضرت" يظهر الـ dialog ويُدرج في `schedule_ratings`.
4. **StudentLectureDetail**: تحويل الكتابة من `lecturer_ratings` إلى `lecture_ratings` الخاص بالحلقة.
5. **مكوّن جديد `RatingsBreakdown`**: تبويبات (محاضرات/بث/اختبارات/جداول) كل تبويب يعرض المتوسط، عدد التقييمات، وآخر التعليقات مع النجوم.
6. **LecturerDashboard** و **LeadershipDashboard**: استبدال محتوى تبويب "التقييمات" بالمكوّن الجديد، مع تصفية بيانات المحاضر على كورساته فقط.

## ملاحظات تقنية
- منع التكرار في storage + DB unique لضمان "تقييم واحد فقط لكل عنصر".
- لا تغيير على تدفقات الموافقة أو الجداول الأخرى.
- نُبقي `lecturer_ratings` كما هو (للتقييم العام للمحاضر) دون كسر.
