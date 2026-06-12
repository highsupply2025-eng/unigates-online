import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  const fileRef = useRef<HTMLInputElement>(null);

  const [loadingDepts, setLoadingDepts] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);

  const [photoUrl, setPhotoUrl] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("");
  const [departmentId, setDepartmentId] = useState("");
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
          .select("id, name")
          .eq("institution_id", instId)
          .eq("institution_type", instType)
          .order("created_at", { ascending: false });
        setDepartments(depts || []);
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
      const path = `faculty/${user?.id || "anon"}/${Date.now()}.${ext}`;
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
    () => !!fullName.trim() && !!role && !!departmentId,
    [fullName, role, departmentId]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) {
      toast({ title: isRtl ? "أكمل الحقول المطلوبة" : "Complete required fields", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const invitationCode = `FAC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      const { error } = await supabase.from("department_members").insert({
        department_id: departmentId,
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
        invitation_code: invitationCode,
      });
      if (error) throw error;
      toast({ title: isRtl ? "تم حفظ بيانات العضو" : "Member saved successfully" });
      navigate(-1);
    } catch (err: any) {
      toast({ title: isRtl ? "فشل الحفظ" : "Save failed", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div dir={dir} className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="border-b bg-gradient-to-l from-primary/10 via-card to-card shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <h1 className="text-xl sm:text-2xl font-extrabold text-foreground flex items-center gap-2 min-w-0">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-md shrink-0">
              <UserPlus className="w-5 h-5" strokeWidth={2.4} />
            </span>
            <span className="truncate">{isRtl ? "إضافة عضو يدويًا" : "Add Member Manually"}</span>
          </h1>
          <Button size="icon" variant="default" className="shadow-md shrink-0" onClick={() => navigate(-1)} aria-label={isRtl ? "رجوع" : "Back"}>
            {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 sm:py-8">
        <form onSubmit={handleSubmit}>
          <Card className="border-2 border-primary/20 max-w-4xl mx-auto">
            <CardContent className="p-5 sm:p-8 space-y-6">
              {/* Photo */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative w-28 h-28 rounded-full overflow-hidden border-4 border-primary/30 bg-muted flex items-center justify-center shadow-md">
                  {photoUrl ? (
                    <img src={photoUrl} alt={fullName || "photo"} className="w-full h-full object-cover" />
                  ) : (
                    <UserRound className="w-12 h-12 text-muted-foreground" />
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={handlePhotoChange} />
                <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : <Upload className="w-4 h-4 me-2" />}
                  {isRtl ? "رفع صورة شخصية" : "Upload Photo"}
                </Button>
              </div>

              {/* Role + Department */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Users2 className="w-4 h-4 text-primary" />{isRtl ? "المسمى الوظيفي" : "Role"} <span className="text-destructive">*</span></Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger><SelectValue placeholder={isRtl ? "اختر المسمى" : "Select role"} /></SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.map(r => (
                        <SelectItem key={r.value} value={r.value}>{isRtl ? r.ar : r.en}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><GraduationCap className="w-4 h-4 text-primary" />{isRtl ? "القسم" : "Department"} <span className="text-destructive">*</span></Label>
                  <Select value={departmentId} onValueChange={setDepartmentId} disabled={loadingDepts}>
                    <SelectTrigger><SelectValue placeholder={loadingDepts ? (isRtl ? "جاري التحميل..." : "Loading...") : (isRtl ? "اختر القسم" : "Select department")} /></SelectTrigger>
                    <SelectContent>
                      {departments.map(d => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Basic */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{isRtl ? "الاسم الكامل" : "Full Name"} <span className="text-destructive">*</span></Label>
                  <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder={isRtl ? "الاسم رباعي" : "Full name"} />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Calendar className="w-4 h-4 text-primary" />{isRtl ? "تاريخ الميلاد" : "Date of Birth"}</Label>
                  <Input type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{isRtl ? "النوع" : "Gender"}</Label>
                  <Select value={gender} onValueChange={setGender}>
                    <SelectTrigger><SelectValue placeholder={isRtl ? "اختر" : "Select"} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">{isRtl ? "ذكر" : "Male"}</SelectItem>
                      <SelectItem value="female">{isRtl ? "أنثى" : "Female"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><IdCard className="w-4 h-4 text-primary" />{isRtl ? "الرقم القومي" : "National ID"}</Label>
                  <Input value={nationalId} onChange={e => setNationalId(e.target.value)} maxLength={20} />
                </div>
              </div>

              {/* Contact */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Mail className="w-4 h-4 text-primary" />{isRtl ? "البريد الإلكتروني" : "Email"}</Label>
                  <Input type="email" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Phone className="w-4 h-4 text-primary" />{isRtl ? "رقم الهاتف" : "Phone"}</Label>
                  <Input value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" />{isRtl ? "العنوان" : "Address"}</Label>
                  <Input value={address} onChange={e => setAddress(e.target.value)} />
                </div>
              </div>

              {/* Academic */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><BookOpen className="w-4 h-4 text-primary" />{isRtl ? "المؤهل العلمي" : "Qualification"}</Label>
                  <Input value={qualification} onChange={e => setQualification(e.target.value)} placeholder={isRtl ? "مثال: دكتوراه" : "e.g. PhD"} />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><GraduationCap className="w-4 h-4 text-primary" />{isRtl ? "التخصص" : "Specialization"}</Label>
                  <Input value={specialization} onChange={e => setSpecialization(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-primary" />{isRtl ? "تاريخ التعيين" : "Hire Date"}</Label>
                  <Input type="date" value={hireDate} onChange={e => setHireDate(e.target.value)} />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><StickyNote className="w-4 h-4 text-primary" />{isRtl ? "ملاحظات" : "Notes"}</Label>
                <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} />
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => navigate(-1)} disabled={saving}>
                  {isRtl ? "إلغاء" : "Cancel"}
                </Button>
                <Button type="submit" disabled={saving || !canSubmit} className="shadow-md">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : <Save className="w-4 h-4 me-2" />}
                  {isRtl ? "حفظ العضو" : "Save Member"}
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
