import { useLanguage } from "@/contexts/LanguageContext";
import { HelpCircle, GraduationCap, CreditCard, BookOpen, Shield, Users, Monitor, MessageCircle } from "lucide-react";
import SimpleHeader from "@/components/SimpleHeader";
import SiteFooter from "@/components/SiteFooter";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqCategories = {
  ar: [
    {
      title: "عن المنصة",
      icon: GraduationCap,
      items: [
        { q: "ما هي منصة UNIGATES؟", a: "UNIGATES هي منصة تعليمية رقمية متكاملة تابعة لدار عبيد للنشر والتوزيع والطباعة، تهدف إلى تطوير التعليم الأكاديمي والمهني في العالم العربي من خلال تقديم حلول تقنية مبتكرة للمؤسسات التعليمية والطلاب والمحاضرين." },
        { q: "من يمكنه استخدام المنصة؟", a: "المنصة مصممة للجميع: الطلاب، المحاضرين، المعلمين، أولياء الأمور، الكليات، المعاهد، المدارس، والناشرين. كل فئة لها واجهة مخصصة تناسب احتياجاتها." },
        { q: "هل المنصة متاحة باللغتين العربية والإنجليزية؟", a: "نعم، المنصة تدعم اللغتين العربية والإنجليزية بالكامل، ويمكنك التبديل بينهما في أي وقت من خلال زر تغيير اللغة." },
        { q: "هل المنصة متوفرة كتطبيق للهاتف؟", a: "نعمل حالياً على تطوير تطبيقات الهاتف لنظامي iOS وAndroid. حالياً يمكنك الوصول للمنصة عبر متصفح الهاتف بتجربة متجاوبة بالكامل." },
      ],
    },
    {
      title: "الدورات التعليمية",
      icon: BookOpen,
      items: [
        { q: "كيف أسجل في دورة تعليمية؟", a: "قم بإنشاء حساب على المنصة، ثم تصفح الدورات المتاحة واختر الدورة التي تناسبك. يمكنك البدء فوراً في الدورات المجانية أو الاشتراك في الدورات المدفوعة." },
        { q: "هل توجد دورات مجانية؟", a: "نعم، نوفر مجموعة من الدورات المجانية في مختلف التخصصات. كما يمكنك مشاهدة الحلقة الأولى من أي دورة مدفوعة مجاناً قبل الاشتراك." },
        { q: "كيف تعمل الدورات؟", a: "كل دورة مقسمة إلى مستويات وحلقات قصيرة ومركزة. يمكنك متابعة تقدمك، تحميل المرفقات، وتسليم التكليفات. كما يتوفر بث مباشر مع المحاضرين." },
        { q: "هل أحصل على شهادة بعد إتمام الدورة؟", a: "نعم، عند إتمام أي دورة بنجاح ستحصل على شهادة إتمام رقمية يمكنك مشاركتها على LinkedIn أو إضافتها لسيرتك الذاتية." },
        { q: "هل يمكنني التعلم بدون اتصال بالإنترنت؟", a: "نعم، يمكنك تحميل الحلقات على جهازك ومشاهدتها بدون اتصال بالإنترنت في أي وقت ومن أي مكان." },
      ],
    },
    {
      title: "الاشتراكات والأسعار",
      icon: CreditCard,
      items: [
        { q: "ما هي خطط الاشتراك المتاحة؟", a: "نوفر خطط اشتراك مرنة: شهرية وسنوية. الخطة السنوية توفر لك خصماً يصل إلى 10%. كما تتوفر خطط خاصة للمؤسسات التعليمية." },
        { q: "كيف أدفع رسوم الاشتراك؟", a: "نقبل الدفع عبر البطاقات البنكية (فيزا، ماستركارد)، وخدمات الدفع الإلكتروني. جميع المعاملات المالية مؤمنة ومشفرة بالكامل." },
        { q: "هل يمكنني إلغاء اشتراكي؟", a: "نعم، يمكنك إلغاء اشتراكك في أي وقت من إعدادات حسابك. لا توجد رسوم إلغاء أو التزامات طويلة الأمد." },
        { q: "هل يوجد ضمان استرداد الأموال؟", a: "نعم، نوفر ضمان استرداد الأموال خلال 7 أيام من تاريخ الاشتراك إذا لم تكن راضياً عن الخدمة." },
      ],
    },
    {
      title: "المؤسسات التعليمية",
      icon: Users,
      items: [
        { q: "كيف يمكن لكليتي/معهدي التسجيل في المنصة؟", a: "يمكن للمؤسسات التعليمية التسجيل من خلال صفحة المنصة الجامعية، وملء نموذج التسجيل. سيتم مراجعة الطلب والرد عليه خلال 48 ساعة عمل." },
        { q: "كيف تعمل أكواد الدعوة للمؤسسات؟", a: "بعد اعتماد المؤسسة، يمكن للمسؤول إنشاء أكواد دعوة خاصة لكل قسم. يستخدم المحاضرون والطلاب هذه الأكواد للانضمام للمؤسسة على المنصة." },
        { q: "هل يمكن للمدارس الاستفادة من المنصة؟", a: "نعم، نوفر منصة مدرسية متكاملة تشمل إدارة الفصول الدراسية، الجداول الزمنية، متابعة أداء الطلاب، والتواصل مع أولياء الأمور." },
        { q: "ما هي تكلفة الاشتراك للمؤسسات؟", a: "نوفر خطط تسعير خاصة للمؤسسات التعليمية تعتمد على عدد الطلاب والأقسام. تواصل معنا للحصول على عرض سعر مخصص." },
      ],
    },
    {
      title: "متجر الكتب",
      icon: BookOpen,
      items: [
        { q: "كيف أشتري كتاباً من المتجر؟", a: "تصفح متجر الكتب واختر الكتاب المطلوب، ثم أضفه للسلة وأكمل عملية الشراء. الكتب الإلكترونية ستكون متاحة فوراً بعد الدفع." },
        { q: "ما هي صيغ الكتب المتوفرة؟", a: "نوفر الكتب بصيغة PDF وكتب مطبوعة. بعض الكتب متاحة بكلتا الصيغتين." },
        { q: "هل يمكنني استرجاع كتاب؟", a: "الكتب الإلكترونية غير قابلة للاسترجاع بعد التحميل. الكتب المطبوعة يمكن استرجاعها خلال 14 يوماً بشرط أن تكون بحالتها الأصلية." },
      ],
    },
    {
      title: "الحساب والأمان",
      icon: Shield,
      items: [
        { q: "كيف أنشئ حساباً على المنصة؟", a: "اضغط على 'إنشاء حساب' واختر نوع الحساب المناسب (طالب، محاضر، ولي أمر، إلخ). أكمل البيانات المطلوبة وقم بتأكيد بريدك الإلكتروني." },
        { q: "نسيت كلمة المرور، ماذا أفعل؟", a: "اضغط على 'نسيت كلمة المرور' في صفحة تسجيل الدخول، وأدخل بريدك الإلكتروني. ستصلك رسالة لإعادة تعيين كلمة المرور." },
        { q: "هل بياناتي آمنة؟", a: "نعم، نستخدم أعلى معايير الأمان لحماية بياناتك الشخصية والمالية. جميع البيانات مشفرة ومحمية بتقنيات متقدمة." },
        { q: "كيف أعدّل بياناتي الشخصية؟", a: "يمكنك تعديل بياناتك من صفحة الملف الشخصي بعد تسجيل الدخول. يمكنك تغيير الاسم، الصورة، ورقم الهاتف." },
      ],
    },
    {
      title: "الدعم الفني",
      icon: MessageCircle,
      items: [
        { q: "كيف أتواصل مع الدعم الفني؟", a: "يمكنك التواصل معنا عبر صفحة 'تواصل معنا'، أو عبر الواتساب على الرقم 00966563057356 للحصول على استجابة فورية." },
        { q: "ما هي أوقات عمل الدعم الفني؟", a: "فريق الدعم الفني متاح من الأحد إلى الخميس، من الساعة 9 صباحاً حتى 6 مساءً بتوقيت السعودية. الرسائل خارج أوقات العمل يتم الرد عليها في أول يوم عمل." },
        { q: "هل يوجد دليل استخدام للمنصة؟", a: "نعم، يمكنك زيارة مركز المساعدة للاطلاع على أدلة الاستخدام التفصيلية والشروحات المصورة لجميع ميزات المنصة." },
      ],
    },
  ],
  en: [
    {
      title: "About the Platform",
      icon: GraduationCap,
      items: [
        { q: "What is UNIGATES?", a: "UNIGATES is a comprehensive digital educational platform by Obaid Publishing & Distribution, aimed at developing academic and professional education in the Arab world through innovative technological solutions for educational institutions, students, and lecturers." },
        { q: "Who can use the platform?", a: "The platform is designed for everyone: students, lecturers, teachers, parents, colleges, institutes, schools, and publishers. Each category has a customized interface to suit their needs." },
        { q: "Is the platform available in both Arabic and English?", a: "Yes, the platform fully supports both Arabic and English, and you can switch between them at any time using the language toggle button." },
        { q: "Is there a mobile app?", a: "We are currently developing mobile apps for iOS and Android. Currently, you can access the platform through your mobile browser with a fully responsive experience." },
      ],
    },
    {
      title: "Courses",
      icon: BookOpen,
      items: [
        { q: "How do I enroll in a course?", a: "Create an account on the platform, then browse available courses and choose the one that suits you. You can start free courses immediately or subscribe to paid courses." },
        { q: "Are there free courses?", a: "Yes, we offer a selection of free courses across various specializations. You can also watch the first episode of any paid course for free before subscribing." },
        { q: "How do courses work?", a: "Each course is divided into levels and short, focused episodes. You can track your progress, download attachments, and submit assignments. Live streaming with lecturers is also available." },
        { q: "Do I get a certificate after completing a course?", a: "Yes, upon successfully completing any course, you will receive a digital completion certificate that you can share on LinkedIn or add to your resume." },
        { q: "Can I learn offline?", a: "Yes, you can download episodes to your device and watch them without an internet connection anytime, anywhere." },
      ],
    },
    {
      title: "Subscriptions & Pricing",
      icon: CreditCard,
      items: [
        { q: "What subscription plans are available?", a: "We offer flexible subscription plans: monthly and yearly. The yearly plan saves you up to 10%. Special plans for educational institutions are also available." },
        { q: "How do I pay?", a: "We accept payment via bank cards (Visa, Mastercard) and electronic payment services. All financial transactions are fully secured and encrypted." },
        { q: "Can I cancel my subscription?", a: "Yes, you can cancel your subscription at any time from your account settings. There are no cancellation fees or long-term commitments." },
        { q: "Is there a money-back guarantee?", a: "Yes, we offer a 7-day money-back guarantee from the subscription date if you are not satisfied with the service." },
      ],
    },
    {
      title: "Educational Institutions",
      icon: Users,
      items: [
        { q: "How can my college/institute register?", a: "Educational institutions can register through the University Platform page and fill out the registration form. The application will be reviewed and responded to within 48 business hours." },
        { q: "How do institution invitation codes work?", a: "After the institution is approved, the administrator can create special invitation codes for each department. Lecturers and students use these codes to join the institution on the platform." },
        { q: "Can schools benefit from the platform?", a: "Yes, we provide a comprehensive school platform that includes classroom management, schedules, student performance tracking, and parent communication." },
        { q: "What is the cost for institutions?", a: "We offer special pricing plans for educational institutions based on the number of students and departments. Contact us for a customized quote." },
      ],
    },
    {
      title: "Book Store",
      icon: BookOpen,
      items: [
        { q: "How do I buy a book?", a: "Browse the book store and select the desired book, add it to your cart, and complete the purchase. E-books will be available immediately after payment." },
        { q: "What book formats are available?", a: "We offer books in PDF format and printed books. Some books are available in both formats." },
        { q: "Can I return a book?", a: "E-books are non-returnable after download. Printed books can be returned within 14 days provided they are in their original condition." },
      ],
    },
    {
      title: "Account & Security",
      icon: Shield,
      items: [
        { q: "How do I create an account?", a: "Click 'Sign Up' and choose the appropriate account type (student, lecturer, parent, etc.). Complete the required information and verify your email address." },
        { q: "I forgot my password, what should I do?", a: "Click 'Forgot Password' on the login page and enter your email address. You will receive a message to reset your password." },
        { q: "Is my data secure?", a: "Yes, we use the highest security standards to protect your personal and financial data. All data is encrypted and protected with advanced technologies." },
        { q: "How do I edit my personal information?", a: "You can edit your information from your profile page after logging in. You can change your name, photo, and phone number." },
      ],
    },
    {
      title: "Technical Support",
      icon: MessageCircle,
      items: [
        { q: "How do I contact support?", a: "You can reach us through the 'Contact Us' page, or via WhatsApp at 00966563057356 for an immediate response." },
        { q: "What are support working hours?", a: "The support team is available Sunday to Thursday, from 9 AM to 6 PM Saudi time. Messages outside working hours will be responded to on the next business day." },
        { q: "Is there a user guide?", a: "Yes, you can visit the Help Center to view detailed user guides and visual tutorials for all platform features." },
      ],
    },
  ],
};

const FAQ = () => {
  const { language, dir } = useLanguage();
  const isRtl = language === "ar";
  const categories = isRtl ? faqCategories.ar : faqCategories.en;

  return (
    <div dir={dir} className="min-h-screen bg-background flex flex-col">
      <SimpleHeader />
      <div className="flex-1 py-12 px-6 md:px-12">
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
      </div>
      <SiteFooter />
    </div>
  );
};

export default FAQ;
