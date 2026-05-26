import { Link } from "react-router-dom";
import { HelpCircle, MessageCircle, Mail, Phone, BookOpen, Users, CreditCard, Settings, Shield, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useLanguage } from "@/contexts/LanguageContext";
import SimpleHeader from "@/components/SimpleHeader";
import SEO from "@/components/SEO";
import SiteFooter from "@/components/SiteFooter";

const HelpCenter = () => {
  const { language, dir } = useLanguage();
  const isRtl = dir === "rtl";

  const content = {
    ar: {
      title: "مركز المساعدة",
      subtitle: "كيف يمكننا مساعدتك؟",
      categories: [
        { icon: Users, title: "إدارة الحساب", desc: "التسجيل، تسجيل الدخول، وإدارة الملف الشخصي" },
        { icon: BookOpen, title: "الدورات التعليمية", desc: "التسجيل في الدورات، المشاهدة، والشهادات" },
        { icon: CreditCard, title: "المدفوعات والاشتراكات", desc: "طرق الدفع، الباقات، والفواتير" },
        { icon: Settings, title: "الإعدادات التقنية", desc: "متطلبات النظام والمشاكل التقنية" },
        { icon: Shield, title: "الأمان والخصوصية", desc: "حماية الحساب وإعدادات الخصوصية" },
        { icon: Video, title: "البث المباشر", desc: "حضور ومتابعة المحاضرات المباشرة" },
      ],
      faqTitle: "الأسئلة الشائعة",
      faqs: [
        { q: "كيف أنشئ حساباً جديداً؟", a: "اضغط على 'إنشاء حساب' في الصفحة الرئيسية، اختر نوع حسابك (طالب، محاضر، كلية، أو معهد)، ثم أكمل البيانات المطلوبة وفعّل حسابك عبر البريد الإلكتروني." },
        { q: "كيف أسجل كليتي أو معهدي في المنصة؟", a: "انتقل إلى صفحة 'المنصة الجامعية' واضغط على 'سجل الآن'. أكمل نموذج التسجيل وسيقوم فريقنا بمراجعة الطلب والرد خلال 48 ساعة عمل." },
        { q: "ما هي طرق الدفع المتاحة؟", a: "نقبل الدفع عبر البطاقات البنكية (فيزا، ماستركارد)، التحويل البنكي، وبعض المحافظ الإلكترونية المحلية حسب الدولة." },
        { q: "هل يمكنني استرداد المبلغ بعد الاشتراك؟", a: "نعم، يمكنك طلب استرداد المبلغ خلال 7 أيام من تاريخ الاشتراك بشرط عدم مشاهدة أكثر من 20% من المحتوى." },
        { q: "كيف أتواصل مع الدعم الفني؟", a: "يمكنك التواصل معنا عبر الواتساب للحصول على استجابة فورية، أو عبر البريد الإلكتروني وسنرد خلال 24 ساعة." },
        { q: "هل تتوفر شهادات بعد إتمام الدورة؟", a: "نعم، يحصل الطالب على شهادة إتمام رقمية بعد إكمال جميع حلقات الدورة واجتياز الاختبار النهائي بنجاح." },
      ],
      contactTitle: "تواصل معنا",
      contactDesc: "لم تجد إجابة لسؤالك؟ تواصل مع فريق الدعم",
    },
    en: {
      title: "Help Center",
      subtitle: "How can we help you?",
      categories: [
        { icon: Users, title: "Account Management", desc: "Registration, login, and profile management" },
        { icon: BookOpen, title: "Courses", desc: "Course enrollment, viewing, and certificates" },
        { icon: CreditCard, title: "Payments & Subscriptions", desc: "Payment methods, plans, and invoices" },
        { icon: Settings, title: "Technical Setup", desc: "System requirements and technical issues" },
        { icon: Shield, title: "Security & Privacy", desc: "Account protection and privacy settings" },
        { icon: Video, title: "Live Streaming", desc: "Attending and following live lectures" },
      ],
      faqTitle: "Frequently Asked Questions",
      faqs: [
        { q: "How do I create a new account?", a: "Click 'Create Account' on the homepage, choose your account type (student, lecturer, college, or institute), complete the required information, and activate your account via email." },
        { q: "How do I register my college or institute?", a: "Go to the 'University Platform' page and click 'Register Now'. Complete the registration form and our team will review your application within 48 business hours." },
        { q: "What payment methods are available?", a: "We accept bank cards (Visa, Mastercard), bank transfers, and some local e-wallets depending on the country." },
        { q: "Can I get a refund after subscribing?", a: "Yes, you can request a refund within 7 days of subscription, provided you haven't watched more than 20% of the content." },
        { q: "How do I contact support?", a: "You can reach us via WhatsApp for instant response, or via email and we'll respond within 24 hours." },
        { q: "Are certificates available after completing a course?", a: "Yes, students receive a digital completion certificate after completing all course episodes and passing the final exam." },
      ],
      contactTitle: "Contact Us",
      contactDesc: "Didn't find an answer? Contact our support team",
    },
  };

  const c = content[language];

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={dir}>
      <SEO
        title={isRtl ? "مركز المساعدة — UNIGATES" : "Help Center — UNIGATES"}
        description={isRtl ? "إجابات ودعم حول الحساب، الدورات، المدفوعات، والإعدادات التقنية على منصة UNIGATES." : "Answers and support for accounts, courses, payments, and technical settings on UNIGATES."}
      />
      <SimpleHeader />

      <main className="flex-1">
        <section className="bg-gradient-to-br from-primary/10 to-primary/5 py-16 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-[hsl(200,75%,30%)] shadow-xl shadow-primary/30 flex items-center justify-center mx-auto mb-6">
              <HelpCircle className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-foreground mb-4">{c.title}</h1>
            <p className="text-lg text-foreground/70">{c.subtitle}</p>
          </div>
        </section>

        <section className="py-16 px-6">
          <div className="max-w-5xl mx-auto grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {c.categories.map((cat, i) => (
              <div key={i} className="bg-card border-2 border-primary/15 rounded-2xl p-6 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-[hsl(200,75%,30%)] flex items-center justify-center mb-4">
                  <cat.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{cat.title}</h3>
                <p className="text-foreground/60 text-sm">{cat.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="py-16 px-6 bg-secondary/30">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-black text-foreground mb-4">{c.faqTitle}</h2>
            <p className="text-foreground/70 mb-6">
              {language === "ar" ? "اطلع على إجابات لأكثر الأسئلة شيوعاً حول المنصة" : "Find answers to the most common questions about the platform"}
            </p>
            <Link to="/faq">
              <Button className="gap-2">
                {language === "ar" ? "عرض الأسئلة الشائعة" : "View FAQs"}
              </Button>
            </Link>
          </div>
        </section>

        <section className="py-16 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-black text-foreground mb-4">{c.contactTitle}</h2>
            <p className="text-foreground/70 mb-8">{c.contactDesc}</p>
            <div className="flex flex-wrap justify-center gap-4">
              <a href="https://wa.me/966563057356" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-[#25D366] text-white font-bold px-6 py-3 rounded-full shadow-md hover:shadow-lg transition-all">
                <MessageCircle className="w-5 h-5" /> WhatsApp
              </a>
              <a href="mailto:support@unigates.com" className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-[hsl(200,75%,30%)] text-white font-bold px-6 py-3 rounded-full shadow-md hover:shadow-lg transition-all">
                <Mail className="w-5 h-5" /> {language === "ar" ? "البريد الإلكتروني" : "Email"}
              </a>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
};

export default HelpCenter;
