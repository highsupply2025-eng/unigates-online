import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Clock,
  Sparkles,
  Landmark,
  School,
  BookOpen,
  Store,
  Home,
  CheckCircle2,
  Code2,
  Briefcase,
  AlertCircle,
  X,
  ArrowLeft,
  ArrowRight,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  PlatformKey,
  getPlatformMeta,
  isPlatformUnderDevelopment,
  isLovableOrDevEnvironment,
} from "@/lib/platformAvailability";

interface Props {
  platform: PlatformKey;
  children: React.ReactNode;
}

export const PlatformUnderDevelopmentOverlay: React.FC<Props> = ({ platform, children }) => {
  const { dir } = useLanguage();
  const isRtl = dir === "rtl";
  const meta = getPlatformMeta(platform, isRtl);
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  // Developer mode state stored in localStorage
  const [isDevUnlocked, setIsDevUnlocked] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("unigates_dev_mode") === "true";
    }
    return false;
  });

  const [isUnderDev, setIsUnderDev] = useState<boolean>(() =>
    isPlatformUnderDevelopment(platform)
  );

  const [showNoticeDialog, setShowNoticeDialog] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    setIsUnderDev(isPlatformUnderDevelopment(platform));
  }, [platform, isDevUnlocked]);

  const toggleDevMode = () => {
    const newState = !isDevUnlocked;
    setIsDevUnlocked(newState);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("unigates_dev_mode", newState ? "true" : "false");
      } catch {
        /* noop */
      }
    }
    setIsUnderDev(!newState && isPlatformUnderDevelopment(platform));
  };

  // If platform is live or dev mode / Lovable is active, render normal interactive content
  if (!isUnderDev) {
    return <>{children}</>;
  }

  // Intercept interactive clicks when in public preview mode
  const handleContentClickCapture = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;

    // Check if clicked element is an action button, submit button, or link to registration/login
    const interactiveEl = target.closest("button, a, input[type='submit']");
    if (!interactiveEl) return;

    const href = interactiveEl.getAttribute("href") || "";
    // Allow navigation to Home or University Platform or language toggles
    if (
      href === "/" ||
      href === "/university-platform" ||
      href.startsWith("/university") ||
      interactiveEl.hasAttribute("data-allow-preview")
    ) {
      return;
    }

    // Check if it's a theme or language toggle or dropdown
    if (
      interactiveEl.closest("[data-radix-popper-content-wrapper]") ||
      interactiveEl.getAttribute("aria-haspopup") === "menu" ||
      interactiveEl.getAttribute("role") === "combobox" ||
      interactiveEl.classList.contains("dropdown-item")
    ) {
      return;
    }

    // If it's a registration, login, signup, or submit action, prevent and show notice modal
    if (
      href.includes("register") ||
      href.includes("signup") ||
      href.includes("login") ||
      interactiveEl.textContent?.includes("تسجيل") ||
      interactiveEl.textContent?.includes("حساب") ||
      interactiveEl.textContent?.includes("دخول") ||
      interactiveEl.textContent?.includes("Register") ||
      interactiveEl.textContent?.includes("Login") ||
      interactiveEl.textContent?.includes("Sign Up") ||
      interactiveEl.getAttribute("type") === "submit"
    ) {
      e.preventDefault();
      e.stopPropagation();
      setShowNoticeDialog(true);
    }
  };

  return (
    <div className="relative min-h-screen">
      {/* Top Sticky Preview Announcement Banner */}
      {!bannerDismissed && (
        <div className="sticky top-0 z-[100] bg-gradient-to-r from-slate-950 via-teal-950 to-slate-950 text-white border-b border-amber-400/30 px-3 sm:px-6 py-2.5 shadow-xl backdrop-blur-xl">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm font-medium">
            <div className="flex items-center gap-2.5 flex-1 min-w-[280px]">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-400/40 shrink-0">
                <Lock className="w-4 h-4" />
              </span>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-black text-amber-300">
                    {isRtl ? "🔒 وضع المعاينة والعرض فقط" : "🔒 Preview & Showcase Mode"}
                  </span>
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-400/30 text-[10px] py-0 px-2 h-4">
                    {isRtl ? "قيد التطوير والتجهيز" : "Under Development"}
                  </Badge>
                </div>
                <p className="text-slate-300 text-[11px] sm:text-xs line-clamp-1">
                  {isRtl
                    ? "المنصة المدرسية مغلقة للاستخدام حالياً وفي طور الاعتماد — يمكنك استعراض مميزات وتصميم المنصة بحرية."
                    : "The school platform is currently closed for use and under preparation — feel free to explore features and design."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                asChild
                size="sm"
                className="h-8 px-3.5 rounded-lg bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-bold text-xs shadow-md"
                data-allow-preview="true"
              >
                <Link to="/university-platform">
                  <Landmark className="w-3.5 h-3.5 me-1.5" />
                  <span>{isRtl ? "المنصة الجامعية المتاحة" : "University Platform"}</span>
                </Link>
              </Button>

              <button
                onClick={() => setBannerDismissed(true)}
                className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
                title={isRtl ? "إخفاء الشريط" : "Dismiss"}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Underlying platform content (visible and clear for viewer) */}
      <div onClickCapture={handleContentClickCapture}>
        {children}
      </div>

      {/* Friendly Notice Dialog for clicked actions in public preview */}
      <Dialog open={showNoticeDialog} onOpenChange={setShowNoticeDialog}>
        <DialogContent className="max-w-md rounded-3xl border-2 border-emerald-500/30 bg-slate-950/95 backdrop-blur-2xl text-white shadow-2xl p-6">
          <DialogHeader className="space-y-3 text-center sm:text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-0.5 shadow-xl shadow-emerald-500/30 flex items-center justify-center">
              <div className="w-full h-full rounded-[14px] bg-slate-900 flex items-center justify-center">
                <School className="w-8 h-8 text-emerald-400" />
              </div>
            </div>
            <DialogTitle className="text-xl font-black text-white">
              {isRtl ? "المنصة المدرسية قيد التطوير والتجهيز" : "Smart School Platform Under Active Preparation"}
            </DialogTitle>
            <DialogDescription className="text-slate-300 text-sm leading-relaxed">
              {isRtl
                ? "يسعدنا اهتمامكم! تجري حالياً التجهيزات الفنية والاعتمادات الرسمية لفتح تسجيل المدارس والطلاب والمعلمين. المنصة معروضة حالياً للمعاينة والاستكشاف، وسيتم تدشين التسجيل الفعلي قريباً."
                : "We are thrilled by your interest! The Smart School Platform is undergoing final technical testing & accreditation before official launch. You can currently explore and preview the features."}
            </DialogDescription>
          </DialogHeader>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2.5 text-xs text-slate-300 text-start">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>{isRtl ? "ما يمكنك فعله الآن:" : "What you can do right now:"}</span>
            </div>
            <p className="leading-relaxed">
              {isRtl
                ? "• تصفح هيكلية الفصول الذكية وسلاسل اعتماد الاختبارات والواجبات."
                : "• Explore smart classrooms, homework studio, and grade workflows."}
            </p>
            <p className="leading-relaxed">
              {isRtl
                ? "• أو الانتقال إلى المنصة الجامعية المعتمدة والمتاحة حالياً بالكامل."
                : "• Or explore the University Platform which is 100% active and live."}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
            <Button
              asChild
              className="w-full h-11 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs"
              data-allow-preview="true"
            >
              <Link to="/university-platform" onClick={() => setShowNoticeDialog(false)}>
                <Landmark className="w-4 h-4 me-1.5" />
                <span>{isRtl ? "دخول المنصة الجامعية المتاحة" : "Go to University Platform"}</span>
              </Link>
            </Button>

            <Button
              variant="outline"
              onClick={() => setShowNoticeDialog(false)}
              className="w-full h-11 rounded-xl border-white/20 bg-white/10 hover:bg-white/20 text-white font-bold text-xs"
            >
              {isRtl ? "متابعة المعاينة والتصفح" : "Continue Previewing"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PlatformUnderDevelopmentOverlay;
