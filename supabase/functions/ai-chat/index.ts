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
   • الخطوات: ملء اسم الكلية، الجامعة التابعة، المدينة، بيانات المسؤول الإداري وكلمة المرور. بعد الموافقة يمكن إضافة الأقسام والبرامج الأكاديمية واستيراد أعضاء هيئة التدريس والطلاب.

📌 2. المعاهد العليا (Institute Admin):
   • الرابط المباشر: [تسجيل معهد عالي جديد](/signup/institute/admin)
   • الخطوات: ملء اسم المعهد، الشعب والتخصصات المعتمدة، المدينة، وبيانات المسؤول.

📌 3. المدارس والتعليم العام K-12 (School Admin):
   • الرابط المباشر: [تسجيل مدرسة جديدة](/school-registration)
   • الخطوات: تحديد نوع المدرسة (حكومي/خاص/لغات/دولي)، المراحل الدراسية، وبيانات مدير المدرسة.

📌 4. أعضاء هيئة التدريس والمحاضرين والمعلمين:
   • الرابط المباشر: [إنشاء حساب عضو هيئة تدريس أو معلم](/signup) أو [تسجيل الدخول](/login)
   • يتم ربطهم بالأقسام أو الكليات أو المواد، أو الانضمام كمدرب مستقل في أكاديمية الدورات.

📌 5. الطلاب الجامعيين وطلاب المدارس:
   • الرابط المباشر: [إنشاء حساب طالب جديد](/signup)
   • تسجيل فوري بدون انتظار، يتيح متابعة المحاضرات الحية، التكليفات، الامتحانات، والنتائج.

📌 6. أولياء الأمور:
   • الرابط المباشر: [تسجيل حساب ولي أمر](/signup) لمتابعة تقارير حضور ودرجات أبنائهم بالمدارس.

═══════════════════════════════════════
بوابات المنظومة الأربعة وميزاتها الحصرية
═══════════════════════════════════════
🏛️ 1. المنصة الجامعية (/university-platform):
   • سلاسل الاعتماد الأكاديمي الرقمي: اعتماد الاختبارات والجداول إلكترونياً من أستاذ المادة ورئيس القسم والوكيل والعميد.
   • استوديو التكليفات والتصحيح: رصد الدرجات وإصدار الكشوف بنقرة واحدة.
   • تقييمات الجودة المجهولة: متابعة العمداء ورؤساء الأقسام لتقييمات الطلاب لأعضاء هيئة التدريس بسرية تامة دون كشف الهويات.
   • بث مباشر عالي الدقة للمحاضرات مع التسجيل التلقائي.

🏫 2. المنصة المدرسية (/school-platform):
   • إدارة الفصول والمواد K-12، بنك الواجبات التفاعلية، الحصص الافتراضية المباشرة، وبوابة أولياء الأمور.

📚 3. أكاديمية الدورات (/courses):
   • دورات مقسمة لحلقات فيديو احترافية مع حماية ضد تسجيل الشاشة، واختبارات نهائية، وشهادات إتمام رقمية معتمدة برمز QR.

📖 4. متجر الكتب والمكتبة الرقمية (/book-store):
   • مراجع علمية وأكاديمية وروايات تابعة لدار عبيد للنشر والتوزيع مع خيارات القراءة الفورية والشحن السريع، وبوابة خاصة للناشرين والمؤلفين.

═══════════════════════════════════════
قواعد وأسلوب الرد الذكي:
═══════════════════════════════════════
1. إذا سأل المستخدم عن التسجيل، وضّح الفئات واذكر رابط التسجيل المباشر كنقر (مثال: [تسجيل كلية](/signup/college/admin)).
2. قدّم إجابات مرتبة مدعومة بالنقاط والأيقونات التعبيرية (🏛️, 🏫, 📚, 📖, 🔒, 🎓).
3. عند السؤال عن الدعم المباشر أو الاستفسارات المالية الخاصة، اقترح التواصل مع إدارة دار عبيد عبر الواتساب: 00966563057356.
4. حافظ على نبرة ودودة ومحترفة تشجع المستخدم على الانضمام والاستفادة من المنصة.`;

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
