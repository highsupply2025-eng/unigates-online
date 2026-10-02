import React from "react";
import { Link } from "react-router-dom";
import {
  Clock,
  Sparkles,
  Landmark,
  School,
  BookOpen,
  Store,
  Briefcase,
  ArrowLeft,
  ArrowRight,
  Home,
  CheckCircle2,
  Lock,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SEO from "@/components/SEO";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { PlatformKey, getPlatformMeta } from "@/lib/platformAvailability";

interface Props {
  platform: PlatformKey;
}

export const PlatformUnderDevelopment: React.FC<Props> = ({ platform }) => {
  const { dir } = useLanguage();
  const isRtl = dir === "rtl";
  const { toast } = useToast();
  const [notified, setNotified] = React.useState(false);
  const meta = getPlatformMeta(platform, isRtl);
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  const handleNotifyMe = () => {
    setNotified(true);
    toast({
      title: isRtl ? "تم تسجيل اهتمامك بنجاح ✓" : "Interest Registered ✓",
      description: isRtl
        ? `سنقوم بإشعارك فور اكتمال وتدشين ${meta.name} رسميًا.`
        : `We will notify you immediately once ${meta.name} is officially launched.`,
    });
  };

  const getPlatformIcon = () => {
    switch (platform) {
      case "school":
        return School;
      case "courses":
        return BookOpen;
      case "bookstore":
        return Store;
      case "nasher":
        return Sparkles;
      case "career":
        return Briefcase;
      default:
        return Landmark;
    }
  };

  const IconComp = getPlatformIcon();

  const getPlatformGradient = () => {
    switch (platform) {
      case "school":
        return "from-emerald-500 via-teal-500 to-cyan-600";
      case "courses":
        return "from-purple-500 via-fuchsia-500 to-pink-600";
      case "bookstore":
        return "from-amber-500 via-orange-500 to-rose-600";
      case "nasher":
        return "from-rose-600 via-pink-600 to-orange-500";
      case "career":
        return "from-cyan-600 via-teal-600 to-emerald-600";
      default:
        return "from-blue-500 via-indigo-500 to-violet-600";
    }
  };

  const gradient = getPlatformGradient();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20 transition-colors duration-300" dir={dir}>
      <SEO
        title={`${meta.name} — ${isRtl ? "قيد التطوير والانطلاق قريباً" : "Under Development • Launching Soon"} | UNIGATES`}
        description={meta.desc}
      />

      <SiteHeader />

      <main className="flex-1 flex items-center justify-center px-4 py-16 sm:py-24 relative overflow-hidden">
        {/* Background Ambient Glows */}
        <div className="absolute top-1/4 -translate-y-1/2 start-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-br from-primary/15 via-cyan-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-3xl w-full mx-auto text-center relative z-10 space-y-8 animate-in fade-in zoom-in-95 duration-300">
          {/* Main 3D Icon & Pulse */}
          <div className="relative mx-auto w-24 h-24 sm:w-28 sm:h-28">
            <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${gradient} opacity-30 blur-2xl animate-pulse`} />
            <div
              className={`relative w-full h-full rounded-3xl bg-gradient-to-br ${gradient} p-0.5 shadow-2xl shadow-black/20 dark:shadow-black/50 flex items-center justify-center`}
            >
              <div className="w-full h-full rounded-[22px] bg-card/90 backdrop-blur-xl flex items-center justify-center">
                <IconComp className="w-12 h-12 text-foreground drop-shadow-md" />
              </div>
            </div>
          </div>

          {/* Under Development Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-300 font-black text-xs shadow-lg shadow-amber-500/10">
            <Clock className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: "8s" }} />
            <span>{isRtl ? "قيد التطوير والانطلاق قريباً" : "Under Development • Launching Soon"}</span>
          </div>

          {/* Title and Subtitle */}
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight">
              {meta.name}
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed font-medium">
              {meta.desc}
            </p>
          </div>

          {/* Feature Sneak Peek Card */}
          <Card className="border border-border/80 bg-card/80 backdrop-blur-xl shadow-lg rounded-3xl overflow-hidden text-start">
            <CardContent className="p-6 sm:p-8 space-y-4">
              <div className="flex items-center gap-2 text-xs font-black uppercase text-primary">
                <Sparkles className="w-4 h-4" />
                <span>{isRtl ? "المميزات التي يجري تطويرها وتجهيزها حالياً:" : "Features currently being finalized:"}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {meta.expectedFeatures.map((feat, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2.5 p-3 rounded-2xl bg-muted/50 border border-border/60 text-xs font-bold text-foreground"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="truncate">{feat}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Action CTAs & Active Platforms */}
          <div className="space-y-4 pt-3">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              {isRtl ? "المنصات والخدمات المتاحة حالياً على البوابة:" : "Platforms & services currently available:"}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button
                asChild
                className="h-12 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white font-black text-sm shadow-xl shadow-orange-500/20 gap-2 transition-all hover:scale-105"
              >
                <Link to="/book-store">
                  <Store className="w-4 h-4" />
                  <span>{isRtl ? "متجر ومكتبة الكتب الأكاديمية" : "Academic Bookstore"}</span>
                  <ArrowIcon className="w-4 h-4" />
                </Link>
              </Button>

              <Button
                asChild
                className="h-12 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-black text-sm shadow-xl shadow-indigo-500/20 gap-2 transition-all hover:scale-105"
              >
                <Link to="/courses">
                  <BookOpen className="w-4 h-4" />
                  <span>{isRtl ? "أكاديمية الدورات والشهادات" : "Courses Academy"}</span>
                  <ArrowIcon className="w-4 h-4" />
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="h-12 px-6 rounded-2xl border-border bg-card hover:bg-muted text-foreground font-bold text-sm"
              >
                <Link to="/">
                  <Home className="w-4 h-4 me-2 text-primary" />
                  <span>{isRtl ? "العودة للرئيسية" : "Back to Home"}</span>
                </Link>
              </Button>
            </div>

            {/* Notify Me on Launch */}
            <div className="pt-2 flex items-center justify-center">
              <Button
                type="button"
                variant="ghost"
                onClick={handleNotifyMe}
                className="h-10 px-4 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted/60 gap-2 border border-dashed border-border/70"
              >
                <Bell className="w-3.5 h-3.5 text-amber-500" />
                <span>
                  {notified
                    ? (isRtl ? "تم تسجيل طلب الإشعار بنجاح ✓" : "Notification registered ✓")
                    : (isRtl ? "أبلغني عبر إشعار فور التدشين الرسمي" : "Notify me upon official launch")}
                </span>
              </Button>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
};

export default PlatformUnderDevelopment;
