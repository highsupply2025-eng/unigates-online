import {
  Landmark,
  School,
  BookOpen,
  BookMarked,
  BookCopy,
  Building2,
  GraduationCap,
  Users,
  Languages,
  PenTool,
  Briefcase,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePlatformStats } from "@/hooks/usePlatformStats";
import { useAllCourses } from "@/hooks/useCourses";
import { useBooks } from "@/hooks/useBooks";
import { useCountUp } from "@/hooks/useCountUp";
import { useMemo } from "react";

const StatsSection = () => {
  const { language } = useLanguage();
  const { data: stats } = usePlatformStats();
  const { data: uniStats } = usePlatformStats("university");
  const { data: coursesData } = useAllCourses();
  const { data: booksData } = useBooks();

  // Authoritative counters (Global aggregation across all platforms)
  const collegesCount = uniStats?.colleges ?? stats?.colleges ?? 0;
  const institutesCount = uniStats?.institutes ?? stats?.institutes ?? 0;
  const schoolsCount = stats?.schools ?? 0;
  const coursesCount = coursesData?.length ?? 0;
  const booksCount = booksData?.length ?? 0;
  const publishersCount = stats?.publishers ?? 0;

  // Recruitment companies / Employers (fallback to distinct count or placeholder)
  const recruitmentCount = useMemo(() => {
    try {
      const saved = localStorage.getItem("unigates_career_jobs");
      if (saved) {
        const jobs = JSON.parse(saved);
        const companies = new Set(jobs.map((j: { company_ar?: string }) => j.company_ar).filter(Boolean));
        return Math.max(companies.size, 1);
      }
    } catch (e) {
      // ignore
    }
    return 1;
  }, []);

  const lecturersCount = stats?.lecturers ?? uniStats?.lecturers ?? 0;
  const teachersCount = stats?.teachers ?? 0;
  const studentsCount = stats?.students ?? uniStats?.students ?? 0;
  const trainingCentersCount = stats?.trainingCenters ?? 0;
  const languageCentersCount = stats?.languageCenters ?? 0;

  // Authors (Writers) from books
  const authorsCount = useMemo(() => {
    if (!booksData || booksData.length === 0) return 0;
    const authorSet = new Set(booksData.map((b) => b.author_ar).filter(Boolean));
    return authorSet.size;
  }, [booksData]);

  // Jobs count
  const jobsCount = useMemo(() => {
    try {
      const saved = localStorage.getItem("unigates_career_jobs");
      if (saved) {
        const jobs = JSON.parse(saved);
        return Array.isArray(jobs) ? jobs.length : 12;
      }
    } catch (e) {
      // ignore
    }
    return 12;
  }, []);

  // CountUp animation hooks
  const colleges = useCountUp(collegesCount);
  const institutes = useCountUp(institutesCount);
  const schools = useCountUp(schoolsCount);
  const courses = useCountUp(coursesCount);
  const books = useCountUp(booksCount);
  const publishers = useCountUp(publishersCount);
  const recruitment = useCountUp(recruitmentCount);
  const lecturers = useCountUp(lecturersCount);
  const teachers = useCountUp(teachersCount);
  const students = useCountUp(studentsCount);
  const trainingCenters = useCountUp(trainingCentersCount);
  const languageCenters = useCountUp(languageCentersCount);
  const authors = useCountUp(authorsCount);
  const jobs = useCountUp(jobsCount);

  // Multilingual label resolution for the 14 requested items
  const getLabels = () => {
    switch (language) {
      case "en":
        return {
          colleges: "College",
          institutes: "Institute",
          schools: "School",
          courses: "Course",
          books: "Book",
          publishers: "Publisher",
          recruitment: "Recruitment Co.",
          lecturers: "Lecturer",
          teachers: "Teacher",
          students: "Student",
          trainingCenters: "Training Center",
          languageCenters: "Language Center",
          authors: "Author",
          jobs: "Job",
        };
      case "fr":
        return {
          colleges: "Faculté",
          institutes: "Institut",
          schools: "École",
          courses: "Cours",
          books: "Livre",
          publishers: "Éditeur",
          recruitment: "Cabinet de Recrutement",
          lecturers: "Conférencier",
          teachers: "Enseignant",
          students: "Étudiant",
          trainingCenters: "Centre de Formation",
          languageCenters: "Centre de Langues",
          authors: "Auteur",
          jobs: "Emploi",
        };
      case "es":
        return {
          colleges: "Facultad",
          institutes: "Instituto",
          schools: "Escuela",
          courses: "Curso",
          books: "Libro",
          publishers: "Editorial",
          recruitment: "Empresa de Empleo",
          lecturers: "Profesor",
          teachers: "Docente",
          students: "Estudiante",
          trainingCenters: "Centro de Formación",
          languageCenters: "Centro de Idiomas",
          authors: "Autor",
          jobs: "Empleo",
        };
      case "de":
        return {
          colleges: "Fakultät",
          institutes: "Institut",
          schools: "Schule",
          courses: "Kurs",
          books: "Buch",
          publishers: "Verlag",
          recruitment: "Personalagentur",
          lecturers: "Dozent",
          teachers: "Lehrer",
          students: "Student",
          trainingCenters: "Schulungszentrum",
          languageCenters: "Sprachzentrum",
          authors: "Autor",
          jobs: "Stelle",
        };
      case "zh":
        return {
          colleges: "学院",
          institutes: "高等学院",
          schools: "学校",
          courses: "培训课程",
          books: "图书",
          publishers: "出版社",
          recruitment: "招聘机构",
          lecturers: "讲师",
          teachers: "教师",
          students: "学生",
          trainingCenters: "培训中心",
          languageCenters: "语言中心",
          authors: "作家",
          jobs: "职位",
        };
      case "ru":
        return {
          colleges: "Колледж",
          institutes: "Институт",
          schools: "Школа",
          courses: "Курс",
          books: "Книга",
          publishers: "Издатель",
          recruitment: "Рекрутинговая компания",
          lecturers: "Преподаватель",
          teachers: "Учитель",
          students: "Студент",
          trainingCenters: "Учебный центр",
          languageCenters: "Языковой центр",
          authors: "Автор",
          jobs: "Вакансия",
        };
      case "tr":
        return {
          colleges: "Fakülte",
          institutes: "Enstitü",
          schools: "Okul",
          courses: "Kurs",
          books: "Kitap",
          publishers: "Yayınevi",
          recruitment: "İstihdam Şirketi",
          lecturers: "Öğretim Görevlisi",
          teachers: "Öğretmen",
          students: "Öğrenci",
          trainingCenters: "Eğitim Merkezi",
          languageCenters: "Dil Merkezi",
          authors: "Yazar",
          jobs: "İş İlanı",
        };
      default:
        return {
          colleges: "كلية",
          institutes: "معهد",
          schools: "مدرسة",
          courses: "دورة تعليمية",
          books: "كتاب",
          publishers: "ناشر",
          recruitment: "شركة توظيف",
          lecturers: "محاضر",
          teachers: "معلم",
          students: "طالب",
          trainingCenters: "مركز تدريب",
          languageCenters: "مركز لغات",
          authors: "كاتب",
          jobs: "وظيفة",
        };
    }
  };

  const labels = getLabels();

  // Exact 14 items ordered as requested:
  // 1. كلية
  // 2. معهد
  // 3. مدرسة
  // 4. دورة تعليمية
  // 5. كتاب
  // 6. ناشر
  // 7. شركة توظيف
  // 8. محاضر
  // 9. معلم
  // 10. طالب
  // 11. مركز تدريب
  // 12. مركز لغات
  // 13. كاتب
  // 14. وظيفة
  const items = [
    { icon: Landmark, counter: colleges, label: labels.colleges, color: "from-blue-500 to-indigo-600" },
    { icon: Landmark, counter: institutes, label: labels.institutes, color: "from-indigo-500 to-violet-600" },
    { icon: School, counter: schools, label: labels.schools, color: "from-emerald-500 to-teal-600" },
    { icon: BookOpen, counter: courses, label: labels.courses, color: "from-purple-500 to-fuchsia-600" },
    { icon: BookMarked, counter: books, label: labels.books, color: "from-amber-500 to-orange-600" },
    { icon: BookCopy, counter: publishers, label: labels.publishers, color: "from-orange-500 to-red-600" },
    { icon: Building2, counter: recruitment, label: labels.recruitment, color: "from-cyan-500 to-blue-600" },
    { icon: GraduationCap, counter: lecturers, label: labels.lecturers, color: "from-blue-600 to-cyan-500" },
    { icon: GraduationCap, counter: teachers, label: labels.teachers, color: "from-teal-500 to-emerald-600" },
    { icon: Users, counter: students, label: labels.students, color: "from-rose-500 to-pink-600" },
    { icon: Building2, counter: trainingCenters, label: labels.trainingCenters, color: "from-amber-600 to-yellow-500" },
    { icon: Languages, counter: languageCenters, label: labels.languageCenters, color: "from-pink-500 to-rose-600" },
    { icon: PenTool, counter: authors, label: labels.authors, color: "from-violet-500 to-purple-600" },
    { icon: Briefcase, counter: jobs, label: labels.jobs, color: "from-emerald-600 to-cyan-600" },
  ];

  return (
    <section className="relative z-20 -mt-8 sm:-mt-12 max-w-7xl mx-auto px-3 sm:px-6">
      <div className="rounded-3xl border-2 border-white/20 dark:border-border/60 bg-card/90 backdrop-blur-2xl shadow-2xl shadow-black/20 p-3 sm:p-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 sm:gap-2.5">
          {items.map((item, i) => (
            <div
              key={i}
              ref={item.counter.ref}
              className="flex flex-col items-center justify-between gap-1 p-2 sm:p-2.5 rounded-2xl bg-muted/40 hover:bg-muted/70 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group cursor-default text-center"
            >
              <div
                className={`w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white shadow-sm group-hover:scale-110 transition-transform`}
              >
                <item.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <span className="text-sm sm:text-lg md:text-xl font-black text-foreground tracking-tight">
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
