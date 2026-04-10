import { Link } from "react-router-dom";
import { Shield } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

const Privacy = () => {
  const { language, dir } = useLanguage();
  const isRtl = dir === "rtl";

  const content = {
    ar: {
      title: "سياسة الخصوصية",
      lastUpdate: "آخر تحديث: 1 أبريل 2026",
      sections: [
        {
          title: "1. المعلومات التي نجمعها",
          text: "نجمع المعلومات التالية عند التسجيل واستخدام المنصة: المعلومات الشخصية (الاسم، البريد الإلكتروني، رقم الهاتف)، معلومات الحساب الأكاديمي (المؤسسة التعليمية، التخصص، الدور)، بيانات الاستخدام (الدورات المشاهدة، التقدم الدراسي، الوقت المستغرق)، والمعلومات التقنية (عنوان IP، نوع المتصفح، نظام التشغيل).",
        },
        {
          title: "2. كيف نستخدم معلوماتك",
          text: "نستخدم المعلومات المجمعة لتوفير وتحسين خدمات المنصة التعليمية، تخصيص تجربة التعلم وتقديم توصيات مناسبة، التواصل معك بشأن حسابك والتحديثات المهمة، ضمان أمان المنصة ومنع الاستخدام غير المصرح به، والامتثال للمتطلبات القانونية والتنظيمية.",
        },
        {
          title: "3. مشاركة المعلومات",
          text: "لا نبيع أو نؤجر معلوماتك الشخصية لأطراف ثالثة. قد نشارك المعلومات مع المؤسسات التعليمية التي تنتمي إليها (مثل الكلية أو المعهد) لأغراض أكاديمية، ومع مزودي خدمات الدفع لمعالجة المعاملات المالية بشكل آمن، وعند الحاجة للامتثال للقوانين أو الأوامر القضائية.",
        },
        {
          title: "4. حماية البيانات",
          text: "نتخذ إجراءات أمنية صارمة لحماية بياناتك تشمل: تشفير البيانات أثناء النقل والتخزين باستخدام بروتوكولات SSL/TLS، نظام تحكم في الوصول يعتمد على الأدوار (RLS) لضمان رؤية كل مستخدم لبياناته فقط، نسخ احتياطي منتظم للبيانات، ومراجعات أمنية دورية.",
        },
        {
          title: "5. حقوقك",
          text: "لديك الحق في الوصول إلى معلوماتك الشخصية وتعديلها، طلب حذف حسابك وبياناتك، الانسحاب من الرسائل التسويقية في أي وقت، طلب نسخة من بياناتك الشخصية (حق النقل)، والاعتراض على معالجة بياناتك لأغراض معينة.",
        },
        {
          title: "6. ملفات تعريف الارتباط (الكوكيز)",
          text: "نستخدم ملفات تعريف الارتباط الأساسية لتشغيل المنصة بشكل صحيح وتذكر تفضيلاتك (مثل اللغة). كما نستخدم ملفات تعريف تحليلية لفهم كيفية استخدام المنصة وتحسينها. يمكنك التحكم في إعدادات الكوكيز من خلال متصفحك.",
        },
        {
          title: "7. خصوصية الأطفال",
          text: "لا نجمع معلومات من الأطفال دون سن 16 عاماً بشكل مستقل. يجب أن يتم تسجيل الطلاب القُصّر من خلال مؤسساتهم التعليمية أو أولياء أمورهم. إذا علمنا بجمع بيانات طفل دون موافقة ولي الأمر، سنقوم بحذفها فوراً.",
        },
        {
          title: "8. التعديلات على السياسة",
          text: "قد نقوم بتحديث سياسة الخصوصية من وقت لآخر. سنخطرك بأي تغييرات جوهرية عبر البريد الإلكتروني أو إشعار بارز على المنصة قبل 30 يوماً من سريان التعديلات.",
        },
        {
          title: "9. تواصل معنا",
          text: "إذا كانت لديك أي أسئلة أو مخاوف بشأن سياسة الخصوصية، يمكنك التواصل معنا عبر الواتساب على الرقم 00966563057356 أو عبر البريد الإلكتروني. نحرص على الرد خلال 48 ساعة عمل.",
        },
      ],
    },
    en: {
      title: "Privacy Policy",
      lastUpdate: "Last updated: April 1, 2026",
      sections: [
        {
          title: "1. Information We Collect",
          text: "We collect the following information during registration and platform use: Personal information (name, email, phone number), academic account information (institution, specialization, role), usage data (courses viewed, study progress, time spent), and technical information (IP address, browser type, operating system).",
        },
        {
          title: "2. How We Use Your Information",
          text: "We use collected information to provide and improve platform services, personalize the learning experience and provide suitable recommendations, communicate with you about your account and important updates, ensure platform security and prevent unauthorized use, and comply with legal and regulatory requirements.",
        },
        {
          title: "3. Information Sharing",
          text: "We do not sell or rent your personal information to third parties. We may share information with educational institutions you belong to for academic purposes, with payment service providers to process financial transactions securely, and when needed to comply with laws or court orders.",
        },
        {
          title: "4. Data Protection",
          text: "We take strict security measures to protect your data including: data encryption during transit and storage using SSL/TLS protocols, role-based access control (RLS) ensuring each user sees only their data, regular data backups, and periodic security reviews.",
        },
        {
          title: "5. Your Rights",
          text: "You have the right to access and modify your personal information, request deletion of your account and data, opt out of marketing messages at any time, request a copy of your personal data (portability right), and object to processing of your data for certain purposes.",
        },
        {
          title: "6. Cookies",
          text: "We use essential cookies to operate the platform correctly and remember your preferences (such as language). We also use analytical cookies to understand how the platform is used and improve it. You can control cookie settings through your browser.",
        },
        {
          title: "7. Children's Privacy",
          text: "We do not independently collect information from children under 16. Minor students must be registered through their educational institutions or guardians. If we learn that we have collected data from a child without parental consent, we will delete it immediately.",
        },
        {
          title: "8. Policy Changes",
          text: "We may update the privacy policy from time to time. We will notify you of any material changes via email or prominent notice on the platform 30 days before the changes take effect.",
        },
        {
          title: "9. Contact Us",
          text: "If you have any questions or concerns about the privacy policy, you can contact us via WhatsApp at 00966563057356 or via email. We ensure a response within 48 business hours.",
        },
      ],
    },
  };

  const c = content[language];

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={dir}>
      <SiteHeader />

      <main className="flex-1">
        <section className="bg-gradient-to-br from-primary/10 to-primary/5 py-16 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-[hsl(200,75%,30%)] shadow-xl shadow-primary/30 flex items-center justify-center mx-auto mb-6">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-foreground mb-4">{c.title}</h1>
            <p className="text-foreground/60 text-sm">{c.lastUpdate}</p>
          </div>
        </section>

        <section className="py-16 px-6">
          <div className="max-w-3xl mx-auto space-y-8">
            {c.sections.map((s, i) => (
              <div key={i} className="bg-card border border-primary/10 rounded-xl p-6">
                <h2 className="text-xl font-bold text-foreground mb-3">{s.title}</h2>
                <p className="text-foreground/70 leading-relaxed">{s.text}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
};

export default Privacy;
