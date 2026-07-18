import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  UserPlus,
  ArrowLeft,
  ArrowRight,
  Upload,
  Loader2,
  Save,
  GraduationCap,
  Mail,
  Phone,
  IdCard,
  Calendar,
  MapPin,
  Briefcase,
  BookOpen,
  Users2,
  StickyNote,
  UserRound,
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  RefreshCw,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

function generateStrongPassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnpqrstuvwxyz";
  const digits = "23456789";
  const symbols = "!@#$%&*";
  const all = upper + lower + digits + symbols;
  const pick = (s: string) => s[Math.floor(Math.random() * s.length)];
  const arr = [pick(upper), pick(lower), pick(digits), pick(symbols)];
  for (let i = 0; i < 8; i++) arr.push(pick(all));
  return arr.sort(() => Math.random() - 0.5).join("");
}
function isStrongPassword(p: string): boolean {
  return p.length >= 8 && /[A-Z]/.test(p) && /[a-z]/.test(p) && /\d/.test(p) && !/\s/.test(p);
}


const ROLE_OPTIONS: { value: string; ar: string; en: string }[] = [
  { value: "dean", ar: "عميد الكلية", en: "Dean" },
  { value: "vice_dean_postgrad", ar: "وكيل الكلية للدراسات العليا", en: "Vice Dean - Postgraduate Studies" },
  { value: "vice_dean_students", ar: "وكيل الكلية لشئون الطلاب", en: "Vice Dean - Student Affairs" },
  { value: "vice_dean_community", ar: "وكيل الكلية لشئون البيئة وخدمة المجتمع", en: "Vice Dean - Environment & Community Service" },
  { value: "department_head", ar: "رئيس القسم", en: "Department Head" },
  { value: "professor", ar: "أستاذ دكتور", en: "Professor" },
  { value: "doctor", ar: "دكتور", en: "Doctor" },
  { value: "assistant_lecturer", ar: "معيد", en: "Assistant Lecturer" },
];

const InstitutionFacultyAdd = () => {
  const { language, dir } = useLanguage();
  const isRtl = language === "ar";
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const forcedRole = searchParams.get("role");
  const isStudent = forcedRole === "student";
  const fileRef = useRef<HTMLInputElement>(null);

  const [loadingDepts, setLoadingDepts] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [currentDepartmentName, setCurrentDepartmentName] = useState<string>("");
  const [contextError, setContextError] = useState<string>("");

  const [photoUrl, setPhotoUrl] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState(isStudent ? "student" : "");
  const [departmentId, setDepartmentId] = useState("");
  const [institutionId, setInstitutionId] = useState<string>("");
  const [institutionType, setInstitutionType] = useState<"college" | "institute" | "">("");
  const [deptCodesInput, setDeptCodesInput] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [address, setAddress] = useState("");
  const [qualification, setQualification] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [hireDate, setHireDate] = useState("");
  const [notes, setNotes] = useState("");
  const [tempPassword, setTempPassword] = useState<string>(() => generateStrongPassword());
  const [showPassword, setShowPassword] = useState(false);


  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.email) { navigate("/login"); return; }

        let instId = "";
        let instType: "college" | "institute" | null = null;

        const { data: college } = await supabase
          .from("college_registrations")
          .select("id")
          .eq("email", user.email)
          .eq("status", "approved")
          .maybeSingle();
        if (college) { instId = college.id; instType = "college"; }
        else {
          const { data: inst } = await supabase
            .from("institute_registrations")
            .select("id")
            .eq("email", user.email)
            .eq("status", "approved")
            .maybeSingle();
          if (inst) { instId = inst.id; instType = "institute"; }
        }

        if (!instId || !instType) {
          toast({ title: isRtl ? "غير مصرح" : "Unauthorized", variant: "destructive" });
          navigate("/");
          return;
        }
        setInstitutionId(instId);
        setInstitutionType(instType);


        const deptIdParam = searchParams.get("dept");

        if (!isStudent) {
          // Faculty add: department MUST come from context (route param). No selector.
          if (!deptIdParam) {
            setContextError(
              isRtl
                ? "تعذّر تحديد القسم الحالي. يرجى العودة إلى صفحة القسم والمحاولة مرة أخرى."
                : "Unable to determine the current department. Please return to the department page and try again."
            );
            return;
          }
          const { data: dept } = await supabase
            .from("departments")
            .select("id, department_name, institution_id, institution_type")
            .eq("id", deptIdParam)
            .maybeSingle();
          if (!dept || dept.institution_id !== instId || dept.institution_type !== instType) {
            setContextError(
              isRtl
                ? "تعذّر تحديد القسم الحالي. يرجى العودة إلى صفحة القسم والمحاولة مرة أخرى."
                : "Unable to determine the current department. Please return to the department page and try again."
            );
            return;
          }
          setDepartmentId(dept.id);
          setCurrentDepartmentName(dept.department_name);
        } else {
          // Student flow: keep existing behavior (list departments for reference / codes UI).
          const { data: depts } = await supabase
            .from("departments")
            .select("id, department_name")
            .eq("institution_id", instId)
            .eq("institution_type", instType)
            .order("created_at", { ascending: false });
          setDepartments(depts || []);
        }
      } finally {
        setLoadingDepts(false);
      }
    })();
    // Clear temporary password when leaving the page.
    return () => { setTempPassword(""); };
  }, []);


  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: isRtl ? "حجم الصورة كبير (الحد 5MB)" : "Image too large (max 5MB)", variant: "destructive" });
      return;
    }
    try {
      setUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      const ext = file.name.split(".").pop();
      if (!user?.id) throw new Error(isRtl ? "يجب تسجيل الدخول" : "Must be logged in");
      const path = `${user.id}/faculty/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      setPhotoUrl(data.publicUrl);
    } catch (err: any) {
      toast({ title: isRtl ? "فشل رفع الصورة" : "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const canSubmit = useMemo(
    () =>
      !!fullName.trim() &&
      !!role &&
      (isStudent ? !!deptCodesInput.trim() : !!departmentId) &&
      (isStudent || isStrongPassword(tempPassword)),
    [fullName, role, isStudent, deptCodesInput, departmentId, tempPassword]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return; // idempotency guard
    if (!canSubmit) {
      const missing: string[] = [];
      if (!fullName.trim()) missing.push(isRtl ? "الاسم" : "Full name");
      if (!role) missing.push(isRtl ? "المسمى الوظيفي" : "Role");
      if (!isStudent && !departmentId) missing.push(isRtl ? "القسم" : "Department");
      if (isStudent && !deptCodesInput.trim()) missing.push(isRtl ? "أكواد الأقسام" : "Department codes");
      if (!isStudent && !isStrongPassword(tempPassword)) missing.push(isRtl ? "كلمة مرور قوية" : "Strong password");
      toast({
        title: isRtl ? "أكمل الحقول المطلوبة" : "Complete required fields",
        description: missing.join(" • "),
        variant: "destructive",
      });
      return;
    }
    setSaving(true);

    try {
      const baseRow: any = {
        full_name: fullName.trim(),
        role,
        date_of_birth: dateOfBirth || null,
        photo_url: photoUrl || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        national_id: nationalId.trim() || null,
        gender: gender || null,
        address: address.trim() || null,
        qualification: qualification.trim() || null,
        specialization: specialization.trim() || null,
        hire_date: hireDate || null,
        notes: notes.trim() || null,
      };

      if (isStudent) {
        const codes = Array.from(new Set(
          deptCodesInput.split(/[\s,،]+/).map(c => c.trim().toUpperCase()).filter(Boolean)
        ));
        // Call edge function to create the auth account instantly with a temporary password
        const { data: resp, error: fnErr } = await supabase.functions.invoke("create-student-account", {
          body: {
            full_name: baseRow.full_name,
            email: baseRow.email,
            phone: baseRow.phone,
            department_codes: codes,
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
        });
        if (fnErr || (resp && (resp as any).error)) {
          throw new Error(((resp as any)?.error) || fnErr?.message || "Failed to create student account");
        }
        const r = resp as any;
        toast({
          title: isRtl ? `تم تسجيل الطالب في ${r.joined} قسم` : `Student enrolled in ${r.joined} department(s)`,
          description: (isRtl
            ? `تم تفعيل الحساب بنجاح. البريد: ${r.email}`
            : `Account activated. Email: ${r.email}`)
            + (r.missing?.length ? (isRtl ? `\nأكواد غير صالحة: ${r.missing.join(", ")}` : `\nInvalid codes: ${r.missing.join(", ")}`) : ""),
          duration: 8000,
        });


      } else {
        // Department is required from the user — never auto-create "General/عام".
        if (!departmentId) {
          throw new Error(isRtl ? "اختر القسم" : "Select a department");
        }

        const { data: resp, error: fnErr } = await supabase.functions.invoke("create-faculty-account", {
          body: {
            full_name: baseRow.full_name,
            role,
            department_id: departmentId,
            email: baseRow.email,
            phone: baseRow.phone,
            temporary_password: tempPassword,
            extra: {
              date_of_birth: baseRow.date_of_birth,
              photo_url: baseRow.photo_url,
              national_id: baseRow.national_id,
              gender: baseRow.gender,
              address: baseRow.address,
              qualification: baseRow.qualification,
              specialization: baseRow.specialization,
              hire_date: baseRow.hire_date,
              notes: baseRow.notes,
            },
          },
        });
        if (fnErr) {
          let realMsg = fnErr.message || "Failed to create faculty account";
          let realStep = "";
          try {
            const ctx: any = (fnErr as any).context;
            const bodyText = ctx?.body ? (typeof ctx.body === "string" ? ctx.body : await new Response(ctx.body).text()) : "";
            if (bodyText) {
              const parsed = JSON.parse(bodyText);
              if (parsed?.error) realMsg = parsed.error;
              if (parsed?.step) realStep = parsed.step;
            }
          } catch (e) { console.error("Parse edge error failed:", e); }
          throw new Error(realStep ? `[${realStep}] ${realMsg}` : realMsg);
        }
        if (resp && (resp as any).error) throw new Error((resp as any).error);

        const r = resp as any;
        toast({
          title: isRtl ? "تمت إضافة العضو وإنشاء حسابه بنجاح" : "Member added and account created",
          description: isRtl
            ? `تم تفعيل الحساب، ويجب على العضو تغيير كلمة المرور المؤقتة عند أول تسجيل دخول.\nالبريد: ${r.email}`
            : `The account is active. The member must change the temporary password on first sign-in.\nEmail: ${r.email}`,
          duration: 8000,
        });
        // Clear password from memory immediately.
        setTempPassword("");
      }

      try { sessionStorage.setItem("institution-dashboard-force-refresh", Date.now().toString()); } catch {}
      navigate(`/institution/dashboard?tab=${isStudent ? "students" : "faculty"}`, { replace: true });
    } catch (err: any) {
      console.error("Save failed:", err);
      toast({ title: isRtl ? "فشل الحفظ" : "Save failed", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const labelCls = "flex items-center gap-2 text-base sm:text-lg font-extrabold text-foreground";
  const iconCls = "w-5 h-5 sm:w-6 sm:h-6 text-primary";
  const inputCls = "h-12 text-base border-2 border-primary/30 focus-visible:border-primary focus-visible:ring-primary/30 bg-card";
  const triggerCls = "h-12 text-base border-2 border-primary/30 focus:border-primary focus:ring-primary/30 bg-card font-semibold";

  return (
    <div dir={dir} className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-primary/10">
      <header className="border-b-2 border-primary/30 bg-gradient-to-l from-primary/25 via-primary/10 to-card shadow-lg sticky top-0 z-10 backdrop-blur">
        <div className="container mx-auto px-4 py-5 flex items-center justify-between gap-3">
          <h1 className="text-2xl sm:text-3xl font-black text-foreground flex items-center gap-3 min-w-0">
            <span className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-xl shadow-primary/40 shrink-0">
              <UserPlus className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.6} />
            </span>
            <span className="truncate tracking-tight">{isStudent ? (isRtl ? "تسجيل طالب" : "Register Student") : (isRtl ? "إضافة عضو يدويًا" : "Add Member Manually")}</span>
          </h1>
          <Button size="icon" variant="default" className="shadow-lg shadow-primary/40 shrink-0 w-11 h-11" onClick={() => navigate(-1)} aria-label={isRtl ? "رجوع" : "Back"}>
            {isRtl ? <ArrowLeft className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-3 sm:py-5">
        <form onSubmit={handleSubmit}>
          <Card className="border-2 border-primary/30 max-w-4xl mx-auto shadow-2xl shadow-primary/10 bg-gradient-to-br from-card via-card to-primary/5">
            <CardContent className="p-4 sm:p-6 space-y-5">
              {/* Photo */}
              <div className="flex flex-col items-center gap-2">
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-4 border-primary/40 ring-2 ring-primary/15 bg-muted flex items-center justify-center shadow-lg shadow-primary/30">
                  {photoUrl ? (
                    <img src={photoUrl} alt={fullName || "photo"} className="w-full h-full object-cover" />
                  ) : (
                    <UserRound className="w-10 h-10 text-primary/60" strokeWidth={1.8} />
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={handlePhotoChange} />
                <Button type="button" variant="default" size="sm" className="shadow-md shadow-primary/30 font-bold text-sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : <Upload className="w-4 h-4 me-2" />}
                  {isRtl ? "رفع صورة شخصية" : "Upload Photo"}
                </Button>
              </div>


              {/* Current Department banner (faculty only, read-only, derived from context) */}
              {!isStudent && currentDepartmentName && (
                <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-4 flex items-center gap-3">
                  <Briefcase className={iconCls} strokeWidth={2.4} />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-muted-foreground">
                      {isRtl ? "إضافة عضو جديد إلى قسم:" : "Add New Member to:"}
                    </div>
                    <div className="text-lg font-extrabold text-foreground truncate">
                      {currentDepartmentName}
                    </div>
                  </div>
                </div>
              )}

              {/* Role (faculty only) — department is fixed from context and not editable */}
              {!isStudent && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2.5">
                    <Label className={labelCls}><Users2 className={iconCls} strokeWidth={2.4} />{isRtl ? "المسمى الوظيفي" : "Role"} <span className="text-destructive text-lg">*</span></Label>
                    <Select value={role} onValueChange={setRole}>
                      <SelectTrigger className={triggerCls}><SelectValue placeholder={isRtl ? "اختر المسمى" : "Select role"} /></SelectTrigger>
                      <SelectContent>
                        {ROLE_OPTIONS.map(r => (
                          <SelectItem key={r.value} value={r.value} className="text-base">{isRtl ? r.ar : r.en}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Login details — faculty only */}
              {!isStudent && (
                <div className="space-y-2.5 rounded-lg border border-primary/30 bg-primary/5 p-4">
                  <Label className={labelCls}>
                    <KeyRound className={iconCls} strokeWidth={2.4} />
                    {isRtl ? "بيانات الدخول (كلمة مرور مؤقتة)" : "Login Details (Temporary Password)"}
                    <span className="text-destructive text-lg">*</span>
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      className={`${inputCls} font-mono tracking-wider`}
                      type={showPassword ? "text" : "password"}
                      value={tempPassword}
                      onChange={e => setTempPassword(e.target.value)}
                      dir="ltr"
                      autoComplete="new-password"
                      spellCheck={false}
                    />
                    <Button type="button" variant="outline" size="icon" onClick={() => setShowPassword(v => !v)} aria-label={isRtl ? "إظهار/إخفاء" : "Show/Hide"}>
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button type="button" variant="outline" size="icon" onClick={async () => { try { await navigator.clipboard.writeText(tempPassword); toast({ title: isRtl ? "تم النسخ" : "Copied" }); } catch {} }} aria-label={isRtl ? "نسخ" : "Copy"}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="outline" size="icon" onClick={() => setTempPassword(generateStrongPassword())} aria-label={isRtl ? "توليد" : "Regenerate"}>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {isRtl
                      ? "شارك هذه البيانات مع العضو الآن. سيُطلب منه تغيير كلمة المرور عند أول تسجيل دخول."
                      : "Share these credentials with the member now. They will be forced to change the password on first sign-in."}
                  </p>
                  {!isStrongPassword(tempPassword) && (
                    <p className="text-xs text-destructive">
                      {isRtl ? "كلمة المرور ضعيفة: 8 أحرف+ تحتوي حرفاً كبيراً وصغيراً ورقماً." : "Weak password: 8+ chars with upper, lower and a digit."}
                    </p>
                  )}
                </div>
              )}


              {/* Department code(s) — student only */}
              {isStudent && (
                <div className="space-y-2.5">
                  <Label className={labelCls}><Briefcase className={iconCls} strokeWidth={2.4} />{isRtl ? "أكواد الأقسام" : "Department Codes"} <span className="text-destructive text-lg">*</span></Label>
                  <Input
                    className={`${inputCls} font-mono tracking-widest`}
                    value={deptCodesInput}
                    onChange={e => setDeptCodesInput(e.target.value)}
                    placeholder={isRtl ? "مثال: ABC123, XYZ789" : "e.g. ABC123, XYZ789"}
                    dir="ltr"
                  />
                  <p className="text-xs text-muted-foreground">
                    {isRtl ? "أدخل كود قسم واحد أو أكثر مفصولة بفاصلة — سيُضاف الطالب لكل قسم تلقائياً." : "Enter one or more codes separated by commas — the student is added to each department automatically."}
                  </p>
                </div>
              )}

              {/* Basic */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2.5">
                  <Label className={labelCls}><UserRound className={iconCls} strokeWidth={2.4} />{isRtl ? "الاسم الكامل" : "Full Name"} <span className="text-destructive text-lg">*</span></Label>
                  <Input className={inputCls} value={fullName} onChange={e => setFullName(e.target.value)} placeholder={isRtl ? "الاسم رباعي" : "Full name"} />
                </div>
                <div className="space-y-2.5">
                  <Label className={labelCls}><Calendar className={iconCls} strokeWidth={2.4} />{isRtl ? "تاريخ الميلاد" : "Date of Birth"}</Label>
                  <Input className={inputCls} type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} />
                </div>
                <div className="space-y-2.5">
                  <Label className={labelCls}><Users2 className={iconCls} strokeWidth={2.4} />{isRtl ? "النوع" : "Gender"}</Label>
                  <Select value={gender} onValueChange={setGender}>
                    <SelectTrigger className={triggerCls}><SelectValue placeholder={isRtl ? "اختر" : "Select"} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male" className="text-base">{isRtl ? "ذكر" : "Male"}</SelectItem>
                      <SelectItem value="female" className="text-base">{isRtl ? "أنثى" : "Female"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2.5">
                  <Label className={labelCls}><IdCard className={iconCls} strokeWidth={2.4} />{isRtl ? "الرقم القومي" : "National ID"}</Label>
                  <Input className={inputCls} value={nationalId} onChange={e => setNationalId(e.target.value)} maxLength={20} />
                </div>
              </div>

              {/* Contact */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2.5">
                  <Label className={labelCls}><Mail className={iconCls} strokeWidth={2.4} />{isRtl ? "البريد الإلكتروني" : "Email"}</Label>
                  <Input className={inputCls} type="email" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2.5">
                  <Label className={labelCls}><Phone className={iconCls} strokeWidth={2.4} />{isRtl ? "رقم الهاتف" : "Phone"}</Label>
                  <Input className={inputCls} value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
                <div className="space-y-2.5 md:col-span-2">
                  <Label className={labelCls}><MapPin className={iconCls} strokeWidth={2.4} />{isRtl ? "العنوان" : "Address"}</Label>
                  <Input className={inputCls} value={address} onChange={e => setAddress(e.target.value)} />
                </div>
              </div>

              {/* Academic */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2.5">
                  <Label className={labelCls}><BookOpen className={iconCls} strokeWidth={2.4} />{isStudent ? (isRtl ? "المؤهل الدراسي" : "Study Qualification") : (isRtl ? "المؤهل العلمي" : "Qualification")}</Label>
                  <Input className={inputCls} value={qualification} onChange={e => setQualification(e.target.value)} placeholder={isStudent ? (isRtl ? "مثال: الفرقة الثانية" : "e.g. 2nd year") : (isRtl ? "مثال: دكتوراه" : "e.g. PhD")} />
                </div>
                {!isStudent && (
                  <div className="space-y-2.5">
                    <Label className={labelCls}><GraduationCap className={iconCls} strokeWidth={2.4} />{isRtl ? "التخصص" : "Specialization"}</Label>
                    <Input className={inputCls} value={specialization} onChange={e => setSpecialization(e.target.value)} />
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-2.5">
                <Label className={labelCls}><StickyNote className={iconCls} strokeWidth={2.4} />{isRtl ? "ملاحظات" : "Notes"}</Label>
                <Textarea className="text-base border-2 border-primary/30 focus-visible:border-primary focus-visible:ring-primary/30 bg-card" value={notes} onChange={e => setNotes(e.target.value)} rows={3} />
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t-2 border-primary/15">
                <Button type="button" variant="outline" size="lg" className="border-2 border-primary/30 font-bold text-base" onClick={() => navigate(-1)} disabled={saving}>
                  {isRtl ? "إلغاء" : "Cancel"}
                </Button>
                <Button
                  type="submit"
                  size="lg"
                  disabled={saving}
                  onClick={() => console.log("Save button clicked", { canSubmit, saving, fullName, role, departmentId, deptCodesInput, isStudent, departmentsCount: departments.length })}
                  className="shadow-xl shadow-primary/40 font-extrabold text-base bg-gradient-to-l from-primary to-primary/80 gap-2"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin shrink-0" /> : <Save className="w-5 h-5 shrink-0" strokeWidth={2.5} />}
                  <span>{isRtl ? "حفظ العضو" : "Save Member"}</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </main>
    </div>
  );
};

export default InstitutionFacultyAdd;
