import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, HelpCircle, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useLanguage } from "@/contexts/LanguageContext";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const FAQSection = () => {
  const { dir, language } = useLanguage();
  const isRtl = dir === "rtl";
  const { ref, isVisible } = useScrollAnimation();

  const faqItems = [
    {
      q: isRtl
        ? "ما هي منظومة UNIGATES وكيف تخدم المؤسسات والمهنيين؟"
        : "What is UNIGATES and how does it serve institutions & individuals?",
      a: isRtl
        ? "UNIGATES هي منظومة رقمية شاملة للتعليم العالي والمدرسي والتدريب المهني والنشر الأكاديمي والتوظيف، إحدى منصات شركة دار عبيد للنشر والتوزيع والطباعة ش.ذ.م.م. تضم 6 منصات رئيسية: المنصة الجامعية، المنصة المدرسية، أكاديمية الدورات، متجر دار عبيد، منصة ناشر، ومنصة Career للتوظيف."
        : "UNIGATES by Dar Obeid Publishing & Distribution LLC is a comprehensive digital ecosystem for higher education, K-12 schooling, vocational training, academic publishing, and careers. It features 6 dedicated platforms: University, School, Courses Academy, Dar Obeid Books, Nasher Platform, and Career Portal.",
    },
    {
      q: isRtl
        ? "كيف تسجل الكليات والمعاهد والمدارس في المنصة؟"
        : "How do colleges, institutes, and schools register?",
      a: isRtl
        ? "يمكن لإدارة الكلية أو المعهد أو المدرسة التسجيل مباشرة عبر بوابة تسجيل المؤسسات، وتحديد الأقسام والبرامج الأكاديمية ورفع بيانات أعضاء هيئة التدريس والطلاب بسهولة عبر استيراد ملفات إكسل أو الدعوات الآلية المباشرة."
        : "Institutional leadership can register directly via the institution onboarding portal, setup departments, and import faculty and students via bulk Excel tools or direct invitations.",
    },
    {
      q: isRtl
        ? "كيف تعمل سلاسل اعتماد الاختبارات والجداول داخل المنصة الجامعية؟"
        : "How do digital approval chains work for exams and schedules?",
      a: isRtl
        ? "يقوم عضو هيئة التدريس بإنشاء الاختبار أو الجدول واختيار سلسلة المعتمدين من رؤساء الأقسام والوكلاء، ويصل بعد ذلك تلقائياً لعميد الكلية للاعتماد النهائي. وفور موافقة العميد، يظهر المحتوى للطلاب تلقائياً."
        : "Faculty create exams or schedules, select approval chains (Head of Dept, Vice Deans), and the item is escalated to the Dean for final release to students.",
    },
    {
      q: isRtl
        ? "هل بيانات كل منصة ومؤسسة معزولة ومحمية؟"
        : "Are institutional data strictly isolated and secure?",
      a: isRtl
        ? "نعم، عزل تام ومحكم بين منصات UNIGATES مما يضمن أمان وخصوصية بيانات الطلاب والكوادر التعليمية والناشرين والباحثين عن عمل، مع تشفير كامل لقواعد البيانات واستضافة سحابية عالية التوافر 99.9%."
        : "Yes, absolute data isolation across UNIGATES platforms guarantees security and privacy for students, faculty, publishers, and job seekers with end-to-end encryption and 99.9% high-availability cloud hosting.",
    },
    {
      q: isRtl
        ? "كيف يحصل المتعلمون على شهادات إتمام الدورات المعتمدة؟"
        : "How do learners receive verified completion certificates?",
      a: isRtl
        ? "عند إكمال جميع حلقات الدورة واجتياز الاختبار النهائي بنجاح، تُصدر المنصة شهادة إتمام رقمية مشفرة برمز QR يمكن التحقق من صحتها ومشاركتها مباشرة على السيرة الذاتية و LinkedIn."
        : "Upon completing all course episodes and passing assessments, learners receive a verifiable digital certificate with QR code validation.",
    },
    {
      q: isRtl
        ? "ما هي منصة ناشر ومنصة Career وكيف يستفيد منهما المؤلفون والباحثون عن عمل؟"
        : "What are Nasher and Career platforms and how do they benefit authors and job seekers?",
      a: isRtl
        ? "منصة ناشر توفر سوقاً ذكياً لطرح الكتب للمزايدة بين دور النشر المعتمدة وتوقيع عقود إلكترونية رسمية بإشراف دار عبيد، بينما منصة Career تمثل جسر التوظيف المباشر بين خريجي الجامعات والكوادر الأكاديمية والمهنية وشركات التوظيف."
        : "Nasher provides a smart manuscript auction marketplace and digital contracts supervised by Dar Obeid, while Career bridges graduates, educators, and professionals with top employers.",
    },
  ];

  return (
    <section
      ref={ref}
      className={`py-16 sm:py-24 px-4 sm:px-6 md:px-12 bg-muted/20 transition-all duration-700 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
    >
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Header */}
        <div className="text-center space-y-3">
          <Badge variant="outline" className="px-3.5 py-1 text-xs font-black border-primary/30 bg-primary/5 text-primary">
            {isRtl ? "إجابات وتوضيحات" : "Questions & Answers"}
          </Badge>
          <h2 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight">
            {isRtl ? "الأسئلة الشائعة حول UNIGATES" : "Frequently Asked Questions"}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground font-medium">
            {isRtl
              ? "تعرف على تفاصيل المنظومة، طرق الانضمام، وميزات الأمان والاعتماد."
              : "Learn more about the platform, onboarding workflows, security, and certifications."}
          </p>
        </div>

        {/* Accordion */}
        <Accordion type="single" collapsible className="space-y-3.5">
          {faqItems.map((item, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="bg-card border-2 border-border/80 rounded-2xl sm:rounded-3xl overflow-hidden hover:border-primary/40 transition-all shadow-xs"
            >
              <AccordionTrigger className="px-5 sm:px-6 py-4 sm:py-5 text-sm sm:text-base font-black hover:no-underline hover:bg-muted/40 text-start">
                <div className="flex items-center gap-3">
                  <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
                  <span>{item.q}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-5 sm:px-6 pb-5 pt-1 text-xs sm:text-sm text-muted-foreground font-medium leading-relaxed">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {/* Action Link */}
        <div className="text-center pt-4">
          <Link to="/faq">
            <Button variant="outline" className="rounded-2xl font-bold text-sm px-6 h-11 border-2 border-primary/30 hover:bg-primary/10 gap-2">
              <span>{isRtl ? "عرض مركز المساعدة والأسئلة الشائعة" : "View Complete Help Center"}</span>
              {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
