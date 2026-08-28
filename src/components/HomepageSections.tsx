import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Landmark, School, BookOpen, Store, Sparkles, Building2, Layers } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import HomepageShowcaseCarousel from "./HomepageShowcaseCarousel";
import type { ShowcaseItem } from "./HomepageShowcaseCarousel";

import collegeBg1 from "@/assets/college-bg-1.jpg";
import collegeBg2 from "@/assets/college-bg-2.jpg";
import collegeBg3 from "@/assets/college-bg-3.jpg";
import collegeBg4 from "@/assets/college-bg-4.jpg";

import instituteBg1 from "@/assets/institute-bg-1.jpg";
import instituteBg2 from "@/assets/institute-bg-2.jpg";
import instituteBg3 from "@/assets/institute-bg-3.jpg";
import instituteBg4 from "@/assets/institute-bg-4.jpg";

import schoolBg1 from "@/assets/school-bg-1.jpg";
import schoolBg2 from "@/assets/school-bg-2.jpg";
import schoolBg3 from "@/assets/school-bg-3.jpg";
import schoolBg4 from "@/assets/school-bg-4.jpg";

import courseBg1 from "@/assets/course-bg-1.jpg";
import courseBg2 from "@/assets/course-bg-2.jpg";
import courseBg3 from "@/assets/course-bg-3.jpg";
import courseBg4 from "@/assets/course-bg-4.jpg";

import bookBg1 from "@/assets/book-bg-1.jpg";
import bookBg2 from "@/assets/book-bg-2.jpg";
import bookBg3 from "@/assets/book-bg-3.jpg";
import bookBg4 from "@/assets/book-bg-4.jpg";

const collegeBgs = [collegeBg1, collegeBg2, collegeBg3, collegeBg4];
const instituteBgs = [instituteBg1, instituteBg2, instituteBg3, instituteBg4];
const schoolBgs = [schoolBg1, schoolBg2, schoolBg3, schoolBg4];
const courseBgs = [courseBg1, courseBg2, courseBg3, courseBg4];
const bookBgs = [bookBg1, bookBg2, bookBg3, bookBg4];

const HomepageSections = () => {
  const { language, dir } = useLanguage();
  const isRtl = dir === "rtl";
  const [activeFilter, setActiveFilter] = useState<"all" | "colleges" | "institutes" | "schools" | "courses" | "books">("all");

  // ── 1. Colleges Query ─────────────────────────────────────────
  const { data: rawColleges } = useQuery({
    queryKey: ["home-colleges"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_public_approved_colleges");
      if (error) return [];
      return data || [];
    },
    staleTime: 60_000,
  });

  const defaultColleges: ShowcaseItem[] = [
    {
      id: "curated-col-1",
      title: isRtl ? "كلية الحاسبات والذكاء الاصطناعي" : "Faculty of Computers & AI",
      subtitle: isRtl ? "قسم علوم الحاسب ونظم المعلومات" : "Computer Science & IS",
      image: collegeBg1,
      badge: isRtl ? "كلية معتمدة" : "Accredited College",
      badgeColor: "bg-blue-600/90",
      href: "/university-platform",
      meta: isRtl ? "4 أقسام أكاديمية" : "4 Departments",
    },
    {
      id: "curated-col-2",
      title: isRtl ? "كلية الهندسة والتكنولوجيا" : "Faculty of Engineering & Tech",
      subtitle: isRtl ? "قسم هندسة البرمجيات والشبكات" : "Software & Network Eng.",
      image: collegeBg2,
      badge: isRtl ? "كلية معتمدة" : "Accredited College",
      badgeColor: "bg-blue-600/90",
      href: "/university-platform",
      meta: isRtl ? "5 أقسام أكاديمية" : "5 Departments",
    },
    {
      id: "curated-col-3",
      title: isRtl ? "كلية إدارة الأعمال ونظم المعلومات" : "Faculty of Business & MIS",
      subtitle: isRtl ? "قسم المحاسبة والتسويق الرقمي" : "Accounting & Marketing",
      image: collegeBg3,
      badge: isRtl ? "كلية معتمدة" : "Accredited College",
      badgeColor: "bg-blue-600/90",
      href: "/university-platform",
      meta: isRtl ? "3 أقسام أكاديمية" : "3 Departments",
    },
    {
      id: "curated-col-4",
      title: isRtl ? "كلية اللغات والترجمة التطبيقية" : "Faculty of Applied Languages",
      subtitle: isRtl ? "قسم اللغة الإنجليزية والترجمة الفورية" : "English & Translation",
      image: collegeBg4,
      badge: isRtl ? "كلية معتمدة" : "Accredited College",
      badgeColor: "bg-blue-600/90",
      href: "/university-platform",
      meta: isRtl ? "4 أقسام أكاديمية" : "4 Departments",
    },
  ];

  const colleges: ShowcaseItem[] = [
    ...(rawColleges ?? []).map((c: any, i: number) => ({
      id: c.id,
      title: isRtl ? c.college_name : c.university_name || c.college_name,
      subtitle: c.city || (isRtl ? "كلية جامعية معتمدة" : "Accredited College"),
      image: c.logo_url || collegeBgs[i % collegeBgs.length],
      badge: isRtl ? "كلية معتمدة" : "College",
      badgeColor: "bg-blue-600/90",
      href: "/university-platform",
      meta: isRtl ? "المنصة الجامعية" : "University Portal",
    })),
    ...defaultColleges,
  ].slice(0, 6);

  // ── 2. Institutes Query ────────────────────────────────────────
  const { data: rawInstitutes } = useQuery({
    queryKey: ["home-institutes"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_public_approved_institutes");
      if (error) return [];
      return data || [];
    },
    staleTime: 60_000,
  });

  const defaultInstitutes: ShowcaseItem[] = [
    {
      id: "curated-inst-1",
      title: isRtl ? "المعهد العالي لعلوم الحاسب ونظم المعلومات" : "Higher Institute of Computer Science",
      subtitle: isRtl ? "شعبة تكنولوجيا المعلومات والبرمجة" : "IT & Software Division",
      image: instituteBg1,
      badge: isRtl ? "معهد عالي معتمد" : "Accredited Institute",
      badgeColor: "bg-indigo-600/90",
      href: "/university-platform",
      meta: isRtl ? "مؤهل بكالوريوس معتمد" : "Bachelor Degree",
    },
    {
      id: "curated-inst-2",
      title: isRtl ? "المعهد العالي للهندسة والتكنولوجيا" : "Higher Institute of Engineering",
      subtitle: isRtl ? "شعبة الاتصالات والإلكترونيات" : "Telecom & Electronics",
      image: instituteBg2,
      badge: isRtl ? "معهد عالي معتمد" : "Accredited Institute",
      badgeColor: "bg-indigo-600/90",
      href: "/university-platform",
      meta: isRtl ? "مؤهل بكالوريوس معتمد" : "Bachelor Degree",
    },
    {
      id: "curated-inst-3",
      title: isRtl ? "المعهد العالي للعلوم الإدارية والمالية" : "Higher Institute of Management",
      subtitle: isRtl ? "شعبة إدارة الأعمال والتجارة الإلكترونية" : "Business & E-Commerce",
      image: instituteBg3,
      badge: isRtl ? "معهد عالي معتمد" : "Accredited Institute",
      badgeColor: "bg-indigo-600/90",
      href: "/university-platform",
      meta: isRtl ? "مؤهل بكالوريوس معتمد" : "Bachelor Degree",
    },
    {
      id: "curated-inst-4",
      title: isRtl ? "المعهد التكنولوجي للعلوم الصحية والتمريض" : "Technological Health Institute",
      subtitle: isRtl ? "شعبة التمريض والتحاليل الطبية" : "Nursing & Health Sciences",
      image: instituteBg4,
      badge: isRtl ? "معهد عالي معتمد" : "Accredited Institute",
      badgeColor: "bg-indigo-600/90",
      href: "/university-platform",
      meta: isRtl ? "مؤهل معتمد رسمياً" : "Accredited Diploma",
    },
  ];

  const institutes: ShowcaseItem[] = [
    ...(rawInstitutes ?? []).map((inst: any, i: number) => ({
      id: inst.id,
      title: inst.institute_name,
      subtitle: inst.city || (isRtl ? "معهد عالي معتمد" : "Accredited Institute"),
      image: inst.logo_url || instituteBgs[i % instituteBgs.length],
      badge: isRtl ? "معهد عالي" : "Institute",
      badgeColor: "bg-indigo-600/90",
      href: "/university-platform",
      meta: isRtl ? "المنصة الجامعية" : "University Portal",
    })),
    ...defaultInstitutes,
  ].slice(0, 6);

  // ── 3. Schools Query ──────────────────────────────────────────
  const { data: rawSchools } = useQuery({
    queryKey: ["home-schools"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_public_approved_schools");
      if (error) return [];
      return data || [];
    },
    staleTime: 60_000,
  });

  const defaultSchools: ShowcaseItem[] = [
    {
      id: "curated-sch-1",
      title: isRtl ? "مدارس النخبة الدولية للغات" : "Al-Nokhba International Schools",
      subtitle: isRtl ? "رياض الأطفال • الابتدائي • الإعدادي • الثانوي" : "K-12 Full Stages",
      image: schoolBg1,
      badge: isRtl ? "مدرسة دولية" : "International School",
      badgeColor: "bg-emerald-600/90",
      href: "/school-platform",
      meta: isRtl ? "فصول وبث مباشر" : "Live Classrooms",
    },
    {
      id: "curated-sch-2",
      title: isRtl ? "مدارس رواد المستقبل النموذجية" : "Rowad Al-Mostaqbal Schools",
      subtitle: isRtl ? "القسم البريطاني واللغات التجريبية" : "British & Language Section",
      image: schoolBg2,
      badge: isRtl ? "مدرسة لغات" : "Language School",
      badgeColor: "bg-emerald-600/90",
      href: "/school-platform",
      meta: isRtl ? "فصول وبث مباشر" : "Live Classrooms",
    },
    {
      id: "curated-sch-3",
      title: isRtl ? "مدرسة التميز والإبداع الحديثة" : "Modern Al-Tamayoz School",
      subtitle: isRtl ? "مناهج متطورة ومتابعة مستمرة لأولياء الأمور" : "Advanced Curriculum",
      image: schoolBg3,
      badge: isRtl ? "مدرسة معتمدة" : "Accredited School",
      badgeColor: "bg-emerald-600/90",
      href: "/school-platform",
      meta: isRtl ? "متابعة أولياء الأمور" : "Parent Portal",
    },
    {
      id: "curated-sch-4",
      title: isRtl ? "مدارس الأندلس الذكية" : "Al-Andalus Smart Schools",
      subtitle: isRtl ? "تعليم تفاعلي رقمي وفصول افتراضية متطورة" : "Smart E-Learning",
      image: schoolBg4,
      badge: isRtl ? "مدرسة ذكية" : "Smart School",
      badgeColor: "bg-emerald-600/90",
      href: "/school-platform",
      meta: isRtl ? "فصول وبث مباشر" : "Live Classrooms",
    },
  ];

  const schools: ShowcaseItem[] = [
    ...(rawSchools ?? []).map((s: any, i: number) => ({
      id: s.id,
      title: s.school_name,
      subtitle: s.city || (isRtl ? "مدرسة معتمدة" : "Accredited School"),
      image: schoolBgs[i % schoolBgs.length],
      badge: isRtl ? "مدرسة" : "School",
      badgeColor: "bg-emerald-600/90",
      href: "/school-platform",
      meta: isRtl ? "المنصة المدرسية" : "School Portal",
    })),
    ...defaultSchools,
  ].slice(0, 6);

  // ── 4. Courses Query ──────────────────────────────────────────
  const { data: rawCourses } = useQuery({
    queryKey: ["home-courses"],
    queryFn: async () => {
      const { data } = await supabase
        .from("courses")
        .select("id, title_ar, title_en, instructor_ar, instructor_en, thumbnail_url, category_ar, category_en")
        .order("created_at", { ascending: false })
        .limit(20);
      return data || [];
    },
    staleTime: 60_000,
  });

  const defaultCourses: ShowcaseItem[] = [
    {
      id: "curated-crs-1",
      title: isRtl ? "دبلومة الذكاء الاصطناعي والتعلم العميق" : "AI & Deep Learning Diploma",
      subtitle: isRtl ? "د. أحمد كمال • 24 حلقة تدريبية" : "Dr. Ahmed Kamal • 24 Episodes",
      image: courseBg1,
      badge: isRtl ? "دورة مميزة" : "Featured Course",
      badgeColor: "bg-purple-600/90",
      href: "/courses",
      extra: "4.9 (120)",
    },
    {
      id: "curated-crs-2",
      title: isRtl ? "تطوير تطبيقات الويب الكاملة Full-Stack" : "Full-Stack Web Development",
      subtitle: isRtl ? "م. سارة فاروق • 36 حلقة تدريبية" : "Eng. Sara Farouk • 36 Episodes",
      image: courseBg2,
      badge: isRtl ? "دورة مميزة" : "Featured Course",
      badgeColor: "bg-purple-600/90",
      href: "/courses",
      extra: "4.8 (95)",
    },
    {
      id: "curated-crs-3",
      title: isRtl ? "الأمن السيبراني واختبار الاختراق الأخلاقي" : "Cybersecurity & Ethical Hacking",
      subtitle: isRtl ? "م. خالد منصور • 18 حلقة تدريبية" : "Eng. Khaled Mansour • 18 Episodes",
      image: courseBg3,
      badge: isRtl ? "دورة مميزة" : "Featured Course",
      badgeColor: "bg-purple-600/90",
      href: "/courses",
      extra: "5.0 (88)",
    },
    {
      id: "curated-crs-4",
      title: isRtl ? "تصميم واجهات وتجربة المستخدم UI/UX" : "UI/UX Masterclass",
      subtitle: isRtl ? "أ. ندى يوسف • 20 حلقة تدريبية" : "Nada Youssef • 20 Episodes",
      image: courseBg4,
      badge: isRtl ? "دورة مميزة" : "Featured Course",
      badgeColor: "bg-purple-600/90",
      href: "/courses",
      extra: "4.9 (110)",
    },
  ];

  const courses: ShowcaseItem[] = [
    ...(rawCourses ?? []).map((c: any, i: number) => ({
      id: c.id,
      title: isRtl ? c.title_ar : c.title_en,
      subtitle: isRtl ? c.instructor_ar : c.instructor_en,
      image: c.thumbnail_url || courseBgs[i % courseBgs.length],
      badge: isRtl ? "دورة معتمدة" : "Course",
      badgeColor: "bg-purple-600/90",
      href: "/courses",
      extra: "4.9",
    })),
    ...defaultCourses,
  ].slice(0, 6);

  // ── 5. Books Query ────────────────────────────────────────────
  const { data: rawBooks } = useQuery({
    queryKey: ["home-books"],
    queryFn: async () => {
      const { data } = await supabase
        .from("books")
        .select("id, title_ar, title_en, author_ar, author_en, cover_url, rating, reviews_count, price")
        .eq("is_active", true)
        .order("rating", { ascending: false })
        .limit(20);
      return data || [];
    },
    staleTime: 60_000,
  });

  const defaultBooks: ShowcaseItem[] = [
    {
      id: "curated-bk-1",
      title: isRtl ? "مرجع هندسة البرمجيات وبناء النظم الحديثة" : "Modern Software Engineering Reference",
      subtitle: isRtl ? "دار عبيد للنشر والتوزيع • طبعة 2026" : "Dar Obeid Publishing • 2026",
      image: bookBg1,
      badge: isRtl ? "الأكثر طلباً" : "Bestseller",
      badgeColor: "bg-amber-600/90",
      href: "/book-store",
      extra: "5.0 (42)",
    },
    {
      id: "curated-bk-2",
      title: isRtl ? "أساسيات الذكاء الاصطناعي وتطبيقاته العملية" : "AI Fundamentals & Practical Applications",
      subtitle: isRtl ? "تأليف: أ.د. محمود الشافعي" : "Prof. Dr. Mahmoud El-Shafei",
      image: bookBg2,
      badge: isRtl ? "كتاب أكاديمي" : "Academic Book",
      badgeColor: "bg-amber-600/90",
      href: "/book-store",
      extra: "4.9 (38)",
    },
    {
      id: "curated-bk-3",
      title: isRtl ? "دليل علوم البيانات والتحليل الإحصائي المتقدم" : "Data Science & Advanced Analytics",
      subtitle: isRtl ? "دار عبيد للنشر والتوزيع" : "Dar Obeid Publishing",
      image: bookBg3,
      badge: isRtl ? "إصدار جديد" : "New Release",
      badgeColor: "bg-amber-600/90",
      href: "/book-store",
      extra: "4.8 (29)",
    },
    {
      id: "curated-bk-4",
      title: isRtl ? "أمن المعلومات والتشفير الرقمي الشامل" : "Information Security & Cryptography",
      subtitle: isRtl ? "تأليف: د. حسام النجار" : "Dr. Hossam El-Naggar",
      image: bookBg4,
      badge: isRtl ? "مرجع علمي" : "Reference",
      badgeColor: "bg-amber-600/90",
      href: "/book-store",
      extra: "4.9 (51)",
    },
  ];

  const books: ShowcaseItem[] = [
    ...(rawBooks ?? []).map((b: any, i: number) => ({
      id: b.id,
      title: isRtl ? b.title_ar : b.title_en,
      subtitle: isRtl ? b.author_ar : b.author_en,
      image: b.cover_url || bookBgs[i % bookBgs.length],
      badge: isRtl ? "كتاب ورقي ورقمي" : "Book",
      badgeColor: "bg-amber-600/90",
      href: "/book-store",
      extra: b.rating > 0 ? `★ ${b.rating.toFixed(1)}` : "★ 4.9",
    })),
    ...defaultBooks,
  ].slice(0, 6);

  const filterTabs = [
    { key: "all", label: isRtl ? "🌟 كل الأقسام" : "All Categories" },
    { key: "colleges", label: isRtl ? "🏛️ الكليات" : "Colleges" },
    { key: "institutes", label: isRtl ? "🏢 المعاهد" : "Institutes" },
    { key: "schools", label: isRtl ? "🏫 المدارس" : "Schools" },
    { key: "courses", label: isRtl ? "📚 الدورات التدريبية" : "Courses" },
    { key: "books", label: isRtl ? "📖 متجر الكتب" : "Bookstore" },
  ];

  return (
    <div className="py-8 sm:py-12 bg-background space-y-4">
      {/* Category Filter Pills */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key as any)}
              className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-black transition-all duration-300 shrink-0 ${
                activeFilter === tab.key
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-105"
                  : "bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="divide-y divide-border/40">
        {/* 1. Colleges Carousel */}
        {(activeFilter === "all" || activeFilter === "colleges") && (
          <HomepageShowcaseCarousel
            title={isRtl ? "الكليات المعتمدة" : "Accredited Colleges"}
            emoji="🏛️"
            items={colleges}
            isRtl={isRtl}
            viewAllLink="/university-platform"
            viewAllText={isRtl ? "تصفح كل الكليات" : "Explore All Colleges"}
            autoScrollSpeed={70}
          />
        )}

        {/* 2. Institutes Carousel */}
        {(activeFilter === "all" || activeFilter === "institutes") && (
          <HomepageShowcaseCarousel
            title={isRtl ? "المعاهد العليا المعتمدة" : "Higher Institutes"}
            emoji="🏢"
            items={institutes}
            isRtl={isRtl}
            viewAllLink="/university-platform"
            viewAllText={isRtl ? "تصفح كل المعاهد" : "Explore All Institutes"}
            autoScrollSpeed={70}
          />
        )}

        {/* 3. Schools Carousel */}
        {(activeFilter === "all" || activeFilter === "schools") && (
          <HomepageShowcaseCarousel
            title={isRtl ? "المدارس المسجلة K-12" : "Registered K-12 Schools"}
            emoji="🏫"
            items={schools}
            isRtl={isRtl}
            viewAllLink="/school-platform"
            viewAllText={isRtl ? "تصفح كل المدارس" : "Explore All Schools"}
            autoScrollSpeed={65}
          />
        )}

        {/* 4. Courses Carousel */}
        {(activeFilter === "all" || activeFilter === "courses") && (
          <HomepageShowcaseCarousel
            title={isRtl ? "أبرز الدورات التدريبية المعتمدة" : "Featured Professional Courses"}
            emoji="📚"
            items={courses}
            isRtl={isRtl}
            viewAllLink="/courses"
            viewAllText={isRtl ? "تصفح كل الدورات" : "Explore All Courses"}
            autoScrollSpeed={85}
          />
        )}

        {/* 5. Books Carousel */}
        {(activeFilter === "all" || activeFilter === "books") && (
          <HomepageShowcaseCarousel
            title={isRtl ? "أحدث الكتب والمراجع الأكاديمية" : "Latest Books & References"}
            emoji="📖"
            items={books}
            isRtl={isRtl}
            viewAllLink="/book-store"
            viewAllText={isRtl ? "تصفح متجر الكتب" : "Explore Bookstore"}
            autoScrollSpeed={75}
          />
        )}
      </div>
    </div>
  );
};

export default HomepageSections;
