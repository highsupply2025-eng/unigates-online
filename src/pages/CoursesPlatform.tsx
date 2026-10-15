import { useState, useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import SiteFooter from "@/components/SiteFooter";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Video, PlayCircle, User, BookOpenCheck, Languages,
  Code2, Briefcase, Palette, Microscope, HeartPulse,
  Lock, Play,
  Search, Flame, Layers, Sparkles, Star, Zap, X,
  ShieldCheck, Award, GraduationCap, Home, Menu, Volume2, BadgePercent,
  CheckCircle2, CreditCard
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import LanguageSelectorDropdown from "@/components/LanguageSelectorDropdown";
import ThemeToggle from "@/components/ThemeToggle";
import { useAllCourses } from "@/hooks/useCourses";
import PlatformUnderDevelopmentOverlay from "@/components/PlatformUnderDevelopmentOverlay";
import { useCourseCheckout } from "@/hooks/useCourseCheckout";
import { captureCourseReferralFromUrl } from "@/services/courseReferralTracker";

export interface CourseCatalogItem {
  id: string;
  title_ar: string;
  title_en: string;
  instructor_ar: string;
  instructor_en: string;
  instructor_role_ar: string;
  instructor_role_en: string;
  category: "programming" | "business" | "languages" | "design" | "sciences" | "health";
  category_ar: string;
  category_en: string;
  episode_count: number;
  duration_hours: number;
  rating: number;
  reviews_count: number;
  students_count: number;
  price_egp: number;
  is_free: boolean;
  is_bestseller: boolean;
  has_certificate: boolean;
  is_new_2026: boolean;
  thumbnail_url: string;
  free_episode_title_ar: string;
  free_episode_title_en: string;
  free_episode_duration: string;
  free_episode_video_url?: string;
  description_ar: string;
  description_en: string;
}

// Empty catalog: Waiting for verified instructors and institutions to upload authentic courses
const DEFAULT_COURSES_CATALOG: CourseCatalogItem[] = [];

const CoursesPlatform = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { dir, language } = useLanguage();
  const isRtl = dir === "rtl";

  const { checkoutCourse, loading: checkoutLoading, referralInfo } = useCourseCheckout();

  useEffect(() => {
    captureCourseReferralFromUrl();
  }, []);

  const { data: allCourses = [] } = useAllCourses();

  // Combine real database courses with rich catalog
  const catalog: CourseCatalogItem[] = useMemo(() => {
    if (!allCourses || allCourses.length === 0) {
      return DEFAULT_COURSES_CATALOG;
    }
    const dbItems: CourseCatalogItem[] = allCourses.map((c, idx) => ({
      id: c.id,
      title_ar: c.title_ar,
      title_en: c.title_en || c.title_ar,
      instructor_ar: c.instructor_ar || "محاضر معتمد",
      instructor_en: c.instructor_en || "Certified Instructor",
      instructor_role_ar: "محاضر معتمد بالأكاديمية",
      instructor_role_en: "Verified Academy Lecturer",
      category: "programming",
      category_ar: c.category_ar || "البرمجة والذكاء الاصطناعي",
      category_en: c.category_en || "Programming & AI",
      episode_count: c.episode_count || 12,
      duration_hours: Math.max(10, Math.floor((c.episode_count || 12) * 1.2)),
      rating: 4.85,
      reviews_count: 45 + idx * 12,
      students_count: 120 + idx * 35,
      price_egp: c.is_free ? 0 : 550,
      is_free: !!c.is_free,
      is_bestseller: idx < 2,
      has_certificate: true,
      is_new_2026: true,
      thumbnail_url: c.thumbnail_url || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80",
      free_episode_title_ar: "المحاضرة التمهيدية الأولى مجاناً",
      free_episode_title_en: "Lecture 1 Free Overview",
      free_episode_duration: "18 دقيقة",
      description_ar: "دورة تدريبية متكاملة مسجلة بجودة 4K ومحمية بنظام تشفير الفيديو السحابي DRM.",
      description_en: "Comprehensive video course recorded in 4K and protected by DRM.",
    }));

    // deduplicate by id
    const existingIds = new Set(dbItems.map((d) => d.id));
    const uniqueDefaults = DEFAULT_COURSES_CATALOG.filter((d) => !existingIds.has(d.id));
    return [...dbItems, ...uniqueDefaults];
  }, [allCourses]);

  // 2-Row Layout State (Exact match to Bookstore Platform layout)
  const [activeMainTab, setActiveMainTab] = useState<"bestsellers" | "accredited" | "categories" | "new_arrivals">("categories");
  const [activeSubCategory, setActiveSubCategory] = useState<string>("all");
  const [liveSearchQuery, setLiveSearchQuery] = useState<string>("");
  const [liveSearchCategory, setLiveSearchCategory] = useState<string>("all");

  // Interactive Video / Episode Preview Dialog State
  const [previewCourse, setPreviewCourse] = useState<CourseCatalogItem | null>(null);

  // Categories list for courses
  const courseCategories = [
    {
      id: "programming",
      titleAr: "البرمجة والذكاء الاصطناعي",
      titleEn: "Programming & AI",
      descAr: "تطوير الويب، الذكاء الاصطناعي التوليدي، تحليل البيانات، والأمن السيبراني.",
      descEn: "Web Dev, Generative AI, Data Science & Cybersecurity.",
      icon: Code2,
      color: "from-blue-600 to-indigo-600",
      badge: isRtl ? "أحدث التقنيات" : "Cutting Edge",
    },
    {
      id: "business",
      titleAr: "إدارة الأعمال والقيادة (PMP)",
      titleEn: "Business & Management (PMP)",
      descAr: "إدارة المشاريع الاحترافية، ريادة الأعمال، والتسويق الرقمي المتقدم.",
      descEn: "PMP Project Management, Entrepreneurship & Marketing.",
      icon: Briefcase,
      color: "from-amber-600 to-orange-600",
      badge: isRtl ? "الأكثر طلباً" : "Top Ranked",
    },
    {
      id: "languages",
      titleAr: "اللغات والترجمة العالمية",
      titleEn: "Languages & Translation",
      descAr: "محادثة اللغة الإنجليزية، التحضير لاختبارات IELTS و TOEFL، واللغات الحية.",
      descEn: "English Fluency, IELTS & TOEFL Prep, and World Languages.",
      icon: Languages,
      color: "from-rose-600 to-pink-600",
      badge: isRtl ? "مستويات معتمدة" : "Accredited",
    },
    {
      id: "design",
      titleAr: "التصميم الرقمي والـ UI/UX",
      titleEn: "Design & UI/UX",
      descAr: "تصميم واجهات وتجربة المستخدم، أنظمة Figma، والجرافيك والموشن.",
      descEn: "UI/UX Design, Figma Design Systems & Motion Graphics.",
      icon: Palette,
      color: "from-purple-600 to-fuchsia-600",
      badge: isRtl ? "تطبيقات عملية" : "Hands-on",
    },
    {
      id: "sciences",
      titleAr: "المناهج والعلوم والرياضيات",
      titleEn: "Sciences & Mathematics",
      descAr: "المقررات الجامعية والهندسية، التفاضل والتكامل، والفيزياء المتقدمة.",
      descEn: "Calculus, Engineering Math, Physics & University Prep.",
      icon: Microscope,
      color: "from-teal-600 to-emerald-600",
      badge: isRtl ? "شرح شامل" : "Complete Syllabus",
    },
    {
      id: "health",
      titleAr: "العلوم الطبية والصحية",
      titleEn: "Healthcare & Medicine",
      descAr: "الإسعافات الأولية السريرية، المصطلحات الطبية، والتغذية العلاجية.",
      descEn: "First Aid, Clinical Terminology, Pharmacology & Public Health.",
      icon: HeartPulse,
      color: "from-red-600 to-rose-600",
      badge: isRtl ? "شهادات مهنية" : "Medical Badges",
    },
  ];

  // Dynamic courses calculation for the 2-row layout
  const displayedCourses = useMemo(() => {
    let result = [...catalog];

    // 1. Filter by activeMainTab
    if (activeMainTab === "bestsellers") {
      result = result.filter((c) => c.is_bestseller || c.rating >= 4.9);
      if (result.length === 0) {
        result = [...catalog].sort((a, b) => b.students_count - a.students_count);
      }
    } else if (activeMainTab === "accredited") {
      result = result.filter((c) => c.has_certificate);
    } else if (activeMainTab === "new_arrivals") {
      result = result.filter((c) => c.is_new_2026);
      if (result.length === 0) {
        result = [...catalog].reverse();
      }
    } else if (activeMainTab === "categories") {
      result = [...catalog];
    }

    // 2. Filter by sub-category if selected
    if (activeSubCategory !== "all") {
      result = result.filter((c) => c.category === activeSubCategory);
    }

    // 3. Filter by Live Instant Search Category
    if (liveSearchCategory !== "all") {
      result = result.filter((c) => c.category === liveSearchCategory);
    }

    // 4. Filter by Live Instant Search Query
    const query = liveSearchQuery.trim().toLowerCase();
    if (query) {
      result = result.filter(
        (c) =>
          c.title_ar.toLowerCase().includes(query) ||
          c.title_en.toLowerCase().includes(query) ||
          c.instructor_ar.toLowerCase().includes(query) ||
          c.instructor_en.toLowerCase().includes(query) ||
          c.category_ar.toLowerCase().includes(query) ||
          c.category_en.toLowerCase().includes(query) ||
          c.description_ar.toLowerCase().includes(query)
      );
    }

    return result;
  }, [catalog, activeMainTab, activeSubCategory, liveSearchCategory, liveSearchQuery]);

  return (
    <PlatformUnderDevelopmentOverlay platform="courses">
      <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-purple-600 selection:text-white transition-colors" dir={dir}>
        
        {/* ========================================================================= */}
        {/* 1. TOP HEADER BAR (CLEAN, WORLD-CLASS COURSES ACADEMY DESIGN)             */}
        {/* ========================================================================= */}
        <header className="sticky top-0 z-50 bg-card/90 dark:bg-slate-950/95 backdrop-blur-xl border-b border-border/80 dark:border-slate-800/80 shadow-sm transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 h-18 flex items-center justify-between gap-4">
            
            {/* Start in RTL: Brand Logo & Title */}
            <div className="flex items-center gap-4 sm:gap-6 lg:gap-8">
              <Link to="/courses" className="flex items-center gap-3 group">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-purple-600 via-indigo-600 to-violet-500 p-0.5 shadow-lg shadow-purple-500/25 group-hover:scale-105 transition-transform flex items-center justify-center text-white shrink-0">
                  <Video className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl sm:text-2xl font-black text-foreground tracking-tight">UNIGATES</span>
                    <Badge className="bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-400/30 text-[10px] font-bold px-2 py-0.5">
                      {isRtl ? "أكاديمية الدورات" : "Courses Academy"}
                    </Badge>
                  </div>
                  <p className="text-[11px] font-bold text-muted-foreground tracking-wide">
                    {isRtl ? "منصة التدريب وبث المحاضرات الذكية DRM" : "Smart DRM Video E-Learning Platform"}
                  </p>
                </div>
              </Link>
            </div>

            {/* End in RTL: Actions, Auth, Utils */}
            <div className="flex items-center gap-2 sm:gap-2.5">
              
              {/* Home */}
              <Link to="/">
                <Button variant="ghost" size="sm" className="hover:bg-muted text-muted-foreground hover:text-foreground gap-1.5 h-10 px-3 rounded-xl font-bold">
                  <Home className="w-4 h-4 text-purple-500" />
                  <span>{isRtl ? "الرئيسية" : "Home"}</span>
                </Button>
              </Link>

              {/* Action Button: Styled like Bookstore's "طلب نشر كتاب" */}
              <Link to="/courses/signup?role=lecturer" title={isRtl ? "سجل كمدرب أو محاضر وابدأ تدريس دوراتك" : "Join as Instructor & Start Teaching"}>
                <Button
                  size="sm"
                  className="font-black text-xs sm:text-sm h-10 px-3 sm:px-4 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white shadow-md shadow-purple-500/20 gap-1.5 hover:scale-105 transition-all"
                >
                  <BookOpenCheck className="w-3.5 h-3.5" />
                  <span>{isRtl ? "انضم كمحاضر / مدرب" : "Join as Instructor"}</span>
                  <span className="hidden sm:inline-block px-1.5 py-0.5 rounded-md bg-white/20 text-[10px]">
                    {isRtl ? "منصة المحاضرين" : "Instructors"}
                  </span>
                </Button>
              </Link>

              {/* Sign In & Sign Up */}
              <div className="hidden sm:flex items-center gap-1.5 sm:gap-2">
                <Link to="/courses/login">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-10 px-3 sm:px-3.5 rounded-xl border-border/80 bg-card/90 text-foreground hover:bg-muted text-xs font-bold gap-1.5 shadow-xs"
                  >
                    <User className="w-4 h-4 text-purple-500" />
                    <span>{isRtl ? "تسجيل الدخول" : "Sign In"}</span>
                  </Button>
                </Link>

                <Link to="/courses/signup?role=personal">
                  <Button
                    size="sm"
                    className="h-10 px-3.5 sm:px-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white text-xs font-black gap-1.5 shadow-md shadow-blue-500/25 hover:scale-105 transition-all"
                  >
                    <GraduationCap className="w-4 h-4 text-white" />
                    <span>{isRtl ? "إنشاء حساب طالب" : "Sign Up"}</span>
                  </Button>
                </Link>
              </div>

              {/* Utility Dropdowns */}
              <div className="flex items-center gap-1">
                <LanguageSelectorDropdown className="h-10 px-2.5 rounded-xl border-border/80 bg-card/90 text-foreground shadow-xs" />
                <ThemeToggle className="h-10 w-10 p-0 rounded-xl border-border/80 bg-card/90 text-foreground shadow-xs" />
              </div>

              {/* Mobile Hamburger */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden text-foreground hover:bg-muted p-2 h-10 w-10 rounded-xl"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </Button>
            </div>
          </div>

          {/* Mobile Drawer */}
          {mobileMenuOpen && (
            <div className="lg:hidden bg-card border-b border-border px-6 py-5 space-y-3 animate-fade-in text-foreground shadow-lg">
              <Link to="/" onClick={() => setMobileMenuOpen(false)} className="block">
                <Button variant="outline" className="w-full justify-start border-border bg-card text-foreground h-11 gap-2 font-bold rounded-xl">
                  <Home className="w-4 h-4 text-purple-500" />
                  <span>{isRtl ? "العودة للرئيسية" : "Home"}</span>
                </Button>
              </Link>
              <Link to="/courses/signup?role=lecturer" onClick={() => setMobileMenuOpen(false)} className="block">
                <Button className="w-full justify-start bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-600 text-white h-11 gap-2 font-black rounded-xl shadow-md">
                  <BookOpenCheck className="w-4 h-4" />
                  <span>{isRtl ? "انضم كمحاضر / مدرب" : "Join as Instructor"}</span>
                </Button>
              </Link>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link to="/courses/login" onClick={() => setMobileMenuOpen(false)} className="block">
                  <Button variant="outline" className="w-full border-border bg-card text-foreground hover:bg-muted h-11 font-bold rounded-xl gap-1.5">
                    <User className="w-4 h-4 text-purple-500" />
                    <span>{isRtl ? "تسجيل الدخول" : "Sign In"}</span>
                  </Button>
                </Link>
                <Link to="/courses/signup?role=personal" onClick={() => setMobileMenuOpen(false)} className="block">
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white h-11 font-black rounded-xl gap-1.5 shadow-md">
                    <GraduationCap className="w-4 h-4 text-white" />
                    <span>{isRtl ? "حساب طالب" : "Sign Up"}</span>
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </header>

        {/* ========================================================================= */}
        {/* ROW 1: DEDICATED LIVE INSTANT SEARCH BAR (STICKY UNDER HEADER)            */}
        {/* ========================================================================= */}
        <div className="sticky top-18 z-40 bg-card/95 dark:bg-slate-900/95 backdrop-blur-2xl border-b border-border dark:border-slate-800/90 shadow-sm dark:shadow-md py-2.5 px-4 sm:px-6 md:px-8 transition-colors">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center gap-2.5">
            {/* Track Dropdown */}
            <div className="w-full sm:w-auto shrink-0">
              <select
                value={liveSearchCategory}
                onChange={(e) => {
                  setLiveSearchCategory(e.target.value);
                  const el = document.getElementById("courses-results-grid");
                  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="w-full sm:w-auto h-11 px-3.5 rounded-xl bg-background dark:bg-slate-950 border border-input dark:border-slate-700/80 text-xs sm:text-sm font-black text-foreground dark:text-slate-200 focus:outline-none focus:border-purple-500 cursor-pointer shadow-xs transition-colors"
              >
                <option value="all" className="bg-background text-foreground dark:bg-slate-900 dark:text-white">{isRtl ? "🌟 كل التخصصات" : "All Specializations"}</option>
                <option value="programming" className="bg-background text-foreground dark:bg-slate-900 dark:text-white">{isRtl ? "💻 البرمجة والذكاء الاصطناعي" : "Programming & AI"}</option>
                <option value="business" className="bg-background text-foreground dark:bg-slate-900 dark:text-white">{isRtl ? "📈 إدارة الأعمال والقيادة (PMP)" : "Business & Leadership"}</option>
                <option value="languages" className="bg-background text-foreground dark:bg-slate-900 dark:text-white">{isRtl ? "🌐 اللغات والترجمة العالمية" : "Languages & Translation"}</option>
                <option value="design" className="bg-background text-foreground dark:bg-slate-900 dark:text-white">{isRtl ? "🎨 التصميم الرقمي والـ UI/UX" : "UI/UX & Digital Design"}</option>
                <option value="sciences" className="bg-background text-foreground dark:bg-slate-900 dark:text-white">{isRtl ? "🎒 المناهج والعلوم والرياضيات" : "Sciences & Math"}</option>
                <option value="health" className="bg-background text-foreground dark:bg-slate-900 dark:text-white">{isRtl ? "🏥 العلوم الطبية والصحية" : "Medicine & Health"}</option>
              </select>
            </div>

            {/* Instant Search Input */}
            <div className="relative flex-1 w-full flex items-center">
              <Search className="w-4 h-4 sm:w-5 sm:h-5 absolute start-3 text-purple-600 dark:text-purple-400" />
              <input
                type="text"
                value={liveSearchQuery}
                onChange={(e) => setLiveSearchQuery(e.target.value)}
                placeholder={isRtl ? "بحث مباشر وفوري: اكتب اسم الدورة، المحاضر، التخصص، أو الكلمة المفتاحية..." : "Instant Live Search: course, instructor, track, or keywords..."}
                className="w-full h-11 ps-9 sm:ps-10 pe-10 rounded-xl bg-background dark:bg-slate-950 border border-input dark:border-slate-700/80 text-xs sm:text-sm text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder:text-slate-500 focus:outline-none focus:border-purple-500 font-semibold shadow-xs transition-colors"
              />
              {liveSearchQuery && (
                <button
                  type="button"
                  onClick={() => setLiveSearchQuery("")}
                  className="absolute end-3 text-muted-foreground hover:text-foreground dark:text-slate-400 dark:hover:text-white p-1 rounded-full hover:bg-muted dark:hover:bg-slate-800"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Instant Search Counter & Jump Button */}
            <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-2 shrink-0">
              <span className="text-[11px] font-bold text-muted-foreground dark:text-slate-400 px-2 py-1 rounded-lg bg-muted/60 dark:bg-slate-950/70 border border-border dark:border-slate-800">
                {isRtl ? `${displayedCourses.length} دورة متاحة` : `${displayedCourses.length} Courses Found`}
              </span>
              <Button
                type="button"
                onClick={() => {
                  const el = document.getElementById("courses-results-grid");
                  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="h-11 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-xs shadow-md gap-1.5"
              >
                <Zap className="w-3.5 h-3.5 text-purple-200 dark:text-purple-300" />
                <span>{isRtl ? "عرض الدورات ⚡" : "Show Courses"}</span>
              </Button>
            </div>
          </div>

          {/* Trending Search Tags */}
          <div className="max-w-7xl mx-auto flex items-center gap-1.5 pt-2 text-[11px] overflow-x-auto no-scrollbar">
            <span className="text-muted-foreground dark:text-slate-400 font-bold shrink-0">{isRtl ? "رائج الآن:" : "Trending:"}</span>
            {["الذكاء_الاصطناعي", "بايثون", "PMP", "إدارة_المشاريع", "اللغة_الإنجليزية", "UI_UX", "الأمن_السيبراني"].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => {
                  setLiveSearchQuery(tag.replace(/_/g, " "));
                  const el = document.getElementById("courses-results-grid");
                  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="px-2.5 py-0.5 rounded-full bg-muted/80 hover:bg-muted text-foreground/80 hover:text-foreground dark:bg-slate-800/80 dark:hover:bg-slate-700 dark:text-slate-300 dark:hover:text-white border border-border/80 dark:border-slate-700/60 shrink-0 font-medium transition-colors"
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* ROW 2: 4 HORIZONTAL SECTION TABS (الأكثر طلباً - مسارات معتمدة - الأقسام - جديدنا) */}
        {/* ========================================================================= */}
        <div className="sticky top-[138px] z-30 bg-card/95 dark:bg-slate-950/95 backdrop-blur-xl border-b border-border dark:border-slate-800/80 shadow-md py-2 px-4 sm:px-6 md:px-8 transition-colors">
          <div className="max-w-7xl mx-auto flex flex-col gap-2">
            
            {/* 4 Main Section Buttons */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              
              {/* 1. الأكثر طلباً */}
              <button
                type="button"
                onClick={() => {
                  setActiveMainTab("bestsellers");
                  const el = document.getElementById("courses-results-grid");
                  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm transition-all border ${
                  activeMainTab === "bestsellers"
                    ? "bg-amber-500/15 dark:bg-gradient-to-r dark:from-amber-500/20 dark:to-orange-500/20 border-amber-500 text-amber-700 dark:text-amber-300 shadow-sm"
                    : "bg-muted/50 dark:bg-slate-900/80 border-border dark:border-slate-800 text-muted-foreground dark:text-slate-300 hover:text-foreground dark:hover:text-white hover:bg-muted dark:hover:bg-slate-800/80"
                }`}
              >
                <Flame className={`w-4 h-4 ${activeMainTab === "bestsellers" ? "text-amber-600 dark:text-amber-400 animate-pulse" : "text-amber-500 dark:text-amber-400"}`} />
                <span>{isRtl ? "الأكثر طلباً" : "Bestsellers"}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/15 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                  {catalog.filter((c) => c.is_bestseller).length || 4}
                </span>
              </button>

              {/* 2. مسارات معتمدة بشهادات */}
              <button
                type="button"
                onClick={() => {
                  setActiveMainTab("accredited");
                  const el = document.getElementById("courses-results-grid");
                  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm transition-all border ${
                  activeMainTab === "accredited"
                    ? "bg-purple-500/15 dark:bg-gradient-to-r dark:from-purple-500/20 dark:to-violet-500/20 border-purple-500 text-purple-700 dark:text-purple-300 shadow-sm"
                    : "bg-muted/50 dark:bg-slate-900/80 border-border dark:border-slate-800 text-muted-foreground dark:text-slate-300 hover:text-foreground dark:hover:text-white hover:bg-muted dark:hover:bg-slate-800/80"
                }`}
              >
                <Award className={`w-4 h-4 ${activeMainTab === "accredited" ? "text-purple-600 dark:text-purple-400 animate-bounce" : "text-purple-500 dark:text-purple-400"}`} />
                <span>{isRtl ? "مسارات معتمدة" : "Accredited"}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-500/15 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                  {isRtl ? "شهادات QR" : "QR Cert"}
                </span>
              </button>

              {/* 3. الأقسام والتخصصات */}
              <button
                type="button"
                onClick={() => {
                  setActiveMainTab("categories");
                  const el = document.getElementById("courses-results-grid");
                  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm transition-all border ${
                  activeMainTab === "categories"
                    ? "bg-blue-500/15 dark:bg-gradient-to-r dark:from-blue-600/25 dark:to-indigo-600/25 border-blue-500 text-blue-700 dark:text-blue-300 shadow-sm"
                    : "bg-muted/50 dark:bg-slate-900/80 border-border dark:border-slate-800 text-muted-foreground dark:text-slate-300 hover:text-foreground dark:hover:text-white hover:bg-muted dark:hover:bg-slate-800/80"
                }`}
              >
                <Layers className={`w-4 h-4 ${activeMainTab === "categories" ? "text-blue-600 dark:text-cyan-400" : "text-blue-500 dark:text-cyan-400"}`} />
                <span>{isRtl ? "الأقسام والتخصصات" : "Tracks"}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-500/15 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30">
                  {courseCategories.length}
                </span>
              </button>

              {/* 4. جديدنا 2026 */}
              <button
                type="button"
                onClick={() => {
                  setActiveMainTab("new_arrivals");
                  const el = document.getElementById("courses-results-grid");
                  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm transition-all border ${
                  activeMainTab === "new_arrivals"
                    ? "bg-emerald-500/15 dark:bg-gradient-to-r dark:from-emerald-500/20 dark:to-teal-500/20 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-sm"
                    : "bg-muted/50 dark:bg-slate-900/80 border-border dark:border-slate-800 text-muted-foreground dark:text-slate-300 hover:text-foreground dark:hover:text-white hover:bg-muted dark:hover:bg-slate-800/80"
                }`}
              >
                <Sparkles className={`w-4 h-4 ${activeMainTab === "new_arrivals" ? "text-emerald-600 dark:text-emerald-400 animate-spin" : "text-emerald-500 dark:text-emerald-400"}`} />
                <span>{isRtl ? "جديدنا (دورات 2026)" : "New Courses"}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  2026
                </span>
              </button>
            </div>

            {/* Sub-Filter Chips inside Active Tab */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              <span className="text-xs text-muted-foreground dark:text-slate-400 font-bold shrink-0">
                {activeMainTab === "bestsellers" && (isRtl ? "الأكثر طلباً في:" : "Top in:")}
                {activeMainTab === "accredited" && (isRtl ? "شهادات في:" : "Certs in:")}
                {activeMainTab === "categories" && (isRtl ? "تصفية التخصص:" : "Filter:")}
                {activeMainTab === "new_arrivals" && (isRtl ? "جديد مسار:" : "New in:")}
              </span>

              <button
                type="button"
                onClick={() => setActiveSubCategory("all")}
                className={`px-3 py-1 rounded-full text-xs font-black shrink-0 transition-all border ${
                  activeSubCategory === "all"
                    ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                    : "bg-muted/60 dark:bg-slate-900 text-muted-foreground dark:text-slate-400 border-border dark:border-slate-800 hover:text-foreground dark:hover:text-white hover:bg-muted dark:hover:bg-slate-800"
                }`}
              >
                {isRtl ? "الكل" : "All"} ({catalog.length})
              </button>

              {courseCategories.map((cat) => (
                <button
                  key={`sub-${cat.id}`}
                  type="button"
                  onClick={() => setActiveSubCategory(cat.id)}
                  className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 transition-all border ${
                    activeSubCategory === cat.id
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                      : "bg-muted/60 dark:bg-slate-900 text-muted-foreground dark:text-slate-400 border-border dark:border-slate-800 hover:text-foreground dark:hover:text-white hover:bg-muted dark:hover:bg-slate-800"
                  }`}
                >
                  {isRtl ? cat.titleAr : cat.titleEn}
                </button>
              ))}
            </div>

          </div>
        </div>

        {/* ========================================================================= */}
        {/* DYNAMIC COURSES RESULTS GRID (INSTANT RESPONSE TO ROW 1 & 2 SELECTIONS)    */}
        {/* ========================================================================= */}
        <section id="courses-results-grid" className="py-8 sm:py-12 px-4 sm:px-6 md:px-12 bg-background dark:bg-slate-950 border-b border-border dark:border-slate-800/80 transition-colors">
          <div className="max-w-7xl mx-auto space-y-6">

            {/* 💰 شريط سياسة أرباح المحاضرين والمدربين */}
            <div className="relative overflow-hidden rounded-2xl border border-purple-500/30 bg-gradient-to-r from-purple-950/40 via-card to-indigo-950/40 dark:from-purple-950/50 dark:via-slate-900/80 dark:to-indigo-950/50 backdrop-blur-md p-3.5 sm:p-4 shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-400/30 flex items-center justify-center shrink-0 shadow-inner">
                    <BadgePercent className="w-5 h-5 text-purple-300" />
                  </div>
                  <p className="text-xs sm:text-[13px] text-foreground leading-relaxed">
                    <strong className="text-purple-600 dark:text-purple-300 font-black">
                      {isRtl ? "نظام أرباح المحاضرين:" : "Instructor Revenue Policy:"}
                    </strong>{" "}
                    {isRtl ? (
                      <>
                        يحصل المحاضر على <span className="text-emerald-600 dark:text-emerald-400 font-black">80%</span> من قيمة دورته للطلاب المسجلين عبر رابط دعوته الخاص (20% للمنصة)، و<span className="text-cyan-600 dark:text-cyan-400 font-black">70%</span> للطلاب المنضمين عبر تسويق المنصة أو التحاقهم بدورات محاضرين آخرين (30% للمنصة)، مع تحمّل المحاضر رسوم بوابات الدفع في الحالتين.
                      </>
                    ) : (
                      <>
                        Instructors receive <span className="text-emerald-600 dark:text-emerald-400 font-black">80%</span> revenue for students enrolled via their direct invite link (20% platform fee), and <span className="text-cyan-600 dark:text-cyan-400 font-black">70%</span> for students joining via platform marketing or enrolling in other instructors' courses (30% platform fee), with payment gateway processing fees borne by the instructor in both cases.
                      </>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-start lg:self-center">
                  <Badge variant="outline" className="text-[11px] font-black border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 px-2.5 py-1 rounded-lg">
                    {isRtl ? "80% دعوة المحاضر" : "80% Direct Invite"}
                  </Badge>
                  <Badge variant="outline" className="text-[11px] font-black border-cyan-500/40 bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 px-2.5 py-1 rounded-lg">
                    {isRtl ? "70% تسويق المنصة" : "70% Platform Marketing"}
                  </Badge>
                  <Badge variant="outline" className="text-[11px] font-bold border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-300 px-2.5 py-1 rounded-lg">
                    {isRtl ? "رسوم الدفع على المحاضر" : "Gateway Fees on Instructor"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Active Referral Token Indicator Banner */}
            {referralInfo.isReferral && (
              <div className="rounded-2xl border-2 border-emerald-500/50 bg-emerald-500/10 p-3.5 flex items-center justify-between gap-3 animate-fade-in shadow-sm">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  <p className="text-xs sm:text-[13px] font-bold text-foreground">
                    {isRtl ? (
                      <>
                        تم تفعيل كود إحالة المحاضر: <span className="font-mono text-emerald-600 dark:text-emerald-400 font-black">{referralInfo.referralToken}</span> — تم تطبيق حصة <span className="text-emerald-600 dark:text-emerald-400 font-black">80%</span> للمحاضر (20% للمنصة).
                      </>
                    ) : (
                      <>
                        Instructor referral active: <span className="font-mono text-emerald-600 dark:text-emerald-400 font-black">{referralInfo.referralToken}</span> — <span className="text-emerald-600 dark:text-emerald-400 font-black">80%</span> instructor share applied (20% platform fee).
                      </>
                    )}
                  </p>
                </div>
                <Badge className="bg-emerald-600 text-white font-black text-xs shrink-0">
                  {isRtl ? "إحالة نشطة (80%)" : "Referral Active (80%)"}
                </Badge>
              </div>
            )}

            {/* Status bar if filtered */}
            {activeSubCategory !== "all" && (
              <div className="flex items-center justify-between pb-2">
                <Badge className="bg-muted/80 dark:bg-slate-900 border border-border dark:border-slate-700 text-foreground dark:text-slate-200 text-xs font-black px-3 py-1">
                  {isRtl ? `${displayedCourses.length} دورة مطابقة للتصفية` : `${displayedCourses.length} Courses`}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveSubCategory("all")}
                  className="text-xs text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 h-8 px-2"
                >
                  {isRtl ? "إلغاء التصفية ✕" : "Clear Filter ✕"}
                </Button>
              </div>
            )}

            {/* Empty State: Waiting for authentic courses or no search match */}
            {displayedCourses.length === 0 ? (
              <div className="text-center py-20 px-4 bg-card/60 dark:bg-slate-900/40 rounded-3xl border border-border dark:border-slate-800 space-y-5 max-w-2xl mx-auto shadow-sm">
                <div className="w-16 h-16 rounded-3xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto shadow-inner">
                  <Video className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl sm:text-2xl font-black text-foreground dark:text-white">
                    {isRtl ? "في انتظار إطلاق الدورات والمحاضرات المعتمدة قريباً" : "Awaiting Official Courses & Lectures"}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground dark:text-slate-400 leading-relaxed">
                    {isRtl
                      ? "تم تنظيف كافة الدورات التجريبية. تخضع المحاضرات والدورات الحقيقية حالياً للمراجعة والاعتماد الأكاديمي، وسيتم نشرها تباعاً من قِبل نخبة الأساتذة والمدربين المعتمدين."
                      : "Mock courses have been cleared. Authentic courses and accredited lectures are currently undergoing academic review and will be published shortly by certified instructors."}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <Link to="/courses/signup?role=lecturer">
                    <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-xs sm:text-sm h-11 px-5 rounded-xl shadow-md gap-2">
                      <BookOpenCheck className="w-4 h-4" />
                      <span>{isRtl ? "انضم كمحاضر معتمد وانشر دورتك" : "Join as Instructor & Publish"}</span>
                    </Button>
                  </Link>
                  {(liveSearchQuery || liveSearchCategory !== "all" || activeSubCategory !== "all") && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setLiveSearchQuery("");
                        setLiveSearchCategory("all");
                        setActiveSubCategory("all");
                        setActiveMainTab("categories");
                      }}
                      className="border-border text-foreground font-bold text-xs h-11 px-4 rounded-xl"
                    >
                      {isRtl ? "إعادة ضبط التصفية" : "Reset Filters"}
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              /* Courses Grid */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {displayedCourses.map((course, idx) => (
                  <Card
                    key={`course-grid-${course.id}-${idx}`}
                    className="relative bg-card dark:bg-slate-900/90 border-2 border-border dark:border-slate-800 hover:border-purple-500/50 rounded-3xl overflow-hidden shadow-md hover:shadow-xl dark:shadow-xl dark:hover:shadow-2xl transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1"
                  >
                    {/* Rank Badge for Bestsellers */}
                    {activeMainTab === "bestsellers" && (
                      <div className="absolute top-3 start-3 z-20">
                        <div className="w-8 h-8 rounded-full bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center shadow-lg border border-amber-300">
                          #{idx + 1}
                        </div>
                      </div>
                    )}

                    {/* Accredited Badge */}
                    {activeMainTab === "accredited" && (
                      <div className="absolute top-3 start-3 z-20">
                        <Badge className="bg-purple-600 text-white font-black text-[10px] shadow-lg">
                          {isRtl ? "شهادة معتمدة QR" : "QR Certified"}
                        </Badge>
                      </div>
                    )}

                    {/* Course Video Thumbnail */}
                    <div className="relative aspect-video w-full overflow-hidden bg-muted dark:bg-slate-950">
                      <img
                        src={course.thumbnail_url}
                        alt={course.title_ar}
                        loading={idx < 4 ? "eager" : "lazy"}
                        decoding="async"
                        fetchPriority={idx < 2 ? "high" : "auto"}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 dark:from-slate-950 dark:via-slate-950/30 to-transparent" />
                      
                      {/* Top End Badge: Free preview available */}
                      <div className="absolute top-3 end-3 z-10">
                        <Badge className="bg-emerald-600/90 text-white font-bold text-[10px] gap-1 shadow-md">
                          <Play className="w-2.5 h-2.5 fill-current" />
                          <span>{isRtl ? "حلقة مجانية 🎬" : "Free Preview"}</span>
                        </Badge>
                      </div>

                      {/* Bottom Start DRM Badge */}
                      <div className="absolute bottom-2.5 start-2.5 flex items-center gap-1 text-[10px] text-purple-200 bg-purple-950/80 px-2 py-0.5 rounded-md font-mono border border-purple-500/30 backdrop-blur-md">
                        <ShieldCheck className="w-3 h-3 text-purple-400" />
                        <span>DRM Protected</span>
                      </div>

                      {/* Bottom End Duration */}
                      <div className="absolute bottom-2.5 end-2.5 text-[10px] text-slate-200 bg-black/70 px-2 py-0.5 rounded-md font-mono border border-white/20">
                        {course.episode_count} {isRtl ? "محاضرة" : "eps"} • {course.duration_hours}h
                      </div>
                    </div>

                    {/* Course Details */}
                    <CardContent className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs text-muted-foreground dark:text-slate-400">
                          <span className="truncate max-w-[140px] font-bold text-purple-600 dark:text-purple-400">
                            {isRtl ? course.category_ar : course.category_en}
                          </span>
                          <span className="flex items-center gap-1 text-amber-500 dark:text-amber-400 font-bold">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span>{course.rating}</span>
                            <span className="text-[10px] text-muted-foreground">({course.reviews_count})</span>
                          </span>
                        </div>

                        <h3 className="font-black text-sm sm:text-base text-foreground dark:text-white line-clamp-2 leading-snug group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                          {isRtl ? course.title_ar : course.title_en}
                        </h3>

                        <div className="flex items-center gap-1.5 pt-1 text-xs text-muted-foreground dark:text-slate-300">
                          <User className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                          <span className="truncate font-semibold">{isRtl ? course.instructor_ar : course.instructor_en}</span>
                        </div>
                      </div>

                      {/* Free Episode Teaser Bar */}
                      <div className="p-2.5 rounded-xl bg-purple-500/10 dark:bg-purple-950/40 border border-purple-500/20 space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-bold text-purple-700 dark:text-purple-300">
                          <span className="flex items-center gap-1">
                            <PlayCircle className="w-3.5 h-3.5 text-purple-600" />
                            <span>{isRtl ? "الحلقة الأولى المجانية:" : "Free Lecture 1:"}</span>
                          </span>
                          <span className="text-[10px] font-mono text-muted-foreground">{course.free_episode_duration}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-1">
                          {isRtl ? course.free_episode_title_ar : course.free_episode_title_en}
                        </p>
                      </div>

                      {/* Card Action Buttons */}
                      <div className="pt-2 space-y-2">
                        <Button
                          type="button"
                          onClick={() => setPreviewCourse(course)}
                          className="w-full h-10 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs gap-1.5 shadow-md shadow-purple-500/20"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>{isRtl ? "مشاهدة الحلقة المجانية 🎬" : "Watch Free Lecture"}</span>
                        </Button>

                        <Button
                          type="button"
                          disabled={checkoutLoading}
                          onClick={() => checkoutCourse({ course })}
                          className="w-full h-9 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs gap-1.5 shadow-md shadow-emerald-500/20"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>{isRtl ? "شراء الدورة والتسجيل الفوري 💳" : "Buy & Enroll Course"}</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* INTERACTIVE VIDEO / EPISODE PREVIEW MODAL DIALOG                          */}
        {/* ========================================================================= */}
        <Dialog open={!!previewCourse} onOpenChange={(open) => !open && setPreviewCourse(null)}>
          <DialogContent className="max-w-2xl bg-card dark:bg-slate-900 border-2 border-border dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5">
            {previewCourse && (
              <>
                <DialogHeader className="space-y-2 text-start">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-400/30 text-xs font-bold">
                      {isRtl ? previewCourse.category_ar : previewCourse.category_en}
                    </Badge>
                    <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-400/30 text-xs font-bold">
                      {isRtl ? "حلقة مجانية متاحة فوراً" : "Free Episode"}
                    </Badge>
                  </div>
                  <DialogTitle className="text-xl sm:text-2xl font-black text-foreground dark:text-white leading-snug">
                    {isRtl ? previewCourse.title_ar : previewCourse.title_en}
                  </DialogTitle>
                  <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
                    {isRtl ? `تقديم: ${previewCourse.instructor_ar} (${previewCourse.instructor_role_ar})` : `By: ${previewCourse.instructor_en}`}
                  </DialogDescription>
                </DialogHeader>

                {/* Simulated High-End DRM Video Player */}
                <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl flex flex-col justify-between p-4 group">
                  <img
                    src={previewCourse.thumbnail_url}
                    alt={previewCourse.title_ar}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 w-full h-full object-cover opacity-35"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                  
                  {/* Top Bar Watermark Simulation */}
                  <div className="relative z-10 flex items-center justify-between text-[11px] text-slate-300">
                    <span className="flex items-center gap-1.5 bg-black/60 px-2 py-0.5 rounded-md border border-white/10 font-mono">
                      <Lock className="w-3 h-3 text-purple-400" />
                      <span>UNIGATES DRM ENCRYPTED</span>
                    </span>
                    <span className="text-[10px] font-mono text-purple-300/80 bg-black/60 px-2 py-0.5 rounded-md border border-white/10">
                      ID: {previewCourse.id}-PREVIEW
                    </span>
                  </div>

                  {/* Big Play Button in Center */}
                  <div className="relative z-10 flex flex-col items-center justify-center my-auto space-y-2">
                    <div className="w-16 h-16 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center shadow-xl shadow-purple-600/40 cursor-pointer transform hover:scale-110 transition-transform">
                      <Play className="w-8 h-8 fill-current ms-1" />
                    </div>
                    <p className="text-xs font-bold text-white bg-black/60 px-3 py-1 rounded-full border border-white/15">
                      {isRtl ? `مشاهدة: ${previewCourse.free_episode_title_ar}` : previewCourse.free_episode_title_en}
                    </p>
                  </div>

                  {/* Player Controls Bar */}
                  <div className="relative z-10 flex items-center justify-between text-xs text-slate-300 bg-black/70 backdrop-blur-md p-2 rounded-xl border border-white/10">
                    <div className="flex items-center gap-2">
                      <Play className="w-4 h-4 fill-current text-purple-400" />
                      <span className="font-mono text-[11px]">00:00 / {previewCourse.free_episode_duration}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-slate-400" />
                      <span className="text-[10px] bg-purple-600/30 text-purple-300 px-1.5 py-0.5 rounded font-mono">1080p DRM</span>
                    </div>
                  </div>
                </div>

                {/* Course Outline & Value Proposition */}
                <div className="p-4 rounded-2xl bg-muted/60 dark:bg-slate-950/60 border border-border dark:border-slate-800 space-y-2 text-xs sm:text-sm">
                  <div className="flex items-center gap-2 font-black text-foreground">
                    <Award className="w-4 h-4 text-purple-500" />
                    <span>{isRtl ? "ماذا ستحصل عند التسجيل في الدورة كاملة؟" : "What is included in the full course?"}</span>
                  </div>
                  <ul className="space-y-1.5 text-muted-foreground list-disc list-inside">
                    <li>{isRtl ? `وصول كامل إلى جميع المحاضرات (${previewCourse.episode_count} محاضرة • ${previewCourse.duration_hours} ساعة).` : `Full access to all ${previewCourse.episode_count} lectures.`}</li>
                    <li>{isRtl ? "شهادة إتمام رسمية برمز استجابة سريعة QR قابل للتحقق عالمياً." : "Official certificate with verifiable QR verification."}</li>
                    <li>{isRtl ? "اختبارات وتطبيقات عملية بعد كل وحدة ونماذج مشاريع تخرج." : "Hands-on quizzes and practical assignments."}</li>
                    <li>{isRtl ? "مساحة نقاش وسؤال وجواب مباشرة مع المحاضر." : "Direct Q&A community with the lecturer."}</li>
                  </ul>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                  <Button
                    disabled={checkoutLoading}
                    onClick={() => checkoutCourse({ course: previewCourse })}
                    className="w-full sm:flex-1 h-11 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-sm gap-2 shadow-lg shadow-emerald-500/25"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>{isRtl ? "شراء الدورة كاملة عبر Paddle 💳" : "Purchase Course via Paddle"}</span>
                  </Button>
                  <Link to="/courses/signup?role=personal" className="w-full sm:w-auto">
                    <Button variant="outline" className="w-full h-11 px-5 rounded-xl border-border font-bold text-xs gap-1.5">
                      <GraduationCap className="w-4 h-4" />
                      <span>{isRtl ? "إنشاء حساب طالب" : "Create Account"}</span>
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    onClick={() => setPreviewCourse(null)}
                    className="w-full sm:w-auto h-11 px-5 rounded-xl border-border"
                  >
                    {isRtl ? "إغلاق" : "Close"}
                  </Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Global Footer */}
        <SiteFooter />
      </div>
    </PlatformUnderDevelopmentOverlay>
  );
};

export default CoursesPlatform;
