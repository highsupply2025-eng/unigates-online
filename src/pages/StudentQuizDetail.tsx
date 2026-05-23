import { useState } from "react";
import { useParams } from "react-router-dom";
import { ClipboardList, Timer, CheckCircle, Award } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import StudentPageHeader from "@/components/StudentPageHeader";
import MandatoryRatingDialog from "@/components/MandatoryRatingDialog";
import { toast } from "@/hooks/use-toast";
import { hasRated, markRated } from "@/lib/rating-storage";
import { supabase } from "@/integrations/supabase/client";

interface Question {
  id: string;
  qAr: string;
  qEn: string;
  options: { v: string; ar: string; en: string }[];
  correct: string;
}

const QUESTIONS: Question[] = [
  {
    id: "q1",
    qAr: "ما عاصمة المملكة العربية السعودية؟",
    qEn: "What is the capital of Saudi Arabia?",
    options: [
      { v: "a", ar: "جدة", en: "Jeddah" },
      { v: "b", ar: "الرياض", en: "Riyadh" },
      { v: "c", ar: "مكة", en: "Makkah" },
      { v: "d", ar: "الدمام", en: "Dammam" },
    ],
    correct: "b",
  },
  {
    id: "q2",
    qAr: "كم يساوي 7 × 8؟",
    qEn: "What is 7 × 8?",
    options: [
      { v: "a", ar: "54", en: "54" },
      { v: "b", ar: "56", en: "56" },
      { v: "c", ar: "58", en: "58" },
      { v: "d", ar: "64", en: "64" },
    ],
    correct: "b",
  },
  {
    id: "q3",
    qAr: "ما هو أكبر كوكب في المجموعة الشمسية؟",
    qEn: "Which is the largest planet in the solar system?",
    options: [
      { v: "a", ar: "الأرض", en: "Earth" },
      { v: "b", ar: "زحل", en: "Saturn" },
      { v: "c", ar: "المشتري", en: "Jupiter" },
      { v: "d", ar: "نبتون", en: "Neptune" },
    ],
    correct: "c",
  },
];

const StudentQuizDetail = () => {
  const { quizId } = useParams();
  const { language } = useLanguage();
  const isRtl = language === "ar";
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const quiz = {
    id: quizId || "demo-1",
    titleAr: "اختبار تجريبي - تقييم سريع",
    titleEn: "Demo Quiz - Quick Assessment",
    courseAr: "مادة تجريبية",
    courseEn: "Demo Course",
    duration: 15,
    descAr: "اختبار تجريبي قصير لعرض شكل صفحة الاختبار. أجب على الأسئلة ثم اضغط تسليم.",
    descEn: "Short demo quiz showcasing the quiz page. Answer the questions then click submit.",
  };

  const handleSubmit = () => {
    if (Object.keys(answers).length < QUESTIONS.length) {
      toast({
        title: isRtl ? "أسئلة غير مكتملة" : "Incomplete",
        description: isRtl ? "يرجى الإجابة على جميع الأسئلة" : "Please answer all questions",
        variant: "destructive",
      });
      return;
    }
    const s = QUESTIONS.reduce((acc, q) => acc + (answers[q.id] === q.correct ? 1 : 0), 0);
    setScore(s);
    setSubmitted(true);
  };

  const pct = Math.round((score / QUESTIONS.length) * 100);

  return (
    <div className="min-h-screen bg-background" dir={isRtl ? "rtl" : "ltr"}>
      <StudentPageHeader
        titleAr="الاختبارات أونلاين"
        titleEn="Quizzes Online"
        icon={<ClipboardList className="w-3.5 h-3.5" />}
        backTo="/student/quizzes"
        backLabelAr="رجوع للاختبارات"
        backLabelEn="Back to Quizzes"
      />
      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-5 sm:py-8 space-y-5">
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-br from-purple-500 to-fuchsia-600 p-5 sm:p-6 text-white">
            <Badge className="bg-white/20 text-white border-white/30 mb-2 gap-1.5">
              <ClipboardList className="w-3 h-3" />
              {isRtl ? "اختبار" : "Quiz"}
            </Badge>
            <h1 className="text-xl sm:text-2xl font-bold">
              {isRtl ? quiz.titleAr : quiz.titleEn}
            </h1>
            <p className="text-sm text-white/90 mt-1">
              {isRtl ? quiz.courseAr : quiz.courseEn}
            </p>
            <div className="flex items-center gap-3 mt-3 text-sm text-white/90">
              <span className="flex items-center gap-1">
                <Timer className="w-4 h-4" />
                {quiz.duration} {isRtl ? "دقيقة" : "min"}
              </span>
              <span>•</span>
              <span>{QUESTIONS.length} {isRtl ? "أسئلة" : "questions"}</span>
            </div>
          </div>
          <CardContent className="p-5">
            <p className="text-sm text-foreground/80 leading-relaxed">
              {isRtl ? quiz.descAr : quiz.descEn}
            </p>
          </CardContent>
        </Card>

        {submitted ? (
          <Card>
            <CardContent className="p-6 text-center space-y-4">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto ${pct >= 50 ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
                <Award className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-black">{score} / {QUESTIONS.length}</h2>
              <Badge className="text-base px-4 py-1">{pct}%</Badge>
              <p className="text-muted-foreground text-sm">
                {pct >= 50
                  ? (isRtl ? "أحسنت! نتيجة جيدة" : "Well done! Good score")
                  : (isRtl ? "حاول مرة أخرى" : "Try again")}
              </p>
              <Button onClick={() => { setSubmitted(false); setAnswers({}); setScore(0); }}>
                {isRtl ? "إعادة المحاولة" : "Retry"}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {QUESTIONS.map((q, idx) => (
              <Card key={q.id}>
                <CardContent className="p-4 sm:p-5">
                  <p className="font-bold text-foreground mb-3">
                    {idx + 1}. {isRtl ? q.qAr : q.qEn}
                  </p>
                  <div className="grid gap-2">
                    {q.options.map(opt => {
                      const sel = answers[q.id] === opt.v;
                      return (
                        <button
                          key={opt.v}
                          onClick={() => setAnswers(p => ({ ...p, [q.id]: opt.v }))}
                          className={`text-start p-3 rounded-lg border transition-all ${sel ? "border-primary bg-primary/10 font-semibold" : "border-border hover:border-primary/40"}`}
                        >
                          <span className="font-bold me-2">{opt.v.toUpperCase()}.</span>
                          {isRtl ? opt.ar : opt.en}
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
            <div className="flex justify-center pt-2">
              <Button onClick={handleSubmit} size="lg" className="gap-2">
                <CheckCircle className="w-5 h-5" />
                {isRtl ? "تسليم الاختبار" : "Submit Quiz"}
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default StudentQuizDetail;
