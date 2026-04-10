import { useLanguage } from "@/contexts/LanguageContext";
import HomepageShowcaseCarousel from "./HomepageShowcaseCarousel";

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

const collegesAr = [
  { id: "c1", title: "كلية الهندسة", subtitle: "القاهرة", image: collegeBg1, badge: "كلية", badgeColor: "bg-primary/90" },
  { id: "c2", title: "كلية الطب البشري", subtitle: "الإسكندرية", image: collegeBg2, badge: "كلية", badgeColor: "bg-primary/90" },
  { id: "c3", title: "كلية العلوم", subtitle: "المنصورة", image: collegeBg3, badge: "كلية", badgeColor: "bg-primary/90" },
  { id: "c4", title: "كلية الحقوق", subtitle: "أسيوط", image: collegeBg4, badge: "كلية", badgeColor: "bg-primary/90" },
  { id: "c5", title: "كلية التجارة", subtitle: "طنطا", image: collegeBg1, badge: "كلية", badgeColor: "bg-primary/90" },
  { id: "c6", title: "كلية الصيدلة", subtitle: "الزقازيق", image: collegeBg2, badge: "كلية", badgeColor: "bg-primary/90" },
];

const collegesEn = [
  { id: "c1", title: "Faculty of Engineering", subtitle: "Cairo", image: collegeBg1, badge: "College", badgeColor: "bg-primary/90" },
  { id: "c2", title: "Faculty of Medicine", subtitle: "Alexandria", image: collegeBg2, badge: "College", badgeColor: "bg-primary/90" },
  { id: "c3", title: "Faculty of Science", subtitle: "Mansoura", image: collegeBg3, badge: "College", badgeColor: "bg-primary/90" },
  { id: "c4", title: "Faculty of Law", subtitle: "Assiut", image: collegeBg4, badge: "College", badgeColor: "bg-primary/90" },
  { id: "c5", title: "Faculty of Commerce", subtitle: "Tanta", image: collegeBg1, badge: "College", badgeColor: "bg-primary/90" },
  { id: "c6", title: "Faculty of Pharmacy", subtitle: "Zagazig", image: collegeBg2, badge: "College", badgeColor: "bg-primary/90" },
];

const institutesAr = [
  { id: "i1", title: "المعهد العالي للتكنولوجيا", subtitle: "القاهرة", image: instituteBg1, badge: "معهد", badgeColor: "bg-indigo-600/90" },
  { id: "i2", title: "معهد الإدارة والتجارة", subtitle: "الجيزة", image: instituteBg2, badge: "معهد", badgeColor: "bg-indigo-600/90" },
  { id: "i3", title: "معهد الهندسة التطبيقية", subtitle: "بنها", image: instituteBg3, badge: "معهد", badgeColor: "bg-indigo-600/90" },
  { id: "i4", title: "المعهد الفني الصناعي", subtitle: "السويس", image: instituteBg4, badge: "معهد", badgeColor: "bg-indigo-600/90" },
  { id: "i5", title: "معهد نظم المعلومات", subtitle: "المنيا", image: instituteBg1, badge: "معهد", badgeColor: "bg-indigo-600/90" },
  { id: "i6", title: "معهد العلوم الصحية", subtitle: "الفيوم", image: instituteBg2, badge: "معهد", badgeColor: "bg-indigo-600/90" },
];

const institutesEn = [
  { id: "i1", title: "Higher Institute of Technology", subtitle: "Cairo", image: instituteBg1, badge: "Institute", badgeColor: "bg-indigo-600/90" },
  { id: "i2", title: "Institute of Business", subtitle: "Giza", image: instituteBg2, badge: "Institute", badgeColor: "bg-indigo-600/90" },
  { id: "i3", title: "Applied Engineering Institute", subtitle: "Banha", image: instituteBg3, badge: "Institute", badgeColor: "bg-indigo-600/90" },
  { id: "i4", title: "Industrial Technical Institute", subtitle: "Suez", image: instituteBg4, badge: "Institute", badgeColor: "bg-indigo-600/90" },
  { id: "i5", title: "Information Systems Institute", subtitle: "Minya", image: instituteBg1, badge: "Institute", badgeColor: "bg-indigo-600/90" },
  { id: "i6", title: "Health Sciences Institute", subtitle: "Fayoum", image: instituteBg2, badge: "Institute", badgeColor: "bg-indigo-600/90" },
];

const schoolsAr = [
  { id: "s1", title: "مدرسة النيل الدولية", subtitle: "القاهرة", image: schoolBg1, badge: "مدرسة", badgeColor: "bg-orange-600/90" },
  { id: "s2", title: "مدرسة المستقبل", subtitle: "الجيزة", image: schoolBg2, badge: "مدرسة", badgeColor: "bg-orange-600/90" },
  { id: "s3", title: "مدرسة الأمل النموذجية", subtitle: "الإسكندرية", image: schoolBg3, badge: "مدرسة", badgeColor: "bg-orange-600/90" },
  { id: "s4", title: "مدرسة النور الخاصة", subtitle: "المنصورة", image: schoolBg4, badge: "مدرسة", badgeColor: "bg-orange-600/90" },
  { id: "s5", title: "مدرسة الرواد", subtitle: "طنطا", image: schoolBg1, badge: "مدرسة", badgeColor: "bg-orange-600/90" },
  { id: "s6", title: "مدرسة العلوم الحديثة", subtitle: "أسيوط", image: schoolBg2, badge: "مدرسة", badgeColor: "bg-orange-600/90" },
];

const schoolsEn = [
  { id: "s1", title: "Nile International School", subtitle: "Cairo", image: schoolBg1, badge: "School", badgeColor: "bg-orange-600/90" },
  { id: "s2", title: "Future Academy School", subtitle: "Giza", image: schoolBg2, badge: "School", badgeColor: "bg-orange-600/90" },
  { id: "s3", title: "Al-Amal Model School", subtitle: "Alexandria", image: schoolBg3, badge: "School", badgeColor: "bg-orange-600/90" },
  { id: "s4", title: "Al-Noor Private School", subtitle: "Mansoura", image: schoolBg4, badge: "School", badgeColor: "bg-orange-600/90" },
  { id: "s5", title: "Pioneers School", subtitle: "Tanta", image: schoolBg1, badge: "School", badgeColor: "bg-orange-600/90" },
  { id: "s6", title: "Modern Science School", subtitle: "Assiut", image: schoolBg2, badge: "School", badgeColor: "bg-orange-600/90" },
];

const coursesAr = [
  { id: "cr1", title: "أساسيات البرمجة", subtitle: "د. أحمد محمد", image: courseBg1, badge: "دورة", badgeColor: "bg-emerald-600/90" },
  { id: "cr2", title: "تصميم الجرافيك", subtitle: "م. سارة علي", image: courseBg2, badge: "دورة", badgeColor: "bg-emerald-600/90" },
  { id: "cr3", title: "تطوير تطبيقات الويب", subtitle: "د. محمد حسن", image: courseBg3, badge: "دورة", badgeColor: "bg-emerald-600/90" },
  { id: "cr4", title: "الذكاء الاصطناعي", subtitle: "د. فاطمة أحمد", image: courseBg4, badge: "دورة", badgeColor: "bg-emerald-600/90" },
  { id: "cr5", title: "إدارة المشاريع", subtitle: "أ. خالد عمر", image: courseBg1, badge: "دورة", badgeColor: "bg-emerald-600/90" },
  { id: "cr6", title: "التسويق الرقمي", subtitle: "م. نور حسين", image: courseBg2, badge: "دورة", badgeColor: "bg-emerald-600/90" },
];

const coursesEn = [
  { id: "cr1", title: "Programming Fundamentals", subtitle: "Dr. Ahmed Mohamed", image: courseBg1, badge: "Course", badgeColor: "bg-emerald-600/90" },
  { id: "cr2", title: "Graphic Design", subtitle: "Eng. Sara Ali", image: courseBg2, badge: "Course", badgeColor: "bg-emerald-600/90" },
  { id: "cr3", title: "Web Development", subtitle: "Dr. Mohamed Hassan", image: courseBg3, badge: "Course", badgeColor: "bg-emerald-600/90" },
  { id: "cr4", title: "Artificial Intelligence", subtitle: "Dr. Fatma Ahmed", image: courseBg4, badge: "Course", badgeColor: "bg-emerald-600/90" },
  { id: "cr5", title: "Project Management", subtitle: "Mr. Khaled Omar", image: courseBg1, badge: "Course", badgeColor: "bg-emerald-600/90" },
  { id: "cr6", title: "Digital Marketing", subtitle: "Eng. Nour Hussein", image: courseBg2, badge: "Course", badgeColor: "bg-emerald-600/90" },
];

const booksAr = [
  { id: "b1", title: "مقدمة في علوم الحاسب", subtitle: "د. عمرو سعيد", image: bookBg1, badge: "كتاب", badgeColor: "bg-amber-600/90" },
  { id: "b2", title: "أسس الرياضيات", subtitle: "د. ليلى حسن", image: bookBg2, badge: "كتاب", badgeColor: "bg-amber-600/90" },
  { id: "b3", title: "الفيزياء العامة", subtitle: "د. كريم فاروق", image: bookBg3, badge: "كتاب", badgeColor: "bg-amber-600/90" },
  { id: "b4", title: "مبادئ الاقتصاد", subtitle: "د. هدى إبراهيم", image: bookBg4, badge: "كتاب", badgeColor: "bg-amber-600/90" },
  { id: "b5", title: "تعلم اللغة الإنجليزية", subtitle: "أ. منى عادل", image: bookBg1, badge: "كتاب", badgeColor: "bg-amber-600/90" },
  { id: "b6", title: "الكيمياء العضوية", subtitle: "د. طارق مصطفى", image: bookBg2, badge: "كتاب", badgeColor: "bg-amber-600/90" },
];

const booksEn = [
  { id: "b1", title: "Introduction to Computer Science", subtitle: "Dr. Amr Saeed", image: bookBg1, badge: "Book", badgeColor: "bg-amber-600/90" },
  { id: "b2", title: "Fundamentals of Mathematics", subtitle: "Dr. Laila Hassan", image: bookBg2, badge: "Book", badgeColor: "bg-amber-600/90" },
  { id: "b3", title: "General Physics", subtitle: "Dr. Karim Farouk", image: bookBg3, badge: "Book", badgeColor: "bg-amber-600/90" },
  { id: "b4", title: "Principles of Economics", subtitle: "Dr. Huda Ibrahim", image: bookBg4, badge: "Book", badgeColor: "bg-amber-600/90" },
  { id: "b5", title: "Learn English Language", subtitle: "Ms. Mona Adel", image: bookBg1, badge: "Book", badgeColor: "bg-amber-600/90" },
  { id: "b6", title: "Organic Chemistry", subtitle: "Dr. Tarek Mostafa", image: bookBg2, badge: "Book", badgeColor: "bg-amber-600/90" },
];

const HomepageSections = () => {
  const { language } = useLanguage();
  const isRtl = language === "ar";

  return (
    <div className="divide-y divide-border/40">
      <HomepageShowcaseCarousel
        title={isRtl ? "الكليات" : "Colleges"}
        emoji="🏛️"
        items={isRtl ? collegesAr : collegesEn}
        isRtl={isRtl}
        autoScrollSpeed={35}
      />
      <HomepageShowcaseCarousel
        title={isRtl ? "المعاهد" : "Institutes"}
        emoji="🏛️"
        items={isRtl ? institutesAr : institutesEn}
        isRtl={isRtl}
        autoScrollSpeed={40}
      />
      <HomepageShowcaseCarousel
        title={isRtl ? "المدارس" : "Schools"}
        emoji="🏫"
        items={isRtl ? schoolsAr : schoolsEn}
        isRtl={isRtl}
        autoScrollSpeed={30}
      />
      <HomepageShowcaseCarousel
        title={isRtl ? "الدورات التعليمية" : "Courses"}
        emoji="📚"
        items={isRtl ? coursesAr : coursesEn}
        isRtl={isRtl}
        autoScrollSpeed={45}
      />
      <HomepageShowcaseCarousel
        title={isRtl ? "الكتب" : "Books"}
        emoji="📖"
        items={isRtl ? booksAr : booksEn}
        isRtl={isRtl}
        autoScrollSpeed={38}
      />
    </div>
  );
};

export default HomepageSections;
