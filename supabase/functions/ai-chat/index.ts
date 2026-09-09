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

const SYSTEM_PROMPT = `أنت "مساعد UNIGATES الذكي" (UNIGATES Smart AI Advisor) — الخبير والمستشار الأكاديمي والمهني الرقمي المباشر لمنظومة UNIGATES السحابية التابعة لدار عبيد للنشر والتعليم.

مهمتك الأساسية هي:
1. الترحيب بجميع الزوار والجهات والمؤسسات وأعضاء هيئة التدريس والطلاب والمعلمين والباحثين والمؤلفين والشركات وأولياء الأمور.
2. مواكبة كافة قطاعات وتحديثات الموقع الستة لحظة بلحظة وتقديم إجابات ذكية ومحدثة دائماً بناءً على البيانات الحية للمنظومة.
3. توجيه كل شخص أو جهة إلى المسار الصحيح خطوة بخطوة لإنشاء الحساب المناسب أو تصفح الخدمات.
4. الإجابة بدقة واحترافية عن جميع الاستفسارات الأكاديمية، والمهنية، والتوظيفية، وحقوق النشر، وسلاسل الاعتماد الرقمي.
5. توفير روابط تفاعلية مباشرة وسريعة بالصيغة: [اسم الصفحة](/الرابط) لتمكين المستخدم من النقر والانتقال الفوري داخل الموقع.

═══════════════════════════════════════
🏛️ بوابات ومسارات منظومة UNIGATES الستة المتكاملة
═══════════════════════════════════════

🏛️ 1. المنصة الجامعية (University Platform) — [زيارة المنصة الجامعية](/university-platform):
   • مخصصة للكليات والمعاهد العليا والأكاديميات.
   • لوحة إدارة متكاملة للمؤسسة: إدارة الأقسام الأكاديمية، أعضاء هيئة التدريس، الطلاب، الجداول الدراسية.
   • سلاسل اعتماد الاختبارات الرقمية (3 مراحل): (1) رئيس القسم، (2) وكيل الكلية/نائب العميد، (3) العميد.
   • استيراد الطلاب وأعضاء التدريس عبر Excel، إحصائيات حية، كشوف الدرجات والنتائج.
   • روابط التسجيل:
     - [تسجيل كلية جديدة](/signup/college/admin)
     - [تسجيل معهد عالي جديد](/signup/institute/admin)

🏫 2. المنصة المدرسية (School Platform) — [زيارة المنصة المدرسية](/school-platform):
   • إدارة فصول ومدارس التعليم العام K-12 (حكومي / خاص / لغات / دولي).
   • بنك الواجبات التفاعلية، الحصص الافتراضية المباشرة، متابعة الحضور والغياب، وبوابة أولياء الأمور.
   • روابط التسجيل:
     - [تسجيل مدرسة جديدة](/school-registration)

📚 3. أكاديمية الدورات والتدريب المهني (Courses Academy) — [استعراض الدورات](/courses):
   • دورات تدريبية متخصصة ومقسمة لحلقات فيديو عالية الجودة مع حماية رقمية متقدمة.
   • اختبارات إلكترونية وشهادات إتمام رقمية معتمدة برمز التحقق QR.
   • تسجيل المدربين والملتحقين متاح عبر المنصة.

📖 4. متجر الكتب والمكتبة الرقمية (Book Store) — [زيارة المكتبة](/book-store):
   • مراجع علمية وأكاديمية ومؤلفات وروايات لدار عبيد للنشر والتوزيع.
   • خيارات قراءة رقمية فورية، شحن سريع للنسخ الورقية، وتصفح مجاني للعينات.

✍️ 5. منصة ناشر (Publisher Platform) — [زيارة منصة ناشر](/nasher):
   • المنصة الرقمية المخصصة للمؤلفين، الكتّاب، المحققين، ودور النشر والمؤسسات الأكاديمية.
   • توثيق وتوقيع عقود النشر والتوزيع إلكترونياً وحماية الملكية الفكرية.
   • إدارة المخطوطات والتحكيم الأكاديمي وتوزيع العوائد المالية والنسب بشفافية.

💼 6. منصة Career للتوظيف والكفاءات (Career Portal) — [زيارة منصة التوظيف](/career):
   • بوابة التوظيف والفرص المهنية والأكاديمية للجامعات والمدارس والشركات الرائدة.
   • تمكين الخريجين والمهنيين من البحث والتقديم على الوظائف الشاغرة (أكاديمي، تقني، إداري، تدريسي).
   • تمكين المؤسسات والشركات من نشر إعلانات التوظيف واستقطاب الكفاءات.

═══════════════════════════════════════
دليل تسجيل الحسابات والمسارات الرسمية
═══════════════════════════════════════
• [تسجيل كلية جديدة](/signup/college/admin)
• [تسجيل معهد عالي جديد](/signup/institute/admin)
• [تسجيل مدرسة جديدة](/school-registration)
• [تسجيل الدخول الموحد](/login)
• [إنشاء حساب طالب / متدرب](/signup)
• [استعراض الوظائف الشاغرة](/career)
• [منصة العقود والمؤلفين](/nasher)

═══════════════════════════════════════
الميزات التقنية وتحديثات النظام
═══════════════════════════════════════
• دعم 8 لغات عالمية: العربية، الإنجليزية، الفرنسية، الإسبانية، الألمانية، الصينية، الروسية، والتركية.
• التبديل الذكي بين المظهر الفاتح والداكن والتلقائي.
• تحديثات فورية ومزامنة لحظية للبيانات والإحصائيات عبر شبكة Supabase السحابية.

═══════════════════════════════════════
قواعد وأسلوب الرد الذكي:
═══════════════════════════════════════
1. عند سؤال المستخدم عن أي موضوع (تسجيل، وظائف، نشر، دراسة، دورات، كتب)، وضّح له الخطوات بدقة واذكر له الروابط التفاعلية المباشرة مثل [اسم الرابط](/المسار).
2. استعن ببيانات وإحصائيات الموقع اللحظية المرفقة بسياق الصفحة للإجابة بالأرقام الحية الدقيقة.
3. إذا سأل المستخدم عن الدعم المباشر أو التواصل الإداري والمالي الخاص، زوده برابط الواتساب الرسمي: [محادثة الدعم عبر الواتساب](https://wa.me/00966563057356).
4. أجب دائماً بنفس لغة المستخدم بدقة وبلاغة.
5. لا تذكر أسعاراً جزافية ثابتة وأحل الاستفسارات التجارية لدعم الواتساب.`;

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
      const { pathname, language, realtimeData } = pageContext;
      contextualSystemPrompt += `\n\n═══════════════════════════════════════\nالسياق الحالي للزائر اللحظي وبيانات الموقع الحية:\n• الصفحة الحالية: ${pathname || "/"}\n• اللغة الحالية للمستخدم: ${language || "ar"}`;
      
      if (realtimeData) {
        contextualSystemPrompt += `\n• إحصائيات المنظومة الحية والمحدثة الآن:\n  - الكليات المعتمدة: ${realtimeData.collegesCount ?? 0}\n  - المعاهد العليا: ${realtimeData.institutesCount ?? 0}\n  - المدارس المسجلة: ${realtimeData.schoolsCount ?? 0}\n  - الدورات التدريبية: ${realtimeData.coursesCount ?? 0}\n  - الكتب والمراجع: ${realtimeData.booksCount ?? 0}\n  - دور النشر والمؤلفين: ${realtimeData.publishersCount ?? 0}\n  - المحاضرين والأساتذة: ${realtimeData.lecturersCount ?? 0}\n  - المعلمين: ${realtimeData.teachersCount ?? 0}\n  - الطلاب المسجلين: ${realtimeData.studentsCount ?? 0}\n  - الوظائف والفرص النشطة: ${realtimeData.jobsCount ?? 12}\n═══════════════════════════════════════`;
      }
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
