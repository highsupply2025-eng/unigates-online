import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `أنت مساعد ذكي لمنصة UNIGATES التعليمية. أجب على الأسئلة بدقة واختصار باللغة العربية أو الإنجليزية حسب لغة السؤال.

معلومات المنصة:
- الاسم: UNIGATES - منصة تعليمية متكاملة
- المالك: شركة دار عبيد للنشر والتوزيع والطباعة ش.ذ.م.م
- الأقسام الرئيسية: دورات تعليمية، متجر كتب، منصة مدرسية، منصة جامعية
- الدورات مقسمة إلى حلقات قصيرة ومركزة يسهل متابعتها
- يمكن تحميل الحلقات للمشاهدة بدون إنترنت
- تتوفر شهادات إتمام معتمدة بعد إنهاء كل دورة
- تدعم المنصة البث المباشر للمحاضرات والدورات
- متجر الكتب يوفر شراء كتب اونلاين للقراءة أو الشحن السريع
- تطبيق الجوال قريباً على Google Play و App Store
- المنصة تخدم الكليات والمعاهد والمدارس وتخلق بيئة تفاعلية بين الطلاب والمحاضرين والمعلمين
- أنواع الحسابات: طالب، محاضر، شخصي، ناشر، بائع، طالب مدرسي، ولي أمر، مدرسة، معلم
- يمكن للكليات والمعاهد التسجيل وإنشاء أقسام وإرسال روابط دعوة للطلاب والمحاضرين
- رقم واتساب الدعم الفني: 00966563057356

قواعد مهمة:
1. أجب بإيجاز ووضوح
2. إذا لم تعرف الإجابة، قل "للمزيد من المعلومات، تواصل معنا عبر الواتساب"
3. في نهاية كل محادثة أو عند طلب تفاصيل أكثر، اقترح التواصل عبر الواتساب على الرقم 00966563057356
4. كن ودوداً ومهنياً`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    
    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Messages array is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
          ...messages,
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
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
