import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { ClipboardList, Calendar, FileText, Upload, CheckCircle2, Lock, Download, Image as ImageIcon, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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

  const [realAssignment, setRealAssignment] = useState<any | null>(null);
  const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const isUuid = /^[0-9a-f-]{36}$/i.test(assignmentId || "");

      if (isUuid && assignmentId) {
        const { data: asgData } = await supabase
          .from("assignments")
          .select("*, courses:course_id(title_ar, title_en)")
          .eq("id", assignmentId)
          .maybeSingle();

        if (!cancelled && asgData) {
          setRealAssignment(asgData);
        }
      }

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

  const assignment = realAssignment ? {
    id: realAssignment.id,
    titleAr: realAssignment.title_ar || realAssignment.title_en,
    titleEn: realAssignment.title_en || realAssignment.title_ar,
    instructorAr: isRtl ? "مدرس المقرر" : "Course Lecturer",
    instructorEn: "Course Lecturer",
    courseAr: realAssignment.courses?.title_ar || (isRtl ? "مقرر جامعي" : "University Course"),
    courseEn: realAssignment.courses?.title_en || "University Course",
    dueDate: realAssignment.due_date ? new Date(realAssignment.due_date).toLocaleDateString(isRtl ? "ar-EG" : "en-US") : "-",
    grade: realAssignment.points || 10,
    descAr: realAssignment.description_ar || realAssignment.description_en || "",
    descEn: realAssignment.description_en || realAssignment.description_ar || "",
    fileUrls: realAssignment.file_urls || (realAssignment.file_url ? [realAssignment.file_url] : []),
    fileNames: realAssignment.file_names || (realAssignment.file_name ? [realAssignment.file_name] : []),
    imageUrls: realAssignment.image_urls || [],
  } : {
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
    fileUrls: [],
    fileNames: [],
    imageUrls: [],
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
              {isRtl ? "وصف وتعليمات التكليف" : "Assignment Description"}
            </h2>
            <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
              {isRtl ? assignment.descAr : assignment.descEn}
            </p>
          </CardContent>
        </Card>

        {/* Attached Files & Documents */}
        {assignment.fileUrls && assignment.fileUrls.length > 0 && (
          <Card className="border-2 border-amber-500/30 bg-amber-500/5">
            <CardContent className="p-5 space-y-3">
              <h2 className="font-black text-foreground flex items-center gap-2 text-sm">
                <FileText className="w-4 h-4 text-amber-600" />
                {isRtl ? "المستندات والملفات المرفقة بالتكليف" : "Attached Assignment Files"}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {assignment.fileUrls.map((url: string, idx: number) => {
                  const name = assignment.fileNames?.[idx] || `Document_${idx + 1}`;
                  return (
                    <div key={idx} className="p-3 rounded-2xl bg-card border flex items-center justify-between gap-2 shadow-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-4 h-4 text-amber-600 shrink-0" />
                        <span className="text-xs font-bold truncate">{name}</span>
                      </div>
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-black text-amber-700 dark:text-amber-400 hover:underline shrink-0"
                      >
                        <Download className="w-3.5 h-3.5" />
                        {isRtl ? "تحميل" : "Download"}
                      </a>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Attached Images Gallery */}
        {assignment.imageUrls && assignment.imageUrls.length > 0 && (
          <Card className="border-2 border-pink-500/30 bg-pink-500/5">
            <CardContent className="p-5 space-y-3">
              <h2 className="font-black text-foreground flex items-center gap-2 text-sm">
                <ImageIcon className="w-4 h-4 text-pink-600" />
                {isRtl ? `الرسومات والصور التوضيحية (${assignment.imageUrls.length})` : "Assignment Images & Figures"}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {assignment.imageUrls.map((imgUrl: string, idx: number) => (
                  <div
                    key={idx}
                    onClick={() => setZoomImageUrl(imgUrl)}
                    className="h-32 rounded-2xl border border-border overflow-hidden bg-black/5 cursor-pointer hover:opacity-90 transition-opacity relative group"
                  >
                    <img src={imgUrl} alt={`Figure ${idx + 1}`} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-black gap-1">
                      <Eye className="w-4 h-4" />
                      <span>{isRtl ? "تكبير" : "Zoom"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

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

      {/* Image Zoom Modal */}
      <Dialog open={!!zoomImageUrl} onOpenChange={() => setZoomImageUrl(null)}>
        <DialogContent className="max-w-4xl rounded-3xl p-2 bg-black/90 border-0 flex items-center justify-center">
          {zoomImageUrl && (
            <img src={zoomImageUrl} alt="Preview" className="max-h-[85vh] max-w-full object-contain rounded-2xl" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentAssignmentDetail;
