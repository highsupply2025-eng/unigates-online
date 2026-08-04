import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FileSpreadsheet, ArrowLeft, ArrowRight, Download, Upload, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import * as XLSX from "xlsx";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  extractEmbeddedFacultyPhotos,
  MAX_FACULTY_WORKBOOK_BYTES,
  resizeFacultyPhoto,
  type EmbeddedFacultyPhoto,
  type FacultyPhotoPayload,
} from "@/lib/faculty-import-photo";

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
  const [institutionId, setInstitutionId] = useState("");
const [institutionType, setInstitutionType] =
  useState<"college" | "institute" | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ success: number; skipped: number; failed: number; errors: string[] } | null>(null);

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
        setInstitutionId(instId);
setInstitutionType(instType);
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
      if (!isStudent && file.size > MAX_FACULTY_WORKBOOK_BYTES) {
        throw new Error(isRtl ? "حجم ملف Excel أكبر من 20MB" : "Excel file exceeds 20MB");
      }
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      const embeddedPhotos = !isStudent && file.name.toLowerCase().endsWith(".xlsx")
        ? await extractEmbeddedFacultyPhotos(buf)
        : new Map<number, EmbeddedFacultyPhoto>();

      // Drop the "key" row (row 2 in template that contains english keys like full_name)
      const data = rows.filter(r => {
        const fn = norm(r["الاسم الكامل"] || r["full_name"]);
        return fn && fn !== "full_name";
      });

      if (data.length === 0) throw new Error(isRtl ? "الملف فارغ" : "Empty file");

      const deptByName = new Map(departments.map(d => [d.name.trim(), d.id]));

      // For student import, also fetch all department codes for lookup
      const deptByCode = new Map<string, string>();
      if (isStudent) {
        const { data: allDepts } = await supabase
          .from("departments")
          .select("id, department_code");
        (allDepts || []).forEach((d: any) => {
          if (d.department_code) deptByCode.set(String(d.department_code).toUpperCase(), d.id);
        });
      }

      
      let success = 0, failed = 0, skipped = 0;
      const errors: string[] = [];

      for (let i = 0; i < data.length; i++) {
        const r = data[i];
        const sourceRow = typeof r.__rowNum__ === "number" ? r.__rowNum__ + 1 : i + 3;
        const full_name = norm(r["الاسم الكامل"] || r["full_name"]);
        const roleRaw = norm(r["الوظيفة"] || r["role"]);
        const role = isStudent ? "student" : (ROLE_MAP[roleRaw] || ROLE_MAP[roleRaw.toLowerCase()]);

        // For students: resolve target departments by code(s) — may be multiple, comma-separated
        let targetDeptIds: string[] = [];
        if (isStudent) {
          const codesRaw = norm(r["كود القسم"] || r["أكواد الأقسام"] || r["department_code"] || r["dept_code"]);
          const codes = codesRaw.split(/[\s,،]+/).map(c => c.trim().toUpperCase()).filter(Boolean);
          targetDeptIds = codes.map(c => deptByCode.get(c)).filter(Boolean) as string[];
          if (targetDeptIds.length === 0) {
            failed++;
            errors.push(`${isRtl ? "صف" : "Row"} ${i + 3}: ${isRtl ? "كود القسم مفقود أو غير صالح" : "missing or invalid department code"}`);
            continue;
          }
        } else {
  const deptName = norm(r["القسم"] || r["department"]);
  const dId = deptName ? deptByName.get(deptName) : undefined;

  if (dId) {
    targetDeptIds = [dId];
  }
}

       if (
  !full_name ||
  !role ||
  (isStudent && targetDeptIds.length === 0)
) {
  failed++;

  errors.push(
    `${isRtl ? "صف" : "Row"} ${i + 3}: ${
      !full_name
        ? isRtl
          ? "اسم مفقود"
          : "missing name"
        : !role
          ? isRtl
            ? "وظيفة غير صحيحة"
            : "invalid role"
          : isRtl
            ? "لا يوجد قسم"
            : "no department"
    }`,
  );

  continue;
}

        let photoPayload: FacultyPhotoPayload | undefined;
        const embeddedPhoto = embeddedPhotos.get(sourceRow);
        if (embeddedPhoto) {
          try {
            photoPayload = await resizeFacultyPhoto(embeddedPhoto);
          } catch (photoError) {
            failed++;
            errors.push(
              `${isRtl ? "صف" : "Row"} ${sourceRow}: ${
                photoError instanceof Error
                  ? photoError.message
                  : isRtl
                    ? "تعذر معالجة الصورة الشخصية"
                    : "Unable to process faculty photo"
              }`,
            );
            continue;
          }
        }

        const baseRow = {
          full_name,
          role,
          date_of_birth: norm(r["تاريخ الميلاد (YYYY-MM-DD)"] || r["تاريخ الميلاد"] || r["date_of_birth"]) || null,
          email: norm(r["البريد الإلكتروني"] || r["email"]) || null,
          phone: norm(r["رقم الهاتف"] || r["phone"]) || null,
          national_id: norm(r["الرقم القومي"] || r["national_id"]) || null,
          gender: norm(r["النوع"] || r["gender"]) || null,
          address: norm(r["العنوان"] || r["address"]) || null,
          qualification: norm(r["المؤهل الدراسي"] || r["المؤهل العلمي"] || r["qualification"]) || null,
          specialization: isStudent ? null : (norm(r["التخصص"] || r["specialization"]) || null),
          notes: norm(r["ملاحظات"] || r["notes"]) || null,
          photo_url: norm(r["رابط الصورة (اختياري)"] || r["رابط الصورة"] || r["photo_url"]) || null,
        };

        let insertError: any = null;

if (isStudent) {
  const rows = targetDeptIds.map((department_id) => ({
    ...baseRow,
    department_id,
    invitation_code:
      `STU-${Date.now().toString(36).toUpperCase()}-${crypto
        .getRandomValues(new Uint32Array(1))[0]
        .toString(36)
        .slice(2, 6)
        .toUpperCase()}`,
  }));

  const { error } = await supabase
    .from("department_members")
    .insert(rows);

  insertError = error;
} else {
  if (!institutionId || !institutionType) {
    insertError = new Error(
      isRtl
        ? "تعذر تحديد الكلية أو المعهد"
        : "Unable to determine institution",
    );
  } else {
    // Faculty rows require an auth user (institution_faculty_members.user_id
    // is NOT NULL). Route through the edge function so each row gets an
    // auth account, profile, role, and institution membership atomically.
    const { generateStrongPassword } = await import("@/utils/crypto");
    const tempPassword = `Tmp${generateStrongPassword()}!`;
    const { data: fnData, error: fnError } = await supabase.functions.invoke(
      "create-faculty-account",
      {
        body: {
          full_name: baseRow.full_name,
          role: baseRow.role,
          email: baseRow.email || undefined,
          phone: baseRow.phone || undefined,
          temporary_password: tempPassword,
          photo: photoPayload,
          extra: {
            date_of_birth: baseRow.date_of_birth,
            photo_url: baseRow.photo_url,
            national_id: baseRow.national_id,
            gender: baseRow.gender,
            address: baseRow.address,
            qualification: baseRow.qualification,
            specialization: baseRow.specialization,
            notes: baseRow.notes,
          },
        },
      },
    );
    // Parse the real error body from a non-2xx response
    let errBody: any = null;
    if (fnError) {
      try {
        const ctx: any = (fnError as any).context;
        if (ctx && typeof ctx.json === "function") errBody = await ctx.json();
      } catch { /* ignore */ }
    } else if (fnData && (fnData as any).success === false) {
      errBody = fnData;
    }

    const errStep = errBody?.step as string | undefined;
    const errMsg = errBody?.error || fnError?.message;

    // Idempotency: an existing account/faculty row is not a failure — skip it.
    if (errStep === "faculty_email_exists" || errStep === "auth_email_exists") {
      skipped++;
      errors.push(
        `${isRtl ? "صف" : "Row"} ${i + 3}: ${
          isRtl
            ? `البريد «${baseRow.email}» مسجّل مسبقاً — تم التخطي`
            : `Email "${baseRow.email}" already registered — skipped`
        }`,
      );
      continue;
    }

    if (errBody || fnError) {
      insertError = new Error(errMsg || "create-faculty-account failed");
    } else if (targetDeptIds.length > 0 && fnData && (fnData as any).user_id) {
      // Optional department assignment
      const { error: assignErr } = await supabase.rpc("assign_faculty_department", {
        p_user_id: (fnData as any).user_id,
        p_new_department_id: targetDeptIds[0],
        p_specific_role: baseRow.role,
        p_full_name: baseRow.full_name,
        p_email: (fnData as any).email || baseRow.email || null,
        p_phone: baseRow.phone,
      });
      if (assignErr) insertError = assignErr;
    }
  }
}

if (insertError) {
  failed++;

  errors.push(
    `${isRtl ? "صف" : "Row"} ${i + 3}: ${insertError.message}`,
  );
} else {
  success++;
}
      }

      if (success > 0) {
        try {
          sessionStorage.setItem("institution-dashboard-force-refresh", Date.now().toString());
        } catch { /* ignore */ }
      }
      setResult({ success, skipped, failed, errors: errors.slice(0, 20) });
      const descParts: string[] = [];
      if (skipped > 0) descParts.push(isRtl ? `${skipped} تم التخطي (موجود مسبقاً)` : `${skipped} skipped (already exists)`);
      if (failed > 0) descParts.push(isRtl ? `${failed} فشل` : `${failed} failed`);
      toast({
        title: isRtl ? `تمت إضافة ${success} عضو` : `Added ${success} members`,
        description: descParts.join(" • ") || undefined,
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
                {result.skipped > 0 && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                    <span className="font-bold">
                      {isRtl ? `${result.skipped} تم التخطي (موجود مسبقاً)` : `${result.skipped} skipped (already exists)`}
                    </span>
                  </div>
                )}
                {(result.failed > 0 || result.errors.length > 0) && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 space-y-1">
                    {result.failed > 0 && (
                      <div className="flex items-center gap-2 font-bold text-destructive">
                        <AlertCircle className="w-5 h-5" />
                        {isRtl ? `${result.failed} صف فشل` : `${result.failed} rows failed`}
                      </div>
                    )}
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
                {!isStudent && <li>{isRtl ? "الوظيفة يجب أن تكون من القائمة المنسدلة في القالب." : "Role must be from the template dropdown."}</li>}
                {!isStudent && <li>{isRtl ? "الصورة الشخصية اختيارية. أدرج صورة JPG أو PNG واحدة داخل خلية «صورة شخصية 4×6» في صف العضو." : "Photo is optional. Insert one JPG or PNG into the 'صورة شخصية 4×6' cell for that member."}</li>}
                {!isStudent && <li>{isRtl ? "استخدم صيغة XLSX عند إدراج الصور؛ ملفات XLS القديمة ستستورد البيانات النصية فقط." : "Use XLSX for embedded photos; legacy XLS files import text data only."}</li>}
                {isStudent ? (
                  <>
                    <li>{isRtl ? "أضف عمود «كود القسم» في الملف بكود القسم الموجود في لوحة الإدارة." : "Add a 'department_code' column with the code shown in the dashboard."}</li>
                    <li>{isRtl ? "لإضافة الطالب لأكثر من قسم، افصل الأكواد بفاصلة في نفس الخلية. مثال: ABC123, XYZ789" : "To enroll a student in multiple departments, separate codes with commas in the same cell. e.g. ABC123, XYZ789"}</li>
                    <li>{isRtl ? "الحقول المطلوبة: الاسم وكود القسم." : "Required: name and department code."}</li>
                  </>
                ) : (
                  <li>{isRtl ? "الحقول المطلوبة: الاسم والوظيفة فقط." : "Required: name and role only."}</li>
                )}
              </ul>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default InstitutionFacultyImport;
