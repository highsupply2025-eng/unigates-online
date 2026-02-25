import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "ما هي منصة مَعرِفة؟",
    answer: "مَعرِفة هي منصة تعليمية عربية تقدم دورات احترافية في مجالات متنوعة مثل البرمجة، التصميم، التسويق، وإدارة الأعمال. كل دورة مقسمة إلى حلقات قصيرة وسهلة المتابعة.",
  },
  {
    question: "كم تكلفة الاشتراك؟",
    answer: "نوفر خطة مجانية تتيح لك الوصول لدورات مختارة. الاشتراك المميز يبدأ من 29 ريال شهرياً ويتيح لك الوصول لجميع الدورات والمميزات.",
  },
  {
    question: "هل يمكنني التعلم أوفلاين؟",
    answer: "نعم! يمكنك تحميل أي حلقة على جهازك ومشاهدتها بدون اتصال بالإنترنت. متاح على تطبيق الهاتف لنظامي iOS و Android.",
  },
  {
    question: "هل أحصل على شهادة؟",
    answer: "نعم، عند إتمام أي دورة بنجاح ستحصل على شهادة إتمام رقمية يمكنك مشاركتها على LinkedIn أو إضافتها لسيرتك الذاتية.",
  },
  {
    question: "كيف ألغي اشتراكي؟",
    answer: "يمكنك إلغاء اشتراكك في أي وقت من إعدادات حسابك بضغطة واحدة. لا توجد رسوم إلغاء أو التزامات طويلة الأمد.",
  },
  {
    question: "هل المحتوى باللغة العربية؟",
    answer: "نعم، جميع دوراتنا باللغة العربية مع مدربين عرب محترفين. كما نوفر ترجمات لبعض الدورات المميزة.",
  },
];

const FAQSection = () => {
  return (
    <section className="section-divider py-12 md:py-20 px-6 md:px-12">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold mb-6">الأسئلة الشائعة</h2>

        <Accordion type="single" collapsible className="space-y-2">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="bg-secondary border-none rounded-lg"
            >
              <AccordionTrigger className="px-6 py-5 text-base md:text-lg font-medium hover:no-underline hover:bg-muted rounded-lg text-right">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-5 text-base text-muted-foreground leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="mt-14 text-center bg-card rounded-2xl p-8 md:p-12 border border-border glow-teal">
          <h3 className="text-2xl md:text-3xl font-bold mb-3">جاهز تبدأ رحلة التعلّم؟</h3>
          <p className="text-muted-foreground mb-6">انضم لأكثر من 50,000 متعلّم على المنصة</p>
          <Button variant="default" size="lg" className="h-14 px-10 text-lg font-bold gap-2">
            <ChevronLeft className="w-5 h-5" />
            ابدأ الآن مجاناً
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
