import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ClipboardList, Play, CheckCircle, Timer, Shuffle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRealtimeRefresh } from "@/hooks/use-realtime-refresh";
import StudentPageHeader from "@/components/StudentPageHeader";
import StudentHero from "@/components/StudentHero";

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const StudentQuizzes = () => {
  const { language, dir } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isRtl = dir === "rtl";

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [subscribedIds, setSubscribedIds] = useState<string[]>([]);

  const [activeQuiz, setActiveQuiz] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timer, setTimer] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [resultView, setResultView] = useState<{ score: number; total: number; details: any[] } | null>(null);

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/login"); return; }
    setUser(user);
    const [{ data: subs }, { data: qz }, { data: qs }, { data: c }] = await Promise.all([
      supabase.from("user_subscriptions").select("course_id").eq("user_id", user.id).eq("status", "active"),
      supabase.from("quizzes").select("*")
        .eq("is_published", true)
        .eq("approved_by_lecturer", true)
        .eq("approved_by_head", true)
        .eq("approved_by_vice_dean_students", true)
        .eq("approved_by_vice_dean_postgrad", true)
        .eq("approved_by_vice_dean_environment", true)
        .eq("approved_by_dean", true)
        .order("created_at", { ascending: false }),
      supabase.from("quiz_submissions").select("*").eq("student_id", user.id),
      supabase.from("courses").select("id,title_ar,title_en"),
    ]);
    const subIds = (subs || []).map((s: any) => s.course_id);
    setSubscribedIds(subIds);
    // Only show quizzes for courses the student is subscribed to
    setQuizzes(subIds.length > 0 ? (qz || []).filter((q: any) => subIds.includes(q.course_id)) : []);
    setSubmissions(qs || []);
    setCourses(c || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [navigate]);

  useRealtimeRefresh(["quizzes", "courses", "user_subscriptions"], load);

  useEffect(() => {
    if (!activeQuiz || resultView) return;
    const i = setInterval(() => setTimer(p => p + 1), 1000);
    return () => clearInterval(i);
  }, [activeQuiz, resultView]);

  const getCourseName = (id: string) => {
    const c = courses.find((c: any) => c.id === id);
    return c ? (isRtl ? c.title_ar : c.title_en) : "—";
  };
  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const startQuiz = async (quiz: any) => {
    if (submissions.find(s => s.quiz_id === quiz.id)) {
      toast({ title: isRtl ? "تم الحل مسبقاً" : "Already submitted", variant: "destructive" });
      return;
    }
    // Use safe view: excludes correct_answer / expected_answer
    const { data } = await supabase.from("quiz_questions_safe").select("*").eq("quiz_id", quiz.id).order("question_order");
    const list = data || [];
    setQuestions(quiz.randomize_questions ? shuffle(list) : list);
    setActiveQuiz(quiz);
    setAnswers({});
    setTimer(0);
    setWhatsappNumber("");
    setResultView(null);
  };

  const submitQuiz = async () => {
    if (!activeQuiz || !user) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.rpc("submit_quiz", {
        _quiz_id: activeQuiz.id,
        _answers: answers as any,
        _whatsapp: whatsappNumber.trim() || null,
      });
      if (error) throw error;
      const res = data as any;
      if (!res?.success) throw new Error(res?.error || "Submission failed");

      const { data: qs } = await supabase.from("quiz_submissions").select("*").eq("student_id", user.id);
      setSubmissions(qs || []);

      if (res.show_results) {
        setResultView({ score: Number(res.score), total: Number(res.total), details: res.details || [] });
      } else {
        toast({ title: isRtl ? "تم التسليم ✅" : "Submitted ✅", description: isRtl ? "ستظهر النتيجة لاحقاً" : "Result will be available later" });
        setActiveQuiz(null); setQuestions([]); setAnswers({});
      }
    } catch (err: any) {
      toast({ title: isRtl ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    } finally { setSubmitting(false); }
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  // Result view
  if (activeQuiz && resultView) {
    const pct = resultView.total > 0 ? Math.round((resultView.score / resultView.total) * 100) : 0;
    return (
      <div className="min-h-screen bg-background" dir={isRtl ? "rtl" : "ltr"}>
        <StudentPageHeader titleAr="نتيجة الاختبار" titleEn="Quiz Result" icon={<CheckCircle className="w-3.5 h-3.5" />} />
        <main className="max-w-3xl mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-6 text-center space-y-4">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto ${pct >= 50 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                <CheckCircle className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-black">{resultView.score} / {resultView.total}</h2>
              <Badge className="text-base px-4 py-1">{pct}%</Badge>
              <p className="text-muted-foreground text-sm">{isRtl ? activeQuiz.title_ar : activeQuiz.title_en}</p>
              <Button size="lg" onClick={() => { setActiveQuiz(null); setResultView(null); setQuestions([]); setAnswers({}); }}>
                {isRtl ? "العودة" : "Back"}
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Active quiz view
  if (activeQuiz) {
    const durationSec = (activeQuiz.duration_minutes || 30) * 60;
    const timeLeft = Math.max(0, durationSec - timer);
    if (timeLeft <= 0 && !submitting) submitQuiz();

    return (
      <div className="min-h-screen bg-background" dir={isRtl ? "rtl" : "ltr"}>
        <header className="border-b border-border px-4 py-3 sticky top-0 bg-background/95 backdrop-blur z-30">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
            <h1 className="text-base font-bold text-foreground truncate">{isRtl ? activeQuiz.title_ar : activeQuiz.title_en}</h1>
            <div className="flex items-center gap-2 shrink-0">
              <Badge className={`gap-1 ${timeLeft < 60 ? 'bg-red-500 text-white' : 'bg-primary/10 text-primary'}`}>
                <Timer className="w-4 h-4" />{formatTime(timeLeft)}
              </Badge>
              <span className="text-xs text-muted-foreground">{Object.keys(answers).length}/{questions.length}</span>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 py-6 space-y-4">
          {questions.map((q, idx) => (
            <Card key={q.id}>
              <CardContent className="p-4 sm:p-5">
                <p className="font-bold text-foreground mb-3">{idx + 1}. {isRtl ? q.question_ar : q.question_en}</p>
                {q.image_url && <img src={q.image_url} alt="" className="rounded-lg border max-h-60 object-cover mb-3" />}

                {(!q.question_type || q.question_type === "mcq") && (
                  <div className="grid gap-2">
                    {['a','b','c','d'].map(opt => {
                      const txt = isRtl ? q[`option_${opt}_ar`] : q[`option_${opt}_en`];
                      if (!txt) return null;
                      const sel = answers[q.id] === opt;
                      return (
                        <button key={opt} onClick={() => setAnswers(p => ({...p, [q.id]: opt}))}
                          className={`text-start p-3 rounded-lg border transition-all ${sel ? 'border-primary bg-primary/10 font-semibold' : 'border-border hover:border-primary/40'}`}>
                          <span className="font-bold me-2">{opt.toUpperCase()}.</span>{txt}
                        </button>
                      );
                    })}
                  </div>
                )}

                {q.question_type === "true_false" && (
                  <div className="grid grid-cols-2 gap-2">
                    {[{v:"a",ar:"صح ✓",en:"True ✓"},{v:"b",ar:"خطأ ✗",en:"False ✗"}].map(opt => {
                      const sel = answers[q.id] === opt.v;
                      return (
                        <button key={opt.v} onClick={() => setAnswers(p => ({...p, [q.id]: opt.v}))}
                          className={`p-3 rounded-lg border font-semibold transition-all ${sel ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40'}`}>
                          {isRtl ? opt.ar : opt.en}
                        </button>
                      );
                    })}
                  </div>
                )}

                {(q.question_type === "short_answer" || q.question_type === "fill_blank") && (
                  <Textarea value={answers[q.id] || ""} onChange={e => setAnswers(p => ({...p, [q.id]: e.target.value}))}
                    rows={q.question_type === "fill_blank" ? 1 : 3}
                    placeholder={isRtl ? "اكتب إجابتك هنا..." : "Type your answer..."} />
                )}
              </CardContent>
            </Card>
          ))}
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4 space-y-2">
              <Label htmlFor="wa" className="text-sm font-bold flex items-center gap-2">
                📱 {isRtl ? "رقم الواتساب (اختياري)" : "WhatsApp number (optional)"}
              </Label>
              <p className="text-xs text-muted-foreground">
                {isRtl
                  ? "أدخل رقمك بالرمز الدولي لتصلك النتيجة على واتساب فور اعتمادها من القيادة."
                  : "Enter your number with country code to receive the result on WhatsApp once approved by leadership."}
              </p>
              <Input id="wa" type="tel" inputMode="tel" dir="ltr" maxLength={20}
                value={whatsappNumber}
                onChange={e => setWhatsappNumber(e.target.value)}
                placeholder="+9665XXXXXXXX" />
            </CardContent>
          </Card>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-3">
            <Button onClick={submitQuiz} disabled={submitting} size="lg" className="gap-2">
              <CheckCircle className="w-5 h-5" />{isRtl ? "تسليم" : "Submit"}
            </Button>
            <Button variant="outline" size="lg" onClick={() => { setActiveQuiz(null); setQuestions([]); setAnswers({}); }}>
              {isRtl ? "إلغاء" : "Cancel"}
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const available = quizzes;

  return (
    <div className="min-h-screen bg-background" dir={isRtl ? "rtl" : "ltr"}>
      <StudentPageHeader titleAr="الاختبارات" titleEn="Quizzes Online" icon={<ClipboardList className="w-3.5 h-3.5" />} />
      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-5 sm:py-8">
        <StudentHero
          titleAr="الاختبارات"
          titleEn="Quizzes"
          subtitleAr="ابدأ اختباراتك المتاحة وحقّق أفضل النتائج"
          subtitleEn="Take your available quizzes and ace them"
          Icon={ClipboardList}
          gradient="from-violet-500 via-purple-600 to-fuchsia-700"
          shadow="shadow-purple-500/30"
        />
        <div className="grid gap-4">
          {/* Demo quiz — always visible */}
          <Link to="/student/quizzes/demo-1" className="block">
            <Card className="border-s-4 border-s-violet-500 bg-gradient-to-l from-violet-500/5 to-transparent hover:shadow-xl hover:-translate-y-0.5 transition-all">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/30">
                    <ClipboardList className="w-6 h-6 text-white" strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-extrabold text-foreground tracking-tight">
                          {isRtl ? "اختبار تجريبي - تقييم سريع" : "Demo Quiz - Quick Assessment"}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1 font-medium">
                          {isRtl
                            ? "اختبار قصير لعرض شكل صفحة الاختبار. اضغط للبدء."
                            : "Short demo quiz showcasing the quiz page. Click to start."}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs">
                          <span className="flex items-center gap-1 font-semibold text-violet-600"><Timer className="w-3.5 h-3.5" />15 {isRtl ? "دقيقة" : "min"}</span>
                          <Badge className="gap-1 text-[10px] bg-amber-500/15 text-amber-700 border-amber-500/30"><Zap className="w-3 h-3" />{isRtl ? "فوري" : "Instant"}</Badge>
                        </div>
                      </div>
                      <Button size="sm" className="gap-1.5 self-end sm:self-auto shadow-md shadow-primary/20">
                        <Play className="w-4 h-4" />{isRtl ? "ابدأ الاختبار" : "Start Quiz"}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          {available.map(quiz => {
            const sub = submissions.find(s => s.quiz_id === quiz.id);
            return (
              <Card key={quiz.id} className="border-s-4 border-s-violet-500/60 hover:shadow-lg hover:-translate-y-0.5 transition-all">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br from-violet-500 to-purple-600 shadow-md shadow-violet-500/25">
                      <ClipboardList className="w-5 h-5 text-white" strokeWidth={2.5} />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-extrabold text-foreground tracking-tight">{isRtl ? quiz.title_ar : quiz.title_en}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{isRtl ? quiz.description_ar : quiz.description_en}</p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1 font-semibold text-violet-600"><Timer className="w-3.5 h-3.5" />{quiz.duration_minutes || 30} {isRtl ? "دقيقة" : "min"}</span>
                          <span className="font-medium">{getCourseName(quiz.course_id)}</span>
                          {quiz.randomize_questions && <Badge variant="outline" className="gap-1 text-[10px]"><Shuffle className="w-3 h-3" />{isRtl ? "عشوائي" : "Random"}</Badge>}
                          {quiz.show_results_immediately && <Badge className="gap-1 text-[10px] bg-amber-500/15 text-amber-700 border-amber-500/30"><Zap className="w-3 h-3" />{isRtl ? "فوري" : "Instant"}</Badge>}
                        </div>
                      </div>
                      {sub ? (
                        <div className="text-center self-end sm:self-auto">
                          <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 shadow-md shadow-green-500/30 gap-1">
                            <CheckCircle className="w-3 h-3" />{sub.score}/{sub.total_points}
                          </Badge>
                          <p className="text-[10px] text-muted-foreground mt-1 font-semibold">{isRtl ? "تم الحل" : "Completed"}</p>
                        </div>
                      ) : (
                        <Button size="sm" onClick={() => startQuiz(quiz)} className="gap-1.5 self-end sm:self-auto shadow-md shadow-primary/20">
                          <Play className="w-4 h-4" />{isRtl ? "ابدأ الاختبار" : "Start Quiz"}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default StudentQuizzes;
