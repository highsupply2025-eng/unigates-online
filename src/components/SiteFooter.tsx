import { GraduationCap } from "lucide-react";

const footerLinks = [
  ["عن المنصة", "المدربون", "الشهادات", "المدونة"],
  ["مركز المساعدة", "الشروط والأحكام", "سياسة الخصوصية"],
  ["تواصل معنا", "الوظائف", "الشراكات"],
];

const SiteFooter = () => {
  return (
    <footer className="section-divider py-12 px-6 md:px-12">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <GraduationCap className="w-6 h-6 text-primary" />
          <span className="text-lg font-bold">مَعرِفة</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8">
          {footerLinks.map((column, i) => (
            <ul key={i} className="space-y-3">
              {column.map((link) => (
                <li key={link}>
                  <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          ))}
        </div>

        <div className="border-t border-border pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">© 2026 مَعرِفة. جميع الحقوق محفوظة.</p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors">Twitter</a>
            <a href="#" className="hover:text-primary transition-colors">YouTube</a>
            <a href="#" className="hover:text-primary transition-colors">Instagram</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
