import { useRef, useState, memo } from "react";
import { Clock as ClockIcon } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePopularCourses, useNewCourses, useFreeCourses, type Course } from "@/hooks/useCourses";

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

  const popular = usePopularCourses();
  const newest = useNewCourses();
  const free = useFreeCourses();

  const queryMap = { popular, new: newest, free };
  const current = queryMap[filter as keyof typeof queryMap];
  const courses = current.data || [];
  const loading = current.isLoading;

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
        <div className="flex justify-center">
          <div className="bg-card rounded-xl p-8 border-2 border-dashed border-border shadow-sm w-full max-w-sm text-center">
            <ClockIcon className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-xl font-bold text-muted-foreground">
              {language === "ar" ? "قريباً" : "Coming Soon"}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
});

TrendingCourses.displayName = "TrendingCourses";

export default TrendingCourses;
