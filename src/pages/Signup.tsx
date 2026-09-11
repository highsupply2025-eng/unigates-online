import { useState, useRef, useEffect } from "react";
import { Link, useParams, useSearchParams, useNavigate } from "react-router-dom";
import { GraduationCap, ChevronLeft, ChevronRight, Loader2, ArrowRight, ArrowLeft, Upload, Camera, X, Globe, Phone, User, BookOpenCheck, Building2, Landmark, Ticket, Eye, EyeOff, Menu, LogIn, School, BookOpen, Sparkles, CheckCircle2, ArrowUpRight, ShieldCheck } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSmartBack } from "@/hooks/use-smart-back";
import { getAuthCallbackUrl } from "@/lib/auth-redirect";
import LanguageSelectorDropdown from "@/components/LanguageSelectorDropdown";
import { ThemeToggle } from "@/components/ThemeToggle";
import ugLogo from "@/assets/ug-logo.png";

const countryCodes = [
  { code: "+20", country: "🇪🇬", name: "Egypt" },
  { code: "+966", country: "🇸🇦", name: "Saudi Arabia" },
  { code: "+971", country: "🇦🇪", name: "UAE" },
  { code: "+965", country: "🇰🇼", name: "Kuwait" },
  { code: "+974", country: "🇶🇦", name: "Qatar" },
  { code: "+973", country: "🇧🇭", name: "Bahrain" },
  { code: "+968", country: "🇴🇲", name: "Oman" },
  { code: "+962", country: "🇯🇴", name: "Jordan" },
  { code: "+961", country: "🇱🇧", name: "Lebanon" },
  { code: "+964", country: "🇮🇶", name: "Iraq" },
  { code: "+212", country: "🇲🇦", name: "Morocco" },
  { code: "+216", country: "🇹🇳", name: "Tunisia" },
  { code: "+213", country: "🇩🇿", name: "Algeria" },
  { code: "+218", country: "🇱🇾", name: "Libya" },
  { code: "+249", country: "🇸🇩", name: "Sudan" },
  { code: "+967", country: "🇾🇪", name: "Yemen" },
  { code: "+963", country: "🇸🇾", name: "Syria" },
  { code: "+970", country: "🇵🇸", name: "Palestine" },
  { code: "+1", country: "🇺🇸", name: "USA" },
  { code: "+44", country: "🇬🇧", name: "UK" },
  { code: "+33", country: "🇫🇷", name: "France" },
  { code: "+49", country: "🇩🇪", name: "Germany" },
  { code: "+90", country: "🇹🇷", name: "Turkey" },
];

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

const courseRoles = [
  { value: "personal" as const, labelAr: "طالب", labelEn: "Student", icon: User },
  { value: "lecturer" as const, labelAr: "محاضر", labelEn: "Lecturer", icon: BookOpenCheck },
];

const registrationGateways = [
  {
    id: "college",
    labelAr: "إدارة كلية جامعية",
    labelEn: "University College Admin",
    badgeAr: "التعليم الجامعي",
    badgeEn: "Higher Education",
    descAr: "تسجيل حساب الكلية وتفعيل الصلاحيات للعميد والوكلاء ورؤساء الأقسام",
    descEn: "Register college administration (Dean, Vice Deans, Department Heads)",
    icon: Landmark,
    href: "/signup/college/admin",
    gradient: "from-blue-600 via-indigo-600 to-indigo-700",
    shadow: "shadow-blue-500/25",
    borderHover: "hover:border-blue-500/60 hover:shadow-blue-500/20",
    lightBg: "bg-blue-50/50 dark:bg-blue-950/20",
  },
  {
    id: "institute",
    labelAr: "إدارة معهد عالي",
    labelEn: "Higher Institute Admin",
    badgeAr: "المعاهد الأكاديمية",
    badgeEn: "Academic Institutes",
    descAr: "تسجيل المعهد العالي مع إدارة متكاملة للمدير والوكلاء والشعب العلمية",
    descEn: "Register higher institute leadership and academic departments",
    icon: Building2,
    href: "/signup/institute/admin",
    gradient: "from-teal-500 via-teal-600 to-emerald-700",
    shadow: "shadow-teal-500/25",
    borderHover: "hover:border-teal-500/60 hover:shadow-teal-500/20",
    lightBg: "bg-teal-50/50 dark:bg-teal-950/20",
  },
];

const Signup = () => {
  const navigate = useNavigate();
  const goBack = useSmartBack();
  const { role: roleParam } = useParams<{ role: string }>();
  const [searchParams] = useSearchParams();
  const deptInviteFromUrl = searchParams.get("dept_invite") || "";
  const roleFromUrl = searchParams.get("role") || "";
  const collegeInviteFromUrl = searchParams.get("invite") || "";

  // Redirect dept_invite links to the correct institution signup page
  useEffect(() => {
    const code = deptInviteFromUrl || collegeInviteFromUrl;
    const role = roleFromUrl;
    if (code && role) {
      // Use SECURITY DEFINER RPC to avoid exposing invitation tables
      const checkInstitution = async () => {
        const { data: instRows } = await supabase.rpc("verify_institution_invitation" as any, { _code: code });
        const inst = Array.isArray(instRows) && instRows.length > 0 ? (instRows[0] as any) : null;
        if (inst?.kind === "college") {
          navigate(`/signup/college/${role}?code=${code}`, { replace: true });
          return;
        }
        if (inst?.kind === "institute") {
          navigate(`/signup/institute/${role}?code=${code}`, { replace: true });
          return;
        }
        // Check department_members for dept_invite codes (via secure RPC)
        if (deptInviteFromUrl) {
          const { data: memberRows } = await supabase.rpc("verify_department_invitation" as any, { _code: code });
          const memberData = Array.isArray(memberRows) && memberRows.length > 0 ? (memberRows[0] as any) : null;
          if (memberData?.department_id) {
            const { data: deptData } = await supabase
              .from("departments" as any)
              .select("institution_type")
              .eq("id", memberData.department_id)
              .maybeSingle();
            if (deptData) {
              const instPath = (deptData as any).institution_type === "institute" ? "institute" : "college";
              navigate(`/signup/${instPath}/${role}?code=${code}`, { replace: true });
              return;
            }
          }
        }
      };
      checkInstitution();
    }
  }, []);
  
  const [selectedRole, setSelectedRole] = useState<"personal" | "lecturer" | null>(
    roleParam === "lecturer" || roleFromUrl === "lecturer" ? "lecturer" : roleParam ? "personal" : roleFromUrl === "student" ? "personal" : null
  );
  const role = selectedRole || "personal";
  const isLecturer = role === "lecturer";

  const { t, dir, language, toggleLanguage } = useLanguage();
  const isRtl = dir === "rtl";
  const ArrowIcon = language === "ar" ? ChevronLeft : ChevronRight;

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [countryCode, setCountryCode] = useState("+20");

  const [idPhoto, setIdPhoto] = useState<File | null>(null);
  const [idPhotoPreview, setIdPhotoPreview] = useState<string | null>(null);

  const [uniCert, setUniCert] = useState<File | null>(null);
  const [uniCertPreview, setUniCertPreview] = useState<string | null>(null);

  const [additionalCerts, setAdditionalCerts] = useState<File[]>([]);
  const [additionalCertPreviews, setAdditionalCertPreviews] = useState<string[]>([]);

  const [livePhoto, setLivePhoto] = useState<File | null>(null);
  const [livePhotoPreview, setLivePhotoPreview] = useState<string | null>(null);
  const livePhotoRef = useRef<HTMLInputElement>(null);

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [invitationCode, setInvitationCode] = useState(deptInviteFromUrl || collegeInviteFromUrl);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: (f: File | null) => void,
    setPreview: (s: string | null) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleMultiFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAdditionalCerts((prev) => [...prev, ...files]);
    setAdditionalCertPreviews((prev) => [
      ...prev,
      ...files.map((f) => URL.createObjectURL(f)),
    ]);
  };

  const removeAdditionalCert = (index: number) => {
    setAdditionalCerts((prev) => prev.filter((_, i) => i !== index));
    setAdditionalCertPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadFile = async (file: File, userId: string, folder: string): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("user_id", userId);
    formData.append("folder", folder);

    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token;
    if (!accessToken) throw new Error("Not authenticated");

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/signup-upload`,
      {
        method: "POST",
        headers: {
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      }
    );
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Upload failed");
    return result.path;
  };

  const handleSubmit = async () => {
    const baseFieldsMissing = !selectedRole || !fullName || !email || !password || !phone;
    if (baseFieldsMissing) {
      toast({ title: t.signupPage.errorGeneric, description: t.signupPage.errorFillFields, variant: "destructive" });
      return;
    }
    if (!PASSWORD_REGEX.test(password)) {
      toast({ title: t.signupPage.errorGeneric, description: t.signupPage.passwordWeak, variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: t.signupPage.errorGeneric, description: t.signupPage.passwordMismatch, variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: getAuthCallbackUrl() },
      });
      if (authError) throw authError;
      const userId = authData.user?.id;
      if (!userId) throw new Error(t.signupPage.errorNoUser);

      let idPhotoUrl: string | undefined;
      let uniCertUrl: string | undefined;
      const additionalCertUrls: string[] = [];
      let livePhotoUrl: string | undefined;

      if (idPhoto) idPhotoUrl = await uploadFile(idPhoto, userId, "id-photo");
      if (uniCert) uniCertUrl = await uploadFile(uniCert, userId, "uni-cert");
      if (livePhoto) livePhotoUrl = await uploadFile(livePhoto, userId, "live-photo");
      for (const cert of additionalCerts) {
        additionalCertUrls.push(await uploadFile(cert, userId, "additional-certs"));
      }

      // Use RPC to create profile & role (works without session)
      const { data: rpcResult, error: rpcError } = await supabase.rpc('complete_signup', {
        p_user_id: userId,
        p_role: role,
        p_full_name: fullName,
        p_phone: `${countryCode}${phone}`,
        p_email: email,
        p_platform: 'courses',
        p_id_photo_url: idPhotoUrl || null,
        p_university_cert_url: uniCertUrl || null,
        p_additional_certs_urls: additionalCertUrls,
        p_live_photo_url: livePhotoUrl || null,
      });
      if (rpcError) throw rpcError;
      const result = rpcResult as any;
      if (result && !result.success) throw new Error(result.error);

      // Link user to department member if invitation code exists
      if (invitationCode && userId) {
        // Try department invitation code via secure RPC
        const { data: claimResult } = await supabase.rpc("claim_department_invitation" as any, {
          _code: invitationCode,
          _user_id: userId,
        });
        const claimed = claimResult && (claimResult as any).success;

        if (!claimed) {
          // Try college invitation code via secure RPC
          const { data: verifyResult } = await supabase.rpc("verify_invitation_code" as any, { p_code: invitationCode });
          
          if (verifyResult && (verifyResult as any).valid) {
            const result = verifyResult as any;
            await supabase.from("college_members").insert({
              college_id: result.college_id,
              user_id: userId,
              role: result.role,
              invitation_id: result.invitation_id,
            });
          }
        }
      }

      setSubmitted(true);
    } catch (error: any) {
      console.error('Signup failed:', error);
      toast({ title: t.signupPage.errorGeneric, description: language === "ar" ? "حدث خطأ غير متوقع. حاول مرة أخرى." : "An unexpected error occurred. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const pageTitle = isLecturer ? t.signupChoice.lecturerTitle : (language === "ar" ? "حساب شخصي" : "Personal Account");

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col institution-admin-scope transition-colors duration-300" dir={dir}>
      {/* Unified UNIGATES Header */}
      <header className="border-b border-primary/20 px-3 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-primary/15 via-primary/10 to-transparent sticky top-0 z-50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1 group">
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
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <span className="text-lg sm:text-2xl font-black tracking-tight text-foreground">
                  UNIGATES
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                  {language === "ar" ? "بوابة التسجيل الموحدة" : "Registration Gateway"}
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground font-bold truncate mt-0.5">
                {language === "ar" ? "المنظومة التعليمية الرقمية الموحدة — دار عبيد" : "Unified Digital Educational Platform — Dar Obeid"}
              </p>
            </div>
          </Link>

          {/* Action Hub */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <Link to="/login">
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-3.5 rounded-xl font-bold text-xs bg-background/80 hover:bg-muted border-border text-foreground shadow-xs gap-1.5 transition-all"
              >
                <LogIn className="w-3.5 h-3.5 text-primary" />
                <span className="hidden sm:inline">{t.login}</span>
              </Button>
            </Link>
            <LanguageSelectorDropdown className="h-9 px-2.5 sm:px-3 text-xs bg-background/60 border-primary/20" />
            <ThemeToggle className="h-9 w-9 p-0 rounded-xl" />
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-3 sm:px-6 py-6 sm:py-10 md:py-12">
        {!selectedRole ? (
          /* Step 1: Role Selection Cards */
          <div className="max-w-4xl w-full">
            {/* Hero Badge & Title */}
            <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold mb-3 shadow-xs">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{language === "ar" ? "المنظومة الجامعية والأكاديمية" : "University & Higher Education"}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-foreground tracking-tight mb-2.5">
                {language === "ar" ? "تسجيل إدارة مؤسسة أكاديمية" : "Register Academic Institution"}
              </h1>
              <p className="text-xs sm:text-sm md:text-base text-muted-foreground font-medium max-w-lg mx-auto leading-relaxed">
                {language === "ar"
                  ? "اختر نوع المؤسسة الأكاديمية (كلية جامعية أو معهد عالي) لإنشاء حساب الإدارة وتفعيل المنظومة"
                  : "Select your higher education institution type (College or Institute) to create leadership administration account"}
              </p>
            </div>

            {/* Grid of Registration Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-3xl mx-auto">
              {registrationGateways.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.id}
                    to={item.href}
                    className={`group relative flex flex-col justify-between p-5 sm:p-6 rounded-3xl border-2 border-border/80 bg-card hover:bg-card/90 shadow-md ${item.borderHover} transition-all duration-300 overflow-hidden hover:-translate-y-1`}
                  >
                    <div className="space-y-4">
                      {/* Top Row: Icon + Badge */}
                      <div className="flex items-center justify-between gap-2">
                        <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br ${item.gradient} ${item.shadow} flex items-center justify-center text-white shadow-lg group-hover:scale-110 group-hover:rotate-1 transition-transform duration-300`}>
                          <Icon className="w-6 h-6 sm:w-7 sm:h-7" />
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-muted text-muted-foreground border border-border/60">
                          {language === "ar" ? item.badgeAr : item.badgeEn}
                        </span>
                      </div>

                      {/* Title & Description */}
                      <div>
                        <h2 className="text-base sm:text-lg font-black text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                          <span>{language === "ar" ? item.labelAr : item.labelEn}</span>
                          <ArrowUpRight className="w-4 h-4 opacity-0 -translate-x-1 translate-y-1 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 transition-all text-primary" />
                        </h2>
                        <p className="text-xs text-muted-foreground font-medium mt-1.5 leading-relaxed line-clamp-2">
                          {language === "ar" ? item.descAr : item.descEn}
                        </p>
                      </div>
                    </div>

                    {/* Bottom Action Hint */}
                    <div className="mt-5 pt-3.5 border-t border-border/60 flex items-center justify-between text-xs font-bold text-primary">
                      <span>{language === "ar" ? "ابدأ التسجيل" : "Start Registration"}</span>
                      {isRtl ? <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> : <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Academic Students & Faculty Direct Invite Banner */}
            <div className="mt-6 sm:mt-8 p-5 sm:p-6 rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3.5 min-w-0 text-center sm:text-start">
                <div className="w-11 h-11 rounded-2xl bg-primary/20 text-primary flex items-center justify-center shrink-0">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-foreground">
                    {language === "ar" ? "هل أنت طالب أو عضو هيئة تدريس في كلية أو معهد؟" : "Student or Faculty Member in College or Institute?"}
                  </h3>
                  <p className="text-xs text-muted-foreground font-medium mt-0.5">
                    {language === "ar"
                      ? "يمكنك تسجيل الدخول مباشرة، أو استخدام رابط الدعوة المباشر المقدم من إدارتك الأكاديمية"
                      : "Sign in directly or use the invitation link provided by your academic administration"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                <Link to="/login" className="w-full sm:w-auto">
                  <Button size="sm" className="w-full sm:w-auto h-10 px-5 rounded-xl font-bold text-xs bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90">
                    <LogIn className="w-3.5 h-3.5 ml-1.5" />
                    <span>{t.login}</span>
                  </Button>
                </Link>
              </div>
            </div>

            {/* Already have an account footer */}
            <div className="mt-8 text-center">
              <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                {language === "ar" ? "لديك حساب بالفعل على منصة UNIGATES؟" : "Already registered on UNIGATES?"}{" "}
                <Link to="/login" className="text-primary font-black hover:underline inline-flex items-center gap-1">
                  <span>{t.login}</span>
                </Link>
              </p>
            </div>
          </div>
        ) : !submitted ? (
          <div className="max-w-2xl w-full">
            <div className="text-center mb-8">
              <button onClick={() => setSelectedRole(null)} className="text-sm text-primary hover:text-primary/80 font-semibold mb-4 inline-flex items-center gap-1 transition-colors">
                {language === "ar" ? "تغيير نوع الحساب ←" : "→ Change account type"}
              </button>
              <h1 className="text-2xl md:text-3xl font-black bg-gradient-to-l from-foreground to-primary bg-clip-text text-transparent mb-2">
                {t.signupPage.title} — {pageTitle}
              </h1>
              <p className="text-muted-foreground">{t.signupPage.subtitle}</p>
            </div>

            <div className="space-y-6">
              {/* Personal Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fullName" className="mb-2 block font-bold text-foreground">{t.signupPage.fullName} <span className="text-destructive">{t.signupPage.required}</span></Label>
                  <Input id="fullName" placeholder={t.signupPage.fullNamePlaceholder} value={fullName} onChange={(e) => setFullName(e.target.value)} className="h-12 rounded-xl border-2 border-primary/10 focus:border-primary/40 bg-white shadow-sm transition-all duration-300" />
                </div>
                <div>
                  <Label htmlFor="phone" className="mb-2 block font-bold text-foreground">{t.signupPage.phone} <span className="text-destructive">{t.signupPage.required}</span></Label>
                  <div className="flex gap-2" dir="ltr">
                    <Select value={countryCode} onValueChange={setCountryCode}>
                      <SelectTrigger className="h-12 w-[130px] shrink-0 rounded-xl border-2 border-primary/10 focus:border-primary/40 bg-white shadow-sm transition-all duration-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {countryCodes.map((c) => (
                          <SelectItem key={c.code} value={c.code}>
                            {c.country} {c.code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input id="phone" type="tel" placeholder={t.signupPage.phonePlaceholder} value={phone} onChange={(e) => setPhone(e.target.value)} className="h-12 flex-1 rounded-xl border-2 border-primary/10 focus:border-primary/40 bg-white shadow-sm transition-all duration-300" dir="ltr" />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="email" className="mb-2 block font-bold text-foreground">{t.signupPage.email} <span className="text-destructive">{t.signupPage.required}</span></Label>
                <Input id="email" type="email" placeholder={t.signupPage.emailPlaceholder} value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 rounded-xl border-2 border-primary/10 focus:border-primary/40 bg-white shadow-sm transition-all duration-300" dir="ltr" />
              </div>

              {/* Free account notice for both */}
              <div className="rounded-2xl border-2 border-primary/10 bg-gradient-to-r from-primary/5 to-transparent p-4 text-center">
                <p className="text-sm font-bold text-primary">
                  🎓 {language === "ar" 
                    ? (isLecturer 
                      ? "التسجيل مجاني — حسابك يخضع لمراجعة المنصة قبل التفعيل" 
                      : "حساب الطالب مجاني بالكامل — سجّل الآن واستفد من جميع الدورات!")
                    : (isLecturer 
                      ? "Registration is free — Your account requires platform review before activation" 
                      : "Student account is completely free — Sign up now and access all courses!")}
                </p>
                {isLecturer && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {language === "ar" 
                      ? "يتم خصم 30% من سعر كل دورة لصالح المنصة عند اشتراك الطلاب" 
                      : "30% platform commission is deducted from each course subscription"}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="password" className="mb-2 block font-bold text-foreground">{t.signupPage.password} <span className="text-destructive">{t.signupPage.required}</span></Label>
                  <div className="relative">
                    <Input id="password" type={showPassword ? "text" : "password"} placeholder={t.signupPage.passwordPlaceholder} value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 pe-10 rounded-xl border-2 border-primary/10 focus:border-primary/40 bg-white shadow-sm transition-all duration-300" dir="ltr" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">{t.signupPage.passwordRules}</p>
                </div>
                <div>
                  <Label htmlFor="confirmPassword" className="mb-2 block font-bold text-foreground">{t.signupPage.confirmPassword} <span className="text-destructive">{t.signupPage.required}</span></Label>
                  <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder={t.signupPage.confirmPasswordPlaceholder} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="h-12 rounded-xl border-2 border-primary/10 focus:border-primary/40 bg-white shadow-sm transition-all duration-300" dir="ltr" />
                  <div className="flex items-center justify-between mt-1.5">
                    {confirmPassword && password !== confirmPassword ? (
                      <p className="text-xs text-destructive">{t.signupPage.passwordMismatch}</p>
                    ) : <span />}
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
                      {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      {showConfirmPassword ? (language === "ar" ? "إخفاء" : "Hide") : (language === "ar" ? "إظهار" : "Show")}
                    </button>
                  </div>
                </div>
              </div>

              <Separator className="bg-primary/10" />

              {/* File Uploads */}
              <div className="space-y-5">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Upload className="w-4 h-4 text-primary" />
                  </div>
                  {t.signupPage.documentsTitle}
                </h3>

                {/* ID Photo */}
                <div>
                  <Label className="mb-2 block font-semibold text-foreground">{t.signupPage.idPhoto}</Label>
                  <div className="relative">
                    {idPhotoPreview ? (
                      <div className="relative w-full h-40 rounded-2xl overflow-hidden border-2 border-primary/10 shadow-md">
                        <img src={idPhotoPreview} alt={t.signupPage.idPhoto} className="w-full h-full object-cover" />
                        <button type="button" aria-label={language === "ar" ? "حذف صورة الهوية" : "Remove ID photo"} onClick={() => { setIdPhoto(null); setIdPhotoPreview(null); }} className="absolute top-2 left-2 w-8 h-8 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center h-32 rounded-2xl border-2 border-dashed border-primary/20 bg-gradient-to-br from-primary/5 to-transparent cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all duration-300">
                        <Upload className="w-8 h-8 text-primary/40 mb-2" />
                        <span className="text-sm text-muted-foreground font-medium">{t.signupPage.idPhotoUpload}</span>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e, setIdPhoto, setIdPhotoPreview)} />
                      </label>
                    )}
                  </div>
                </div>

                {/* University Certificate - Lecturer only */}
                {isLecturer && (
                  <div>
                    <Label className="mb-2 block font-semibold text-foreground">{t.signupPage.uniCert}</Label>
                    <div className="relative">
                      {uniCertPreview ? (
                        <div className="relative w-full h-40 rounded-2xl overflow-hidden border-2 border-primary/10 shadow-md">
                          <img src={uniCertPreview} alt={t.signupPage.uniCert} className="w-full h-full object-cover" />
                          <button type="button" aria-label={language === "ar" ? "حذف الشهادة الجامعية" : "Remove university certificate"} onClick={() => { setUniCert(null); setUniCertPreview(null); }} className="absolute top-2 left-2 w-8 h-8 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center h-32 rounded-2xl border-2 border-dashed border-primary/20 bg-gradient-to-br from-primary/5 to-transparent cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all duration-300">
                          <Upload className="w-8 h-8 text-primary/40 mb-2" />
                          <span className="text-sm text-muted-foreground font-medium">{t.signupPage.uniCertUpload}</span>
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e, setUniCert, setUniCertPreview)} />
                        </label>
                      )}
                    </div>
                  </div>
                )}

                {/* Additional Certificates - Lecturer only */}
                {isLecturer && (
                  <div>
                    <Label className="mb-2 block font-semibold text-foreground">{t.signupPage.additionalCerts}</Label>
                    {additionalCertPreviews.length > 0 && (
                      <div className="grid grid-cols-3 gap-3 mb-3">
                        {additionalCertPreviews.map((preview, i) => (
                          <div key={i} className="relative h-28 rounded-xl overflow-hidden border-2 border-primary/10 shadow-md">
                            <img src={preview} alt={`${t.signupPage.additionalCerts} ${i + 1}`} className="w-full h-full object-cover" />
                            <button type="button" aria-label={language === "ar" ? `حذف الشهادة الإضافية ${i + 1}` : `Remove additional certificate ${i + 1}`} onClick={() => removeAdditionalCert(i)} className="absolute top-1 left-1 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <label className="flex flex-col items-center justify-center h-24 rounded-2xl border-2 border-dashed border-primary/20 bg-gradient-to-br from-primary/5 to-transparent cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all duration-300">
                      <Upload className="w-6 h-6 text-primary/40 mb-1" />
                      <span className="text-sm text-muted-foreground font-medium">{t.signupPage.additionalCertsUpload}</span>
                      <input type="file" accept="image/*" multiple className="hidden" onChange={handleMultiFileSelect} />
                    </label>
                  </div>
                )}

                {/* Live Photo */}
                <div>
                  <Label className="mb-2 block font-semibold text-foreground">{t.signupPage.livePhoto}</Label>
                  <div className="relative">
                    {livePhotoPreview ? (
                      <div className="relative w-40 h-40 rounded-full overflow-hidden border-4 border-primary/30 mx-auto shadow-xl">
                        <img src={livePhotoPreview} alt={t.signupPage.livePhoto} className="w-full h-full object-cover" />
                        <button type="button" aria-label={language === "ar" ? "حذف الصورة الشخصية" : "Remove live photo"} onClick={() => { setLivePhoto(null); setLivePhotoPreview(null); }} className="absolute top-1 left-1 w-8 h-8 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center h-40 w-40 mx-auto rounded-full border-2 border-dashed border-primary/20 bg-gradient-to-br from-primary/5 to-transparent cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all duration-300">
                        <Camera className="w-10 h-10 text-primary/40 mb-2" />
                        <span className="text-xs text-muted-foreground font-medium text-center px-2">{t.signupPage.livePhotoCapture}</span>
                        <input ref={livePhotoRef} type="file" accept="image/*" capture="user" className="hidden" onChange={(e) => handleFileSelect(e, setLivePhoto, setLivePhotoPreview)} />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              <Separator className="bg-primary/10" />

              {/* Submit */}
              <Button
                size="lg"
                className="w-full h-13 sm:h-14 text-base sm:text-lg font-bold gap-2 rounded-2xl bg-gradient-to-r from-primary via-primary to-[hsl(180,60%,35%)] hover:from-primary/90 hover:via-primary/90 hover:to-[hsl(180,60%,30%)] shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 hover:scale-[1.02] transition-all duration-300"
                disabled={!fullName || !email || !password || !confirmPassword || password !== confirmPassword || !phone || loading}
                onClick={handleSubmit}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowIcon className="w-5 h-5" />}
                {t.signupPage.createAccount}
              </Button>
            </div>
          </div>
        ) : (
          <div className="max-w-lg w-full text-center">
            <div className="mb-8 flex justify-center">
              <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-primary via-primary to-[hsl(180,60%,35%)] flex items-center justify-center shadow-2xl shadow-primary/30 animate-bounce-subtle">
                <GraduationCap className="w-14 h-14 text-white" />
              </div>
            </div>
            <h1 className="text-2xl md:text-3xl font-black bg-gradient-to-l from-foreground to-primary bg-clip-text text-transparent mb-4">{t.signupPage.checkEmail}</h1>
            <p className="text-muted-foreground mb-10 leading-relaxed max-w-md mx-auto text-sm sm:text-base">
              {t.signupPage.checkEmailDesc}{" "}
              <span className="font-bold text-primary">{email}</span>.
              {" "}{t.signupPage.checkEmailAction}
            </p>
            <Link to="/login">
              <Button size="lg" className="h-14 text-lg font-bold px-10 rounded-2xl bg-gradient-to-r from-primary via-primary to-[hsl(180,60%,35%)] hover:from-primary/90 hover:via-primary/90 hover:to-[hsl(180,60%,30%)] shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 hover:scale-105 transition-all duration-300">
                {t.signupPage.goToLogin}
              </Button>
            </Link>
          </div>
        )}
      </main>

      <footer className="border-t border-border/80 bg-card/60 backdrop-blur-md px-4 sm:px-6 py-6 sm:py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-5 flex-wrap justify-center">
            <span className="text-foreground font-bold text-sm">{language === "ar" ? "أسئلة؟ تواصل على" : "Questions? Contact us on"}</span>
            <a href="https://wa.me/966563057356" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-gradient-to-r from-[#25D366] to-[#1ebe5a] hover:from-[#1ebe5a] hover:to-[#128c46] text-white font-bold px-5 py-2.5 rounded-2xl shadow-lg shadow-[#25D366]/25 hover:shadow-xl hover:shadow-[#25D366]/35 hover:scale-105 transition-all duration-300 text-sm">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              WhatsApp
            </a>
            <span className="text-primary font-bold text-sm flex items-center gap-1">⚡ {language === "ar" ? "استجابة فورية" : "Instant response"}</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <Link to="/faq" className="text-primary font-bold hover:text-primary/80 py-1 transition-colors relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-primary/30 hover:after:w-full after:transition-all after:duration-300">{t.footerLinks.faq}</Link>
            <Link to="/help-center" className="text-primary font-bold hover:text-primary/80 py-1 transition-colors relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-primary/30 hover:after:w-full after:transition-all after:duration-300">{t.footerLinks.helpCenter}</Link>
            <Link to="/terms" className="text-primary font-bold hover:text-primary/80 py-1 transition-colors relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-primary/30 hover:after:w-full after:transition-all after:duration-300">{t.footerLinks.usageTerms}</Link>
            <Link to="/privacy" className="text-primary font-bold hover:text-primary/80 py-1 transition-colors relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-primary/30 hover:after:w-full after:transition-all after:duration-300">{t.footerLinks.privacy}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Signup;
