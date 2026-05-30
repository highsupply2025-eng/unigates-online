import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import SubPageHeader from "@/components/SubPageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { FileText, Calendar, Star, Send, ArrowLeft } from "lucide-react";

import { extractAssignmentId } from "@/lib/assignment-url";

export default function AssignmentDetail() {
  const { assignmentSlug } = useParams<{ assignmentSlug: string }>();
  const assignmentId = extractAssignmentId(assignmentSlug);
  const { t, dir } = useLanguage();
  const isRtl = dir === "rtl";
  const { toast } = useToast();

  const [assignment, setAssignment] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isOwner, setIsOwner] = useState(false);

  const [gradingId, setGradingId] = useState<string | null>(null);
  const [gradeValue, setGradeValue] = useState("");
  const [feedbackValue, setFeedbackValue] = useState("");

  // Student submission
  const [studentFile, setStudentFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (!assignmentId) return;
      const { data: a } = await supabase.from("assignments").select("*").eq("id", assignmentId).maybeSingle();
      setAssignment(a);
      if (a && user && a.creator_id === user.id) {
        setIsOwner(true);
        const { data: subs } = await supabase
          .from("assignment_submissions")
          .select("*")
          .eq("assignment_id", assignmentId)
          .order("submitted_at", { ascending: false });
        setSubmissions(subs || []);
      } else if (a && user) {
        const { data: mine } = await supabase
          .from("assignment_submissions")
          .select("*")
          .eq("assignment_id", assignmentId)
          .eq("student_id", user.id)
          .order("submitted_at", { ascending: false });
        setSubmissions(mine || []);
      }
      setLoading(false);
    })();
  }, [assignmentId]);

  const handleGrade = async (subId: string) => {
    const { error } = await supabase
      .from("assignment_submissions")
      .update({
        grade: gradeValue || null,
        feedback_ar: feedbackValue || null,
        feedback_en: feedbackValue || null,
        graded_at: new Date().toISOString(),
      })
      .eq("id", subId);
    if (error) {
      toast({ title: isRtl ? "خطأ" : "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: isRtl ? "تم الحفظ" : "Saved" });
    setGradingId(null);
    const { data: subs } = await supabase
      .from("assignment_submissions")
      .select("*")
      .eq("assignment_id", assignmentId!)
      .order("submitted_at", { ascending: false });
    setSubmissions(subs || []);
  };

  const handleStudentSubmit = async () => {
    if (!studentFile || !user || !assignmentId) return;
    setSubmitting(true);
    try {
      const ext = studentFile.name.split(".").pop();
      const path = `${user.id}/${assignmentId}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("assignment-files").upload(path, studentFile);
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("assignment-files").getPublicUrl(path);
      const { error } = await supabase.from("assignment_submissions").insert({
        assignment_id: assignmentId,
        student_id: user.id,
        file_url: urlData.publicUrl,
        file_name: studentFile.name,
      });
      if (error) throw error;
      toast({ title: isRtl ? "تم الإرسال" : "Submitted" });
      setStudentFile(null);
      const { data: mine } = await supabase
        .from("assignment_submissions")
        .select("*")
        .eq("assignment_id", assignmentId)
        .eq("student_id", user.id);
      setSubmissions(mine || []);
    } catch (err: any) {
      toast({ title: isRtl ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <SubPageHeader titleAr="تفاصيل التكليف" titleEn="Assignment Details" icon={<FileText className="w-5 h-5" />} backTo="/lecturer/dashboard?tab=assignments" />
        <div className="container py-10 text-center text-muted-foreground">{isRtl ? "جارٍ التحميل..." : "Loading..."}</div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="min-h-screen bg-background">
        <SubPageHeader titleAr="تفاصيل التكليف" titleEn="Assignment Details" icon={<FileText className="w-5 h-5" />} backTo="/lecturer/dashboard?tab=assignments" />
        <div className="container py-10 text-center text-muted-foreground">{isRtl ? "التكليف غير موجود" : "Assignment not found"}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      <SubPageHeader titleAr="تفاصيل التكليف" titleEn="Assignment Details" icon={<FileText className="w-5 h-5" />} backTo="/lecturer/dashboard?tab=assignments" />
      <div className="container max-w-3xl py-6 px-4">
        <div className={isRtl ? "text-right" : "text-left"}>
          <h1 className="text-2xl font-bold text-foreground mb-2">{isRtl ? assignment.title_ar : assignment.title_en}</h1>
          {(isRtl ? assignment.description_ar : assignment.description_en) && (
            <p className="text-muted-foreground mb-4">{isRtl ? assignment.description_ar : assignment.description_en}</p>
          )}
          <div className="flex items-center gap-3 flex-wrap text-sm text-muted-foreground mb-6">
            {assignment.file_url && (
              <a href={assignment.file_url} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1">
                <FileText className="w-4 h-4" /> {assignment.file_name || (isRtl ? "ملف التكليف" : "File")}
              </a>
            )}
            {assignment.due_date && (
              <Badge variant="outline" className="gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(assignment.due_date).toLocaleDateString(isRtl ? "ar-EG" : "en-US")}
              </Badge>
            )}
          </div>
        </div>

        {/* Student Submission Form */}
        {!isOwner && user && (
          <Card className="mb-6">
            <CardContent className="p-5 space-y-3">
              <h3 className="font-bold text-foreground">{isRtl ? "إرسال إجابتك" : "Submit your answer"}</h3>
              <Input type="file" onChange={e => setStudentFile(e.target.files?.[0] || null)} />
              <Button onClick={handleStudentSubmit} disabled={!studentFile || submitting} className="gap-2">
                <Send className="w-4 h-4" />{isRtl ? "إرسال" : "Submit"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Submissions list */}
        <div>
          <h2 className="text-lg font-bold text-foreground mb-3">
            {isOwner ? (isRtl ? "إجابات الطلبة" : "Student Submissions") : (isRtl ? "إجاباتي" : "My Submissions")}
          </h2>
          {submissions.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">{isRtl ? "لا توجد إجابات بعد" : "No submissions yet"}</div>
          ) : (
            <div className="space-y-3">
              {submissions.map(sub => (
                <Card key={sub.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex-1 min-w-0">
                        {isOwner && (
                          <p className="text-sm text-muted-foreground mb-1">
                            {isRtl ? "الطالب:" : "Student:"} {sub.student_id?.slice(0, 8)}...
                          </p>
                        )}
                        <a href={sub.file_url} target="_blank" rel="noreferrer" className="text-primary hover:underline text-sm flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5" /> {sub.file_name || (isRtl ? "الملف" : "File")}
                        </a>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(sub.submitted_at).toLocaleString(isRtl ? "ar-EG" : "en-US")}
                        </p>
                        {sub.grade && (
                          <div className="mt-2 flex items-center gap-2 flex-wrap">
                            <Star className="w-4 h-4 text-primary" />
                            <span className="font-bold">{sub.grade}</span>
                            {(sub.feedback_ar || sub.feedback_en) && (
                              <span className="text-sm text-muted-foreground">— {isRtl ? sub.feedback_ar : sub.feedback_en}</span>
                            )}
                          </div>
                        )}
                      </div>
                      {isOwner && (
                        <div>
                          {gradingId === sub.id ? (
                            <div className="space-y-2 w-48">
                              <Input placeholder={isRtl ? "الدرجة" : "Grade"} value={gradeValue} onChange={e => setGradeValue(e.target.value)} />
                              <Input placeholder={isRtl ? "ملاحظات" : "Feedback"} value={feedbackValue} onChange={e => setFeedbackValue(e.target.value)} />
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => handleGrade(sub.id)}>{isRtl ? "حفظ" : "Save"}</Button>
                                <Button size="sm" variant="outline" onClick={() => setGradingId(null)}>{isRtl ? "إلغاء" : "Cancel"}</Button>
                              </div>
                            </div>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => { setGradingId(sub.id); setGradeValue(sub.grade || ""); setFeedbackValue(sub.feedback_ar || ""); }}>
                              <Star className="w-3.5 h-3.5 me-1" />
                              {sub.grade ? (isRtl ? "تعديل" : "Edit") : (isRtl ? "تقييم" : "Grade")}
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
