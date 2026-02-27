import { useRef, useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

interface Course {
  id: string;
  title_ar: string;
  title_en: string;
  instructor_ar: string;
  instructor_en: string;
  category_ar: string;
  category_en: string;
  episode_count: number;
  is_free: boolean;
}

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

const TrendingCourses = () => {
  const [filter, setFilter] = useState("popular");
  const { t, language } = useLanguage();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses(filter);
  }, [filter]);

  const fetchCourses = async (tab: string) => {
    setLoading(true);
    try {
      if (tab === "popular") {
        // Get weekly top courses
        const weekStart = getWeekStart();
        const { data: topData } = await supabase
          .from("weekly_top_courses")
          .select("course_id, view_count")
          .eq("week_start", weekStart.toISOString())
          .order("view_count", { ascending: false })
          .limit(30);

        if (topData && topData.length > 0) {
          const courseIds = topData.map((t) => t.course_id);
          const { data: coursesData } = await supabase
            .from("courses")
            .select("*")
            .in("id", courseIds);

          // Sort by view_count order
          const ordered = courseIds
            .map((id) => coursesData?.find((c) => c.id === id))
            .filter(Boolean) as Course[];
          setCourses(ordered);
        } else {
          // Fallback: get most viewed all-time
          const { data: viewData } = await supabase
            .from("course_views")
            .select("course_id")
            .order("viewed_at", { ascending: false })
            .limit(200);

          if (viewData && viewData.length > 0) {
            const countMap: Record<string, number> = {};
            viewData.forEach((v) => {
              countMap[v.course_id] = (countMap[v.course_id] || 0) + 1;
            });
            const sorted = Object.entries(countMap)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 30)
              .map(([id]) => id);

            const { data: coursesData } = await supabase
              .from("courses")
              .select("*")
              .in("id", sorted);

            const ordered = sorted
              .map((id) => coursesData?.find((c) => c.id === id))
              .filter(Boolean) as Course[];
            setCourses(ordered);
          } else {
            // No views at all, show latest courses
            const { data } = await supabase
              .from("courses")
              .select("*")
              .order("created_at", { ascending: false })
              .limit(30);
            setCourses(data || []);
          }
        }
      } else if (tab === "new") {
        const { data } = await supabase
          .from("courses")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(30);
        setCourses(data || []);
      } else if (tab === "free") {
        const { data } = await supabase
          .from("courses")
          .select("*")
          .eq("is_free", true)
          .order("created_at", { ascending: false });
        setCourses(data || []);
      }
    } catch (err) {
      console.error("Error fetching courses:", err);
    } finally {
      setLoading(false);
    }
  };

  const getWeekStart = () => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const weekStart = new Date(now.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
  };

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
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">{t.trending.title}</h2>
        <Tabs value={filter} onValueChange={setFilter} className="mb-8">
          <TabsList className="bg-transparent border border-border p-0 h-auto">
            <TabsTrigger value="popular" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-none px-4 py-2 text-sm">
              {t.trending.mostViewed}
            </TabsTrigger>
            <TabsTrigger value="new" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-none px-4 py-2 text-sm">
              {t.trending.new}
            </TabsTrigger>
            <TabsTrigger value="free" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-none px-4 py-2 text-sm">
              {t.trending.free}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {loading ? (
          <div className="flex gap-3 overflow-hidden pb-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex-shrink-0 w-[200px] md:w-[240px] aspect-[3/4] rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <p className="text-muted-foreground text-center py-12">{t.trending.noCourses}</p>
        ) : (
          <div className="relative flex items-center gap-2">
            <button
              onClick={() => scroll("left")}
              className="absolute -left-5 z-10 w-9 h-9 rounded-full border border-border bg-background/90 backdrop-blur-sm flex items-center justify-center hover:bg-accent transition-colors shadow-md"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>

            <div ref={scrollRef} className="flex gap-3 overflow-x-auto pb-4 px-2" style={{ scrollbarWidth: 'none' }}>
              {courses.map((course, i) => (
                <div key={course.id} className="relative flex-shrink-0 w-[200px] md:w-[240px] group cursor-pointer card-hover">
                  <div className={`aspect-[3/4] rounded-lg bg-gradient-to-br ${categoryColors[getCategory(course)] || "from-slate-800 to-slate-600"} flex flex-col justify-between p-4 relative overflow-hidden`}>
                    <div className="flex justify-between items-start">
                      <Badge className="bg-background/80 text-foreground text-xs backdrop-blur-sm hover:bg-background/80">
                        {getCategory(course)}
                      </Badge>
                      <div className="w-10 h-10 rounded-full bg-background/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="w-5 h-5 text-foreground fill-foreground" />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground leading-snug mb-2">{getTitle(course)}</p>
                      <p className="text-xs text-foreground/70 mb-1">{getInstructor(course)}</p>
                      <div className="flex items-center gap-1 text-xs text-foreground/60">
                        <Clock className="w-3 h-3" />
                        <span>{course.episode_count} {t.trending.episode}</span>
                      </div>
                    </div>
                  </div>
                  <span className="absolute -right-1 -bottom-3 text-6xl md:text-7xl font-black text-foreground/10 leading-none select-none">
                    {i + 1}
                  </span>
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
        )}
      </div>
    </section>
  );
};

export default TrendingCourses;
