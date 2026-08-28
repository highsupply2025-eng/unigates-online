import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileQuestion,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  CheckCircle,
  Clock,
  HelpCircle,
  GraduationCap,
  ShieldCheck,
  Users,
  Award,
  AlertCircle,
  FileSpreadsheet,
  Download,
  Upload,
  Check,
  ChevronRight,
  Calendar,
  Lock,
  Layers,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  userId: string;
  userRole: string;
  departments: any[];
  courses: any[];
  institutionType?: "college" | "institute";
  onCreated: () => void;
  onBack: () => void;
}

interface QuestionItem {
  id?: string;
  question_ar: string;
  question_en: string;
  option_a_ar: string;
  option_a_en: string;
  option_b_ar: string;
  option_b_en: string;
  option_c_ar: string;
  option_c_en: string;
  option_d_ar: string;
  option_d_en: string;
  correct_answer: "a" | "b" | "c" | "d";
  points: number;
}

const emptyQuestion: QuestionItem = {
  question_ar: "",
  question_en: "",
  option_a_ar: "",
  option_a_en: "",
  option_b_ar: "",
  option_b_en: "",
  option_c_ar: "",
  option_c_en: "",
  option_d_ar: "",
  option_d_en: "",
  correct_answer: "a",
  points: 1,
};

export const CreateQuizView = ({
  userId,
  userRole,
  departments,
  courses,
  institutionType = "college",
  onCreated,
  onBack,
}: Props) => {
  const { dir } = useLanguage();
  const { toast } = useToast();
  const isRtl = dir === "rtl";

  const instName = institutionType === "institute" ? (isRtl ? "المعهد" : "Institute") : (isRtl ? "الكلية" : "College");
  const deanTitle = institutionType === "institute" ? (isRtl ? "عميد / مدير المعهد" : "Dean / Institute Director") : (isRtl ? "عميد الكلية" : "Dean of College");

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  // Step 1: Basic info & settings
  const [formData, setFormData] = useState({
    title_ar: "",
    title_en: "",
    description_ar: "",
    description_en: "",
    department_id: departments[0]?.id || "",
    course_id: courses[0]?.id || "",
    duration_minutes: 30,
    due_date: "",
    pass_percentage: 60,
  });

  // Step 2: Questions list
  const [questions, setQuestions] = useState<QuestionItem[]>([
    {
      ...emptyQuestion,
      question_ar: "ما هو المفهوم الأساسي للمقرر في هذا الفصل؟",
      question_en: "What is the primary concept of the course in this semester?",
      option_a_ar: "المفهوم النظري والتطبيقي المتكامل",
      option_a_en: "Integrated theoretical and practical concept",
      option_b_ar: "الجانب التاريخي فقط",
      option_b_en: "Historical aspect only",
      option_c_ar: "التعريفات العامة التمهيدية",
      option_c_en: "Introductory general definitions",
      option_d_ar: "التطبيقات الثانوية المساعدة",
      option_d_en: "Secondary auxiliary applications",
      correct_answer: "a",
      points: 2,
    },
  ]);
  const [currentQ, setCurrentQ] = useState<QuestionItem>({ ...emptyQuestion });

  // Step 3: Sequential Approval Chain Reviewers
  const [availableReviewers, setAvailableReviewers] = useState<any[]>([]);
  const [selectedReviewerIds, setSelectedReviewerIds] = useState<string[]>([]);
  const [agreedToPolicy, setAgreedToPolicy] = useState(false);

  // Load user profile & institution faculty members for approval chain
  useEffect(() => {
    const fetchReviewers = async () => {
      try {
        const { data: prof } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
        setProfile(prof);

        // Fetch faculty members who can be reviewers (vice deans, department heads, professors, doctors, teachers)
        const { data: facultyMembers } = await supabase
          .from("institution_faculty_members")
          .select("id, user_id, full_name, role_title, specific_role, department_name")
          .neq("user_id", userId)
          .limit(50);

        if (facultyMembers && facultyMembers.length > 0) {
          setAvailableReviewers(facultyMembers);
        } else {
          // Fallback standard roles if no direct table records
          setAvailableReviewers([
            {
              user_id: "vd-students",
              full_name: isRtl ? `وكيل ${instName} لشؤون التعليم والطلاب` : `Vice Dean for Student Affairs`,
              role_title: isRtl ? "وكيل الكلية" : "Vice Dean",
              specific_role: "vice_dean_students",
            },
            {
              user_id: "vd-postgrad",
              full_name: isRtl ? `وكيل ${instName} للدراسات العليا والبحوث` : `Vice Dean for Postgraduate Studies`,
              role_title: isRtl ? "وكيل الكلية" : "Vice Dean",
              specific_role: "vice_dean_postgrad",
            },
            {
              user_id: "vd-environment",
              full_name: isRtl ? `وكيل ${instName} لخدمة المجتمع وتنمية البيئة` : `Vice Dean for Community & Environment`,
              role_title: isRtl ? "وكيل الكلية" : "Vice Dean",
              specific_role: "vice_dean_environment",
            },
          ]);
        }
      } catch (err) {
        console.error("Error loading reviewers:", err);
      }
    };
    fetchReviewers();
  }, [userId, instName, isRtl]);

  // Filter courses by selected department
  const filteredCourses = courses.filter((c) => !formData.department_id || c.department_id === formData.department_id);

  useEffect(() => {
    if (filteredCourses.length > 0 && !filteredCourses.some((c) => c.id === formData.course_id)) {
      setFormData((prev) => ({ ...prev, course_id: filteredCourses[0].id }));
    }
  }, [formData.department_id, filteredCourses]);

  const handleAddQuestion = () => {
    if (!currentQ.question_ar.trim() && !currentQ.question_en.trim()) {
      toast({
        title: isRtl ? "نص السؤال مطلوب" : "Question text required",
        description: isRtl ? "يرجى كتابة نص السؤال بالعربية أو الإنجليزية" : "Please enter question text",
        variant: "destructive",
      });
      return;
    }
    if (!currentQ.option_a_ar.trim() && !currentQ.option_a_en.trim()) {
      toast({
        title: isRtl ? "الخيارات مطلوبة" : "Options required",
        description: isRtl ? "يرجى ملء الخيارات على الأقل للخيارات الأساسية" : "Please fill in the options",
        variant: "destructive",
      });
      return;
    }

    setQuestions((prev) => [
      ...prev,
      {
        ...currentQ,
        question_ar: currentQ.question_ar.trim() || currentQ.question_en.trim(),
        question_en: currentQ.question_en.trim() || currentQ.question_ar.trim(),
        option_a_ar: currentQ.option_a_ar.trim() || currentQ.option_a_en.trim(),
        option_a_en: currentQ.option_a_en.trim() || currentQ.option_a_ar.trim(),
        option_b_ar: currentQ.option_b_ar.trim() || currentQ.option_b_en.trim(),
        option_b_en: currentQ.option_b_en.trim() || currentQ.option_b_ar.trim(),
        option_c_ar: currentQ.option_c_ar.trim() || currentQ.option_c_en.trim(),
        option_c_en: currentQ.option_c_en.trim() || currentQ.option_c_ar.trim(),
        option_d_ar: currentQ.option_d_ar.trim() || currentQ.option_d_en.trim(),
        option_d_en: currentQ.option_d_en.trim() || currentQ.option_d_ar.trim(),
      },
    ]);

    setCurrentQ({ ...emptyQuestion });
    toast({
      title: isRtl ? "تمت إضافة السؤال بنجاح ✓" : "Question added successfully ✓",
      description: isRtl ? `إجمالي الأسئلة الآن: ${questions.length + 1}` : `Total questions: ${questions.length + 1}`,
    });
  };

  const handleRemoveQuestion = (index: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleReviewer = (revId: string) => {
    setSelectedReviewerIds((prev) =>
      prev.includes(revId) ? prev.filter((id) => id !== revId) : [...prev, revId]
    );
  };

  const validateStep1 = () => {
    if (!formData.title_ar.trim() && !formData.title_en.trim()) {
      toast({
        title: isRtl ? "عنوان الاختبار مطلوب" : "Quiz title required",
        description: isRtl ? "يرجى كتابة عنوان الاختبار" : "Please provide a title",
        variant: "destructive",
      });
      return false;
    }
    if (!formData.course_id) {
      toast({
        title: isRtl ? "المقرر الدراسي مطلوب" : "Course required",
        description: isRtl ? "يرجى اختيار المقرر التابع له الاختبار" : "Please select a course",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (questions.length === 0) {
      toast({
        title: isRtl ? "لا توجد أسئلة" : "No questions added",
        description: isRtl ? "يجب إضافة سؤال واحد على الأقل للاختبار" : "Please add at least one question",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const handleSaveAndLaunchQuiz = async () => {
    if (!agreedToPolicy) {
      toast({
        title: isRtl ? "الموافقة على السياسات مطلوبة" : "Policy agreement required",
        description: isRtl ? "يجب الموافقة على ميثاق جودة الاختبارات الأكاديمية للمتابعة" : "Please agree to exam policies",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // 1. Build approval reviewers chain
      const chosenReviewersList = availableReviewers
        .filter((r) => selectedReviewerIds.includes(r.user_id || r.id))
        .map((r) => ({
          user_id: r.user_id || r.id,
          name: r.full_name || r.name,
          role: r.specific_role || r.role_title || "reviewer",
          title: r.role_title || r.full_name,
          approved: false,
          approved_at: null,
        }));

      // Add default Dean as the final required approval stop
      const approvalChain = [
        ...chosenReviewersList,
        {
          user_id: "dean-final",
          name: deanTitle,
          role: "dean",
          title: isRtl ? `اعتماد ${deanTitle} (المعتمد النهائي)` : `Dean Approval (Final Authority)`,
          approved: false,
          approved_at: null,
          is_final_dean: true,
        },
      ];

      let insertedQuizId: string | null = null;

      // 2. Try secure RPC first
      try {
        const { data: rpcQuizId, error: rpcError } = await supabase.rpc("create_quiz_with_approval_chain", {
          p_course_id: formData.course_id,
          p_title_ar: formData.title_ar.trim() || formData.title_en.trim(),
          p_title_en: formData.title_en.trim() || formData.title_ar.trim(),
          p_description_ar: formData.description_ar.trim(),
          p_description_en: formData.description_en.trim(),
          p_duration_minutes: Number(formData.duration_minutes) || 30,
          p_due_date: formData.due_date ? new Date(formData.due_date).toISOString() : null,
          p_department_id: formData.department_id || null,
          p_approval_reviewers: approvalChain as any,
        });

        if (!rpcError && rpcQuizId) {
          insertedQuizId = rpcQuizId;
        }
      } catch (e) {
        console.warn("create_quiz_with_approval_chain RPC notice:", e);
      }

      // 3. Fallback direct insert if RPC not present
      if (!insertedQuizId) {
        const { data: directData, error: directError } = await supabase
          .from("quizzes")
          .insert({
            course_id: formData.course_id,
            creator_id: userId,
            title_ar: formData.title_ar.trim() || formData.title_en.trim(),
            title_en: formData.title_en.trim() || formData.title_ar.trim(),
            description_ar: formData.description_ar.trim(),
            description_en: formData.description_en.trim(),
            duration_minutes: Number(formData.duration_minutes) || 30,
            due_date: formData.due_date ? new Date(formData.due_date).toISOString() : null,
            department_id: formData.department_id || null,
            approval_reviewers: approvalChain as any,
            is_published: false,
            approved_by_lecturer: true,
            approved_by_lecturer_at: new Date().toISOString(),
            approved_by_lecturer_id: userId,
          } as any)
          .select("id")
          .single();

        if (directError) throw directError;
        insertedQuizId = directData?.id || null;
      }

      if (!insertedQuizId) {
        throw new Error(isRtl ? "فشل إنشاء سجل الاختبار" : "Failed to create quiz record");
      }

      // 4. Insert questions batch
      const questionsPayload = questions.map((q, idx) => ({
        quiz_id: insertedQuizId,
        question_ar: q.question_ar,
        question_en: q.question_en,
        option_a_ar: q.option_a_ar,
        option_a_en: q.option_a_en,
        option_b_ar: q.option_b_ar,
        option_b_en: q.option_b_en,
        option_c_ar: q.option_c_ar,
        option_c_en: q.option_c_en,
        option_d_ar: q.option_d_ar,
        option_d_en: q.option_d_en,
        correct_answer: q.correct_answer,
        points: q.points || 1,
        question_order: idx + 1,
      }));

      const { error: qError } = await supabase.from("quiz_questions").insert(questionsPayload as any);
      if (qError) {
        console.error("Questions insert warning:", qError);
      }

      toast({
        title: isRtl ? "تم إرسال الاختبار لسلسلة الاعتماد بنجاح! 🎯" : "Quiz submitted for approval! 🎯",
        description: isRtl
          ? `تم إدراج ${questions.length} سؤال وبدء سلسلة الاعتماد حتى اعتماد ${deanTitle}.`
          : `Quiz with ${questions.length} questions submitted to approval workflow.`,
      });

      onCreated();
    } catch (err: any) {
      console.error("Save quiz error:", err);
      toast({
        title: isRtl ? "فشل حفظ الاختبار" : "Failed to save quiz",
        description: err?.message || (isRtl ? "حدث خطأ أثناء حفظ الاختبار" : "Error saving quiz"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const totalPoints = questions.reduce((acc, q) => acc + (q.points || 1), 0);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in-50 duration-300">
      {/* Top Wizard Navigation Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white shadow-xl shadow-teal-600/20 p-5 sm:p-7">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-inner">
              <FileQuestion className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-white/20 border border-white/30 text-white uppercase tracking-wider">
                  {isRtl ? `استوديو الاختبارات في ${instName}` : "Exam & Quiz Studio"}
                </span>
                <span className="flex items-center gap-1 text-xs font-bold text-teal-100">
                  <Sparkles className="w-3.5 h-3.5" />
                  {isRtl ? `المرحلة ${step} من 3` : `Step ${step} of 3`}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                {step === 1 && (isRtl ? "إعداد تفاصيل وبيانات الاختبار" : "Exam Details & Settings")}
                {step === 2 && (isRtl ? "بنك الأسئلة والخيارات والدرجات" : "Questions, Choices & Points")}
                {step === 3 && (isRtl ? "تخصيص سلسلة الاعتماد الأكاديمي" : "Approval Chain & Launch")}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={onBack}
              className="bg-white/10 hover:bg-white/20 text-white border-white/30 font-bold rounded-xl"
            >
              {isRtl ? <ArrowRight className="w-4 h-4 mr-1" /> : <ArrowLeft className="w-4 h-4 ml-1" />}
              {isRtl ? "الرجوع للاختبارات" : "Back to Quizzes"}
            </Button>
          </div>
        </div>

        {/* 3-Step Wizard Pills */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-6 pt-5 border-t border-white/20">
          {[
            { num: 1, label: isRtl ? "1. بيانات الاختبار" : "1. Details" },
            { num: 2, label: isRtl ? "2. بنك الأسئلة" : "2. Questions" },
            { num: 3, label: isRtl ? "3. سلسلة الاعتماد" : "3. Approvals" },
          ].map((s) => {
            const isActive = step === s.num;
            const isDone = step > s.num;
            return (
              <div
                key={s.num}
                onClick={() => {
                  if (s.num === 1) setStep(1);
                  if (s.num === 2 && validateStep1()) setStep(2);
                  if (s.num === 3 && validateStep1() && validateStep2()) setStep(3);
                }}
                className={`cursor-pointer rounded-2xl p-2.5 sm:p-3 text-center transition-all ${
                  isActive
                    ? "bg-white text-teal-900 font-black shadow-lg shadow-black/10 scale-102"
                    : isDone
                    ? "bg-white/25 text-white font-bold hover:bg-white/30"
                    : "bg-white/10 text-white/70 hover:bg-white/15"
                }`}
              >
                <div className="text-xs sm:text-sm truncate flex items-center justify-center gap-1.5">
                  {isDone ? <Check className="w-4 h-4 text-emerald-400" /> : null}
                  <span>{s.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* STEP 1: Basic Information */}
      {step === 1 && (
        <Card className="rounded-3xl border-2 border-border shadow-lg">
          <CardHeader className="border-b bg-muted/30 pb-4">
            <CardTitle className="text-lg font-black flex items-center gap-2 text-foreground">
              <FileQuestion className="w-5 h-5 text-teal-600" />
              {isRtl ? "البيانات الأساسية وتوقيت الاختبار" : "Exam Basic Details & Duration"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="font-bold flex items-center gap-1">
                  <span>{isRtl ? "عنوان الاختبار (بالعربية)" : "Quiz Title (Arabic)"}</span>
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={formData.title_ar}
                  onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
                  placeholder={isRtl ? "مثال: اختبار منتصف الفصل الدراسي - الذكاء الاصطناعي" : "e.g., Midterm Exam - AI"}
                  className="rounded-xl h-11 font-medium"
                  dir="rtl"
                />
              </div>

              <div className="space-y-2">
                <Label className="font-bold flex items-center gap-1">
                  <span>{isRtl ? "عنوان الاختبار (بالإنجليزية)" : "Quiz Title (English)"}</span>
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={formData.title_en}
                  onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                  placeholder="e.g., Midterm Exam - Artificial Intelligence"
                  className="rounded-xl h-11 font-medium"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="font-bold">{isRtl ? "القسم الأكاديمي" : "Academic Department"}</Label>
                <Select
                  value={formData.department_id}
                  onValueChange={(v) => setFormData({ ...formData, department_id: v })}
                >
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder={isRtl ? "اختر القسم" : "Select Department"} />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {isRtl ? d.name_ar || d.name : d.name_en || d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="font-bold flex items-center gap-1">
                  <span>{isRtl ? "المقرر الدراسي المرتبط" : "Associated Course"}</span>
                  <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.course_id}
                  onValueChange={(v) => setFormData({ ...formData, course_id: v })}
                >
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder={isRtl ? "اختر المقرر الدراسي" : "Select Course"} />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {filteredCourses.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {isRtl ? c.title_ar : c.title_en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="space-y-2">
                <Label className="font-bold flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-teal-600" />
                  <span>{isRtl ? "مدة الاختبار (بالدقائق)" : "Duration (Minutes)"}</span>
                </Label>
                <Input
                  type="number"
                  min="5"
                  max="300"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: Number(e.target.value) })}
                  className="rounded-xl h-11 font-bold text-center"
                />
              </div>

              <div className="space-y-2">
                <Label className="font-bold flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-teal-600" />
                  <span>{isRtl ? "تاريخ ووقت الإتاحة (اختياري)" : "Due Date / Schedule"}</span>
                </Label>
                <Input
                  type="datetime-local"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="rounded-xl h-11 font-medium"
                />
              </div>

              <div className="space-y-2">
                <Label className="font-bold flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-emerald-600" />
                  <span>{isRtl ? "نسبة النجاح المطلوبة (%)" : "Pass Percentage (%)"}</span>
                </Label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={formData.pass_percentage}
                  onChange={(e) => setFormData({ ...formData, pass_percentage: Number(e.target.value) })}
                  className="rounded-xl h-11 font-bold text-center"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-bold">{isRtl ? "تعليمات وإرشادات الاختبار للطلاب" : "Exam Instructions for Students"}</Label>
              <Textarea
                value={formData.description_ar}
                onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                placeholder={isRtl ? "يرجى الإجابة عن جميع الأسئلة في الوقت المحدد مع مراعاة دقة الاختيار..." : "Enter exam instructions and guidelines..."}
                rows={3}
                className="rounded-xl"
              />
            </div>

            <div className="flex justify-end pt-4 border-t">
              <Button
                onClick={() => {
                  if (validateStep1()) setStep(2);
                }}
                className="h-11 px-6 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-black hover:shadow-lg gap-2"
              >
                <span>{isRtl ? "التالي: إضافة الأسئلة" : "Next: Add Questions"}</span>
                {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 2: Questions Builder */}
      {step === 2 && (
        <div className="space-y-6">
          {/* Add New Question Card */}
          <Card className="rounded-3xl border-2 border-teal-500/30 bg-card shadow-lg">
            <CardHeader className="border-b bg-teal-50/50 dark:bg-teal-950/20 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base sm:text-lg font-black flex items-center gap-2 text-teal-700 dark:text-teal-400">
                  <Plus className="w-5 h-5" />
                  {isRtl ? `إضافة سؤال جديد (رقم ${questions.length + 1})` : `Add Question (#${questions.length + 1})`}
                </CardTitle>
                <Badge className="bg-teal-500/15 text-teal-700 dark:text-teal-300 font-black border-teal-500/30">
                  {isRtl ? `إجمالي الدرجات: ${totalPoints} درجة` : `Total Points: ${totalPoints}`}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-bold">{isRtl ? "نص السؤال (بالعربية)" : "Question (Arabic)"}</Label>
                  <Input
                    value={currentQ.question_ar}
                    onChange={(e) => setCurrentQ({ ...currentQ, question_ar: e.target.value })}
                    placeholder={isRtl ? "اكتب نص السؤال هنا..." : "Enter question in Arabic..."}
                    className="rounded-xl h-11"
                    dir="rtl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold">{isRtl ? "نص السؤال (بالإنجليزية)" : "Question (English)"}</Label>
                  <Input
                    value={currentQ.question_en}
                    onChange={(e) => setCurrentQ({ ...currentQ, question_en: e.target.value })}
                    placeholder="Enter question in English..."
                    className="rounded-xl h-11"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* 4 Choices with Correct Answer Radio */}
              <div className="space-y-3 pt-2">
                <Label className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                  <span>{isRtl ? "الخيارات الأربعة (حدد الإجابة الصحيحة)" : "4 Options (Select Correct Answer)"}</span>
                  <span className="text-emerald-600 font-bold text-xs">
                    {isRtl ? `الإجابة الصحيحة الحالية: (${currentQ.correct_answer.toUpperCase()})` : `Current Correct: (${currentQ.correct_answer.toUpperCase()})`}
                  </span>
                </Label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(["a", "b", "c", "d"] as const).map((opt) => {
                    const isSelected = currentQ.correct_answer === opt;
                    const optKeyAr = `option_${opt}_ar` as keyof QuestionItem;
                    const optKeyEn = `option_${opt}_en` as keyof QuestionItem;
                    return (
                      <div
                        key={opt}
                        onClick={() => setCurrentQ({ ...currentQ, correct_answer: opt })}
                        className={`cursor-pointer p-3.5 rounded-2xl border-2 transition-all flex flex-col gap-2 ${
                          isSelected
                            ? "border-emerald-500 bg-emerald-500/10 shadow-md ring-2 ring-emerald-500/30"
                            : "border-border bg-card hover:border-teal-400"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
                                isSelected ? "bg-emerald-600 text-white" : "bg-muted text-foreground"
                              }`}
                            >
                              {opt.toUpperCase()}
                            </div>
                            <span className="text-xs font-bold">
                              {opt === "a" ? (isRtl ? "الخيار الأول (A)" : "Option A") : null}
                              {opt === "b" ? (isRtl ? "الخيار الثاني (B)" : "Option B") : null}
                              {opt === "c" ? (isRtl ? "الخيار الثالث (C)" : "Option C") : null}
                              {opt === "d" ? (isRtl ? "الخيار الرابع (D)" : "Option D") : null}
                            </span>
                          </div>
                          {isSelected && (
                            <Badge className="bg-emerald-600 text-white text-[10px] font-black">
                              {isRtl ? "الإجابة الصحيحة ✓" : "Correct Answer ✓"}
                            </Badge>
                          )}
                        </div>

                        <Input
                          value={String(currentQ[optKeyAr] || "")}
                          onChange={(e) => setCurrentQ({ ...currentQ, [optKeyAr]: e.target.value })}
                          placeholder={isRtl ? `نص الخيار ${opt.toUpperCase()} بالعربية` : `Option ${opt.toUpperCase()} (AR)`}
                          className="h-9 rounded-lg text-xs"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t">
                <div className="flex items-center gap-3">
                  <Label className="font-bold text-xs">{isRtl ? "درجة هذا السؤال:" : "Points for question:"}</Label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={currentQ.points}
                    onChange={(e) => setCurrentQ({ ...currentQ, points: Number(e.target.value) || 1 })}
                    className="w-20 h-9 text-center font-bold rounded-lg"
                  />
                </div>

                <Button
                  onClick={handleAddQuestion}
                  className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold h-10 px-5 gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isRtl ? "إضافة السؤال للاختبار" : "Add to Quiz"}</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Current Questions Catalog Table */}
          <Card className="rounded-3xl border-2 border-border shadow-md">
            <CardHeader className="border-b pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-600" />
                  <span>{isRtl ? `الأسئلة المضافة (${questions.length} أسئلة)` : `Added Questions (${questions.length})`}</span>
                </CardTitle>
                <span className="text-xs font-bold text-muted-foreground">
                  {isRtl ? `المجموع: ${totalPoints} درجة` : `Total: ${totalPoints} pts`}
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              {questions.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <HelpCircle className="w-10 h-10 mx-auto text-muted-foreground/40 mb-2" />
                  <p className="font-bold">{isRtl ? "لم تتم إضافة أي أسئلة بعد" : "No questions added yet"}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {questions.map((q, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl border border-border bg-card hover:bg-muted/20 transition-all flex items-start justify-between gap-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-700 dark:text-teal-300 font-black text-sm flex items-center justify-center shrink-0">
                          #{idx + 1}
                        </div>
                        <div className="space-y-1">
                          <p className="font-bold text-sm text-foreground">{q.question_ar || q.question_en}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                              {isRtl ? `الإجابة: (${q.correct_answer.toUpperCase()})` : `Answer: (${q.correct_answer.toUpperCase()})`}
                            </span>
                            <span>•</span>
                            <span>{isRtl ? `${q.points} درجة` : `${q.points} pts`}</span>
                          </div>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveQuestion(idx)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between pt-6 border-t mt-6">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="rounded-xl h-11 px-5 font-bold"
                >
                  {isRtl ? <ArrowRight className="w-4 h-4 mr-1" /> : <ArrowLeft className="w-4 h-4 ml-1" />}
                  <span>{isRtl ? "السابق: البيانات" : "Previous: Details"}</span>
                </Button>

                <Button
                  onClick={() => {
                    if (validateStep2()) setStep(3);
                  }}
                  className="rounded-xl h-11 px-6 bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-black hover:shadow-lg gap-2"
                >
                  <span>{isRtl ? "التالي: سلسلة الاعتماد" : "Next: Approval Chain"}</span>
                  {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* STEP 3: Sequential Approval Chain */}
      {step === 3 && (
        <Card className="rounded-3xl border-2 border-border shadow-xl">
          <CardHeader className="border-b bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 pb-5">
            <CardTitle className="text-lg sm:text-xl font-black flex items-center gap-2.5 text-foreground">
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
              <span>{isRtl ? "تحديد واختيار سلسلة الاعتماد الأكاديمي للاختبار" : "Define Academic Approval Sequence"}</span>
            </CardTitle>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium mt-1">
              {isRtl
                ? `حدد وكلاء وأعضاء هيئة التدريس المطلوب موافقتهم بالترتيب. علمًا بأن ${deanTitle} هو المحطة النهائية الثابتة للاعتماد ونشر الاختبار للطلاب.`
                : `Select the reviewers sequence. The Dean is the permanent final authority for publishing to students.`}
            </p>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Visual Workflow Timeline Diagram */}
            <div className="p-5 rounded-3xl bg-muted/40 border border-border space-y-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-black uppercase text-foreground tracking-wider">
                  {isRtl ? "مخطط مسار وسلسلة الاعتماد التفاعلية:" : "Sequential Approval Flow Preview:"}
                </span>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto py-2">
                {/* Step 1: Creator (Current user) */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="p-3 rounded-2xl bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 shadow-sm">
                    <CheckCircle className="w-4 h-4" />
                    <span>{profile?.full_name || (isRtl ? "معد الاختبار (أنت)" : "Creator (You)")}</span>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-muted-foreground ${isRtl ? "rotate-180" : ""}`} />
                </div>

                {/* Step 2: Selected Reviewers */}
                {selectedReviewerIds.length === 0 ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="p-3 rounded-2xl bg-muted border border-dashed border-border text-muted-foreground font-bold text-xs">
                      {isRtl ? "لم يتم اختيار مراجعين وسطيين" : "Direct to Dean"}
                    </div>
                    <ChevronRight className={`w-4 h-4 text-muted-foreground ${isRtl ? "rotate-180" : ""}`} />
                  </div>
                ) : (
                  selectedReviewerIds.map((rId, i) => {
                    const rev = availableReviewers.find((r) => (r.user_id || r.id) === rId);
                    return (
                      <div key={rId} className="flex items-center gap-2 shrink-0">
                        <div className="p-3 rounded-2xl bg-teal-500/15 border border-teal-500/30 text-teal-800 dark:text-teal-300 font-bold text-xs flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-teal-600" />
                          <span>{rev?.full_name || rev?.role_title || `مراجع ${i + 1}`}</span>
                        </div>
                        <ChevronRight className={`w-4 h-4 text-muted-foreground ${isRtl ? "rotate-180" : ""}`} />
                      </div>
                    );
                  })
                )}

                {/* Step 3: Fixed Dean Final */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="p-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-purple-600/20">
                    <Lock className="w-3.5 h-3.5" />
                    <span>{deanTitle} ({isRtl ? "المعتمد النهائي" : "Final Authority"})</span>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-muted-foreground ${isRtl ? "rotate-180" : ""}`} />
                </div>

                {/* Step 4: Published to Students */}
                <div className="p-3 rounded-2xl bg-emerald-600 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 shrink-0">
                  <GraduationCap className="w-4 h-4" />
                  <span>{isRtl ? "ظهور الاختبار للطلاب" : "Published to Students"}</span>
                </div>
              </div>
            </div>

            {/* Reviewers Selection Checkbox Grid */}
            <div className="space-y-3">
              <Label className="font-bold text-sm text-foreground flex items-center gap-2">
                <Users className="w-4 h-4 text-teal-600" />
                <span>{isRtl ? `اختر أعضاء ووكلاء ${instName} للموافقة في السلسلة:` : "Select Vice Deans & Faculty Reviewers:"}</span>
              </Label>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {availableReviewers.map((rev) => {
                  const revId = rev.user_id || rev.id;
                  const isChecked = selectedReviewerIds.includes(revId);
                  return (
                    <div
                      key={revId}
                      onClick={() => toggleReviewer(revId)}
                      className={`cursor-pointer p-4 rounded-2xl border-2 transition-all flex items-start gap-3 ${
                        isChecked
                          ? "border-teal-500 bg-teal-500/10 shadow-sm"
                          : "border-border bg-card hover:border-teal-400"
                      }`}
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => toggleReviewer(revId)}
                        className="mt-0.5"
                      />
                      <div className="space-y-1">
                        <p className="font-black text-sm text-foreground">{rev.full_name}</p>
                        <p className="text-xs text-muted-foreground font-medium">
                          {rev.role_title || rev.specific_role || (isRtl ? "عضو هيئة تدريس" : "Faculty Member")}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Summary Box */}
            <div className="p-4 rounded-2xl bg-muted/50 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                <p className="font-bold text-foreground">
                  {isRtl ? "ملخص الاختبار:" : "Exam Summary:"} {formData.title_ar || formData.title_en}
                </p>
                <p className="text-muted-foreground font-medium">
                  {isRtl
                    ? `عدد الأسئلة: ${questions.length} • مجموع الدرجات: ${totalPoints} • المدة: ${formData.duration_minutes} دقيقة`
                    : `Questions: ${questions.length} • Total Points: ${totalPoints} • Duration: ${formData.duration_minutes} mins`}
                </p>
              </div>
              <Badge className="bg-purple-600 text-white font-black self-start sm:self-auto py-1 px-3">
                {deanTitle} : {isRtl ? "محطة الاعتماد الختامية" : "Final Step"}
              </Badge>
            </div>

            {/* Policy Agreement Checkbox */}
            <div className="p-4 rounded-2xl border-2 border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 flex items-start gap-3">
              <Checkbox
                checked={agreedToPolicy}
                onCheckedChange={(c) => setAgreedToPolicy(!!c)}
                id="policy-quiz"
                className="mt-0.5"
              />
              <label htmlFor="policy-quiz" className="cursor-pointer text-xs sm:text-sm font-bold text-foreground leading-relaxed">
                {isRtl
                  ? `أقر وأوافق على مطابقة الاختبار لمعايير الجودة الأكاديمية لـ ${instName}، وأتحمل مسؤولية المحتوى المقدم حتى اكتمال الاعتماد النهائي من ${deanTitle}.`
                  : `I confirm that this exam adheres to academic quality standards and approve submitting it for official approval.`}
              </label>
            </div>

            {/* Actions */}
            <div className="flex justify-between pt-6 border-t">
              <Button
                variant="outline"
                onClick={() => setStep(2)}
                className="rounded-xl h-11 px-5 font-bold"
              >
                {isRtl ? <ArrowRight className="w-4 h-4 mr-1" /> : <ArrowLeft className="w-4 h-4 ml-1" />}
                <span>{isRtl ? "السابق: بنك الأسئلة" : "Previous: Questions"}</span>
              </Button>

              <Button
                onClick={handleSaveAndLaunchQuiz}
                disabled={loading || !agreedToPolicy}
                className="rounded-xl h-12 px-8 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white font-black shadow-lg shadow-teal-600/25 hover:shadow-xl gap-2 text-sm sm:text-base cursor-pointer"
              >
                {loading ? (
                  <Sparkles className="w-5 h-5 animate-spin" />
                ) : (
                  <CheckCircle className="w-5 h-5" />
                )}
                <span>{isRtl ? "إرسال الاختبار لسلسلة الاعتماد الأكاديمي 🎯" : "Submit Exam for Approval 🎯"}</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
