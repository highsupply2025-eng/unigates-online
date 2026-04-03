import { useRef, useState, memo } from "react";
import { Link } from "react-router-dom";
import { Clock as ClockIcon } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePopularCourses, useNewCourses, useFreeCourses, type Course } from "@/hooks/useCourses";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

import courseBg1 from "@/assets/course-bg-1.jpg";
import courseBg2 from "@/assets/course-bg-2.jpg";

const courseImages = [courseBg1, courseBg2];

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
    const scrollAmount = 280;
    const dir = language === "ar"
      ? (direction === "left" ? scrollAmount : -scrollAmount)
      : (direction === "left" ? -scrollAmount : scrollAmount);
    scrollRef.current.scrollBy({ left: dir, behavior: "smooth" });
  };

  const getTitle = (course: Course) => language === "ar" ? course.title_ar : course.title_en;
  const getInstructor = (course: Course) => language === "ar" ? course.instructor_ar : course.instructor_en;
  const getCategory = (course: Course) => language === "ar" ? course.category_ar : course.category_en;

  return (
    <section ref={animRef} className={`py-6 md:py-10 px-6 md:px-12 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
      <div className="max-w-full mx-auto">
        <Link to="/courses" className="text-2xl md:text-3xl font-bold mb-4 text-primary hover:opacity-80 transition-opacity block">📚 {language === "ar" ? "الدورات" : "Courses"}</Link>

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

            <div className="relative flex items-center gap-2">
              <button
                onClick={() => scroll("left")}
                className="absolute -left-5 z-10 w-9 h-9 rounded-full border border-border bg-background/90 backdrop-blur-sm flex items-center justify-center hover:bg-accent transition-colors shadow-md"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-5 h-5 text-foreground" />
              </button>

              <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-4 px-2" style={{ scrollbarWidth: 'none' }}>
                {courses.map((course, i) => (
                  <div key={course.id} className="relative flex-shrink-0 w-[220px] md:w-[260px] group cursor-pointer card-hover">
                    <div className="aspect-video rounded-xl overflow-hidden relative shadow-lg group-hover:shadow-xl transition-shadow">
                      <img
                        src={course.thumbnail_url || courseImages[i % courseImages.length]}
                        alt={getTitle(course)}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                      <div className="flex justify-between items-start absolute top-3 left-3 right-3 z-10">
                        <Badge className="bg-background/80 text-foreground text-xs backdrop-blur-sm hover:bg-background/80">
                          {getCategory(course)}
                        </Badge>
                        {course.is_free && (
                          <Badge className="bg-primary/90 text-primary-foreground text-xs backdrop-blur-sm">
                            {language === "ar" ? "مجاني" : "Free"}
                          </Badge>
                        )}
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
                        <p className="text-sm font-bold text-white leading-snug mb-2 line-clamp-2">
                          {getTitle(course)}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-white/90">{getInstructor(course)}</span>
                          <span className="flex items-center gap-1 text-xs text-white/80">
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
