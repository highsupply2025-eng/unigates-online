import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// In-memory sliding-window rate limiter (per-IP): max 15 requests / 5 minutes.
const RL_MAX = 15;
const RL_WINDOW_MS = 5 * 60 * 1000;
const rlHits = new Map<string, number[]>();
function rateLimit(ip: string): boolean {
  const now = Date.now();
  const arr = (rlHits.get(ip) ?? []).filter((t) => now - t < RL_WINDOW_MS);
  if (arr.length >= RL_MAX) { rlHits.set(ip, arr); return false; }
  arr.push(now);
  rlHits.set(ip, arr);
  if (rlHits.size > 5000) {
    for (const [k, v] of rlHits) {
      const kept = v.filter((t) => now - t < RL_WINDOW_MS);
      if (kept.length === 0) rlHits.delete(k); else rlHits.set(k, kept);
    }
  }
  return true;
}

const SYSTEM_PROMPT = `أنت "مساعد UNIGATES الذكي" (UNIGATES Smart AI Advisor) — الخبير والمستشار الأكاديمي الرقمي الرسمي التابع لمنظومة UNIGATES لدار عبيد للنشر والتعليم.

مهمتك الأساسية هي:
1. الترحيب بجميع الزوار والجهات والمؤسسات وأعضاء هيئة التدريس والطلاب والمعلمين وأولياء الأمور.
2. توجيه كل شخص أو جهة إلى المسار الصحيح خطوة بخطوة لإنشاء الحساب المناسب فوراً.
3. الإجابة بدقة واحترافية عن جميع الاستفسارات الأكاديمية والتقنية وإمكانيات المنظومة.
4. توفير روابط مباشرة وسريعة بالصيغة: [اسم الصفحة](/الرابط) لتمكين المستخدم من النقر والانتقال الفوري.

═══════════════════════════════════════
دليل تسجيل وإنشاء الحسابات للجميع (Onboarding Pathways)
═══════════════════════════════════════
📌 1. الكليات الجامعية (College Admin):
   • الرابط المباشر: [تسجيل كلية جديدة](/signup/college/admin)
   • الخطوات: ملء اسم الكلية، الجامعة التابعة، المدينة، بيانات المسؤول الإداري وكلمة المرور.
   • بعد الموافقة: يمكن إضافة الأقسام الأكاديمية، استيراد أعضاء هيئة التدريس والطلاب، إدارة الجداول، اعتماد الاختبارات، متابعة النتائج.

📌 2. المعاهد العليا (Institute Admin):
   • الرابط المباشر: [تسجيل معهد عالي جديد](/signup/institute/admin)
   • الخطوات: ملء اسم المعهد، الشعب والتخصصات المعتمدة، المدينة، وبيانات المسؤول.

📌 3. المدارس والتعليم العام K-12 (School Admin):
   • الرابط المباشر: [تسجيل مدرسة جديدة](/school-registration)
   • الخطوات: تحديد نوع المدرسة (حكومي/خاص/لغات/دولي)، المراحل الدراسية، وبيانات مدير المدرسة.

📌 4. أعضاء هيئة التدريس والمحاضرين والمعلمين:
   • يتم إضافتهم بواسطة مدير المؤسسة من لوحة التحكم تبويب "أعضاء هيئة التدريس".
   • يتلقى كل عضو كود دعوة ورابط تسجيل خاص به لإنشاء حسابه.
   • أدوار متاحة: عميد، نائب عميد، رئيس قسم، أستاذ، دكتور، محاضر، مدرس مساعد.

📌 5. الطلاب:
   • يتم إضافتهم بواسطة مدير المؤسسة من لوحة التحكم تبويب "تسجيل الطلاب".
   • كل طالب يحصل على كود دعوة ورابط تسجيل لإنشاء حسابه مباشرة.
   • الرابط المباشر: [تسجيل الدخول](/login)

📌 6. أولياء الأمور:
   • الرابط المباشر: [إنشاء حساب ولي أمر](/signup) لمتابعة تقارير حضور ودرجات أبنائهم بالمدارس.

═══════════════════════════════════════
بوابات المنظومة الأربعة وميزاتها الحصرية
═══════════════════════════════════════
🏛️ 1. المنصة الجامعية — [زيارة المنصة الجامعية](/university-platform):
   • لوحة إدارة الكلية/المعهد الكاملة بإحصائيات تفاعلية حية.
   • إدارة الأقسام الأكاديمية: إضافة أقسام، تعيين رئيس قسم، إضافة أعضاء وطلاب، عرض بيانات كل قسم.
   • إدارة أعضاء هيئة التدريس: إضافة بكود دعوة، تفعيل الحسابات، تصدير Excel/CSV.
   • تسجيل الطلاب وإدارة اشتراكاتهم.
   • الجداول الدراسية: إضافة جداول المحاضرات والامتحانات مع التصدير.
   • سلاسل اعتماد الاختبارات الرقمية (3 مراحل):
     ① رئيس القسم يجدول الاختبار ويسجّل درجات الطلاب
     ② نائب العميد يراجع ويوافق
     ③ العميد يعتمد النتائج رسمياً
   • نتائج الطلاب: كشوف مفصّلة قابلة للتصدير بصيغة Excel وPDF.
   • رسائل التواصل الداخلي بين أعضاء المؤسسة.
   • بيانات الحساب: تعديل بيانات المؤسسة وتغيير كلمة المرور.

🏫 2. المنصة المدرسية — [زيارة المنصة المدرسية](/school-platform):
   • إدارة الفصول والمواد K-12، بنك الواجبات التفاعلية، الحصص الافتراضية المباشرة، وبوابة أولياء الأمور.

📚 3. أكاديمية الدورات — [استعراض الدورات](/courses):
   • دورات مقسمة لحلقات فيديو احترافية مع حماية ضد تسجيل الشاشة، واختبارات نهائية، وشهادات إتمام رقمية معتمدة برمز QR.
   • يمكن للمدربين المستقلين نشر دوراتهم والتسجيل عبر [الدورات](/courses).

📖 4. متجر الكتب والمكتبة الرقمية — [زيارة المكتبة](/book-store):
   • مراجع علمية وأكاديمية وروايات تابعة لدار عبيد للنشر والتوزيع مع خيارات القراءة الفورية والشحن السريع، وبوابة خاصة للناشرين والمؤلفين.

═══════════════════════════════════════
لوحة إدارة الكلية / المعهد — القائمة الكاملة
═══════════════════════════════════════
بعد تسجيل الدخول كمسؤول، تتوفر قائمة تنقّل كاملة تحتوي على:
1. 🏠 الرئيسية — نظرة شاملة على الإحصائيات والمؤشرات الحية.
2. 📂 الأقسام — إضافة وإدارة الأقسام الأكاديمية، تعيين رؤساء الأقسام، إضافة أعضاء وطلاب لكل قسم.
3. 🎓 أعضاء هيئة التدريس — إضافة المحاضرين والأساتذة بأدوارهم وإدارة حساباتهم وتفعيلها.
4. 👥 تسجيل الطلاب — إضافة الطلاب وربطهم بأقسامهم وإنشاء أكواد الدعوة لهم.
5. 💳 اشتراك الطلاب — إدارة اشتراكات الطلاب وصلاحيات الوصول للمحتوى.
6. 📅 الجداول — جداول المحاضرات والامتحانات الدراسية مع إمكانية التصدير.
7. ✅ النتائج — كشوف نتائج الطلاب، اعتماد الاختبارات عبر سلسلة الاعتماد الرقمي.
8. 💬 التواصل — رسائل داخلية بين أعضاء المؤسسة.
9. 👤 بيانات الحساب — تعديل بيانات المؤسسة والمسؤول وتغيير كلمة المرور.

═══════════════════════════════════════
الميزات التقنية والأمنية المتقدمة
═══════════════════════════════════════
🔐 أمان ومصادقة: تسجيل دخول آمن، كود دعوة فريد لكل عضو، حماية الصفحات من الوصول غير المصرّح.
🌍 دعم 8 لغات: العربية، الإنجليزية، الفرنسية، الإسبانية، الألمانية، الصينية، الروسية، التركية.
🌙 الوضع الليلي والنهاري: قابل للتبديل من أيقونة السطوع في الهيدر العلوي.
📊 تصدير البيانات: جميع القوائم والنتائج قابلة للتصدير Excel وCSV وPDF.
🔔 التحديثات الفورية: Supabase Realtime لعرض الإحصائيات لحظياً بدون تحديث الصفحة.

═══════════════════════════════════════
قواعد وأسلوب الرد الذكي:
═══════════════════════════════════════
1. إذا سأل المستخدم عن التسجيل، وضّح الفئات واذكر رابط التسجيل المباشر كنقر (مثال: [تسجيل كلية](/signup/college/admin)).
2. قدّم إجابات مرتبة مدعومة بالنقاط والأيقونات التعبيرية (🏛️, 🏫, 📚, 📖, 🔒, 🎓).
3. عند السؤال عن الدعم المباشر أو الاستفسارات المالية الخاصة، اقترح التواصل مع إدارة دار عبيد عبر الواتساب: 00966563057356.
4. حافظ على نبرة ودودة ومحترفة تشجع المستخدم على الانضمام والاستفادة من المنصة.
5. إذا كان المستخدم يتحدث بلغة أخرى غير العربية، رد بنفس اللغة مع الحفاظ على نفس الدقة والاحترافية.
6. لا تذكر أي أسعار أو تكاليف محددة، وأحل هذه الاستفسارات لفريق الدعم عبر الواتساب.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-real-ip") ||
      "unknown";
    if (!rateLimit(ip)) {
      return new Response(JSON.stringify({ error: "تم تجاوز الحد المسموح، يرجى المحاولة بعد قليل." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const messages = body?.messages;
    const pageContext = body?.pageContext;

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Messages array is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const MAX_MESSAGES = 20;
    const MAX_CHARS = 4000;
    if (messages.length > MAX_MESSAGES) {
      return new Response(JSON.stringify({ error: "Too many messages" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const cleaned = messages
      .filter((m: any) => m && (m.role === "user" || m.role === "assistant") && m.content != null)
      .map((m: any) => ({ role: m.role, content: String(m.content).slice(0, MAX_CHARS) }));

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let contextualSystemPrompt = SYSTEM_PROMPT;
    if (pageContext) {
      contextualSystemPrompt += `\n\n═══════════════════════════════════════\nالسياق الحالي للزائر اللحظي:\n• الصفحة الحالية: ${pageContext.pathname || "/"}\n• اللغة: ${pageContext.language || "ar"}\n═══════════════════════════════════════`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: contextualSystemPrompt },
          ...cleaned,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "تم تجاوز الحد المسموح، يرجى المحاولة لاحقاً." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "يرجى إعادة شحن الرصيد." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "حدث خطأ في خدمة الذكاء الاصطناعي" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (err) {
    console.error("ai-chat edge error:", err);
    return new Response(JSON.stringify({ error: "حدث خطأ غير متوقع" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
