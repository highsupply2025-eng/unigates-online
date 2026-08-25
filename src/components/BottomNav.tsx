import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home, BookOpen, Radio, ClipboardList, User, LayoutDashboard,
  Users, Calendar, Award, GraduationCap, Landmark, Bell,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

type Item = { to: string; labelAr: string; labelEn: string; Icon: any };

const STUDENT: Item[] = [
  { to: "/student/dashboard", labelAr: "الرئيسية", labelEn: "Home", Icon: Home },
  { to: "/student/lectures", labelAr: "المحاضرات", labelEn: "Lectures", Icon: BookOpen },
  { to: "/student/live", labelAr: "البث", labelEn: "Live", Icon: Radio },
  { to: "/student/quizzes", labelAr: "الاختبارات", labelEn: "Quizzes", Icon: ClipboardList },
  { to: "/profile", labelAr: "حسابي", labelEn: "Profile", Icon: User },
];

const LECTURER: Item[] = [
  { to: "/lecturer/dashboard", labelAr: "الرئيسية", labelEn: "Home", Icon: Home },
  { to: "/live", labelAr: "البث", labelEn: "Live", Icon: Radio },
  { to: "/lecturer/profile", labelAr: "حسابي", labelEn: "Profile", Icon: User },
];

const INSTITUTION: Item[] = [
  { to: "/institution/dashboard", labelAr: "الرئيسية", labelEn: "Home", Icon: Home },
  { to: "/institution/faculty/add", labelAr: "إضافة", labelEn: "Add", Icon: Users },
  { to: "/institution/profile", labelAr: "المؤسسة", labelEn: "Institution", Icon: Landmark },
];

const LEADERSHIP: Item[] = [
  { to: "/leadership/dashboard", labelAr: "الرئيسية", labelEn: "Home", Icon: Home },
  { to: "/leadership/approvals/lecturer/pending", labelAr: "الموافقات", labelEn: "Approvals", Icon: Bell },
  { to: "/leadership/presence", labelAr: "الحضور", labelEn: "Presence", Icon: Calendar },
  { to: "/leadership/profile", labelAr: "حسابي", labelEn: "Profile", Icon: User },
];

const SCHOOL_STUDENT: Item[] = [
  { to: "/school/student/dashboard", labelAr: "الرئيسية", labelEn: "Home", Icon: Home },
  { to: "/school/student/profile", labelAr: "حسابي", labelEn: "Profile", Icon: User },
];

const SCHOOL_TEACHER: Item[] = [
  { to: "/school/teacher/dashboard", labelAr: "الرئيسية", labelEn: "Home", Icon: Home },
  { to: "/school/teacher/profile", labelAr: "حسابي", labelEn: "Profile", Icon: User },
];

const SCHOOL_ADMIN: Item[] = [
  { to: "/school/dashboard", labelAr: "الرئيسية", labelEn: "Home", Icon: Home },
  { to: "/school/profile", labelAr: "حسابي", labelEn: "Profile", Icon: User },
];

const PUBLIC_APP: Item[] = [
  { to: "/", labelAr: "الرئيسية", labelEn: "Home", Icon: Home },
  { to: "/university-platform", labelAr: "الجامعات", labelEn: "University", Icon: GraduationCap },
  { to: "/school-platform", labelAr: "المدارس", labelEn: "Schools", Icon: LayoutDashboard },
  { to: "/courses", labelAr: "الدورات", labelEn: "Courses", Icon: Award },
  { to: "/profile", labelAr: "حسابي", labelEn: "Profile", Icon: User },
];

function pickItems(pathname: string): Item[] {
  if (pathname.startsWith("/student")) return STUDENT;
  if (pathname.startsWith("/lecturer")) return LECTURER;
  if (pathname.startsWith("/institution")) return INSTITUTION;
  if (pathname.startsWith("/leadership")) return LEADERSHIP;
  if (pathname.startsWith("/school/student")) return SCHOOL_STUDENT;
  if (pathname.startsWith("/school/teacher")) return SCHOOL_TEACHER;
  if (pathname.startsWith("/school")) return SCHOOL_ADMIN;
  return PUBLIC_APP;
}

// Routes where the bottom nav should be hidden (auth flows, immersive screens)
const HIDDEN_PREFIXES = [
  "/login", "/signup", "/forgot-password", "/reset-password", "/auth/callback",
  "/choose-plan", "/payment", "/stream/", "/.lovable",
];

const BottomNav = () => {
  const { pathname } = useLocation();
  const { language, dir } = useLanguage();
  const isRtl = dir === "rtl";
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    import("@capacitor/core").then(({ Capacitor }) => {
      try { setIsNative(Capacitor.isNativePlatform()); } catch { setIsNative(false); }
    }).catch(() => setIsNative(false));
  }, []);

  const items = useMemo(() => pickItems(pathname), [pathname]);
  const hidden = HIDDEN_PREFIXES.some((p) => pathname.startsWith(p));

  // Only show inside the native app (APK). On the web we keep the existing headers.
  if (!isNative || hidden) return null;

  return (
    <>
      {/* Spacer so page content isn't hidden behind the nav */}
      <div aria-hidden className="h-[calc(64px+env(safe-area-inset-bottom,0px))]" />
      <nav
        dir={isRtl ? "rtl" : "ltr"}
        className="fixed bottom-0 inset-x-0 z-[60] bg-card/95 backdrop-blur-lg border-t border-border shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.15)]"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <ul className="flex items-stretch justify-around max-w-3xl mx-auto px-1 h-16">
          {items.map((it) => {
            const active =
              pathname === it.to ||
              (it.to !== "/" && pathname.startsWith(it.to + "/"));
            const Icon = it.Icon;
            return (
              <li key={it.to} className="flex-1">
                <Link
                  to={it.to}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex flex-col items-center justify-center gap-0.5 w-full h-full text-[10px] font-bold transition-colors touch-manipulation active:scale-95",
                    active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {active && (
                    <span className="absolute top-0 h-1 w-8 rounded-b-full bg-gradient-to-r from-primary to-primary/70" />
                  )}
                  <span
                    className={cn(
                      "flex items-center justify-center w-9 h-9 rounded-xl transition-all",
                      active
                        ? "bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-md shadow-primary/30 scale-105"
                        : "bg-transparent"
                    )}
                  >
                    <Icon className="w-[18px] h-[18px]" />
                  </span>
                  <span className="leading-none truncate max-w-[64px]">
                    {isRtl ? it.labelAr : it.labelEn}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
};

export default BottomNav;
