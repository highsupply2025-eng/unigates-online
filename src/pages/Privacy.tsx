import { Shield, Mail, Phone, Lock, Eye, FileText, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import SimpleHeader from "@/components/SimpleHeader";
import SEO from "@/components/SEO";
import SiteFooter from "@/components/SiteFooter";

const Privacy = () => {
  const { language, dir } = useLanguage();
  const isRtl = dir === "rtl";

  const content = {
    ar: {
      title: "سياسة الخصوصية وأمان البيانات",
      subtitle: "منظومة UNIGATES — شركة دار عبيد للنشر والتوزيع والطباعة ش.ذ.م.م.",
      lastUpdate: "آخر تحديث: أبريل 2026 (الإصدار 3.4)",
      intro: "تلتزم منظومة UNIGATES الموحدة بأعلى معايير حماية البيانات والأمان الرقمي بما يتوافق مع المعايير الدولية (ISO 27001 و GDPR) وأنظمة حماية البيانات في المملكة العربية السعودية والشرق الأوسط. توضح هذه السياسة كيف نجمع ونعالج ونحمي بياناتك عبر منصاتنا الست المتكاملة.",
      sections: [
        {
          title: "1. نطاق المنظومة والبيانات المجمعة",
          text: "تشمل سياسة الخصوصية كافة البوابات الرقمية التابعة لمنظومة UNIGATES:",
          points: [
            "التعليم الجامعي (الكليات والمعاهد): بيانات التسجيل الأكاديمي، المقررات، سجلات الحضور، والنتائج.",
            "التعليم المدرسي (K-12): بيانات المدارس، الفصول، المعلمين، الطلاب، وتقارير أولياء الأمور.",
            "أكاديمية الدورات والمهارات: سجلات التعلم، مدة مشاهدة المحتوى المرئي بنظام DRM، واختبارات قياس الكفاءة.",
            "المكتبة الرقمية: سجلات الإعارة، القراءات، وعمليات شراء الكتب الرقمية والمطبوعة.",
            "بوابة دار ناشر: عقود النشر، الحقوق الفكرية، تقارير المبيعات، ومستحقات المؤلفين والناشرين.",
            "بوابة التوظيف (Career Portal): السير الذاتية (CVs)، الخبرات، طلبات التوظيف، ونتائج التقييمات المهنية."
          ]
        },
        {
          title: "2. كيف نستخدم معلوماتك ونعالجها",
          text: "تُستخدم البيانات المعالجة للأغراض التالية فقط:",
          points: [
            "توفير وإدارة الخدمات التعليمية والأكاديمية والمهنية بكفاءة عالية.",
            "التحقق من صحة وصلاحية الشهادات الصادرة عبر نظام الأرقام المرجعية ورموز الاستجابة السريعة (QR Code).",
            "حماية المحتوى التعليمي ومنع القرصنة وتسريب الملكية الفكرية باستخدام تقنيات العلامات المائية الديناميكية و DRM.",
            "إصدار الفواتير الرسمية وسندات القبض ومطابقة المستحقات المالية بأمان.",
            "تخصيص الواجهة وتوفير التجربة التعليمية باللغات الثماني المعتمدة (العربية، الإنجليزية، الفرنسية، الألمانية، التركية، الصينية، الإسبانية، الروسية)."
          ]
        },
        {
          title: "3. أمان البيانات وعزل السجلات (RLS & Encryption)",
          text: "نطبق أحدث تقنيات الأمان السيبراني لحماية سرية معلوماتك:",
          points: [
            "عزل كامل للبيانات على مستوى الصفوف (Row Level Security - RLS) لضمان عدم وصول أي جهة أو مؤسسة لبيانات مؤسسة أخرى.",
            "تشفير كامل لكافة البيانات أثناء النقل (TLS 1.3) وأثناء التخزين (AES-256).",
            "مراقبة أمنية على مدار الساعة لرصد أي محاولات اختراق أو نشاط غير مصرح به.",
            "نسخ احتياطي دوري مشفر في بيئات سحابية موزعة جغرافياً ومحمية بالكامل."
          ]
        },
        {
          title: "4. مشاركة المعلومات وعدم بيع البيانات",
          text: "تلتزم شركة دار عبيد بعدم بيع أو تأجير أو المتاجرة بالبيانات الشخصية لأي طرف ثالث تحت أي ظرف. تقتصر مشاركة البيانات المحدودة على:",
          points: [
            "المؤسسة التعليمية أو صاحب العمل الذي ينتمي إليه المستخدم بشكل رسمي وموثق.",
            "بوابات الدفع الإلكتروني المعتمدة والمرخصة لمعالجة العمليات المالية المشفرة.",
            "الجهات الرسمية والتنظيمية فقط في حال وجود متطلب قانوني ملزم وفق الأنظمة السارية."
          ]
        },
        {
          title: "5. حقوق المستخدم والتحكم في البيانات",
          text: "يتمتع جميع مستخدمي UNIGATES بالحقوق الكاملة للتحكم في بياناتهم الشخصية:",
          points: [
            "حق الوصول إلى نسختك الشخصية من البيانات وسجل النشاط.",
            "حق تصحيح وتحديث البيانات الشخصية والأكاديمية غير الدقيقة.",
            "حق طلب حذف الحساب والبيانات المرتبطة بعد تسوية الالتزامات الأكاديمية أو المالية المعتمدة.",
            "حق إلغاء الاشتراك في التنبيهات والرسائل البريدية الإخبارية بنقرة واحدة."
          ]
        },
        {
          title: "6. ملفات تعريف الارتباط وتقنيات التتبع (Cookies)",
          text: "نستخدم ملفات تعريف الارتباط التقنية الضرورية فقط لتأمين جلسات الدخول وحفظ تفضيلات اللغة والمظهر الداكن/الفاتح، بالإضافة لأدوات تحليلية مجهولة الهوية لتحسين أداء المنصة وسرعة الاستجابة."
        },
        {
          title: "7. المسؤولية والتواصل الرسمي",
          text: "لأية استفسارات تتعلق بسياسة الخصوصية، طلبات حذف البيانات، أو الإبلاغ عن أي مسألة أمنية، يرجى التواصل مباشرة مع فريق حماية البيانات في شركة دار عبيد:",
          emailNote: "البريد الإلكتروني المعتمد:",
          whatsappNote: "واتساب الدعم السريع:"
        }
      ],
      quickContact: "تواصل مع مسؤول حماية البيانات"
    },
    en: {
      title: "Privacy & Data Protection Policy",
      subtitle: "UNIGATES Ecosystem — Dar Obaid Publishing, Distribution & Printing LLC",
      lastUpdate: "Last updated: April 2026 (v3.4)",
      intro: "The unified UNIGATES ecosystem is committed to the highest standards of data protection and digital security in full compliance with international frameworks (ISO 27001, GDPR) and regional data protection regulations. This policy outlines how we collect, process, and safeguard your data across our 6 integrated platforms.",
      sections: [
        {
          title: "1. Scope & Collected Data",
          text: "This Privacy Policy applies across all official UNIGATES portals:",
          points: [
            "Higher Education (Colleges & Institutes): Academic registration, course records, attendance logs, and GPA results.",
            "K-12 School Management: School rosters, class structures, teachers, students, and parent reports.",
            "Courses & Skills Academy: Learning histories, DRM-protected video watch times, and skill assessments.",
            "Digital Book Store: Borrowing records, reading telemetry, and print/e-book order histories.",
            "Nasher Publisher Platform: Publishing contracts, intellectual property records, sales reports, and royalty statements.",
            "Career Job Portal: Resumes (CVs), professional work experience, job applications, and screening assessments."
          ]
        },
        {
          title: "2. How We Use & Process Your Information",
          text: "Collected information is strictly processed for legitimate operational purposes:",
          points: [
            "Delivering and maintaining high-performance academic, educational, and hiring services.",
            "Instant cryptographic verification of certificates via reference numbers and dynamic QR codes.",
            "Protecting digital assets from piracy with forensic watermarking and multi-DRM stream encryption.",
            "Generating verified electronic invoices and transparent ledger balancing.",
            "Delivering tailored user experiences in all 8 supported languages (Arabic, English, French, German, Turkish, Chinese, Spanish, Russian)."
          ]
        },
        {
          title: "3. Data Security & Row-Level Isolation (RLS & Encryption)",
          text: "We implement defense-in-depth cybersecurity controls to guarantee confidentiality:",
          points: [
            "Strict Row-Level Security (RLS) isolating every institution's datasets from unauthorized external access.",
            "End-to-end encryption in transit (TLS 1.3) and at rest (AES-256) across all database clusters.",
            "24/7 automated intrusion detection and anomalous activity monitoring.",
            "Encrypted, geo-redundant backups ensuring zero data loss and rapid disaster recovery."
          ]
        },
        {
          title: "4. Zero-Sale Commitment & Data Sharing",
          text: "Dar Obaid Publishing LLC never sells, monetizes, or rents personal data to any third party. Limited data exchange is strictly restricted to:",
          points: [
            "The verified educational institution or prospective employer explicitly linked to your account.",
            "PCI-DSS compliant payment gateways processing encrypted monetary transactions.",
            "Official legal and governmental bodies only when mandated by binding statutory requirements."
          ]
        },
        {
          title: "5. Your Privacy Rights & Data Control",
          text: "Every UNIGATES user retains complete ownership and control over their personal data:",
          points: [
            "Right to inspect and download an export of your personal profile and activity log.",
            "Right to request prompt rectification of inaccurate academic or personal records.",
            "Right to account deletion upon clearing all institutional and financial obligations.",
            "Right to unsubscribe from marketing and automated notifications with a single click."
          ]
        },
        {
          title: "6. Cookies & Tracking Technologies",
          text: "We use essential cookies strictly required for authentication sessions, dark/light theme persistence, and language preference retention, alongside anonymized telemetry to optimize server load and global response times."
        },
        {
          title: "7. Governance & Official Inquiries",
          text: "For questions regarding this Privacy Policy, data subject requests, or security disclosures, contact the Data Protection Office at Dar Obaid Publishing LLC:",
          emailNote: "Official Privacy Email:",
          whatsappNote: "Fast Support WhatsApp:"
        }
      ],
      quickContact: "Contact Data Protection Officer"
    }
  };

  const c = content[language];
  const gmailUrl = "https://mail.google.com/mail/?view=cm&fs=1&to=darobaid@unigates.online&su=" + 
    encodeURIComponent(isRtl ? "استفسار بخصوص سياسة الخصوصية وأمان البيانات — UNIGATES" : "Privacy & Data Protection Inquiry — UNIGATES");
  const whatsappUrl = "https://wa.me/966563057356?text=" + 
    encodeURIComponent(isRtl ? "مرحباً، أود الاستفسار بخصوص سياسة الخصوصية وأمان البيانات في منظومة UNIGATES." : "Hello, I have an inquiry regarding UNIGATES Privacy & Data Protection Policy.");

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={dir}>
      <SEO
        title={isRtl ? "سياسة الخصوصية وأمان البيانات — UNIGATES" : "Privacy & Data Security Policy — UNIGATES"}
        description={isRtl ? "تعرف على معايير حماية البيانات وتشفير السجلات وسياسة الخصوصية عبر منصات UNIGATES الست المتكاملة." : "Learn how UNIGATES secures, encrypts, and protects user data across all 6 integrated educational platforms."}
      />
      <SimpleHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/15 via-primary/5 to-background py-16 px-6 border-b border-border/40">
          <div className="max-w-4xl mx-auto text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-[hsl(200,75%,30%)] shadow-xl shadow-primary/30 flex items-center justify-center mx-auto mb-6">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-foreground mb-3">{c.title}</h1>
            <p className="text-primary font-semibold text-sm md:text-base mb-2">{c.subtitle}</p>
            <p className="text-foreground/60 text-xs md:text-sm">{c.lastUpdate}</p>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-16 px-6">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Intro Alert Box */}
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 md:p-8 flex items-start gap-4">
              <Lock className="w-6 h-6 text-primary shrink-0 mt-1" />
              <p className="text-foreground/80 leading-relaxed text-sm md:text-base">{c.intro}</p>
            </div>

            {/* Sections */}
            {c.sections.map((s, i) => (
              <div key={i} className="bg-card border border-border/60 hover:border-primary/30 transition-all rounded-2xl p-6 md:p-8 shadow-sm">
                <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  {s.title}
                </h2>
                <p className="text-foreground/70 leading-relaxed text-sm md:text-base mb-4">{s.text}</p>
                
                {s.points && (
                  <ul className="space-y-3 pl-2 pr-2">
                    {s.points.map((pt, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm md:text-base text-foreground/80">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Section 7 Contact Cards */}
                {s.emailNote && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-4 border-t border-border/40">
                    <a
                      href={gmailUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 hover:bg-primary/10 border border-primary/20 transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                        <Mail className="w-5 h-5" />
                      </div>
                      <div className="overflow-hidden">
                        <div className="text-xs text-foreground/60">{s.emailNote}</div>
                        <div className="text-sm font-bold text-foreground truncate">darobaid@unigates.online</div>
                      </div>
                    </a>

                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/20 transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                        <Phone className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs text-foreground/60">{s.whatsappNote}</div>
                        <div className="text-sm font-bold text-emerald-600" dir="ltr">+966 56 305 7356</div>
                      </div>
                    </a>
                  </div>
                )}
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
