import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, GraduationCap, Save, Loader2, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";


const degreeOptions = [
  { value: "bachelor", ar: "بكالوريوس", en: "Bachelor" },
  { value: "master", ar: "ماجستير", en: "Master" },
  { value: "doctorate", ar: "دكتوراه", en: "Doctorate" },
  { value: "diploma", ar: "دبلوم", en: "Diploma" },
  { value: "high_diploma", ar: "دبلوم عالي", en: "High Diploma" },
];

const ratingOptions = [
  { value: "excellent", ar: "ممتاز", en: "Excellent" },
  { value: "very_good", ar: "جيد جداً", en: "Very Good" },
  { value: "good", ar: "جيد", en: "Good" },
  { value: "acceptable", ar: "مقبول", en: "Acceptable" },
  { value: "fail", ar: "راسب", en: "Fail" },
];

const AddStudentResult = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { language } = useLanguage();
  const isRtl = language === "ar";
  const dir = isRtl ? "rtl" : "ltr";

  const editId = searchParams.get("id");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [institutionId, setInstitutionId] = useState("");
  const [institutionType, setInstitutionType] = useState<"college" | "institute">("college");
  const [departments, setDepartments] = useState<string[]>([]);

  const [form, setForm] = useState({
    student_name: "",
    department_name: "",
    academic_degree: "",
    grade: "",
    rating: "",
    notes: "",
  });

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }

      const email = user.email?.toLowerCase();

      // Check college
      const { data: college } = await supabase
        .from("college_registrations")
        .select("id")
        .eq("status", "approved")
        .ilike("email", email || "")
        .maybeSingle();

      if (college) {
        setInstitutionId(college.id);
        setInstitutionType("college");
        const { data: depts } = await supabase
          .from("departments")
          .select("department_name")
          .eq("institution_id", college.id);
        setDepartments((depts || []).map(d => d.department_name));
      } else {
        const { data: institute } = await supabase
          .from("institute_registrations")
          .select("id")
          .eq("status", "approved")
          .ilike("email", email || "")
          .maybeSingle();

        if (institute) {
          setInstitutionId(institute.id);
          setInstitutionType("institute");
          const { data: depts } = await supabase
            .from("departments")
            .select("department_name")
            .eq("institution_id", institute.id);
          setDepartments((depts || []).map(d => d.department_name));
        }
      }

      // If editing, load existing result
      if (editId) {
        const { data: result } = await supabase
          .from("student_results")
          .select("*")
          .eq("id", editId)
          .maybeSingle();
        if (result) {
          setForm({
            student_name: result.student_name,
            department_name: result.department_name,
            academic_degree: result.academic_degree,
            grade: result.grade?.toString() || "",
            rating: result.rating,
            notes: result.notes || "",
          });
        }
      }

      setLoading(false);
    };
    init();
  }, [editId, navigate]);

  const handleSave = async () => {
    if (!form.student_name.trim() || !form.department_name.trim()) {
      toast({ title: isRtl ? "خطأ" : "Error", description: isRtl ? "يرجى ملء اسم الطالب والقسم" : "Please fill student name and department", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const payload = {
        institution_id: institutionId,
        institution_type: institutionType,
        student_name: form.student_name.trim(),
        department_name: form.department_name.trim(),
        academic_degree: form.academic_degree,
        grade: form.grade ? parseFloat(form.grade) : null,
        rating: form.rating,
        notes: form.notes.trim() || null,
        created_by: user.id,
      };

      if (editId) {
        const { error } = await supabase.from("student_results").update(payload).eq("id", editId);
        if (error) throw error;
        toast({ title: isRtl ? "تم التحديث" : "Updated", description: isRtl ? "تم تحديث النتيجة بنجاح" : "Result updated successfully" });
      } else {
        const { error } = await supabase.from("student_results").insert(payload);
        if (error) throw error;
        toast({ title: isRtl ? "تمت الإضافة" : "Added", description: isRtl ? "تمت إضافة النتيجة بنجاح" : "Result added successfully" });
      }

      navigate("/institution/dashboard?tab=quizresults");
    } catch (error: any) {
      toast({ title: isRtl ? "خطأ" : "Error", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir={dir}>
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
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 mb-6 text-muted-foreground hover:text-foreground"
          onClick={() => navigate("/institution/dashboard?tab=quizresults")}
        >
          {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          {isRtl ? "العودة للنتائج" : "Back to Results"}
        </Button>

        <Card className="border-2 border-primary/20">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-md">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              {editId
                ? (isRtl ? "تعديل نتيجة طالب" : "Edit Student Result")
                : (isRtl ? "إضافة نتيجة طالب" : "Add Student Result")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Student Name */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">{isRtl ? "اسم الطالب" : "Student Name"} *</Label>
              <Input
                value={form.student_name}
                onChange={e => setForm(prev => ({ ...prev, student_name: e.target.value }))}
                placeholder={isRtl ? "أدخل اسم الطالب الكامل" : "Enter full student name"}
              />
            </div>

            {/* Department */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">{isRtl ? "القسم" : "Department"} *</Label>
              {departments.length > 0 ? (
                <Select value={form.department_name} onValueChange={v => setForm(prev => ({ ...prev, department_name: v }))}>
                  <SelectTrigger><SelectValue placeholder={isRtl ? "اختر القسم" : "Select department"} /></SelectTrigger>
                  <SelectContent>
                    {departments.map(d => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={form.department_name}
                  onChange={e => setForm(prev => ({ ...prev, department_name: e.target.value }))}
                  placeholder={isRtl ? "أدخل اسم القسم" : "Enter department name"}
                />
              )}
            </div>

            {/* Degree & Grade row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">{isRtl ? "الدرجة العلمية" : "Academic Degree"}</Label>
                <Select value={form.academic_degree} onValueChange={v => setForm(prev => ({ ...prev, academic_degree: v }))}>
                  <SelectTrigger><SelectValue placeholder={isRtl ? "اختر الدرجة" : "Select degree"} /></SelectTrigger>
                  <SelectContent>
                    {degreeOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{isRtl ? opt.ar : opt.en}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">{isRtl ? "الدرجة (من 100)" : "Grade (out of 100)"}</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={form.grade}
                  onChange={e => setForm(prev => ({ ...prev, grade: e.target.value }))}
                  placeholder="0 - 100"
                />
              </div>
            </div>

            {/* Rating */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">{isRtl ? "التقدير" : "Rating"}</Label>
              <Select value={form.rating} onValueChange={v => setForm(prev => ({ ...prev, rating: v }))}>
                <SelectTrigger><SelectValue placeholder={isRtl ? "اختر التقدير" : "Select rating"} /></SelectTrigger>
                <SelectContent>
                  {ratingOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{isRtl ? opt.ar : opt.en}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">{isRtl ? "ملاحظات (اختياري)" : "Notes (optional)"}</Label>
              <Textarea
                value={form.notes}
                onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder={isRtl ? "أدخل ملاحظات إضافية..." : "Enter additional notes..."}
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-4">
              <Button className="gap-2 flex-1" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {editId
                  ? (isRtl ? "تحديث النتيجة" : "Update Result")
                  : (isRtl ? "حفظ النتيجة" : "Save Result")}
              </Button>
              <Button variant="outline" onClick={() => navigate("/institution/dashboard?tab=quizresults")}>
                {isRtl ? "إلغاء" : "Cancel"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddStudentResult;
