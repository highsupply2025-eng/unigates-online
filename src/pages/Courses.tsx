import { useState } from "react";
import { Link } from "react-router-dom";
import { GraduationCap, Globe, Play, Clock, Lock, ChevronDown, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

const Courses = () => {
  const { t, dir, language, toggleLanguage } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const courses = t.trending.courses;
  const categories = [...new Set(courses.map((c) => c.category))];

  const filteredCourses = selectedCategory
    ? courses.filter((c) => c.category === selectedCategory)
    : courses;

  return (
    <div className="min-h-screen bg-background text-foreground" dir={dir}>
      {/* Header */}
      <header className="border-b border-border px-6 md:px-12 py-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center group-hover:bg-primary/90 transition-colors">
              <GraduationCap className="w-7 h-7 text-primary-foreground" />
            </div>
            <span className="text-2xl md:text-3xl font-black text-foreground tracking-tight">
              {t.brandName}
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Button variant="default" size="sm" onClick={toggleLanguage} className="font-semibold gap-1.5">
              <Globe className="w-4 h-4" />
              {t.langSwitch}
            </Button>
            <Link to="/login">
              <Button variant="default" size="sm" className="font-semibold px-6 h-10 text-base">
                {t.login}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 md:px-12 py-10">
        {/* Title + Category Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-foreground mb-1">{t.coursesPage.title}</h1>
            <p className="text-muted-foreground">{t.coursesPage.subtitle}</p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 min-w-[180px] justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  {selectedCategory || t.coursesPage.allCategories}
                </div>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[180px]">
              <DropdownMenuItem onClick={() => setSelectedCategory(null)} className="font-semibold">
                {t.coursesPage.allCategories}
              </DropdownMenuItem>
              {categories.map((cat) => (
                <DropdownMenuItem key={cat} onClick={() => setSelectedCategory(cat)}>
                  {cat}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredCourses.map((course, i) => {
            const originalIndex = courses.indexOf(course);
            const episodes = episodeCounts[originalIndex] || 10;

            return (
              <div key={i} className="bg-card rounded-xl border border-border overflow-hidden card-hover group cursor-pointer">
                {/* Course Cover */}
                <div className={`aspect-[16/10] bg-gradient-to-br ${categoryColors[course.category] || "from-slate-800 to-slate-600"} relative flex items-center justify-center`}>
                  <div className="w-14 h-14 rounded-full bg-background/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="w-7 h-7 text-foreground fill-foreground" />
                  </div>
                  <Badge className="absolute top-3 start-3 bg-background/80 text-foreground text-xs backdrop-blur-sm hover:bg-background/80">
                    {course.category}
                  </Badge>
                </div>

                {/* Course Info */}
                <div className="p-4 space-y-3">
                  <h3 className="font-bold text-foreground leading-snug line-clamp-2">{course.title}</h3>
                  <p className="text-sm text-muted-foreground">{course.instructor}</p>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{episodes} {t.trending.episode}</span>
                    </div>
                  </div>

                  {/* Episodes List */}
                  <div className="border-t border-border pt-3 space-y-2">
                    <p className="text-xs font-bold text-foreground">{t.coursesPage.episodes}</p>

                    {/* Free Episode */}
                    <div className="flex items-center gap-3 p-2.5 rounded-lg bg-primary/5 border border-primary/20">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <Play className="w-3.5 h-3.5 text-primary-foreground fill-primary-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{t.coursesPage.episode} 1</p>
                        <p className="text-xs text-primary font-medium">{t.coursesPage.freeEpisode}</p>
                      </div>
                    </div>

                    {/* Locked Episodes */}
                    {[2, 3].map((ep) => (
                      <div key={ep} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50 opacity-60">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                          <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-muted-foreground truncate">{t.coursesPage.episode} {ep}</p>
                          <p className="text-xs text-muted-foreground">{t.coursesPage.lockedEpisode}</p>
                        </div>
                      </div>
                    ))}

                    {episodes > 3 && (
                      <p className="text-xs text-muted-foreground text-center pt-1">
                        +{episodes - 3} {t.coursesPage.moreEpisodes}
                      </p>
                    )}
                  </div>

                  <Link to="/signup">
                    <Button variant="default" size="sm" className="w-full font-semibold mt-2">
                      {t.coursesPage.subscribeToWatch}
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-secondary/50 px-6 py-8 mt-12">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">{t.copyright}</p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors">Twitter</a>
            <a href="#" className="hover:text-primary transition-colors">YouTube</a>
            <a href="#" className="hover:text-primary transition-colors">Instagram</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Courses;
