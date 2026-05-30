import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2, Mail, Phone, MapPin, Camera, Lock, Save, Loader2,
  Eye, EyeOff, Users, ShieldCheck, Calendar, GraduationCap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "@/hooks/use-toast";
import { Landmark } from "lucide-react";
import BackButton from "@/components/BackButton";

interface InstitutionData {
  id: string;
  kind: "college" | "institute";
  name: string;
  leaderName: string;       // dean or director
  email: string;
  phone: string;
  city: string;
  address: string | null;
  logo_url: string | null;
  status: string;
  student_count: number | null;
  university_name?: string | null;
  specialization?: string | null;
  created_at: string;
}

const InstitutionProfile = () => {
  const { dir, language } = useLanguage();
  const isRtl = language === "ar";
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<InstitutionData | null>(null);
  const [departmentsCount, setDepartmentsCount] = useState(0);

  // editable
  const [leaderName, setLeaderName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [savingInfo, setSavingInfo] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // password
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [savingPass, setSavingPass] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { navigate("/login"); return; }

        const email = (user.email || "").toLowerCase();

        // try college first
        let kind: "college" | "institute" = "college";
        const { data: college } = await supabase
          .from("college_registrations")
          .select("id, college_name, dean_name, email, phone, city, address, logo_url, status, student_count, university_name, created_at")
          .ilike("email", email)
          .eq("status", "approved")
          .maybeSingle();

        let row: InstitutionData | null = null;

        if (college) {
          row = {
            id: college.id,
            kind: "college",
            name: college.college_name,
            leaderName: college.dean_name,
            email: college.email,
            phone: college.phone,
            city: college.city,
            address: college.address,
            logo_url: college.logo_url,
            status: college.status,
            student_count: college.student_count,
            university_name: college.university_name,
            created_at: college.created_at,
          };
        } else {
          kind = "institute";
          const { data: inst } = await supabase
            .from("institute_registrations")
            .select("id, institute_name, director_name, email, phone, city, address, logo_url, status, student_count, specialization, created_at")
            .ilike("email", email)
            .eq("status", "approved")
            .maybeSingle();
          if (inst) {
            row = {
              id: inst.id,
              kind: "institute",
              name: inst.institute_name,
              leaderName: inst.director_name,
              email: inst.email,
              phone: inst.phone,
              city: inst.city,
              address: inst.address,
              logo_url: inst.logo_url,
              status: inst.status,
              student_count: inst.student_count,
              specialization: inst.specialization,
              created_at: inst.created_at,
            };
          }
        }

        if (!row) {
          toast({
            title: isRtl ? "غير مسموح" : "Not allowed",
            description: isRtl ? "هذه الصفحة لإدارة المؤسسة فقط" : "Institution admin only",
            variant: "destructive",
          });
          navigate("/profile");
          return;
        }

        setData(row);
        setLeaderName(row.leaderName || "");
        setPhone(row.phone || "");
        setCity(row.city || "");
        setAddress(row.address || "");

        const { count } = await supabase
          .from("departments")
          .select("id", { count: "exact", head: true })
          .eq("institution_id", row.id)
          .eq("institution_type", kind);
        setDepartmentsCount(count || 0);
      } catch (e) {
        console.error("institution profile load error", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate, isRtl]);

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !data) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: isRtl ? "ملف غير صالح" : "Invalid file", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: isRtl ? "الحد الأقصى 5 ميجابايت" : "Max 5 MB", variant: "destructive" });
      return;
    }
    setUploadingLogo(true);
    try {
      const bucket = data.kind === "college" ? "college-logos" : "institute-logos";
      const table = data.kind === "college" ? "college_registrations" : "institute_registrations";
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${data.id}/logo-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from(bucket).upload(path, file, { upsert: true, cacheControl: "3600" });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
      const url = pub.publicUrl;
      const { error: updErr } = await supabase.from(table).update({ logo_url: url }).eq("id", data.id);
      if (updErr) throw updErr;
      setData((d) => d ? { ...d, logo_url: url } : d);
      toast({ title: isRtl ? "تم تحديث الشعار" : "Logo updated" });
    } catch (err: any) {
      toast({ title: isRtl ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    } finally {
      setUploadingLogo(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const saveInfo = async () => {
    if (!data) return;
    if (!leaderName.trim()) {
      toast({ title: isRtl ? "الاسم مطلوب" : "Name required", variant: "destructive" });
      return;
    }
    setSavingInfo(true);
    const table = data.kind === "college" ? "college_registrations" : "institute_registrations";
    const payload: any = {
      phone: phone.trim(),
      city: city.trim(),
      address: address.trim() || null,
    };
    if (data.kind === "college") payload.dean_name = leaderName.trim();
    else payload.director_name = leaderName.trim();

    const { error } = await supabase.from(table).update(payload).eq("id", data.id);
    setSavingInfo(false);
    if (error) {
      toast({ title: isRtl ? "خطأ" : "Error", description: error.message, variant: "destructive" });
      return;
    }
    setData((d) => d ? { ...d, leaderName: leaderName.trim(), phone: phone.trim(), city: city.trim(), address: address.trim() || null } : d);
    toast({ title: isRtl ? "تم الحفظ" : "Saved" });
  };

  const savePassword = async () => {
    if (newPass.length < 8) {
      toast({ title: isRtl ? "8 أحرف على الأقل" : "At least 8 characters", variant: "destructive" });
      return;
    }
    if (newPass !== confirmPass) {
      toast({ title: isRtl ? "غير متطابقة" : "Mismatch", variant: "destructive" });
      return;
    }
    setSavingPass(true);
    const { error } = await supabase.auth.updateUser({ password: newPass });
    setSavingPass(false);
    if (error) {
      toast({ title: isRtl ? "خطأ" : "Error", description: error.message, variant: "destructive" });
      return;
    }
    setNewPass(""); setConfirmPass("");
    toast({ title: isRtl ? "تم تغيير كلمة المرور" : "Password updated" });
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
  if (!data) return null;

  const initials = (data.name || "?").trim().charAt(0).toUpperCase();
  const leaderLabel = data.kind === "college"
    ? (isRtl ? "اسم العميد" : "Dean Name")
    : (isRtl ? "اسم المدير" : "Director Name");

  return (
    <div className="min-h-screen bg-background institution-admin-scope" dir={dir}>
      <header className="border-b border-primary/20 px-3 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-primary/15 via-primary/10 to-transparent sticky top-0 z-30 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <div className="relative shrink-0">
              <div className="absolute inset-0 rounded-2xl bg-primary/40 blur-md animate-pulse" />
              <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-primary via-primary to-[hsl(200,75%,30%)] flex items-center justify-center shadow-xl shadow-primary/40 ring-2 ring-primary/30">
                <Landmark className="w-7 h-7 sm:w-8 sm:h-8 text-white drop-shadow-md" strokeWidth={2.4} />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-base sm:text-xl font-black text-foreground truncate">
                {isRtl
                  ? (data.kind === "college" ? "لوحة ادارة الكلية" : "لوحة ادارة المعهد")
                  : (data.kind === "college" ? "College Administration" : "Institute Administration")}
              </h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground font-bold truncate">
                {isRtl ? "بيانات الحساب" : "Account Details"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <BackButton to="/institution/dashboard" />
          </div>
        </div>
      </header>


      <main className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-8 space-y-5">
        {/* Hero */}
        <Card className="overflow-hidden border-s-4 border-s-primary shadow-md">
          <div className="h-24 bg-gradient-to-r from-primary/80 via-primary to-primary/70" />
          <CardContent className="p-5 sm:p-6 -mt-12">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-5">
              <div className="relative shrink-0">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br from-primary to-primary/60 ring-4 ring-background shadow-xl overflow-hidden flex items-center justify-center">
                  {data.logo_url ? (
                    <img src={data.logo_url} alt={data.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl font-black text-primary-foreground">{initials}</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploadingLogo}
                  className="absolute -bottom-1 -end-1 w-9 h-9 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-110 transition-transform disabled:opacity-60"
                  aria-label={isRtl ? "تغيير الشعار" : "Change logo"}
                >
                  {uploadingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
              </div>
              <div className="flex-1 text-center sm:text-start pt-2 sm:pt-0 sm:pb-2">
                <h2 className="text-2xl font-extrabold text-foreground tracking-tight">{data.name}</h2>
                <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-2">
                  <Badge className="bg-gradient-to-r from-primary to-primary/70 text-primary-foreground gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    {data.kind === "college" ? (isRtl ? "إدارة كلية" : "College Admin") : (isRtl ? "إدارة معهد" : "Institute Admin")}
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <Calendar className="w-3 h-3" />
                    {isRtl ? "منذ" : "Since"} {new Date(data.created_at).toLocaleDateString(isRtl ? "ar-EG" : "en-US")}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{isRtl ? "الأقسام" : "Departments"}</p>
                <p className="font-extrabold text-lg">{departmentsCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{isRtl ? "الطلاب" : "Students"}</p>
                <p className="font-extrabold text-lg">{data.student_count || 0}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="col-span-2 sm:col-span-1">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{isRtl ? "المدينة" : "City"}</p>
                <p className="font-extrabold truncate">{data.city || "—"}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Editable info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              {isRtl
                ? (data.kind === "college" ? "بيانات الكلية" : "بيانات المعهد")
                : (data.kind === "college" ? "College Information" : "Institute Information")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="instName">{isRtl ? "اسم المؤسسة" : "Institution Name"}</Label>
                <Input id="instName" value={data.name} disabled />
                <p className="text-[11px] text-muted-foreground">{isRtl ? "للتغيير راسل الدعم" : "Contact support to change"}</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="leader">{leaderLabel}</Label>
                <Input id="leader" value={leaderName} onChange={(e) => setLeaderName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">{isRtl ? "البريد الإلكتروني" : "Email"}</Label>
                <div className="relative">
                  <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="email" value={data.email} disabled className="ps-9" dir="ltr" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">{isRtl ? "رقم الهاتف" : "Phone"}</Label>
                <div className="relative">
                  <Phone className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="ps-9" dir="ltr" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="city">{isRtl ? "المدينة" : "City"}</Label>
                <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="address">{isRtl ? "العنوان" : "Address"}</Label>
                <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>
              {data.kind === "college" && data.university_name && (
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>{isRtl ? "الجامعة التابعة" : "Parent University"}</Label>
                  <Input value={data.university_name} disabled />
                </div>
              )}
              {data.kind === "institute" && data.specialization && (
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>{isRtl ? "التخصص" : "Specialization"}</Label>
                  <Input value={data.specialization} disabled />
                </div>
              )}
            </div>
            <div className="flex justify-end">
              <Button onClick={saveInfo} disabled={savingInfo} className="gap-2">
                {savingInfo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isRtl ? "حفظ التغييرات" : "Save Changes"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Password */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              {isRtl ? "تغيير كلمة المرور" : "Change Password"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="newPass">{isRtl ? "كلمة المرور الجديدة" : "New Password"}</Label>
                <div className="relative">
                  <Input id="newPass" type={showPass ? "text" : "password"} value={newPass} onChange={(e) => setNewPass(e.target.value)} dir="ltr" className="pe-10" />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute end-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="toggle">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirmPass">{isRtl ? "تأكيد كلمة المرور" : "Confirm Password"}</Label>
                <Input id="confirmPass" type={showPass ? "text" : "password"} value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} dir="ltr" />
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">{isRtl ? "8 أحرف على الأقل" : "At least 8 characters"}</p>
            <Separator />
            <div className="flex justify-end">
              <Button onClick={savePassword} disabled={savingPass} variant="default" className="gap-2">
                {savingPass ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                {isRtl ? "تحديث كلمة المرور" : "Update Password"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default InstitutionProfile;
