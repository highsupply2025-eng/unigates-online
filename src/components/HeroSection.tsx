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
  const { t, dir, language } = useLanguage();
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
      label: t.universityPlatform,
      badge: t.header?.collegesBadge || "كليات ومعاهد",
      icon: Landmark,
      color: "from-blue-600 to-indigo-700",
      glow: "shadow-blue-500/25",
    },
    {
      to: "/school-platform",
      label: t.schoolPlatform,
      badge: t.header?.schoolsBadge || "مدارس وفصول",
      icon: School,
      color: "from-emerald-600 to-teal-700",
      glow: "shadow-emerald-500/25",
    },
    {
      to: "/courses",
      label: t.exploreCourses,
      badge: t.header?.coursesBadge || "دورات وشهادات",
      icon: BookOpen,
      color: "from-purple-600 to-fuchsia-700",
      glow: "shadow-purple-500/25",
    },
    {
      to: "/book-store",
      label: t.bookStore,
      badge: t.header?.booksBadge || "كتب ومراجع",
      icon: Store,
      color: "from-amber-500 to-orange-600",
      glow: "shadow-amber-500/25",
    },
  ];

  const getSearchPlaceholder = () => {
    switch (language) {
      case "en": return "Search colleges, schools, courses, or books...";
      case "fr": return "Rechercher des facultés, cours, écoles ou livres...";
      case "es": return "Buscar facultades, colegios, cursos o libros...";
      case "de": return "Suchen Sie Fakultäten, Schulen, Kurse oder Bücher...";
      case "zh": return "搜索大学、中小学、课程或图书...";
      case "ru": return "Поиск факультетов, школ, курсов или книг...";
      case "tr": return "Fakülte, okul, kurs veya kitap arayın...";
      default: return "ابحث عن كلية، معهد، مدرسة، دورة تعليمية، أو كتاب...";
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
            {t.hero.tagline || (isRtl
              ? "المنظومة التعليمية الرقمية الموحدة — دار عبيد"
              : "The Unified Digital Educational Ecosystem — Dar Obeid")}
          </span>
          <Badge className="bg-primary hover:bg-primary/90 text-primary-foreground font-black text-[10px] px-2 py-0.5 rounded-full">
            {t.hero.edition || "2026"}
          </Badge>
        </div>

        {/* Main Headline */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.25] sm:leading-[1.2] max-w-4xl drop-shadow-lg mb-4 sm:mb-6">
          {language === "ar" ? (
            <>
              بوابتك الموحدة للتعليم{" "}
              <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
                الجامعي والمدرسي
              </span>{" "}
              والدورات والمكتبة
            </>
          ) : (
            <>
              {t.hero.title1}{" "}
              <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
                {t.hero.title2}
              </span>
            </>
          )}
        </h1>

        {/* Subtitle */}
        <p className="text-sm sm:text-lg md:text-xl text-slate-200 font-medium max-w-3xl leading-relaxed mb-8 drop-shadow">
          {t.features.subtitle || (isRtl
            ? "بيئة أكاديمية وتربوية متكاملة تربط الكليات والمعاهد والمدارس بأعضاء هيئة التدريس والمعلمين والطلاب، بسلاسل اعتماد رقمية وبث مباشر واختبارات ذكية."
            : "A comprehensive educational ecosystem connecting colleges, institutes, and schools with faculty, teachers, and students through digital approval workflows, live streams, and smart assessments.")}
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
              <option value="university">{t.universityPlatform}</option>
              <option value="school">{t.schoolPlatform}</option>
              <option value="courses">{t.exploreCourses}</option>
              <option value="books">{t.bookStore}</option>
            </select>
          </div>

          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 sm:w-5 sm:h-5 absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
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

        {/* 4 Portals Navigation Cards / Pills */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 w-full max-w-4xl">
          {portalPills.map((pill) => {
            const IconComp = pill.icon;
            return (
              <Link
                key={pill.to}
                to={pill.to}
                className="group relative flex flex-col items-center p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white/10 hover:bg-white/15 border border-white/20 backdrop-blur-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105"
              >
                <div
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br ${pill.color} text-white flex items-center justify-center shadow-lg ${pill.glow} mb-2.5 sm:mb-3 group-hover:scale-110 transition-transform`}
                >
                  <IconComp className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <h3 className="text-xs sm:text-sm font-black text-white text-center line-clamp-1 mb-1">
                  {pill.label}
                </h3>
                <span className="text-[10px] sm:text-xs text-teal-300 font-bold">
                  {pill.badge}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
