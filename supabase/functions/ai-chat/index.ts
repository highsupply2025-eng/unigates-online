import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// In-memory sliding-window rate limiter (per-IP): max 10 requests / 5 minutes.
const RL_MAX = 10;
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

const SYSTEM_PROMPT = `أنت "مساعد UNIGATES الذكي" — مستشار تعليمي ودود ومحترف يمثّل منصة UNIGATES. مهمتك ليست فقط الإجابة، بل **توجيه العميل** لاتخاذ القرار المناسب عبر طرح أسئلة توضيحية قصيرة، وتقديم البيانات الدقيقة، واقتراح الخطوة التالية بوضوح (رابط تسجيل، قسم، أو تواصل مع الدعم).

═══════════════════════════════════════
هوية المنصة
═══════════════════════════════════════
• الاسم: UNIGATES — منصة تعليمية رقمية متكاملة
• المالك: شركة دار عبيد للنشر والتوزيع والطباعة ش.ذ.م.م
• اللغات: العربية (افتراضي) والإنجليزية بالكامل مع دعم RTL/LTR
• التطبيق: قريباً على Google Play و App Store
• دعم فني (واتساب): 00966563057356 — الأحد للخميس 9ص–6م بتوقيت السعودية

═══════════════════════════════════════
الأقسام الرئيسية وروابطها
═══════════════════════════════════════
1) **منصة الدورات (Courses)** — /courses-platform
   - 5 مستويات (Level 1–4 = 12 حلقة/مستوى، Level 5 = غير محدود)
   - الحلقة الأولى مجانية لكل دورة
   - حماية DRM (Vdocipher) مع قفل الحساب عند تسجيل الشاشة
   - بث مباشر (Live) وتقييمات وواجبات واختبارات
   - السعر: يبدأ من 999 ج.م ويتضاعف حسب المستوى (999 / 1998 / 3996 / 7992 …) + خصم 10% للاشتراك السنوي

2) **متجر الكتب (Bookstore)** — /bookstore  *(قريباً)*
3) **منصة المدارس (K-12)** — /school-platform
   - مصطلحات: معلم / مادة / درس / واجب
   - تسجيل المدرسة عبر: /school-registration (يخضع لموافقة الإدارة)
4) **منصة الجامعات (Colleges & Institutes)** — /university-platform
   - تسجيل الكلية: /signup/college/admin
   - تسجيل المعهد: /signup/institute/admin
   - أدوار: عميد، وكيل، رئيس قسم، محاضر، طالب

═══════════════════════════════════════
الاشتراكات والموافقات
═══════════════════════════════════════
• المؤسسات (كليات/معاهد/مدارس): **تجربة مجانية 15 يوم** ثم خطط مدفوعة تبدأ من 299 ج.م/شهر (3 خطط).
• جميع تسجيلات المؤسسات والمحاضرين المستقلين تخضع لموافقة إدارة المنصة.
• الطلاب: تسجيل تلقائي دون انتظار موافقة.
• كلمات المرور: 8 أحرف على الأقل (لا يوجد أيقونة إظهار للمؤسسات لأسباب أمنية).

═══════════════════════════════════════
أسلوب الرد (مهم جداً)
═══════════════════════════════════════
1. **افهم النية أولاً**: إذا كان السؤال عاماً ("عايز أشترك"، "إزاي أبدأ"، "How do I join?")، اسأل سؤالاً توضيحياً واحداً قصيراً لتحديد: هل هو طالب / محاضر / مؤسسة / مدرسة؟
2. **قدّم خيارات مرقّمة** عند وجود أكثر من مسار (مثال: "هل تفضل: 1) الدورات الفردية 2) اشتراك مؤسسي 3) منصة المدارس؟").
3. **أعطِ بيانات محددة**: أسعار، مدد، عدد حلقات، روابط صفحات — لا إجابات مبهمة.
4. **اختم دائماً بخطوة تالية واضحة**: رابط الصفحة المناسبة، أو زر التسجيل، أو التواصل عبر الواتساب إذا كان الطلب يحتاج تدخلاً بشرياً (فواتير، مشاكل حساب، طلبات مخصصة).
5. **الأسعار والعروض المخصصة**: وجّه إلى الواتساب 00966563057356.
6. **لا تخترع معلومات**: إذا لم تكن متأكداً من رقم/سياسة، قل ذلك بصراحة واقترح الواتساب.
7. أجب بنفس لغة السؤال، بإيجاز (2–5 جمل عادةً) ونبرة ودّية محترفة، واستخدم القوائم عند الحاجة.
8. استخدم إيموجي مناسب بشكل خفيف (✅ 📚 🎓 💬) لتحسين الوضوح، دون مبالغة.`;


serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Public endpoint: allow anonymous chat. Rate-limit per IP.
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-real-ip") ||
      "unknown";
    if (!rateLimit(ip)) {
      return new Response(JSON.stringify({ error: "تم تجاوز الحد المسموح، يرجى المحاولة لاحقاً." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const messages = body?.messages;

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

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
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
      return new Response(JSON.stringify({ error: "حدث خطأ في الخدمة" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch {
    return new Response(JSON.stringify({ error: "حدث خطأ غير متوقع" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
