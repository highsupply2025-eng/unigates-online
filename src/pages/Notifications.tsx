import { useEffect, useMemo, useState } from "react";
import {
  Bell, CheckCheck, GraduationCap, Home, Radio, Award, Star, ClipboardList,
  Calendar, FileText, Layers, BookOpen, CheckCircle, Link as LinkIcon,
  Plus, User, Users, Landmark, School as SchoolIcon, BookMarked,
  Video, HelpCircle, Download, TrendingUp,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import DashboardMenuDropdown, { type DashboardMenuItem } from "@/components/DashboardMenuDropdown";

interface Notification {
  id: string;
  title_en: string;
  title_ar: string;
  message_en: string;
  message_ar: string;
  notification_type: string;
  is_read: boolean;
  created_at: string;
}

const typeColors: Record<string, string> = {
  general: "bg-blue-100 text-blue-700",
  alert: "bg-red-100 text-red-700",
  success: "bg-green-100 text-green-700",
  info: "bg-purple-100 text-purple-700",
};

// Pick the most relevant role when a user has multiple.
const pickPrimaryRole = (roles: string[]): string | null => {
  const priority = [
    "admin", "lecturer", "dean", "vice_dean", "department_head",
    "school", "teacher", "school_student", "student", "personal",
    "parent", "publisher",
  ];
  for (const r of priority) if (roles.includes(r)) return r;
  return roles[0] ?? null;
};

const Notifications = () => {
  const { t, language, toggleLanguage } = useLanguage();
  const navigate = useNavigate();
  const isRtl = language === "ar";
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      const roles = (data || []).map((r: any) => r.role as string);
      setRole(pickPrimaryRole(roles));
    })();
  }, []);

  const load = async () => {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    setNotifications((data as Notification[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const channel = supabase
      .channel("notifications-page")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const unread = notifications.filter(n => !n.is_read).length;

  const markAsRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllRead = async () => {
    const ids = notifications.filter(n => !n.is_read).map(n => n.id);
    if (!ids.length) return;
    await Promise.all(ids.map(id => supabase.from("notifications").update({ is_read: true }).eq("id", id)));
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return isRtl ? "الآن" : "now";
    if (mins < 60) return isRtl ? `منذ ${mins} د` : `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return isRtl ? `منذ ${hrs} س` : `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return isRtl ? `منذ ${days} ي` : `${days}d ago`;
  };

  // Build the role-specific dropdown menu (mirrors each dashboard's menu).
  const { dashboardPath, subtitle, menuItems, headerTitle, HeaderIcon } = useMemo<{
    dashboardPath: string;
    subtitle: string;
    menuItems: DashboardMenuItem[];
    headerTitle: string;
    HeaderIcon: typeof Home;
  }>(() => {
    const goRoot = (path: string) => () => navigate(path);
    const profileItem: DashboardMenuItem = {
      key: "profile", label: isRtl ? "بيانات الحساب" : "Account Details",
      Icon: User, color: "from-cyan-500 to-cyan-600", onClick: goRoot("/profile"),
    };

    switch (role) {
      case "admin":
        return {
          dashboardPath: "/admin/dashboard",
          subtitle: isRtl ? "لوحة المسؤول" : "Admin Panel",
          headerTitle: isRtl ? "لوحة المسؤول" : "Admin Panel",
          HeaderIcon: SchoolIcon,
          menuItems: [
            { key: "home", label: isRtl ? "الرئيسية" : "Home", Icon: Home, color: "from-blue-500 to-blue-600", onClick: goRoot("/admin/dashboard") },
            { key: "users", label: isRtl ? "المستخدمون" : "Users", Icon: Users, color: "from-emerald-500 to-emerald-600", onClick: goRoot("/admin/dashboard") },
            { key: "schools", label: isRtl ? "المدارس" : "Schools", Icon: SchoolIcon, color: "from-cyan-500 to-cyan-600", onClick: goRoot("/admin/dashboard") },
            { key: "colleges", label: isRtl ? "الكليات/المعاهد" : "Colleges/Institutes", Icon: Landmark, color: "from-indigo-500 to-indigo-600", onClick: goRoot("/admin/dashboard") },
            { key: "courses", label: isRtl ? "الدورات" : "Courses", Icon: BookOpen, color: "from-amber-500 to-amber-600", onClick: goRoot("/admin/dashboard") },
            { key: "books", label: isRtl ? "الكتب" : "Books", Icon: BookMarked, color: "from-pink-500 to-pink-600", onClick: goRoot("/admin/dashboard") },
            profileItem,
          ],
        };

      case "lecturer":
        return {
          dashboardPath: "/lecturer/dashboard",
          subtitle: isRtl ? "لوحة المحاضر" : "Lecturer Panel",
          headerTitle: isRtl ? "لوحة المحاضر" : "Lecturer Panel",
          HeaderIcon: Video,
          menuItems: [
            { key: "home", label: isRtl ? "الرئيسية" : "Home", Icon: Home, color: "from-blue-500 to-blue-600", onClick: goRoot("/lecturer/dashboard") },
            { key: "courses", label: isRtl ? "المحاضرات" : "Lectures", Icon: Video, color: "from-indigo-500 to-indigo-600", onClick: goRoot("/lecturer/dashboard") },
            { key: "live", label: isRtl ? "البث المباشر" : "Live Stream", Icon: Radio, color: "from-red-500 to-rose-600", onClick: goRoot("/lecturer/dashboard") },
            { key: "quizzes", label: isRtl ? "الاختبارات أونلاين" : "Online Tests", Icon: HelpCircle, color: "from-purple-500 to-purple-600", onClick: goRoot("/lecturer/dashboard") },
            { key: "assignments", label: isRtl ? "التكليفات" : "Assignments", Icon: ClipboardList, color: "from-amber-500 to-amber-600", onClick: goRoot("/lecturer/dashboard") },
            { key: "schedules", label: isRtl ? "الجداول" : "Schedules", Icon: Calendar, color: "from-pink-500 to-pink-600", onClick: goRoot("/lecturer/dashboard") },
            { key: "attendance", label: isRtl ? "الحضور" : "Attendance", Icon: Users, color: "from-emerald-500 to-emerald-600", onClick: goRoot("/lecturer/dashboard") },
            { key: "ratings", label: isRtl ? "التقييمات" : "Ratings", Icon: Star, color: "from-yellow-500 to-amber-600", onClick: goRoot("/lecturer/dashboard") },
            { key: "analytics", label: isRtl ? "تحميل التقارير" : "Export Reports", Icon: Download, color: "from-cyan-500 to-cyan-600", onClick: goRoot("/lecturer/dashboard") },
            { key: "quiz-results", label: isRtl ? "نتائج الاختبارات" : "Quiz Results", Icon: Award, color: "from-teal-500 to-teal-600", onClick: goRoot("/quiz-results") },
            profileItem,
          ],
        };

      case "student":
      case "personal":
        return {
          dashboardPath: "/student/dashboard",
          subtitle: isRtl ? "لوحة الطالب" : "Student Dashboard",
          headerTitle: isRtl ? "لوحة الطالب" : "Student Dashboard",
          HeaderIcon: GraduationCap,
          menuItems: [
            { key: "home", label: isRtl ? "الرئيسية" : "Home", Icon: Home, color: "from-blue-500 to-blue-600", onClick: goRoot("/student") },
            { key: "lectures", label: isRtl ? "المحاضرات" : "Lectures", Icon: BookOpen, color: "from-indigo-500 to-indigo-600", onClick: goRoot("/student/lectures") },
            { key: "live", label: isRtl ? "البث المباشر" : "Live Streams", Icon: Radio, color: "from-red-500 to-rose-600", onClick: goRoot("/student/live") },
            { key: "quizzes", label: isRtl ? "الاختبارات أونلاين" : "Online Tests", Icon: ClipboardList, color: "from-purple-500 to-purple-600", onClick: goRoot("/student/quizzes") },
            { key: "assignments", label: isRtl ? "التكليفات" : "Assignments", Icon: FileText, color: "from-amber-500 to-amber-600", onClick: goRoot("/student/assignments") },
            { key: "schedules", label: isRtl ? "الجداول" : "Schedules", Icon: Calendar, color: "from-pink-500 to-pink-600", onClick: goRoot("/student/schedules") },
            { key: "attendance", label: isRtl ? "الحضور" : "Attendance", Icon: Users, color: "from-emerald-500 to-emerald-600", onClick: goRoot("/student/attendance") },
            { key: "ratings", label: isRtl ? "التقييمات" : "Ratings", Icon: Star, color: "from-yellow-500 to-amber-600", onClick: goRoot("/student/ratings") },
            { key: "results", label: isRtl ? "نتائج الاختبارات" : "Exam Results", Icon: Award, color: "from-teal-500 to-teal-600", onClick: goRoot("/student/results") },
            { key: "analytics", label: isRtl ? "تحميل التقارير" : "Export Reports", Icon: TrendingUp, color: "from-cyan-500 to-cyan-600", onClick: goRoot("/student/analytics") },
            { key: "academic", label: isRtl ? "حسابي الأكاديمي" : "My Academic", Icon: GraduationCap, color: "from-green-500 to-green-600", onClick: goRoot("/student/my-academic") },
            profileItem,
          ],
        };

      case "school_student":
        return {
          dashboardPath: "/school/student/dashboard",
          subtitle: isRtl ? "الطالب المدرسي" : "School Student",
          headerTitle: isRtl ? "الطالب المدرسي" : "School Student",
          HeaderIcon: GraduationCap,
          menuItems: [
            { key: "home", label: isRtl ? "الرئيسية" : "Home", Icon: Home, color: "from-blue-500 to-blue-600", onClick: goRoot("/school/student/dashboard") },
            { key: "courses", label: isRtl ? "موادي" : "My Subjects", Icon: BookOpen, color: "from-emerald-500 to-emerald-600", onClick: goRoot("/school/student/dashboard") },
            { key: "live", label: isRtl ? "البث المباشر" : "Live", Icon: Radio, color: "from-red-500 to-rose-600", onClick: goRoot("/school/student/dashboard") },
            { key: "homework", label: isRtl ? "الواجبات" : "Homework", Icon: CheckCircle, color: "from-amber-500 to-amber-600", onClick: goRoot("/school/student/dashboard") },
            { key: "ratings", label: isRtl ? "التقييمات" : "Ratings", Icon: Star, color: "from-yellow-500 to-amber-600", onClick: goRoot("/school/student/dashboard") },
            profileItem,
          ],
        };

      case "dean":
      case "vice_dean":
      case "department_head":
        return {
          dashboardPath: "/leadership/dashboard",
          subtitle: isRtl ? "لوحة القيادة" : "Leadership Panel",
          headerTitle: isRtl ? "لوحة القيادة" : "Leadership Panel",
          HeaderIcon: Landmark,
          menuItems: [
            { key: "overview", label: isRtl ? "الرئيسية" : "Home", Icon: Home, color: "from-blue-500 to-blue-600", onClick: goRoot("/leadership/dashboard") },
            { key: "livestreams", label: isRtl ? "البث المباشر" : "Live Streams", Icon: Radio, color: "from-red-500 to-rose-600", onClick: goRoot("/leadership/dashboard") },
            { key: "quizresults", label: isRtl ? "نتائج الاختبارات" : "Quiz Results", Icon: Award, color: "from-indigo-500 to-indigo-600", onClick: goRoot("/leadership/dashboard") },
            { key: "ratings", label: isRtl ? "التقييمات" : "Ratings", Icon: Star, color: "from-yellow-500 to-amber-600", onClick: goRoot("/leadership/dashboard") },
            { key: "assignments", label: isRtl ? "التكليفات" : "Assignments", Icon: ClipboardList, color: "from-orange-500 to-orange-600", onClick: goRoot("/leadership/dashboard") },
            { key: "schedule", label: isRtl ? "الجداول" : "Schedules", Icon: Calendar, color: "from-pink-500 to-pink-600", onClick: goRoot("/leadership/dashboard") },
            { key: "files", label: isRtl ? "الملفات" : "Files", Icon: FileText, color: "from-indigo-500 to-indigo-600", onClick: goRoot("/leadership/dashboard") },
            profileItem,
          ],
        };

      case "school":
        return {
          dashboardPath: "/school/dashboard",
          subtitle: isRtl ? "لوحة المدرسة" : "School Panel",
          headerTitle: isRtl ? "لوحة المدرسة" : "School Panel",
          HeaderIcon: SchoolIcon,
          menuItems: [
            { key: "home", label: isRtl ? "الرئيسية" : "Home", Icon: Home, color: "from-blue-500 to-blue-600", onClick: goRoot("/school/dashboard") },
            { key: "new-class", label: isRtl ? "فصل جديد" : "New Class", Icon: Plus, color: "from-emerald-500 to-emerald-600", onClick: goRoot("/school/dashboard") },
            profileItem,
          ],
        };

      case "teacher":
        return {
          dashboardPath: "/school/teacher/dashboard",
          subtitle: isRtl ? "لوحة المعلم" : "Teacher Panel",
          headerTitle: isRtl ? "لوحة المعلم" : "Teacher Panel",
          HeaderIcon: GraduationCap,
          menuItems: [
            { key: "home", label: isRtl ? "الرئيسية" : "Home", Icon: Home, color: "from-blue-500 to-blue-600", onClick: goRoot("/school/teacher/dashboard") },
            { key: "courses", label: isRtl ? "المواد" : "Subjects", Icon: BookOpen, color: "from-emerald-500 to-emerald-600", onClick: goRoot("/school/teacher/dashboard") },
            { key: "live", label: isRtl ? "الحصص المباشرة" : "Live Classes", Icon: Radio, color: "from-red-500 to-rose-600", onClick: goRoot("/school/teacher/dashboard") },
            { key: "homework", label: isRtl ? "الواجبات" : "Homework", Icon: ClipboardList, color: "from-amber-500 to-amber-600", onClick: goRoot("/school/teacher/dashboard") },
            { key: "schedules", label: isRtl ? "الجداول" : "Schedules", Icon: Calendar, color: "from-purple-500 to-purple-600", onClick: goRoot("/school/teacher/dashboard") },
            { key: "ratings", label: isRtl ? "التقييمات" : "Ratings", Icon: Star, color: "from-yellow-500 to-amber-600", onClick: goRoot("/school/teacher/dashboard") },
            profileItem,
          ],
        };

      default: {
        return {
          dashboardPath: "/institution/dashboard",
          subtitle: isRtl ? "لوحة التحكم" : "Dashboard",
          headerTitle: isRtl ? "لوحة التحكم" : "Dashboard",
          HeaderIcon: Landmark,
          menuItems: [
            { key: "general", label: isRtl ? "الرئيسية" : "Home", Icon: Layers, color: "from-blue-500 to-blue-600", onClick: goRoot("/institution/dashboard") },
            { key: "departments", label: isRtl ? "الأقسام" : "Departments", Icon: BookOpen, color: "from-emerald-500 to-emerald-600", onClick: goRoot("/institution/dashboard?tab=departments") },
            { key: "quizresults", label: isRtl ? "النتائج" : "Results", Icon: CheckCircle, color: "from-indigo-500 to-indigo-600", onClick: goRoot("/institution/dashboard?tab=quizresults") },
            { key: "invitations", label: isRtl ? "الدعوات" : "Invitations", Icon: LinkIcon, color: "from-purple-500 to-purple-600", onClick: goRoot("/institution/dashboard?tab=invitations") },
            profileItem,
          ],
        };
      }
    }
  }, [role, isRtl, navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/university-platform");
  };

  // Unified header — matches the dashboard header style across all roles.
  const UnifiedHeader = (
    <header className="border-b border-border px-3 sm:px-6 py-3 sm:py-4 sticky top-0 z-30 bg-gradient-to-r from-primary/10 to-primary/5 backdrop-blur">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 order-1">
          <DashboardMenuDropdown
            title={subtitle}
            onLanguageToggle={toggleLanguage}
            onLogout={handleLogout}
            items={menuItems}
          />
        </div>
        <Link to={dashboardPath} className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 justify-end order-2">
          <div className="min-w-0 flex-1 text-end">
            <h1 className="text-base sm:text-xl font-black text-foreground truncate">{headerTitle}</h1>
            <p className="text-[10px] sm:text-xs text-muted-foreground font-bold truncate">{isRtl ? "الإشعارات" : "Notifications"}</p>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/30 flex items-center justify-center shrink-0">
            <HeaderIcon className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
          </div>
        </Link>
      </div>
    </header>
  );

  return (
    <div className="min-h-screen bg-background" dir={isRtl ? "rtl" : "ltr"}>
      {UnifiedHeader}
      <main className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-4 py-4 sm:py-6">
        <div className="mb-6 text-start">
          <h2 className="text-2xl sm:text-3xl font-black text-foreground flex items-center gap-2 flex-wrap">
            {isRtl ? "كل الإشعارات" : "All Notifications"}
            {unread > 0 && (
              <Badge className="bg-destructive text-destructive-foreground">
                {unread} {isRtl ? "جديد" : "new"}
              </Badge>
            )}
          </h2>
          <p className="text-sm text-muted-foreground font-bold mt-1">
            {isRtl ? "إدارة وعرض جميع الإشعارات" : "Manage and view all notifications"}
          </p>
          {unread > 0 && (
            <Button size="sm" variant="outline" onClick={markAllRead} className="gap-1.5 mt-3">
              <CheckCheck className="w-4 h-4" />
              {isRtl ? "تعليم الكل كمقروء" : "Mark all read"}
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : notifications.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">
              <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-semibold">{isRtl ? "لا توجد إشعارات" : "No notifications"}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {notifications.map(n => (
              <Card
                key={n.id}
                onClick={() => { if (!n.is_read) markAsRead(n.id); }}
                className={`cursor-pointer transition-colors hover:bg-muted/40 ${!n.is_read ? "border-primary/40 bg-primary/5" : ""}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {!n.is_read && <span className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-bold text-sm text-foreground">{isRtl ? n.title_ar : n.title_en}</span>
                        <Badge className={`text-[10px] ${typeColors[n.notification_type] || typeColors.general}`}>
                          {n.notification_type}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{isRtl ? n.message_ar : n.message_en}</p>
                      <p className="text-xs text-muted-foreground/70 mt-1.5">{timeAgo(n.created_at)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Notifications;
