import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  GraduationCap, Globe, BookOpen, Play, Lock, CheckCircle, Clock,
  ArrowLeft, ArrowRight, Crown, BarChart3, Award, Radio, User, Star,
  FileText, Download, ClipboardList, Calendar, TrendingUp, Timer
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import NotificationBell from "@/components/NotificationBell";

const StudentDashboard = () => {
  const { t, dir, language, toggleLanguage } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isRtl = language === "ar";

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("courses");

  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [progress, setProgress] = useState<any[]>([]);
  const [liveStreams, setLiveStreams] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [ratings, setRatings] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [quizSubmissions, setQuizSubmissions] = useState<any[]>([]);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [attachments, setAttachments] = useState<any[]>([]);

  // Quiz taking state
  const [activeQuiz, setActiveQuiz] = useState<any>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizTimer, setQuizTimer] = useState(0);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);

  // Rating state
  const [ratingCourseId, setRatingCourseId] = useState<string | null>(null);
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [savingRating, setSavingRating] = useState(false);

  useEffect(() => { checkAuth(); }, []);

  // Quiz timer
  useEffect(() => {
    if (!activeQuiz) return;
    const interval = setInterval(() => setQuizTimer(prev => prev + 1), 1000);
    return () => clearInterval(interval);
  }, [activeQuiz]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/login"); return; }
    setUser(user);

    const { data: profileData } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();
    setProfile(profileData);

    await Promise.all([
      loadSubscriptions(user.id),
      loadProgress(user.id),
      loadLiveStreams(),
      loadSubmissions(user.id),
      loadRatings(user.id),
      loadQuizzes(),
      loadQuizSubmissions(user.id),
      loadSchedules(),
      loadAttendance(user.id),
      loadAttachments(),
    ]);
    setLoading(false);
  };

  const loadSubscriptions = async (userId: string) => {
    const { data: subs } = await supabase.from("user_subscriptions").select("*").eq("user_id", userId).eq("status", "active");
    setSubscriptions(subs || []);
    if (subs && subs.length > 0) {
      const courseIds = [...new Set(subs.map(s => s.course_id))];
      const { data: coursesData } = await supabase.from("courses").select("*").in("id", courseIds);
      setCourses(coursesData || []);
    }
    const { data: allCourses } = await supabase.from("courses").select("*").order("created_at", { ascending: false }).limit(20);
    if (!subs || subs.length === 0) setCourses(allCourses || []);
  };

  const loadProgress = async (userId: string) => {
    const { data } = await supabase.from("student_progress").select("*").eq("user_id", userId);
    setProgress(data || []);
  };

  const loadLiveStreams = async () => {
    const { data } = await supabase.from("live_streams").select("*").in("status", ["live", "scheduled"]).order("scheduled_at", { ascending: true }).limit(10);
    setLiveStreams(data || []);
  };

  const loadSubmissions = async (userId: string) => {
    const { data } = await supabase.from("assignment_submissions").select("*").eq("student_id", userId).order("submitted_at", { ascending: false });
    setSubmissions(data || []);
  };

  const loadRatings = async (userId: string) => {
    const { data } = await supabase.from("lecturer_ratings").select("*").eq("student_id", userId);
    setRatings(data || []);
  };

  const loadQuizzes = async () => {
    const { data } = await supabase.from("quizzes").select("*").eq("is_published", true).order("created_at", { ascending: false });
    setQuizzes(data || []);
  };

  const loadQuizSubmissions = async (userId: string) => {
    const { data } = await supabase.from("quiz_submissions").select("*").eq("student_id", userId);
    setQuizSubmissions(data || []);
  };

  const loadSchedules = async () => {
    const { data } = await supabase.from("lecture_schedules").select("*").order("scheduled_date", { ascending: true });
    setSchedules(data || []);
  };

  const loadAttendance = async (userId: string) => {
    const { data } = await supabase.from("stream_attendance").select("*").eq("user_id", userId);
    setAttendance(data || []);
  };

  const loadAttachments = async () => {
    const { data } = await supabase.from("course_attachments").select("*").order("created_at", { ascending: false });
    setAttachments(data || []);
  };

  const handleLogout = async () => { await supabase.auth.signOut(); navigate("/"); };

  const getCourseName = (courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    return course ? (isRtl ? course.title_ar : course.title_en) : "—";
  };

  const getCourseProgress = (courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    if (!course || course.episode_count === 0) return 0;
    const completed = progress.filter(p => p.course_id === courseId && p.completed).length;
    return Math.round((completed / course.episode_count) * 100);
  };

  // Start quiz
  const startQuiz = async (quiz: any) => {
    const alreadySubmitted = quizSubmissions.find(qs => qs.quiz_id === quiz.id);
    if (alreadySubmitted) {
      toast({ title: isRtl ? "تم الحل مسبقاً" : "Already submitted", description: isRtl ? "لقد حللت هذا الاختبار بالفعل" : "You already submitted this quiz", variant: "destructive" });
      return;
    }
    const { data: questions } = await supabase.from("quiz_questions").select("*").eq("quiz_id", quiz.id).order("question_order");
    setQuizQuestions(questions || []);
    setActiveQuiz(quiz);
    setQuizAnswers({});
    setQuizTimer(0);
  };

  // Submit quiz
  const submitQuiz = async () => {
    if (!activeQuiz || !user) return;
    setSubmittingQuiz(true);
    try {
      let score = 0;
      let totalPoints = 0;
      quizQuestions.forEach(q => {
        totalPoints += q.points;
        if (quizAnswers[q.id] === q.correct_answer) score += q.points;
      });

      const { error } = await supabase.from("quiz_submissions").insert({
        quiz_id: activeQuiz.id,
        student_id: user.id,
        answers: quizAnswers,
        score,
        total_points: totalPoints,
      });
      if (error) throw error;
      toast({ title: isRtl ? "تم التسليم" : "Submitted!", description: isRtl ? `حصلت على ${score}/${totalPoints}` : `You scored ${score}/${totalPoints}` });
      setActiveQuiz(null);
      setQuizQuestions([]);
      setQuizAnswers({});
      await loadQuizSubmissions(user.id);
    } catch (err: any) {
      toast({ title: isRtl ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    } finally { setSubmittingQuiz(false); }
  };

  const handleSubmitRating = async () => {
    if (!user || !ratingCourseId || ratingValue === 0) return;
    setSavingRating(true);
    try {
      const course = courses.find(c => c.id === ratingCourseId);
      const { error } = await supabase.from("lecturer_ratings").upsert({
        student_id: user.id,
        lecturer_id: course?.creator_id || user.id,
        course_id: ratingCourseId,
        rating: ratingValue,
        comment: ratingComment || null,
      }, { onConflict: "student_id,course_id" });
      if (error) throw error;
      toast({ title: isRtl ? "تم" : "Done", description: isRtl ? "تم إرسال التقييم بنجاح" : "Rating submitted" });
      setRatingCourseId(null); setRatingValue(0); setRatingComment("");
      await loadRatings(user.id);
    } catch (err: any) {
      toast({ title: isRtl ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    } finally { setSavingRating(false); }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // PDF Export
  const exportAnalyticsPDF = (section: string) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    let content = '';
    const title = isRtl ? 'تقرير تحليلات الطالب' : 'Student Analytics Report';

    if (section === 'all' || section === 'quizResults') {
      content += `<h2>${isRtl ? 'نتائج الاختبارات' : 'Quiz Results'}</h2><table border="1" cellpadding="8" cellspacing="0" style="width:100%;border-collapse:collapse"><tr><th>${isRtl ? 'الاختبار' : 'Quiz'}</th><th>${isRtl ? 'الدرجة' : 'Score'}</th><th>${isRtl ? 'التاريخ' : 'Date'}</th></tr>`;
      quizSubmissions.forEach(qs => {
        const quiz = quizzes.find(q => q.id === qs.quiz_id);
        content += `<tr><td>${quiz ? (isRtl ? quiz.title_ar : quiz.title_en) : '—'}</td><td>${qs.score}/${qs.total_points}</td><td>${new Date(qs.submitted_at).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US')}</td></tr>`;
      });
      content += '</table><br/>';
    }

    if (section === 'all' || section === 'assignments') {
      content += `<h2>${isRtl ? 'التكليفات' : 'Assignments'}</h2><table border="1" cellpadding="8" cellspacing="0" style="width:100%;border-collapse:collapse"><tr><th>${isRtl ? 'الملف' : 'File'}</th><th>${isRtl ? 'الدرجة' : 'Grade'}</th><th>${isRtl ? 'التاريخ' : 'Date'}</th></tr>`;
      submissions.forEach(sub => {
        content += `<tr><td>${sub.file_name || '—'}</td><td>${sub.grade || (isRtl ? 'قيد التقييم' : 'Pending')}</td><td>${new Date(sub.submitted_at).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US')}</td></tr>`;
      });
      content += '</table><br/>';
    }

    if (section === 'all' || section === 'attendance') {
      content += `<h2>${isRtl ? 'سجل الحضور' : 'Attendance'}</h2><table border="1" cellpadding="8" cellspacing="0" style="width:100%;border-collapse:collapse"><tr><th>${isRtl ? 'البث' : 'Stream'}</th><th>${isRtl ? 'الانضمام' : 'Joined'}</th><th>${isRtl ? 'المدة (دقيقة)' : 'Duration (min)'}</th></tr>`;
      attendance.forEach(a => {
        const stream = liveStreams.find(s => s.id === a.stream_id);
        content += `<tr><td>${stream ? (isRtl ? stream.title_ar : stream.title_en) : a.stream_id.slice(0, 8)}</td><td>${new Date(a.joined_at).toLocaleString(isRtl ? 'ar-EG' : 'en-US')}</td><td>${a.duration_minutes || 0}</td></tr>`;
      });
      content += '</table><br/>';
    }

    if (section === 'all' || section === 'ratings') {
      content += `<h2>${isRtl ? 'تقييمات المحاضرين' : 'Lecturer Ratings'}</h2><table border="1" cellpadding="8" cellspacing="0" style="width:100%;border-collapse:collapse"><tr><th>${isRtl ? 'الدورة' : 'Course'}</th><th>${isRtl ? 'التقييم' : 'Rating'}</th><th>${isRtl ? 'التعليق' : 'Comment'}</th></tr>`;
      ratings.forEach(r => {
        content += `<tr><td>${getCourseName(r.course_id)}</td><td>${r.rating}/5</td><td>${r.comment || '—'}</td></tr>`;
      });
      content += '</table>';
    }

    printWindow.document.write(`<!DOCTYPE html><html dir="${dir}"><head><meta charset="UTF-8"><title>${title}</title><style>body{font-family:Arial,sans-serif;padding:30px;direction:${dir}}h1{color:#1a1a2e;border-bottom:2px solid #1a1a2e;padding-bottom:10px}h2{color:#16213e;margin-top:20px}table{font-size:13px}th{background:#f0f0f0}@media print{body{-webkit-print-color-adjust:exact}}</style></head><body><h1>${title}</h1><p>${isRtl ? 'الطالب' : 'Student'}: ${profile?.full_name || ''} | ${new Date().toLocaleDateString(isRtl ? 'ar-EG' : 'en-US')}</p>${content}</body></html>`);
    printWindow.document.close();
    printWindow.print();
  };

  const subscribedCourseIds = subscriptions.map(s => s.course_id);
  const subscribedCourses = courses.filter(c => subscribedCourseIds.includes(c.id));
  const totalCompleted = progress.filter(p => p.completed).length;

  // Quizzes available for subscribed courses
  const availableQuizzes = quizzes.filter(q => subscribedCourseIds.includes(q.course_id));

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  // Active quiz view
  if (activeQuiz) {
    const durationSec = (activeQuiz.duration_minutes || 30) * 60;
    const timeLeft = Math.max(0, durationSec - quizTimer);
    const isTimeUp = timeLeft <= 0;

    if (isTimeUp && !submittingQuiz) {
      submitQuiz();
    }

    return (
      <div className="min-h-screen bg-background" dir={dir}>
        <header className="border-b border-border px-6 py-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <h1 className="text-lg font-bold text-foreground">{isRtl ? activeQuiz.title_ar : activeQuiz.title_en}</h1>
            <div className="flex items-center gap-3">
              <Badge className={`gap-1 ${timeLeft < 60 ? 'bg-red-500 text-white' : 'bg-primary/10 text-primary'}`}>
                <Timer className="w-4 h-4" /> {formatTime(timeLeft)}
              </Badge>
              <span className="text-sm text-muted-foreground">{Object.keys(quizAnswers).length}/{quizQuestions.length}</span>
            </div>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
          {quizQuestions.map((q, idx) => (
            <Card key={q.id}>
              <CardContent className="p-5">
                <p className="font-bold text-foreground mb-4">{idx + 1}. {isRtl ? q.question_ar : q.question_en}</p>
                <div className="grid gap-2">
                  {['a', 'b', 'c', 'd'].map(opt => {
                    const optText = isRtl ? q[`option_${opt}_ar`] : q[`option_${opt}_en`];
                    if (!optText) return null;
                    const selected = quizAnswers[q.id] === opt;
                    return (
                      <button key={opt} onClick={() => setQuizAnswers(prev => ({ ...prev, [q.id]: opt }))}
                        className={`text-start p-3 rounded-lg border transition-all ${selected ? 'border-primary bg-primary/10 font-semibold' : 'border-border hover:border-primary/40'}`}>
                        <span className="font-bold me-2">{opt.toUpperCase()}.</span> {optText}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
          <div className="flex gap-3 justify-center pt-4">
            <Button onClick={submitQuiz} disabled={submittingQuiz} size="lg" className="gap-2">
              <CheckCircle className="w-5 h-5" /> {isRtl ? 'تسليم الاختبار' : 'Submit Quiz'}
            </Button>
            <Button variant="outline" size="lg" onClick={() => { setActiveQuiz(null); setQuizQuestions([]); setQuizAnswers({}); }}>
              {isRtl ? 'إلغاء' : 'Cancel'}
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      {/* Header */}
      <header className="border-b border-border px-3 sm:px-6 py-3 sm:py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
          <Link to="/" className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
            <GraduationCap className="w-7 h-7 sm:w-8 sm:h-8 text-primary shrink-0" />
            <span className="text-lg sm:text-2xl font-black text-foreground tracking-tight truncate">{t.brandName}</span>
            <Badge className="bg-primary/10 text-primary border-primary/20 ms-1 sm:ms-2 hidden xs:inline-flex shrink-0">
              <BookOpen className="w-3 h-3 me-1" />{isRtl ? "لوحة الطالب" : "Student"}
            </Badge>
          </Link>
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <NotificationBell />
            <Button variant="default" size="sm" onClick={toggleLanguage} className="font-semibold gap-1.5 hidden sm:inline-flex">
              <Globe className="w-4 h-4" />{t.langSwitch}
            </Button>
            <Button variant="default" size="icon" onClick={toggleLanguage} className="sm:hidden w-9 h-9">
              <Globe className="w-4 h-4" />
            </Button>
            <Link to="/profile">
              <Button variant="outline" size="sm" className="font-semibold gap-1.5 hidden sm:inline-flex">
                <User className="w-4 h-4" />{isRtl ? "الملف" : "Profile"}
              </Button>
              <Button variant="outline" size="icon" className="sm:hidden w-9 h-9">
                <User className="w-4 h-4" />
              </Button>
            </Link>
            <Button variant="default" size="sm" onClick={handleLogout} className="font-semibold gap-1.5 hidden sm:inline-flex">
              {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
              {t.logout}
            </Button>
            <Button variant="default" size="icon" onClick={handleLogout} className="sm:hidden w-9 h-9">
              {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-3 sm:px-4 py-5 sm:py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-black text-foreground mb-1">
            {isRtl ? `مرحباً ${profile?.full_name || ""}! 👋` : `Welcome ${profile?.full_name || ""}! 👋`}
          </h1>
          <p className="text-muted-foreground">
            {isRtl ? "تابع تقدمك في الدورات واستمر في التعلّم" : "Track your progress and keep learning"}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <Card className="cursor-pointer hover:shadow-lg hover:border-primary/40 transition-all group" onClick={() => setActiveTab("courses")}>
            <CardContent className="pt-6 pb-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/20 transition-colors">
                <BookOpen className="w-7 h-7 text-primary" />
              </div>
              <p className="text-sm font-bold text-foreground">{isRtl ? "المحاضرات" : "Lectures"}</p>
              <p className="text-xs text-muted-foreground mt-1">{subscriptions.length} {isRtl ? "دورة" : "courses"}</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-lg hover:border-primary/40 transition-all group" onClick={() => setActiveTab("live")}>
            <CardContent className="pt-6 pb-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-red-500/20 transition-colors">
                <Radio className="w-7 h-7 text-red-500" />
              </div>
              <p className="text-sm font-bold text-foreground">{isRtl ? "البث المباشر" : "Live Streams"}</p>
              <p className="text-xs text-muted-foreground mt-1">{liveStreams.filter(s => s.status === "live").length} {isRtl ? "مباشر الآن" : "live now"}</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-lg hover:border-primary/40 transition-all group" onClick={() => setActiveTab("quizzes")}>
            <CardContent className="pt-6 pb-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-amber-500/20 transition-colors">
                <ClipboardList className="w-7 h-7 text-amber-500" />
              </div>
              <p className="text-sm font-bold text-foreground">{isRtl ? "الاختبارات" : "Quizzes"}</p>
              <p className="text-xs text-muted-foreground mt-1">{availableQuizzes.length} {isRtl ? "اختبار" : "available"}</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-lg hover:border-primary/40 transition-all group" onClick={() => setActiveTab("analytics")}>
            <CardContent className="pt-6 pb-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-green-500/20 transition-colors">
                <TrendingUp className="w-7 h-7 text-green-600" />
              </div>
              <p className="text-sm font-bold text-foreground">{isRtl ? "التحليلات" : "Analytics"}</p>
              <p className="text-xs text-muted-foreground mt-1">{isRtl ? "تقارير PDF" : "PDF Reports"}</p>
            </CardContent>
          </Card>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3 mb-8">
          <div className="bg-primary/5 rounded-xl p-2 sm:p-3 text-center min-w-0">
            <p className="text-lg sm:text-xl font-black text-primary">{subscriptions.length}</p>
            <p className="text-[10px] text-muted-foreground truncate">{isRtl ? "اشتراكات" : "Subscriptions"}</p>
          </div>
          <div className="bg-green-500/5 rounded-xl p-2 sm:p-3 text-center min-w-0">
            <p className="text-lg sm:text-xl font-black text-green-600">{totalCompleted}</p>
            <p className="text-[10px] text-muted-foreground truncate">{isRtl ? "مكتملة" : "Completed"}</p>
          </div>
          <div className="bg-amber-500/5 rounded-xl p-2 sm:p-3 text-center min-w-0">
            <p className="text-lg sm:text-xl font-black text-amber-500">{quizSubmissions.length}</p>
            <p className="text-[10px] text-muted-foreground truncate">{isRtl ? "اختبارات" : "Quizzes"}</p>
          </div>
          <div className="bg-blue-500/5 rounded-xl p-2 sm:p-3 text-center min-w-0">
            <p className="text-lg sm:text-xl font-black text-blue-500">{attendance.length}</p>
            <p className="text-[10px] text-muted-foreground truncate">{isRtl ? "حضور" : "Attended"}</p>
          </div>
          <div className="bg-red-500/5 rounded-xl p-2 sm:p-3 text-center min-w-0">
            <p className="text-lg sm:text-xl font-black text-red-500">{submissions.length}</p>
            <p className="text-[10px] text-muted-foreground truncate">{isRtl ? "واجبات" : "Tasks"}</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 flex w-full overflow-x-auto md:flex-wrap justify-start md:justify-center scrollbar-hide">
            <TabsTrigger value="courses" className="gap-1.5 shrink-0"><BookOpen className="w-4 h-4" />{isRtl ? "المحاضرات" : "Lectures"}</TabsTrigger>
            <TabsTrigger value="live" className="gap-1.5 shrink-0"><Radio className="w-4 h-4" />{isRtl ? "بث مباشر" : "Live"}</TabsTrigger>
            <TabsTrigger value="quizzes" className="gap-1.5 shrink-0"><ClipboardList className="w-4 h-4" />{isRtl ? "الاختبارات" : "Quizzes"}</TabsTrigger>
            <TabsTrigger value="assignments" className="gap-1.5 shrink-0"><Award className="w-4 h-4" />{isRtl ? "الواجبات" : "Tasks"}</TabsTrigger>
            <TabsTrigger value="files" className="gap-1.5 shrink-0"><FileText className="w-4 h-4" />{isRtl ? "الملفات" : "Files"}</TabsTrigger>
            <TabsTrigger value="schedule" className="gap-1.5 shrink-0"><Calendar className="w-4 h-4" />{isRtl ? "الجداول" : "Schedule"}</TabsTrigger>
            <TabsTrigger value="rate" className="gap-1.5 shrink-0"><Star className="w-4 h-4" />{isRtl ? "التقييم" : "Rating"}</TabsTrigger>
            <TabsTrigger value="analytics" className="gap-1.5 shrink-0"><TrendingUp className="w-4 h-4" />{isRtl ? "التحليلات" : "Analytics"}</TabsTrigger>
          </TabsList>

          {/* My Courses */}
          <TabsContent value="courses">
            {subscribedCourses.length === 0 ? (
              <div className="text-center py-16">
                <BookOpen className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-foreground mb-2">{isRtl ? "لا توجد اشتراكات حالياً" : "No subscriptions yet"}</h3>
                <p className="text-muted-foreground mb-4">{isRtl ? "تصفّح الدورات واشترك في المستوى المناسب لك" : "Browse courses and subscribe to a level"}</p>
                <Link to="/courses"><Button>{isRtl ? "تصفّح الدورات" : "Browse Courses"}</Button></Link>
              </div>
            ) : (
              <div className="grid gap-4">
                {subscribedCourses.map(course => {
                  const prog = getCourseProgress(course.id);
                  const sub = subscriptions.find(s => s.course_id === course.id);
                  return (
                    <Card key={course.id} className="overflow-hidden">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex-1">
                            <h3 className="font-bold text-foreground text-lg">{isRtl ? course.title_ar : course.title_en}</h3>
                            <p className="text-sm text-muted-foreground">{isRtl ? course.instructor_ar : course.instructor_en}</p>
                          </div>
                          <Badge className="bg-primary/10 text-primary border-primary/20">
                            <Crown className="w-3 h-3 me-1" />
                            {isRtl ? `المستوى ${sub?.level_number}` : `Level ${sub?.level_number}`}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3">
                          <Progress value={prog} className="flex-1 h-2" />
                          <span className="text-sm font-bold text-foreground">{prog}%</span>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-xs text-muted-foreground">
                            {progress.filter(p => p.course_id === course.id && p.completed).length}/{course.episode_count} {isRtl ? "حلقة" : "episodes"}
                          </span>
                          <Button size="sm" variant="default" className="gap-1.5">
                            <Play className="w-3.5 h-3.5" />{isRtl ? "متابعة" : "Continue"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Live Streams */}
          <TabsContent value="live">
            {liveStreams.length === 0 ? (
              <div className="text-center py-16">
                <Radio className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-lg text-muted-foreground">{isRtl ? "لا توجد بثوث حالياً" : "No live streams right now"}</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {liveStreams.map(stream => (
                  <Card key={stream.id} className="card-hover">
                    <CardContent className="p-5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${stream.status === "live" ? "bg-red-100" : "bg-muted"}`}>
                          <Radio className={`w-6 h-6 ${stream.status === "live" ? "text-red-500 animate-pulse" : "text-muted-foreground"}`} />
                        </div>
                        <div>
                          <p className="font-bold text-foreground">{isRtl ? stream.title_ar : stream.title_en}</p>
                          {stream.scheduled_at && (
                            <p className="text-xs text-muted-foreground">
                              {new Date(stream.scheduled_at).toLocaleString(isRtl ? "ar-EG" : "en-US")}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={stream.status === "live" ? "bg-red-500 text-white" : "bg-muted text-muted-foreground"}>
                          {stream.status === "live" ? (isRtl ? "مباشر" : "LIVE") : (isRtl ? "قادم" : "Upcoming")}
                        </Badge>
                        {stream.status === "live" && (
                          <Link to={`/stream/${stream.id}`}>
                            <Button size="sm">{isRtl ? "انضم وتحدث" : "Join & Talk"}</Button>
                          </Link>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Quizzes - Solve Online */}
          <TabsContent value="quizzes">
            {availableQuizzes.length === 0 ? (
              <div className="text-center py-16">
                <ClipboardList className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-lg text-muted-foreground">{isRtl ? "لا توجد اختبارات متاحة" : "No quizzes available"}</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {availableQuizzes.map(quiz => {
                  const submitted = quizSubmissions.find(qs => qs.quiz_id === quiz.id);
                  return (
                    <Card key={quiz.id}>
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-bold text-foreground">{isRtl ? quiz.title_ar : quiz.title_en}</h3>
                            <p className="text-sm text-muted-foreground mt-1">{isRtl ? quiz.description_ar : quiz.description_en}</p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1"><Timer className="w-3.5 h-3.5" />{quiz.duration_minutes || 30} {isRtl ? "دقيقة" : "min"}</span>
                              <span>{getCourseName(quiz.course_id)}</span>
                              {quiz.due_date && <span>{new Date(quiz.due_date).toLocaleDateString(isRtl ? "ar-EG" : "en-US")}</span>}
                            </div>
                          </div>
                          {submitted ? (
                            <div className="text-center">
                              <Badge className="bg-green-100 text-green-700 border-green-300 gap-1">
                                <CheckCircle className="w-3 h-3" /> {submitted.score}/{submitted.total_points}
                              </Badge>
                              <p className="text-[10px] text-muted-foreground mt-1">{isRtl ? "تم الحل" : "Completed"}</p>
                            </div>
                          ) : (
                            <Button size="sm" onClick={() => startQuiz(quiz)} className="gap-1.5">
                              <Play className="w-4 h-4" /> {isRtl ? "ابدأ الاختبار" : "Start Quiz"}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Assignments */}
          <TabsContent value="assignments">
            {submissions.length === 0 ? (
              <div className="text-center py-16">
                <Award className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-lg text-muted-foreground">{isRtl ? "لا توجد واجبات مُسلّمة" : "No submitted assignments"}</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {submissions.map(sub => (
                  <Card key={sub.id}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-foreground text-sm">{sub.file_name || (isRtl ? "واجب" : "Assignment")}</p>
                        <p className="text-xs text-muted-foreground">{new Date(sub.submitted_at).toLocaleDateString(isRtl ? "ar-EG" : "en-US")}</p>
                        {sub.feedback_ar && <p className="text-xs text-blue-600 mt-1">{isRtl ? sub.feedback_ar : sub.feedback_en}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        {sub.grade ? (
                          <Badge className="bg-green-100 text-green-700 border-green-300">{sub.grade}</Badge>
                        ) : (
                          <Badge variant="secondary">{isRtl ? "قيد التقييم" : "Pending"}</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Files/Attachments */}
          <TabsContent value="files">
            {attachments.filter(a => subscribedCourseIds.includes(a.course_id)).length === 0 ? (
              <div className="text-center py-16">
                <FileText className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-lg text-muted-foreground">{isRtl ? "لا توجد ملفات متاحة" : "No files available"}</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {attachments.filter(a => subscribedCourseIds.includes(a.course_id)).map(att => (
                  <Card key={att.id}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground text-sm">{att.name}</p>
                          <p className="text-xs text-muted-foreground">{getCourseName(att.course_id)} • {att.file_type || 'PDF'}</p>
                        </div>
                      </div>
                      <a href={att.file_url} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline" className="gap-1.5">
                          <Download className="w-4 h-4" /> {isRtl ? "تحميل" : "Download"}
                        </Button>
                      </a>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Schedule */}
          <TabsContent value="schedule">
            {schedules.filter(s => subscribedCourseIds.includes(s.course_id)).length === 0 ? (
              <div className="text-center py-16">
                <Calendar className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-lg text-muted-foreground">{isRtl ? "لا توجد جداول" : "No schedules"}</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {schedules.filter(s => subscribedCourseIds.includes(s.course_id)).map(sch => (
                  <Card key={sch.id}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${sch.schedule_type === 'exam' ? 'bg-red-500/10' : 'bg-primary/10'}`}>
                          {sch.schedule_type === 'exam' ? <ClipboardList className="w-5 h-5 text-red-500" /> : <BookOpen className="w-5 h-5 text-primary" />}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground text-sm">{isRtl ? sch.title_ar : sch.title_en}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(sch.scheduled_date).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US')}
                            {sch.start_time && ` • ${sch.start_time}`}
                            {sch.end_time && ` - ${sch.end_time}`}
                          </p>
                          {(sch.location_ar || sch.location_en) && (
                            <p className="text-xs text-muted-foreground">{isRtl ? sch.location_ar : sch.location_en}</p>
                          )}
                        </div>
                      </div>
                      <Badge className={sch.schedule_type === 'exam' ? 'bg-red-100 text-red-700' : 'bg-primary/10 text-primary'}>
                        {sch.schedule_type === 'exam' ? (isRtl ? 'اختبار' : 'Exam') : (isRtl ? 'محاضرة' : 'Lecture')}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Rate Lecturer */}
          <TabsContent value="rate">
            {subscribedCourses.length === 0 ? (
              <div className="text-center py-16">
                <Star className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-lg text-muted-foreground">{isRtl ? "اشترك في دورة أولاً لتقييم المحاضر" : "Subscribe to a course first to rate a lecturer"}</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {subscribedCourses.map(course => {
                  const existingRating = ratings.find(r => r.course_id === course.id);
                  return (
                    <Card key={course.id} className="overflow-hidden">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div>
                            <h3 className="font-bold text-foreground">{isRtl ? course.title_ar : course.title_en}</h3>
                            <p className="text-sm text-muted-foreground">{isRtl ? course.instructor_ar : course.instructor_en}</p>
                          </div>
                          {existingRating && (
                            <Badge className="bg-green-100 text-green-700 border-green-300 gap-1">
                              <Star className="w-3 h-3 fill-current" /> {existingRating.rating}/5
                            </Badge>
                          )}
                        </div>
                        {ratingCourseId === course.id ? (
                          <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-2 justify-center">
                              {[1, 2, 3, 4, 5].map(star => (
                                <button key={star} type="button" onClick={() => setRatingValue(star)} className="transition-transform hover:scale-110">
                                  <Star className={`w-8 h-8 ${star <= ratingValue ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"}`} />
                                </button>
                              ))}
                            </div>
                            <textarea
                              placeholder={isRtl ? "اكتب تعليقك (اختياري)..." : "Write your comment (optional)..."}
                              value={ratingComment}
                              onChange={e => setRatingComment(e.target.value)}
                              className="w-full rounded-lg border border-border bg-background p-3 text-sm min-h-[80px] resize-none"
                            />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={handleSubmitRating} disabled={savingRating || ratingValue === 0}>
                                {isRtl ? "إرسال التقييم" : "Submit Rating"}
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => { setRatingCourseId(null); setRatingValue(0); setRatingComment(""); }}>
                                {isRtl ? "إلغاء" : "Cancel"}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => {
                            setRatingCourseId(course.id);
                            setRatingValue(existingRating?.rating || 0);
                            setRatingComment(existingRating?.comment || "");
                          }}>
                            <Star className="w-4 h-4" />
                            {existingRating ? (isRtl ? "تعديل التقييم" : "Edit Rating") : (isRtl ? "قيّم المحاضر" : "Rate Lecturer")}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Analytics */}
          <TabsContent value="analytics">
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-5 pb-4 text-center">
                    <p className="text-2xl font-black text-primary">{quizSubmissions.length > 0 ? Math.round(quizSubmissions.reduce((acc, qs) => acc + ((qs.score / (qs.total_points || 1)) * 100), 0) / quizSubmissions.length) : 0}%</p>
                    <p className="text-xs text-muted-foreground mt-1">{isRtl ? "متوسط الاختبارات" : "Avg Quiz Score"}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-5 pb-4 text-center">
                    <p className="text-2xl font-black text-green-600">{attendance.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">{isRtl ? "جلسات بث حضرتها" : "Streams Attended"}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-5 pb-4 text-center">
                    <p className="text-2xl font-black text-amber-500">{submissions.filter(s => s.grade).length}/{submissions.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">{isRtl ? "واجبات مُقيّمة" : "Graded Tasks"}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-5 pb-4 text-center">
                    <p className="text-2xl font-black text-blue-500">{ratings.length > 0 ? (ratings.reduce((a, r) => a + r.rating, 0) / ratings.length).toFixed(1) : '—'}</p>
                    <p className="text-xs text-muted-foreground mt-1">{isRtl ? "متوسط تقييماتك" : "Avg Your Ratings"}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Quiz Results Table */}
              {quizSubmissions.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{isRtl ? "نتائج الاختبارات" : "Quiz Results"}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead><tr className="border-b">
                          <th className="text-start p-2 font-semibold text-muted-foreground">{isRtl ? "الاختبار" : "Quiz"}</th>
                          <th className="text-start p-2 font-semibold text-muted-foreground">{isRtl ? "الدرجة" : "Score"}</th>
                          <th className="text-start p-2 font-semibold text-muted-foreground">{isRtl ? "النسبة" : "%"}</th>
                          <th className="text-start p-2 font-semibold text-muted-foreground">{isRtl ? "التاريخ" : "Date"}</th>
                        </tr></thead>
                        <tbody>
                          {quizSubmissions.map(qs => {
                            const quiz = quizzes.find(q => q.id === qs.quiz_id);
                            const pct = qs.total_points ? Math.round((qs.score / qs.total_points) * 100) : 0;
                            return (
                              <tr key={qs.id} className="border-b last:border-0">
                                <td className="p-2 font-medium">{quiz ? (isRtl ? quiz.title_ar : quiz.title_en) : '—'}</td>
                                <td className="p-2">{qs.score}/{qs.total_points}</td>
                                <td className="p-2"><Badge className={pct >= 60 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>{pct}%</Badge></td>
                                <td className="p-2 text-muted-foreground">{new Date(qs.submitted_at).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US')}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Export Buttons */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{isRtl ? "تصدير التقارير PDF" : "Export PDF Reports"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <Button variant="outline" className="gap-2" onClick={() => exportAnalyticsPDF('quizResults')}>
                      <Download className="w-4 h-4" /> {isRtl ? "نتائج الاختبارات" : "Quiz Results"}
                    </Button>
                    <Button variant="outline" className="gap-2" onClick={() => exportAnalyticsPDF('assignments')}>
                      <Download className="w-4 h-4" /> {isRtl ? "الواجبات" : "Assignments"}
                    </Button>
                    <Button variant="outline" className="gap-2" onClick={() => exportAnalyticsPDF('attendance')}>
                      <Download className="w-4 h-4" /> {isRtl ? "سجل الحضور" : "Attendance"}
                    </Button>
                    <Button variant="outline" className="gap-2" onClick={() => exportAnalyticsPDF('ratings')}>
                      <Download className="w-4 h-4" /> {isRtl ? "التقييمات" : "Ratings"}
                    </Button>
                    <Button className="gap-2 col-span-2 sm:col-span-1" onClick={() => exportAnalyticsPDF('all')}>
                      <Download className="w-4 h-4" /> {isRtl ? "تقرير شامل" : "Full Report"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default StudentDashboard;
