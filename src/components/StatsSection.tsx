import { Users, GraduationCap, Landmark, School, BookCopy, UserCheck, Sparkles } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePlatformStats } from "@/hooks/usePlatformStats";
import { useCountUp } from "@/hooks/useCountUp";

const StatsSection = () => {
  const { language, dir } = useLanguage();
  const isRtl = dir === "rtl";
  const { data: stats } = usePlatformStats();
  const { data: uniStats } = usePlatformStats("university");

  // Authoritative counters
  const colleges = useCountUp(uniStats?.colleges ?? stats?.colleges ?? 0);
  const institutes = useCountUp(uniStats?.institutes ?? stats?.institutes ?? 0);
  const schools = useCountUp(stats?.schools ?? 0);
  const publishers = useCountUp(stats?.publishers ?? 0);
  const lecturers = useCountUp(uniStats?.lecturers ?? stats?.lecturers ?? 0);
  const teachers = useCountUp(stats?.teachers ?? 0);
  const parents = useCountUp(stats?.parents ?? 0);
  const students = useCountUp(uniStats?.students ?? uniStats?.universityStudents ?? stats?.students ?? 0);

  // Order: كلية - معهد - مدرسة - ناشر - محاضر - معلم - ولى أمر - طالب
  const items = [
    { icon: Landmark, counter: colleges, label: language === "ar" ? "كلية" : "College", color: "from-blue-500 to-indigo-600" },
    { icon: Landmark, counter: institutes, label: language === "ar" ? "معهد" : "Institute", color: "from-indigo-500 to-violet-600" },
    { icon: School, counter: schools, label: language === "ar" ? "مدرسة" : "School", color: "from-emerald-500 to-teal-600" },
    { icon: BookCopy, counter: publishers, label: language === "ar" ? "ناشر" : "Publisher", color: "from-amber-500 to-orange-600" },
    { icon: GraduationCap, counter: lecturers, label: language === "ar" ? "محاضر" : "Lecturer", color: "from-cyan-500 to-blue-600" },
    { icon: GraduationCap, counter: teachers, label: language === "ar" ? "معلم" : "Teacher", color: "from-teal-500 to-emerald-600" },
    { icon: UserCheck, counter: parents, label: language === "ar" ? "ولي أمر" : "Parent", color: "from-purple-500 to-pink-600" },
    { icon: Users, counter: students, label: language === "ar" ? "طالب" : "Student", color: "from-rose-500 to-red-600" },
  ];

  return (
    <section className="relative z-20 -mt-8 sm:-mt-12 max-w-6xl mx-auto px-3 sm:px-6">
      <div className="rounded-3xl border-2 border-white/20 dark:border-border/60 bg-card/90 backdrop-blur-2xl shadow-2xl shadow-black/20 p-4 sm:p-6">
        <div className="grid grid-cols-4 md:grid-cols-8 gap-2 sm:gap-3">
          {items.map((item, i) => (
            <div
              key={i}
              ref={item.counter.ref}
              className="flex flex-col items-center gap-1.5 p-2 sm:p-3 rounded-2xl bg-muted/40 hover:bg-muted/70 transition-all duration-300 group cursor-default text-center"
            >
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform`}>
                <item.icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className="text-base sm:text-xl md:text-2xl font-black text-foreground tracking-tight">
                {item.counter.count}
              </span>
              <span className="text-[10px] sm:text-xs font-bold text-muted-foreground line-clamp-1">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
