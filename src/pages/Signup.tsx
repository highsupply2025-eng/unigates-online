import { useState, useRef, useEffect } from "react";
import { Link, useParams, useSearchParams, useNavigate } from "react-router-dom";
import { GraduationCap, ChevronLeft, ChevronRight, Loader2, ArrowRight, ArrowLeft, Upload, Camera, X, Globe, Phone, User, BookOpenCheck, Building2, Landmark, Ticket, Eye, EyeOff, Menu, LogIn } from "lucide-react";
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

const additionalLinks = [
  { labelAr: "كلية", labelEn: "College", icon: Landmark, href: "/signup/college/admin" },
  { labelAr: "معهد", labelEn: "Institute", icon: Landmark, href: "/signup/institute/admin" },
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col" dir={dir}>
      <header className="border-b border-primary/10 px-4 sm:px-6 py-3 bg-white/80 backdrop-blur-xl shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/university-platform" className="flex items-center gap-2 sm:gap-3 group">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-primary via-primary to-[hsl(180,60%,35%)] shadow-lg shadow-primary/20 flex items-center justify-center group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-primary/30 transition-all duration-300">
              <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <span className="text-lg sm:text-2xl font-black bg-gradient-to-l from-foreground to-primary bg-clip-text text-transparent tracking-tight">{t.brandName}</span>
          </Link>
          {/* Desktop buttons */}
          <div className="hidden md:flex items-center gap-2.5">
            <Link to="/login">
              <Button size="sm" className="font-bold bg-white border-2 border-primary/20 text-primary hover:bg-primary hover:text-white shadow-sm hover:shadow-md hover:shadow-primary/20 transition-all duration-300 rounded-xl px-5">
                {t.login}
              </Button>
            </Link>
            <Button size="sm" onClick={toggleLanguage} className="font-bold gap-1.5 bg-gradient-to-r from-primary to-[hsl(180,60%,35%)] shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 hover:scale-105 transition-all duration-300 text-white rounded-xl px-5">
              <Globe className="w-4 h-4" />
              {t.langSwitch}
            </Button>
            <Button size="icon" aria-label={language === "ar" ? "الرجوع" : "Back"} className="rounded-2xl w-10 h-10 bg-gradient-to-br from-primary to-[hsl(180,60%,35%)] shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 hover:scale-110 transition-all duration-300 text-white" onClick={() => {
              if (selectedRole && !submitted) {
                setSelectedRole(null);
              } else {
                navigate('/university-platform');
              }
            }}>
              {language === "ar" ? <ArrowLeft className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
            </Button>
          </div>

          {/* Mobile/Tablet dropdown */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button aria-label={language === "ar" ? "فتح القائمة" : "Open menu"} className="p-2.5 rounded-2xl bg-gradient-to-br from-primary to-[hsl(180,60%,35%)] text-white hover:shadow-lg hover:shadow-primary/30 hover:scale-105 transition-all duration-300 shadow-md">
                  <Menu className="w-5 h-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={dir === 'rtl' ? 'start' : 'end'} className="w-52 rounded-2xl border-primary/10 shadow-xl">
                <DropdownMenuItem onClick={() => navigate('/login')} className="gap-3 cursor-pointer rounded-xl mx-1 my-1 py-2.5">
                  <LogIn className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold">{t.login}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  if (selectedRole && !submitted) {
                    setSelectedRole(null);
                  } else {
                    navigate('/university-platform');
                  }
                }} className="gap-3 cursor-pointer rounded-xl mx-1 my-1 py-2.5">
                  <ArrowLeft className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold">{t.home}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={toggleLanguage} className="gap-3 cursor-pointer rounded-xl mx-1 my-1 py-2.5">
                  <Globe className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold">{language === "ar" ? "English" : "العربية"}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <Separator className="bg-primary/10" />

      <main className="flex-1 flex items-center justify-center px-4 py-6 sm:py-8 md:py-10">
        {!selectedRole ? (
          /* Step 1: Role Selection Cards */
          <div className="max-w-lg w-full text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-3xl bg-gradient-to-br from-primary via-primary to-[hsl(180,60%,35%)] shadow-xl shadow-primary/25 flex items-center justify-center animate-bounce-subtle">
                <GraduationCap className="w-8 h-8 sm:w-9 sm:h-9 text-white" />
              </div>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-foreground mb-2 bg-gradient-to-l from-foreground to-primary bg-clip-text text-transparent">
              {language === "ar" ? "اختر نوع الحساب" : "Choose Account Type"}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground font-medium mb-6">{language === "ar" ? "حدد نوع حسابك للمتابعة" : "Select your account type to continue"}</p>
            
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
              {additionalLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.labelEn}
                    to={item.href}
                    className="group relative p-5 sm:p-6 rounded-3xl border-2 border-primary/10 bg-white hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/20 shadow-lg shadow-primary/5 transition-all duration-500 text-center overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-primary via-primary to-[hsl(180,60%,35%)] shadow-lg shadow-primary/25 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-primary/30 transition-all duration-500">
                      <Icon className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                    </div>
                    <h3 className="relative text-base sm:text-lg font-bold text-primary group-hover:text-primary/90 transition-colors">{language === "ar" ? item.labelAr : item.labelEn}</h3>
                  </Link>
                );
              })}
            </div>
            <div className="mt-8 pt-6 border-t border-primary/10">
              <p className="text-sm sm:text-base text-muted-foreground font-medium">
                {language === "ar" ? "لديك حساب بالفعل؟" : "Already have an account?"}{" "}
                <Link to="/login" className="text-primary font-bold hover:text-primary/80 transition-colors relative inline-block after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-primary/30 hover:after:bg-primary after:transition-all">{t.login}</Link>
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

      <footer className="border-t border-primary/10 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 px-4 sm:px-6 py-6 sm:py-8">
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
