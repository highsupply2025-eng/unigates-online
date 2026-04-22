import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Menu, ExternalLink } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * Dropdown listing every route in the app — for quick admin navigation.
 * Each item opens in a new tab to keep the admin dashboard intact.
 */
const AllPagesDropdown = () => {
  const { language } = useLanguage();
  const ar = (a: string, e: string) => (language === "ar" ? a : e);

  const groups: { title: string; items: { to: string; label: string }[] }[] = [
    {
      title: ar("عام", "General"),
      items: [
        { to: "/", label: ar("الرئيسية", "Home") },
        { to: "/about", label: ar("من نحن", "About") },
        { to: "/contact", label: ar("اتصل بنا", "Contact") },
        { to: "/help-center", label: ar("مركز المساعدة", "Help Center") },
        { to: "/faq", label: ar("الأسئلة الشائعة", "FAQ") },
        { to: "/blog", label: ar("المدونة", "Blog") },
        { to: "/terms", label: ar("الشروط", "Terms") },
        { to: "/privacy", label: ar("الخصوصية", "Privacy") },
        { to: "/partnerships", label: ar("الشراكات", "Partnerships") },
        { to: "/careers", label: ar("الوظائف", "Careers") },
        { to: "/certificates", label: ar("الشهادات", "Certificates") },
      ],
    },
    {
      title: ar("المصادقة", "Auth"),
      items: [
        { to: "/login", label: ar("تسجيل الدخول", "Login") },
        { to: "/signup", label: ar("التسجيل", "Signup") },
        { to: "/forgot-password", label: ar("نسيت كلمة المرور", "Forgot Password") },
        { to: "/reset-password", label: ar("إعادة تعيين", "Reset Password") },
        { to: "/profile", label: ar("الملف الشخصي", "Profile") },
      ],
    },
    {
      title: ar("الكورسات والبث", "Courses & Live"),
      items: [
        { to: "/courses", label: ar("الكورسات", "Courses") },
        { to: "/choose-plan", label: ar("اختيار الخطة", "Choose Plan") },
        { to: "/payment", label: ar("الدفع", "Payment") },
        { to: "/live", label: ar("البث المباشر", "Live Streams") },
      ],
    },
    {
      title: ar("منصة الجامعة", "University Platform"),
      items: [
        { to: "/university-platform", label: ar("منصة الجامعة", "University Platform") },
        { to: "/signup/college", label: ar("تسجيل كلية", "College Registration") },
        { to: "/signup/college/admin", label: ar("أدمن كلية", "College Admin Signup") },
        { to: "/signup/institute", label: ar("تسجيل معهد", "Institute Registration") },
        { to: "/signup/institute/admin", label: ar("أدمن معهد", "Institute Admin Signup") },
        { to: "/institution/dashboard", label: ar("لوحة المؤسسة", "Institution Dashboard") },
        { to: "/institution/results/add", label: ar("إضافة نتيجة", "Add Result") },
        
        { to: "/leadership/dashboard", label: ar("لوحة القيادة", "Leadership Dashboard") },
        { to: "/leadership/quiz-approvals", label: ar("اعتماد الكويزات", "Quiz Approvals") },
      ],
    },
    {
      title: ar("منصة المدرسة", "School Platform"),
      items: [
        { to: "/school-platform", label: ar("منصة المدرسة", "School Platform") },
        { to: "/school-platform/register", label: ar("تسجيل مدرسة", "School Registration") },
        { to: "/school-platform/login", label: ar("دخول المدرسة", "School Login") },
        { to: "/school-platform/signup", label: ar("تسجيل مستخدم مدرسة", "School Signup") },
        { to: "/school/dashboard", label: ar("لوحة المدرسة", "School Dashboard") },
        { to: "/school/teacher/dashboard", label: ar("لوحة المعلم", "Teacher Dashboard") },
        { to: "/school/student/dashboard", label: ar("لوحة طالب المدرسة", "School Student") },
      ],
    },
    {
      title: ar("لوحات الطلاب والمحاضرين", "Students & Lecturers"),
      items: [
        { to: "/student/dashboard", label: ar("لوحة الطالب", "Student Dashboard") },
        { to: "/student/lectures", label: ar("محاضراتي", "My Lectures") },
        { to: "/student/live", label: ar("البث المباشر للطالب", "Student Live") },
        { to: "/student/quizzes", label: ar("كويزاتي", "My Quizzes") },
        { to: "/student/results", label: ar("نتائجي", "My Results") },
        { to: "/student/analytics", label: ar("الإحصائيات", "Analytics") },
        { to: "/lecturer/dashboard", label: ar("لوحة المحاضر", "Lecturer Dashboard") },
      ],
    },
    {
      title: ar("متجر الكتب", "Bookstore"),
      items: [
        { to: "/book-store", label: ar("متجر الكتب", "Book Store") },
        { to: "/book-store/login", label: ar("دخول المتجر", "Bookstore Login") },
        { to: "/book-store/signup", label: ar("تسجيل المتجر", "Bookstore Signup") },
        { to: "/book-store/profile", label: ar("ملف المتجر", "Bookstore Profile") },
      ],
    },
    {
      title: ar("الإدارة", "Admin"),
      items: [
        { to: "/admin/dashboard", label: ar("لوحة الأدمن", "Admin Dashboard") },
      ],
    },
  ];

  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="default" size="sm" className="font-semibold gap-1.5 px-2 sm:px-3">
          <Menu className="w-4 h-4" />
          <span className="hidden sm:inline">{ar("كل الصفحات", "All Pages")}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={4}
        className="w-72 max-h-[80vh] overflow-y-auto p-1 data-[state=open]:animate-none data-[state=closed]:animate-none"
      >
        <div className="flex items-center gap-2 px-2 py-1.5 text-sm font-semibold">
          <ExternalLink className="w-4 h-4 text-primary" />
          {ar("كل صفحات الموقع", "All Site Pages")}
        </div>
        <div className="h-px bg-border my-1" />
        {groups.map((group, gi) => (
          <div key={group.title}>
            <div className="px-2 py-1.5 text-xs text-muted-foreground font-bold uppercase tracking-wider">
              {group.title}
            </div>
            {group.items.map((it) => (
              <Link
                key={it.to}
                to={it.to}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="flex items-center justify-between gap-2 w-full rounded-sm px-2 py-1.5 text-sm hover:bg-accent cursor-pointer"
              >
                <span className="truncate">{it.label}</span>
                <span className="text-[10px] text-muted-foreground shrink-0" dir="ltr">{it.to}</span>
              </Link>
            ))}
            {gi < groups.length - 1 && <div className="h-px bg-border my-1" />}
          </div>
        ))}
      </PopoverContent>
    </Popover>
  );
};

export default AllPagesDropdown;
