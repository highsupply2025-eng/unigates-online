import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
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
  const { language } = useLanguage();
  const isRtl = language === "ar";

  // ── Colleges ───────────────────────────────────────────────
  const { data: rawColleges } = useQuery({
    queryKey: ["home-colleges"],
    queryFn: async () => {
      const { data } = await supabase
        .from("approved_colleges_public")
        .select("id, college_name, university_name, dean_name, city, logo_url")
        .order("id", { ascending: false })
        .limit(20);
      return data || [];
    },
    staleTime: 60_000,
  });

  const colleges: ShowcaseItem[] = rawColleges.length > 0
    ? rawColleges.map((c, i) => ({
        id: c.id,
        title: isRtl ? c.college_name : c.university_name || c.college_name,
        subtitle: isRtl ? c.city : c.city,
        image: c.logo_url || collegeBgs[i % collegeBgs.length],
        badge: isRtl ? "كلية" : "College",
        badgeColor: "bg-primary/90",
      }))
    : [];

  // ── Institutes ─────────────────────────────────────────────
  const { data: rawInstitutes } = useQuery({
    queryKey: ["home-institutes"],
    queryFn: async () => {
      const { data } = await supabase
        .from("approved_institutes_public")
        .select("id, institute_name, director_name, city, logo_url")
        .order("id", { ascending: false })
        .limit(20);
      return data || [];
    },
    staleTime: 60_000,
  });

  const institutes: ShowcaseItem[] = rawInstitutes.length > 0
    ? rawInstitutes.map((inst, i) => ({
        id: inst.id,
        title: isRtl ? inst.institute_name : inst.institute_name,
        subtitle: isRtl ? inst.city : inst.city,
        image: inst.logo_url || instituteBgs[i % instituteBgs.length],
        badge: isRtl ? "معهد" : "Institute",
        badgeColor: "bg-indigo-600/90",
      }))
    : [];

  // ── Schools ────────────────────────────────────────────────
  const { data: rawSchools } = useQuery({
    queryKey: ["home-schools"],
    queryFn: async () => {
      const { data } = await supabase
        .from("approved_schools_public")
        .select("id, school_name, city")
        .order("id", { ascending: false })
        .limit(20);
      return data || [];
    },
    staleTime: 60_000,
  });

  const schools: ShowcaseItem[] = rawSchools.length > 0
    ? rawSchools.map((s, i) => ({
        id: s.id,
        title: isRtl ? s.school_name : s.school_name,
        subtitle: isRtl ? s.city : s.city,
        image: schoolBgs[i % schoolBgs.length],
        badge: isRtl ? "مدرسة" : "School",
        badgeColor: "bg-orange-600/90",
      }))
    : [];

  // ── Courses ────────────────────────────────────────────────
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

  const courses: ShowcaseItem[] = rawCourses.length > 0
    ? rawCourses.map((c, i) => ({
        id: c.id,
        title: isRtl ? c.title_ar : c.title_en,
        subtitle: isRtl ? c.instructor_ar : c.instructor_en,
        image: c.thumbnail_url || courseBgs[i % courseBgs.length],
        badge: isRtl ? "دورة" : "Course",
        badgeColor: "bg-emerald-600/90",
      }))
    : [];

  // ── Books ──────────────────────────────────────────────────
  const { data: rawBooks } = useQuery({
    queryKey: ["home-books"],
    queryFn: async () => {
      const { data } = await supabase
        .from("books")
        .select("id, title_ar, title_en, author_ar, author_en, cover_url, category")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(20);
      return data || [];
    },
    staleTime: 60_000,
  });

  const books: ShowcaseItem[] = rawBooks.length > 0
    ? rawBooks.map((b, i) => ({
        id: b.id,
        title: isRtl ? b.title_ar : b.title_en,
        subtitle: isRtl ? b.author_ar : b.author_en,
        image: b.cover_url || bookBgs[i % bookBgs.length],
        badge: isRtl ? "كتاب" : "Book",
        badgeColor: "bg-amber-600/90",
      }))
    : [];

  return (
    <div className="divide-y divide-border/40">
      <HomepageShowcaseCarousel
        title={isRtl ? "الكليات" : "Colleges"}
        emoji="🏛️"
        items={colleges}
        isRtl={isRtl}
        autoScrollSpeed={70}
      />
      <HomepageShowcaseCarousel
        title={isRtl ? "المعاهد" : "Institutes"}
        emoji="🏛️"
        items={institutes}
        isRtl={isRtl}
        autoScrollSpeed={80}
      />
      <HomepageShowcaseCarousel
        title={isRtl ? "المدارس" : "Schools"}
        emoji="🏫"
        items={schools}
        isRtl={isRtl}
        autoScrollSpeed={65}
      />
      <HomepageShowcaseCarousel
        title={isRtl ? "الدورات التعليمية" : "Courses"}
        emoji="📚"
        items={courses}
        isRtl={isRtl}
        autoScrollSpeed={85}
      />
      <HomepageShowcaseCarousel
        title={isRtl ? "الكتب" : "Books"}
        emoji="📖"
        items={books}
        isRtl={isRtl}
        autoScrollSpeed={75}
      />
    </div>
  );
};

export default HomepageSections;
