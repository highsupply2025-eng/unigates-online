import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ChevronLeft, ChevronRight, Plus, Trash2, CheckCircle, Clock, HelpCircle,
  GraduationCap, Save, Eye, EyeOff, BarChart3, Loader2, FileQuestion, ListChecks,
  Pencil, ArrowUp, ArrowDown, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import SimpleHeader from "@/components/SimpleHeader";

const QuizCreate = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { t, dir, language } = useLanguage();
  const { toast } = useToast();
  const isRtl = dir === "rtl";

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<any>(null);

  // Quizzes
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("list");

  // New quiz form
  const [newQuiz, setNewQuiz] = useState({
    title_ar: "", title_en: "",
    description_ar: "", description_en: "",
    duration_minutes: 30, due_date: ""
  });
  const [savingQuiz, setSavingQuiz] = useState(false);

  // Questions
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [selectedQuiz, setSelectedQuiz] = useState<any>(null);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [newQuestion, setNewQuestion] = useState({
    question_ar: "", question_en: "",
    option_a_ar: "", option_a_en: "", option_b_ar: "", option_b_en: "",
    option_c_ar: "", option_c_en: "", option_d_ar: "", option_d_en: "",
    correct_answer: "a", points: 1,
  });
  const [savingQuestion, setSavingQuestion] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editQuestion, setEditQuestion] = useState<any>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  // Results
  const [quizSubmissions, setQuizSubmissions] = useState<any[]>([]);
  const [showResultsDialog, setShowResultsDialog] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) { navigate("/login"); return; }
      setUser(u);

      if (courseId) {
        const { data: c } = await supabase.from("courses").select("*").eq("id", courseId).single();
        setCourse(c);
        await loadQuizzes(courseId);
      }
      setLoading(false);
    };
    init();
  }, [courseId]);

  const loadQuizzes = async (cId: string) => {
    const { data } = await supabase.from("quizzes").select("*").eq("course_id", cId).order("created_at", { ascending: false });
    setQuizzes(data || []);
  };

  const loadQuizQuestions = async (quizId: string) => {
    const { data } = await supabase.from("quiz_questions").select("*").eq("quiz_id", quizId).order("question_order");
    setQuizQuestions(data || []);
  };

  const loadQuizSubmissions = async (quizId: string) => {
    const { data } = await supabase.from("quiz_submissions").select("*").eq("quiz_id", quizId).order("submitted_at", { ascending: false });
    setQuizSubmissions(data || []);
  };

  const handleCreateQuiz = async () => {
    if (!courseId || !newQuiz.title_ar || !newQuiz.title_en) return;
    setSavingQuiz(true);
    try {
      const { error } = await supabase.from("quizzes").insert({
        course_id: courseId, creator_id: user.id,
        title_ar: newQuiz.title_ar, title_en: newQuiz.title_en,
        description_ar: newQuiz.description_ar || null,
        description_en: newQuiz.description_en || null,
        duration_minutes: newQuiz.duration_minutes,
        due_date: newQuiz.due_date || null,
      } as any);
      if (error) throw error;
      toast({ title: isRtl ? "تم إنشاء الاختبار بنجاح ✅" : "Quiz created successfully ✅" });
      setNewQuiz({ title_ar: "", title_en: "", description_ar: "", description_en: "", duration_minutes: 30, due_date: "" });
      await loadQuizzes(courseId);
      setActiveTab("list");
    } catch (err: any) {
      toast({ title: isRtl ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    } finally { setSavingQuiz(false); }
  };

  const handlePublishQuiz = async (quizId: string, publish: boolean) => {
    await supabase.from("quizzes").update({ is_published: publish } as any).eq("id", quizId);
    if (courseId) await loadQuizzes(courseId);
    toast({ title: publish ? (isRtl ? "تم نشر الاختبار" : "Quiz published") : (isRtl ? "تم إخفاء الاختبار" : "Quiz unpublished") });
  };

  const handleDeleteQuiz = async (quizId: string) => {
    await supabase.from("quiz_questions").delete().eq("quiz_id", quizId);
    await supabase.from("quizzes").delete().eq("id", quizId);
    if (courseId) await loadQuizzes(courseId);
    if (selectedQuizId === quizId) { setSelectedQuizId(null); setSelectedQuiz(null); setQuizQuestions([]); }
    toast({ title: isRtl ? "تم حذف الاختبار" : "Quiz deleted" });
  };

  const openQuizQuestions = async (quiz: any) => {
    setSelectedQuizId(quiz.id);
    setSelectedQuiz(quiz);
    await loadQuizQuestions(quiz.id);
    setActiveTab("questions");
  };

  const handleAddQuestion = async () => {
    if (!selectedQuizId || !newQuestion.question_ar || !newQuestion.question_en) return;
    setSavingQuestion(true);
    try {
      const nextOrder = quizQuestions.length + 1;
      const { error } = await supabase.from("quiz_questions").insert({
        quiz_id: selectedQuizId,
        ...newQuestion,
        question_order: nextOrder,
      } as any);
      if (error) throw error;
      setNewQuestion({
        question_ar: "", question_en: "",
        option_a_ar: "", option_a_en: "", option_b_ar: "", option_b_en: "",
        option_c_ar: "", option_c_en: "", option_d_ar: "", option_d_en: "",
        correct_answer: "a", points: 1,
      });
      await loadQuizQuestions(selectedQuizId);
      toast({ title: isRtl ? "تمت إضافة السؤال ✅" : "Question added ✅" });
    } catch (err: any) {
      toast({ title: isRtl ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    } finally { setSavingQuestion(false); }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    await supabase.from("quiz_questions").delete().eq("id", questionId);
    if (selectedQuizId) await loadQuizQuestions(selectedQuizId);
    toast({ title: isRtl ? "تم حذف السؤال" : "Question deleted" });
  };

  const startEditQuestion = (q: any) => {
    setEditingQuestionId(q.id);
    setEditQuestion({
      question_ar: q.question_ar, question_en: q.question_en,
      option_a_ar: q.option_a_ar, option_a_en: q.option_a_en,
      option_b_ar: q.option_b_ar, option_b_en: q.option_b_en,
      option_c_ar: q.option_c_ar, option_c_en: q.option_c_en,
      option_d_ar: q.option_d_ar, option_d_en: q.option_d_en,
      correct_answer: q.correct_answer, points: q.points,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingQuestionId || !editQuestion) return;
    setSavingEdit(true);
    try {
      const { error } = await supabase.from("quiz_questions").update(editQuestion as any).eq("id", editingQuestionId);
      if (error) throw error;
      setEditingQuestionId(null);
      setEditQuestion(null);
      if (selectedQuizId) await loadQuizQuestions(selectedQuizId);
      toast({ title: isRtl ? "تم تعديل السؤال ✅" : "Question updated ✅" });
    } catch (err: any) {
      toast({ title: isRtl ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    } finally { setSavingEdit(false); }
  };

  const handleReorder = async (questionId: string, direction: "up" | "down") => {
    const idx = quizQuestions.findIndex(q => q.id === questionId);
    if (idx < 0) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= quizQuestions.length) return;
    const a = quizQuestions[idx];
    const b = quizQuestions[swapIdx];
    await Promise.all([
      supabase.from("quiz_questions").update({ question_order: b.question_order } as any).eq("id", a.id),
      supabase.from("quiz_questions").update({ question_order: a.question_order } as any).eq("id", b.id),
    ]);
    if (selectedQuizId) await loadQuizQuestions(selectedQuizId);
  };

  const openResults = async (quizId: string) => {
    await loadQuizSubmissions(quizId);
    setShowResultsDialog(true);
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      <SimpleHeader />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 gap-2 text-muted-foreground hover:text-foreground">
          {isRtl ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          {isRtl ? "رجوع" : "Back"}
        </Button>

        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
            <FileQuestion className="w-7 h-7 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground">
              {isRtl ? "إدارة الاختبارات" : "Quiz Management"}
            </h1>
            {course && (
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                <GraduationCap className="w-4 h-4" />
                {isRtl ? course.title_ar : course.title_en}
              </p>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="list" className="gap-2">
              <ListChecks className="w-4 h-4" />
              {isRtl ? "الاختبارات" : "Quizzes"}
              {quizzes.length > 0 && <Badge variant="secondary" className="ms-1">{quizzes.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="create" className="gap-2">
              <Plus className="w-4 h-4" />
              {isRtl ? "إنشاء اختبار" : "Create Quiz"}
            </TabsTrigger>
            {selectedQuiz && (
              <TabsTrigger value="questions" className="gap-2">
                <HelpCircle className="w-4 h-4" />
                {isRtl ? "الأسئلة" : "Questions"}
                {quizQuestions.length > 0 && <Badge variant="secondary" className="ms-1">{quizQuestions.length}</Badge>}
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="list">
            {quizzes.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <FileQuestion className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
                  <p className="text-lg font-bold text-muted-foreground mb-2">{isRtl ? "لا توجد اختبارات بعد" : "No quizzes yet"}</p>
                  <p className="text-sm text-muted-foreground mb-4">{isRtl ? "أنشئ أول اختبار لهذه الدورة" : "Create your first quiz for this course"}</p>
                  <Button onClick={() => setActiveTab("create")} className="gap-2">
                    <Plus className="w-4 h-4" />{isRtl ? "إنشاء اختبار" : "Create Quiz"}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {quizzes.map(q => (
                  <Card key={q.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-bold text-foreground">
                              {isRtl ? q.title_ar : q.title_en}
                            </h3>
                            <Badge variant={q.is_published ? "default" : "secondary"}>
                              {q.is_published ? (isRtl ? "منشور ✅" : "Published ✅") : (isRtl ? "مسودة" : "Draft")}
                            </Badge>
                          </div>
                          {(isRtl ? q.description_ar : q.description_en) && (
                            <p className="text-sm text-muted-foreground mb-3">{isRtl ? q.description_ar : q.description_en}</p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {q.duration_minutes} {isRtl ? "دقيقة" : "min"}
                            </span>
                            {q.due_date && (
                              <span>{isRtl ? "الموعد:" : "Due:"} {new Date(q.due_date).toLocaleDateString(isRtl ? "ar-EG" : "en-US")}</span>
                            )}
                            <span>{isRtl ? "أنشئ:" : "Created:"} {new Date(q.created_at).toLocaleDateString(isRtl ? "ar-EG" : "en-US")}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Button size="sm" variant="outline" onClick={() => openQuizQuestions(q)} className="gap-1.5">
                            <HelpCircle className="w-3.5 h-3.5" />{isRtl ? "الأسئلة" : "Questions"}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => openResults(q.id)} className="gap-1.5">
                            <BarChart3 className="w-3.5 h-3.5" />{isRtl ? "النتائج" : "Results"}
                          </Button>
                          <Button
                            size="sm"
                            variant={q.is_published ? "secondary" : "default"}
                            onClick={() => handlePublishQuiz(q.id, !q.is_published)}
                            className="gap-1.5"
                          >
                            {q.is_published ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            {q.is_published ? (isRtl ? "إخفاء" : "Unpublish") : (isRtl ? "نشر" : "Publish")}
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDeleteQuiz(q.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="create">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  {isRtl ? "إنشاء اختبار جديد" : "Create New Quiz"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-2 block font-semibold">{isRtl ? "عنوان الاختبار (عربي)" : "Quiz Title (Arabic)"} *</Label>
                    <Input value={newQuiz.title_ar} onChange={e => setNewQuiz(p => ({ ...p, title_ar: e.target.value }))} placeholder={isRtl ? "مثال: اختبار الفصل الأول" : "e.g. Chapter 1 Quiz"} />
                  </div>
                  <div>
                    <Label className="mb-2 block font-semibold">{isRtl ? "عنوان الاختبار (إنجليزي)" : "Quiz Title (English)"} *</Label>
                    <Input value={newQuiz.title_en} onChange={e => setNewQuiz(p => ({ ...p, title_en: e.target.value }))} placeholder="e.g. Chapter 1 Quiz" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-2 block font-semibold">{isRtl ? "وصف الاختبار (عربي)" : "Description (Arabic)"}</Label>
                    <Textarea value={newQuiz.description_ar} onChange={e => setNewQuiz(p => ({ ...p, description_ar: e.target.value }))} rows={3} />
                  </div>
                  <div>
                    <Label className="mb-2 block font-semibold">{isRtl ? "وصف الاختبار (إنجليزي)" : "Description (English)"}</Label>
                    <Textarea value={newQuiz.description_en} onChange={e => setNewQuiz(p => ({ ...p, description_en: e.target.value }))} rows={3} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-2 block font-semibold">{isRtl ? "مدة الاختبار (بالدقائق)" : "Duration (minutes)"}</Label>
                    <Input type="number" min={1} value={newQuiz.duration_minutes} onChange={e => setNewQuiz(p => ({ ...p, duration_minutes: parseInt(e.target.value) || 30 }))} />
                  </div>
                  <div>
                    <Label className="mb-2 block font-semibold">{isRtl ? "الموعد النهائي" : "Due Date"}</Label>
                    <Input type="datetime-local" value={newQuiz.due_date} onChange={e => setNewQuiz(p => ({ ...p, due_date: e.target.value }))} />
                  </div>
                </div>

                <Separator />
                <Button onClick={handleCreateQuiz} disabled={savingQuiz || !newQuiz.title_ar || !newQuiz.title_en} className="w-full gap-2" size="lg">
                  {savingQuiz ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isRtl ? "إنشاء الاختبار" : "Create Quiz"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="questions">
            {selectedQuiz && (
              <div className="space-y-6">
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="p-4 flex items-center gap-4">
                    <FileQuestion className="w-8 h-8 text-primary" />
                    <div className="flex-1">
                      <h3 className="font-bold text-foreground">{isRtl ? selectedQuiz.title_ar : selectedQuiz.title_en}</h3>
                      <p className="text-xs text-muted-foreground">
                        {quizQuestions.length} {isRtl ? "سؤال" : "questions"} · {quizQuestions.reduce((s, q) => s + (q.points || 1), 0)} {isRtl ? "درجة" : "points"}
                      </p>
                    </div>
                    <Badge variant={selectedQuiz.is_published ? "default" : "secondary"}>
                      {selectedQuiz.is_published ? (isRtl ? "منشور" : "Published") : (isRtl ? "مسودة" : "Draft")}
                    </Badge>
                  </CardContent>
                </Card>

                {quizQuestions.length > 0 && (
                  <div className="space-y-3">
                    {quizQuestions.map((q, i) => (
                      <Card key={q.id} className={editingQuestionId === q.id ? "border-primary ring-1 ring-primary/30" : ""}>
                        <CardContent className="p-4">
                          {editingQuestionId === q.id && editQuestion ? (
                            /* ===== EDIT MODE ===== */
                            <div className="space-y-4">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-bold text-primary">{isRtl ? `تعديل السؤال ${i + 1}` : `Edit Question ${i + 1}`}</p>
                                <Button size="sm" variant="ghost" onClick={() => { setEditingQuestionId(null); setEditQuestion(null); }}><X className="w-4 h-4" /></Button>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                  <Label className="text-xs mb-1 block">{isRtl ? "السؤال (عربي)" : "Question (Arabic)"}</Label>
                                  <Textarea value={editQuestion.question_ar} onChange={e => setEditQuestion((p: any) => ({ ...p, question_ar: e.target.value }))} rows={2} />
                                </div>
                                <div>
                                  <Label className="text-xs mb-1 block">{isRtl ? "السؤال (إنجليزي)" : "Question (English)"}</Label>
                                  <Textarea value={editQuestion.question_en} onChange={e => setEditQuestion((p: any) => ({ ...p, question_en: e.target.value }))} rows={2} />
                                </div>
                              </div>
                              {['a', 'b', 'c', 'd'].map(opt => (
                                <div key={opt} className={`grid grid-cols-1 md:grid-cols-2 gap-3 p-2 rounded-lg border ${editQuestion.correct_answer === opt ? 'border-green-300 bg-green-50/50 dark:bg-green-950/20' : ''}`}>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-xs text-muted-foreground w-5">{opt.toUpperCase()}.</span>
                                    <Input size={1} value={editQuestion[`option_${opt}_ar`]} onChange={e => setEditQuestion((p: any) => ({ ...p, [`option_${opt}_ar`]: e.target.value }))} />
                                  </div>
                                  <Input value={editQuestion[`option_${opt}_en`]} onChange={e => setEditQuestion((p: any) => ({ ...p, [`option_${opt}_en`]: e.target.value }))} />
                                </div>
                              ))}
                              <div className="flex items-center gap-4">
                                <div className="flex-1">
                                  <Label className="text-xs mb-1 block">{isRtl ? "الإجابة الصحيحة" : "Correct Answer"}</Label>
                                  <Select value={editQuestion.correct_answer} onValueChange={v => setEditQuestion((p: any) => ({ ...p, correct_answer: v }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="a">A</SelectItem><SelectItem value="b">B</SelectItem>
                                      <SelectItem value="c">C</SelectItem><SelectItem value="d">D</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="w-24">
                                  <Label className="text-xs mb-1 block">{isRtl ? "الدرجة" : "Points"}</Label>
                                  <Input type="number" min={1} value={editQuestion.points} onChange={e => setEditQuestion((p: any) => ({ ...p, points: parseInt(e.target.value) || 1 }))} />
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button onClick={handleSaveEdit} disabled={savingEdit} className="gap-2">
                                  {savingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                  {isRtl ? "حفظ التعديلات" : "Save Changes"}
                                </Button>
                                <Button variant="outline" onClick={() => { setEditingQuestionId(null); setEditQuestion(null); }}>
                                  {isRtl ? "إلغاء" : "Cancel"}
                                </Button>
                              </div>
                            </div>
                          ) : (
                            /* ===== VIEW MODE ===== */
                            <>
                              <div className="flex items-start justify-between mb-3">
                                <p className="font-bold text-foreground">
                                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm me-2">{i + 1}</span>
                                  {isRtl ? q.question_ar : q.question_en}
                                </p>
                                <div className="flex items-center gap-1">
                                  <Badge variant="outline">{q.points} {isRtl ? "درجة" : "pts"}</Badge>
                                  <Button size="sm" variant="ghost" onClick={() => handleReorder(q.id, "up")} disabled={i === 0} className="h-8 w-8 p-0">
                                    <ArrowUp className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => handleReorder(q.id, "down")} disabled={i === quizQuestions.length - 1} className="h-8 w-8 p-0">
                                    <ArrowDown className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => startEditQuestion(q)} className="h-8 w-8 p-0 text-primary hover:text-primary">
                                    <Pencil className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => handleDeleteQuestion(q.id)} className="h-8 w-8 p-0 text-destructive hover:text-destructive">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {['a', 'b', 'c', 'd'].map(opt => (
                                  <div key={opt} className={`p-3 rounded-lg border text-sm ${q.correct_answer === opt ? 'bg-green-50 border-green-300 dark:bg-green-950/30 dark:border-green-700' : 'bg-muted/30'}`}>
                                    <span className="font-bold me-2 text-muted-foreground">{opt.toUpperCase()}.</span>
                                    {isRtl ? q[`option_${opt}_ar`] : q[`option_${opt}_en`]}
                                    {q.correct_answer === opt && <CheckCircle className="w-4 h-4 text-green-500 inline ms-2" />}
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                <Card className="border-dashed border-2">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      {isRtl ? "إضافة سؤال جديد" : "Add New Question"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="mb-1 block text-sm font-semibold">{isRtl ? "السؤال (عربي)" : "Question (Arabic)"} *</Label>
                        <Textarea value={newQuestion.question_ar} onChange={e => setNewQuestion(p => ({ ...p, question_ar: e.target.value }))} rows={2} />
                      </div>
                      <div>
                        <Label className="mb-1 block text-sm font-semibold">{isRtl ? "السؤال (إنجليزي)" : "Question (English)"} *</Label>
                        <Textarea value={newQuestion.question_en} onChange={e => setNewQuestion(p => ({ ...p, question_en: e.target.value }))} rows={2} />
                      </div>
                    </div>

                    <Separator />
                    <p className="text-sm font-semibold text-muted-foreground">{isRtl ? "خيارات الإجابة" : "Answer Options"}</p>

                    {['a', 'b', 'c', 'd'].map(opt => (
                      <div key={opt} className={`grid grid-cols-1 md:grid-cols-2 gap-3 p-3 rounded-lg border ${newQuestion.correct_answer === opt ? 'border-green-300 bg-green-50/50 dark:bg-green-950/20' : ''}`}>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-muted-foreground w-6">{opt.toUpperCase()}.</span>
                          <Input
                            placeholder={`${isRtl ? "الخيار" : "Option"} ${opt.toUpperCase()} (${isRtl ? "عربي" : "Arabic"})`}
                            value={(newQuestion as any)[`option_${opt}_ar`]}
                            onChange={e => setNewQuestion(p => ({ ...p, [`option_${opt}_ar`]: e.target.value }))}
                          />
                        </div>
                        <Input
                          placeholder={`${isRtl ? "الخيار" : "Option"} ${opt.toUpperCase()} (${isRtl ? "إنجليزي" : "English"})`}
                          value={(newQuestion as any)[`option_${opt}_en`]}
                          onChange={e => setNewQuestion(p => ({ ...p, [`option_${opt}_en`]: e.target.value }))}
                        />
                      </div>
                    ))}

                    <div className="flex items-center gap-6">
                      <div className="flex-1">
                        <Label className="text-sm mb-1 block font-semibold">{isRtl ? "الإجابة الصحيحة" : "Correct Answer"}</Label>
                        <Select value={newQuestion.correct_answer} onValueChange={v => setNewQuestion(p => ({ ...p, correct_answer: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="a">A</SelectItem>
                            <SelectItem value="b">B</SelectItem>
                            <SelectItem value="c">C</SelectItem>
                            <SelectItem value="d">D</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-28">
                        <Label className="text-sm mb-1 block font-semibold">{isRtl ? "الدرجة" : "Points"}</Label>
                        <Input type="number" min={1} value={newQuestion.points} onChange={e => setNewQuestion(p => ({ ...p, points: parseInt(e.target.value) || 1 }))} />
                      </div>
                    </div>

                    <Button onClick={handleAddQuestion} disabled={savingQuestion || !newQuestion.question_ar || !newQuestion.question_en} className="gap-2">
                      {savingQuestion ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      {isRtl ? "إضافة السؤال" : "Add Question"}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showResultsDialog} onOpenChange={setShowResultsDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isRtl ? "نتائج الاختبار" : "Quiz Results"}</DialogTitle>
          </DialogHeader>
          {quizSubmissions.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <BarChart3 className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
              {isRtl ? "لا توجد نتائج بعد" : "No results yet"}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{isRtl ? "الطالب" : "Student"}</TableHead>
                  <TableHead>{isRtl ? "الدرجة" : "Score"}</TableHead>
                  <TableHead>{isRtl ? "الإجمالي" : "Total"}</TableHead>
                  <TableHead>{isRtl ? "النسبة" : "%"}</TableHead>
                  <TableHead>{isRtl ? "التاريخ" : "Date"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quizSubmissions.map(s => (
                  <TableRow key={s.id}>
                    <TableCell>{s.student_id.slice(0, 8)}...</TableCell>
                    <TableCell className="font-bold">{s.score}</TableCell>
                    <TableCell>{s.total_points}</TableCell>
                    <TableCell>
                      <Badge variant={s.total_points > 0 && (s.score / s.total_points) >= 0.5 ? "default" : "destructive"}>
                        {s.total_points > 0 ? Math.round((s.score / s.total_points) * 100) : 0}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{new Date(s.submitted_at).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuizCreate;
