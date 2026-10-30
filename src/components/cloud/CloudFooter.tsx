import { Link } from "react-router-dom";
import { ArrowUpLeft, Cloud } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { cloudSpaces } from "@/lib/cloudSpaces";

export default function CloudFooter() {
  const { isRtl } = useLanguage();
  return <footer className="cloud-footer">
    <div className="cloud-footer-main"><div><Link to="/" className="text-3xl font-black inline-flex items-center gap-3"><Cloud />UNIGATES</Link><p className="mt-4 text-sm leading-7 text-muted-foreground">{isRtl ? "مساحات سحابية لمؤسسات تصنع مستقبل التعليم." : "Cloud spaces for institutions shaping the future of education."}</p><a className="inline-flex gap-2 items-center mt-5 text-sm" href="mailto:darobaid@unigates.online">darobaid@unigates.online<ArrowUpLeft size={16} /></a></div>
      <div><h3>{isRtl ? "مساحتك السحابية" : "Your cloud space"}</h3>{cloudSpaces.map(s => <Link key={s.id} to={s.route}>{isRtl ? s.ar : s.en}</Link>)}</div>
      <div><h3>{isRtl ? "عن UNIGATES" : "About UNIGATES"}</h3><Link to="/contact">{isRtl ? "تواصل معنا" : "Contact"}</Link><Link to="/help-center">{isRtl ? "مركز المساعدة" : "Help center"}</Link><Link to="/terms">{isRtl ? "الشروط والأحكام" : "Terms"}</Link><Link to="/privacy">{isRtl ? "سياسة الخصوصية" : "Privacy"}</Link><Link to="/refund">{isRtl ? "سياسة الاسترداد" : "Refund policy"}</Link></div>
    </div>
    <div className="cloud-footer-bottom"><span>{isRtl ? "© 2026 UNIGATES · دار عبيد للنشر والتوزيع والطباعة ش.ذ.م.م." : "© 2026 UNIGATES · Dar Obeid Publishing, Distribution & Printing LLC."}</span><span>{isRtl ? "المدفوعات والفواتير تُعالج بواسطة Paddle.com Market Ltd." : "Payments and billing are processed by Paddle.com Market Ltd."}</span></div>
  </footer>;
}