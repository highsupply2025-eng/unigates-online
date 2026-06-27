import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FileSpreadsheet, ArrowLeft, ArrowRight, Download, Upload, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import * as XLSX from "xlsx";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const ROLE_MAP: Record<string, string> = {
  "عميد الكلية": "dean", "dean": "dean",
  "وكيل الكلية للدراسات العليا": "vice_dean_postgrad", "vice_dean_postgrad": "vice_dean_postgrad",
  "وكيل الكلية لشئون الطلاب": "vice_dean_students", "vice_dean_students": "vice_dean_students",
  "وكيل الكلية لشئون البيئة وخدمة المجتمع": "vice_dean_community", "vice_dean_community": "vice_dean_community",
  "رئيس القسم": "department_head", "department_head": "department_head",
  "أستاذ دكتور": "professor", "professor": "professor",
  "دكتور": "doctor", "doctor": "doctor",
  "معيد": "assistant_lecturer", "assistant_lecturer": "assistant_lecturer",
};

const InstitutionFacultyImport = () => {
  const { language, dir } = useLanguage();
  const isRtl = language === "ar";
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isStudent = searchParams.get("role") === "student";
  const fileRef = useRef<HTMLInputElement>(null);

  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.email) { navigate("/login"); return; }
        let instId = "", instType: "college" | "institute" | null = null;
        const { data: college } = await supabase.from("college_registrations").select("id").eq("email", user.email).eq("status", "approved").maybeSingle();
        if (college) { instId = college.id; instType = "college"; }
        else {
          const { data: inst } = await supabase.from("institute_registrations").select("id").eq("email", user.email).eq("status", "approved").maybeSingle();
          if (inst) { instId = inst.id; instType = "institute"; }
        }
        if (!instId || !instType) { navigate("/"); return; }
        const { data: depts } = await supabase.from("departments").select("id, department_name").eq("institution_id", instId).eq("institution_type", instType);
        setDepartments((depts || []).map((d: any) => ({ id: d.id, name: d.department_name })));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const norm = (v: any) => (v == null ? "" : String(v).trim());

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setResult(null);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      // Drop the "key" row (row 2 in template that contains english keys like full_name)
      const data = rows.filter(r => {
        const fn = norm(r["الاسم الكامل"] || r["full_name"]);
        return fn && fn !== "full_name";
      });

      if (data.length === 0) throw new Error(isRtl ? "الملف فارغ" : "Empty file");

      const deptByName = new Map(departments.map(d => [d.name.trim(), d.id]));
      const defaultDeptId = departments[0]?.id;
      let success = 0, failed = 0;
      const errors: string[] = [];

      for (let i = 0; i < data.length; i++) {
        const r = data[i];
        const full_name = norm(r["الاسم الكامل"] || r["full_name"]);
        const roleRaw = norm(r["الوظيفة"] || r["role"]);
        const deptName = norm(r["القسم"] || r["department"]);
        const role = isStudent ? "student" : (ROLE_MAP[roleRaw] || ROLE_MAP[roleRaw.toLowerCase()]);
        const department_id = (deptName && deptByName.get(deptName)) || defaultDeptId;

        if (!full_name || !role || !department_id) {
          failed++;
          errors.push(`${isRtl ? "صف" : "Row"} ${i + 3}: ${!full_name ? (isRtl ? "اسم مفقود" : "missing name") : !role ? (isRtl ? "وظيفة غير صحيحة" : "invalid role") : (isRtl ? "لا يوجد قسم" : "no department")}`);
          continue;
        }

        const invitationCode = `FAC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
        const { error } = await supabase.from("department_members").insert({
          department_id,
          full_name,
          role,
          date_of_birth: norm(r["تاريخ الميلاد (YYYY-MM-DD)"] || r["تاريخ الميلاد"] || r["date_of_birth"]) || null,
          email: norm(r["البريد الإلكتروني"] || r["email"]) || null,
          phone: norm(r["رقم الهاتف"] || r["phone"]) || null,
          national_id: norm(r["الرقم القومي"] || r["national_id"]) || null,
          gender: norm(r["النوع"] || r["gender"]) || null,
          address: norm(r["العنوان"] || r["address"]) || null,
          qualification: norm(r["المؤهل العلمي"] || r["qualification"]) || null,
          specialization: norm(r["التخصص"] || r["specialization"]) || null,
          hire_date: norm(r["تاريخ التعيين (YYYY-MM-DD)"] || r["تاريخ التعيين"] || r["hire_date"]) || null,
          notes: norm(r["ملاحظات"] || r["notes"]) || null,
          invitation_code: invitationCode,
        });
        if (error) { failed++; errors.push(`${isRtl ? "صف" : "Row"} ${i + 3}: ${error.message}`); }
        else success++;
      }

      setResult({ success, failed, errors: errors.slice(0, 10) });
      toast({
        title: isRtl ? `تمت إضافة ${success} عضو` : `Added ${success} members`,
        description: failed > 0 ? (isRtl ? `${failed} صف فشل` : `${failed} rows failed`) : undefined,
        variant: failed > 0 && success === 0 ? "destructive" : "default",
      });
    } catch (err: any) {
      toast({ title: isRtl ? "فشل المعالجة" : "Processing failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div dir={dir} className="min-h-screen bg-gradient-to-br from-background via-background to-emerald-500/5">
      <header className="border-b bg-gradient-to-l from-emerald-500/10 via-card to-card shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <h1 className="text-xl sm:text-2xl font-extrabold text-foreground flex items-center gap-2 min-w-0">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md shrink-0">
              <FileSpreadsheet className="w-5 h-5" strokeWidth={2.4} />
            </span>
            <span className="truncate">{isStudent ? (isRtl ? "رفع بيانات الطلاب" : "Upload Students File") : (isRtl ? "رفع ملف Excel" : "Upload Excel File")}</span>
          </h1>
          <Button size="icon" variant="default" className="shadow-md shrink-0" onClick={() => navigate(-1)} aria-label={isRtl ? "رجوع" : "Back"}>
            {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="border-2 border-emerald-500/20 max-w-3xl mx-auto">
          <CardContent className="p-6 sm:p-10 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
              <FileSpreadsheet className="w-10 h-10 text-white" strokeWidth={2.4} />
            </div>
            <h2 className="text-2xl font-extrabold mb-2">{isRtl ? "رفع ملف Excel" : "Upload Excel File"}</h2>
            <p className="text-muted-foreground mb-6">
              {isRtl ? "حمّل القالب، عبّئ البيانات، ثم ارفع الملف لإضافة الأعضاء دفعة واحدة." : "Download the template, fill in data, then upload to bulk-add members."}
            </p>

            <div className="grid sm:grid-cols-2 gap-3 max-w-xl mx-auto">
              <a href="/templates/faculty_members_template.xlsx" download>
                <Button size="lg" className="w-full gap-2 bg-gradient-to-l from-emerald-500 to-emerald-600 text-white shadow-md">
                  <Download className="w-5 h-5" />
                  {isRtl ? "تحميل قالب Excel" : "Download Template"}
                </Button>
              </a>
              <Button
                size="lg"
                variant="outline"
                className="w-full gap-2 border-2 border-emerald-500/40 hover:bg-emerald-500/5"
                onClick={() => fileRef.current?.click()}
                disabled={uploading || loading}
              >
                {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                {uploading ? (isRtl ? "جارٍ المعالجة..." : "Processing...") : (isRtl ? "رفع الملف" : "Upload File")}
              </Button>
              <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFile} />
            </div>

            {result && (
              <div className="mt-6 text-start space-y-3">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span className="font-bold">{isRtl ? `تم إضافة ${result.success} عضو بنجاح` : `${result.success} members added`}</span>
                </div>
                {result.failed > 0 && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 space-y-1">
                    <div className="flex items-center gap-2 font-bold text-destructive">
                      <AlertCircle className="w-5 h-5" />
                      {isRtl ? `${result.failed} صف فشل` : `${result.failed} rows failed`}
                    </div>
                    <ul className="text-sm text-muted-foreground list-disc ps-5">
                      {result.errors.map((er, i) => <li key={i}>{er}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="mt-8 text-start bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 text-sm">
              <h3 className="font-bold mb-2 text-emerald-700 dark:text-emerald-400">
                {isRtl ? "ملاحظات هامة:" : "Important notes:"}
              </h3>
              <ul className="text-muted-foreground list-disc ps-5 space-y-1">
                <li>{isRtl ? "اسم القسم في الملف يجب أن يطابق اسم قسم موجود لديك." : "Department name must match an existing department."}</li>
                <li>{isRtl ? "الوظيفة يجب أن تكون من القائمة المنسدلة في القالب." : "Role must be from the template dropdown."}</li>
                <li>{isRtl ? "الحقول المطلوبة: الاسم، الوظيفة، القسم." : "Required: name, role, department."}</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default InstitutionFacultyImport;
