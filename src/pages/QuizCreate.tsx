import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Plus, Trash2, CheckCircle, Clock, HelpCircle,
  GraduationCap, Save, Eye, EyeOff, BarChart3, Loader2, FileQuestion, ListChecks,
  Pencil, ArrowUp, ArrowDown, X, Shuffle, Zap, Image as ImageIcon, Type, ToggleLeft, AlignLeft, ListOrdered,
  Upload, Download, FileSpreadsheet, AlertCircle
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
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import LecturerPageHeader from "@/components/LecturerPageHeader";
import { parseQuizFile, downloadTemplate, ParsedQuestion } from "@/lib/quiz-import";

type QType = "mcq" | "true_false" | "short_answer" | "fill_blank";

const emptyQuestion = {
  question_type: "mcq" as QType,
  question_ar: "", question_en: "",
  option_a_ar: "", option_a_en: "", option_b_ar: "", option_b_en: "",
  option_c_ar: "", option_c_en: "", option_d_ar: "", option_d_en: "",
  correct_answer: "a",
  expected_answer: "",
  image_url: "",
  points: 1,
};

const QuizCreate = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { dir } = useLanguage();
  const { toast } = useToast();
  const isRtl = dir === "rtl";

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<any>(null);

  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("list");

  const [newQuiz, setNewQuiz] = useState({
    title_ar: "", title_en: "",
    description_ar: "", description_en: "",
    duration_minutes: 30, due_date: "",
    randomize_questions: false,
    show_results_immediately: true,
  });
  const [savingQuiz, setSavingQuiz] = useState(false);

  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [selectedQuiz, setSelectedQuiz] = useState<any>(null);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [newQuestion, setNewQuestion] = useState<any>(emptyQuestion);
  const [savingQuestion, setSavingQuestion] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editQuestion, setEditQuestion] = useState<any>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [quizSubmissions, setQuizSubmissions] = useState<any[]>([]);
  const [showResultsDialog, setShowResultsDialog] = useState(false);

  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importPreview, setImportPreview] = useState<ParsedQuestion[]>([]);
  const [importErrors, setImportErrors] = useState<{ row: number; message: string }[]>([]);
  const [importFileName, setImportFileName] = useState("");

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
        randomize_questions: newQuiz.randomize_questions,
        show_results_immediately: newQuiz.show_results_immediately,
      } as any);
      if (error) throw error;
      toast({ title: isRtl ? "تم إنشاء الاختبار بنجاح ✅" : "Quiz created ✅" });
      setNewQuiz({ title_ar: "", title_en: "", description_ar: "", description_en: "", duration_minutes: 30, due_date: "", randomize_questions: false, show_results_immediately: true });
      await loadQuizzes(courseId);
      setActiveTab("list");
    } catch (err: any) {
      toast({ title: isRtl ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    } finally { setSavingQuiz(false); }
  };

  const handlePublishQuiz = async (quizId: string, publish: boolean) => {
    await supabase.from("quizzes").update({ is_published: publish } as any).eq("id", quizId);
    if (publish) {
      // Notify leadership roles that a new quiz needs approval
      const { data: { user: u } } = await supabase.auth.getUser();
      const quiz = quizzes.find(q => q.id === quizId);
      if (u && quiz) {
        const titleAr = `اختبار جديد بانتظار الاعتماد: ${quiz.title_ar}`;
        const titleEn = `New quiz pending approval: ${quiz.title_en}`;
        const msgAr = "تم نشر اختبار جديد ويحتاج موافقتكم لاعتماد نتائجه.";
        const msgEn = "A new quiz has been published and requires your approval.";
        const rows = ["department_head", "vice_dean", "dean"].map(r => ({
          sender_id: u.id,
          target_role: r,
          notification_type: "quiz_approval",
          title_ar: titleAr, title_en: titleEn,
          message_ar: msgAr, message_en: msgEn,
        }));
        await supabase.from("notifications").insert(rows);
      }
    }
    if (courseId) await loadQuizzes(courseId);
    toast({ title: publish ? (isRtl ? "تم النشر" : "Published") : (isRtl ? "تم الإخفاء" : "Unpublished") });
  };

  const handleToggleQuizSetting = async (quizId: string, field: string, value: boolean) => {
    await supabase.from("quizzes").update({ [field]: value } as any).eq("id", quizId);
    if (courseId) await loadQuizzes(courseId);
  };

  const handleDeleteQuiz = async (quizId: string) => {
    await supabase.from("quiz_questions").delete().eq("quiz_id", quizId);
    await supabase.from("quizzes").delete().eq("id", quizId);
    if (courseId) await loadQuizzes(courseId);
    if (selectedQuizId === quizId) { setSelectedQuizId(null); setSelectedQuiz(null); setQuizQuestions([]); }
    toast({ title: isRtl ? "تم الحذف" : "Deleted" });
  };

  const openQuizQuestions = async (quiz: any) => {
    setSelectedQuizId(quiz.id);
    setSelectedQuiz(quiz);
    await loadQuizQuestions(quiz.id);
    setActiveTab("questions");
  };

  const buildQuestionPayload = (q: any) => {
    const base: any = {
      question_type: q.question_type,
      question_ar: q.question_ar,
      question_en: q.question_en,
      points: q.points || 1,
      image_url: q.image_url || null,
    };
    if (q.question_type === "mcq") {
      return {
        ...base,
        option_a_ar: q.option_a_ar, option_a_en: q.option_a_en,
        option_b_ar: q.option_b_ar, option_b_en: q.option_b_en,
        option_c_ar: q.option_c_ar, option_c_en: q.option_c_en,
        option_d_ar: q.option_d_ar, option_d_en: q.option_d_en,
        correct_answer: q.correct_answer,
        expected_answer: null,
      };
    }
    if (q.question_type === "true_false") {
      return {
        ...base,
        option_a_ar: "صح", option_a_en: "True",
        option_b_ar: "خطأ", option_b_en: "False",
        option_c_ar: null, option_c_en: null, option_d_ar: null, option_d_en: null,
        correct_answer: q.correct_answer === "b" ? "b" : "a",
        expected_answer: null,
      };
    }
    // short_answer / fill_blank
    return {
      ...base,
      option_a_ar: null, option_a_en: null, option_b_ar: null, option_b_en: null,
      option_c_ar: null, option_c_en: null, option_d_ar: null, option_d_en: null,
      correct_answer: "a",
      expected_answer: q.expected_answer || null,
    };
  };

  const handleAddQuestion = async () => {
    if (!selectedQuizId || !newQuestion.question_ar || !newQuestion.question_en) return;
    setSavingQuestion(true);
    try {
      const nextOrder = quizQuestions.length + 1;
      const payload = buildQuestionPayload(newQuestion);
      const { error } = await supabase.from("quiz_questions").insert({
        quiz_id: selectedQuizId, question_order: nextOrder, ...payload,
      } as any);
      if (error) throw error;
      setNewQuestion(emptyQuestion);
      await loadQuizQuestions(selectedQuizId);
      toast({ title: isRtl ? "تمت الإضافة ✅" : "Added ✅" });
    } catch (err: any) {
      toast({ title: isRtl ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    } finally { setSavingQuestion(false); }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    await supabase.from("quiz_questions").delete().eq("id", questionId);
    if (selectedQuizId) await loadQuizQuestions(selectedQuizId);
  };

  const startEditQuestion = (q: any) => {
    setEditingQuestionId(q.id);
    setEditQuestion({ ...q });
  };

  const handleSaveEdit = async () => {
    if (!editingQuestionId || !editQuestion) return;
    setSavingEdit(true);
    try {
      const payload = buildQuestionPayload(editQuestion);
      const { error } = await supabase.from("quiz_questions").update(payload as any).eq("id", editingQuestionId);
      if (error) throw error;
      setEditingQuestionId(null);
      setEditQuestion(null);
      if (selectedQuizId) await loadQuizQuestions(selectedQuizId);
      toast({ title: isRtl ? "تم التعديل ✅" : "Updated ✅" });
    } catch (err: any) {
      toast({ title: isRtl ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    } finally { setSavingEdit(false); }
  };

  const handleReorder = async (questionId: string, direction: "up" | "down") => {
    const idx = quizQuestions.findIndex(q => q.id === questionId);
    if (idx < 0) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= quizQuestions.length) return;
    const a = quizQuestions[idx], b = quizQuestions[swapIdx];
    await Promise.all([
      supabase.from("quiz_questions").update({ question_order: b.question_order } as any).eq("id", a.id),
      supabase.from("quiz_questions").update({ question_order: a.question_order } as any).eq("id", b.id),
    ]);
    if (selectedQuizId) await loadQuizQuestions(selectedQuizId);
  };

  const uploadImage = async (file: File, target: "new" | "edit") => {
    if (!user) return;
    setUploadingImage(true);
    try {
      const path = `${user.id}/quiz/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("user-documents").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("user-documents").getPublicUrl(path);
      const url = data.publicUrl;
      if (target === "new") setNewQuestion((p: any) => ({ ...p, image_url: url }));
      else setEditQuestion((p: any) => ({ ...p, image_url: url }));
      toast({ title: isRtl ? "تم رفع الصورة" : "Image uploaded" });
    } catch (err: any) {
      toast({ title: isRtl ? "خطأ في الرفع" : "Upload failed", description: err.message, variant: "destructive" });
    } finally { setUploadingImage(false); }
  };

  const openResults = async (quizId: string) => {
    await loadQuizSubmissions(quizId);
    setShowResultsDialog(true);
  };

  const buildExportRows = () => {
    return quizSubmissions.map((s, i) => {
      const pct = s.total_points > 0 ? Math.round((s.score / s.total_points) * 100) : 0;
      return {
        [isRtl ? "#" : "#"]: i + 1,
        [isRtl ? "معرف الطالب" : "Student ID"]: s.student_id,
        [isRtl ? "الدرجة" : "Score"]: s.score ?? 0,
        [isRtl ? "الإجمالي" : "Total"]: s.total_points ?? 0,
        [isRtl ? "النسبة %" : "Percentage %"]: pct,
        [isRtl ? "النتيجة" : "Result"]: pct >= 50 ? (isRtl ? "ناجح" : "Pass") : (isRtl ? "راسب" : "Fail"),
        [isRtl ? "تاريخ التسليم" : "Submitted At"]: new Date(s.submitted_at).toLocaleString(isRtl ? "ar-EG" : "en-US"),
      };
    });
  };

  const getExportFileName = (ext: string) => {
    const title = (isRtl ? selectedQuiz?.title_ar : selectedQuiz?.title_en) || "quiz";
    const safe = String(title).replace(/[^\p{L}\p{N}_-]+/gu, "_").slice(0, 60);
    const date = new Date().toISOString().slice(0, 10);
    return `${safe}_results_${date}.${ext}`;
  };

  const handleExportExcel = async () => {
    if (quizSubmissions.length === 0) return;
    const XLSX = await import("xlsx");
    const rows = buildExportRows();
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, isRtl ? "النتائج" : "Results");
    XLSX.writeFile(wb, getExportFileName("xlsx"));
    toast({ title: isRtl ? "تم التصدير" : "Exported", description: isRtl ? "تم تنزيل ملف Excel" : "Excel file downloaded" });
  };

  const handleExportCSV = () => {
    if (quizSubmissions.length === 0) return;
    const rows = buildExportRows();
    const headers = Object.keys(rows[0]);
    const escape = (v: any) => {
      const s = String(v ?? "");
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = [headers.join(","), ...rows.map(r => headers.map(h => escape((r as any)[h])).join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = getExportFileName("csv");
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: isRtl ? "تم التصدير" : "Exported", description: isRtl ? "تم تنزيل ملف CSV" : "CSV file downloaded" });
  };

  const handleFileSelect = async (file: File) => {
    setImportFileName(file.name);
    setImporting(true);
    try {
      const { questions: parsed, errors } = await parseQuizFile(file);
      setImportPreview(parsed);
      setImportErrors(errors);
    } catch (err: any) {
      toast({ title: isRtl ? "فشل قراءة الملف" : "Failed to read file", description: err.message, variant: "destructive" });
    } finally { setImporting(false); }
  };

  const handleConfirmImport = async () => {
    if (!selectedQuizId || importPreview.length === 0) return;
    setImporting(true);
    try {
      const baseOrder = quizQuestions.length;
      const rows = importPreview.map((q, i) => ({ quiz_id: selectedQuizId, question_order: baseOrder + i + 1, ...q }));
      const { error } = await supabase.from("quiz_questions").insert(rows as any);
      if (error) throw error;
      toast({ title: isRtl ? `تم استيراد ${importPreview.length} سؤال ✅` : `Imported ${importPreview.length} questions ✅` });
      setShowImportDialog(false);
      setImportPreview([]); setImportErrors([]); setImportFileName("");
      await loadQuizQuestions(selectedQuizId);
    } catch (err: any) {
      toast({ title: isRtl ? "فشل الاستيراد" : "Import failed", description: err.message, variant: "destructive" });
    } finally { setImporting(false); }
  };

  const typeLabel = (t: QType) => {
    const map: Record<QType, { ar: string; en: string; icon: any }> = {
      mcq: { ar: "اختيار من متعدد", en: "Multiple Choice", icon: ListOrdered },
      true_false: { ar: "صح / خطأ", en: "True / False", icon: ToggleLeft },
      short_answer: { ar: "إجابة قصيرة", en: "Short Answer", icon: Type },
      fill_blank: { ar: "املأ الفراغ", en: "Fill in Blank", icon: AlignLeft },
    };
    return map[t] || map.mcq;
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  // ====== Reusable Question Form Renderer ======
  const renderQuestionForm = (q: any, setQ: (updater: any) => void, isEdit = false) => (
    <div className="space-y-4">
      {/* Type selector */}
      <div>
        <Label className="mb-2 block text-sm font-semibold">{isRtl ? "نوع السؤال" : "Question Type"}</Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(["mcq", "true_false", "short_answer", "fill_blank"] as QType[]).map(t => {
            const tl = typeLabel(t);
            const Icon = tl.icon;
            const sel = q.question_type === t;
            return (
              <button key={t} type="button"
                onClick={() => setQ((p: any) => ({ ...p, question_type: t, correct_answer: t === "true_false" ? "a" : (p.correct_answer || "a") }))}
                className={`p-2.5 rounded-lg border-2 text-xs font-semibold flex flex-col items-center gap-1 transition-all ${sel ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40 text-muted-foreground"}`}>
                <Icon className="w-4 h-4" />
                <span className="text-center leading-tight">{isRtl ? tl.ar : tl.en}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <Label className="text-xs mb-1 block">{isRtl ? "نص السؤال (عربي)" : "Question (Arabic)"} *</Label>
          <Textarea value={q.question_ar} onChange={e => setQ((p: any) => ({ ...p, question_ar: e.target.value }))} rows={2} />
        </div>
        <div>
          <Label className="text-xs mb-1 block">{isRtl ? "نص السؤال (إنجليزي)" : "Question (English)"} *</Label>
          <Textarea value={q.question_en} onChange={e => setQ((p: any) => ({ ...p, question_en: e.target.value }))} rows={2} />
        </div>
      </div>

      {/* Image upload */}
      <div>
        <Label className="text-xs mb-1 block flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5" /> {isRtl ? "صورة توضيحية (اختياري)" : "Illustration Image (optional)"}
        </Label>
        <div className="flex items-center gap-2">
          <Input type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(f, isEdit ? "edit" : "new"); }} disabled={uploadingImage} className="text-xs" />
          {q.image_url && (
            <>
              <img src={q.image_url} alt="" className="w-12 h-12 rounded-lg object-cover border" />
              <Button size="icon" variant="ghost" type="button" onClick={() => setQ((p: any) => ({ ...p, image_url: "" }))}><X className="w-4 h-4" /></Button>
            </>
          )}
        </div>
      </div>

      {/* Type-specific fields */}
      {q.question_type === "mcq" && (
        <>
          <Separator />
          <p className="text-sm font-semibold text-muted-foreground">{isRtl ? "خيارات الإجابة" : "Answer Options"}</p>
          {["a", "b", "c", "d"].map(opt => (
            <div key={opt} className={`grid grid-cols-1 md:grid-cols-2 gap-3 p-2.5 rounded-lg border ${q.correct_answer === opt ? "border-green-300 bg-green-50/50 dark:bg-green-950/20" : ""}`}>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-muted-foreground w-6">{opt.toUpperCase()}.</span>
                <Input placeholder={`${isRtl ? "عربي" : "Arabic"}`} value={q[`option_${opt}_ar`] || ""} onChange={e => setQ((p: any) => ({ ...p, [`option_${opt}_ar`]: e.target.value }))} />
              </div>
              <Input placeholder="English" value={q[`option_${opt}_en`] || ""} onChange={e => setQ((p: any) => ({ ...p, [`option_${opt}_en`]: e.target.value }))} />
            </div>
          ))}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label className="text-xs mb-1 block">{isRtl ? "الإجابة الصحيحة" : "Correct Answer"}</Label>
              <Select value={q.correct_answer} onValueChange={v => setQ((p: any) => ({ ...p, correct_answer: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="a">A</SelectItem><SelectItem value="b">B</SelectItem>
                  <SelectItem value="c">C</SelectItem><SelectItem value="d">D</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-24">
              <Label className="text-xs mb-1 block">{isRtl ? "الدرجة" : "Points"}</Label>
              <Input type="number" min={1} value={q.points} onChange={e => setQ((p: any) => ({ ...p, points: parseInt(e.target.value) || 1 }))} />
            </div>
          </div>
        </>
      )}

      {q.question_type === "true_false" && (
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Label className="text-xs mb-1 block">{isRtl ? "الإجابة الصحيحة" : "Correct Answer"}</Label>
            <Select value={q.correct_answer} onValueChange={v => setQ((p: any) => ({ ...p, correct_answer: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="a">{isRtl ? "صح ✓" : "True ✓"}</SelectItem>
                <SelectItem value="b">{isRtl ? "خطأ ✗" : "False ✗"}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-24">
            <Label className="text-xs mb-1 block">{isRtl ? "الدرجة" : "Points"}</Label>
            <Input type="number" min={1} value={q.points} onChange={e => setQ((p: any) => ({ ...p, points: parseInt(e.target.value) || 1 }))} />
          </div>
        </div>
      )}

      {(q.question_type === "short_answer" || q.question_type === "fill_blank") && (
        <div className="space-y-3">
          <div>
            <Label className="text-xs mb-1 block">
              {q.question_type === "fill_blank"
                ? (isRtl ? "الإجابة الصحيحة (للتصحيح التلقائي)" : "Correct Answer (auto-grading)")
                : (isRtl ? "إجابة نموذجية (لتصحيح يدوي من المحاضر)" : "Model Answer (manual grading)")}
            </Label>
            <Textarea value={q.expected_answer || ""} onChange={e => setQ((p: any) => ({ ...p, expected_answer: e.target.value }))} rows={2}
              placeholder={q.question_type === "fill_blank" ? (isRtl ? "اكتب الإجابة المتوقعة" : "Type expected answer") : (isRtl ? "اختياري" : "optional")} />
          </div>
          <div className="w-24">
            <Label className="text-xs mb-1 block">{isRtl ? "الدرجة" : "Points"}</Label>
            <Input type="number" min={1} value={q.points} onChange={e => setQ((p: any) => ({ ...p, points: parseInt(e.target.value) || 1 }))} />
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      <LecturerPageHeader
        titleAr="إدارة الاختبار"
        titleEn="Quiz Management"
        icon={<FileQuestion className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
      />
      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {course && (
          <div className="mb-6 sm:mb-8 flex items-center gap-2 text-sm text-muted-foreground">
            <GraduationCap className="w-4 h-4 shrink-0" />
            <span className="truncate font-semibold">{isRtl ? course.title_ar : course.title_en}</span>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0 mb-4 sm:mb-5">
            <TabsList className="inline-flex w-max sm:w-auto">
              <TabsTrigger value="list" className="gap-1.5 text-xs sm:text-sm"><ListChecks className="w-3.5 h-3.5 sm:w-4 sm:h-4" />{isRtl ? "الاختبارات" : "Quizzes"}{quizzes.length > 0 && <Badge variant="secondary" className="ms-1 h-4 px-1.5 text-[10px]">{quizzes.length}</Badge>}</TabsTrigger>
              <TabsTrigger value="create" className="gap-1.5 text-xs sm:text-sm"><Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />{isRtl ? "إنشاء" : "Create"}</TabsTrigger>
              {selectedQuiz && (
                <TabsTrigger value="questions" className="gap-1.5 text-xs sm:text-sm"><HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />{isRtl ? "الأسئلة" : "Questions"}{quizQuestions.length > 0 && <Badge variant="secondary" className="ms-1 h-4 px-1.5 text-[10px]">{quizQuestions.length}</Badge>}</TabsTrigger>
              )}
            </TabsList>
          </div>

          <TabsContent value="list">
            {quizzes.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <FileQuestion className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
                  <p className="text-lg font-bold text-muted-foreground mb-2">{isRtl ? "لا توجد اختبارات بعد" : "No quizzes yet"}</p>
                  <Button onClick={() => setActiveTab("create")} className="gap-2 mt-3"><Plus className="w-4 h-4" />{isRtl ? "إنشاء اختبار" : "Create Quiz"}</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {quizzes.map(q => (
                  <Card key={q.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex flex-col lg:flex-row items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <h3 className="text-base sm:text-lg font-bold text-foreground">{isRtl ? q.title_ar : q.title_en}</h3>
                            <Badge variant={q.is_published ? "default" : "secondary"}>{q.is_published ? (isRtl ? "منشور ✅" : "Published") : (isRtl ? "مسودة" : "Draft")}</Badge>
                            {q.randomize_questions && <Badge variant="outline" className="gap-1"><Shuffle className="w-3 h-3" />{isRtl ? "عشوائي" : "Random"}</Badge>}
                            {q.show_results_immediately && <Badge variant="outline" className="gap-1"><Zap className="w-3 h-3" />{isRtl ? "نتيجة فورية" : "Instant"}</Badge>}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{q.duration_minutes} {isRtl ? "دقيقة" : "min"}</span>
                            {q.due_date && <span>{isRtl ? "الموعد:" : "Due:"} {new Date(q.due_date).toLocaleDateString(isRtl ? "ar-EG" : "en-US")}</span>}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full lg:w-auto">
                          <Button size="sm" variant="outline" onClick={() => openQuizQuestions(q)} className="gap-1.5 text-xs"><HelpCircle className="w-3.5 h-3.5" />{isRtl ? "الأسئلة" : "Questions"}</Button>
                          <Button size="sm" variant="outline" onClick={() => openResults(q.id)} className="gap-1.5 text-xs"><BarChart3 className="w-3.5 h-3.5" />{isRtl ? "النتائج" : "Results"}</Button>
                          <Button size="sm" variant={q.is_published ? "secondary" : "default"} onClick={() => handlePublishQuiz(q.id, !q.is_published)} className="gap-1.5 text-xs">
                            {q.is_published ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            {q.is_published ? (isRtl ? "إخفاء" : "Unpublish") : (isRtl ? "نشر" : "Publish")}
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDeleteQuiz(q.id)} className="gap-1.5 text-xs"><Trash2 className="w-3.5 h-3.5" /><span className="sm:hidden">{isRtl ? "حذف" : "Delete"}</span></Button>
                        </div>
                      </div>

                      {/* Inline template settings */}
                      <div className="mt-4 pt-4 border-t flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Switch checked={!!q.randomize_questions} onCheckedChange={v => handleToggleQuizSetting(q.id, "randomize_questions", v)} />
                          <Label className="text-xs cursor-pointer flex items-center gap-1"><Shuffle className="w-3 h-3" />{isRtl ? "ترتيب عشوائي" : "Randomize"}</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch checked={!!q.show_results_immediately} onCheckedChange={v => handleToggleQuizSetting(q.id, "show_results_immediately", v)} />
                          <Label className="text-xs cursor-pointer flex items-center gap-1"><Zap className="w-3 h-3" />{isRtl ? "إظهار النتيجة فوراً" : "Instant results"}</Label>
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
                <CardTitle className="flex items-center gap-2"><Plus className="w-5 h-5" />{isRtl ? "إنشاء قالب اختبار جديد" : "New Quiz Template"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-2 block font-semibold">{isRtl ? "عنوان (عربي)" : "Title (Arabic)"} *</Label>
                    <Input value={newQuiz.title_ar} onChange={e => setNewQuiz(p => ({ ...p, title_ar: e.target.value }))} />
                  </div>
                  <div>
                    <Label className="mb-2 block font-semibold">{isRtl ? "عنوان (إنجليزي)" : "Title (English)"} *</Label>
                    <Input value={newQuiz.title_en} onChange={e => setNewQuiz(p => ({ ...p, title_en: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-2 block font-semibold">{isRtl ? "وصف (عربي)" : "Description (Arabic)"}</Label>
                    <Textarea value={newQuiz.description_ar} onChange={e => setNewQuiz(p => ({ ...p, description_ar: e.target.value }))} rows={3} />
                  </div>
                  <div>
                    <Label className="mb-2 block font-semibold">{isRtl ? "وصف (إنجليزي)" : "Description (English)"}</Label>
                    <Textarea value={newQuiz.description_en} onChange={e => setNewQuiz(p => ({ ...p, description_en: e.target.value }))} rows={3} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-2 block font-semibold">{isRtl ? "المدة (دقيقة)" : "Duration (min)"}</Label>
                    <Input type="number" min={1} value={newQuiz.duration_minutes} onChange={e => setNewQuiz(p => ({ ...p, duration_minutes: parseInt(e.target.value) || 30 }))} />
                  </div>
                  <div>
                    <Label className="mb-2 block font-semibold">{isRtl ? "الموعد النهائي" : "Due Date"}</Label>
                    <Input type="datetime-local" value={newQuiz.due_date} onChange={e => setNewQuiz(p => ({ ...p, due_date: e.target.value }))} />
                  </div>
                </div>

                <Separator />
                <p className="text-sm font-semibold">{isRtl ? "إعدادات القالب" : "Template Settings"}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                    <Label className="cursor-pointer flex items-center gap-2"><Shuffle className="w-4 h-4 text-primary" />{isRtl ? "ترتيب الأسئلة عشوائياً" : "Randomize question order"}</Label>
                    <Switch checked={newQuiz.randomize_questions} onCheckedChange={v => setNewQuiz(p => ({ ...p, randomize_questions: v }))} />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                    <Label className="cursor-pointer flex items-center gap-2"><Zap className="w-4 h-4 text-amber-500" />{isRtl ? "إظهار النتيجة فور التسليم" : "Show result immediately"}</Label>
                    <Switch checked={newQuiz.show_results_immediately} onCheckedChange={v => setNewQuiz(p => ({ ...p, show_results_immediately: v }))} />
                  </div>
                </div>

                <Separator />
                <Button onClick={handleCreateQuiz} disabled={savingQuiz || !newQuiz.title_ar || !newQuiz.title_en} className="w-full gap-2" size="lg">
                  {savingQuiz ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isRtl ? "إنشاء القالب" : "Create Template"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="questions">
            {selectedQuiz && (
              <div className="space-y-5">
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <FileQuestion className="w-7 h-7 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-foreground truncate">{isRtl ? selectedQuiz.title_ar : selectedQuiz.title_en}</h3>
                        <p className="text-xs text-muted-foreground">
                          {quizQuestions.length} {isRtl ? "سؤال" : "Q"} · {quizQuestions.reduce((s, q) => s + (q.points || 1), 0)} {isRtl ? "درجة" : "pts"}
                        </p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => { setImportPreview([]); setImportErrors([]); setImportFileName(""); setShowImportDialog(true); }} className="gap-1.5 w-full sm:w-auto">
                      <Upload className="w-4 h-4" />{isRtl ? "استيراد بنك أسئلة" : "Import Question Bank"}
                    </Button>
                  </CardContent>
                </Card>

                {quizQuestions.length > 0 && (
                  <div className="space-y-3">
                    {quizQuestions.map((q, i) => {
                      const tl = typeLabel(q.question_type as QType);
                      return (
                        <Card key={q.id} className={editingQuestionId === q.id ? "border-primary ring-1 ring-primary/30" : ""}>
                          <CardContent className="p-4">
                            {editingQuestionId === q.id && editQuestion ? (
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-bold text-primary">{isRtl ? `تعديل السؤال ${i + 1}` : `Edit Q${i + 1}`}</p>
                                  <Button size="sm" variant="ghost" onClick={() => { setEditingQuestionId(null); setEditQuestion(null); }}><X className="w-4 h-4" /></Button>
                                </div>
                                {renderQuestionForm(editQuestion, setEditQuestion, true)}
                                <div className="flex gap-2">
                                  <Button onClick={handleSaveEdit} disabled={savingEdit} className="gap-2">
                                    {savingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    {isRtl ? "حفظ" : "Save"}
                                  </Button>
                                  <Button variant="outline" onClick={() => { setEditingQuestionId(null); setEditQuestion(null); }}>{isRtl ? "إلغاء" : "Cancel"}</Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-start justify-between gap-2 mb-3">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">{i + 1}</span>
                                      <Badge variant="outline" className="gap-1 text-[10px]"><tl.icon className="w-3 h-3" />{isRtl ? tl.ar : tl.en}</Badge>
                                      <Badge variant="outline" className="text-[10px]">{q.points} {isRtl ? "د" : "pt"}</Badge>
                                    </div>
                                    <p className="font-bold text-foreground text-sm">{isRtl ? q.question_ar : q.question_en}</p>
                                  </div>
                                  <div className="flex items-center gap-0.5 shrink-0">
                                    <Button size="sm" variant="ghost" onClick={() => handleReorder(q.id, "up")} disabled={i === 0} className="h-7 w-7 p-0"><ArrowUp className="w-3.5 h-3.5" /></Button>
                                    <Button size="sm" variant="ghost" onClick={() => handleReorder(q.id, "down")} disabled={i === quizQuestions.length - 1} className="h-7 w-7 p-0"><ArrowDown className="w-3.5 h-3.5" /></Button>
                                    <Button size="sm" variant="ghost" onClick={() => startEditQuestion(q)} className="h-7 w-7 p-0 text-primary"><Pencil className="w-3.5 h-3.5" /></Button>
                                    <Button size="sm" variant="ghost" onClick={() => handleDeleteQuestion(q.id)} className="h-7 w-7 p-0 text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
                                  </div>
                                </div>

                                {q.image_url && <img src={q.image_url} alt="" className="rounded-lg border max-h-40 object-cover mb-3" />}

                                {q.question_type === "mcq" && (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {["a", "b", "c", "d"].map(opt => {
                                      const txt = isRtl ? q[`option_${opt}_ar`] : q[`option_${opt}_en`];
                                      if (!txt) return null;
                                      return (
                                        <div key={opt} className={`p-2.5 rounded-lg border text-sm ${q.correct_answer === opt ? "bg-green-50 border-green-300 dark:bg-green-950/30 dark:border-green-700" : "bg-muted/30"}`}>
                                          <span className="font-bold me-2 text-muted-foreground">{opt.toUpperCase()}.</span>{txt}
                                          {q.correct_answer === opt && <CheckCircle className="w-4 h-4 text-green-500 inline ms-2" />}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}

                                {q.question_type === "true_false" && (
                                  <div className="flex gap-2">
                                    <div className={`flex-1 p-2.5 rounded-lg border text-sm ${q.correct_answer === "a" ? "bg-green-50 border-green-300" : "bg-muted/30"}`}>
                                      {isRtl ? "صح ✓" : "True ✓"} {q.correct_answer === "a" && <CheckCircle className="w-4 h-4 text-green-500 inline ms-2" />}
                                    </div>
                                    <div className={`flex-1 p-2.5 rounded-lg border text-sm ${q.correct_answer === "b" ? "bg-green-50 border-green-300" : "bg-muted/30"}`}>
                                      {isRtl ? "خطأ ✗" : "False ✗"} {q.correct_answer === "b" && <CheckCircle className="w-4 h-4 text-green-500 inline ms-2" />}
                                    </div>
                                  </div>
                                )}

                                {(q.question_type === "short_answer" || q.question_type === "fill_blank") && (
                                  <div className="p-2.5 rounded-lg border bg-muted/30 text-sm">
                                    <span className="font-bold text-muted-foreground me-2">{isRtl ? "الإجابة:" : "Answer:"}</span>
                                    {q.expected_answer || <span className="italic text-muted-foreground">{isRtl ? "تصحيح يدوي" : "manual grading"}</span>}
                                  </div>
                                )}
                              </>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}

                <Card className="border-dashed border-2">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2"><Plus className="w-4 h-4" />{isRtl ? "إضافة سؤال جديد" : "Add Question"}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {renderQuestionForm(newQuestion, setNewQuestion, false)}
                    <Button onClick={handleAddQuestion} disabled={savingQuestion || !newQuestion.question_ar || !newQuestion.question_en} className="gap-2 w-full sm:w-auto">
                      {savingQuestion ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      {isRtl ? "إضافة" : "Add"}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showResultsDialog} onOpenChange={setShowResultsDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[calc(100vw-1.5rem)] sm:w-full p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">{isRtl ? "نتائج الاختبار" : "Quiz Results"}</DialogTitle>
          </DialogHeader>
          {quizSubmissions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={handleExportExcel} className="gap-1.5 text-xs">
                <FileSpreadsheet className="w-3.5 h-3.5" />{isRtl ? "تصدير Excel" : "Export Excel"}
              </Button>
              <Button size="sm" variant="outline" onClick={handleExportCSV} className="gap-1.5 text-xs">
                <Download className="w-3.5 h-3.5" />{isRtl ? "تصدير CSV" : "Export CSV"}
              </Button>
            </div>
          )}
          {quizSubmissions.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <BarChart3 className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
              {isRtl ? "لا توجد نتائج بعد" : "No results yet"}
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
              <Table>
                <TableHeader><TableRow>
                  <TableHead className="text-xs sm:text-sm">{isRtl ? "الطالب" : "Student"}</TableHead>
                  <TableHead className="text-xs sm:text-sm">{isRtl ? "الدرجة" : "Score"}</TableHead>
                  <TableHead className="text-xs sm:text-sm">{isRtl ? "الإجمالي" : "Total"}</TableHead>
                  <TableHead className="text-xs sm:text-sm">{isRtl ? "النسبة" : "%"}</TableHead>
                  <TableHead className="text-xs sm:text-sm">{isRtl ? "التاريخ" : "Date"}</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {quizSubmissions.map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="text-xs sm:text-sm">{s.student_id.slice(0, 8)}...</TableCell>
                      <TableCell className="font-bold text-xs sm:text-sm">{s.score}</TableCell>
                      <TableCell className="text-xs sm:text-sm">{s.total_points}</TableCell>
                      <TableCell>
                        <Badge variant={s.total_points > 0 && (s.score / s.total_points) >= 0.5 ? "default" : "destructive"} className="text-[10px] sm:text-xs">
                          {s.total_points > 0 ? Math.round((s.score / s.total_points) * 100) : 0}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm whitespace-nowrap">{new Date(s.submitted_at).toLocaleDateString(isRtl ? "ar-EG" : "en-US")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[calc(100vw-1.5rem)] sm:w-full p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-primary" />
              {isRtl ? "استيراد بنك أسئلة" : "Import Question Bank"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs sm:text-sm space-y-2">
              <p className="font-semibold text-foreground">{isRtl ? "📋 خطوات الاستيراد:" : "📋 Steps:"}</p>
              <ol className="list-decimal ms-5 space-y-1 text-muted-foreground">
                <li>{isRtl ? "حمّل القالب الجاهز (Excel) واملأه بأسئلتك" : "Download template (Excel) and fill in questions"}</li>
                <li>{isRtl ? "ادعم 4 أنواع: mcq / true_false / short_answer / fill_blank" : "Supports 4 types: mcq / true_false / short_answer / fill_blank"}</li>
                <li>{isRtl ? "ارفع الملف وراجع المعاينة قبل التأكيد" : "Upload file and preview before confirming"}</li>
              </ol>
            </div>

            <Button variant="outline" onClick={downloadTemplate} className="w-full gap-2">
              <Download className="w-4 h-4" />{isRtl ? "تحميل القالب (Excel)" : "Download Template (Excel)"}
            </Button>

            <div>
              <Label className="text-xs mb-1.5 block">{isRtl ? "ارفع ملف CSV أو Excel" : "Upload CSV or Excel file"}</Label>
              <Input type="file" accept=".csv,.xlsx,.xls" disabled={importing}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }} />
              {importFileName && <p className="text-xs text-muted-foreground mt-1.5">📎 {importFileName}</p>}
            </div>

            {importing && (
              <div className="flex items-center justify-center py-6 gap-2 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />{isRtl ? "جارٍ القراءة..." : "Reading..."}
              </div>
            )}

            {importErrors.length > 0 && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 max-h-32 overflow-y-auto">
                <p className="text-xs font-bold text-destructive mb-2 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />{isRtl ? `${importErrors.length} خطأ` : `${importErrors.length} errors`}
                </p>
                <ul className="text-xs space-y-1 text-destructive/80">
                  {importErrors.slice(0, 10).map((e, i) => (
                    <li key={i}>{isRtl ? `صف ${e.row}:` : `Row ${e.row}:`} {e.message}</li>
                  ))}
                </ul>
              </div>
            )}

            {importPreview.length > 0 && (
              <div>
                <p className="text-xs font-bold text-foreground mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  {isRtl ? `جاهز للاستيراد: ${importPreview.length} سؤال` : `Ready: ${importPreview.length} questions`}
                </p>
                <div className="rounded-lg border max-h-48 overflow-y-auto divide-y">
                  {importPreview.slice(0, 20).map((q, i) => {
                    const tl = typeLabel(q.question_type);
                    return (
                      <div key={i} className="p-2.5 text-xs flex items-start gap-2">
                        <Badge variant="outline" className="text-[10px] gap-1 shrink-0"><tl.icon className="w-3 h-3" />{isRtl ? tl.ar : tl.en}</Badge>
                        <span className="flex-1 truncate text-foreground">{isRtl ? q.question_ar : q.question_en}</span>
                        <Badge variant="secondary" className="text-[10px] shrink-0">{q.points} {isRtl ? "د" : "pt"}</Badge>
                      </div>
                    );
                  })}
                  {importPreview.length > 20 && (
                    <div className="p-2 text-center text-xs text-muted-foreground">+{importPreview.length - 20} {isRtl ? "سؤال آخر" : "more"}</div>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowImportDialog(false)} className="sm:flex-1">
                {isRtl ? "إلغاء" : "Cancel"}
              </Button>
              <Button onClick={handleConfirmImport} disabled={importing || importPreview.length === 0} className="sm:flex-1 gap-2">
                {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {isRtl ? `استيراد ${importPreview.length} سؤال` : `Import ${importPreview.length}`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuizCreate;
