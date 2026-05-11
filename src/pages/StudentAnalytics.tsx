import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import StudentPageHeader from "@/components/StudentPageHeader";

const StudentAnalytics = () => {
  const { language, dir } = useLanguage();
  const navigate = useNavigate();
  const isRtl = language === "ar";

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [quizSubmissions, setQuizSubmissions] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [streams, setStreams] = useState<any[]>([]);
  const [ratings, setRatings] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);

  useEffect(() => { (async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/login"); return; }
    const [{ data: p }, { data: qs }, { data: qz }, { data: sub }, { data: att }, { data: ls }, { data: r }, { data: c }] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", user.id).single(),
      supabase.from("quiz_submissions").select("*").eq("student_id", user.id),
      supabase.from("quizzes").select("id,title_ar,title_en"),
      supabase.from("assignment_submissions").select("*").eq("student_id", user.id),
      supabase.from("stream_attendance").select("*").eq("user_id", user.id),
      supabase.from("live_streams").select("id,title_ar,title_en"),
      supabase.from("lecturer_ratings").select("*").eq("student_id", user.id),
      supabase.from("courses").select("id,title_ar,title_en"),
    ]);
    setProfile(p); setQuizSubmissions(qs || []); setQuizzes(qz || []); setSubmissions(sub || []);
    setAttendance(att || []); setStreams(ls || []); setRatings(r || []); setCourses(c || []);
    setLoading(false);
  })(); }, [navigate]);

  const getCourseName = (id: string) => {
    const c = courses.find((c: any) => c.id === id);
    return c ? (isRtl ? c.title_ar : c.title_en) : "—";
  };

  const exportPDF = (section: string) => {
    const w = window.open('', '_blank');
    if (!w) return;
    const title = isRtl ? 'تقرير تحليلات الطالب' : 'Student Analytics Report';
    let content = '';
    if (section === 'all' || section === 'quizResults') {
      content += `<h2>${isRtl ? 'نتائج الاختبارات' : 'Quiz Results'}</h2><table border="1" cellpadding="8" cellspacing="0" style="width:100%;border-collapse:collapse"><tr><th>${isRtl ? 'الاختبار' : 'Quiz'}</th><th>${isRtl ? 'الدرجة' : 'Score'}</th><th>${isRtl ? 'التاريخ' : 'Date'}</th></tr>`;
      quizSubmissions.forEach(qs => {
        const q = quizzes.find((x: any) => x.id === qs.quiz_id);
        content += `<tr><td>${q ? (isRtl ? q.title_ar : q.title_en) : '—'}</td><td>${qs.score}/${qs.total_points}</td><td>${new Date(qs.submitted_at).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US')}</td></tr>`;
      });
      content += '</table><br/>';
    }
    if (section === 'all' || section === 'assignments') {
      content += `<h2>${isRtl ? 'التكليفات' : 'Assignments'}</h2><table border="1" cellpadding="8" cellspacing="0" style="width:100%;border-collapse:collapse"><tr><th>${isRtl ? 'الملف' : 'File'}</th><th>${isRtl ? 'الدرجة' : 'Grade'}</th><th>${isRtl ? 'التاريخ' : 'Date'}</th></tr>`;
      submissions.forEach(s => {
        content += `<tr><td>${s.file_name || '—'}</td><td>${s.grade || (isRtl ? 'قيد التقييم' : 'Pending')}</td><td>${new Date(s.submitted_at).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US')}</td></tr>`;
      });
      content += '</table><br/>';
    }
    if (section === 'all' || section === 'attendance') {
      content += `<h2>${isRtl ? 'سجل الحضور' : 'Attendance'}</h2><table border="1" cellpadding="8" cellspacing="0" style="width:100%;border-collapse:collapse"><tr><th>${isRtl ? 'البث' : 'Stream'}</th><th>${isRtl ? 'الانضمام' : 'Joined'}</th><th>${isRtl ? 'المدة' : 'Duration'}</th></tr>`;
      attendance.forEach(a => {
        const s = streams.find((x: any) => x.id === a.stream_id);
        content += `<tr><td>${s ? (isRtl ? s.title_ar : s.title_en) : a.stream_id.slice(0,8)}</td><td>${new Date(a.joined_at).toLocaleString(isRtl ? 'ar-EG' : 'en-US')}</td><td>${a.duration_minutes || 0}</td></tr>`;
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
    w.document.write(`<!DOCTYPE html><html dir="${dir}"><head><meta charset="UTF-8"><title>${title}</title><style>body{font-family:Arial,sans-serif;padding:30px;direction:${dir}}h1{color:#1a1a2e;border-bottom:2px solid #1a1a2e;padding-bottom:10px}h2{color:#16213e;margin-top:20px}table{font-size:13px}th{background:#f0f0f0}@media print{body{-webkit-print-color-adjust:exact}}</style></head><body><h1>${title}</h1><p>${isRtl ? 'الطالب' : 'Student'}: ${profile?.full_name || ''} | ${new Date().toLocaleDateString(isRtl ? 'ar-EG' : 'en-US')}</p>${content}</body></html>`);
    w.document.close(); w.print();
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  const avgQuiz = quizSubmissions.length > 0 ? Math.round(quizSubmissions.reduce((acc, qs) => acc + ((qs.score / (qs.total_points || 1)) * 100), 0) / quizSubmissions.length) : 0;
  const avgRating = ratings.length > 0 ? (ratings.reduce((a, r) => a + r.rating, 0) / ratings.length).toFixed(1) : '—';

  return (
    <div className="min-h-screen bg-background" dir={isRtl ? "rtl" : "ltr"}>
      <StudentPageHeader titleAr="تحميل التقارير" titleEn="Export Reports" icon={<TrendingUp className="w-3.5 h-3.5" />} />
      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-5 sm:py-8 space-y-5 sm:space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
          {[
            { Icon: TrendingUp, value: `${avgQuiz}%`, label: isRtl ? "متوسط الاختبارات" : "Avg Quiz", color: "from-primary to-primary/70" },
            { Icon: TrendingUp, value: attendance.length, label: isRtl ? "بث حضرته" : "Attended", color: "from-green-500 to-emerald-600" },
            { Icon: TrendingUp, value: `${submissions.filter(s => s.grade).length}/${submissions.length}`, label: isRtl ? "واجبات مُقيّمة" : "Graded", color: "from-amber-500 to-orange-600" },
            { Icon: TrendingUp, value: avgRating, label: isRtl ? "متوسط تقييماتك" : "Avg Ratings", color: "from-blue-500 to-indigo-600" },
          ].map((s, i) => (
            <Card key={i} className="hover:shadow-md transition-shadow"><CardContent className="pt-4 pb-3 sm:pt-5 sm:pb-4 text-center px-2">
              <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl mx-auto mb-2 flex items-center justify-center bg-gradient-to-br ${s.color} shadow-md shadow-black/5`}>
                <s.Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" strokeWidth={2.5} />
              </div>
              <p className="text-lg sm:text-2xl font-black text-foreground">{s.value}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 truncate">{s.label}</p>
            </CardContent></Card>
          ))}
        </div>

        {quizSubmissions.length > 0 && (
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">{isRtl ? "نتائج الاختبارات" : "Quiz Results"}</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b">
                    <th className="text-start p-2 font-semibold text-muted-foreground">{isRtl ? "الاختبار" : "Quiz"}</th>
                    <th className="text-start p-2 font-semibold text-muted-foreground">{isRtl ? "الدرجة" : "Score"}</th>
                    <th className="text-start p-2 font-semibold text-muted-foreground">%</th>
                    <th className="text-start p-2 font-semibold text-muted-foreground">{isRtl ? "التاريخ" : "Date"}</th>
                  </tr></thead>
                  <tbody>
                    {quizSubmissions.map(qs => {
                      const q = quizzes.find((x: any) => x.id === qs.quiz_id);
                      const pct = qs.total_points ? Math.round((qs.score / qs.total_points) * 100) : 0;
                      return (
                        <tr key={qs.id} className="border-b last:border-0">
                          <td className="p-2 font-medium">{q ? (isRtl ? q.title_ar : q.title_en) : '—'}</td>
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

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">{isRtl ? "تصدير التقارير PDF" : "Export PDF Reports"}</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Button variant="outline" className="gap-2" onClick={() => exportPDF('quizResults')}>
                <Download className="w-4 h-4" />{isRtl ? "الاختبارات" : "Quizzes"}
              </Button>
              <Button variant="outline" className="gap-2" onClick={() => exportPDF('assignments')}>
                <Download className="w-4 h-4" />{isRtl ? "الواجبات" : "Tasks"}
              </Button>
              <Button variant="outline" className="gap-2" onClick={() => exportPDF('attendance')}>
                <Download className="w-4 h-4" />{isRtl ? "الحضور" : "Attendance"}
              </Button>
              <Button variant="outline" className="gap-2" onClick={() => exportPDF('ratings')}>
                <Download className="w-4 h-4" />{isRtl ? "التقييمات" : "Ratings"}
              </Button>
              <Button className="gap-2 col-span-2 sm:col-span-1" onClick={() => exportPDF('all')}>
                <Download className="w-4 h-4" />{isRtl ? "تقرير شامل" : "Full Report"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default StudentAnalytics;
