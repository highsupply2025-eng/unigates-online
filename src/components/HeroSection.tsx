import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Landmark, School, BookOpen, Store, Search, ArrowLeft, ArrowRight,
  Sparkles, ShieldCheck, Video, Award, ChevronRight, CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import eduHeroBg from "@/assets/edu-hero-bg.jpg";
import { useLanguage } from "@/contexts/LanguageContext";

const HeroSection = () => {
  const { dir, language } = useLanguage();
  const isRtl = dir === "rtl";
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchCategory, setSearchCategory] = useState<"all" | "university" | "school" | "courses" | "books">("all");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    if (searchCategory === "university") {
      navigate(`/university-platform?q=${encodeURIComponent(query)}`);
    } else if (searchCategory === "school") {
      navigate(`/school-platform?q=${encodeURIComponent(query)}`);
    } else if (searchCategory === "courses") {
      navigate(`/courses?search=${encodeURIComponent(query)}`);
    } else if (searchCategory === "books") {
      navigate(`/book-store?search=${encodeURIComponent(query)}`);
    } else {
      navigate(`/courses?search=${encodeURIComponent(query)}`);
    }
  };

  const portalPills = [
    {
      to: "/university-platform",
      label: isRtl ? "المنصة الجامعية" : "University Platform",
      badge: isRtl ? "كليات ومعاهد" : "Colleges & Institutes",
      icon: Landmark,
      color: "from-blue-600 to-indigo-700",
      glow: "shadow-blue-500/25",
    },
    {
      to: "/school-platform",
      label: isRtl ? "المنصة المدرسية" : "School Platform",
      badge: isRtl ? "مدارس وفصول" : "Schools & K-12",
      icon: School,
      color: "from-emerald-600 to-teal-700",
      glow: "shadow-emerald-500/25",
    },
    {
      to: "/courses",
      label: isRtl ? "أكاديمية الدورات" : "Courses Academy",
      badge: isRtl ? "دورات وشهادات" : "Courses & Certificates",
      icon: BookOpen,
      color: "from-purple-600 to-fuchsia-700",
      glow: "shadow-purple-500/25",
    },
    {
      to: "/book-store",
      label: isRtl ? "متجر الكتب الرقمي" : "Digital Book Store",
      badge: isRtl ? "كتب ومراجع" : "Books & References",
      icon: Store,
      color: "from-amber-500 to-orange-600",
      glow: "shadow-amber-500/25",
    },
  ];

  return (
    <section className="relative min-h-[640px] md:min-h-[750px] lg:min-h-[820px] flex flex-col justify-center overflow-hidden pt-28 pb-16 md:pt-36 md:pb-24">
      {/* Background with Dark Glass Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={eduHeroBg}
          alt="UNIGATES Educational Platform"
          width={1920}
          height={1080}
          {...({ fetchpriority: "high" } as any)}
          decoding="async"
          className="w-full h-full object-cover object-center scale-105 transform motion-safe:animate-pulse-slow"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-slate-950/80 to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.15),transparent_70%)]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 md:px-12 text-center flex flex-col items-center">
        {/* Top Floating Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white backdrop-blur-md shadow-lg shadow-black/20 mb-6 animate-fade-in">
          <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
          <span className="text-xs sm:text-sm font-black tracking-wide">
            {isRtl
              ? "المنظومة التعليمية الرقمية الموحدة — دار عبيد"
              : "The Unified Digital Educational Ecosystem — Dar Obeid"}
          </span>
          <Badge className="bg-primary hover:bg-primary/90 text-primary-foreground font-black text-[10px] px-2 py-0.5 rounded-full">
            {isRtl ? "إصدار 2026" : "2026 Edition"}
          </Badge>
        </div>

        {/* Main Headline */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.25] sm:leading-[1.2] max-w-4xl drop-shadow-lg mb-4 sm:mb-6">
          {isRtl ? (
            <>
              بوابتك الموحدة للتعليم{" "}
              <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
                الجامعي والمدرسي
              </span>{" "}
              والدورات والمكتبة
            </>
          ) : (
            <>
              Your Unified Gateway for{" "}
              <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
                Higher Education & K-12
              </span>
              , Courses & Library
            </>
          )}
        </h1>

        {/* Subtitle */}
        <p className="text-sm sm:text-lg md:text-xl text-slate-200 font-medium max-w-3xl leading-relaxed mb-8 drop-shadow">
          {isRtl
            ? "بيئة أكاديمية وتربوية متكاملة تربط الكليات والمعاهد والمدارس بأعضاء هيئة التدريس والمعلمين والطلاب، بسلاسل اعتماد رقمية وبث مباشر واختبارات ذكية."
            : "A comprehensive educational ecosystem connecting colleges, institutes, and schools with faculty, teachers, and students through digital approval workflows, live streams, and smart assessments."}
        </p>

        {/* Interactive Search Bar */}
        <form
          onSubmit={handleSearch}
          className="w-full max-w-2xl bg-card/90 backdrop-blur-xl border-2 border-white/20 rounded-2xl sm:rounded-3xl p-1.5 sm:p-2 shadow-2xl shadow-black/40 flex flex-col sm:flex-row items-center gap-2 mb-8"
        >
          <div className="flex items-center gap-2 w-full sm:w-auto px-3 py-1 bg-muted/60 rounded-xl text-xs font-bold shrink-0">
            <select
              value={searchCategory}
              onChange={(e) => setSearchCategory(e.target.value as any)}
              className="bg-transparent border-none outline-none font-bold cursor-pointer text-foreground text-xs"
            >
              <option value="all">{isRtl ? "كل المنصات" : "All Portals"}</option>
              <option value="university">{isRtl ? "المنصة الجامعية" : "University"}</option>
              <option value="school">{isRtl ? "المنصة المدرسية" : "Schools"}</option>
              <option value="courses">{isRtl ? "الدورات التدريبية" : "Courses"}</option>
              <option value="books">{isRtl ? "متجر الكتب" : "Books"}</option>
            </select>
          </div>

          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 sm:w-5 sm:h-5 absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isRtl
                  ? "ابحث عن كلية، معهد، مدرسة، دورة تعليمية، أو كتاب..."
                  : "Search colleges, schools, courses, or books..."
              }
              className="w-full h-11 ps-10 pe-4 bg-transparent text-sm font-semibold placeholder:text-muted-foreground/70 focus:outline-none text-foreground"
            />
          </div>

          <Button
            type="submit"
            className="w-full sm:w-auto h-11 px-6 rounded-xl sm:rounded-2xl font-black text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg gap-2"
          >
            <span>{isRtl ? "بحث سريع" : "Search"}</span>
            {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
          </Button>
        </form>

        {/* 4 Portals Navigation Cards / Pills */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 w-full max-w-4xl">
          {portalPills.map((pill) => {
            const IconComp = pill.icon;
            return (
              <Link
                key={pill.to}
                to={pill.to}
                className="group relative rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 bg-white/10 hover:bg-white/20 border border-white/25 hover:border-white/50 backdrop-blur-md shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 text-start flex flex-col justify-between gap-3 overflow-hidden"
              >
                <div className="flex items-center justify-between gap-2">
                  <div
                    className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br ${pill.color} text-white flex items-center justify-center shadow-lg ${pill.glow} group-hover:scale-110 transition-transform`}
                  >
                    <IconComp className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/15 text-slate-200">
                    {pill.badge}
                  </span>
                </div>

                <div>
                  <h3 className="text-xs sm:text-sm font-black text-white tracking-tight group-hover:text-amber-300 transition-colors flex items-center justify-between">
                    <span>{pill.label}</span>
                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-all" />
                  </h3>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-8 text-xs font-bold text-slate-300">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            {isRtl ? "اعتماد أكاديمي ومدرسي رسمي" : "Accredited Institutions"}
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            {isRtl ? "بيانات مشفرة ومحمية 100%" : "Encrypted & Secure"}
          </span>
          <span className="flex items-center gap-1.5">
            <Video className="w-4 h-4 text-rose-400" />
            {isRtl ? "فصول وبث مباشر تفاعلي" : "Live Classrooms"}
          </span>
          <span className="flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-400" />
            {isRtl ? "شهادات إتمام معتمدة" : "Verified Certificates"}
          </span>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
