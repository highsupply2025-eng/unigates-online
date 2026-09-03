import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Building2, Mail, Phone, MapPin, Camera, Lock, Save, Loader2,
  Eye, EyeOff, ShieldCheck, Calendar, GraduationCap, Users,
  CreditCard, Sparkles, Landmark, User, CheckCircle2, ArrowRight,
  ArrowLeft, RefreshCw, KeyRound, Globe, ExternalLink, SlidersHorizontal,
  ChevronRight, BadgeCheck, Zap, Layers, BookOpen, UserCheck
} from "lucide-react";
import { getInstitutionMenuItems } from "@/components/institutionMenuItems";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "@/hooks/use-toast";
import DashboardMenuDropdown from "@/components/DashboardMenuDropdown";
import LanguageSelectorDropdown from "@/components/LanguageSelectorDropdown";
import ThemeToggle from "@/components/ThemeToggle";
import ugLogo from "@/assets/ug-logo.png";
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

let __institutionProfileCache: InstitutionData | null = null;

const InstitutionProfile = () => {
  const { dir, language, toggleLanguage, tText, translate, isRtl } = useLanguage();
  const navigate = useNavigate();
  const [institutionType, setInstitutionType] = useState<"college" | "institute">(() => __institutionProfileCache?.kind ?? "college");
  const fileRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(() => !__institutionProfileCache);
  const [data, setData] = useState<InstitutionData | null>(() => __institutionProfileCache);

  const { studentCount: liveStudentCount, departmentCount: liveDeptCount, facultyCount: liveFacultyCount } = useInstitutionStats(
    data?.id ?? null,
    data?.kind ?? null,
  );

  const [leaderName, setLeaderName] = useState(() => __institutionProfileCache?.leaderName ?? "");
  const [phone, setPhone] = useState(() => __institutionProfileCache?.phone ?? "");
  const [city, setCity] = useState(() => __institutionProfileCache?.city ?? "");
  const [address, setAddress] = useState(() => __institutionProfileCache?.address ?? "");
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
            title: tText("غير مسموح", "Not allowed"),
            description: tText("هذه الصفحة لإدارة المؤسسة فقط", "Institution admin only"),
            variant: "destructive",
          });
          return;
        }

        __institutionProfileCache = row;
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
  }, [navigate, isRtl, refreshTick, tText]);

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !data) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: tText("ملف غير صالح", "Invalid file"), variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: tText("الحد الأقصى 5 ميجابايت", "Max 5 MB"), variant: "destructive" });
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
      toast({ title: tText("تم تحديث الشعار بنجاح", "Logo updated successfully") });
    } catch (err: any) {
      toast({ title: tText("خطأ", "Error"), description: err.message, variant: "destructive" });
    } finally {
      setUploadingLogo(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const saveInfo = async () => {
    if (!data) return;
    if (!leaderName.trim()) {
      toast({ title: tText("الاسم مطلوب", "Name required"), variant: "destructive" });
      return;
    }
    setSavingInfo(true);
    const table = data.kind === "college" ? "college_registrations" : "institute_registrations";
    const payload: Record<string, unknown> = {
      phone: phone.trim(),
      city: city.trim(),
      address: address.trim() || null,
    };
    if (data.kind === "college") payload.dean_name = leaderName.trim();
    else payload.director_name = leaderName.trim();

    const { data: updated, error } = await supabase
      .from(table)
      .update(payload as never)
      .eq("id", data.id)
      .select("id");
    setSavingInfo(false);
    if (error) {
      console.error("[saveInfo] save error:", error);
      toast({
        title: tText("خطأ في الحفظ", "Save Error"),
        description: tText("لم يتم حفظ البيانات، يرجى المحاولة مرة أخرى.", "We couldn't save your changes. Please try again."),
        variant: "destructive",
      });
      return;
    }
    if (!updated || updated.length === 0) {
      toast({
        title: tText("لم يتم الحفظ", "Save failed"),
        description: tText("لم يتم حفظ البيانات — تحقق من صلاحياتك أو تواصل مع الدعم.", "Save failed — check your permissions or contact support."),
        variant: "destructive",
      });
      return;
    }
    setData((d) => d ? { ...d, leaderName: leaderName.trim(), phone: phone.trim(), city: city.trim(), address: address.trim() || null } : d);
    toast({ title: tText("تم حفظ التعديلات بنجاح", "Changes saved successfully") });
  };

  const savePassword = async () => {
    if (newPass.length < 8) {
      toast({ title: tText("8 أحرف على الأقل", "At least 8 characters"), variant: "destructive" });
      return;
    }
    if (newPass !== confirmPass) {
      toast({ title: tText("كلمتا المرور غير متطابقتين", "Passwords do not match"), variant: "destructive" });
      return;
    }
    setSavingPass(true);
    const { error } = await supabase.auth.updateUser({ password: newPass });
    setSavingPass(false);
    if (error) {
      toast({ title: tText("خطأ", "Error"), description: error.message, variant: "destructive" });
      return;
    }
    setNewPass("");
    setConfirmPass("");
    toast({ title: tText("تم تحديث كلمة المرور بنجاح", "Password updated successfully") });
  };

  const initials = (data?.name || "?").trim().charAt(0).toUpperCase();
  const leaderLabel = institutionType === "college"
    ? tText("اسم العميد", "Dean Name")
    : tText("اسم المدير", "Director Name");

  const planName = !data?.subscription_plan || data.subscription_plan === "free"
    ? tText("الخطة المجانية", "Free Plan")
    : data.subscription_plan === "monthly"
    ? tText("الخطة الشهرية", "Monthly Plan")
    : tText("الخطة السنوية", "Annual Plan");

  const headerNode = (
    <header className="border-b border-primary/20 px-3 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-primary/15 via-primary/10 to-transparent">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
          <div className="relative shrink-0">
            <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl overflow-hidden shadow-xl shadow-teal-500/25 p-0.5 bg-gradient-to-br from-teal-400 via-teal-600 to-indigo-600 flex items-center justify-center hover:scale-105 transition-transform">
              <img src={ugLogo} alt="UNIGATES" className="w-full h-full object-cover rounded-[14px]" />
            </div>
            <span className="absolute -top-1 -end-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500" />
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-xl font-black text-foreground truncate">
                {institutionType === "institute" ? tText("لوحة إدارة المعهد", "Institute Administration") : tText("لوحة إدارة الكلية", "College Administration")}
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                {planName}
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground font-bold truncate mt-0.5">
              {tText("بيانات الحساب", "Account Information")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <LanguageSelectorDropdown className="h-9 px-2.5 sm:px-3 text-xs bg-background/60 border-primary/20" />
          <ThemeToggle className="h-9 w-9 p-0 rounded-xl" />
          <DashboardMenuDropdown
            title={institutionType === "institute" ? tText("لوحة المعهد", "Institute Panel") : tText("لوحة الكلية", "College Panel")}
            onLanguageToggle={toggleLanguage}
            showNotifications={false}
            onLogout={async () => { await supabase.auth.signOut(); navigate("/university-platform"); }}
            items={getInstitutionMenuItems({
              isRtl,
              language,
              activeKey: "profile",
              onTabChange: (tab) => navigate(`/institution/dashboard?tab=${tab}`),
              onNavigate: (path) => navigate(path),
            })}
          />
        </div>
      </div>
    </header>
  );

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col institution-admin-scope transition-colors duration-300" dir={dir}>
        {headerNode}
        <div className="flex-1 flex flex-col items-center justify-center py-24 space-y-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-3xl bg-primary/15 flex items-center justify-center text-primary animate-pulse">
              <Landmark className="w-8 h-8 animate-bounce" />
            </div>
          </div>
          <p className="text-sm font-bold text-muted-foreground animate-pulse">
            {tText("جاري تحميل بيانات المؤسسة الأكاديمية...", "Loading institutional profile...")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col institution-admin-scope transition-colors duration-300" dir={dir}>
      {headerNode}

      <main className="max-w-5xl mx-auto px-3 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8 w-full flex-1">
        
        {/* ── 1. 3D Cover & Profile Hero Card ── */}
        <Card className="overflow-hidden border-2 border-border/80 bg-card rounded-3xl shadow-xl shadow-black/5 dark:shadow-black/20 relative">
          {/* Futuristic Glowing Ambient Mesh Cover Banner */}
          <div className="relative h-44 sm:h-56 bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-700 overflow-hidden">
            {/* Ambient geometric light orbs */}
            <div className="absolute -top-12 -right-12 w-64 h-64 bg-white/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 left-10 w-48 h-48 bg-cyan-300/25 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] opacity-15" />

            {/* Quick Badge at top right */}
            <div className="absolute top-4 end-4 z-10">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-slate-950/40 text-white border border-white/20 backdrop-blur-md shadow-lg">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{tText("مؤسسة معتمدة ونشطة", "Verified & Active Institution")}</span>
              </span>
            </div>
          </div>

          <CardContent className="relative px-5 sm:px-8 pb-7">
            {/* Logo Overlapping Cover Banner */}
            <div className="relative -mt-16 sm:-mt-20 flex flex-col sm:flex-row items-center sm:items-end gap-5 sm:gap-7">
              <div className="relative shrink-0 group">
                <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl bg-gradient-to-br from-card to-muted ring-4 ring-background shadow-2xl overflow-hidden flex items-center justify-center border-4 border-primary/30 p-1">
                  <div className="w-full h-full rounded-2xl overflow-hidden bg-muted/60 flex items-center justify-center">
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
                      <span className="text-4xl sm:text-5xl font-black text-primary drop-shadow-md">{initials}</span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploadingLogo}
                  className="absolute bottom-1 end-1 w-10 h-10 rounded-2xl bg-primary text-primary-foreground shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-200 disabled:opacity-60 ring-2 ring-background cursor-pointer"
                  title={tText("تغيير شعار المؤسسة", "Change institution logo")}
                  aria-label={tText("تغيير شعار المؤسسة", "Change institution logo")}
                >
                  {uploadingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
              </div>

              {/* Title & Metadata */}
              <div className="flex-1 text-center sm:text-start sm:pb-2 min-w-0">
                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight truncate">
                    {data.name}
                  </h2>
                  <BadgeCheck className="w-6 h-6 text-teal-500 shrink-0" />
                </div>

                <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3">
                  <Badge className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white gap-1.5 shadow-sm font-bold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {data.kind === "college" ? tText("إدارة كلية جامعية", "College Administration") : tText("إدارة معهد عالي", "Institute Administration")}
                  </Badge>

                  {data.university_name && (
                    <Badge variant="outline" className="gap-1.5 border-border font-bold">
                      <Landmark className="w-3.5 h-3.5 text-primary" />
                      <span>{data.university_name}</span>
                    </Badge>
                  )}

                  <Badge variant="outline" className="gap-1.5 border-border font-bold text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{tText("تاريخ الانضمام:", "Joined:")} {new Date(data.created_at).toLocaleDateString(isRtl ? "ar-EG" : "en-US")}</span>
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── 2. Quick HUD Stat Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <Card className="rounded-3xl border-2 border-border/80 bg-gradient-to-br from-card via-card/95 to-card shadow-md hover:border-blue-500/40 hover:shadow-xl transition-all duration-300">
            <CardContent className="p-4 sm:p-5 flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/25 shrink-0">
                <Users className="w-6 h-6" strokeWidth={2.4} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground font-black uppercase tracking-wider">{tText("الطلاب المسجلين", "Students")}</p>
                <p className="font-mono font-black text-2xl text-foreground truncate">{liveStudentCount}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-2 border-border/80 bg-gradient-to-br from-card via-card/95 to-card shadow-md hover:border-emerald-500/40 hover:shadow-xl transition-all duration-300">
            <CardContent className="p-4 sm:p-5 flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/25 shrink-0">
                <BookOpen className="w-6 h-6" strokeWidth={2.4} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground font-black uppercase tracking-wider">{tText("الأقسام الأكاديمية", "Departments")}</p>
                <p className="font-mono font-black text-2xl text-foreground truncate">{liveDeptCount}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-2 border-border/80 bg-gradient-to-br from-card via-card/95 to-card shadow-md hover:border-violet-500/40 hover:shadow-xl transition-all duration-300">
            <CardContent className="p-4 sm:p-5 flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white flex items-center justify-center shadow-md shadow-violet-500/25 shrink-0">
                <GraduationCap className="w-6 h-6" strokeWidth={2.4} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground font-black uppercase tracking-wider">{tText("هيئة التدريس", "Faculty")}</p>
                <p className="font-mono font-black text-2xl text-foreground truncate">{liveFacultyCount}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-2 border-border/80 bg-gradient-to-br from-card via-card/95 to-card shadow-md hover:border-amber-500/40 hover:shadow-xl transition-all duration-300">
            <CardContent className="p-4 sm:p-5 flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-md shadow-amber-500/25 shrink-0">
                <MapPin className="w-6 h-6" strokeWidth={2.4} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground font-black uppercase tracking-wider">{tText("المدينة والمقر", "Campus City")}</p>
                <p className="font-black text-lg text-foreground truncate">{data.city || tText("غير محدد", "Not specified")}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── 3. Subscription & Tier Banner ── */}
        <Card className="rounded-3xl border-2 border-teal-500/30 bg-gradient-to-br from-teal-500/10 via-emerald-500/5 to-transparent shadow-lg overflow-hidden">
          <CardContent className="p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 via-emerald-500 to-cyan-600 text-white flex items-center justify-center shadow-xl shadow-teal-500/25 shrink-0">
                <CreditCard className="w-7 h-7" strokeWidth={2.3} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-muted-foreground uppercase">{tText("خطة الاشتراك الحالية:", "Current Subscription:")}</span>
                  <Badge className="bg-teal-500/20 text-teal-700 dark:text-teal-300 border-teal-500/30 font-black text-xs">
                    {planName}
                  </Badge>
                </div>
                <h3 className="font-black text-lg text-foreground">
                  {data.subscription_plan === "annual"
                    ? tText("الباقة السنوية المعتمدة (خصم 33%)", "Approved Annual Plan (33% Discount)")
                    : data.subscription_plan === "monthly"
                    ? tText("الباقة الشهرية المعتمدة ($6 / طالب)", "Approved Monthly Plan ($6/Student)")
                    : tText("الخطة التجريبية المجانية (سعة 100 طالب)", "Free Tier Trial (100 Students Cap)")}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <Button
                asChild
                className="w-full md:w-auto h-11 px-6 rounded-2xl bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-black text-xs gap-2 shadow-lg shadow-teal-500/25 transition-all hover:scale-105"
              >
                <Link to="/institution/student-subscriptions">
                  <CreditCard className="w-4 h-4" />
                  <span>{tText("إدارة الاشتراكات والتجديد", "Manage Subscriptions & Billing")}</span>
                  {isRtl ? <ArrowLeft className="w-4 h-4 ms-1" /> : <ArrowRight className="w-4 h-4 ms-1" />}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── 4. Main Profile Tabs: Institutional Info & Security ── */}
        <Tabs defaultValue="general" className="w-full space-y-6" dir={dir}>
          <TabsList className="grid grid-cols-2 max-w-md mx-auto h-12 p-1.5 rounded-2xl bg-muted/60 border border-border/80 backdrop-blur-md">
            <TabsTrigger value="general" className="rounded-xl font-black text-xs sm:text-sm data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm">
              <Building2 className="w-4 h-4 me-2" />
              {tText("بيانات المؤسسة", "Institutional Info")}
            </TabsTrigger>
            <TabsTrigger value="security" className="rounded-xl font-black text-xs sm:text-sm data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm">
              <Lock className="w-4 h-4 me-2" />
              {tText("الأمان وكلمة المرور", "Security & Password")}
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: General Institutional Info */}
          <TabsContent value="general" className="space-y-6 animate-in fade-in-50 duration-200">
            <Card className="rounded-3xl border-2 border-border/80 bg-card shadow-lg">
              <CardHeader className="pb-4 border-b border-border/60">
                <CardTitle className="text-base sm:text-lg font-black flex items-center gap-2.5">
                  <span className="w-9 h-9 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5" />
                  </span>
                  {data.kind === "college"
                    ? tText("البيانات الرسمية للكلية الجامعية", "College Official Information")
                    : tText("البيانات الرسمية للمعهد الأكاديمي", "Institute Official Information")}
                </CardTitle>
                <CardDescription className="text-xs font-semibold">
                  {tText("يمكنك تحديث بيانات التواصل والمسؤول الأكاديمي والمقر الرسمي للمؤسسة", "Update contact details, leadership information, and campus location.")}
                </CardDescription>
              </CardHeader>

              <CardContent className="p-5 sm:p-7 space-y-6">
                <div className="grid sm:grid-cols-2 gap-5">
                  {/* Institution Name (Fixed) */}
                  <div className="space-y-2">
                    <Label htmlFor="instName" className="text-xs font-black text-foreground">
                      {data.kind === "college" ? tText("اسم الكلية الرسمي", "Official College Name") : tText("اسم المعهد الرسمي", "Official Institute Name")}
                    </Label>
                    <div className="relative">
                      <Landmark className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="instName" value={data.name} disabled className="ps-10 h-11 rounded-2xl bg-muted/60 border-border font-bold text-foreground" />
                    </div>
                    <p className="text-[11px] text-muted-foreground font-medium">{tText("اسم المؤسسة معتمد رسمياً — للتعديل يرجى مراسلة الدعم", "Officially registered — contact support to modify")}</p>
                  </div>

                  {/* Leader Name (Dean / Director) */}
                  <div className="space-y-2">
                    <Label htmlFor="leader" className="text-xs font-black text-foreground">
                      {leaderLabel}
                    </Label>
                    <div className="relative">
                      <User className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="leader"
                        value={leaderName}
                        onChange={(e) => setLeaderName(e.target.value)}
                        placeholder={tText("أدخل اسم المسؤول الأكاديمي", "Enter academic leader name")}
                        className="ps-10 h-11 rounded-2xl bg-card border-border/80 focus-visible:ring-primary/30 font-bold"
                      />
                    </div>
                  </div>

                  {/* Email (Fixed) */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs font-black text-foreground">
                      {tText("البريد الإلكتروني الرسمي", "Official Email")}
                    </Label>
                    <div className="relative">
                      <Mail className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="email" value={data.email} disabled className="ps-10 h-11 rounded-2xl bg-muted/60 border-border font-mono font-bold" dir="ltr" />
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-xs font-black text-foreground">
                      {tText("رقم هاتف التواصل", "Contact Phone")}
                    </Label>
                    <div className="relative">
                      <Phone className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder={tText("مثال: +201234567890", "e.g. +201234567890")}
                        className="ps-10 h-11 rounded-2xl bg-card border-border/80 focus-visible:ring-primary/30 font-mono font-bold"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  {/* City */}
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-xs font-black text-foreground">
                      {tText("المدينة / المحافظة", "City / Governorate")}
                    </Label>
                    <div className="relative">
                      <MapPin className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="city"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder={tText("أدخل المدينة", "Enter city")}
                        className="ps-10 h-11 rounded-2xl bg-card border-border/80 focus-visible:ring-primary/30 font-bold"
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-xs font-black text-foreground">
                      {tText("العنوان والمقر التفصيلي", "Detailed Campus Address")}
                    </Label>
                    <Input
                      id="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder={tText("مقر الكلية / الحرم الجامعي", "Campus address")}
                      className="h-11 rounded-2xl bg-card border-border/80 focus-visible:ring-primary/30 font-bold"
                    />
                  </div>

                  {/* University Name (Optional) */}
                  {data.kind === "college" && data.university_name && (
                    <div className="space-y-2 sm:col-span-2">
                      <Label className="text-xs font-black text-foreground">{tText("الجامعة التابعة لها الكلية", "Affiliated University")}</Label>
                      <Input value={data.university_name} disabled className="h-11 rounded-2xl bg-muted/60 border-border font-bold" />
                    </div>
                  )}

                  {/* Specialization (Optional) */}
                  {data.kind === "institute" && data.specialization && (
                    <div className="space-y-2 sm:col-span-2">
                      <Label className="text-xs font-black text-foreground">{tText("التخصص الأكاديمي للمعهد", "Academic Specialization")}</Label>
                      <Input value={data.specialization} disabled className="h-11 rounded-2xl bg-muted/60 border-border font-bold" />
                    </div>
                  )}
                </div>

                <Separator className="border-border/60" />

                <div className="flex items-center justify-end">
                  <Button
                    onClick={saveInfo}
                    disabled={savingInfo}
                    className="h-11 px-7 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-black text-xs gap-2 shadow-lg shadow-teal-500/25 transition-all hover:scale-105"
                  >
                    {savingInfo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>{tText("حفظ التغييرات", "Save Changes")}</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: Security & Password */}
          <TabsContent value="security" className="space-y-6 animate-in fade-in-50 duration-200">
            <Card className="rounded-3xl border-2 border-border/80 bg-card shadow-lg">
              <CardHeader className="pb-4 border-b border-border/60">
                <CardTitle className="text-base sm:text-lg font-black flex items-center gap-2.5">
                  <span className="w-9 h-9 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                    <KeyRound className="w-5 h-5" />
                  </span>
                  {tText("تغيير كلمة المرور وأمان الحساب", "Change Password & Account Security")}
                </CardTitle>
                <CardDescription className="text-xs font-semibold">
                  {tText("احرص على استخدام كلمة مرور قوية تحتوي على 8 أحرف وأرقام ورموز", "Ensure your account has a strong password with at least 8 characters.")}
                </CardDescription>
              </CardHeader>

              <CardContent className="p-5 sm:p-7 space-y-6">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="newPass" className="text-xs font-black text-foreground">
                      {tText("كلمة المرور الجديدة", "New Password")}
                    </Label>
                    <div className="relative">
                      <Input
                        id="newPass"
                        type={showPass ? "text" : "password"}
                        value={newPass}
                        onChange={(e) => setNewPass(e.target.value)}
                        placeholder="••••••••"
                        dir="ltr"
                        className="pe-11 h-11 rounded-2xl bg-card border-border/80 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-1"
                        aria-label="toggle password"
                      >
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPass" className="text-xs font-black text-foreground">
                      {tText("تأكيد كلمة المرور", "Confirm Password")}
                    </Label>
                    <Input
                      id="confirmPass"
                      type={showPass ? "text" : "password"}
                      value={confirmPass}
                      onChange={(e) => setConfirmPass(e.target.value)}
                      placeholder="••••••••"
                      dir="ltr"
                      className="h-11 rounded-2xl bg-card border-border/80 font-mono"
                    />
                  </div>
                </div>

                {/* Password strength checklist */}
                <div className="p-4 rounded-2xl bg-muted/40 border border-border/70 space-y-2 text-xs font-bold text-muted-foreground">
                  <p className="text-foreground font-black">{tText("إرشادات أمان كلمة المرور:", "Password Security Guidelines:")}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className={`w-3.5 h-3.5 ${newPass.length >= 8 ? "text-emerald-500" : "text-muted-foreground/50"}`} />
                      {tText("8 أحرف على الأقل", "At least 8 characters")}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className={`w-3.5 h-3.5 ${newPass && newPass === confirmPass ? "text-emerald-500" : "text-muted-foreground/50"}`} />
                      {tText("تطابق كلمتي المرور", "Passwords match")}
                    </span>
                  </div>
                </div>

                <Separator className="border-border/60" />

                <div className="flex items-center justify-end">
                  <Button
                    onClick={savePassword}
                    disabled={savingPass || !newPass}
                    className="h-11 px-7 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-black text-xs gap-2 shadow-lg shadow-teal-500/25 transition-all hover:scale-105"
                  >
                    {savingPass ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                    <span>{tText("تحديث كلمة المرور", "Update Password")}</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default InstitutionProfile;
