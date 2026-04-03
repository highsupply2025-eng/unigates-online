import { GraduationCap } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const TwitterIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const YouTubeIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
  </svg>
);

const SiteFooter = () => {
  const { t } = useLanguage();

  const footerLinks = [
    [t.footerLinks.about, t.footerLinks.instructors, t.footerLinks.certificates, t.footerLinks.blog],
    [t.footerLinks.helpCenter, t.footerLinks.terms, t.footerLinks.privacy],
    [t.footerLinks.contactUs, t.footerLinks.careers, t.footerLinks.partnerships],
  ];

  const socialLinks = [
    { icon: TwitterIcon, label: "Twitter", href: "#", hoverColor: "hover:text-foreground hover:bg-foreground/10" },
    { icon: YouTubeIcon, label: "YouTube", href: "#", hoverColor: "hover:text-[hsl(0,100%,50%)] hover:bg-[hsl(0,100%,50%)]/10" },
    { icon: InstagramIcon, label: "Instagram", href: "#", hoverColor: "hover:text-[hsl(330,70%,50%)] hover:bg-[hsl(330,70%,50%)]/10" },
  ];

  return (
    <footer className="section-divider py-12 px-6 md:px-12">
      <div className="max-w-full mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <GraduationCap className="w-6 h-6 text-primary" />
          <span className="text-lg font-bold">{t.brandName}</span>
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
          <p className="text-sm text-muted-foreground">{t.copyright}</p>
          <div className="flex gap-3">
            {socialLinks.map(({ icon: Icon, label, href, hoverColor }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className={`w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground transition-all duration-300 ${hoverColor} hover:shadow-md hover:-translate-y-0.5`}
              >
                <Icon />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
