import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardList, Play, CheckCircle, Timer, Shuffle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import StudentPageHeader from "@/components/StudentPageHeader";

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const StudentQuizzes = () => {
  const { language } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isRtl = language === "ar";

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
  const [resultView, setResultView] = useState<{ score: number; total: number; details: any[] } | null>(null);

  useEffect(() => { (async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/login"); return; }
    setUser(user);
    const [{ data: subs }, { data: qz }, { data: qs }, { data: c }] = await Promise.all([
      supabase.from("user_subscriptions").select("course_id").eq("user_id", user.id).eq("status", "active"),
      supabase.from("quizzes").select("*").eq("is_published", true).order("created_at", { ascending: false }),
      supabase.from("quiz_submissions").select("*").eq("student_id", user.id),
      supabase.from("courses").select("id,title_ar,title_en"),
    ]);
    setSubscribedIds((subs || []).map((s: any) => s.course_id));
    setQuizzes(qz || []);
    setSubmissions(qs || []);
    setCourses(c || []);
    setLoading(false);
  })(); }, [navigate]);

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
    const { data } = await supabase.from("quiz_questions").select("*").eq("quiz_id", quiz.id).order("question_order");
    const list = data || [];
    setQuestions(quiz.randomize_questions ? shuffle(list) : list);
    setActiveQuiz(quiz);
    setAnswers({});
    setTimer(0);
    setResultView(null);
  };

  const gradeAnswer = (q: any, ans: string | undefined) => {
    if (!ans) return false;
    if (q.question_type === "mcq" || q.question_type === "true_false" || !q.question_type) {
      return ans === q.correct_answer;
    }
    if (q.question_type === "fill_blank") {
      return q.expected_answer && ans.trim().toLowerCase() === q.expected_answer.trim().toLowerCase();
    }
    // short_answer → manual grading, treat as 0 for now
    return false;
  };

  const submitQuiz = async () => {
    if (!activeQuiz || !user) return;
    setSubmitting(true);
    try {
      let score = 0, total = 0;
      const details = questions.map(q => {
        total += q.points || 1;
        const correct = gradeAnswer(q, answers[q.id]);
        if (correct) score += q.points || 1;
        return { id: q.id, correct, given: answers[q.id], expected: q.correct_answer || q.expected_answer };
      });
      const { error } = await supabase.from("quiz_submissions").insert({
        quiz_id: activeQuiz.id, student_id: user.id, answers, score, total_points: total,
      });
      if (error) throw error;
      const { data: qs } = await supabase.from("quiz_submissions").select("*").eq("student_id", user.id);
      setSubmissions(qs || []);
      if (activeQuiz.show_results_immediately !== false) {
        setResultView({ score, total, details });
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
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
            <h1 className="text-base font-bold text-foreground truncate">{isRtl ? activeQuiz.title_ar : activeQuiz.title_en}</h1>
            <div className="flex items-center gap-2 shrink-0">
              <Badge className={`gap-1 ${timeLeft < 60 ? 'bg-red-500 text-white' : 'bg-primary/10 text-primary'}`}>
                <Timer className="w-4 h-4" />{formatTime(timeLeft)}
              </Badge>
              <span className="text-xs text-muted-foreground">{Object.keys(answers).length}/{questions.length}</span>
            </div>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-6 space-y-4">
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

  const available = quizzes.filter(q => subscribedIds.includes(q.course_id));

  return (
    <div className="min-h-screen bg-background" dir={isRtl ? "rtl" : "ltr"}>
      <StudentPageHeader titleAr="الاختبارات أونلاين" titleEn="Quizzes Online" icon={<ClipboardList className="w-3.5 h-3.5" />} />
      <main className="max-w-6xl mx-auto px-3 sm:px-4 py-5 sm:py-8">
        {available.length === 0 ? (
          <div className="text-center py-16">
            <ClipboardList className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">{isRtl ? "لا توجد اختبارات متاحة" : "No quizzes available"}</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {available.map(quiz => {
              const sub = submissions.find(s => s.quiz_id === quiz.id);
              return (
                <Card key={quiz.id}>
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-foreground">{isRtl ? quiz.title_ar : quiz.title_en}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{isRtl ? quiz.description_ar : quiz.description_en}</p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Timer className="w-3.5 h-3.5" />{quiz.duration_minutes || 30} {isRtl ? "دقيقة" : "min"}</span>
                          <span>{getCourseName(quiz.course_id)}</span>
                          {quiz.randomize_questions && <Badge variant="outline" className="gap-1 text-[10px]"><Shuffle className="w-3 h-3" />{isRtl ? "عشوائي" : "Random"}</Badge>}
                          {quiz.show_results_immediately && <Badge variant="outline" className="gap-1 text-[10px]"><Zap className="w-3 h-3" />{isRtl ? "فوري" : "Instant"}</Badge>}
                        </div>
                      </div>
                      {sub ? (
                        <div className="text-center self-end sm:self-auto">
                          <Badge className="bg-green-100 text-green-700 border-green-300 gap-1">
                            <CheckCircle className="w-3 h-3" />{sub.score}/{sub.total_points}
                          </Badge>
                          <p className="text-[10px] text-muted-foreground mt-1">{isRtl ? "تم الحل" : "Completed"}</p>
                        </div>
                      ) : (
                        <Button size="sm" onClick={() => startQuiz(quiz)} className="gap-1.5 self-end sm:self-auto">
                          <Play className="w-4 h-4" />{isRtl ? "ابدأ الاختبار" : "Start Quiz"}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default StudentQuizzes;
