import { Smartphone, Download, BellRing, WifiOff, ShieldCheck, Sparkles, CheckCircle2, ArrowLeft, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const AppleLogoSvg = () => (
  <svg viewBox="0 0 170 170" className="w-7 h-7 sm:w-8 sm:h-8 fill-current" xmlns="http://www.w3.org/2000/svg">
    <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.66-7.85-11.89-14.42-6.09-9.45-10.87-20.08-14.34-31.89-3.48-11.8-5.22-23.01-5.22-33.62 0-14.56 3.69-26.68 11.08-36.36 7.39-9.68 16.73-14.65 28.02-14.91 4.78 0 10.21 1.25 16.29 3.75 6.09 2.5 10.05 3.75 11.89 3.75 1.52 0 5.76-1.36 12.72-4.08 6.96-2.72 12.61-3.86 16.95-3.42 12.61.65 22.71 5.37 30.3 14.16-11.08 6.74-16.51 15.98-16.29 27.72.22 9.13 3.8 16.74 10.74 22.83 6.95 6.09 15.1 9.45 24.45 10.08-2.39 7.39-5.43 14.78-9.13 22.17zM119.22 33.39c0-6.74 2.39-13.25 7.17-19.56 4.78-6.3 10.76-10.76 17.93-13.37.22 1.3.33 2.5.33 3.59 0 6.74-2.5 13.36-7.5 19.88-5 6.52-11.19 10.65-18.58 12.39-.44-1.09-.66-2.06-.66-2.93z" />
  </svg>
);

const GooglePlaySvg = () => (
  <svg viewBox="0 0 512 512" className="w-7 h-7 sm:w-8 sm:h-8" xmlns="http://www.w3.org/2000/svg">
    <path d="M47.8 17.1c-6.8 7.3-10.8 18-10.8 31.4v415c0 13.4 4 24.1 10.8 31.4l1.7 1.6L282 264v-16L49.5 15.5l-1.7 1.6z" fill="#00e5ff" />
    <path d="M359.8 341.8L282 264v-16l77.8-77.8 1.8 1 92.2 52.4c26.3 14.9 26.3 39.4 0 54.4l-92.2 52.4-1.8 1.4z" fill="#ffc400" />
    <path d="M283.8 248L47.8 496.5c8.8 9.3 23.3 10.4 39.6 1.2l274.2-155.9-77.8-93.8z" fill="#ff334c" />
    <path d="M283.8 264l77.8-93.8L87.4 14.3c-16.3-9.2-30.8-8.1-39.6 1.2L283.8 264z" fill="#00e676" />
  </svg>
);

const AppDownloadSection = () => {
  const { dir, language } = useLanguage();
  const isRtl = dir === "rtl";
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section
      ref={ref}
      className={`py-16 sm:py-24 px-4 sm:px-6 md:px-12 bg-gradient-to-b from-muted/20 via-background to-muted/20 transition-all duration-700 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
    >
      <div className="max-w-7xl mx-auto">
        <Card className="rounded-[2.5rem] border-2 border-border/80 bg-gradient-to-br from-card via-card to-primary/5 shadow-2xl p-6 sm:p-12 md:p-16 overflow-hidden relative">
          {/* Subtle Ambient Glows */}
          <div className="absolute -top-24 -end-24 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -start-24 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
            {/* Left Content (Text & App Store Badges) */}
            <div className="lg:col-span-7 space-y-6 text-start">
              <Badge variant="outline" className="px-4 py-1 text-xs font-black border-primary/40 bg-primary/10 text-primary gap-1.5">
                <Smartphone className="w-4 h-4 text-primary" />
                <span>{isRtl ? "تطبيقات الهواتف الذكية — iOS & Android" : "UNIGATES Mobile Apps — iOS & Android"}</span>
              </Badge>

              <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-foreground tracking-tight leading-tight">
                {isRtl ? (
                  <>
                    تعلّم وتابع محاضراتك وواجباتك{" "}
                    <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                      من هاتفك الذكي
                    </span>{" "}
                    في أي وقت ومن أي مكان
                  </>
                ) : (
                  <>
                    Learn & Manage Lectures On The Go with{" "}
                    <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                      UNIGATES Mobile
                    </span>
                  </>
                )}
              </h2>

              <p className="text-sm sm:text-base text-muted-foreground font-medium leading-relaxed max-w-xl">
                {isRtl
                  ? "تطبيق متكامل لأجهزة iPhone و Android صُمم ليمنح الطلاب وأعضاء هيئة التدريس والمعلمين تجربة سلسة تشمل إشعارات البث المباشر، تسليم الواجبات، تنزيل المحتوى للمشاهدة بدون إنترنت، وتأكيد الحضور الذكي."
                  : "A native mobile experience for iPhone and Android providing instant notifications, live lecture streams, offline lesson downloads, and homework submission on the go."}
              </p>

              {/* Feature Highlights Bullets */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-muted/50 border border-border/50 text-xs font-bold text-foreground">
                  <BellRing className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>{isRtl ? "تنبيهات فورية عند بدء البث المباشر" : "Real-time live lecture alerts"}</span>
                </div>
                <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-muted/50 border border-border/50 text-xs font-bold text-foreground">
                  <WifiOff className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{isRtl ? "تنزيل الدروس للمشاهدة بدون إنترنت" : "Offline video downloads"}</span>
                </div>
                <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-muted/50 border border-border/50 text-xs font-bold text-foreground">
                  <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                  <span>{isRtl ? "تسليم التكليفات واستلام الدرجات" : "Submit assignments & get grades"}</span>
                </div>
                <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-muted/50 border border-border/50 text-xs font-bold text-foreground">
                  <ShieldCheck className="w-4 h-4 text-purple-500 shrink-0" />
                  <span>{isRtl ? "دخول سريع ببصمة الوجه FaceID" : "Instant FaceID biometric sign-in"}</span>
                </div>
              </div>

              {/* High-End App Store & Google Play Badges */}
              <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                {/* Apple App Store Badge */}
                <div className="group relative rounded-2xl p-3.5 sm:p-4 bg-zinc-900 text-white dark:bg-zinc-950 border-2 border-zinc-700/80 hover:border-blue-500/80 shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-between gap-4 cursor-pointer">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <AppleLogoSvg />
                    </div>
                    <div className="text-start">
                      <p className="text-[10px] font-bold text-zinc-400 leading-tight uppercase tracking-wider">
                        {isRtl ? "حمّل من متجر" : "Download on the"}
                      </p>
                      <p className="text-base sm:text-lg font-black tracking-tight text-white leading-tight">
                        App Store
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/40 text-[10px] font-black px-2.5 py-0.5 rounded-full shrink-0">
                    {isRtl ? "قريباً" : "Coming Soon"}
                  </Badge>
                </div>

                {/* Google Play Store Badge */}
                <div className="group relative rounded-2xl p-3.5 sm:p-4 bg-zinc-900 text-white dark:bg-zinc-950 border-2 border-zinc-700/80 hover:border-emerald-500/80 shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-between gap-4 cursor-pointer">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <GooglePlaySvg />
                    </div>
                    <div className="text-start">
                      <p className="text-[10px] font-bold text-zinc-400 leading-tight uppercase tracking-wider">
                        {isRtl ? "متوفر على متجر" : "GET IT ON"}
                      </p>
                      <p className="text-base sm:text-lg font-black tracking-tight text-white leading-tight">
                        Google Play
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 text-[10px] font-black px-2.5 py-0.5 rounded-full shrink-0">
                    {isRtl ? "قريباً" : "Coming Soon"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Right Mockup (Interactive Smartphone Display) */}
            <div className="lg:col-span-5 flex items-center justify-center">
              <div className="relative w-full max-w-[320px] aspect-[9/18] rounded-[3rem] p-3 bg-gradient-to-b from-zinc-800 via-zinc-900 to-black shadow-2xl ring-4 ring-zinc-700/50 shadow-indigo-500/20">
                {/* Phone Notch / Dynamic Island */}
                <div className="absolute top-6 left-1/2 -translate-x-1/2 w-24 h-4 bg-black rounded-full z-30" />

                {/* Inner Screen */}
                <div className="w-full h-full rounded-[2.4rem] bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 p-4 pt-10 text-white flex flex-col justify-between overflow-hidden relative">
                  {/* Top Bar inside app */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-black shadow-md">
                          UG
                        </div>
                        <div>
                          <p className="text-xs font-black text-white">UNIGATES Mobile</p>
                          <p className="text-[9px] text-emerald-400 font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            {isRtl ? "متصل بالمنظومة" : "Online"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Live Stream Banner Mockup */}
                    <div className="p-3 rounded-2xl bg-gradient-to-r from-rose-600/30 to-red-600/30 border border-rose-500/40 space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-black text-rose-300">
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                          {isRtl ? "بث مباشر الآن" : "LIVE NOW"}
                        </span>
                        <span>450 {isRtl ? "طالب" : "Students"}</span>
                      </div>
                      <p className="text-xs font-bold text-white line-clamp-1">
                        {isRtl ? "محاضرة: الذكاء الاصطناعي وهندسة البرمجيات" : "Lecture: Artificial Intelligence"}
                      </p>
                    </div>

                    {/* Schedule / Quiz Mockup */}
                    <div className="space-y-2">
                      <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-[11px] font-bold">
                        <span className="text-slate-300">{isRtl ? "الاختبار القادم:" : "Upcoming Quiz:"}</span>
                        <span className="text-amber-400">{isRtl ? "الأحد 10:00 ص" : "Sun 10:00 AM"}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-[11px] font-bold">
                        <span className="text-slate-300">{isRtl ? "التكليف المستلم:" : "Assignment:"}</span>
                        <span className="text-emerald-400">19.5 / 20 ✓</span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Navigation inside mockup */}
                  <div className="p-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-around text-[10px] font-bold text-slate-300">
                    <span className="text-blue-400">{isRtl ? "الرئيسية" : "Home"}</span>
                    <span>{isRtl ? "المحاضرات" : "Lectures"}</span>
                    <span>{isRtl ? "البث" : "Live"}</span>
                    <span>{isRtl ? "حسابي" : "Profile"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
};

export default AppDownloadSection;
