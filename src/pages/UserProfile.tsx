import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  User, Mail, Phone, Calendar, BookOpen, GraduationCap,
  ClipboardCheck, FileText, Radio, Wallet, Award, TrendingUp, Clock, LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import StudentPageHeader from "@/components/StudentPageHeader";

interface ProfileData {
  full_name: string;
  email: string;
  phone: string;
  role: string;
  platform: string;
  created_at: string;
}

interface Subscription {
  id: string;
  plan_type: string;
  amount_paid: number;
  status: string;
  starts_at: string;
  expires_at: string | null;
  course: { id: string; title_ar: string; title_en: string; instructor_ar: string; instructor_en: string; thumbnail_url: string | null; category_ar: string; category_en: string } | null;
}

interface QuizSub {
  id: string;
  score: number;
  total_points: number;
  submitted_at: string;
  quiz: { title_ar: string; title_en: string } | null;
}

interface AssignmentSub {
  id: string;
  grade: string | null;
  submitted_at: string;
  assignment: { title_ar: string; title_en: string } | null;
}

const UserProfile = () => {
  const { dir, language } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [quizSubs, setQuizSubs] = useState<QuizSub[]>([]);
  const [assignSubs, setAssignSubs] = useState<AssignmentSub[]>([]);
  const [attendCount, setAttendCount] = useState(0);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/login"); return; }

    const [{ data: profileData }, { data: subsData }, { data: qData }, { data: aData }, { count: attCount }] = await Promise.all([
      supabase.from("profiles").select("full_name, email, phone, role, platform, created_at").eq("user_id", user.id).single(),
      supabase.from("user_subscriptions").select("id, plan_type, amount_paid, status, starts_at, expires_at, course:courses(id, title_ar, title_en, instructor_ar, instructor_en, thumbnail_url, category_ar, category_en)").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("quiz_submissions").select("id, score, total_points, submitted_at, quiz:quizzes(title_ar, title_en)").eq("student_id", user.id).order("submitted_at", { ascending: false }).limit(10),
      supabase.from("assignment_submissions").select("id, grade, submitted_at, assignment:assignments(title_ar, title_en)").eq("student_id", user.id).order("submitted_at", { ascending: false }).limit(10),
      supabase.from("stream_attendance").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    ]);

    setProfile(profileData);
    setSubs((subsData as any) || []);
    setQuizSubs((qData as any) || []);
    setAssignSubs((aData as any) || []);
    setAttendCount(attCount || 0);
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (!profile) return null;

  const activeSubs = subs.filter(s => s.status === "active");
  const totalSpent = subs.reduce((sum, s) => sum + Number(s.amount_paid || 0), 0);
  const avgQuiz = quizSubs.length
    ? Math.round(quizSubs.reduce((sum, q) => sum + (q.total_points ? (q.score / q.total_points) * 100 : 0), 0) / quizSubs.length)
    : 0;

  const roleLabel = (r: string) => {
    const map: Record<string, { ar: string; en: string }> = {
      student: { ar: "طالب جامعي", en: "University Student" },
      school_student: { ar: "طالب مدرسي", en: "School Student" },
      lecturer: { ar: "محاضر", en: "Lecturer" },
      teacher: { ar: "معلم", en: "Teacher" },
      personal: { ar: "حساب شخصي", en: "Personal" },
      admin: { ar: "مسؤول", en: "Admin" },
    };
    return map[r]?.[language] || r;
  };

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      <StudentPageHeader
        titleAr="بيانات الطالب"
        titleEn="Student Profile"
        icon={<User className="w-4 h-4" />}
      />

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Profile Card */}
        <Card className="border-s-4 border-s-primary shadow-md">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shrink-0 shadow-lg shadow-primary/30">
                <User className="w-12 h-12 text-primary-foreground" />
              </div>
              <div className="flex-1 text-center sm:text-start">
                <h2 className="text-2xl font-extrabold text-foreground mb-2 tracking-tight">{profile.full_name}</h2>
                <div className="flex flex-wrap justify-center sm:justify-start gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5"><Mail className="w-4 h-4" />{profile.email}</span>
                  <span className="flex items-center gap-1.5"><Phone className="w-4 h-4" />{profile.phone}</span>
                  <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />{language === "ar" ? "انضم في" : "Joined"} {new Date(profile.created_at).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US")}</span>
                </div>
                <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3">
                  <Badge className="bg-gradient-to-r from-primary to-primary/70 text-primary-foreground">{roleLabel(profile.role)}</Badge>
                  <Badge variant="outline">{profile.platform === "bookstore" ? (language === "ar" ? "متجر الكتب" : "Book Store") : profile.platform === "school" ? (language === "ar" ? "المدرسة" : "School") : (language === "ar" ? "الدورات" : "Courses")}</Badge>
                </div>
              </div>
              <Button variant="outline" onClick={handleLogout} className="shrink-0">
                <LogOut className="w-4 h-4 me-2" />
                {language === "ar" ? "تسجيل خروج" : "Logout"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard icon={<GraduationCap className="w-5 h-5" />} value={activeSubs.length} label={language === "ar" ? "دورات نشطة" : "Active Courses"} color="from-blue-500 to-indigo-600" />
          <StatCard icon={<ClipboardCheck className="w-5 h-5" />} value={quizSubs.length} label={language === "ar" ? "اختبارات" : "Quizzes Taken"} color="from-violet-500 to-purple-600" />
          <StatCard icon={<FileText className="w-5 h-5" />} value={assignSubs.length} label={language === "ar" ? "واجبات مسلَّمة" : "Assignments"} color="from-amber-500 to-orange-600" />
          <StatCard icon={<Radio className="w-5 h-5" />} value={attendCount} label={language === "ar" ? "بثوث حضرتها" : "Live Attended"} color="from-rose-500 to-red-600" />
          <StatCard icon={<Award className="w-5 h-5" />} value={`${avgQuiz}%`} label={language === "ar" ? "متوسط الاختبارات" : "Avg Quiz Score"} color="from-emerald-500 to-green-600" />
        </div>

        {/* Total spent */}
        <Card className="border-s-4 border-s-emerald-500 bg-gradient-to-r from-emerald-500/5 to-transparent">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{language === "ar" ? "إجمالي المدفوعات" : "Total Spent"}</p>
                <p className="text-2xl font-extrabold text-foreground">{totalSpent.toFixed(0)} <span className="text-base font-bold text-muted-foreground">{language === "ar" ? "ج.م" : "EGP"}</span></p>
              </div>
            </div>
            <TrendingUp className="w-8 h-8 text-emerald-500/40" />
          </CardContent>
        </Card>

        {/* Subscribed courses */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-extrabold">
              <BookOpen className="w-5 h-5 text-primary" />
              {language === "ar" ? "دوراتي" : "My Courses"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {subs.length === 0 ? (
              <Empty icon={<BookOpen className="w-14 h-14" />} text={language === "ar" ? "لم تشترك في أي دورة بعد" : "No course subscriptions yet"} cta={{ to: "/courses", label: language === "ar" ? "تصفح الدورات" : "Browse Courses" }} />
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {subs.map(s => (
                  <Link key={s.id} to={s.course ? `/courses/${s.course.id}` : "#"} className="flex gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 hover:shadow-md transition-all">
                    {s.course?.thumbnail_url ? (
                      <img src={s.course.thumbnail_url} alt="" className="w-20 h-20 rounded object-cover shrink-0" />
                    ) : (
                      <div className="w-20 h-20 rounded bg-muted flex items-center justify-center shrink-0"><BookOpen className="w-8 h-8 text-muted-foreground" /></div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-foreground truncate">{language === "ar" ? s.course?.title_ar : s.course?.title_en}</p>
                      <p className="text-xs text-muted-foreground truncate">{language === "ar" ? s.course?.instructor_ar : s.course?.instructor_en}</p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <Badge variant={s.status === "active" ? "default" : "outline"} className="text-xs">
                          {s.status === "active" ? (language === "ar" ? "نشط" : "Active") : (language === "ar" ? "منتهي" : "Expired")}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{Number(s.amount_paid).toFixed(0)} {language === "ar" ? "ج.م" : "EGP"}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent quizzes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-extrabold">
                <ClipboardCheck className="w-5 h-5 text-violet-600" />
                {language === "ar" ? "آخر الاختبارات" : "Recent Quizzes"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {quizSubs.length === 0 ? (
                <Empty icon={<ClipboardCheck className="w-12 h-12" />} text={language === "ar" ? "لا توجد اختبارات" : "No quizzes yet"} />
              ) : (
                <div className="space-y-2">
                  {quizSubs.map(q => {
                    const pct = q.total_points ? Math.round((q.score / q.total_points) * 100) : 0;
                    return (
                      <div key={q.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-sm text-foreground truncate">{language === "ar" ? q.quiz?.title_ar : q.quiz?.title_en}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Clock className="w-3 h-3" />{new Date(q.submitted_at).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US")}</p>
                        </div>
                        <Badge className={pct >= 50 ? "bg-emerald-100 text-emerald-700 border-emerald-300" : "bg-red-100 text-red-700 border-red-300"}>
                          {q.score}/{q.total_points} ({pct}%)
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent assignments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-extrabold">
                <FileText className="w-5 h-5 text-amber-600" />
                {language === "ar" ? "آخر الواجبات" : "Recent Assignments"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {assignSubs.length === 0 ? (
                <Empty icon={<FileText className="w-12 h-12" />} text={language === "ar" ? "لا توجد واجبات" : "No assignments yet"} />
              ) : (
                <div className="space-y-2">
                  {assignSubs.map(a => (
                    <div key={a.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-sm text-foreground truncate">{language === "ar" ? a.assignment?.title_ar : a.assignment?.title_en}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Clock className="w-3 h-3" />{new Date(a.submitted_at).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US")}</p>
                      </div>
                      <Badge variant={a.grade ? "default" : "outline"}>
                        {a.grade || (language === "ar" ? "بانتظار التقييم" : "Pending")}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

const StatCard = ({ icon, value, label, color }: { icon: React.ReactNode; value: string | number; label: string; color: string }) => (
  <Card className="hover:shadow-lg hover:-translate-y-0.5 transition-all">
    <CardContent className="pt-5 pb-4 text-center">
      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${color} text-white flex items-center justify-center mx-auto mb-2 shadow-md`}>{icon}</div>
      <p className="text-2xl font-extrabold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </CardContent>
  </Card>
);

const Empty = ({ icon, text, cta }: { icon: React.ReactNode; text: string; cta?: { to: string; label: string } }) => (
  <div className="text-center py-8 text-muted-foreground">
    <div className="mx-auto mb-3 opacity-30 flex justify-center">{icon}</div>
    <p>{text}</p>
    {cta && <Button asChild className="mt-4"><Link to={cta.to}>{cta.label}</Link></Button>}
  </div>
);

export default UserProfile;
