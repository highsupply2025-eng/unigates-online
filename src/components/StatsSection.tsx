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
    { icon: Landmark, counter: colleges, label: language === "ar" ? "كلية" : "College" },
    { icon: Landmark, counter: institutes, label: language === "ar" ? "معهد" : "Institute" },
    { icon: School, counter: schools, label: language === "ar" ? "مدرسة" : "School" },
    { icon: BookCopy, counter: publishers, label: language === "ar" ? "ناشر" : "Publisher" },
    { icon: GraduationCap, counter: lecturers, label: language === "ar" ? "محاضر" : "Lecturer" },
    { icon: GraduationCap, counter: teachers, label: language === "ar" ? "معلم" : "Teacher" },
    { icon: UserCheck, counter: parents, label: language === "ar" ? "ولي أمر" : "Parent" },
    { icon: Users, counter: students, label: language === "ar" ? "طالب" : "Student" },
  ];

  return (
    <section className="px-4 sm:px-6 md:px-12">
      <div className="max-w-5xl mx-auto bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl shadow-black/10 px-4 sm:px-6 py-5 sm:py-6">
        <div className="grid grid-cols-4 md:grid-cols-8 gap-3 sm:gap-4">
          {items.map((item, i) => (
            <div
              key={i}
              ref={item.counter.ref}
              className="flex flex-col items-center gap-1.5 text-white animate-fade-in"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-xl bg-white/15 flex items-center justify-center">
                <item.icon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
              </div>
              <span className="text-lg sm:text-xl md:text-2xl font-black">{item.counter.count}</span>
              <span className="text-[10px] sm:text-xs font-semibold opacity-90 text-center leading-tight">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
