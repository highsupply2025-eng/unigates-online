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

  const [photoUrl, setPhotoUrl] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState(isStudent ? "student" : "");
  const [departmentId, setDepartmentId] = useState("");
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

        const { data: depts } = await supabase
          .from("departments")
          .select("id, department_name")
          .eq("institution_id", instId)
          .eq("institution_type", instType)
          .order("created_at", { ascending: false });
        setDepartments(depts || []);
        const deptId = searchParams.get("dept");
        if (deptId && depts?.find((d: any) => d.id === deptId)) {
          setDepartmentId(deptId);
        } else if (depts && depts.length > 0) {
          setDepartmentId(depts[0].id);
        }
      } finally {
        setLoadingDepts(false);
      }
    })();
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

  // department_id is auto-resolved (or auto-created) in handleSubmit for faculty,
  // so it's intentionally excluded from client validation.
  const canSubmit = useMemo(
    () => !!fullName.trim() && !!role && (isStudent ? !!deptCodesInput.trim() : true),
    [fullName, role, isStudent, deptCodesInput]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("handleSubmit called");
    const formData = {
      fullName, role, departmentId, deptCodesInput, dateOfBirth, gender,
      email, phone, nationalId, address, qualification, specialization,
      hireDate, notes, photoUrl, isStudent,
    };
    console.log(formData);
    if (!canSubmit) {
      const missing: string[] = [];
      if (!fullName.trim()) missing.push("fullName");
      if (!role) missing.push("role");
      if (isStudent ? !deptCodesInput.trim() : !departmentId) {
        missing.push(isStudent ? "deptCodesInput" : "departmentId");
      }
      console.warn("Validation failed. Missing fields:", missing);
      toast({
        title: isRtl ? "أكمل الحقول المطلوبة" : "Complete required fields",
        description: `Missing: ${missing.join(", ")}`,
        variant: "destructive",
      });
      return;
    }
    console.log("Sending to Supabase...");
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
        const credLine = isRtl
          ? `تم تفعيل الحساب فوراً ✓\nالبريد: ${r.email}\nكلمة المرور المؤقتة: ${r.password}`
          : `Account activated instantly ✓\nEmail: ${r.email}\nTemp password: ${r.password}`;
        try { await navigator.clipboard?.writeText(`${r.email}\n${r.password}`); } catch {}
        toast({
          title: isRtl ? `تم تسجيل الطالب في ${r.joined} قسم` : `Student enrolled in ${r.joined} department(s)`,
          description: credLine + (r.missing?.length ? (isRtl ? `\nأكواد غير صالحة: ${r.missing.join(", ")}` : `\nInvalid codes: ${r.missing.join(", ")}`) : ""),
          duration: 15000,
        });

      } else {
        const invitationCode = `FAC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
        const { error } = await supabase.from("department_members").insert({
          ...baseRow,
          department_id: departmentId,
          invitation_code: invitationCode,
        });
        if (error) {
          console.error("Supabase insert failed:", error);
          throw error;
        }
        toast({ title: isRtl ? "تم حفظ بيانات العضو" : "Member saved successfully" });
      }
      navigate(-1);
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

      <main className="container mx-auto px-4 py-6 sm:py-8">
        <form onSubmit={handleSubmit}>
          <Card className="border-2 border-primary/30 max-w-4xl mx-auto shadow-2xl shadow-primary/10 bg-gradient-to-br from-card via-card to-primary/5">
            <CardContent className="p-5 sm:p-10 space-y-8">
              {/* Photo */}
              <div className="flex flex-col items-center gap-4">
                <div className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-full overflow-hidden border-[6px] border-primary/40 ring-4 ring-primary/15 bg-muted flex items-center justify-center shadow-xl shadow-primary/30">
                  {photoUrl ? (
                    <img src={photoUrl} alt={fullName || "photo"} className="w-full h-full object-cover" />
                  ) : (
                    <UserRound className="w-16 h-16 text-primary/60" strokeWidth={1.8} />
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={handlePhotoChange} />
                <Button type="button" variant="default" size="lg" className="shadow-lg shadow-primary/30 font-bold text-base" onClick={() => fileRef.current?.click()} disabled={uploading}>
                  {uploading ? <Loader2 className="w-5 h-5 animate-spin me-2" /> : <Upload className="w-5 h-5 me-2" />}
                  {isRtl ? "رفع صورة شخصية" : "Upload Photo"}
                </Button>
              </div>

              {/* Role */}
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
