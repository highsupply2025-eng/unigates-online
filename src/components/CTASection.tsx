import { Link } from "react-router-dom";
import { Sparkles, Landmark, School, ArrowLeft, ArrowRight, UserPlus, LogIn, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const CTASection = () => {
  const { dir, language } = useLanguage();
  const isRtl = dir === "rtl";
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section
      ref={ref}
      className={`py-16 sm:py-24 px-4 sm:px-6 md:px-12 bg-background transition-all duration-700 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
    >
      <div className="max-w-6xl mx-auto">
        <div className="relative rounded-3xl sm:rounded-[2.5rem] bg-gradient-to-br from-blue-700 via-indigo-700 to-purple-800 p-8 sm:p-14 md:p-16 text-center text-white overflow-hidden shadow-2xl shadow-indigo-500/25">
          {/* Ambient light circles */}
          <div className="absolute -top-24 -start-24 w-72 h-72 rounded-full bg-blue-400/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -end-24 w-72 h-72 rounded-full bg-purple-400/20 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 border border-white/25 backdrop-blur-md text-xs sm:text-sm font-bold">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{isRtl ? "ابدأ تجربتك الرقمية مع UNIGATES" : "Start Your Digital Journey With UNIGATES"}</span>
            </div>

            <h2 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
              {isRtl
                ? "جاهز لتمكين كليتك أو مدرستك بأحدث المنظومات التعليمية؟"
                : "Ready to Empower Your College or School with Next-Gen Tech?"}
            </h2>

            <p className="text-sm sm:text-base md:text-lg text-slate-100 font-medium leading-relaxed max-w-2xl mx-auto">
              {isRtl
                ? "انضم الآن إلى آلاف المؤسسات وأعضاء هيئة التدريس والطلاب واستفد من البث المباشر وسلاسل الاعتماد الرقمي والاختبارات الذكية."
                : "Join thousands of accredited institutions, faculty, and students utilizing digital approval chains and live classrooms."}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-4">
              <Link to="/signup" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto h-13 px-8 rounded-2xl font-black text-base bg-white text-blue-900 hover:bg-slate-100 shadow-xl gap-2"
                >
                  <UserPlus className="w-5 h-5 text-blue-700" />
                  <span>{isRtl ? "إنشاء حساب جديد الآن" : "Create New Account"}</span>
                  {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                </Button>
              </Link>

              <Link to="/login" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto h-13 px-8 rounded-2xl font-black text-base border-2 border-white/40 bg-white/10 hover:bg-white/20 text-white shadow-md gap-2"
                >
                  <LogIn className="w-5 h-5" />
                  <span>{isRtl ? "تسجيل الدخول للمنصة" : "Sign In to Portal"}</span>
                </Button>
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 pt-4 text-xs font-bold text-slate-200">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                {isRtl ? "تسجيل فوري وسهل" : "Instant Onboarding"}
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                {isRtl ? "دعم فني أكاديمي متواصل" : "24/7 Academic Support"}
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                {isRtl ? "متوافق مع كل الأجهزة" : "Cross-Platform Ready"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
