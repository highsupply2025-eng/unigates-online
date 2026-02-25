import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const courses = [
  { title: "أساسيات البرمجة بلغة Python", episodes: 24, instructor: "أ. محمد العلي", category: "برمجة", rank: 1 },
  { title: "تصميم واجهات المستخدم UI/UX", episodes: 18, instructor: "أ. سارة أحمد", category: "تصميم", rank: 2 },
  { title: "التسويق الرقمي من الصفر", episodes: 15, instructor: "أ. خالد الحربي", category: "تسويق", rank: 3 },
  { title: "تطوير تطبيقات الموبايل", episodes: 30, instructor: "أ. فهد السعيد", category: "برمجة", rank: 4 },
  { title: "إدارة المشاريع الاحترافية", episodes: 12, instructor: "أ. نورة الدوسري", category: "إدارة", rank: 5 },
  { title: "الذكاء الاصطناعي للمبتدئين", episodes: 20, instructor: "د. عبدالله الشمري", category: "تقنية", rank: 6 },
  { title: "تحليل البيانات مع Excel", episodes: 16, instructor: "أ. ريم القحطاني", category: "بيانات", rank: 7 },
  { title: "التصوير الفوتوغرافي", episodes: 10, instructor: "أ. ياسر المطيري", category: "إبداع", rank: 8 },
];

const categoryColors: Record<string, string> = {
  "برمجة": "from-teal-800 to-teal-600",
  "تصميم": "from-pink-800 to-pink-600",
  "تسويق": "from-amber-800 to-amber-600",
  "إدارة": "from-blue-800 to-blue-600",
  "تقنية": "from-cyan-800 to-cyan-600",
  "بيانات": "from-emerald-800 to-emerald-600",
  "إبداع": "from-purple-800 to-purple-600",
};

const TrendingCourses = () => {
  const [filter, setFilter] = useState("popular");

  return (
    <section className="py-12 md:py-20 px-6 md:px-12">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">🔥 الدورات الرائجة</h2>
        <Tabs value={filter} onValueChange={setFilter} className="mb-8">
          <TabsList className="bg-transparent border border-border p-0 h-auto">
            <TabsTrigger value="popular" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-none px-4 py-2 text-sm">
              الأكثر مشاهدة
            </TabsTrigger>
            <TabsTrigger value="new" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-none px-4 py-2 text-sm">
              جديد
            </TabsTrigger>
            <TabsTrigger value="free" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-none px-4 py-2 text-sm">
              مجاني
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex gap-3 overflow-x-auto pb-4" style={{ scrollbarWidth: 'none' }}>
          {courses.map((course) => (
            <div key={course.rank} className="relative flex-shrink-0 w-[200px] md:w-[240px] group cursor-pointer card-hover">
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
                    <span>{course.episodes} حلقة</span>
                  </div>
                </div>
              </div>
              <span className="absolute -right-1 -bottom-3 text-6xl md:text-7xl font-black text-foreground/10 leading-none select-none">
                {course.rank}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrendingCourses;
