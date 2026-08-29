import React from "react";
import { Link } from "react-router-dom";
import {
  Clock,
  Sparkles,
  Landmark,
  School,
  BookOpen,
  Store,
  ArrowLeft,
  ArrowRight,
  Home,
  CheckCircle2,
  Lock,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SEO from "@/components/SEO";
import { useLanguage } from "@/contexts/LanguageContext";
import { PlatformKey, getPlatformMeta } from "@/lib/platformAvailability";

interface Props {
  platform: PlatformKey;
  onBypassDev?: () => void;
}

export const PlatformUnderDevelopment: React.FC<Props> = ({ platform, onBypassDev }) => {
  const { dir } = useLanguage();
  const isRtl = dir === "rtl";
  const meta = getPlatformMeta(platform, isRtl);
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  const getPlatformIcon = () => {
    switch (platform) {
      case "school":
        return School;
      case "courses":
        return BookOpen;
      case "bookstore":
        return Store;
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
      default:
        return "from-blue-500 via-indigo-500 to-violet-600";
    }
  };

  const gradient = getPlatformGradient();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-primary/20" dir={dir}>
      <SEO
        title={`${meta.name} — ${isRtl ? "قريباً • قيد التطوير" : "Coming Soon • In Development"} | UNIGATES`}
        description={meta.desc}
      />

      <SiteHeader />

      <main className="flex-1 flex items-center justify-center px-4 py-16 sm:py-24 relative overflow-hidden">
        {/* Background Ambient Glows */}
        <div className="absolute top-1/4 -translate-y-1/2 start-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-br from-primary/10 via-cyan-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-3xl w-full mx-auto text-center relative z-10 space-y-8 animate-in fade-in zoom-in-95 duration-300">
          {/* Main 3D Icon & Pulse */}
          <div className="relative mx-auto w-24 h-24 sm:w-28 sm:h-28">
            <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${gradient} opacity-30 blur-2xl animate-pulse`} />
            <div
              className={`relative w-full h-full rounded-3xl bg-gradient-to-br ${gradient} p-0.5 shadow-2xl shadow-black/50 flex items-center justify-center`}
            >
              <div className="w-full h-full rounded-[22px] bg-slate-900/90 backdrop-blur-xl flex items-center justify-center">
                <IconComp className="w-12 h-12 text-white drop-shadow-md" />
              </div>
            </div>
          </div>

          {/* Under Development Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-300 font-black text-xs shadow-lg shadow-amber-500/10">
            <Clock className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: "8s" }} />
            <span>{isRtl ? "قريباً — نعمل على التطوير والبرمجة الآن" : "Coming Soon — Under Active Development"}</span>
          </div>

          {/* Title and Subtitle */}
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              {meta.name}
            </h1>
            <p className="text-base sm:text-lg text-slate-300 max-w-xl mx-auto leading-relaxed">
              {meta.desc}
            </p>
          </div>

          {/* Feature Sneak Peek Card */}
          <Card className="border border-white/10 bg-slate-900/60 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden text-start">
            <CardContent className="p-6 sm:p-8 space-y-4">
              <div className="flex items-center gap-2 text-xs font-black uppercase text-teal-400">
                <Sparkles className="w-4 h-4" />
                <span>{isRtl ? "المميزات التي يجري تطويرها حالياً:" : "Features currently being engineered:"}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {meta.expectedFeatures.map((feat, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/5 border border-white/5 text-xs font-bold text-slate-200"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="truncate">{feat}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button
              asChild
              className="w-full sm:w-auto h-12 px-8 rounded-2xl bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-black text-sm shadow-xl shadow-teal-500/25 gap-2 transition-all hover:scale-105"
            >
              <Link to="/university-platform">
                <Landmark className="w-4 h-4" />
                <span>{isRtl ? "دخول المنصة الجامعية (المتاحة حالياً)" : "Explore University Platform"}</span>
                <ArrowIcon className="w-4 h-4" />
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="w-full sm:w-auto h-12 px-6 rounded-2xl border-white/15 bg-white/5 hover:bg-white/10 text-white font-bold text-sm"
            >
              <Link to="/">
                <Home className="w-4 h-4 me-2" />
                <span>{isRtl ? "العودة للرئيسية" : "Back to Home"}</span>
              </Link>
            </Button>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
};

export default PlatformUnderDevelopment;
