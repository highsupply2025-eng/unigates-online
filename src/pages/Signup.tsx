import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { GraduationCap, ChevronLeft, Loader2, ArrowRight, Upload, Camera, X, User, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Signup = () => {
  const [role, setRole] = useState<"student" | "lecturer" | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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
    const { data } = supabase.storage.from("user-documents").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSubmit = async () => {
    if (!role || !fullName || !email || !password || !phone) {
      toast({ title: "خطأ", description: "يرجى ملء جميع الحقول المطلوبة", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "خطأ", description: "كلمة المرور يجب أن تكون 6 أحرف على الأقل", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // 1. Sign up
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (authError) throw authError;
      const userId = authData.user?.id;
      if (!userId) throw new Error("لم يتم إنشاء المستخدم");

      // 2. Upload files
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

      // 3. Create profile
      const { error: profileError } = await supabase.from("profiles").insert({
        user_id: userId,
        role,
        full_name: fullName,
        phone,
        email,
        id_photo_url: idPhotoUrl || null,
        university_cert_url: uniCertUrl || null,
        additional_certs_urls: additionalCertUrls,
        live_photo_url: livePhotoUrl || null,
      });
      if (profileError) throw profileError;

      setSubmitted(true);
    } catch (error: any) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      {/* Header */}
      <header className="border-b border-border px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <GraduationCap className="w-8 h-8 text-primary" />
            <span className="text-2xl font-black text-foreground tracking-tight">مَعرِفة</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-semibold text-primary hover:underline">
              تسجيل الدخول
            </Link>
            <Link to="/" className="flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
              الرئيسية
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      <Separator />

      <main className="flex-1 flex items-center justify-center px-4 py-10">
        {!submitted ? (
          <div className="max-w-2xl w-full">
            <div className="text-center mb-8">
              <h1 className="text-2xl md:text-3xl font-black text-foreground mb-2">إنشاء حساب جديد</h1>
              <p className="text-muted-foreground">أكمل البيانات التالية للتسجيل في المنصة</p>
            </div>

            <div className="space-y-6">
              {/* Role Selection */}
              <div>
                <Label className="text-base font-bold mb-3 block">نوع الحساب <span className="text-destructive">*</span></Label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setRole("student")}
                    className={`flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all duration-200 ${
                      role === "student"
                        ? "border-primary bg-primary/10 shadow-md"
                        : "border-border bg-card hover:border-primary/50"
                    }`}
                  >
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                      role === "student" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}>
                      <BookOpen className="w-7 h-7" />
                    </div>
                    <span className={`font-bold text-lg ${role === "student" ? "text-primary" : "text-foreground"}`}>طالب</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("lecturer")}
                    className={`flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all duration-200 ${
                      role === "lecturer"
                        ? "border-primary bg-primary/10 shadow-md"
                        : "border-border bg-card hover:border-primary/50"
                    }`}
                  >
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                      role === "lecturer" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}>
                      <User className="w-7 h-7" />
                    </div>
                    <span className={`font-bold text-lg ${role === "lecturer" ? "text-primary" : "text-foreground"}`}>محاضر</span>
                  </button>
                </div>
              </div>

              <Separator />

              {/* Personal Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fullName" className="mb-2 block font-semibold">الاسم الكامل <span className="text-destructive">*</span></Label>
                  <Input
                    id="fullName"
                    placeholder="أدخل اسمك الكامل"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="h-12"
                  />
                </div>
                <div>
                  <Label htmlFor="phone" className="mb-2 block font-semibold">رقم الاتصال <span className="text-destructive">*</span></Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="مثال: 01012345678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-12"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email" className="mb-2 block font-semibold">البريد الإلكتروني <span className="text-destructive">*</span></Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12"
                    dir="ltr"
                  />
                </div>
                <div>
                  <Label htmlFor="password" className="mb-2 block font-semibold">كلمة المرور <span className="text-destructive">*</span></Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="6 أحرف على الأقل"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12"
                  />
                </div>
              </div>

              <Separator />

              {/* File Uploads */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-foreground">المستندات والصور</h3>

                {/* ID Photo */}
                <div>
                  <Label className="mb-2 block font-semibold">صورة الهوية</Label>
                  <div className="relative">
                    {idPhotoPreview ? (
                      <div className="relative w-full h-40 rounded-xl overflow-hidden border border-border">
                        <img src={idPhotoPreview} alt="صورة الهوية" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => { setIdPhoto(null); setIdPhotoPreview(null); }}
                          className="absolute top-2 left-2 w-8 h-8 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center h-32 rounded-xl border-2 border-dashed border-border bg-muted/50 cursor-pointer hover:border-primary/50 transition-colors">
                        <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                        <span className="text-sm text-muted-foreground">اضغط لرفع صورة الهوية</span>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e, setIdPhoto, setIdPhotoPreview)} />
                      </label>
                    )}
                  </div>
                </div>

                {/* University Certificate - Lecturer only */}
                {role === "lecturer" && (
                  <div>
                    <Label className="mb-2 block font-semibold">صورة الشهادة الجامعية</Label>
                    <div className="relative">
                      {uniCertPreview ? (
                        <div className="relative w-full h-40 rounded-xl overflow-hidden border border-border">
                          <img src={uniCertPreview} alt="الشهادة الجامعية" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => { setUniCert(null); setUniCertPreview(null); }}
                            className="absolute top-2 left-2 w-8 h-8 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center h-32 rounded-xl border-2 border-dashed border-border bg-muted/50 cursor-pointer hover:border-primary/50 transition-colors">
                          <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                          <span className="text-sm text-muted-foreground">اضغط لرفع صورة الشهادة الجامعية</span>
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e, setUniCert, setUniCertPreview)} />
                        </label>
                      )}
                    </div>
                  </div>
                )}

                {/* Additional Certificates - Lecturer only */}
                {role === "lecturer" && (
                  <div>
                    <Label className="mb-2 block font-semibold">شهادات إضافية</Label>
                    {additionalCertPreviews.length > 0 && (
                      <div className="grid grid-cols-3 gap-3 mb-3">
                        {additionalCertPreviews.map((preview, i) => (
                          <div key={i} className="relative h-28 rounded-lg overflow-hidden border border-border">
                            <img src={preview} alt={`شهادة ${i + 1}`} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => removeAdditionalCert(i)}
                              className="absolute top-1 left-1 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <label className="flex flex-col items-center justify-center h-24 rounded-xl border-2 border-dashed border-border bg-muted/50 cursor-pointer hover:border-primary/50 transition-colors">
                      <Upload className="w-6 h-6 text-muted-foreground mb-1" />
                      <span className="text-sm text-muted-foreground">اضغط لإضافة شهادات أخرى</span>
                      <input type="file" accept="image/*" multiple className="hidden" onChange={handleMultiFileSelect} />
                    </label>
                  </div>
                )}

                {/* Live Photo */}
                <div>
                  <Label className="mb-2 block font-semibold">صورة حية (سيلفي)</Label>
                  <div className="relative">
                    {livePhotoPreview ? (
                      <div className="relative w-40 h-40 rounded-full overflow-hidden border-4 border-primary mx-auto">
                        <img src={livePhotoPreview} alt="صورة حية" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => { setLivePhoto(null); setLivePhotoPreview(null); }}
                          className="absolute top-1 left-1 w-8 h-8 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center h-40 w-40 mx-auto rounded-full border-2 border-dashed border-border bg-muted/50 cursor-pointer hover:border-primary/50 transition-colors">
                        <Camera className="w-10 h-10 text-muted-foreground mb-2" />
                        <span className="text-xs text-muted-foreground">التقط صورة</span>
                        <input
                          ref={livePhotoRef}
                          type="file"
                          accept="image/*"
                          capture="user"
                          className="hidden"
                          onChange={(e) => handleFileSelect(e, setLivePhoto, setLivePhotoPreview)}
                        />
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
                disabled={!role || !fullName || !email || !password || !phone || loading}
                onClick={handleSubmit}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <ChevronLeft className="w-5 h-5" />
                )}
                إنشاء الحساب
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
            <h1 className="text-2xl md:text-3xl font-black text-foreground mb-4">تحقق من بريدك الإلكتروني</h1>
            <p className="text-muted-foreground mb-10 leading-relaxed max-w-md mx-auto">
              لقد أرسلنا رابط التأكيد إلى{" "}
              <span className="font-bold text-foreground">{email}</span>.
              اضغط على الرابط لتفعيل حسابك.
            </p>
            <Link to="/login">
              <Button size="lg" className="h-14 text-lg font-bold px-10">
                الذهاب لتسجيل الدخول
              </Button>
            </Link>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-secondary/50 px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-muted-foreground text-sm mb-4">
            أسئلة؟ اتصل بنا: <span className="font-semibold">800 850 1076</span> (مجاني)
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            {["الأسئلة الشائعة", "مركز المساعدة", "شروط الاستخدام", "الخصوصية"].map((link) => (
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
