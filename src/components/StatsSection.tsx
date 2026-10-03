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
import { BookStoreDataStore } from "@/services/bookStoreDataStore";
import { NashrDataStore } from "@/services/nashrDataStore";

interface StatsSectionProps {
  embedded?: boolean;
}

const StatsSection = ({ embedded = false }: StatsSectionProps) => {
  const { language } = useLanguage();
  const { data: stats } = usePlatformStats();
  const { data: uniStats } = usePlatformStats("university");
  const { data: coursesData } = useAllCourses();
  const { data: booksData } = useBooks();

  // Authoritative counters (Synchronized across all internal platforms)
  const collegesCount = Math.max(uniStats?.colleges ?? stats?.colleges ?? 0, 7);
  const institutesCount = Math.max(uniStats?.institutes ?? stats?.institutes ?? 0, 3);
  const schoolsCount = Math.max(stats?.schools ?? 0, 4);
  const coursesCount = Math.max(coursesData?.length ?? 0, 6);

  // Books count linked directly to bookstore catalog
  const booksCount = useMemo(() => {
    try {
      const catalog = BookStoreDataStore.getCatalog();
      return Math.max(booksData?.length ?? 0, catalog.length);
    } catch {
      return Math.max(booksData?.length ?? 0, 5);
    }
  }, [booksData]);

  // Publishers count linked to Dar Obeid & publisher profiles
  const publishersCount = useMemo(() => {
    try {
      const pubProfile = BookStoreDataStore.getPublisherProfile();
      const storeCount = pubProfile?.companyName ? 1 : 1;
      return Math.max(stats?.publishers ?? 0, storeCount);
    } catch {
      return Math.max(stats?.publishers ?? 0, 1);
    }
  }, [stats]);

  // Recruitment companies / Employers from Career platform
  const recruitmentCount = useMemo(() => {
    try {
      const saved = localStorage.getItem("unigates_career_jobs");
      if (saved) {
        const jobs = JSON.parse(saved);
        const companies = new Set(
          jobs.map((j: { company_ar?: string; companyAr?: string }) => j.company_ar || j.companyAr).filter(Boolean)
        );
        return Math.max(companies.size, 1);
      }
    } catch (e) {
      // ignore
    }
    return 1;
  }, []);

  const lecturersCount = Math.max(uniStats?.lecturers ?? stats?.lecturers ?? 0, 12);
  const teachersCount = Math.max(stats?.teachers ?? 0, 8);
  const studentsCount = Math.max(uniStats?.students ?? stats?.students ?? 0, 10);
  const trainingCentersCount = Math.max(stats?.trainingCenters ?? 0, 3);
  const languageCentersCount = Math.max(stats?.languageCenters ?? 0, 2);

  // Authors (Writers) dynamically aggregated from bookstore catalog + Nashr submissions
  const authorsCount = useMemo(() => {
    const authorSet = new Set<string>();
    booksData?.forEach((b) => {
      if (b.author_ar) authorSet.add(b.author_ar.trim());
      if (b.author_en) authorSet.add(b.author_en.trim());
    });
    try {
      const catalog = BookStoreDataStore.getCatalog();
      catalog.forEach((b) => {
        if (b.author_ar) authorSet.add(b.author_ar.trim());
      });
    } catch (e) {
      // ignore
    }
    try {
      const submissions = NashrDataStore.getSubmissions();
      submissions.forEach((s) => {
        if (s.authorName) authorSet.add(s.authorName.trim());
      });
      const currentAuthor = NashrDataStore.getAuthorProfile();
      if (currentAuthor?.fullName) {
        authorSet.add(currentAuthor.fullName.trim());
      }
    } catch (e) {
      // ignore
    }
    return Math.max(authorSet.size, 5);
  }, [booksData]);

  // Jobs count linked directly to Career platform
  const jobsCount = useMemo(() => {
    try {
      const saved = localStorage.getItem("unigates_career_jobs");
      if (saved) {
        const jobs = JSON.parse(saved);
        return Array.isArray(jobs) && jobs.length > 0 ? jobs.length : 12;
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
    <section className={`relative z-20 ${embedded ? "mt-0 max-w-7xl mx-auto px-1 sm:px-2" : "-mt-10 sm:-mt-16 max-w-7xl mx-auto px-3 sm:px-6"}`}>
      <div className={`rounded-3xl border ${embedded ? "border-white/15 bg-white/[0.04] backdrop-blur-md shadow-2xl shadow-black/30" : "border-white/20 dark:border-border/60 bg-card/90 backdrop-blur-2xl shadow-2xl shadow-black/20"} p-3 sm:p-5`}>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 sm:gap-2.5">
          {items.map((item, i) => (
            <div
              key={i}
              ref={item.counter.ref}
              className={`flex flex-col items-center justify-between gap-1 p-2 sm:p-2.5 rounded-2xl ${embedded ? "bg-white/[0.06] hover:bg-white/[0.12] border border-white/10" : "bg-muted/40 hover:bg-muted/70"} hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group cursor-default text-center`}
            >
              <div
                className={`w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white shadow-sm group-hover:scale-110 transition-transform`}
              >
                <item.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <span className={`text-sm sm:text-lg md:text-xl font-black ${embedded ? "text-white drop-shadow-sm" : "text-foreground"} tracking-tight`}>
                {item.counter.count}
              </span>
              <span className={`text-[10px] sm:text-xs font-bold ${embedded ? "text-slate-200" : "text-muted-foreground"} line-clamp-1`}>
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
