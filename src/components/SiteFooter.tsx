import { GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import unigatesLogo from "@/assets/unigates-logo-transparent.png";
import googlePlayImg from "@/assets/google-play.png";
import appStoreImg from "@/assets/app-store.png";

const XIcon = () => (
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
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" strokeWidth="2.5" />
  </svg>
);

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const GooglePlayIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
    <path d="M3.609 1.814L13.792 12 3.61 22.186a2.238 2.238 0 0 1-.61-1.6V3.414c0-.623.23-1.19.609-1.6z" fill="#00C3FF"/>
    <path d="M17.204 8.587l-3.412 3.413L3.61 1.814c.32-.18.7-.286 1.112-.286.623 0 1.2.246 1.637.669l10.845 6.39z" fill="#00F076"/>
    <path d="M17.204 15.413L6.359 21.803a2.38 2.38 0 0 1-1.637.669c-.412 0-.792-.106-1.112-.286l10.182-10.186 3.412 3.413z" fill="#FF3A44"/>
    <path d="M21.364 10.147l-4.16 2.45-3.412-3.413 3.412-3.413 4.16 2.45c.78.46.78 1.466 0 1.926z" fill="#FFE000"/>
  </svg>
);

const AppStoreIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.93-2.85-.9.04-1.99.6-2.63 1.35-.57.65-1.07 1.72-.94 2.74 1.01.08 2.03-.5 2.64-1.24z" />
  </svg>
);

const SiteFooter = () => {
  const { t } = useLanguage();

  const footerLinks = [
    [
      { label: t.footerLinks.about, href: "/about" },
      { label: t.footerLinks.certificates, href: "/certificates" },
      { label: t.footerLinks.blog, href: "/blog" },
    ],
    [
      { label: t.footerLinks.helpCenter, href: "/help-center" },
      { label: t.footerLinks.terms, href: "/terms" },
      { label: t.footerLinks.privacy, href: "/privacy" },
    ],
    [
      { label: t.footerLinks.contactUs, href: "/contact" },
      { label: t.footerLinks.faq, href: "/faq" },
      { label: t.footerLinks.careers, href: "/careers" },
      { label: t.footerLinks.partnerships, href: "/partnerships" },
    ],
  ];

  const socialLinks = [
    {
      icon: FacebookIcon,
      label: "Facebook",
      href: "https://www.facebook.com/profile.php?id=61590799649501&sk=about",
      bgClass: "bg-gradient-to-tr from-[#1877F2] to-[#0D65D9]",
      glowClass: "hover:shadow-[0_8px_25px_rgba(24,119,242,0.45)]",
      textClass: "text-white",
    },
    {
      icon: XIcon,
      label: "X",
      href: "https://x.com/UNIGATES_ONLINE",
      bgClass: "bg-gradient-to-tr from-[#1c1c20] via-[#09090b] to-[#000000] border border-zinc-700/50",
      glowClass: "hover:shadow-[0_8px_25px_rgba(255,255,255,0.25)]",
      textClass: "text-white",
    },
    {
      icon: YouTubeIcon,
      label: "YouTube",
      href: "https://www.youtube.com/@UNIGATESPLATFORM",
      bgClass: "bg-gradient-to-tr from-[#FF0000] via-[#E60000] to-[#B30000]",
      glowClass: "hover:shadow-[0_8px_25px_rgba(255,0,0,0.5)]",
      textClass: "text-white",
    },
    {
      icon: InstagramIcon,
      label: "Instagram",
      href: "#",
      bgClass: "bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#833AB4] via-[#FD1D1D] to-[#FCB045]",
      glowClass: "hover:shadow-[0_8px_25px_rgba(221,42,123,0.5)]",
      textClass: "text-white",
    },
    {
      icon: TikTokIcon,
      label: "TikTok",
      href: "https://www.tiktok.com/@darobaid3",
      bgClass: "bg-gradient-to-tr from-[#161823] via-[#000000] to-[#0a0a0a] border border-zinc-700/50",
      glowClass: "hover:shadow-[0_8px_25px_rgba(37,244,238,0.4)]",
      textClass: "text-white",
    },
    {
      icon: GooglePlayIcon,
      label: "Google Play",
      href: "#",
      bgClass: "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-sm",
      glowClass: "hover:shadow-[0_8px_25px_rgba(0,195,255,0.4)]",
      textClass: "",
    },
    {
      icon: AppStoreIcon,
      label: "App Store",
      href: "#",
      bgClass: "bg-gradient-to-tr from-[#007AFF] via-[#0062D2] to-[#004EA8]",
      glowClass: "hover:shadow-[0_8px_25px_rgba(0,122,255,0.45)]",
      textClass: "text-white",
    },
  ];

  return (
    <footer className="section-divider py-12 px-6 md:px-12">
      <div className="max-w-full mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-[hsl(200,75%,30%)] shadow-lg shadow-primary/30 flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <span className="text-lg font-bold">{t.brandName}</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8">
          {footerLinks.map((column, i) => (
            <ul key={i} className="space-y-3">
              {column.map((link) => (
                <li key={link.label}>
                  <Link to={link.href} className="text-sm text-foreground font-semibold hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          ))}
        </div>

        <div className="border-t border-border pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm font-semibold text-foreground">{t.copyright}</p>
          <div className="flex gap-2.5 sm:gap-3 items-center flex-wrap justify-center md:justify-end">
            {socialLinks.map(({ icon: Icon, label, href, bgClass, glowClass, textClass }) => (
              <a
                key={label}
                href={href}
                target={href !== "#" ? "_blank" : undefined}
                rel={href !== "#" ? "noopener noreferrer" : undefined}
                aria-label={label}
                title={label}
                className={`group relative w-10 h-10 sm:w-11 sm:h-11 rounded-full ${bgClass} ${textClass} flex items-center justify-center transition-all duration-300 hover:-translate-y-1.5 hover:scale-110 active:scale-95 shadow-md ${glowClass} ring-1 ring-white/20 dark:ring-white/10`}
              >
                <div className="transition-transform duration-300 group-hover:scale-110 flex items-center justify-center">
                  <Icon />
                </div>
                {/* Specular glass reflection overlay */}
                <span className="absolute inset-0 rounded-full bg-gradient-to-b from-white/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </a>
            ))}
          </div>
        </div>

      </div>
    </footer>
  );
};

export default SiteFooter;
