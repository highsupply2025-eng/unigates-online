import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";

const episodeCounts = [24, 18, 15, 30, 12, 20, 16, 10];

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
  const { t } = useLanguage();

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

        <div className="flex gap-3 overflow-x-auto pb-4" style={{ scrollbarWidth: 'none' }}>
          {t.trending.courses.map((course, i) => (
            <div key={i} className="relative flex-shrink-0 w-[200px] md:w-[240px] group cursor-pointer card-hover">
              <div className={`aspect-[3/4] rounded-lg bg-gradient-to-br ${categoryColors[course.category] || "from-slate-800 to-slate-600"} flex flex-col justify-between p-4 relative overflow-hidden`}>
                <div className="flex justify-between items-start">
                  <Badge className="bg-background/80 text-foreground text-xs backdrop-blur-sm hover:bg-background/80">
                    {course.category}
                  </Badge>
                  <div className="w-10 h-10 rounded-full bg-background/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="w-5 h-5 text-foreground fill-foreground" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground leading-snug mb-2">{course.title}</p>
                  <p className="text-xs text-foreground/70 mb-1">{course.instructor}</p>
                  <div className="flex items-center gap-1 text-xs text-foreground/60">
                    <Clock className="w-3 h-3" />
                    <span>{episodeCounts[i]} {t.trending.episode}</span>
                  </div>
                </div>
              </div>
              <span className="absolute -right-1 -bottom-3 text-6xl md:text-7xl font-black text-foreground/10 leading-none select-none">
                {i + 1}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrendingCourses;
