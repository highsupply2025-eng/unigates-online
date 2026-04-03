import { Users, GraduationCap, Landmark, School, BookCopy, UserCheck, Presentation } from "lucide-react";
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

  // Order: كلية - معهد - مدرسة - ناشر - محاضر - معلم - ولى أمر - طالب
  const items = [
    { icon: Landmark, counter: colleges, label: language === "ar" ? "كلية" : "College" },
    { icon: Landmark, counter: institutes, label: language === "ar" ? "معهد" : "Institute" },
    { icon: School, counter: schools, label: language === "ar" ? "مدرسة" : "School" },
    { icon: BookCopy, counter: publishers, label: language === "ar" ? "ناشر" : "Publisher" },
    { icon: GraduationCap, counter: lecturers, label: language === "ar" ? "محاضر" : "Lecturer" },
    { icon: Presentation, counter: teachers, label: language === "ar" ? "معلم" : "Teacher" },
    { icon: UserCheck, counter: parents, label: language === "ar" ? "ولي أمر" : "Parent" },
    { icon: Users, counter: students, label: language === "ar" ? "طالب" : "Student" },
  ];

  return (
    <section className="px-4 md:px-12">
      <div className="max-w-5xl mx-auto grid grid-cols-4 md:grid-cols-8 gap-2 md:gap-3">
        {items.map((item, i) => (
          <div
            key={i}
            ref={item.counter.ref}
            className="flex flex-col items-center gap-1.5 text-white px-1 py-3 animate-fade-in"
          >
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg shadow-black/10">
              <item.icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <span className="text-lg md:text-2xl font-black">{item.counter.count}</span>
            <span className="text-[10px] md:text-xs font-semibold opacity-90 text-center leading-tight">{item.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default StatsSection;
