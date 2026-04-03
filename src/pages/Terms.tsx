import { Link } from "react-router-dom";
import { FileText } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import SimpleHeader from "@/components/SimpleHeader";
import SiteFooter from "@/components/SiteFooter";

const Terms = () => {
  const { language, dir } = useLanguage();
  const isRtl = dir === "rtl";

  const content = {
    ar: {
      title: "الشروط والأحكام",
      lastUpdate: "آخر تحديث: 1 أبريل 2026",
      sections: [
        {
          title: "1. مقدمة",
          text: "مرحباً بك في منصة UNIGATES التعليمية التابعة لدار عبيد للنشر والتوزيع والطباعة ش.ذ.م.م. باستخدامك لهذه المنصة، فإنك توافق على الالتزام بهذه الشروط والأحكام. يرجى قراءتها بعناية قبل استخدام المنصة.",
        },
        {
          title: "2. تعريفات",
          text: "\"المنصة\" تشير إلى موقع UNIGATES الإلكتروني وتطبيقاته. \"المستخدم\" يشير إلى أي شخص يستخدم المنصة سواء كان طالباً أو محاضراً أو مؤسسة تعليمية. \"المحتوى\" يشمل جميع المواد التعليمية والدورات والكتب والبث المباشر المتاحة على المنصة.",
        },
        {
          title: "3. التسجيل والحساب",
          text: "يجب أن تكون المعلومات المقدمة عند التسجيل صحيحة ودقيقة. أنت مسؤول عن الحفاظ على سرية معلومات حسابك وكلمة المرور. يحق للمنصة تعليق أو إلغاء أي حساب يخالف هذه الشروط. يجب أن يكون عمر المستخدم 16 عاماً على الأقل للتسجيل بشكل مستقل.",
        },
        {
          title: "4. الاشتراكات والمدفوعات",
          text: "تتوفر خطط اشتراك مختلفة للمؤسسات التعليمية. يتم تجديد الاشتراكات تلقائياً ما لم يتم الإلغاء قبل نهاية فترة الاشتراك. يمكن طلب استرداد المبلغ خلال 7 أيام من تاريخ الاشتراك وفقاً لسياسة الاسترداد.",
        },
        {
          title: "5. الملكية الفكرية",
          text: "جميع المحتويات المنشورة على المنصة محمية بموجب قوانين حقوق الملكية الفكرية. لا يجوز نسخ أو توزيع أو تعديل أي محتوى دون إذن كتابي مسبق. يحتفظ المحاضرون بحقوق ملكية محتواهم مع منح المنصة ترخيصاً لعرضه.",
        },
        {
          title: "6. سلوك المستخدم",
          text: "يُحظر استخدام المنصة لأي غرض غير قانوني أو غير أخلاقي. يُحظر مشاركة معلومات الحساب مع الآخرين. يُحظر تسجيل أو تحميل المحتوى دون إذن. يُحظر التحرش أو الإساءة لأي مستخدم آخر.",
        },
        {
          title: "7. المسؤولية والضمان",
          text: "تُقدَّم المنصة 'كما هي' دون ضمانات صريحة أو ضمنية. لا تتحمل المنصة المسؤولية عن أي أضرار غير مباشرة ناتجة عن استخدام الخدمة. نسعى لضمان توفر المنصة على مدار الساعة ولكن قد تحدث فترات صيانة مجدولة.",
        },
        {
          title: "8. تعديل الشروط",
          text: "يحق لنا تعديل هذه الشروط في أي وقت. سيتم إخطار المستخدمين بأي تغييرات جوهرية عبر البريد الإلكتروني أو إشعار داخل المنصة. استمرار استخدام المنصة بعد التعديل يُعد موافقة على الشروط المحدّثة.",
        },
        {
          title: "9. القانون الواجب التطبيق",
          text: "تخضع هذه الشروط لقوانين المملكة العربية السعودية. أي نزاع ينشأ عن استخدام المنصة يتم حله ودياً أولاً، وفي حال عدم التوصل لحل يُحال إلى المحاكم المختصة.",
        },
      ],
    },
    en: {
      title: "Terms & Conditions",
      lastUpdate: "Last updated: April 1, 2026",
      sections: [
        {
          title: "1. Introduction",
          text: "Welcome to the UNIGATES educational platform by Dar Obaid Publishing, Distribution & Printing LLC. By using this platform, you agree to comply with these terms and conditions. Please read them carefully before using the platform.",
        },
        {
          title: "2. Definitions",
          text: "\"Platform\" refers to the UNIGATES website and applications. \"User\" refers to anyone using the platform, whether a student, lecturer, or educational institution. \"Content\" includes all educational materials, courses, books, and live streams available on the platform.",
        },
        {
          title: "3. Registration and Account",
          text: "Information provided during registration must be accurate and truthful. You are responsible for maintaining the confidentiality of your account information and password. The platform reserves the right to suspend or cancel any account that violates these terms. Users must be at least 16 years old to register independently.",
        },
        {
          title: "4. Subscriptions and Payments",
          text: "Various subscription plans are available for educational institutions. Subscriptions auto-renew unless cancelled before the end of the subscription period. Refund requests can be made within 7 days of subscription according to the refund policy.",
        },
        {
          title: "5. Intellectual Property",
          text: "All content published on the platform is protected by intellectual property laws. Copying, distributing, or modifying any content without prior written permission is prohibited. Lecturers retain ownership rights to their content while granting the platform a license to display it.",
        },
        {
          title: "6. User Conduct",
          text: "Using the platform for any illegal or unethical purpose is prohibited. Sharing account information with others is prohibited. Recording or downloading content without permission is prohibited. Harassment or abuse of any other user is prohibited.",
        },
        {
          title: "7. Liability and Warranty",
          text: "The platform is provided 'as is' without express or implied warranties. The platform is not liable for any indirect damages resulting from use of the service. We strive to ensure 24/7 availability but scheduled maintenance periods may occur.",
        },
        {
          title: "8. Modification of Terms",
          text: "We reserve the right to modify these terms at any time. Users will be notified of any material changes via email or in-platform notification. Continued use of the platform after modification constitutes acceptance of the updated terms.",
        },
        {
          title: "9. Governing Law",
          text: "These terms are governed by the laws of the Kingdom of Saudi Arabia. Any dispute arising from the use of the platform shall first be resolved amicably, and if no resolution is reached, referred to the competent courts.",
        },
      ],
    },
  };

  const c = content[language];

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={dir}>
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
