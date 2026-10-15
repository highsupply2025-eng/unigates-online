import { RotateCcw, Mail, ExternalLink, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import SimpleHeader from "@/components/SimpleHeader";
import SEO from "@/components/SEO";
import SiteFooter from "@/components/SiteFooter";

const Refund = () => {
  const { language, dir } = useLanguage();
  const isRtl = dir === "rtl";

  const content = {
    ar: {
      title: "سياسة الاسترداد والإلغاء",
      subtitle: "منظومة UNIGATES — شركة دار عبيد للنشر والتوزيع والطباعة ش.ذ.م.م.",
      lastUpdate: "آخر تحديث: سبتمبر 2026",
      sections: [
        {
          title: "1. البائع ومعالج المدفوعات",
          text: "البائع المسؤول عن خدمات منظومة UNIGATES هو شركة دار عبيد للنشر والتوزيع والطباعة ش.ذ.م.م. تتم معالجة جميع عمليات الدفع عبر Paddle.com، الذي يعمل كتاجر مسجّل (Merchant of Record) لكل عمليات البيع، ويصدر الفواتير ويتولى تنفيذ عمليات الاسترداد المعتمدة.",
        },
        {
          title: "2. مدة الاسترداد",
          text: "يحق لك طلب استرداد كامل لقيمة أي اشتراك أو عملية شراء رقمية خلال 30 يومًا من تاريخ الدفع. تُراجع الطلبات خلال 5 أيام عمل، ويُعاد المبلغ إلى وسيلة الدفع الأصلية.",
        },
        {
          title: "3. الاشتراكات المتكررة",
          text: "يمكنك إلغاء الاشتراك الشهري أو السنوي في أي وقت من صفحة حسابك. يستمر وصولك حتى نهاية المدة المدفوعة، ولا تتم أي محاولة تحصيل بعد ذلك. إذا تم تجديد اشتراكك دون استخدام، يمكنك طلب استرداد قيمة التجديد خلال 30 يومًا من تاريخ التجديد.",
        },
        {
          title: "4. الاشتراكات والعقود المؤسسية",
          text: "تخضع اشتراكات الكليات والمعاهد والمدارس لمدة الاسترداد نفسها (30 يومًا) من تاريخ الدفع. أي ترتيبات تعاقدية إضافية تُوثَّق كتابيًا ولا تقلّل من هذا الحق.",
        },
        {
          title: "5. كيف تطلب الاسترداد",
          text: "أرسل طلبك من البريد المرتبط بحسابك إلى darobaid@unigates.online مع رقم العملية أو تاريخ الدفع. يمكنك أيضًا التواصل مع Paddle مباشرة عبر paddle.net. لا نحتفظ بأي رسوم إدارية على الاسترداد.",
        },
        {
          title: "6. الاستثناءات",
          text: "لا تُشمل بالاسترداد الكتب المطبوعة التي تم شحنها وتسليمها فعليًا، والخدمات المخصصة المنفَّذة بناءً على طلب خاص بعد إنجازها وتسليمها.",
        },
        {
          title: "7. القانون الواجب التطبيق",
          text: "تخضع سياسة الاسترداد والإلغاء وتُفسر وفقاً لأحكام وتشريعات جمهورية مصر العربية المعمول بها بما يتوافق مع حقوق المستهلك والمعايير الدولية.",
        },
      ],
    },
    en: {
      title: "Refund & Cancellation Policy",
      subtitle: "UNIGATES — Dar Obaid Publishing, Distribution & Printing LLC",
      lastUpdate: "Last updated: September 2026",
      sections: [
        {
          title: "1. Seller & Payment Processor",
          text: "The seller of all UNIGATES services is Dar Obaid Publishing, Distribution & Printing LLC. All payments are processed by Paddle.com, which acts as the Merchant of Record for every sale, issues invoices, and executes approved refunds.",
        },
        {
          title: "2. Refund Period",
          text: "You may request a full refund of any subscription or digital purchase within 30 days of payment. Requests are reviewed within 5 business days and refunded to the original payment method.",
        },
        {
          title: "3. Recurring Subscriptions",
          text: "You can cancel a monthly or annual subscription at any time from your account page. Access continues until the end of the paid period and no further charge is attempted. If a renewal was charged and unused, you may request a refund of that renewal within 30 days of the renewal date.",
        },
        {
          title: "4. Institutional Subscriptions & Contracts",
          text: "College, institute, and school subscriptions are covered by the same 30-day refund period from the date of payment. Any additional contractual arrangements are documented in writing and never reduce this right.",
        },
        {
          title: "5. How to Request a Refund",
          text: "Email darobaid@unigates.online from the address linked to your account, including the transaction ID or payment date. You may also contact Paddle directly at paddle.net. No administrative fee is withheld from refunds.",
        },
        {
          title: "6. Exceptions",
          text: "Printed books that have already been shipped and delivered, and bespoke services completed and delivered on specific request, are not eligible for refund.",
        },
        {
          title: "7. Governing Law",
          text: "This Refund and Cancellation Policy is governed by and construed in accordance with the applicable laws and consumer protection regulations of the Arab Republic of Egypt.",
        },
      ],
    },
  };

  const c = content[language] ?? (isRtl ? content.ar : content.en);

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={dir}>
      <SEO
        title={isRtl ? "سياسة الاسترداد — UNIGATES" : "Refund Policy — UNIGATES"}
        description={
          isRtl
            ? "سياسة الاسترداد والإلغاء لاشتراكات ومشتريات منصة UNIGATES."
            : "Refund and cancellation policy for UNIGATES subscriptions and purchases."
        }
      />
      <SimpleHeader />

      <main className="flex-1">
        <section className="bg-gradient-to-br from-primary/10 to-primary/5 py-16 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-[hsl(200,75%,30%)] shadow-xl shadow-primary/30 flex items-center justify-center mx-auto mb-6">
              <RotateCcw className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-foreground mb-3">{c.title}</h1>
            <p className="text-foreground/70 text-sm mb-2">{c.subtitle}</p>
            <p className="text-foreground/60 text-sm">{c.lastUpdate}</p>
          </div>
        </section>

        <section className="py-16 px-6">
          <div className="max-w-4xl mx-auto space-y-8">
            {c.sections.map((s, i) => (
              <div key={i} className="bg-card border border-primary/10 rounded-xl p-6 shadow-sm">
                <h2 className="text-xl font-bold text-foreground mb-3">{s.title}</h2>
                <p className="text-foreground/70 leading-relaxed">{s.text}</p>
              </div>
            ))}

            {/* Official Support & Paddle Assistance Card */}
            <div className="p-6 md:p-8 rounded-2xl bg-card border-2 border-primary/20 shadow-md space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">
                    {isRtl ? "ضمان الاسترداد والدعم الرسمي" : "Refund Guarantee & Official Support"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {isRtl
                      ? "نحن نضمن حقوقك بالكامل خلال ٣٠ يوماً من تاريخ الدفع بالتعاون مع Paddle.com"
                      : "Your rights are fully protected within 30 days of payment in partnership with Paddle.com"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <a
                  href="mailto:darobaid@unigates.online"
                  className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 hover:bg-primary/10 border border-primary/20 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-muted-foreground">
                      {isRtl ? "راسل فريق الدعم الرسمي:" : "Official Support Team:"}
                    </div>
                    <div className="text-sm font-bold text-foreground font-mono">darobaid@unigates.online</div>
                  </div>
                </a>

                <a
                  href="https://paddle.net"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 rounded-xl bg-muted/40 hover:bg-muted/70 border border-border transition-colors group"
                >
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-foreground group-hover:bg-primary group-hover:text-white transition-colors">
                    <ExternalLink className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-muted-foreground">
                      {isRtl ? "البوابة المباشرة لفواتير Paddle:" : "Paddle Direct Buyer Portal:"}
                    </div>
                    <div className="text-sm font-bold text-primary font-mono flex items-center gap-1">
                      paddle.net <ExternalLink className="w-3 h-3" />
                    </div>
                  </div>
                </a>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border/60">
                <div className="text-xs text-muted-foreground">
                  {isRtl
                    ? "التاجر المسجل (MoR): Paddle.com Market Ltd"
                    : "Merchant of Record (MoR): Paddle.com Market Ltd"}
                </div>

                <div className="flex items-center gap-3 text-xs font-bold">
                  <Link to="/terms" className="text-muted-foreground hover:text-primary transition-colors">
                    {isRtl ? "شروط الخدمة ➔" : "Terms of Service ➔"}
                  </Link>
                  <Link to="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
                    {isRtl ? "سياسة الخصوصية ➔" : "Privacy Policy ➔"}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
};

export default Refund;
