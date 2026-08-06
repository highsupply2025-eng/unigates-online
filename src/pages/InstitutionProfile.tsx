import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2, Mail, Phone, MapPin, Camera, Lock, Save, Loader2,
  Eye, EyeOff, ShieldCheck, Calendar, GraduationCap, Users,
  CreditCard, Sparkles, Landmark, User,
} from "lucide-react";
import { getInstitutionMenuItems } from "@/components/institutionMenuItems";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "@/hooks/use-toast";
import DashboardMenuDropdown from "@/components/DashboardMenuDropdown";
import { useRealtimeRefresh } from "@/hooks/use-realtime-refresh";
import { useInstitutionStats } from "@/hooks/useInstitutionStats";


interface InstitutionData {
  id: string;
  kind: "college" | "institute";
  name: string;
  leaderName: string;
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
  subscription_plan?: string | null;
}

const PLAN_LABELS: Record<string, { ar: string; en: string }> = {
  free: { ar: "المجانية", en: "Free" },
  monthly: { ar: "الشهرية", en: "Monthly" },
  annual: { ar: "السنوية", en: "Annual" },
};

function getPlanLabel(plan: string | null | undefined, isRtl: boolean) {
  if (!plan) return isRtl ? "المجانية" : "Free";
  const label = PLAN_LABELS[plan];
  return label ? (isRtl ? label.ar : label.en) : isRtl ? "المجانية" : "Free";
}

const InstitutionProfile = () => {
  const { dir, language, toggleLanguage } = useLanguage();
  const isRtl = language === "ar";
  const navigate = useNavigate();
  const [institutionType, setInstitutionType] = useState<"college" | "institute">("college");
  const fileRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<InstitutionData | null>(null);

  const { studentCount: liveStudentCount, departmentCount: liveDeptCount, facultyCount: liveFacultyCount } = useInstitutionStats(
    data?.id ?? null,
    data?.kind ?? null,
  );

  const [leaderName, setLeaderName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [savingInfo, setSavingInfo] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [savingPass, setSavingPass] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  useRealtimeRefresh(
    ["college_registrations", "institute_registrations", "departments"],
    () => setRefreshTick((n) => n + 1)
  );

  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) { navigate("/login"); return; }

        const email = (user.email || "").toLowerCase();

        let kind: "college" | "institute" = "college";
        const { data: college } = await supabase
          .from("college_registrations")
          .select("id, college_name, dean_name, email, phone, city, address, logo_url, status, student_count, university_name, created_at, subscription_plan")
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
            subscription_plan: college.subscription_plan,
          };
        } else {
          kind = "institute";
          const { data: inst } = await supabase
            .from("institute_registrations")
            .select("id, institute_name, director_name, email, phone, city, address, logo_url, status, student_count, specialization, created_at, subscription_plan")
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
              subscription_plan: inst.subscription_plan,
            };
          }
        }

        if (!row) {
          toast({
            title: isRtl ? "غير مسموح" : "Not allowed",
            description: isRtl ? "هذه الصفحة لإدارة المؤسسة فقط" : "Institution admin only",
            variant: "destructive",
          });
          return;
        }

        setData(row);
        setInstitutionType(row.kind);
        setLeaderName(row.leaderName || "");
        setPhone(row.phone || "");
        setCity(row.city || "");
        setAddress(row.address || "");
      } catch (e) {
        console.error("institution profile load error", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate, isRtl, refreshTick]);

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

  const initials = (data?.name || "?").trim().charAt(0).toUpperCase();
  const leaderLabel = institutionType === "college"
    ? (isRtl ? "اسم العميد" : "Dean Name")
    : (isRtl ? "اسم المدير" : "Director Name");

  const headerNode = (
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
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-xl font-black text-foreground truncate">
                {isRtl
                  ? (institutionType === "college" ? "لوحة ادارة الكلية" : "لوحة ادارة المعهد")
                  : (institutionType === "college" ? "College Administration" : "Institute Administration")}
              </h1>
              {data?.subscription_plan && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                  {getPlanLabel(data.subscription_plan, isRtl)}
                </span>
              )}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground font-bold truncate">
              {isRtl ? "بيانات الحساب" : "Account Details"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <DashboardMenuDropdown
            title={isRtl ? (institutionType === "college" ? "لوحة الكلية" : "لوحة المعهد") : (institutionType === "college" ? "College Panel" : "Institute Panel")}
            onLanguageToggle={toggleLanguage}
            showNotifications={false}
            onLogout={async () => { await supabase.auth.signOut(); navigate("/university-platform"); }}
            items={getInstitutionMenuItems({
              isRtl,
              activeKey: "profile",
              onTabChange: (tab) => navigate(`/institution/dashboard?tab=${tab}`),
              onNavigate: (path) => navigate(path),
            })}
          />
        </div>
      </div>
    </header>
  );

  if (loading || !data) return (
    <div className="min-h-screen bg-background institution-admin-scope" dir={dir}>
      {headerNode}
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 institution-admin-scope" dir={dir}>
      {headerNode}

      <main className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-8 space-y-6">

        {/* ── Cover + Profile Hero ── */}
        <Card className="overflow-hidden border-0 shadow-xl shadow-primary/10">
          {/* Cover banner */}
          <div className="relative h-40 sm:h-52 bg-gradient-to-br from-primary via-primary/80 to-[hsl(160,60%,35%)] overflow-hidden">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/3 -translate-x-1/4 blur-2xl" />
            </div>
          </div>

          <CardContent className="relative px-5 sm:px-8 pb-6">
            {/* Logo — overlaps the cover */}
            <div className="relative -mt-16 sm:-mt-20 flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-6">
              <div className="relative shrink-0 group">
                <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-gradient-to-br from-primary to-primary/60 ring-4 ring-background shadow-2xl overflow-hidden flex items-center justify-center border-4 border-primary/20">
                  {data.logo_url ? (
                    <img
                      src={data.logo_url}
                      alt={data.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        setData((d) => (d ? { ...d, logo_url: null } : d));
                      }}
                    />
                  ) : (
                    <span className="text-4xl sm:text-5xl font-black text-primary-foreground drop-shadow-lg">{initials}</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploadingLogo}
                  className="absolute bottom-1 end-1 w-10 h-10 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-110 transition-transform disabled:opacity-60 ring-2 ring-background"
                  aria-label={isRtl ? "تغيير الشعار" : "Change logo"}
                >
                  {uploadingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
              </div>

              {/* Name + badges */}
              <div className="flex-1 text-center sm:text-start sm:pb-2">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">{data.name}</h2>
                <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-2.5">
                  <Badge className="bg-gradient-to-r from-primary to-primary/70 text-primary-foreground gap-1 shadow-sm">
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

        {/* ── Quick Stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="border-primary/15 hover:border-primary/30 transition-colors">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 text-blue-600 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground font-medium">{isRtl ? "الطلاب" : "Students"}</p>
                <p className="font-extrabold text-xl text-foreground">{liveStudentCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-primary/15 hover:border-primary/30 transition-colors">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 text-emerald-600 flex items-center justify-center shrink-0">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground font-medium">{isRtl ? "الأقسام" : "Departments"}</p>
                <p className="font-extrabold text-xl text-foreground">{liveDeptCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-primary/15 hover:border-primary/30 transition-colors">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500/10 to-violet-600/5 text-violet-600 flex items-center justify-center shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground font-medium">{isRtl ? "هيئة التدريس" : "Faculty"}</p>
                <p className="font-extrabold text-xl text-foreground">{liveFacultyCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-primary/15 hover:border-primary/30 transition-colors">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-600/5 text-amber-600 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground font-medium">{isRtl ? "المدينة" : "City"}</p>
                <p className="font-extrabold truncate">{data.city || "—"}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Subscription Plan ── */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-primary/[0.02] to-transparent">
          <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">{isRtl ? "الباقة الحالية" : "Current Plan"}</p>
                <p className="font-extrabold text-xl text-primary">
                  {getPlanLabel(data.subscription_plan, isRtl)}
                </p>
              </div>
            </div>
            <div className="text-start text-sm text-muted-foreground space-y-1 bg-background/60 rounded-xl px-4 py-3 border border-primary/10">
              {data.subscription_plan === "free" ? (
                <>
                  <p className="flex items-center gap-2"><Sparkles className="w-3.5 h-3.5 text-primary/60" /> {isRtl ? "حتى 100 طالب لكل قسم" : "Up to 100 students per dept"}</p>
                  <p className="flex items-center gap-2"><Sparkles className="w-3.5 h-3.5 text-primary/60" /> {isRtl ? "3 أعضاء هيئة تدريس لكل قسم" : "3 faculty per dept"}</p>
                </>
              ) : (
                <>
                  <p className="flex items-center gap-2"><Sparkles className="w-3.5 h-3.5 text-primary/60" /> {isRtl ? "حتى 2000 طالب لكل قسم" : "Up to 2000 students per dept"}</p>
                  <p className="flex items-center gap-2"><Sparkles className="w-3.5 h-3.5 text-primary/60" /> {isRtl ? "10 أعضاء هيئة تدريس لكل قسم" : "10 faculty per dept"}</p>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ── College Info Form ── */}
        <Card className="border-primary/15">
          <CardHeader className="pb-3 border-b border-primary/10">
            <CardTitle className="text-base flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5" />
              </span>
              {isRtl
                ? (data.kind === "college" ? "بيانات الكلية" : "بيانات المعهد")
                : (data.kind === "college" ? "College Information" : "Institute Information")}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="instName" className="text-sm font-semibold">{isRtl
                  ? (data.kind === "college" ? "اسم الكلية" : "اسم المعهد")
                  : (data.kind === "college" ? "College Name" : "Institute Name")}</Label>
                <Input id="instName" value={data.name} disabled className="bg-muted/50" />
                <p className="text-[11px] text-muted-foreground">{isRtl ? "للتغيير راسل الدعم" : "Contact support to change"}</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="leader" className="text-sm font-semibold">{leaderLabel}</Label>
                <div className="relative">
                  <User className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="leader" value={leaderName} onChange={(e) => setLeaderName(e.target.value)} className="ps-9" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-semibold">{isRtl ? "البريد الإلكتروني" : "Email"}</Label>
                <div className="relative">
                  <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="email" value={data.email} disabled className="ps-9 bg-muted/50" dir="ltr" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-sm font-semibold">{isRtl ? "رقم الهاتف" : "Phone"}</Label>
                <div className="relative">
                  <Phone className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="ps-9" dir="ltr" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="city" className="text-sm font-semibold">{isRtl ? "المدينة" : "City"}</Label>
                <div className="relative">
                  <MapPin className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} className="ps-9" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="address" className="text-sm font-semibold">{isRtl ? "العنوان" : "Address"}</Label>
                <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>
              {data.kind === "college" && data.university_name && (
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-sm font-semibold">{isRtl ? "الجامعة التابعة" : "Parent University"}</Label>
                  <Input value={data.university_name} disabled className="bg-muted/50" />
                </div>
              )}
              {data.kind === "institute" && data.specialization && (
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-sm font-semibold">{isRtl ? "التخصص" : "Specialization"}</Label>
                  <Input value={data.specialization} disabled className="bg-muted/50" />
                </div>
              )}
            </div>
            <div className="flex justify-end pt-2">
              <Button onClick={saveInfo} disabled={savingInfo} className="gap-2 shadow-lg shadow-primary/20">
                {savingInfo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isRtl ? "حفظ التغييرات" : "Save Changes"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── Change Password ── */}
        <Card className="border-primary/15">
          <CardHeader className="pb-3 border-b border-primary/10">
            <CardTitle className="text-base flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5" />
              </span>
              {isRtl ? "تغيير كلمة المرور" : "Change Password"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="newPass" className="text-sm font-semibold">{isRtl ? "كلمة المرور الجديدة" : "New Password"}</Label>
                <div className="relative">
                  <Input id="newPass" type={showPass ? "text" : "password"} value={newPass} onChange={(e) => setNewPass(e.target.value)} dir="ltr" className="pe-10" />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute end-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="toggle">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirmPass" className="text-sm font-semibold">{isRtl ? "تأكيد كلمة المرور" : "Confirm Password"}</Label>
                <Input id="confirmPass" type={showPass ? "text" : "password"} value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} dir="ltr" />
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">{isRtl ? "8 أحرف على الأقل تحتوي حرف كبير وصغير ورقم" : "At least 8 characters with upper, lower and a digit"}</p>
            <Separator />
            <div className="flex justify-end">
              <Button onClick={savePassword} disabled={savingPass} variant="default" className="gap-2 shadow-lg shadow-primary/20">
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
