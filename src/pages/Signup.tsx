import { useState, useRef, useEffect } from "react";
import { Link, useParams, useSearchParams, useNavigate } from "react-router-dom";
import { GraduationCap, ChevronLeft, ChevronRight, Loader2, ArrowRight, ArrowLeft, Upload, Camera, X, Globe, Phone, User, BookOpenCheck, Building2, Landmark, Ticket, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSmartBack } from "@/hooks/use-smart-back";

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

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

const courseRoles = [
  { value: "personal" as const, labelAr: "طالب", labelEn: "Student", icon: User },
  { value: "lecturer" as const, labelAr: "محاضر", labelEn: "Lecturer", icon: BookOpenCheck },
];

const additionalLinks = [
  { labelAr: "كلية", labelEn: "College", icon: Landmark, href: "/signup/college" },
  { labelAr: "معهد", labelEn: "Institute", icon: Landmark, href: "/signup/institute" },
];

const Signup = () => {
  const navigate = useNavigate();
  const goBack = useSmartBack();
  const { role: roleParam } = useParams<{ role: string }>();
  const [searchParams] = useSearchParams();
  const deptInviteFromUrl = searchParams.get("dept_invite") || "";
  const roleFromUrl = searchParams.get("role") || "";
  const collegeInviteFromUrl = searchParams.get("invite") || "";
  
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

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/signup-upload`,
      {
        method: "POST",
        headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
        body: formData,
      }
    );
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Upload failed");
    return result.path;
  };

  const handleSubmit = async () => {
    const baseFieldsMissing = !selectedRole || !fullName || !email || !password || !phone;
    // Invitation code is only required for lecturers
    if (baseFieldsMissing || (isLecturer && !invitationCode)) {
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
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (authError) throw authError;
      const userId = authData.user?.id;
      if (!userId) throw new Error(t.signupPage.errorNoUser);

      let idPhotoUrl: string | undefined;
      let uniCertUrl: string | undefined;
      let additionalCertUrls: string[] = [];
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
        // Try department invitation code
        const { data: deptMember } = await supabase
          .from("department_members" as any)
          .select("*")
          .eq("invitation_code", invitationCode)
          .is("user_id", null)
          .limit(1)
          .single();
        
        if (deptMember) {
          await supabase
            .from("department_members" as any)
            .update({ user_id: userId })
            .eq("id", (deptMember as any).id);
        } else {
          // Try college invitation code
          const { data: collegeInv } = await supabase
            .from("college_invitations")
            .select("*")
            .eq("invitation_code", invitationCode)
            .eq("is_active", true)
            .limit(1)
            .single();
          
          if (collegeInv) {
            await supabase.from("college_members").insert({
              college_id: collegeInv.college_id,
              user_id: userId,
              role: collegeInv.role,
              invitation_id: collegeInv.id,
            });
            // Increment used_count
            await supabase
              .from("college_invitations")
              .update({ used_count: (collegeInv.used_count || 0) + 1 })
              .eq("id", collegeInv.id);
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
    <div className="min-h-screen bg-background flex flex-col" dir={dir}>
      <header className="border-b-2 border-primary/30 px-6 py-4 bg-card shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-[hsl(200,75%,30%)] shadow-lg shadow-primary/30 flex items-center justify-center group-hover:scale-105 transition-transform">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black text-foreground tracking-tight">{t.brandName}</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button size="sm" className="font-bold bg-gradient-to-r from-primary to-[hsl(200,75%,30%)] shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/30 transition-all text-white">
                {t.login}
              </Button>
            </Link>
            <Button size="sm" onClick={toggleLanguage} className="font-bold gap-1.5 bg-gradient-to-r from-primary to-[hsl(200,75%,30%)] shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/30 transition-all text-white">
              <Globe className="w-4 h-4" />
              {t.langSwitch}
            </Button>
            <Button size="icon" className="rounded-full w-10 h-10 bg-gradient-to-br from-primary to-[hsl(200,75%,30%)] shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/30 transition-all text-white" onClick={() => {
              if (selectedRole && !submitted) {
                setSelectedRole(null);
              } else {
                goBack();
              }
            }}>
              {language === "ar" ? <ArrowLeft className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </header>

      <Separator />

      <main className="flex-1 flex items-center justify-center px-4 py-10">
        {!selectedRole ? (
          /* Step 1: Role Selection Cards */
          <div className="max-w-lg w-full text-center">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-[hsl(200,75%,30%)] shadow-xl shadow-primary/30 flex items-center justify-center">
                <GraduationCap className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-foreground mb-2">
              {language === "ar" ? "اختر نوع الحساب" : "Choose Account Type"}
            </h1>
            <p className="text-primary/70 font-medium mb-2">{language === "ar" ? "حدد نوع حسابك للمتابعة" : "Select your account type to continue"}</p>
            <p className="text-sm text-muted-foreground mb-8">{language === "ar" ? "حساب الطالب مجاني ولا يخضع لمراجعة • حساب المحاضر يخضع لمراجعة المنصة" : "Student account is free with no review • Lecturer account requires platform review"}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {courseRoles.map((r) => {
                const Icon = r.icon;
                return (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setSelectedRole(r.value)}
                    className="group p-6 rounded-2xl border-2 border-primary/20 bg-card hover:border-primary hover:shadow-xl hover:shadow-primary/15 shadow-md transition-all duration-200 text-center"
                  >
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-[hsl(200,75%,30%)] shadow-lg shadow-primary/30 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-primary">{language === "ar" ? r.labelAr : r.labelEn}</h3>
                  </button>
                );
              })}
              {additionalLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.labelEn}
                    to={item.href}
                    className="group p-6 rounded-2xl border-2 border-primary/20 bg-card hover:border-primary hover:shadow-xl hover:shadow-primary/15 shadow-md transition-all duration-200 text-center"
                  >
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-[hsl(200,75%,30%)] shadow-lg shadow-primary/30 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-primary">{language === "ar" ? item.labelAr : item.labelEn}</h3>
                  </Link>
                );
              })}
            </div>
            <p className="text-sm text-foreground/70 font-medium mt-6">
              {language === "ar" ? "لديك حساب بالفعل؟" : "Already have an account?"}{" "}
              <Link to="/login" className="text-primary font-bold hover:underline">{t.login}</Link>
            </p>
          </div>
        ) : !submitted ? (
          <div className="max-w-2xl w-full">
            <div className="text-center mb-8">
              <button onClick={() => setSelectedRole(null)} className="text-sm text-primary hover:underline mb-4 inline-block">
                {language === "ar" ? "تغيير نوع الحساب →" : "← Change account type"}
              </button>
              <h1 className="text-2xl md:text-3xl font-black text-primary mb-2">
                {t.signupPage.title} — {pageTitle}
              </h1>
              <p className="text-muted-foreground">{t.signupPage.subtitle}</p>
            </div>

            <div className="space-y-6">
              {/* Personal Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fullName" className="mb-2 block font-bold text-primary">{t.signupPage.fullName} <span className="text-destructive">{t.signupPage.required}</span></Label>
                  <Input id="fullName" placeholder={t.signupPage.fullNamePlaceholder} value={fullName} onChange={(e) => setFullName(e.target.value)} className="h-12 border-2 border-primary/20 focus:border-primary" />
                </div>
                <div>
                  <Label htmlFor="phone" className="mb-2 block font-bold text-primary">{t.signupPage.phone} <span className="text-destructive">{t.signupPage.required}</span></Label>
                  <div className="flex gap-2" dir="ltr">
                    <Select value={countryCode} onValueChange={setCountryCode}>
                      <SelectTrigger className="h-12 w-[130px] shrink-0 border-2 border-primary/20 focus:border-primary">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {countryCodes.map((c) => (
                          <SelectItem key={c.code} value={c.code}>
                            {c.country} {c.code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input id="phone" type="tel" placeholder={t.signupPage.phonePlaceholder} value={phone} onChange={(e) => setPhone(e.target.value)} className="h-12 flex-1 border-2 border-primary/20 focus:border-primary" dir="ltr" />
                  </div>
                </div>
              </div>

              <div className={`grid grid-cols-1 ${isLecturer ? 'md:grid-cols-2' : ''} gap-4`}>
                <div>
                  <Label htmlFor="email" className="mb-2 block font-bold text-primary">{t.signupPage.email} <span className="text-destructive">{t.signupPage.required}</span></Label>
                  <Input id="email" type="email" placeholder={t.signupPage.emailPlaceholder} value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 border-2 border-primary/20 focus:border-primary" dir="ltr" />
                </div>
                {isLecturer && (
                  <div>
                    <Label htmlFor="invitationCode" className="mb-2 block font-bold text-primary">
                      <Ticket className="w-4 h-4 inline me-1 text-primary" />
                      {language === "ar" ? "كود الدعوة" : "Invitation Code"} <span className="text-destructive">{t.signupPage.required}</span>
                    </Label>
                    <Input id="invitationCode" placeholder={language === "ar" ? "أدخل كود الدعوة" : "Enter invitation code"} value={invitationCode} onChange={(e) => setInvitationCode(e.target.value)} className="h-12 tracking-widest font-mono text-center uppercase border-2 border-primary/20 focus:border-primary" dir="ltr" />
                  </div>
                )}
              </div>

              {/* Student free notice */}
              {!isLecturer && (
                <div className="rounded-xl border-2 border-green-500/30 bg-green-500/5 p-4 text-center">
                  <p className="text-sm font-bold text-green-700 dark:text-green-400">
                    🎓 {language === "ar" ? "حساب الطالب مجاني بالكامل — سجّل الآن واستفد من جميع الدورات!" : "Student account is completely free — Sign up now and access all courses!"}
                  </p>
                </div>
              )}

              {/* Lecturer review notice */}
              {isLecturer && (
                <div className="rounded-xl border-2 border-amber-500/30 bg-amber-500/5 p-4 text-center">
                  <p className="text-sm font-bold text-amber-700 dark:text-amber-400">
                    ⚠️ {language === "ar" ? "حساب المحاضر يخضع لمراجعة المنصة قبل التفعيل" : "Lecturer account requires platform review before activation"}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="password" className="mb-2 block font-bold text-primary">{t.signupPage.password} <span className="text-destructive">{t.signupPage.required}</span></Label>
                  <div className="relative">
                    <Input id="password" type={showPassword ? "text" : "password"} placeholder={t.signupPage.passwordPlaceholder} value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 pe-10 border-2 border-primary/20 focus:border-primary" dir="ltr" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{t.signupPage.passwordRules}</p>
                </div>
                <div>
                  <Label htmlFor="confirmPassword" className="mb-2 block font-bold text-primary">{t.signupPage.confirmPassword} <span className="text-destructive">{t.signupPage.required}</span></Label>
                  <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder={t.signupPage.confirmPasswordPlaceholder} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="h-12 border-2 border-primary/20 focus:border-primary" dir="ltr" />
                  <div className="flex items-center justify-between mt-1">
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

              <Separator />

              {/* File Uploads */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-foreground">{t.signupPage.documentsTitle}</h3>

                {/* ID Photo */}
                <div>
                  <Label className="mb-2 block font-semibold">{t.signupPage.idPhoto}</Label>
                  <div className="relative">
                    {idPhotoPreview ? (
                      <div className="relative w-full h-40 rounded-xl overflow-hidden border border-border">
                        <img src={idPhotoPreview} alt={t.signupPage.idPhoto} className="w-full h-full object-cover" />
                        <button type="button" onClick={() => { setIdPhoto(null); setIdPhotoPreview(null); }} className="absolute top-2 left-2 w-8 h-8 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center h-32 rounded-xl border-2 border-dashed border-border bg-muted/50 cursor-pointer hover:border-primary/50 transition-colors">
                        <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                        <span className="text-sm text-muted-foreground">{t.signupPage.idPhotoUpload}</span>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e, setIdPhoto, setIdPhotoPreview)} />
                      </label>
                    )}
                  </div>
                </div>

                {/* University Certificate - Lecturer only */}
                {isLecturer && (
                  <div>
                    <Label className="mb-2 block font-semibold">{t.signupPage.uniCert}</Label>
                    <div className="relative">
                      {uniCertPreview ? (
                        <div className="relative w-full h-40 rounded-xl overflow-hidden border border-border">
                          <img src={uniCertPreview} alt={t.signupPage.uniCert} className="w-full h-full object-cover" />
                          <button type="button" onClick={() => { setUniCert(null); setUniCertPreview(null); }} className="absolute top-2 left-2 w-8 h-8 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center h-32 rounded-xl border-2 border-dashed border-border bg-muted/50 cursor-pointer hover:border-primary/50 transition-colors">
                          <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                          <span className="text-sm text-muted-foreground">{t.signupPage.uniCertUpload}</span>
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e, setUniCert, setUniCertPreview)} />
                        </label>
                      )}
                    </div>
                  </div>
                )}

                {/* Additional Certificates - Lecturer only */}
                {isLecturer && (
                  <div>
                    <Label className="mb-2 block font-semibold">{t.signupPage.additionalCerts}</Label>
                    {additionalCertPreviews.length > 0 && (
                      <div className="grid grid-cols-3 gap-3 mb-3">
                        {additionalCertPreviews.map((preview, i) => (
                          <div key={i} className="relative h-28 rounded-lg overflow-hidden border border-border">
                            <img src={preview} alt={`${t.signupPage.additionalCerts} ${i + 1}`} className="w-full h-full object-cover" />
                            <button type="button" onClick={() => removeAdditionalCert(i)} className="absolute top-1 left-1 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <label className="flex flex-col items-center justify-center h-24 rounded-xl border-2 border-dashed border-border bg-muted/50 cursor-pointer hover:border-primary/50 transition-colors">
                      <Upload className="w-6 h-6 text-muted-foreground mb-1" />
                      <span className="text-sm text-muted-foreground">{t.signupPage.additionalCertsUpload}</span>
                      <input type="file" accept="image/*" multiple className="hidden" onChange={handleMultiFileSelect} />
                    </label>
                  </div>
                )}

                {/* Live Photo */}
                <div>
                  <Label className="mb-2 block font-semibold">{t.signupPage.livePhoto}</Label>
                  <div className="relative">
                    {livePhotoPreview ? (
                      <div className="relative w-40 h-40 rounded-full overflow-hidden border-4 border-primary mx-auto">
                        <img src={livePhotoPreview} alt={t.signupPage.livePhoto} className="w-full h-full object-cover" />
                        <button type="button" onClick={() => { setLivePhoto(null); setLivePhotoPreview(null); }} className="absolute top-1 left-1 w-8 h-8 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center h-40 w-40 mx-auto rounded-full border-2 border-dashed border-border bg-muted/50 cursor-pointer hover:border-primary/50 transition-colors">
                        <Camera className="w-10 h-10 text-muted-foreground mb-2" />
                        <span className="text-xs text-muted-foreground">{t.signupPage.livePhotoCapture}</span>
                        <input ref={livePhotoRef} type="file" accept="image/*" capture="user" className="hidden" onChange={(e) => handleFileSelect(e, setLivePhoto, setLivePhotoPreview)} />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Submit */}
              <Button
                size="lg"
                className="w-full h-14 text-lg font-bold gap-2 bg-gradient-to-r from-primary to-[hsl(200,75%,30%)] hover:from-primary/90 hover:to-[hsl(200,75%,25%)] shadow-lg shadow-primary/25"
                disabled={!fullName || !email || !password || !confirmPassword || password !== confirmPassword || !phone || !invitationCode || loading}
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
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/80 to-accent/80 flex items-center justify-center shadow-lg">
                <GraduationCap className="w-12 h-12 text-primary-foreground" />
              </div>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-foreground mb-4">{t.signupPage.checkEmail}</h1>
            <p className="text-muted-foreground mb-10 leading-relaxed max-w-md mx-auto">
              {t.signupPage.checkEmailDesc}{" "}
              <span className="font-bold text-foreground">{email}</span>.
              {" "}{t.signupPage.checkEmailAction}
            </p>
            <Link to="/login">
              <Button size="lg" className="h-14 text-lg font-bold px-10">
                {t.signupPage.goToLogin}
              </Button>
            </Link>
          </div>
        )}
      </main>

      <footer className="border-t-2 border-primary/20 bg-gradient-to-r from-secondary/50 to-primary/5 px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <span className="text-foreground font-bold text-sm">{language === "ar" ? "أسئلة؟ تواصل على" : "Questions? Contact us on"}</span>
            <a href="https://wa.me/966563057356" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe5a] text-white font-bold px-4 py-2 rounded-full shadow-md shadow-[#25D366]/30 hover:shadow-lg hover:shadow-[#25D366]/40 transition-all text-sm">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              WhatsApp
            </a>
            <span className="text-primary font-bold text-sm">⚡ {language === "ar" ? "استجابة فورية" : "Instant response"}</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            {[t.footerLinks.faq, t.footerLinks.helpCenter, t.footerLinks.usageTerms, t.footerLinks.privacy].map((link) => (
              <a key={link} href="#" className="text-primary font-bold hover:text-primary/80 hover:underline py-1 transition-colors">
                {link}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Signup;
