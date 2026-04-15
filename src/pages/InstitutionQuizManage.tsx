import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, GraduationCap, Globe, Save, Loader2,
  Plus, Trash2, Pencil, ClipboardList, CheckCircle, Clock, Eye, EyeOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

const InstitutionQuizManage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { language, toggleLanguage } = useLanguage();
  const isRtl = language === "ar";
  const dir = isRtl ? "rtl" : "ltr";

  const editId = searchParams.get("id");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [institutionId, setInstitutionId] = useState("");
  const [institutionType, setInstitutionType] = useState<"college" | "institute">("college");
  const [departments, setDepartments] = useState<string[]>([]);

  // Quiz form
  const [form, setForm] = useState({
    title_ar: "", title_en: "",
    description_ar: "", description_en: "",
    duration_minutes: "30",
    due_date: "",
    department_name: "",
    is_published: false,
  });

  // Questions
  const [questions, setQuestions] = useState<any[]>([]);
  const [showQuestionDialog, setShowQuestionDialog] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);
  const [questionForm, setQuestionForm] = useState({
    question_ar: "", question_en: "",
    option_a_ar: "", option_a_en: "",
    option_b_ar: "", option_b_en: "",
    option_c_ar: "", option_c_en: "",
    option_d_ar: "", option_d_en: "",
    correct_answer: "a", points: "1",
  });
  const [savingQuestion, setSavingQuestion] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }
      const email = user.email?.toLowerCase();

      const { data: college } = await supabase
        .from("college_registrations").select("id")
        .eq("status", "approved").ilike("email", email || "").maybeSingle();

      if (college) {
        setInstitutionId(college.id);
        setInstitutionType("college");
        const { data: depts } = await supabase.from("departments").select("department_name").eq("institution_id", college.id);
        setDepartments((depts || []).map(d => d.department_name));
      } else {
        const { data: institute } = await supabase
          .from("institute_registrations").select("id")
          .eq("status", "approved").ilike("email", email || "").maybeSingle();
        if (institute) {
          setInstitutionId(institute.id);
          setInstitutionType("institute");
          const { data: depts } = await supabase.from("departments").select("department_name").eq("institution_id", institute.id);
          setDepartments((depts || []).map(d => d.department_name));
        }
      }

      if (editId) {
        const { data: quiz } = await supabase
          .from("institution_quizzes").select("*").eq("id", editId).maybeSingle();
        if (quiz) {
          setForm({
            title_ar: quiz.title_ar, title_en: quiz.title_en,
            description_ar: quiz.description_ar || "", description_en: quiz.description_en || "",
            duration_minutes: quiz.duration_minutes?.toString() || "30",
            due_date: quiz.due_date ? quiz.due_date.slice(0, 16) : "",
            department_name: quiz.department_name || "",
            is_published: quiz.is_published || false,
          });
        }
        // Load questions
        const { data: qs } = await supabase
          .from("institution_quiz_questions").select("*")
          .eq("quiz_id", editId).order("question_order", { ascending: true });
        setQuestions(qs || []);
      }

      setLoading(false);
    };
    init();
  }, [editId, navigate]);

  const handleSaveQuiz = async () => {
    if (!form.title_ar.trim() || !form.title_en.trim()) {
      toast({ title: isRtl ? "خطأ" : "Error", description: isRtl ? "يرجى ملء عنوان الاختبار" : "Please fill quiz title", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const payload = {
        institution_id: institutionId,
        institution_type: institutionType,
        title_ar: form.title_ar.trim(),
        title_en: form.title_en.trim(),
        description_ar: form.description_ar.trim() || null,
        description_en: form.description_en.trim() || null,
        duration_minutes: parseInt(form.duration_minutes) || 30,
        due_date: form.due_date || null,
        department_name: form.department_name || null,
        is_published: form.is_published,
        created_by: user.id,
      };

      if (editId) {
        const { error } = await supabase.from("institution_quizzes").update(payload).eq("id", editId);
        if (error) throw error;
        sonnerToast.success(isRtl ? "تم تحديث الاختبار" : "Quiz updated");
      } else {
        const { data, error } = await supabase.from("institution_quizzes").insert(payload).select().single();
        if (error) throw error;
        sonnerToast.success(isRtl ? "تم إنشاء الاختبار" : "Quiz created");
        // Navigate to edit mode to add questions
        navigate(`/institution/quizzes/manage?id=${data.id}`, { replace: true });
      }
    } catch (error: any) {
      toast({ title: isRtl ? "خطأ" : "Error", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const openAddQuestion = () => {
    setEditingQuestion(null);
    setQuestionForm({
      question_ar: "", question_en: "",
      option_a_ar: "", option_a_en: "",
      option_b_ar: "", option_b_en: "",
      option_c_ar: "", option_c_en: "",
      option_d_ar: "", option_d_en: "",
      correct_answer: "a", points: "1",
    });
    setShowQuestionDialog(true);
  };

  const openEditQuestion = (q: any) => {
    setEditingQuestion(q);
    setQuestionForm({
      question_ar: q.question_ar, question_en: q.question_en,
      option_a_ar: q.option_a_ar, option_a_en: q.option_a_en,
      option_b_ar: q.option_b_ar, option_b_en: q.option_b_en,
      option_c_ar: q.option_c_ar, option_c_en: q.option_c_en,
      option_d_ar: q.option_d_ar, option_d_en: q.option_d_en,
      correct_answer: q.correct_answer, points: q.points?.toString() || "1",
    });
    setShowQuestionDialog(true);
  };

  const handleSaveQuestion = async () => {
    if (!questionForm.question_ar.trim() || !questionForm.question_en.trim()) {
      toast({ title: isRtl ? "خطأ" : "Error", description: isRtl ? "يرجى ملء نص السؤال" : "Please fill question text", variant: "destructive" });
      return;
    }
    setSavingQuestion(true);
    try {
      const payload = {
        quiz_id: editId!,
        question_ar: questionForm.question_ar.trim(),
        question_en: questionForm.question_en.trim(),
        option_a_ar: questionForm.option_a_ar.trim(),
        option_a_en: questionForm.option_a_en.trim(),
        option_b_ar: questionForm.option_b_ar.trim(),
        option_b_en: questionForm.option_b_en.trim(),
        option_c_ar: questionForm.option_c_ar.trim(),
        option_c_en: questionForm.option_c_en.trim(),
        option_d_ar: questionForm.option_d_ar.trim(),
        option_d_en: questionForm.option_d_en.trim(),
        correct_answer: questionForm.correct_answer,
        points: parseInt(questionForm.points) || 1,
        question_order: editingQuestion ? editingQuestion.question_order : questions.length + 1,
      };

      if (editingQuestion) {
        const { error } = await supabase.from("institution_quiz_questions").update(payload).eq("id", editingQuestion.id);
        if (error) throw error;
        setQuestions(prev => prev.map(q => q.id === editingQuestion.id ? { ...q, ...payload } : q));
      } else {
        const { data, error } = await supabase.from("institution_quiz_questions").insert(payload).select().single();
        if (error) throw error;
        setQuestions(prev => [...prev, data]);
      }
      setShowQuestionDialog(false);
      sonnerToast.success(isRtl ? "تم حفظ السؤال" : "Question saved");
    } catch (error: any) {
      toast({ title: isRtl ? "خطأ" : "Error", description: error.message, variant: "destructive" });
    } finally {
      setSavingQuestion(false);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    const { error } = await supabase.from("institution_quiz_questions").delete().eq("id", id);
    if (!error) {
      setQuestions(prev => prev.filter(q => q.id !== id));
      sonnerToast.success(isRtl ? "تم حذف السؤال" : "Question deleted");
    }
  };

  const answerLabels = ["a", "b", "c", "d"];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      {/* Header */}
      <header className="border-b-2 border-primary/40 px-6 py-4 bg-card shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-[hsl(200,75%,30%)] shadow-lg shadow-primary/40 flex items-center justify-center group-hover:scale-105 transition-transform">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-black text-foreground tracking-tight">UNIGATES</span>
          </Link>
          <Button variant="outline" size="sm" onClick={toggleLanguage} className="gap-1.5">
            <Globe className="w-4 h-4" />
            {language === "ar" ? "EN" : "عربي"}
          </Button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <Button
          variant="ghost" size="sm"
          className="gap-1 mb-6 text-muted-foreground hover:text-foreground"
          onClick={() => navigate("/institution/dashboard?tab=quizmanage")}
        >
          {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          {isRtl ? "العودة للاختبارات" : "Back to Quizzes"}
        </Button>

        {/* Quiz Details Card */}
        <Card className="border-2 border-primary/20 mb-6">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-md">
                <ClipboardList className="w-5 h-5 text-white" />
              </div>
              {editId ? (isRtl ? "تعديل الاختبار" : "Edit Quiz") : (isRtl ? "إنشاء اختبار جديد" : "Create New Quiz")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">{isRtl ? "العنوان (عربي)" : "Title (Arabic)"} *</Label>
                <Input value={form.title_ar} onChange={e => setForm(p => ({ ...p, title_ar: e.target.value }))} placeholder={isRtl ? "عنوان الاختبار بالعربية" : "Quiz title in Arabic"} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">{isRtl ? "العنوان (إنجليزي)" : "Title (English)"} *</Label>
                <Input value={form.title_en} onChange={e => setForm(p => ({ ...p, title_en: e.target.value }))} placeholder={isRtl ? "عنوان الاختبار بالإنجليزية" : "Quiz title in English"} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">{isRtl ? "الوصف (عربي)" : "Description (Arabic)"}</Label>
                <Textarea value={form.description_ar} onChange={e => setForm(p => ({ ...p, description_ar: e.target.value }))} rows={2} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">{isRtl ? "الوصف (إنجليزي)" : "Description (English)"}</Label>
                <Textarea value={form.description_en} onChange={e => setForm(p => ({ ...p, description_en: e.target.value }))} rows={2} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">{isRtl ? "المدة (دقيقة)" : "Duration (min)"}</Label>
                <Input type="number" min="5" value={form.duration_minutes} onChange={e => setForm(p => ({ ...p, duration_minutes: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">{isRtl ? "تاريخ الاستحقاق" : "Due Date"}</Label>
                <Input type="datetime-local" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">{isRtl ? "القسم" : "Department"}</Label>
                {departments.length > 0 ? (
                  <Select value={form.department_name} onValueChange={v => setForm(p => ({ ...p, department_name: v }))}>
                    <SelectTrigger><SelectValue placeholder={isRtl ? "اختر القسم" : "Select"} /></SelectTrigger>
                    <SelectContent>
                      {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input value={form.department_name} onChange={e => setForm(p => ({ ...p, department_name: e.target.value }))} />
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 pt-2">
              <Button className="gap-2" onClick={handleSaveQuiz} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {editId ? (isRtl ? "تحديث الاختبار" : "Update Quiz") : (isRtl ? "حفظ الاختبار" : "Save Quiz")}
              </Button>
              {editId && (
                <Button variant="outline" size="sm" className="gap-1.5"
                  onClick={async () => {
                    const newVal = !form.is_published;
                    await supabase.from("institution_quizzes").update({ is_published: newVal }).eq("id", editId);
                    setForm(p => ({ ...p, is_published: newVal }));
                    sonnerToast.success(isRtl ? (newVal ? "تم النشر" : "تم الإلغاء") : (newVal ? "Published" : "Unpublished"));
                  }}>
                  {form.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {form.is_published ? (isRtl ? "إلغاء النشر" : "Unpublish") : (isRtl ? "نشر" : "Publish")}
                </Button>
              )}
              {form.is_published && <Badge className="bg-emerald-600">{isRtl ? "منشور ✅" : "Published ✅"}</Badge>}
            </div>
          </CardContent>
        </Card>

        {/* Questions Section - Only show after quiz is saved */}
        {editId && (
          <Card className="border-2 border-blue-500/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-500" />
                  {isRtl ? "الأسئلة" : "Questions"} ({questions.length})
                </CardTitle>
                <Button size="sm" className="gap-2" onClick={openAddQuestion}>
                  <Plus className="w-4 h-4" />
                  {isRtl ? "إضافة سؤال" : "Add Question"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {questions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">{isRtl ? "لا توجد أسئلة بعد" : "No questions yet"}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {questions.map((q, idx) => (
                    <Card key={q.id} className="border">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs">{idx + 1}</Badge>
                              <span className="text-xs text-muted-foreground">{q.points} {isRtl ? "نقطة" : "pts"}</span>
                            </div>
                            <p className="font-semibold text-sm mb-2">{isRtl ? q.question_ar : q.question_en}</p>
                            <div className="grid grid-cols-2 gap-1 text-xs">
                              {answerLabels.map(letter => {
                                const text = isRtl ? q[`option_${letter}_ar`] : q[`option_${letter}_en`];
                                return (
                                  <div key={letter} className={`px-2 py-1 rounded ${q.correct_answer === letter ? "bg-emerald-100 text-emerald-700 font-bold dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-muted"}`}>
                                    {letter.toUpperCase()}) {text}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEditQuestion(q)}>
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDeleteQuestion(q.id)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Question Dialog */}
      <Dialog open={showQuestionDialog} onOpenChange={setShowQuestionDialog}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" dir={dir}>
          <DialogHeader>
            <DialogTitle>
              {editingQuestion ? (isRtl ? "تعديل السؤال" : "Edit Question") : (isRtl ? "إضافة سؤال" : "Add Question")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">{isRtl ? "السؤال (عربي)" : "Question (Arabic)"} *</Label>
                <Textarea value={questionForm.question_ar} onChange={e => setQuestionForm(p => ({ ...p, question_ar: e.target.value }))} rows={2} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{isRtl ? "السؤال (إنجليزي)" : "Question (English)"} *</Label>
                <Textarea value={questionForm.question_en} onChange={e => setQuestionForm(p => ({ ...p, question_en: e.target.value }))} rows={2} />
              </div>
            </div>

            <Separator />

            {answerLabels.map(letter => (
              <div key={letter} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">{isRtl ? `الخيار ${letter.toUpperCase()} (عربي)` : `Option ${letter.toUpperCase()} (Arabic)`}</Label>
                  <Input value={(questionForm as any)[`option_${letter}_ar`]} onChange={e => setQuestionForm(p => ({ ...p, [`option_${letter}_ar`]: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{isRtl ? `الخيار ${letter.toUpperCase()} (إنجليزي)` : `Option ${letter.toUpperCase()} (English)`}</Label>
                  <Input value={(questionForm as any)[`option_${letter}_en`]} onChange={e => setQuestionForm(p => ({ ...p, [`option_${letter}_en`]: e.target.value }))} />
                </div>
              </div>
            ))}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">{isRtl ? "الإجابة الصحيحة" : "Correct Answer"}</Label>
                <Select value={questionForm.correct_answer} onValueChange={v => setQuestionForm(p => ({ ...p, correct_answer: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="a">A</SelectItem>
                    <SelectItem value="b">B</SelectItem>
                    <SelectItem value="c">C</SelectItem>
                    <SelectItem value="d">D</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{isRtl ? "النقاط" : "Points"}</Label>
                <Input type="number" min="1" value={questionForm.points} onChange={e => setQuestionForm(p => ({ ...p, points: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowQuestionDialog(false)}>{isRtl ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={handleSaveQuestion} disabled={savingQuestion} className="gap-2">
              {savingQuestion ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isRtl ? "حفظ" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InstitutionQuizManage;
