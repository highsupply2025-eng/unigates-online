import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Landmark, School, BookOpen, Store, Search, ArrowLeft, ArrowRight,
  Sparkles, Briefcase
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import eduHeroBg from "@/assets/edu-hero-bg.jpg";
import { useLanguage } from "@/contexts/LanguageContext";
import StatsSection from "./StatsSection";

const HeroSection = () => {
  const { t, dir, language } = useLanguage();
  const isRtl = dir === "rtl";
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchCategory, setSearchCategory] = useState<"all" | "university" | "school" | "courses" | "books" | "nasher" | "career">("all");

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
    } else if (searchCategory === "nasher") {
      navigate(`/nasher?q=${encodeURIComponent(query)}`);
    } else if (searchCategory === "career") {
      navigate(`/career?q=${encodeURIComponent(query)}`);
    } else {
      navigate(`/courses?search=${encodeURIComponent(query)}`);
    }
  };

  const portalPills = [
    {
      to: "/university-platform",
      label: t.universityPlatform,
      badge: isRtl ? "كليات ومعاهد" : "Colleges & Institutes",
      icon: Landmark,
      color: "from-blue-600 to-indigo-700",
      glow: "shadow-blue-500/25",
      badgeStyle: "bg-blue-500/20 text-blue-200 border-blue-400/30",
    },
    {
      to: "/school-platform",
      label: t.schoolPlatform,
      badge: isRtl ? "مدارس K-12" : "K-12 Schools",
      icon: School,
      color: "from-emerald-600 to-teal-700",
      glow: "shadow-emerald-500/25",
      badgeStyle: "bg-emerald-500/20 text-emerald-200 border-emerald-400/30",
    },
    {
      to: "/courses",
      label: t.exploreCourses,
      badge: isRtl ? "تدريب مهني" : "Professional Training",
      icon: BookOpen,
      color: "from-purple-600 to-fuchsia-700",
      glow: "shadow-purple-500/25",
      badgeStyle: "bg-purple-500/20 text-purple-200 border-purple-400/30",
    },
    {
      to: "/book-store",
      label: t.bookStore,
      badge: isRtl ? "دار عبيد" : "Dar Obeid",
      icon: Store,
      color: "from-amber-500 to-orange-600",
      glow: "shadow-amber-500/25",
      badgeStyle: "bg-amber-500/20 text-amber-200 border-amber-400/30",
    },
    {
      to: "/nasher",
      label: t.nasherPlatform || (isRtl ? "منصة ناشر" : "Nasher Portal"),
      badge: isRtl ? "عقود ونشر" : "Publishing",
      icon: Sparkles,
      color: "from-rose-600 to-pink-700",
      glow: "shadow-rose-500/25",
      badgeStyle: "bg-rose-500/20 text-rose-200 border-rose-400/30",
    },
    {
      to: "/career",
      label: t.careerPlatform || (isRtl ? "منصة Career" : "Career Portal"),
      badge: isRtl ? "توظيف وكفاءات" : "Careers & Talent",
      icon: Briefcase,
      color: "from-cyan-600 to-teal-700",
      glow: "shadow-cyan-500/25",
      badgeStyle: "bg-cyan-500/20 text-cyan-200 border-cyan-400/30",
    },
  ];

  const getSearchPlaceholder = () => {
    switch (language) {
      case "en": return "Search colleges, schools, courses, books, publishing, or careers...";
      case "fr": return "Rechercher des facultés, cours, écoles, livres, contrats ou emplois...";
      case "es": return "Buscar facultades, colegios, cursos, libros, contratos o empleos...";
      case "de": return "Suchen Sie Fakultäten, Schulen, Kurse, Bücher, Verträge oder Jobs...";
      case "zh": return "搜索大学、中小学、课程、图书、出版或职位招聘...";
      case "ru": return "Поиск факультетов, школ, курсов, книг, издательств или вакансий...";
      case "tr": return "Fakülte, okul, kurs, kitap, yayın veya iş ilanları arayın...";
      default: return "ابحث عن كلية، معهد، مدرسة، دورة تعليمية، كتاب، مخطوطة، أو وظيفة...";
    }
  };

  const getSearchButtonText = () => {
    switch (language) {
      case "en": return "Search";
      case "fr": return "Rechercher";
      case "es": return "Buscar";
      case "de": return "Suchen";
      case "zh": return "快速搜索";
      case "ru": return "Поиск";
      case "tr": return "Ara";
      default: return "بحث سريع";
    }
  };

  return (
    <section className="relative min-h-[750px] md:min-h-[850px] lg:min-h-[920px] flex flex-col justify-center overflow-hidden pt-28 pb-12 md:pt-36 md:pb-16">
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

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 md:px-8 text-center flex flex-col items-center">
        {/* Top Floating Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white backdrop-blur-md shadow-lg shadow-black/20 mb-6 animate-fade-in">
          <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
          <span className="text-xs sm:text-sm font-black tracking-wide">
            {t.hero.tagline || (isRtl
              ? "المنظومة التعليمية الرقمية الشاملة"
              : "Comprehensive Digital Educational Ecosystem")}
          </span>
        </div>

        {/* Main Hero Headline */}
        <h1 className="text-[22px] sm:text-[22px] md:text-[22px] font-black text-white tracking-normal leading-relaxed max-w-4xl drop-shadow-2xl mb-4 animate-fade-in">
          {t.hero.title || (isRtl
            ? "بوابتك الموحدة للتعليم الجامعي والمدرسي والدورات والكتب والنشر وفرص العمل"
            : "Your Unified Gateway to Higher Education, K-12, Professional Courses, and Publishing")}
        </h1>

        {/* Dynamic Global Unified Search Bar */}
        <form
          onSubmit={handleSearch}
          className="w-full max-w-3xl flex flex-col sm:flex-row items-center gap-2 p-2 rounded-2xl sm:rounded-3xl bg-white/95 dark:bg-card/95 backdrop-blur-2xl shadow-2xl border-2 border-white/40 dark:border-border/60 mb-8 sm:mb-12 mt-4"
        >
          {/* Category Dropdown */}
          <div className="w-full sm:w-auto shrink-0 flex items-center gap-2 px-3 py-1.5 border-b sm:border-b-0 sm:border-e border-border/60">
            <span className="text-xs font-bold text-muted-foreground whitespace-nowrap hidden md:inline">
              {isRtl ? "القطاع:" : "Sector:"}
            </span>
            <select
              value={searchCategory}
              onChange={(e) => setSearchCategory(e.target.value as any)}
              className="bg-muted/60 hover:bg-muted text-foreground text-xs sm:text-sm font-bold rounded-xl px-2.5 py-1.5 border-0 focus:ring-2 focus:ring-primary/40 focus:outline-none cursor-pointer w-full sm:w-auto"
            >
              <option value="all">{isRtl ? "🌟 كل المنصات" : "All Platforms"}</option>
              <option value="university">{isRtl ? "🏛️ المنصة الجامعية" : "University Platform"}</option>
              <option value="school">{isRtl ? "🏫 المنصة المدرسية" : "School Platform"}</option>
              <option value="courses">{isRtl ? "📚 أكاديمية الدورات" : "Courses Academy"}</option>
              <option value="books">{isRtl ? "📖 متجر الكتب" : "Book Store"}</option>
              <option value="nasher">{isRtl ? "✨ منصة ناشر" : "Nasher Platform"}</option>
              <option value="career">{isRtl ? "💼 فرص العمل (Career)" : "Career & Jobs"}</option>
            </select>
          </div>

          <div className="relative flex-1 w-full flex items-center">
            <Search className="absolute start-3.5 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={getSearchPlaceholder()}
              className="w-full h-11 ps-10 pe-4 bg-transparent text-sm font-semibold placeholder:text-muted-foreground/70 focus:outline-none text-foreground"
            />
          </div>

          <Button
            type="submit"
            className="w-full sm:w-auto h-11 px-6 rounded-xl sm:rounded-2xl font-black text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg gap-2"
          >
            <span>{getSearchButtonText()}</span>
            {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
          </Button>
        </form>

        {/* 6 Portals Navigation Cards / Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 w-full max-w-5xl mb-8 sm:mb-12">
          {portalPills.map((pill) => {
            const IconComp = pill.icon;
            return (
              <Link
                key={pill.to}
                to={pill.to}
                className="group relative flex flex-col items-center p-3 sm:p-4 rounded-2xl sm:rounded-3xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/20 backdrop-blur-md shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105"
              >
                <div
                  className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br ${pill.color} text-white flex items-center justify-center shadow-lg ${pill.glow} mb-2 group-hover:scale-110 transition-transform`}
                >
                  <IconComp className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
                </div>
                <h3 className="text-xs sm:text-sm font-black text-white text-center line-clamp-1 mb-1.5">
                  {pill.label}
                </h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-black tracking-wide border shadow-sm ${pill.badgeStyle}`}
                >
                  {pill.badge}
                </span>
              </Link>
            );
          })}
        </div>

        {/* 14 Ecosystem Real-Time Statistics Embedded Inside Hero */}
        <div className="w-full">
          <StatsSection embedded={true} />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
