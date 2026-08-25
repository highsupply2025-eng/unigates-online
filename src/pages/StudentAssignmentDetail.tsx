import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { ClipboardList, Calendar, FileText, Upload, CheckCircle2, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/LanguageContext";
import StudentPageHeader from "@/components/StudentPageHeader";
import MandatoryRatingDialog from "@/components/MandatoryRatingDialog";
import { toast } from "@/hooks/use-toast";
import { hasRated, markRated } from "@/lib/rating-storage";
import { supabase } from "@/integrations/supabase/client";

const StudentAssignmentDetail = () => {
  const { assignmentId } = useParams();
  const { language, dir } = useLanguage();
  const isRtl = dir === "rtl";
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [checking, setChecking] = useState(true);
  const [showRating, setShowRating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !assignmentId) {
        // Fallback to localStorage for demo assignments
        const key = `assignment_submitted:${assignmentId}:${user?.id ?? "anon"}`;
        if (localStorage.getItem(key) === "1") {
          if (!cancelled) { setAlreadySubmitted(true); setSubmitted(true); }
        }
        if (!cancelled) setChecking(false);
        return;
      }
      const key = `assignment_submitted:${assignmentId}:${user.id}`;
      const localFlag = localStorage.getItem(key) === "1";
      // Try DB (real assignment ids only)
      const isUuid = /^[0-9a-f-]{36}$/i.test(assignmentId);
      let dbFound = false;
      if (isUuid) {
        const { data } = await supabase
          .from("assignment_submissions")
          .select("id")
          .eq("assignment_id", assignmentId)
          .eq("student_id", user.id)
          .maybeSingle();
        dbFound = !!data;
      }
      if (!cancelled && (localFlag || dbFound)) {
        setAlreadySubmitted(true);
        setSubmitted(true);
      }
      if (!cancelled) setChecking(false);
    })();
    return () => { cancelled = true; };
  }, [assignmentId]);


  const assignment = {
    id: assignmentId || "demo-1",
    titleAr: "تكليف تجريبي - مقدمة في المادة",
    titleEn: "Demo Assignment - Course Introduction",
    instructorAr: "د. أحمد محمد",
    instructorEn: "Dr. Ahmed Mohamed",
    courseAr: "مادة تجريبية",
    courseEn: "Demo Course",
    dueDate: "2026-05-10",
    grade: 100,
    descAr:
      "هذا تكليف تجريبي لعرض شكل صفحة التكليف. اكتب إجابتك في المربع أدناه ثم اضغط على زر التسليم.",
    descEn:
      "This is a demo assignment to showcase the assignment detail page. Write your answer below and click submit.",
  };

  const handleSubmit = () => {
    if (alreadySubmitted) {
      toast({
        title: isRtl ? "تم التسليم مسبقاً" : "Already submitted",
        description: isRtl ? "لا يمكن إعادة تسليم التكليف" : "You cannot resubmit this assignment",
        variant: "destructive",
      });
      return;
    }
    if (!answer.trim()) {
      toast({
        title: isRtl ? "الإجابة فارغة" : "Empty answer",
        description: isRtl ? "يرجى كتابة إجابتك أولاً" : "Please write your answer first",
        variant: "destructive",
      });
      return;
    }
    // Skip mandatory rating if the student already rated this assignment
    if (hasRated("assignment", assignmentId)) {
      finalizeSubmission(0);
      return;
    }
    setShowRating(true);
  };

  const persistSubmission = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !assignmentId) return;
    const key = `assignment_submitted:${assignmentId}:${user.id}`;
    localStorage.setItem(key, "1");
    const isUuid = /^[0-9a-f-]{36}$/i.test(assignmentId);
    if (isUuid) {
      await supabase.from("assignment_submissions").insert({
        assignment_id: assignmentId,
        student_id: user.id,
        file_url: answer.slice(0, 4000),
        file_name: "answer.txt",
      });
    }
  };

  const finalizeSubmission = (rating: number) => {
    if (rating > 0) markRated("assignment", assignmentId);
    setSubmitted(true);
    setAlreadySubmitted(true);
    setShowRating(false);
    persistSubmission();
    toast({
      title: isRtl ? "تم التسليم" : "Submitted",
      description: rating > 0
        ? (isRtl
            ? `تم تسليم التكليف بنجاح. تقييمك: ${rating}/5`
            : `Assignment submitted successfully. Your rating: ${rating}/5`)
        : (isRtl ? "تم تسليم التكليف بنجاح" : "Assignment submitted successfully"),
    });
  };


  return (
    <div className="min-h-screen bg-background" dir={isRtl ? "rtl" : "ltr"}>
      <StudentPageHeader
        titleAr="التكليفات"
        titleEn="Assignments"
        icon={<ClipboardList className="w-3.5 h-3.5" />}
        backTo="/student/assignments"
        backLabelAr="رجوع للتكليفات"
        backLabelEn="Back to Assignments"
      />
      <MandatoryRatingDialog
        open={showRating}
        kind="assignment"
        onSubmit={(rating) => finalizeSubmission(rating)}
      />

      <main className="max-w-5xl mx-auto px-3 sm:px-4 py-5 sm:py-8 space-y-5">
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-5 sm:p-6 text-white">
            <Badge className="bg-white/20 text-white border-white/30 mb-2 gap-1.5">
              <ClipboardList className="w-3 h-3" />
              {isRtl ? "تكليف" : "Assignment"}
            </Badge>
            <h1 className="text-xl sm:text-2xl font-bold">
              {isRtl ? assignment.titleAr : assignment.titleEn}
            </h1>
            <p className="text-sm text-white/90 mt-1">
              {isRtl ? assignment.courseAr : assignment.courseEn} •{" "}
              {isRtl ? assignment.instructorAr : assignment.instructorEn}
            </p>
          </div>
          <CardContent className="p-5 grid sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-primary shrink-0" />
              <span className="text-foreground font-medium">
                {isRtl ? "تاريخ التسليم: " : "Due: "}
                {assignment.dueDate}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
              <span className="text-foreground font-medium">
                {isRtl ? "الدرجة: " : "Grade: "}
                {assignment.grade}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h2 className="font-bold text-foreground mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              {isRtl ? "وصف التكليف" : "Description"}
            </h2>
            <p className="text-sm text-foreground/80 leading-relaxed">
              {isRtl ? assignment.descAr : assignment.descEn}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 space-y-3">
            <h2 className="font-bold text-foreground flex items-center gap-2">
              <Upload className="w-4 h-4 text-primary" />
              {isRtl ? "إجابتك" : "Your Answer"}
            </h2>
            {checking ? (
              <div className="text-sm text-muted-foreground">
                {isRtl ? "جارٍ التحقق..." : "Checking..."}
              </div>
            ) : submitted || alreadySubmitted ? (
              <div className="space-y-2">
                <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-700 dark:text-green-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  {isRtl ? "تم تسليم التكليف بنجاح" : "Assignment submitted successfully"}
                </div>
                <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5" />
                  {isRtl ? "تم تسليم التكليف — لا يمكن إعادة التسليم" : "Assignment submitted — cannot be resubmitted"}
                </div>
              </div>
            ) : (
              <>
                <Textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder={isRtl ? "اكتب إجابتك هنا..." : "Write your answer here..."}
                  rows={6}
                />
                <Button onClick={handleSubmit} className="w-full sm:w-auto gap-2">
                  <Upload className="w-4 h-4" />
                  {isRtl ? "تسليم التكليف" : "Submit Assignment"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default StudentAssignmentDetail;
