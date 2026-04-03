import { useRef, useState, memo } from "react";
import { Clock as ClockIcon } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePopularCourses, useNewCourses, useFreeCourses, type Course } from "@/hooks/useCourses";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const categoryColors: Record<string, string> = {
  "برمجة": "from-teal-800 to-teal-600",
  "تصميم": "from-pink-800 to-pink-600",
  "تسويق": "from-amber-800 to-amber-600",
  "إدارة": "from-blue-800 to-blue-600",
  "تقنية": "from-cyan-800 to-cyan-600",
  "بيانات": "from-emerald-800 to-emerald-600",
  "إبداع": "from-purple-800 to-purple-600",
  "Programming": "from-teal-800 to-teal-600",
  "Design": "from-pink-800 to-pink-600",
  "Marketing": "from-amber-800 to-amber-600",
  "Management": "from-blue-800 to-blue-600",
  "Technology": "from-cyan-800 to-cyan-600",
  "Data": "from-emerald-800 to-emerald-600",
  "Creative": "from-purple-800 to-purple-600",
};

const TrendingCourses = memo(() => {
  const [filter, setFilter] = useState("popular");
  const { t, language } = useLanguage();
  const scrollRef = useRef<HTMLDivElement>(null);
  const { ref: animRef, isVisible } = useScrollAnimation();
  const popular = usePopularCourses();
  const newest = useNewCourses();
  const free = useFreeCourses();

  const queryMap = { popular, new: newest, free };
  const current = queryMap[filter as keyof typeof queryMap];
  const courses = current.data || [];
  const loading = current.isLoading;

  const hasAnyCourses = (popular.data?.length || 0) + (newest.data?.length || 0) + (free.data?.length || 0) > 0;

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = 260;
    const dir = language === "ar"
      ? (direction === "left" ? scrollAmount : -scrollAmount)
      : (direction === "left" ? -scrollAmount : scrollAmount);
    scrollRef.current.scrollBy({ left: dir, behavior: "smooth" });
  };

  const getTitle = (course: Course) => language === "ar" ? course.title_ar : course.title_en;
  const getInstructor = (course: Course) => language === "ar" ? course.instructor_ar : course.instructor_en;
  const getCategory = (course: Course) => language === "ar" ? course.category_ar : course.category_en;

  return (
    <section className="py-12 md:py-20 px-6 md:px-12">
      <div className="max-w-full mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">📚 {t.trending.title}</h2>

        {!hasAnyCourses && !loading ? (
          <div className="flex justify-center">
            <div className="bg-card rounded-xl p-8 border-2 border-dashed border-border shadow-sm w-full max-w-sm text-center">
              <ClockIcon className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-xl font-bold text-muted-foreground">
                {language === "ar" ? "قريباً" : "Coming Soon"}
              </p>
            </div>
          </div>
        ) : (
          <>
            <Tabs value={filter} onValueChange={setFilter} className="mb-6">
              <TabsList className="bg-muted/50 p-1 rounded-xl">
                <TabsTrigger value="popular" className="rounded-lg text-sm">{t.trending.mostViewed}</TabsTrigger>
                <TabsTrigger value="new" className="rounded-lg text-sm">{t.trending.new}</TabsTrigger>
                <TabsTrigger value="free" className="rounded-lg text-sm">{t.trending.free}</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="relative flex items-center gap-2">
              <button
                onClick={() => scroll("left")}
                className="absolute -left-5 z-10 w-9 h-9 rounded-full border border-border bg-background/90 backdrop-blur-sm flex items-center justify-center hover:bg-accent transition-colors shadow-md"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-5 h-5 text-foreground" />
              </button>

              <div ref={scrollRef} className="flex gap-3 overflow-x-auto pb-4 px-2" style={{ scrollbarWidth: 'none' }}>
                {courses.map((course) => (
                  <div key={course.id} className="relative flex-shrink-0 w-[200px] md:w-[240px] group cursor-pointer card-hover">
                    <div className={`aspect-video rounded-lg bg-gradient-to-br ${categoryColors[getCategory(course)] || "from-slate-800 to-slate-600"} flex flex-col justify-between p-4 relative overflow-hidden`}>
                      <div className="flex justify-between items-start relative z-10">
                        <Badge className="bg-background/80 text-foreground text-xs backdrop-blur-sm hover:bg-background/80">
                          {getCategory(course)}
                        </Badge>
                        {course.is_free && (
                          <Badge className="bg-primary/90 text-primary-foreground text-xs backdrop-blur-sm">
                            {language === "ar" ? "مجاني" : "Free"}
                          </Badge>
                        )}
                      </div>
                      <div className="relative z-10">
                        <p className="text-sm font-bold text-white leading-snug mb-2 line-clamp-2">
                          {getTitle(course)}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-white/80">{getInstructor(course)}</span>
                          <span className="flex items-center gap-1 text-xs text-white/70">
                            <Play className="w-3 h-3" /> {course.episode_count}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => scroll("right")}
                className="absolute -right-5 z-10 w-9 h-9 rounded-full border border-border bg-background/90 backdrop-blur-sm flex items-center justify-center hover:bg-accent transition-colors shadow-md"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-5 h-5 text-foreground" />
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
});

TrendingCourses.displayName = "TrendingCourses";

export default TrendingCourses;
