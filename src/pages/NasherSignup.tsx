import { useState, useId, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  PenTool, 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  User, 
  ShieldCheck, 
  CheckCircle2, 
  Phone, 
  Sparkles, 
  GraduationCap, 
  Building2, 
  Mail, 
  Key, 
  Copy, 
  Check, 
  ArrowRight,
  BookOpen,
  Home,
  Info,
  Camera,
  Upload,
  Image as ImageIcon,
  Trash2,
  FileCheck2,
  Plus,
  FileText,
  Lock,
  Eye,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageSelectorDropdown from "@/components/LanguageSelectorDropdown";
import { AcademicTitle, AuthorProfile } from "@/types/nashr";
import { NashrDataStore } from "@/services/nashrDataStore";

const ACADEMIC_TITLES = [
  { value: "prof", labelAr: "أ.د. / أستاذ دكتور", labelEn: "Prof. Dr." },
  { value: "dr", labelAr: "د. / دكتور", labelEn: "Dr." },
  { value: "lecturer", labelAr: "أستاذ محاضر / مدرس", labelEn: "Lecturer / Assistant Prof" },
  { value: "researcher", labelAr: "باحث أكاديمي / زميل بحثي", labelEn: "Academic Researcher" },
  { value: "author", labelAr: "مؤلف / كاتب أدبي", labelEn: "Author / Writer" },
  { value: "expert", labelAr: "خبير ومستشار تخصصي", labelEn: "Subject Matter Expert" },
  { value: "translator", labelAr: "مترجم ومحرر علمي", labelEn: "Academic Translator" },
];

const SPECIALIZATIONS = [
  "العلوم السياسية والدراسات الاستراتيجية",
  "القانون والتشريعات والشريعة",
  "إدارة الأعمال والاقتصاد والمالية",
  "الذكاء الاصطناعي وعلوم الحاسب والتقنية",
  "العلوم الطبية والصيدلانية والرعاية الصحية",
  "الهندسة والعلوم التطبيقية",
  "الأدب والنقد واللغات والترجمة",
  "التربية وعلم النفس والمناهج",
  "الإعلام والصحافة والاتصال الرقمي",
  "العلوم الإنسانية والاجتماعية والتاريخ",
  "العلوم الأساسية (رياضيات، فيزياء، كيمياء، أحياء)"
];

const generateTempPassword = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let str = "NSR-";
  for (let i = 0; i < 6; i++) {
    str += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return str;
};

const generateAuthorCode = () => {
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `AUT-${rand}`;
};

interface UploadedDoc {
  id: string;
  name: string;
  url: string;
  size: string;
}

const NasherSignup = () => {
  const [academicTitle, setAcademicTitle] = useState<AcademicTitle>("prof");
  const [fullName, setFullName] = useState("");
  const [specialization, setSpecialization] = useState(SPECIALIZATIONS[0]);
  const [customSpecialization, setCustomSpecialization] = useState("");
  const [institution, setInstitution] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+20");
  const [bio, setBio] = useState("");

  // Uploaded Files State
  const [avatarFile, setAvatarFile] = useState<UploadedDoc | null>(null);
  const [nationalIdFile, setNationalIdFile] = useState<UploadedDoc | null>(null);
  const [qualificationFiles, setQualificationFiles] = useState<UploadedDoc[]>([]);

  // Terms Agreement
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // File Inputs Refs
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const nationalIdInputRef = useRef<HTMLInputElement>(null);
  const qualificationInputRef = useRef<HTMLInputElement>(null);
  
  // Registration completion state
  const [loading, setLoading] = useState(false);
  const [generatedAccount, setGeneratedAccount] = useState<{
    profile: AuthorProfile;
    tempPassword: string;
  } | null>(null);
  const [copiedPass, setCopiedPass] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();
  const { dir } = useLanguage();
  const isRtl = dir === "rtl";

  // File Handlers
  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const sizeStr = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;
    setAvatarFile({
      id: `av-${Date.now()}`,
      name: file.name,
      url,
      size: sizeStr,
    });
    toast({
      title: isRtl ? "تم إرفاق الصورة الشخصية" : "Profile Photo Attached",
      description: file.name,
    });
  };

  const handleNationalIdSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const sizeStr = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;
    setNationalIdFile({
      id: `id-${Date.now()}`,
      name: file.name,
      url,
      size: sizeStr,
    });
    toast({
      title: isRtl ? "تم إرفاق صورة الهوية / الرقم القومي" : "National ID / Passport Attached",
      description: file.name,
    });
  };

  const handleQualificationSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newDocs: UploadedDoc[] = Array.from(files).map((file, idx) => ({
      id: `qual-${Date.now()}-${idx}`,
      name: file.name,
      url: URL.createObjectURL(file),
      size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
    }));

    setQualificationFiles((prev) => [...prev, ...newDocs]);
    toast({
      title: isRtl ? `تم إرفاق ${newDocs.length} من مستندات المؤهل` : `Attached ${newDocs.length} Qualification Documents`,
      description: isRtl ? "يمكنك إضافة المزيد من شهادات المؤهلات في أي وقت" : "You can add more qualification certificates",
    });
  };

  const removeQualification = (id: string) => {
    setQualificationFiles((prev) => prev.filter((q) => q.id !== id));
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Full name validation (must be at least 3 parts/words)
    const nameWords = fullName.trim().split(/\s+/).filter(Boolean);
    if (!fullName.trim() || nameWords.length < 3) {
      toast({
        title: isRtl ? "الاسم الكامل غير مكتمل" : "Incomplete Full Name",
        description: isRtl 
          ? "يرجى كتابة الاسم كاملاً (ثلاثي أو رباعي على الأقل) كما يظهر في الوثائق الرسمية."
          : "Please enter your full name (at least 3 names) as in official IDs.",
        variant: "destructive"
      });
      return;
    }

    // 2. Specialization validation
    if (specialization === "other" && !customSpecialization.trim()) {
      toast({
        title: isRtl ? "مجال التخصص مطلوب" : "Specialization Required",
        description: isRtl ? "يرجى كتابة مجال تخصصك الدقيق في الخانة المخصصة." : "Please enter your specific specialization.",
        variant: "destructive"
      });
      return;
    }

    // 3. Institution / University validation (Mandatory)
    if (!institution.trim()) {
      toast({
        title: isRtl ? "جهة العمل أو الجامعة مطلوبة" : "Institution / University Required",
        description: isRtl ? "يرجى كتابة الجامعة أو الكلية أو المؤسسة الأكاديمية التابع لها." : "Please enter your university, faculty, or institution.",
        variant: "destructive"
      });
      return;
    }

    // 4. Email validation
    if (!email.trim() || !email.includes("@") || !email.includes(".")) {
      toast({
        title: isRtl ? "البريد الإلكتروني غير صحيح" : "Invalid Email",
        description: isRtl ? "يرجى إدخال بريد إلكتروني صحيح ومعتمد لاستلام بيانات الحساب." : "Please enter a valid official email address.",
        variant: "destructive"
      });
      return;
    }

    // 5. Phone validation
    if (!phone.trim() || phone.trim().length < 8) {
      toast({
        title: isRtl ? "رقم الهاتف غير مكتمل" : "Incomplete Phone",
        description: isRtl ? "يرجى إدخال رقم هاتف / واتساب صحيح للتواصل الفوري." : "Please enter a valid phone number.",
        variant: "destructive"
      });
      return;
    }

    // 6. Personal Photo (Mandatory)
    if (!avatarFile) {
      toast({
        title: isRtl ? "الصورة الشخصية مطلوبة" : "Profile Photo Required",
        description: isRtl ? "يرجى إرفاق الصورة الشخصية للمؤلف لإضافتها للملف الأكاديمي." : "Please attach a personal profile photo.",
        variant: "destructive"
      });
      return;
    }

    // 7. National ID / Passport (Mandatory)
    if (!nationalIdFile) {
      toast({
        title: isRtl ? "صورة الهوية مطلوبة" : "National ID Required",
        description: isRtl ? "يرجى إرفاق صورة بطاقة الرقم القومي أو جواز السفر لتوثيق الحساب." : "Please attach your national ID or passport for verification.",
        variant: "destructive"
      });
      return;
    }

    // 8. Academic Qualification(s) (Mandatory)
    if (qualificationFiles.length === 0) {
      toast({
        title: isRtl ? "شهادة المؤهل الأكاديمي مطلوبة" : "Degree Certificate Required",
        description: isRtl ? "يرجى إرفاق صورة المؤهل الأكاديمي أو الشهادات لتوثيق رتبة المؤلف." : "Please attach at least one academic degree certificate.",
        variant: "destructive"
      });
      return;
    }

    // 9. Terms and conditions
    if (!agreedToTerms) {
      toast({
        title: isRtl ? "الموافقة على الشروط والأحكام مطلوبة" : "Terms & Conditions Required",
        description: isRtl 
          ? "يرجى قراءة الشروط والأحكام الخاصة بمنظومة نشر والموافقة عليها للمتابعة."
          : "Please agree to the UNIGATES publishing terms & conditions to proceed.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const selectedTitleObj = ACADEMIC_TITLES.find(t => t.value === academicTitle);
      const titleLabel = isRtl ? (selectedTitleObj?.labelAr || "مؤلف") : (selectedTitleObj?.labelEn || "Author");
      const finalSpec = specialization === "other" ? customSpecialization : specialization;
      const authorCode = generateAuthorCode();
      const tempPassword = generateTempPassword();

      const newProfile: AuthorProfile = {
        id: `auth-${Date.now()}`,
        authorCode,
        fullName: `${titleLabel.split("/")[0].trim()} ${fullName.trim()}`,
        academicTitle,
        academicTitleLabel: titleLabel,
        specialization: finalSpec || "علوم وأبحاث عامة",
        institution: institution.trim() || undefined,
        email: email.trim().toLowerCase(),
        phone: `${countryCode} ${phone.trim()}`,
        bio: bio.trim() || undefined,
        avatarUrl: avatarFile?.url,
        nationalIdUrl: nationalIdFile?.url,
        qualificationUrls: qualificationFiles.map(q => q.url),
        agreedToTerms: true,
        isTemporaryPassword: true,
        verificationStatus: "pending_review",
        joinedDate: new Date().toISOString().split("T")[0]
      };

      // Save to store
      NashrDataStore.saveAuthorProfile(newProfile);

      setGeneratedAccount({
        profile: newProfile,
        tempPassword
      });

      toast({
        title: isRtl ? "🎉 تم إنشاء حساب المؤلف بنجاح!" : "Author Account Created Successfully!",
        description: isRtl 
          ? `مرحباً بك ${newProfile.fullName}. تم تعيين كود المؤلف وكلمة المرور المؤقتة.`
          : `Welcome ${newProfile.fullName}. Temporary password generated.`
      });
    } catch (err: any) {
      toast({
        title: isRtl ? "حدث خطأ" : "Error",
        description: isRtl ? "يرجى المحاولة مرة أخرى." : "Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPassword = () => {
    if (generatedAccount) {
      navigator.clipboard.writeText(generatedAccount.tempPassword);
      setCopiedPass(true);
      toast({
        title: isRtl ? "تم النسخ" : "Copied",
        description: isRtl ? "تم نسخ كلمة المرور المؤقتة إلى الحافظة." : "Temporary password copied to clipboard."
      });
      setTimeout(() => setCopiedPass(false), 3000);
    }
  };

  const proceedToDashboard = () => {
    navigate("/nashr/dashboard");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-amber-500 selection:text-white" dir={dir}>
      {/* Header */}
      <header className="border-b border-border/50 px-4 sm:px-8 py-3 bg-card/85 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Right / Brand */}
          <Link to="/nashr" className="flex items-center gap-3 group shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 via-orange-600 to-rose-600 p-0.5 shadow-md shadow-amber-500/25 flex items-center justify-center text-white group-hover:scale-105 transition-transform">
              <PenTool className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight text-foreground group-hover:text-amber-500 transition-colors">UNIGATES</span>
                <Badge className="bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-rose-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[10px] font-black px-2 py-0.5">
                  {isRtl ? "منصة نشر" : "Nashr"}
                </Badge>
              </div>
              <span className="text-[10px] block font-bold text-muted-foreground">
                {isRtl ? "بوابة تسجيل المؤلفين والباحثين • دار عبيد للنشر" : "Author & Researcher Onboarding • Dar Obeid"}
              </span>
            </div>
          </Link>

          {/* Center Navigation Links (Tablet & Desktop) */}
          <div className="hidden md:flex items-center gap-1.5 bg-muted/40 p-1 rounded-2xl border border-border/60">
            <Link to="/">
              <Button variant="ghost" size="sm" className="h-8 px-3 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-background/80 rounded-xl gap-1.5">
                <Home className="w-3.5 h-3.5 text-amber-500" />
                <span>{isRtl ? "الرئيسية" : "Home"}</span>
              </Button>
            </Link>
            <Link to="/nashr">
              <Button variant="ghost" size="sm" className="h-8 px-3 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-background/80 rounded-xl gap-1.5">
                <PenTool className="w-3.5 h-3.5 text-orange-500" />
                <span>{isRtl ? "منصة نشر" : "About Nashr"}</span>
              </Button>
            </Link>
            <Link to="/book-store">
              <Button variant="ghost" size="sm" className="h-8 px-3 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-background/80 rounded-xl gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-rose-500" />
                <span>{isRtl ? "متجر الكتب" : "Bookstore"}</span>
              </Button>
            </Link>
          </div>

          {/* Left / Actions & Controls */}
          <div className="flex items-center gap-2">
            <Link to="/nashr/login">
              <Button size="sm" variant="outline" className="font-extrabold border-amber-500/30 hover:border-amber-500/60 bg-amber-500/5 hover:bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs h-9 px-3.5 rounded-xl gap-1.5 shadow-sm">
                <Lock className="w-3.5 h-3.5" />
                <span>{isRtl ? "دخول المؤلفين" : "Sign In"}</span>
              </Button>
            </Link>

            <Link to="/nashr/dashboard" className="hidden sm:inline-flex">
              <Button size="sm" variant="ghost" className="font-bold text-muted-foreground hover:text-foreground text-xs h-9 px-3 rounded-xl gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>{isRtl ? "استوديو التحكم" : "Studio"}</span>
              </Button>
            </Link>

            <div className="h-5 w-px bg-border/80 mx-1 hidden sm:block" />

            <ThemeToggle />
            <LanguageSelectorDropdown />
          </div>

        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 my-2 relative">
        {/* Ambient Glows */}
        <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-amber-500/5 via-rose-500/5 to-transparent pointer-events-none -z-10" />
        <div className="absolute top-10 start-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-[140px] pointer-events-none -z-10" />
        <div className="absolute top-32 end-1/4 w-80 h-80 bg-rose-500/10 rounded-full blur-[140px] pointer-events-none -z-10" />

        <div className="w-full max-w-4xl space-y-6">
          
          {/* Header Banner */}
          {!generatedAccount && (
            <div className="text-center space-y-3 pt-2">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-400 text-xs font-black shadow-sm">
                <GraduationCap className="w-4 h-4 text-amber-500" />
                <span>{isRtl ? "حساب مؤلف وباحث رسمي • نشر رقمي وورقي معتمد" : "Official Author Account • Digital & Print Publishing"}</span>
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tight text-foreground">
                {isRtl ? (
                  <>
                    تسجيل حساب مؤلف جديد في{" "}
                    <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 bg-clip-text text-transparent">
                      منصة نشر
                    </span>
                  </>
                ) : (
                  "Register as Author on Nashr Platform"
                )}
              </h1>

              <p className="text-xs sm:text-sm md:text-base text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
                {isRtl 
                  ? "سجّل بياناتك الأكاديمية والمهنية وأرفق مستنداتك لرفع مؤلفاتك، متابعة الاعتماد والمبيعات، وتحصيل أعلى عوائد أرباح (70% للنسخ الرقمية و30% للمطبوعة) فورياً بإشراف دار عبيد للنشر."
                  : "Register your academic credentials and documents to publish works, track bookstore sales, and receive top royalties (70% digital / 30% print) with Dar Obeid."}
              </p>

              {/* 3 Step Roadmap */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-3 max-w-3xl mx-auto text-start">
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3">
                  <div className="w-7 h-7 rounded-xl bg-amber-500 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
                    1
                  </div>
                  <div>
                    <div className="text-xs font-black text-foreground">{isRtl ? "بيانات المؤلف والوثائق" : "Profile & Documents"}</div>
                    <div className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">{isRtl ? "الخطوة الحالية النشطة" : "Current Step"}</div>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-card/60 border border-border/70 flex items-center gap-3 opacity-80">
                  <div className="w-7 h-7 rounded-xl bg-muted text-muted-foreground font-black text-xs flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div>
                    <div className="text-xs font-black text-foreground">{isRtl ? "كود وكلمة مرور مؤقتة" : "Author Code & Temp Key"}</div>
                    <div className="text-[10px] text-muted-foreground font-bold">{isRtl ? "إصدار فوري بعد الإرسال" : "Instant Generation"}</div>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-card/60 border border-border/70 flex items-center gap-3 opacity-80">
                  <div className="w-7 h-7 rounded-xl bg-muted text-muted-foreground font-black text-xs flex items-center justify-center shrink-0">
                    3
                  </div>
                  <div>
                    <div className="text-xs font-black text-foreground">{isRtl ? "اعتماد وبدء النشر" : "Publishing & Royalties"}</div>
                    <div className="text-[10px] text-muted-foreground font-bold">{isRtl ? "دار عبيد للنشر والتوزيع" : "Dar Obeid Editorial"}</div>
                  </div>
                </div>
              </div>

              {/* Guarantee highlights */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-[11px] font-bold text-muted-foreground">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-card border border-border/60 shadow-xs">
                  <span className="text-amber-500 font-black">✓</span> {isRtl ? "عوائد 70% للنسخ الرقمية" : "70% Digital Royalties"}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-card border border-border/60 shadow-xs">
                  <span className="text-amber-500 font-black">✓</span> {isRtl ? "30% صافي أرباح المطبوع دون أعباء" : "30% Print Net Profit"}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-card border border-border/60 shadow-xs">
                  <span className="text-amber-500 font-black">✓</span> {isRtl ? "ترقيم دولي ISBN وإيداع رسمي" : "Official ISBN & Legal Deposit"}
                </span>
              </div>
            </div>
          )}

          {/* Success Account Created State (Temporary Password Prompt) */}
          {generatedAccount ? (
            <Card className="border-2 border-amber-500/40 shadow-2xl bg-card rounded-3xl overflow-hidden animate-fade-in">
              <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 p-6 text-white text-center">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                  <CheckCircle2 className="w-9 h-9 text-white" />
                </div>
                <h2 className="text-2xl font-black">{isRtl ? "تم إنشاء حساب المؤلف بنجاح!" : "Author Account Created!"}</h2>
                <p className="text-xs sm:text-sm text-white/90 mt-1">
                  {isRtl ? "مرحباً بكم في منظومة نشر. تم إصدار كود المؤلف وكلمة المرور المؤقتة." : "Welcome to Nashr. Your author code & temp password are ready."}
                </p>
              </div>

              <CardContent className="p-6 sm:p-8 space-y-6">
                {/* Author Info summary */}
                <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 space-y-3">
                  <div className="flex items-center gap-3 pb-2 border-b border-border/60">
                    {generatedAccount.profile.avatarUrl ? (
                      <img 
                        src={generatedAccount.profile.avatarUrl} 
                        alt="Author Avatar" 
                        className="w-12 h-12 rounded-full object-cover border-2 border-amber-500 shadow-sm"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400 font-bold flex items-center justify-center text-lg">
                        ✍️
                      </div>
                    )}
                    <div>
                      <span className="text-sm font-black text-foreground block">{generatedAccount.profile.fullName}</span>
                      <span className="text-xs text-muted-foreground">{generatedAccount.profile.specialization}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground">{isRtl ? "كود المؤلف المعتمد:" : "Author Code:"}</span>
                    <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 font-black text-xs px-2.5 py-0.5">
                      {generatedAccount.profile.authorCode}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground">{isRtl ? "البريد الإلكتروني:" : "Email:"}</span>
                    <span className="text-xs font-bold text-foreground">{generatedAccount.profile.email}</span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-border/40">
                    <span className="text-xs font-bold text-muted-foreground">{isRtl ? "المستندات المرفقة:" : "Attached Documents:"}</span>
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                      <span>{isRtl ? "الهوية والمؤهلات (تخضع للمراجعة والتدقيق)" : "Credentials Uploaded (Under Review)"}</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-0.5">
                    <span className="text-xs font-bold text-muted-foreground">{isRtl ? "حالة اعتماد الحساب:" : "Account Status:"}</span>
                    <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 text-xs font-black px-2.5 py-0.5">
                      {isRtl ? "قيد التدقيق والمراجعة من المنصة" : "Pending Platform Review"}
                    </Badge>
                  </div>
                </div>

                {/* Temporary Password Highlight Box */}
                <div className="p-5 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 space-y-3">
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-xs">
                    <Key className="w-4 h-4" />
                    <span>{isRtl ? "كلمة المرور المؤقتة الخاصة بحسابكم (احفظها الآن):" : "Your Temporary Password (Save it now):"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input 
                      readOnly 
                      value={generatedAccount.tempPassword} 
                      className="font-mono font-black text-lg sm:text-xl text-center tracking-widest bg-background border-amber-500/40 text-foreground h-12 rounded-xl"
                    />
                    <Button 
                      type="button" 
                      onClick={handleCopyPassword}
                      variant="outline" 
                      className="h-12 px-4 rounded-xl border-amber-500/40 hover:bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold gap-1.5 shrink-0"
                    >
                      {copiedPass ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                      <span className="text-xs">{copiedPass ? (isRtl ? "تم النسخ" : "Copied") : (isRtl ? "نسخ" : "Copy")}</span>
                    </Button>
                  </div>
                  <div className="flex items-start gap-2 text-[11px] text-muted-foreground leading-relaxed pt-1">
                    <Info className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <span>
                      {isRtl 
                        ? "تم إنشاء هذا الحساب بكلمة مرور مؤقتة لراحتكم وأمانكم. ستتمكن من تغييرها فوراً بكلمة مرور دائمة. تنبيه: حتى وإن قمت بتغيير كلمة المرور المؤقتة، سيبقى الحساب تحت المراجعة والتدقيق حتى تصدر موافقة إدارة المنصة."
                        : "Your account is created with a temporary password. You can update it anytime. Note: even after updating your temporary password, the account remains under review until officially approved."}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <Button 
                    onClick={proceedToDashboard}
                    size="lg" 
                    className="w-full h-12 rounded-2xl font-black text-base bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white shadow-xl shadow-amber-500/25 gap-2 hover:scale-[1.01] transition-all"
                  >
                    <BookOpen className="w-5 h-5" />
                    <span>{isRtl ? "الدخول إلى لوحة تحكم المؤلف واستوديو النشر ➔" : "Enter Author Dashboard & Studio ➔"}</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Registration Form */
            <Card className="border-2 border-border/70 shadow-2xl bg-card rounded-3xl overflow-hidden">
              <CardHeader className="pb-4 border-b border-border/50 bg-muted/20">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                    ✍️
                  </div>
                  <div>
                    <CardTitle className="text-lg font-black text-foreground">
                      {isRtl ? "بيانات المؤلف والمستندات الرسمية" : "Author Profile & Verification Documents"}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {isRtl ? "تظهر هذه البيانات على أغلفة ومقدمات مؤلفاتكم وعقود النشر وكشوف المبيعات الرسمية" : "These details appear on book covers, publishing contracts & sales rosters"}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6 sm:p-8">
                <form onSubmit={handleSignup} className="space-y-6">
                  
                  {/* Row 1: Academic Title & Full Name */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-extrabold flex items-center gap-1">
                        <span>{isRtl ? "اللقب العلمي / المهني" : "Academic Title"}</span>
                        <span className="text-destructive">*</span>
                      </Label>
                      <Select value={academicTitle} onValueChange={(v) => setAcademicTitle(v as AcademicTitle)}>
                        <SelectTrigger className="h-11 rounded-xl font-bold text-xs border-border bg-muted/30">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ACADEMIC_TITLES.map((title) => (
                            <SelectItem key={title.value} value={title.value} className="text-xs font-bold">
                              {isRtl ? title.labelAr : title.labelEn}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="sm:col-span-2 space-y-1.5">
                      <Label className="text-xs font-extrabold flex items-center gap-1">
                        <span>{isRtl ? "الاسم الكامل للمؤلف (ثلاثي أو رباعي)" : "Author Full Name"}</span>
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input 
                        placeholder={isRtl ? "مثال: عبد الرحمن أحمد المنشاوي" : "e.g. Abdulrahman Ahmed El-Minshawy"}
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        className="h-11 rounded-xl text-xs sm:text-sm font-semibold border-border bg-muted/30 focus:bg-background focus:border-amber-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Row 2: Specialization & Institution */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-extrabold flex items-center gap-1">
                        <span>{isRtl ? "التخصص والمجال المعرفي" : "Specialization"}</span>
                        <span className="text-destructive">*</span>
                      </Label>
                      <Select value={specialization} onValueChange={(v) => setSpecialization(v)}>
                        <SelectTrigger className="h-11 rounded-xl font-semibold text-xs border-border bg-muted/30">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SPECIALIZATIONS.map((spec) => (
                            <SelectItem key={spec} value={spec} className="text-xs">
                              {spec}
                            </SelectItem>
                          ))}
                          <SelectItem value="other" className="text-xs font-bold text-amber-600">
                            {isRtl ? "مجال تخصصي آخر..." : "Other specialization..."}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      {specialization === "other" && (
                        <Input 
                          placeholder={isRtl ? "اكتب تخصصك الدقيق هنا..." : "Enter custom specialization..."}
                          value={customSpecialization}
                          onChange={(e) => setCustomSpecialization(e.target.value)}
                          className="h-10 mt-1.5 rounded-xl text-xs border-border"
                          required
                        />
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-extrabold flex items-center gap-1">
                        <span>{isRtl ? "الجامعة / الكلية / جهة العمل" : "Institution / University"}</span>
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input 
                        placeholder={isRtl ? "مثال: جامعة القاهرة - كلية الآداب" : "e.g. Cairo University - Faculty of Arts"}
                        value={institution}
                        onChange={(e) => setInstitution(e.target.value)}
                        required
                        className="h-11 rounded-xl text-xs sm:text-sm font-semibold border-border bg-muted/30 focus:bg-background focus:border-amber-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Row 3: Email & Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-extrabold flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>{isRtl ? "البريد الإلكتروني الرسمي" : "Email Address"}</span>
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input 
                        type="email"
                        placeholder="author@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="h-11 rounded-xl text-xs sm:text-sm font-semibold border-border bg-muted/30 focus:bg-background focus:border-amber-500 transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-extrabold flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>{isRtl ? "رقم الهاتف / الواتساب" : "Phone / WhatsApp"}</span>
                        <span className="text-destructive">*</span>
                      </Label>
                      <div className="flex gap-2">
                        <Select value={countryCode} onValueChange={setCountryCode}>
                          <SelectTrigger className="w-[100px] h-11 rounded-xl font-bold text-xs border-border bg-muted/30 shrink-0">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="+20">🇪🇬 +20</SelectItem>
                            <SelectItem value="+966">🇸🇦 +966</SelectItem>
                            <SelectItem value="+971">🇦🇪 +971</SelectItem>
                            <SelectItem value="+965">🇰🇼 +965</SelectItem>
                            <SelectItem value="+974">🇶🇦 +974</SelectItem>
                            <SelectItem value="+968">🇴🇲 +968</SelectItem>
                            <SelectItem value="+962">🇯🇴 +962</SelectItem>
                            <SelectItem value="+964">🇮🇶 +964</SelectItem>
                            <SelectItem value="+1">🇺🇸 +1</SelectItem>
                            <SelectItem value="+44">🇬🇧 +44</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input 
                          type="tel"
                          placeholder="01012345678"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          required
                          className="h-11 flex-1 rounded-xl text-xs sm:text-sm font-semibold border-border bg-muted/30 focus:bg-background focus:border-amber-500 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* ------------------------------------------------------------- */}
                  {/* SECTION: Document Uploads (Photo, National ID, Qualifications) */}
                  {/* ------------------------------------------------------------- */}
                  <div className="pt-3 border-t border-border/70 space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs">
                          📎
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-foreground">
                            {isRtl ? "المستندات والوثائق الرسمية للمؤلف" : "Author Verification Documents"}
                          </h3>
                          <p className="text-[11px] text-muted-foreground font-medium">
                            {isRtl 
                              ? "جميع الوثائق أدناه إلزامية لتوثيق الهوية والرتبة العلمية واعتماد الحساب من دار عبيد"
                              : "All verification documents below are mandatory for official Dar Obeid approval"}
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-[10px] font-black px-2.5 py-1">
                        {isRtl ? "مستندات توثيق إلزامية *" : "Mandatory Documents *"}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      {/* Upload 1: Personal Photo */}
                      <div className="p-4 rounded-2xl bg-muted/20 border-2 border-dashed border-border/80 hover:border-amber-500/50 transition-all space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-black flex items-center gap-1.5 text-foreground cursor-pointer">
                            <Camera className="w-4 h-4 text-amber-500" />
                            <span>{isRtl ? "1. الصورة الشخصية للمؤلف" : "1. Personal Profile Photo"}</span>
                            <span className="text-destructive font-black">*</span>
                          </Label>
                          {avatarFile && (
                            <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-bold">
                              {isRtl ? "تم الإرفاق" : "Attached"}
                            </Badge>
                          )}
                        </div>

                        <input 
                          type="file" 
                          ref={avatarInputRef}
                          accept="image/*" 
                          onChange={handleAvatarSelect}
                          className="hidden" 
                        />

                        {avatarFile ? (
                          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-card border border-border">
                            <img 
                              src={avatarFile.url} 
                              alt="Avatar Preview" 
                              className="w-14 h-14 rounded-xl object-cover border border-amber-500/40 shadow-xs shrink-0" 
                            />
                            <div className="flex-1 min-w-0">
                              <span className="text-xs font-bold text-foreground block truncate">{avatarFile.name}</span>
                              <span className="text-[10px] text-muted-foreground font-semibold">{avatarFile.size}</span>
                            </div>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              onClick={() => setAvatarFile(null)}
                              className="w-8 h-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <div 
                            onClick={() => avatarInputRef.current?.click()}
                            className="cursor-pointer py-4 px-3 rounded-xl bg-background/50 hover:bg-amber-500/5 flex flex-col items-center justify-center gap-1.5 text-center transition-all group"
                          >
                            <div className="w-10 h-10 rounded-full bg-amber-500/10 group-hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center transition-transform group-hover:scale-110">
                              <Upload className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-bold text-foreground group-hover:text-amber-600 transition-colors">
                              {isRtl ? "اختر صورة شخصية أو التقط صورة" : "Upload Personal Photo"}
                            </span>
                            <span className="text-[10px] text-muted-foreground">PNG, JPG, WebP (حتى 5MB)</span>
                          </div>
                        )}
                      </div>

                      {/* Upload 2: National ID / Passport */}
                      <div className="p-4 rounded-2xl bg-muted/20 border-2 border-dashed border-border/80 hover:border-amber-500/50 transition-all space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-black flex items-center gap-1.5 text-foreground cursor-pointer">
                            <ShieldCheck className="w-4 h-4 text-rose-500" />
                            <span>{isRtl ? "2. صورة الهوية / بطاقة الرقم القومي" : "2. National ID / Passport Photo"}</span>
                            <span className="text-destructive font-black">*</span>
                          </Label>
                          {nationalIdFile && (
                            <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-bold">
                              {isRtl ? "تم الإرفاق" : "Attached"}
                            </Badge>
                          )}
                        </div>

                        <input 
                          type="file" 
                          ref={nationalIdInputRef}
                          accept="image/*,.pdf" 
                          onChange={handleNationalIdSelect}
                          className="hidden" 
                        />

                        {nationalIdFile ? (
                          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-card border border-border">
                            <img 
                              src={nationalIdFile.url} 
                              alt="National ID Preview" 
                              className="w-14 h-14 rounded-xl object-cover border border-rose-500/40 shadow-xs shrink-0" 
                            />
                            <div className="flex-1 min-w-0">
                              <span className="text-xs font-bold text-foreground block truncate">{nationalIdFile.name}</span>
                              <span className="text-[10px] text-muted-foreground font-semibold">{nationalIdFile.size}</span>
                            </div>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              onClick={() => setNationalIdFile(null)}
                              className="w-8 h-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <div 
                            onClick={() => nationalIdInputRef.current?.click()}
                            className="cursor-pointer py-4 px-3 rounded-xl bg-background/50 hover:bg-rose-500/5 flex flex-col items-center justify-center gap-1.5 text-center transition-all group"
                          >
                            <div className="w-10 h-10 rounded-full bg-rose-500/10 group-hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center transition-transform group-hover:scale-110">
                              <Upload className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-bold text-foreground group-hover:text-rose-600 transition-colors">
                              {isRtl ? "رفع صورة بطاقة الهوية أو جواز السفر" : "Upload ID / Passport"}
                            </span>
                            <span className="text-[10px] text-muted-foreground">صورة واضحة للوجهين أو الجواز</span>
                          </div>
                        )}
                      </div>

                    </div>

                    {/* Upload 3: Academic Qualifications (Supports Multiple Photos) */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-muted/20 border-2 border-dashed border-border/80 hover:border-amber-500/50 transition-all space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-black flex items-center gap-1.5 text-foreground cursor-pointer">
                          <GraduationCap className="w-4 h-4 text-purple-500" />
                          <span>{isRtl ? "3. صورة المؤهل الأكاديمي والشهادات (صورة أو عدة صور)" : "3. Academic Qualification(s) & Degree Certificates"}</span>
                          <span className="text-destructive font-black">*</span>
                        </Label>
                        {qualificationFiles.length > 0 && (
                          <Badge className="bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30 text-[10px] font-black">
                            {isRtl ? `${qualificationFiles.length} مستندات مرفقة` : `${qualificationFiles.length} Files`}
                          </Badge>
                        )}
                      </div>

                      <input 
                        type="file" 
                        ref={qualificationInputRef}
                        accept="image/*,.pdf" 
                        multiple
                        onChange={handleQualificationSelect}
                        className="hidden" 
                      />

                      {/* Upload Button Box */}
                      <div 
                        onClick={() => qualificationInputRef.current?.click()}
                        className="cursor-pointer py-3.5 px-4 rounded-xl bg-background/60 hover:bg-purple-500/5 border border-border flex items-center justify-between transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-purple-500/10 group-hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center transition-transform group-hover:scale-105">
                            <Plus className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-foreground block group-hover:text-purple-600 transition-colors">
                              {isRtl ? "إضافة صور شهادة البكالوريوس / الماجستير / الدكتوراه" : "Add Degree / Certificate Images"}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {isRtl ? "يمكنك اختيار صورة واحدة أو تحديد عدة صور معاً" : "Select one or multiple degree photos simultaneously"}
                            </span>
                          </div>
                        </div>

                        <Button type="button" size="sm" variant="outline" className="h-8 text-xs font-bold gap-1 rounded-lg border-purple-500/30 text-purple-600 dark:text-purple-400">
                          <Upload className="w-3.5 h-3.5" />
                          <span>{isRtl ? "إرفاق صور" : "Upload"}</span>
                        </Button>
                      </div>

                      {/* Uploaded Qualifications Gallery */}
                      {qualificationFiles.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-2">
                          {qualificationFiles.map((qf, i) => (
                            <div 
                              key={qf.id} 
                              className="flex items-center gap-2.5 p-2 rounded-xl bg-card border border-border/80 shadow-xs relative group"
                            >
                              <img 
                                src={qf.url} 
                                alt={qf.name} 
                                className="w-11 h-11 rounded-lg object-cover border border-border shrink-0" 
                              />
                              <div className="flex-1 min-w-0">
                                <span className="text-[11px] font-bold text-foreground block truncate">{qf.name}</span>
                                <span className="text-[9px] text-muted-foreground">{qf.size}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeQualification(qf.id)}
                                className="w-6 h-6 rounded-md bg-destructive/10 text-destructive hover:bg-destructive hover:text-white flex items-center justify-center transition-colors shrink-0"
                                title="حذف"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                    </div>

                  </div>

                  {/* Bio / Publications Summary */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-extrabold flex items-center gap-1">
                      <span>{isRtl ? "نبذة تعريفية وسيرة ذاتية مختصرة للمؤلف" : "Author Bio & Research Interests"}</span>
                      <span className="text-[10px] text-muted-foreground">({isRtl ? "اختياري" : "Optional"})</span>
                    </Label>
                    <Textarea 
                      placeholder={isRtl 
                        ? "أستاذ باحث، مؤلف للعديد من الأبحاث والكتب المنشورة في مجال..." 
                        : "Author and researcher with published works in..."}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={2}
                      className="rounded-xl text-xs border-border bg-muted/30 focus:bg-background focus:border-amber-500 transition-all"
                    />
                  </div>

                  {/* ------------------------------------------------------------- */}
                  {/* SECTION: Terms & Conditions Agreement */}
                  {/* ------------------------------------------------------------- */}
                  <div className="p-4 rounded-2xl bg-amber-500/5 border-2 border-amber-500/20 space-y-3">
                    <div className="flex items-start gap-3">
                      <Checkbox 
                        id="terms-nashr"
                        checked={agreedToTerms}
                        onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                        className="mt-1 data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600 rounded-md"
                      />
                      <label 
                        htmlFor="terms-nashr" 
                        className="text-xs leading-relaxed text-foreground cursor-pointer select-none font-medium"
                      >
                        {isRtl ? (
                          <>
                            <span className="font-extrabold text-foreground">الموافقة على الشروط والأحكام: </span>
                            أقر وأوافق على الالتزام بـ{" "}
                            <Link to="/terms" target="_blank" className="font-bold text-amber-600 dark:text-amber-400 underline hover:text-amber-700">
                              الشروط والأحكام
                            </Link>{" "}
                            و{" "}
                            <Link to="/privacy" target="_blank" className="font-bold text-amber-600 dark:text-amber-400 underline hover:text-amber-700">
                              سياسة الخصوصية
                            </Link>{" "}
                            الخاصة بمنظومة UNIGATES ومنصة نشر وإشراف دار عبيد للنشر والتوزيع، وأتعهد بصحة كافة البيانات والمستندات المرفقة.
                          </>
                        ) : (
                          <>
                            <span className="font-extrabold text-foreground">Terms & Conditions Agreement: </span>
                            I have read and agree to the{" "}
                            <Link to="/terms" target="_blank" className="font-bold text-amber-600 dark:text-amber-400 underline hover:text-amber-700">
                              Terms & Conditions
                            </Link>{" "}
                            and{" "}
                            <Link to="/privacy" target="_blank" className="font-bold text-amber-600 dark:text-amber-400 underline hover:text-amber-700">
                              Privacy Policy
                            </Link>{" "}
                            of UNIGATES & Nashr Publishing under Dar Obeid.
                          </>
                        )}
                      </label>
                    </div>
                  </div>

                  {/* Notice Box about Temporary Password */}
                  <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 flex items-start gap-3">
                    <Key className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="text-xs text-muted-foreground leading-relaxed space-y-1">
                      <p className="font-bold text-foreground">
                        {isRtl ? "نظام الأمان وكلمة المرور المؤقتة:" : "Security & Temporary Password System:"}
                      </p>
                      <p>
                        {isRtl 
                          ? "سيتم إنشاء حسابكم فوراً وتزويدكم بكلمة مرور مؤقتة وكود مؤلف حصري، وتستطيعون تعديل كلمة المرور في أي وقت من إعدادات الحساب."
                          : "Your account will be generated with a temporary password and author code, which can be modified at any time."}
                      </p>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button 
                    type="submit" 
                    disabled={loading || !agreedToTerms}
                    size="lg"
                    className="w-full h-12 rounded-2xl font-black text-sm sm:text-base bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white shadow-xl shadow-amber-500/25 gap-2 hover:scale-[1.01] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>{isRtl ? "جاري إنشاء حساب المؤلف والمستندات..." : "Creating Author Profile..."}</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        <span>{isRtl ? "إنشاء حساب المؤلف واستلام كلمة المرور ➔" : "Create Author Account & Get Password ➔"}</span>
                      </>
                    )}
                  </Button>

                  <div className="text-center pt-1">
                    <p className="text-xs text-muted-foreground font-medium">
                      {isRtl ? "لديك حساب مؤلف بالفعل؟" : "Already have an author account?"}{" "}
                      <Link to="/nashr/login" className="font-bold text-amber-600 dark:text-amber-400 hover:underline">
                        {isRtl ? "تسجيل دخول المؤلفين" : "Author Login"}
                      </Link>
                    </p>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

        </div>
      </main>
    </div>
  );
};

export default NasherSignup;
