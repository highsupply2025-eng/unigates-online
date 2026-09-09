import { Link } from "react-router-dom";
import { Sparkles, ArrowLeft, ArrowRight, UserPlus, LogIn, Activity, Users, Landmark, School, BookOpen, Briefcase, BookMarked } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { usePlatformStats } from "@/hooks/usePlatformStats";
import { useAllCourses } from "@/hooks/useCourses";
import { useBooks } from "@/hooks/useBooks";
import { useCountUp } from "@/hooks/useCountUp";

const CTASection = () => {
  const { t, dir, language, translate } = useLanguage();
  const isRtl = dir === "rtl";
  const { ref, isVisible } = useScrollAnimation();

  // Real-time authoritative stats
  const { data: stats } = usePlatformStats();
  const { data: uniStats } = usePlatformStats("university");
  const { data: coursesData } = useAllCourses();
  const { data: booksData } = useBooks();

  const collegesCount = uniStats?.colleges ?? stats?.colleges ?? 0;
  const institutesCount = uniStats?.institutes ?? stats?.institutes ?? 0;
  const schoolsCount = stats?.schools ?? 0;
  const coursesCount = coursesData?.length ?? 0;
  const booksCount = booksData?.length ?? 0;
  const lecturersCount = stats?.lecturers ?? uniStats?.lecturers ?? 0;
  const teachersCount = stats?.teachers ?? 0;
  const studentsCount = stats?.students ?? uniStats?.students ?? 0;
  const trainingCentersCount = stats?.trainingCenters ?? 0;
  const languageCentersCount = stats?.languageCenters ?? 0;
  const publishersCount = stats?.publishers ?? 0;

  // Total active learners & users count
  const totalLearnersCount = studentsCount + lecturersCount + teachersCount;
  // Total organizations count (Colleges, Institutes, Schools, Training/Language Centers, Publishers)
  const totalInstitutionsCount = collegesCount + institutesCount + schoolsCount + trainingCentersCount + languageCentersCount + publishersCount;

  const learnersAnim = useCountUp(totalLearnersCount);
  const instAnim = useCountUp(totalInstitutionsCount);
  const coursesAnim = useCountUp(coursesCount);
  const booksAnim = useCountUp(booksCount);

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

          <div className="relative z-10 max-w-4xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 border border-white/25 backdrop-blur-md text-xs sm:text-sm font-bold shadow-inner">
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
              <span>{isRtl ? "جاهز تبدأ رحلة التعلّم الرقمي؟" : "Ready to Start Your Digital Journey?"}</span>
            </div>

            <h2 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
              {isRtl ? "جاهز تبدأ رحلة التعلّم؟" : "Ready to Start Your Journey?"}
            </h2>

            {/* Live Comprehensive Real-time Stat Badge */}
            <div className="pt-1 pb-2 flex flex-col items-center justify-center gap-3">
              <div className="inline-flex flex-wrap items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 py-2 sm:py-2.5 rounded-2xl bg-black/25 backdrop-blur-xl border border-white/20 shadow-lg text-xs sm:text-sm font-bold text-white">
                <div className="flex items-center gap-2 text-emerald-300">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span className="text-[11px] sm:text-xs uppercase tracking-wider text-emerald-300 font-extrabold">
                    {translate("إحصائيات المنظومة اللحظية", "Live Ecosystem Stats")}
                  </span>
                </div>

                <span className="text-white/40 hidden sm:inline">|</span>

                <div ref={learnersAnim.ref} className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-cyan-300" />
                  <span>
                    <strong className="text-cyan-200 font-black">{learnersAnim.count}</strong>{" "}
                    {translate("طالب ومحاضر ومعلم", "Learners & Faculty")}
                  </span>
                </div>

                <span className="text-white/40 hidden sm:inline">•</span>

                <div ref={instAnim.ref} className="flex items-center gap-1.5">
                  <Landmark className="w-4 h-4 text-amber-300" />
                  <span>
                    <strong className="text-amber-200 font-black">{instAnim.count}</strong>{" "}
                    {translate("مؤسسة وناشر ومركز", "Institutions & Publishers")}
                  </span>
                </div>

                <span className="text-white/40 hidden md:inline">•</span>

                <div ref={coursesAnim.ref} className="hidden md:flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-purple-300" />
                  <span>
                    <strong className="text-purple-200 font-black">{coursesAnim.count}</strong>{" "}
                    {translate("دورة تعليمية", "Courses")}
                  </span>
                </div>

                <span className="text-white/40 hidden md:inline">•</span>

                <div ref={booksAnim.ref} className="hidden md:flex items-center gap-1.5">
                  <BookMarked className="w-4 h-4 text-rose-300" />
                  <span>
                    <strong className="text-rose-200 font-black">{booksAnim.count}</strong>{" "}
                    {translate("كتاب ومخطوطة", "Books & Titles")}
                  </span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-200 font-medium max-w-xl mx-auto">
                {isRtl
                  ? "انضم الآن إلى منظومة UNIGATES الشاملة للتعليم الجامعي، المدرسي، الدورات، النشر والتوظيف."
                  : "Join UNIGATES unified ecosystem for higher education, K-12 schooling, courses, publishing, and careers."}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-4">
              <Link to="/signup" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto h-13 px-8 rounded-2xl font-black text-base bg-white text-blue-900 hover:bg-slate-100 shadow-xl gap-2"
                >
                  <UserPlus className="w-5 h-5 text-blue-700" />
                  <span>{t.faq.ctaButton || t.signup}</span>
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
                  <span>{t.login}</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
