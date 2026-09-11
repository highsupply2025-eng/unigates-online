import { Link } from "react-router-dom";
import { FileText } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import SimpleHeader from "@/components/SimpleHeader";
import SEO from "@/components/SEO";
import SiteFooter from "@/components/SiteFooter";

const Terms = () => {
  const { language, dir } = useLanguage();
  const isRtl = dir === "rtl";

  const content = {
    ar: {
      title: "الشروط والأحكام والسياسات المنظمة",
      lastUpdate: "آخر تحديث شامل: سبتمبر 2026",
      sections: [
        {
          title: "1. المقدمة ونطاق المنظومة",
          text: "مرحباً بك في منظومة UNIGATES الرقمية الموحدة التابعة لشركة دار عبيد للنشر والتوزيع والطباعة ش.ذ.م.م. تغطي هذه الشروط والأحكام كافة البوابات الست التابعة للمنظومة: (1) المنصة الجامعية لكليات ومعاهد التعليم العالي، (2) المنصة المدرسية K-12، (3) أكاديمية الدورات والتدريب المهني ومراكز اللغات، (4) متجر الكتب الرقمية، (5) منصة ناشر لإدارة عقود وحقوق النشر، و (6) منصة UNIGATES Career للتوظيف والفرص المهنية.",
        },
        {
          title: "2. التعريفات وحسابات المستخدمين",
          text: "تشمل المنظومة أدواراً متعددة الصلاحيات: (إدارة الكلية/المعهد، عميد، وكيل، رئيس قسم، عضو هيئة تدريس، إدارة مدرسة، معلم متميز، مدرب مستقل، مركز تدريب، مركز لغات وترجمة، طالب ومتدرب، ولي أمر، مؤلف ودار نشر، وجهة توظيف). يلتزم كل مستخدم بالحفاظ على سرية بيانات تسجيل الدخول وعدم مشاركة الحسابات المؤسسية.",
        },
        {
          title: "3. حماية المحتوى والملكية الفكرية ونظام DRM",
          text: "كافة المحاضرات المرئية، المواد التفاعلية، بنوك الأسئلة، والمخطوطات محمية بأنظمة التشفير الرقمي المتقدمة (Enterprise DRM) وعلامات الحماية المائية. يُحظر تماماً محاولة تفكيك التشفير، تسجيل الشاشات، إعادة البث، أو بيع المحتوى دون ترخيص كتابي صريح من دار عبيد وأصحاب الحقوق.",
        },
        {
          title: "4. سلاسل الاعتماد الرقمي والحوكمة الأكاديمية",
          text: "تلتزم المؤسسات الأكاديمية باستخدام دورات العمل المعتمدة لإقرار الجداول، وتوثيق بنوك الأسئلة، واعتماد الاختبارات من خلال تسلسل الصلاحيات الرقمي (المحاضر ⬅️ رئيس القسم ⬅️ وكيل الكلية ⬅️ العميد). وتُعد كافة الاعتمادات الرقمية داخل المنظومة موثقة ومقروءة قانونياً للأغراض الأكاديمية.",
        },
        {
          title: "5. الشهادات الرقمية المعتمدة (QR Verification)",
          text: "الشهادات الصادرة عن دورات المنصة والأكاديميات التدريبية تصدر بتشفير رقمي يتضمن رمز QR فريد للتحقق الدولي. يُحظر تزوير أو التلاعب ببيانات الشهادات، وتُعرض أي محاولة للتلاعب للمساءلة القانونية وإلغاء الحساب نهائياً.",
        },
        {
          title: "6. حقوق النشر وعقود منصة ناشر (Publisher)",
          text: "تخضع العلاقات التعاقدية بين المؤلفين ودور النشر للشروط المنصوص عليها في العقود الرقمية الموقعة عبر المنصة، مع التزام المنظومة بتوفير كشوف مبيعات دقيقة وتوزيع نسب الأرباح المتفق عليها وفق الجداول الدورية.",
        },
        {
          title: "7. سياسات التوظيف والتقديم في UNIGATES Career",
          text: "تلتزم المنصة بتوفير بيئة توظيف شفافة للجهات وأصحاب الكفاءات. يلتزم المتقدمون بتقديم بيانات وسير ذاتية ومؤهلات صحيحة وموثقة، ويلتزم أصحاب العمل بعدم استغلال بيانات المتقدمين خارج نطاق التوظيف المعلن.",
        },
        {
          title: "8. الاشتراكات، المدفوعات وسياسة الاسترداد",
          text: "تتم المدفوعات والاشتراكات عبر بوابات الدفع الإلكتروني المعتمدة المشفرة بنظام 256-bit SSL. الاشتراكات الفردية قابلة للاسترداد خلال 7 أيام من تاريخ الدفع في حال عدم تحميل أو استهلاك أكثر من 15% من محتوى الدورة. العقود والاشتراكات المؤسسية تخضع للاتفاقيات المبرمة.",
        },
        {
          title: "9. القانون الواجب التطبيق والاختصاص القضائي",
          text: "تخضع هذه الشروط والسياسات للأنظمة والقوانين المعمول بها في المملكة العربية السعودية، ويتم فض أي نزاع ودياً أولاً أو اللجوء للجهات القضائية المختصة.",
        },
      ],
    },
    en: {
      title: "Terms & Conditions of Service",
      lastUpdate: "Last Updated: September 2026",
      sections: [
        {
          title: "1. Introduction & Ecosystem Scope",
          text: "Welcome to the UNIGATES digital ecosystem by Dar Obaid Publishing, Distribution & Printing LLC. These Terms & Conditions govern all six unified portals: (1) Higher Education University Platform for colleges & institutes, (2) K-12 School Platform, (3) Courses & Skills Academy, (4) Digital Book Store, (5) Nasher Publishing & Royalty Platform, and (6) UNIGATES Career job portal.",
        },
        {
          title: "2. User Roles & Account Security",
          text: "The ecosystem features role-based access control (Dean, Vice Dean, Department Head, Faculty Member, School Admin, Distinguished Teacher, Instructor, Training Center, Language & Translation Center, Student/Trainee, Parent, Author/Publisher, and Employer). Users must maintain the confidentiality of credentials and avoid unauthorized sharing.",
        },
        {
          title: "3. Content Protection, IP & Enterprise DRM",
          text: "All video lectures, interactive learning materials, exam question banks, and book manuscripts are protected with Enterprise DRM digital encryption and dynamic watermarks. Any attempt to record, screen-capture, redistribute, or reverse-engineer content is strictly prohibited.",
        },
        {
          title: "4. Digital Governance & Approval Chains",
          text: "Academic institutions must follow multi-tier digital approval chains for academic schedules, question banks, and examination workflows (Faculty ⬅️ Head of Department ⬅️ Vice Dean ⬅️ Dean). All digital signatures and approvals within the portal are legally binding records.",
        },
        {
          title: "5. Verifiable QR Digital Certificates",
          text: "Certificates earned through courses and accredited training centers are issued with unique verifiable QR security codes. Any forgery or unauthorized reproduction of credentials will result in immediate termination of access and potential legal proceedings.",
        },
        {
          title: "6. Nasher Publishing & Contract Protocols",
          text: "Publishing rights, manuscript management, and royalty allocations are regulated according to the digital agreements executed through the Nasher platform, ensuring transparent real-time sales reporting and timely payouts.",
        },
        {
          title: "7. UNIGATES Career & Recruitment Standards",
          text: "The Career portal provides a verified recruitment environment. Job applicants must provide authentic credentials and resumes, and hiring organizations agree to use applicant data exclusively for legitimate recruitment processes.",
        },
        {
          title: "8. Subscriptions, Payments & Refund Policy",
          text: "Financial transactions are secured with 256-bit SSL encryption. Individual learners may request a refund within 7 days of purchase, provided that less than 15% of the course content has been accessed. Institutional contracts are governed by custom terms.",
        },
        {
          title: "9. Governing Law & Jurisdiction",
          text: "These terms are governed by the applicable laws and regulations of the Kingdom of Saudi Arabia. Any disputes shall be resolved amicably or submitted to the competent judicial authorities.",
        },
      ],
    },
  };

  const c = content[language];

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={dir}>
      <SEO
        title={isRtl ? "شروط الاستخدام — UNIGATES" : "Terms of Service — UNIGATES"}
        description={isRtl ? "الشروط والأحكام التي تنظم استخدام منصة UNIGATES التعليمية." : "The terms governing the use of the UNIGATES educational platform."}
      />
      <SimpleHeader />

      <main className="flex-1">
        <section className="bg-gradient-to-br from-primary/10 to-primary/5 py-16 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-[hsl(200,75%,30%)] shadow-xl shadow-primary/30 flex items-center justify-center mx-auto mb-6">
              <FileText className="w-10 h-10 text-white" />
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

export default Terms;
