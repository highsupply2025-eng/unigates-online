import { useState, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { GraduationCap, ChevronLeft, ChevronRight, Loader2, ArrowRight, ArrowLeft, Upload, Camera, X, Globe, Phone, User, BookOpenCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

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
  { value: "personal" as const, labelAr: "حساب شخصي", labelEn: "Personal Account", descAr: "للأفراد الراغبين في تعلم الدورات التعليمية", descEn: "For individuals wanting to learn courses", icon: User },
  { value: "lecturer" as const, labelAr: "محاضر", labelEn: "Lecturer", descAr: "لإنشاء ونشر الدورات التعليمية", descEn: "To create and publish courses", icon: BookOpenCheck },
];

const Signup = () => {
  const { role: roleParam } = useParams<{ role: string }>();
  const [selectedRole, setSelectedRole] = useState<"personal" | "lecturer" | null>(
    roleParam === "lecturer" ? "lecturer" : roleParam ? "personal" : null
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
    const ext = file.name.split(".").pop();
    const path = `${userId}/${folder}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("user-documents").upload(path, file);
    if (error) throw error;
    // Store the path - admin will use signed URLs to view
    return path;
  };

  const handleSubmit = async () => {
    if (!fullName || !email || !password || !phone) {
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

      const { error: profileError } = await supabase.from("profiles").insert({
        user_id: userId,
        role,
        full_name: fullName,
        phone: `${countryCode}${phone}`,
        email,
        id_photo_url: idPhotoUrl || null,
        university_cert_url: uniCertUrl || null,
        additional_certs_urls: additionalCertUrls,
        live_photo_url: livePhotoUrl || null,
      });
      if (profileError) throw profileError;

      // Insert role (pending admin approval for lecturers)
      const { error: roleError } = await supabase.from("user_roles").insert({
        user_id: userId,
        role: role as any,
        approved: role === "personal",
      });
      if (roleError) console.error("Role insert error:", roleError);

      setSubmitted(true);
    } catch (error: any) {
      toast({ title: t.signupPage.errorGeneric, description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const pageTitle = isLecturer ? t.signupChoice.lecturerTitle : (language === "ar" ? "حساب شخصي" : "Personal Account");

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={dir}>
      <header className="border-b border-border px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <GraduationCap className="w-8 h-8 text-primary" />
            <span className="text-2xl font-black text-foreground tracking-tight">{t.brandName}</span>
          </Link>
          <div className="flex items-center gap-4">
            <Button variant="default" size="sm" onClick={toggleLanguage} className="font-semibold gap-1.5">
              <Globe className="w-4 h-4" />
              {t.langSwitch}
            </Button>
            <Link to="/login">
              <Button variant="default" size="sm" className="font-semibold">
                {t.login}
              </Button>
            </Link>
            <Link to="/">
              <Button variant="default" size="icon" className="rounded-full w-9 h-9">
                {language === "ar" ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <Separator />

      <main className="flex-1 flex items-center justify-center px-4 py-10">
        {!submitted ? (
          <div className="max-w-2xl w-full">
            <div className="text-center mb-8">
              <h1 className="text-2xl md:text-3xl font-black text-foreground mb-2">
                {t.signupPage.title} — {pageTitle}
              </h1>
              <p className="text-muted-foreground">{t.signupPage.subtitle}</p>
            </div>

            <div className="space-y-6">
              {/* Personal Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fullName" className="mb-2 block font-semibold">{t.signupPage.fullName} <span className="text-destructive">{t.signupPage.required}</span></Label>
                  <Input id="fullName" placeholder={t.signupPage.fullNamePlaceholder} value={fullName} onChange={(e) => setFullName(e.target.value)} className="h-12" />
                </div>
                <div>
                  <Label htmlFor="phone" className="mb-2 block font-semibold">{t.signupPage.phone} <span className="text-destructive">{t.signupPage.required}</span></Label>
                  <div className="flex gap-2" dir="ltr">
                    <Select value={countryCode} onValueChange={setCountryCode}>
                      <SelectTrigger className="h-12 w-[130px] shrink-0">
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
                    <Input id="phone" type="tel" placeholder={t.signupPage.phonePlaceholder} value={phone} onChange={(e) => setPhone(e.target.value)} className="h-12 flex-1" dir="ltr" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email" className="mb-2 block font-semibold">{t.signupPage.email} <span className="text-destructive">{t.signupPage.required}</span></Label>
                  <Input id="email" type="email" placeholder={t.signupPage.emailPlaceholder} value={email} onChange={(e) => setEmail(e.target.value)} className="h-12" dir="ltr" />
                </div>
                <div>
                  <Label htmlFor="password" className="mb-2 block font-semibold">{t.signupPage.password} <span className="text-destructive">{t.signupPage.required}</span></Label>
                  <Input id="password" type="password" placeholder={t.signupPage.passwordPlaceholder} value={password} onChange={(e) => setPassword(e.target.value)} className="h-12" dir="ltr" />
                  <p className="text-xs text-muted-foreground mt-1">{t.signupPage.passwordRules}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="confirmPassword" className="mb-2 block font-semibold">{t.signupPage.confirmPassword} <span className="text-destructive">{t.signupPage.required}</span></Label>
                  <Input id="confirmPassword" type="password" placeholder={t.signupPage.confirmPasswordPlaceholder} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="h-12" dir="ltr" />
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-xs text-destructive mt-1">{t.signupPage.passwordMismatch}</p>
                  )}
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
                className="w-full h-14 text-lg font-bold gap-2"
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

      <footer className="border-t border-border bg-secondary/50 px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-muted-foreground text-sm mb-4">
            {t.questions} <span className="font-semibold">800 850 1076</span> {t.freeCall}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            {[t.footerLinks.faq, t.footerLinks.helpCenter, t.footerLinks.usageTerms, t.footerLinks.privacy].map((link) => (
              <a key={link} href="#" className="text-muted-foreground hover:text-foreground hover:underline py-1">
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
