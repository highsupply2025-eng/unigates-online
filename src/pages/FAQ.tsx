import { useLanguage } from "@/contexts/LanguageContext";
import {
  HelpCircle,
  GraduationCap,
  CreditCard,
  BookOpen,
  Shield,
  Users,
  Building2,
  School,
  Languages,
  Briefcase,
  BookCopy,
  MessageCircle,
  Sparkles,
  Zap,
} from "lucide-react";
import SimpleHeader from "@/components/SimpleHeader";
import SiteFooter from "@/components/SiteFooter";
import SEO from "@/components/SEO";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqCategories = {
  ar: [
    {
      title: "عن منظومة UNIGATES الموحدة",
      icon: GraduationCap,
      items: [
        {
          q: "ما هي منظومة UNIGATES الرقمية؟",
          a: "UNIGATES هي منظومة تعليمية وبحثية ومهنية رقمية متكاملة تابعة لدار عبيد للنشر والتوزيع والطباعة. تضم المنظومة 6 بوابات رئيسية: المنصة الجامعية، المنصة المدرسية، منصة الدورات والمهارات، متجر الكتب الرقمي، منصة ناشر للمؤلفين والعقود، وبوابة UNIGATES Career للتوظيف والفرص المهنية.",
        },
        {
          q: "ما هي اللغات المدعومة في المنصة؟",
          a: "تدعم المنصة 8 لغات عالمية بالكامل مع تحديد تلقائي بحسب الموقع الجغرافي: العربية، الإنجليزية، الفرنسية، الألمانية، التركية، الصينية، الإسبانية، والروسية، مع إمكانية التبديل اللحظي من القائمة العلوية.",
        },
        {
          q: "من يمكنه الانضمام واستخدام المنظومة؟",
          a: "المنظومة تخدم كافة أطراف العملية التعليمية: الكليات والمعاهد، المدارس، المحاضرين، المعلمين المتميزين، مراكز التدريب، مراكز اللغات والترجمة، الطلاب والمتدربين، المؤلفين والناشرين، والشركات الباحثة عن كفاءات.",
        },
        {
          q: "هل المنصة متوافقة مع الأجهزة الذكية؟",
          a: "نعم، المنصة مبنية بتصميم ويب تقدمي (PWA) متجاوب فائق السرعة يعمل بسلاسة على الهواتف الذكية والأجهزة اللوحية والحواسيب المكتبية.",
        },
      ],
    },
    {
      title: "أكاديمية الدورات والتدريب المهني",
      icon: Zap,
      items: [
        {
          q: "ما هي أنواع الحسابات المتاحة في منصة الدورات؟",
          a: "تتيح منصة الدورات 5 أدوار مخصصة: (1) طالب ومتدرب مع تفعيل فوري وشهادات QR، (2) معلّم متميز لدروس التقوية والمناهج، (3) محاضر ومدرب مستقل مع استوديو دورات متقدم، (4) مركز تدريب وأكاديمية للدبلومات المهنية المعتمدة، (5) مركز لغات وترجمة لبرامج اللغات واختبارات IELTS/TOEFL.",
        },
        {
          q: "كيف تتم حماية المحاضرات والفيديوهات التدريبية؟",
          a: "نستخدم تقنيات تشفير الفيديو المتقدمة Enterprise DRM لمنع القرصنة وتسجيل الشاشة، مع علامات مائية ديناميكية تضمن الحماية الكاملة لحقوق الملكية الفكرية للمحاضرين والمراكز.",
        },
        {
          q: "كيف تعمل الشهادات الرقمية المعتمدة؟",
          a: "عند اجتياز متطلبات الدورة، تصدر المنصة شهادة إتمام رقمية مشفرة برمز QR فريد قابل للتحقق الفوري عالمياً ومشاركتها عبر LinkedIn والسيرة الذاتية.",
        },
        {
          q: "هل تتوفر حلقات تمهيدية مجانية؟",
          a: "نعم، تتيح المنصة إمكانية مشاهدة الحلقات التمهيدية المجانية للدورات للتعرف على أسلوب المدرب ومحتوى المنهج قبل الاشتراك.",
        },
      ],
    },
    {
      title: "المؤسسات الأكاديمية (كليات ومعاهد)",
      icon: Building2,
      items: [
        {
          q: "كيف يتم تسجيل وإدارة الكلية الجامعية أو المعهد العالي؟",
          a: "تقوم إدارة المؤسسة بالتسجيل عبر بوابة التعليم الجامعي، ويتم تفعيل لوحة قيادة متكاملة تتيح إدارة العميد، الوكلاء، رؤساء الأقسام، أعضاء هيئة التدريس، وتوليد أكواد الدعوة الذكية للأقسام والطلاب.",
        },
        {
          q: "كيف تعمل سلاسل الاعتماد الرقمي للاختبارات والجداول؟",
          a: "توفر المنصة دورة عمل حوكمة متعددة المستويات: يقوم المحاضر برفع بنك الأسئلة أو الجدول، ثم يعتمده رئيس القسم، ثم وكيل الكلية، حتى الاعتماد النهائي والمصادقة من العميد.",
        },
        {
          q: "هل تدعم المنصة تتبع الحضور والغياب والمحاضرات؟",
          a: "نعم، تتضمن المنصة جداول محاضرات ذكية، رصد الحضور الإلكتروني، وتكامل بنوك الأسئلة مع التصحيح الآلي للواجبات والتكليفات.",
        },
      ],
    },
    {
      title: "المنصة المدرسية (K-12)",
      icon: School,
      items: [
        {
          q: "ما هي مزايا المنصة المدرسية لإدارة التعليم العام؟",
          a: "تغطي المنصة المدرسية إدارة الفصول الدراسية، متابعة الواجبات المدرسية، بنوك الأسئلة والاختبارات الدورية، وتوفير بوابة تواصل مباشرة لأولياء الأمور لمتابعة تحصيل أبنائهم وسلوكهم.",
        },
        {
          q: "كيف يستفيد المعلم المتميز من المنصة؟",
          a: "يمكن للمعلمين المتميزين تقديم مراجعات شاملة، بث فصول افتراضية مباشرة، وإدارة بنوك أسئلة تفاعلية مع تقارير دقيقة لأداء الطلاب.",
        },
      ],
    },
    {
      title: "منصة ناشر (Publisher) ومتجر الكتب",
      icon: BookCopy,
      items: [
        {
          q: "ما هي منصة ناشر للمؤلفين ودور النشر؟",
          a: "منصة ناشر هي بيئة رقمية احترافية لتوقيع عقود النشر الرقمية إلكترونياً، إدارة المخطوطات والكتب، ومتابعة نسب المبيعات وتوزيع الأرباح السنوي والشهري بشفافية تامة.",
        },
        {
          q: "ما هي صيغ الكتب المتاحة في المتجر الرقمي؟",
          a: "يوفر متجر الكتب الرقمية صيغ قراءة إلكترونية تفاعلية، كتب PDF محمية، بالإضافة إلى خدمة طلب النسخ المطبوعة مع الشحن والتوصيل.",
        },
      ],
    },
    {
      title: "بوابة UNIGATES Career والوظائف",
      icon: Briefcase,
      items: [
        {
          q: "كيف يستفيد الخريجون والمهنيون من منصة Career؟",
          a: "تتيح بوابة التوظيف للخريجين والمتدربين بناء ملف مهني موثق بالشهادات الرقمية الحاصلين عليها من المنصة والتقديم المباشر على الوظائف الأكاديمية والمهنية المطروحة من الجامعات والشركات الشريكة.",
        },
        {
          q: "كيف تعلن المؤسسات والشركات عن وظائف شاغرة؟",
          a: "يمكن للجهات المعتمدة نشر إعلانات التوظيف، تصفية المتقدمين وفق الكفاءات والتخصصات، وتنسيق المقابلات بسلاسة.",
        },
      ],
    },
    {
      title: "الاشتراكات والمدفوعات والأمان",
      icon: CreditCard,
      items: [
        {
          q: "ما هي وسائل الدفع المعتمدة؟",
          a: "نقبل الدفع الآمن عبر البطاقات الائتمانية (Visa, MasterCard)، مدى، Apple Pay، والتحويلات البنكية المعتمدة، مع تشفير SSL كامل بمعيار 256-bit.",
        },
        {
          q: "هل بياناتي ومعلوماتي الشخصية محمية؟",
          a: "نعم، تطبق المنظومة أعلى معايير الخصوصية وأمان البيانات العالمية ISO/IEC 27001 مع سياسات RLS المتقدمة لحماية البيانات وعزل صلاحيات المستخدمين.",
        },
        {
          q: "كيف أتواصل مع الدعم الفني المباشر؟",
          a: "فريق الدعم الفني والمستشار الذكي متواجدون على مدار الساعة عبر أداة المحادثة الذكية في المنصة، أو عبر الواتساب المباشر على الرقم 00966563057356.",
        },
      ],
    },
  ],
  en: [
    {
      title: "About the UNIGATES Unified Ecosystem",
      icon: GraduationCap,
      items: [
        {
          q: "What is the UNIGATES digital ecosystem?",
          a: "UNIGATES is a unified digital educational and professional platform by Obaid Publishing. It encompasses 6 major portals: University Platform, School Platform (K-12), Courses & Skills Academy, Digital Book Store, Nasher Publisher Platform, and the UNIGATES Career job portal.",
        },
        {
          q: "Which languages are supported?",
          a: "UNIGATES fully supports 8 global languages with automatic geo-detection: Arabic, English, French, German, Turkish, Chinese, Spanish, and Russian, with instant switching via the top navigation bar.",
        },
        {
          q: "Who can use the platform?",
          a: "The ecosystem is built for all educational stakeholders: colleges & institutes, schools, university professors, distinguished teachers, training academies, language & translation centers, students, authors, publishers, and hiring organizations.",
        },
        {
          q: "Is the platform mobile-responsive?",
          a: "Yes, UNIGATES is engineered as a lightning-fast Progressive Web App (PWA) that provides a seamless, responsive experience across smartphones, tablets, and desktops.",
        },
      ],
    },
    {
      title: "Courses & Skills Academy",
      icon: Zap,
      items: [
        {
          q: "What account roles are available on the Courses platform?",
          a: "The Courses platform features 5 tailored roles: (1) Student & Trainee with instant activation and QR certificates, (2) Distinguished Teacher for K-12 tutoring, (3) Independent Lecturer with a professional studio, (4) Training Center & Academy for accredited diplomas, and (5) Language & Translation Center for foreign language tracks and IELTS/TOEFL preparation.",
        },
        {
          q: "How are video lectures secured?",
          a: "Lectures are encrypted with Enterprise DRM technology to prevent piracy and screen capture, accompanied by dynamic watermarks protecting instructor and academy IP.",
        },
        {
          q: "How do verifiable digital certificates work?",
          a: "Upon course completion, users earn a tamper-proof digital certificate featuring a verifiable QR code ready for direct sharing on LinkedIn and professional CVs.",
        },
        {
          q: "Are there free preview lessons?",
          a: "Yes, free preview episodes are accessible for courses to explore the curriculum and teaching style before enrolling.",
        },
      ],
    },
    {
      title: "Academic Institutions (Colleges & Institutes)",
      icon: Building2,
      items: [
        {
          q: "How do colleges and institutes register and manage leadership?",
          a: "Institutions register via the University gateway. Once approved, a comprehensive administrative dashboard is activated for Deans, Vice Deans, Department Heads, and faculty members with smart departmental invitation codes.",
        },
        {
          q: "How do digital exam and schedule approval chains work?",
          a: "The platform provides a structured governance workflow: faculty submit schedules or exam question banks, followed by Department Head approval, Vice Dean review, and final Dean authentication.",
        },
        {
          q: "Does the platform support attendance tracking?",
          a: "Yes, including smart schedule management, digital attendance logging, and auto-graded assignment evaluations.",
        },
      ],
    },
    {
      title: "K-12 School Platform",
      icon: School,
      items: [
        {
          q: "What features does the School Platform offer?",
          a: "It covers classroom administration, curriculum tracking, automated gradebooks, periodic quiz banks, and dedicated parent communication portals.",
        },
        {
          q: "How do Distinguished Teachers leverage the platform?",
          a: "Distinguished Teachers can conduct virtual live classes, provide comprehensive revision tracks, and manage interactive question banks with real-time performance analytics.",
        },
      ],
    },
    {
      title: "Nasher Publishing & Book Store",
      icon: BookCopy,
      items: [
        {
          q: "What is the Nasher platform for authors and publishers?",
          a: "Nasher is a dedicated publishing suite for digitally executing publishing contracts, managing book manuscripts, and tracking monthly and annual royalty payouts transparently.",
        },
        {
          q: "What book formats are available in the Digital Book Store?",
          a: "The store offers interactive eBooks, DRM-protected PDFs, and physical print-on-demand books with shipping services.",
        },
      ],
    },
    {
      title: "UNIGATES Career & Job Opportunities",
      icon: Briefcase,
      items: [
        {
          q: "How do graduates benefit from the Career portal?",
          a: "Graduates and trainees can build verified professional profiles linked directly with their UNIGATES digital credentials and apply to career opportunities posted by partner universities and companies.",
        },
        {
          q: "How do partner institutions post vacancies?",
          a: "Verified organizations can post job openings, filter candidates by specialization and verified credentials, and manage recruitment seamlessly.",
        },
      ],
    },
    {
      title: "Security, Subscriptions & Support",
      icon: CreditCard,
      items: [
        {
          q: "What payment methods are supported?",
          a: "We support Visa, MasterCard, Mada, Apple Pay, and authenticated bank transfers, all secured by 256-bit SSL encryption.",
        },
        {
          q: "How is my data safeguarded?",
          a: "We adhere to ISO/IEC 27001 data protection standards with advanced Row-Level Security (RLS) policies isolating user data.",
        },
        {
          q: "How do I reach live technical support?",
          a: "Our AI Advisor and support team are available 24/7 via the in-app chat widget or directly through WhatsApp at 00966563057356.",
        },
      ],
    },
  ],
};

const FAQ = () => {
  const { language, dir } = useLanguage();
  const isRtl = dir === "rtl";
  const categories = isRtl ? faqCategories.ar : faqCategories.en;

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: categories.flatMap((c) =>
      c.items.map((it) => ({
        "@type": "Question",
        name: it.q,
        acceptedAnswer: { "@type": "Answer", text: it.a },
      }))
    ),
  };

  return (
    <div dir={dir} className="min-h-screen bg-background flex flex-col">
      <SEO
        title={isRtl ? "الأسئلة الشائعة — UNIGATES" : "FAQ — UNIGATES"}
        description={isRtl
          ? "إجابات لأكثر الأسئلة شيوعاً حول منصة UNIGATES: الدورات، الاشتراكات، المؤسسات، ومتجر الكتب."
          : "Answers to the most common questions about UNIGATES: courses, subscriptions, institutions, and the book store."}
        jsonLd={faqJsonLd}
      />
      <SimpleHeader />
      <main className="flex-1 py-12 px-6 md:px-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/15 mb-6 shadow-lg shadow-primary/20">
              <HelpCircle className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-primary mb-4">
              {isRtl ? "الأسئلة الشائعة" : "FAQ"}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {isRtl
                ? "إجابات لأكثر الأسئلة شيوعاً حول المنصة وخدماتها"
                : "Answers to the most frequently asked questions about the platform and its services"}
            </p>
          </div>

          {/* Categories */}
          <div className="space-y-10">
            {categories.map((category, catIdx) => {
              const Icon = category.icon;
              return (
                <div key={catIdx}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-xl font-bold text-primary">{category.title}</h2>
                  </div>
                  <Accordion type="single" collapsible className="space-y-2">
                    {category.items.map((item, idx) => (
                      <AccordionItem
                        key={idx}
                        value={`cat-${catIdx}-item-${idx}`}
                        className="bg-card border-2 border-primary/15 rounded-xl overflow-hidden hover:border-primary/40 transition-colors"
                      >
                        <AccordionTrigger className="px-6 py-4 text-sm md:text-base font-semibold hover:no-underline hover:bg-primary/5">
                          {item.q}
                        </AccordionTrigger>
                        <AccordionContent className="px-6 pb-4 text-sm text-muted-foreground leading-relaxed">
                          {item.a}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              );
            })}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
};

export default FAQ;
