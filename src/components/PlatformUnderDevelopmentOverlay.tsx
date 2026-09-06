import React, { useState } from react;
import { Link } from react-router-dom;
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
  Eye,
  EyeOff,
  Code2,
  Briefcase
} from lucide-react;
import { Button } from @/components/ui/button;
import { Card } from @/components/ui/card;
import { useLanguage } from @/contexts/LanguageContext;
import { PlatformKey, getPlatformMeta } from @/lib/platformAvailability;

interface Props {
  platform: PlatformKey;
  children: React.ReactNode;
}

export const PlatformUnderDevelopmentOverlay: React.FC<Props> = ({ platform, children }) => {
  const { dir } = useLanguage();
  const isRtl = dir === rtl;
  const meta = getPlatformMeta(platform, isRtl);

  // Developer mode state stored in localStorage
  const [isDevUnlocked, setIsDevUnlocked] = useState<boolean>(() => {
    if (typeof window !== undefined) {
      return localStorage.getItem(unigates_dev_mode) === true;
    }
    return false;
  });

  const [peekMode, setPeekMode] = useState(false);

  const toggleDevMode = () => {
    const newState = !isDevUnlocked;
    setIsDevUnlocked(newState);
    if (typeof window !== undefined) {
      localStorage.setItem(unigates_dev_mode, newState ? true : false);
    }
  };

  const getPlatformIcon = () => {
    switch (platform) {
      case school:
        return School;
      case courses:
        return BookOpen;
      case bookstore:
        return Store;
      case nasher:
        return Sparkles;
      case career:
        return Briefcase;
      default:
        return Landmark;
    }
  };

  const IconComp = getPlatformIcon();

  const getPlatformGradient = () => {
    switch (platform) {
      case school:
        return from-emerald-600 via-teal-600 to-cyan-600;
      case courses:
        return from-purple-600 via-fuchsia-600 to-pink-600;
      case bookstore:
        return from-amber-500 via-orange-600 to-rose-600;
      case nasher:
        return from-rose-600 via-pink-600 to-orange-500;
      case career:
        return from-cyan-600 via-teal-600 to-emerald-600;
      default:
        return from-blue-600 via-indigo-600 to-violet-700;
    }
  };

  const gradient = getPlatformGradient();

  return (
    <div className=relative min-h-screen>
      {/* 1. Underlying Platform Content (Visible behind blur / scrim) */}
      <div
        className={	ransition-all duration-700 }
        aria-hidden={!isDevUnlocked}
      >
        {children}
      </div>

      {/* 2. Floating Dev Mode Controls Banner (Top corner) */}
      <div className=fixed bottom-5 end-5 z-[9999] flex items-center gap-2 bg-slate-950/90 text-white backdrop-blur-xl border border-white/20 p-2 rounded-2xl shadow-2xl animate-fade-in>
        <Button
          size=sm
          onClick={toggleDevMode}
          className={h-9 px-3.5 rounded-xl font-bold text-xs gap-1.5 shadow-lg transition-all }
          title={isRtl ? وضع المطور والمشروع: يتيح لك فتح المنصة وتطويرها وتجربتها : Developer & Builder Mode: Toggle full interactive access}
        >
          <Code2 className=w-4 h-4 />
          <span>
            {isDevUnlocked
              ? (isRtl ? وضع المطور: نشط (المنصة مفتوحة لك) : Dev Mode: ON (Unlocked))
              : (isRtl ? وضع المطور: فتح للمعاينة والتطوير : Dev Mode: Unlock & Develop)}
          </span>
        </Button>

        {!isDevUnlocked && (
          <Button
            size=sm
            variant=ghost
            onClick={() => setPeekMode(!peekMode)}
            className=h-9 px-2.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 text-xs gap-1
            title={isRtl ? استعراض شفاف للمحتوى : Toggle Clearer Preview}
          >
            {peekMode ? <EyeOff className=w-3.5 h-3.5 /> : <Eye className=w-3.5 h-3.5 />}
            <span className=hidden sm:inline>{peekMode ? (isRtl ? إعادة التعتيم : Blur) : (isRtl ? نظرة أوضح : Peek)}</span>
          </Button>
        )}
      </div>

      {/* 3. Glassmorphic Teaser Modal / Scrim Overlay (When Locked for general visitors) */}
      {!isDevUnlocked && (
        <div className=fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/40 backdrop-blur-xs overflow-y-auto pointer-events-auto>
          <div className=max-w-2xl w-full my-auto text-center space-y-6 animate-in fade-in zoom-in-95 duration-500>
            {/* Main Coming Soon Modal Container */}
            <Card className=border-2 border-white/20 bg-slate-950/85 backdrop-blur-2xl text-white shadow-[0_0_50px_rgba(0,0,0,0.6)] rounded-3xl overflow-hidden p-6 sm:p-8 space-y-6>
              {/* Header Icon with Glowing Aura */}
              <div className=relative mx-auto w-20 h-20 sm:w-24 sm:h-24>
                <div className={bsolute inset-0 rounded-3xl bg-gradient-to-br  opacity-40 blur-2xl animate-pulse} />
                <div
                  className={elative w-full h-full rounded-3xl bg-gradient-to-br  p-0.5 shadow-2xl flex items-center justify-center}
                >
                  <div className=w-full h-full rounded-[22px] bg-slate-900/90 backdrop-blur-xl flex items-center justify-center>
                    <IconComp className=w-10 h-10 sm:w-12 sm:h-12 text-white drop-shadow-lg />
                  </div>
                </div>
              </div>

              {/* Badges */}
              <div className=flex flex-wrap items-center justify-center gap-2>
                <span className=inline-flex items-center gap-1.5 px-4 py-1 rounded-full border border-amber-400/40 bg-amber-500/20 text-amber-300 font-black text-xs shadow-lg shadow-amber-500/20>
                  <Clock className=w-3.5 h-3.5 animate-spin style={{ animationDuration: 8s }} />
                  <span>{isRtl ? قريباً • جاري التجهيز والإطلاق : Coming Soon • Launching Soon}</span>
                </span>

                <span className=inline-flex items-center gap-1 px-3 py-1 rounded-full border border-teal-400/30 bg-teal-500/15 text-teal-200 font-bold text-xs>
                  <Sparkles className=w-3.5 h-3.5 text-teal-400 />
                  <span>{meta.badge}</span>
                </span>
              </div>

              {/* Title & Description */}
              <div className=space-y-3>
                <h1 className=text-2xl sm:text-4xl font-black tracking-tight text-white>
                  {meta.name}
                </h1>
                <p className=text-sm sm:text-base text-slate-300 max-w-lg mx-auto leading-relaxed font-medium>
                  {meta.desc}
                </p>
              </div>

              {/* Feature Preview Pill Matrix */}
              <div className=bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 text-start space-y-3>
                <div className=flex items-center justify-between text-xs font-bold text-teal-300 border-b border-white/10 pb-2>
                  <div className=flex items-center gap-1.5>
                    <Sparkles className=w-4 h-4 text-teal-400 />
                    <span>{isRtl ? المميزات التشويقية الجاري تطويرها: : Features being finalized:}</span>
                  </div>
                  <span className=text-[11px] text-slate-400 font-mono>UNIGATES Ecosystem</span>
                </div>

                <div className=grid grid-cols-1 sm:grid-cols-2 gap-2.5>
                  {meta.expectedFeatures.map((feat, idx) => (
                    <div
                      key={idx}
                      className=flex items-center gap-2 p-2.5 rounded-xl bg-white/5 border border-white/5 text-xs font-bold text-slate-200
                    >
                      <CheckCircle2 className=w-4 h-4 text-emerald-400 shrink-0 />
                      <span className=truncate>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className=flex flex-col sm:flex-row items-center justify-center gap-3 pt-2>
                <Button
                  onClick={toggleDevMode}
                  className=w-full sm:w-auto h-11 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-xs shadow-lg shadow-amber-500/30 gap-2
                >
                  <Code2 className=w-4 h-4 />
                  <span>{isRtl ? تطوير المنصة والتحكم بها (وضع المطور) : Unlock for Development & Preview}</span>
                </Button>

                <Button
                  asChild
                  variant=outline
                  className=w-full sm:w-auto h-11 px-6 rounded-xl border-white/20 bg-white/10 hover:bg-white/20 text-white font-bold text-xs
                >
                  <Link to=/>
                    <Home className=w-4 h-4 me-2 />
                    <span>{isRtl ? العودة للرئيسية : Back to Home}</span>
                  </Link>
                </Button>
              </div>

              {/* Teaser note */}
              <p className=text-[11px] text-slate-400 font-medium>
                {isRtl
                  ? 💡 يظهر المحتوى بالخلفية كمعاينة تشويقية للجمهور. لتصفح المنصة بالكامل وتطويرها، اضغط على زر 'تطوير المنصة'.
                  : 💡 Platform is showcased in the background as a teaser. Click 'Unlock for Development' to interact with the full page.}
              </p>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlatformUnderDevelopmentOverlay;
