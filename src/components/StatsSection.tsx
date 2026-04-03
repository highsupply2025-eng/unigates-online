import { Users, GraduationCap, Landmark, School, BookCopy, UserCheck } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePlatformStats } from "@/hooks/usePlatformStats";
import { useCountUp } from "@/hooks/useCountUp";

const StatsSection = () => {
  const { language } = useLanguage();
  const { data: stats } = usePlatformStats();

  const colleges = useCountUp(stats?.colleges ?? 0);
  const institutes = useCountUp(stats?.institutes ?? 0);
  const schools = useCountUp(stats?.schools ?? 0);
  const publishers = useCountUp(stats?.publishers ?? 0);
  const lecturers = useCountUp(stats?.lecturers ?? 0);
  const teachers = useCountUp(stats?.teachers ?? 0);
  const parents = useCountUp(stats?.parents ?? 0);
  const students = useCountUp(stats?.students ?? 0);

  const items = [
    { icon: Landmark, counter: colleges, label: language === "ar" ? "كلية" : "College", gradient: "from-amber-400 to-orange-500" },
    { icon: Landmark, counter: institutes, label: language === "ar" ? "معهد" : "Institute", gradient: "from-emerald-400 to-teal-500" },
    { icon: School, counter: schools, label: language === "ar" ? "مدرسة" : "School", gradient: "from-blue-400 to-cyan-500" },
    { icon: BookCopy, counter: publishers, label: language === "ar" ? "ناشر" : "Publisher", gradient: "from-pink-400 to-rose-500" },
    { icon: GraduationCap, counter: lecturers, label: language === "ar" ? "محاضر" : "Lecturer", gradient: "from-violet-400 to-purple-500" },
    { icon: GraduationCap, counter: teachers, label: language === "ar" ? "معلم" : "Teacher", gradient: "from-teal-400 to-green-500" },
    { icon: UserCheck, counter: parents, label: language === "ar" ? "ولي أمر" : "Parent", gradient: "from-sky-400 to-blue-500" },
    { icon: Users, counter: students, label: language === "ar" ? "طالب" : "Student", gradient: "from-indigo-400 to-blue-500" },
  ];

  return (
    <section className="px-4 md:px-12">
      <div className="max-w-5xl mx-auto grid grid-cols-4 md:grid-cols-8 gap-2 md:gap-3">
        {items.map((item, i) => (
          <div
            key={i}
            ref={item.counter.ref}
            className="flex flex-col items-center gap-1.5 text-white px-1 py-4 animate-fade-in bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 hover:bg-white/20 transition-all duration-300 shadow-lg"
          >
            <div className={`w-11 h-11 md:w-13 md:h-13 rounded-full bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-lg shadow-black/20 ring-2 ring-white/30`}>
              <item.icon className="w-5 h-5 md:w-6 md:h-6 text-white drop-shadow-md" />
            </div>
            <span className="text-xl md:text-2xl font-black drop-shadow-md">{item.counter.count}</span>
            <span className="text-[10px] md:text-xs font-bold opacity-95 text-center leading-tight">{item.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default StatsSection;
