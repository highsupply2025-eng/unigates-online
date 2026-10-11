import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage, ALL_SUPPORTED_LANGUAGES, type Language } from "@/contexts/LanguageContext";
import { useTheme } from "next-themes";
import { useToast } from "@/hooks/use-toast";
import {
  User,
  Camera,
  Key,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  GraduationCap,
  Calendar,
  Lock,
  Eye,
  EyeOff,
  UploadCloud,
  FileText,
  Wallet,
  Save,
  Check,
  Download,
  ExternalLink,
  Sparkles,
  AlertTriangle,
  PenTool,
  Home,
  BookOpen,
  CreditCard,
  MessageSquare,
  Bell,
  TrendingUp,
  Globe,
  Sun,
  Moon,
  SunMoon,
  Monitor,
  ChevronDown,
  LogOut,
  FileSignature
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { AuthorProfile, AcademicTitle, AuthorContract } from "@/types/nashr";
import { NashrDataStore, generateSampleAuthorAvatarSvg } from "@/services/nashrDataStore";
import { NashrFileStore } from "@/services/nashrFileStore";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageSelectorDropdown from "@/components/LanguageSelectorDropdown";

const ACADEMIC_TITLES: { value: AcademicTitle; labelAr: string; labelEn: string }[] = [
  { value: "prof", labelAr: "أستاذ دكتور (أ.د)", labelEn: "Professor (Prof. Dr.)" },
  { value: "dr", labelAr: "دكتور (د.)", labelEn: "Doctor (Dr.)" },
  { value: "lecturer", labelAr: "أستاذ مساعد / مدرس", labelEn: "Associate Prof. / Lecturer" },
  { value: "researcher", labelAr: "باحث أكاديمي / زميل بحثي", labelEn: "Academic Researcher" },
  { value: "author", labelAr: "مؤلف / كاتب متخصص", labelEn: "Specialized Author" },
  { value: "expert", labelAr: "خبير استشاري ومحكم", labelEn: "Consultant & Peer Reviewer" },
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

const NasherProfilePage = () => {
  const { dir, language, setLanguage } = useLanguage();
  const isRtl = dir === "rtl";
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Load live profile from NashrDataStore
  const [profile, setProfile] = useState<AuthorProfile>(NashrDataStore.getAuthorProfile());
  const [avatarUrl, setAvatarUrl] = useState<string>(profile.avatarUrl || "");
  const [submissions, setSubmissions] = useState(() => NashrDataStore.getSubmissions());
  const [messages, setMessages] = useState(() => NashrDataStore.getMessages());
  const [contracts, setContracts] = useState<AuthorContract[]>(() => NashrDataStore.getContracts("auth-current"));
  const isUnderReview = profile.verificationStatus === "pending_review";

  useEffect(() => {
    const current = NashrDataStore.getAuthorProfile();
    setProfile(current);
    setSubmissions(NashrDataStore.getSubmissions());
    setMessages(NashrDataStore.getMessages());
    setContracts(NashrDataStore.getContracts("auth-current"));
    document.title = isRtl ? "البيانات الشخصية | لوحة تحكم المؤلف - منصة نشر UNIGATES" : "Personal Profile | Author Dashboard - UNIGATES";

    // Asynchronously resolve avatar from IndexedDB, direct URL, or fallback
    NashrDataStore.resolveAuthorAvatar(current).then((resolved) => {
      if (resolved) setAvatarUrl(resolved);
    });
  }, [isRtl]);

  // Editable Form states
  const [fullName, setFullName] = useState(profile.fullName || "");
  const [academicTitle, setAcademicTitle] = useState<AcademicTitle>(profile.academicTitle || "dr");
  const [specialization, setSpecialization] = useState(profile.specialization || SPECIALIZATIONS[0]);
  const [institution, setInstitution] = useState(profile.institution || "");
  const [email, setEmail] = useState(profile.email || "");
  const [phone, setPhone] = useState(profile.phone || "");
  const [bio, setBio] = useState(profile.bio || "");

  // Bank & Payout info
  const [accountHolder, setAccountHolder] = useState(profile.bankDetails?.accountHolder || profile.fullName || "");
  const [bankName, setBankName] = useState(profile.bankDetails?.bankName || "البنك الأهلي المصري");
  const [ibanOrAccount, setIbanOrAccount] = useState(profile.bankDetails?.ibanOrAccount || "");
  const [electronicWallet, setElectronicWallet] = useState(profile.bankDetails?.electronicWallet || "");

  // Password Change state (Merged into this dedicated page)
  const [currentPasswordInput, setCurrentPasswordInput] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [isMenuLanguageOpen, setIsMenuLanguageOpen] = useState(false);
  const [isMenuThemeOpen, setIsMenuThemeOpen] = useState(false);

  // Document preview modal
  const [previewDoc, setPreviewDoc] = useState<{ url: string; title: string } | null>(null);

  // File input refs for uploading replacement / additional verification documents
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const nationalIdInputRef = useRef<HTMLInputElement>(null);
  const qualInputRef = useRef<HTMLInputElement>(null);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);

    const titleObj = ACADEMIC_TITLES.find((t) => t.value === academicTitle);
    const updated: AuthorProfile = {
      ...profile,
      fullName: fullName.trim(),
      academicTitle,
      academicTitleLabel: isRtl ? (titleObj?.labelAr || "دكتور") : (titleObj?.labelEn || "Doctor"),
      specialization: specialization.trim(),
      institution: institution.trim(),
      email: email.trim(),
      phone: phone.trim(),
      bio: bio.trim(),
      bankDetails: {
        accountHolder: accountHolder.trim() || fullName.trim(),
        bankName: bankName.trim(),
        ibanOrAccount: ibanOrAccount.trim(),
        electronicWallet: electronicWallet.trim()
      }
    };

    NashrDataStore.saveAuthorProfile(updated);
    setProfile(updated);
    setSavingProfile(false);

    toast({
      title: isRtl ? "✅ تم حفظ البيانات الشخصية بنجاح" : "Profile Updated Successfully",
      description: isRtl ? "تم تحديث كافة بياناتك المعتمدة وحفظها في قاعدة بيانات دار عبيد." : "Your profile records are securely updated."
    });
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast({
        title: isRtl ? "كلمة المرور قصيرة" : "Short Password",
        description: isRtl ? "يجب أن تكون كلمة المرور 6 خانات على الأقل." : "Password must be at least 6 characters.",
        variant: "destructive"
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: isRtl ? "كلمات المرور غير متطابقة" : "Passwords Do Not Match",
        description: isRtl ? "يرجى التأكد من تطابق كلمة المرور الجديدة وتأكيدها." : "Please verify your new password match.",
        variant: "destructive"
      });
      return;
    }

    setSavingPassword(true);
    NashrDataStore.updatePassword(newPassword);
    const refreshed = NashrDataStore.getAuthorProfile();
    setProfile(refreshed);
    setSavingPassword(false);
    setNewPassword("");
    setConfirmPassword("");
    setCurrentPasswordInput("");

    toast({
      title: isRtl ? "🔐 تم تغيير كلمة المرور بنجاح!" : "Password Changed Successfully!",
      description: isUnderReview
        ? (isRtl 
            ? "تم تحديث كلمة المرور. تنبيه: يبقى الحساب تحت المراجعة والتدقيق لحين صدور الموافقة الرسمية من المنصة."
            : "Password updated. Account remains under administrative review.")
        : (isRtl 
            ? "تم تأمين حسابك بكلمة المرور الجديدة بنجاح." 
            : "Your account is secured with your new permanent password.")
    });
  };

  const handleNationalIdUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      const updated: AuthorProfile = {
        ...profile,
        nationalIdUrl: dataUrl,
        nationalIdName: file.name,
        nationalIdSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      };
      NashrDataStore.saveAuthorProfile(updated);
      setProfile(updated);
      toast({
        title: isRtl ? "تم تحديث مستند الهوية الوطنية" : "National ID Updated",
        description: isRtl ? "تم حفظ المستند الجديد وإرفاقه بملف التحقق." : "New document attached."
      });
    };
    reader.readAsDataURL(file);
  };

  const handleQualUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const existingDocs = profile.qualificationDocuments || [];
    if (existingDocs.length >= 20) {
      toast({
        title: isRtl ? "تم الوصول للحد الأقصى (20 ملف)" : "Maximum Limit Reached (20 Files)",
        description: isRtl 
          ? "تتسع قائمة المؤهلات حتى 20 ملفاً لشهادات البكالوريوس والماجستير والدكتوراه." 
          : "Maximum 20 qualification documents allowed.",
        variant: "destructive"
      });
      if (e.target) e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      const newDocId = `qual-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const newDoc = {
        id: newDocId,
        name: file.name,
        url: dataUrl,
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        type: "CERTIFICATE"
      };

      // Persist in IndexedDB
      await NashrFileStore.saveFile(newDocId, dataUrl);

      const updatedDocs = [...existingDocs, newDoc];
      const updated: AuthorProfile = {
        ...profile,
        qualificationDocuments: updatedDocs,
        qualificationUrls: updatedDocs.map((d) => d.url)
      };

      NashrDataStore.saveAuthorProfile(updated);
      setProfile(updated);
      toast({
        title: isRtl 
          ? `تمت إضافة الشهادة والمؤهل الأكاديمي (${updatedDocs.length} / 20)`
          : `Degree Certificate Added (${updatedDocs.length} / 20)`,
        description: isRtl ? "تم إدراج المستند في قائمة المؤهلات المعتمدة بنجاح." : "Certificate attached successfully."
      });
      if (e.target) e.target.value = "";
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setAvatarUrl(dataUrl);

      // Persist to IndexedDB
      await NashrFileStore.saveFile(`av-${profile.id}`, dataUrl);

      const updated: AuthorProfile = {
        ...profile,
        avatarUrl: dataUrl,
        avatarName: file.name
      };

      NashrDataStore.saveAuthorProfile(updated);
      setProfile(updated);

      toast({
        title: isRtl ? "✅ تم تحديث الصورة الشخصية بنجاح" : "Profile Photo Updated",
        description: isRtl ? "تم حفظ صورتك الشخصية واعتمادها في ملفك الأكاديمي." : "Your profile image is updated successfully."
      });
      if (e.target) e.target.value = "";
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-amber-500 selection:text-white" dir={dir}>
      
      {/* Top Header Navbar */}
      <header className="border-b border-border/40 px-4 sm:px-8 py-3.5 bg-card/70 backdrop-blur-xl sticky top-0 z-50 flex items-center justify-between">
        <Link to="/nashr/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 via-orange-600 to-rose-600 p-0.5 shadow-md flex items-center justify-center text-white group-hover:scale-105 transition-all">
            <PenTool className="w-5 h-5" />
          </div>
          <div className="text-start">
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-black text-foreground">UNIGATES</span>
              <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px] font-bold px-1.5 py-0">
                {isRtl ? "منصة نشر" : "Nashr Studio"}
              </Badge>
            </div>
            <span className="text-[10px] block font-bold text-muted-foreground transition-all duration-300">
              {isRtl ? "لوحة تحكم المؤلف • البيانات الشخصية" : "Author Dashboard • Personal Profile"}
            </span>
          </div>
        </Link>

        {/* User Badge & Fast Actions (Requested Order: السطوع -> تغيير اللغة -> القائمة المنسدلة) */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* 1. السطوع (Theme Toggle) */}
          <ThemeToggle className="h-10 w-10 p-0 rounded-2xl bg-card/90 hover:bg-muted border-2 border-border/80 shadow-xs" />

          {/* 2. تغيير اللغة (Language Selector) */}
          <LanguageSelectorDropdown className="h-10 px-3 text-xs bg-card/90 hover:bg-muted border-2 border-border/80 rounded-2xl font-black text-foreground tracking-wide shadow-xs" />

          {/* 3. القائمة المنسدلة (Dropdown Menu - 3 Horizontal Lines) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="group relative flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 text-white hover:from-amber-600 hover:via-orange-600 hover:to-rose-600 active:scale-95 transition-all duration-300 shadow-md shadow-amber-500/25 hover:shadow-lg hover:shadow-amber-500/40 border-2 border-white/20 outline-none focus:outline-none cursor-pointer shrink-0"
                aria-label={isRtl ? "قائمة المؤلف والخدمات" : "Author Studio Menu"}
                title={isRtl ? "القائمة الرئيسية لحساب المؤلف" : "Author Account Menu"}
              >
                {/* Ambient glow */}
                <div className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                {/* 3 Horizontal Lines (Burger Menu) */}
                <div className="flex flex-col items-center justify-center gap-1 w-5 h-5">
                  <span className="w-4 h-0.5 bg-white rounded-full transition-all duration-300 group-hover:w-5 shadow-xs" />
                  <span className="w-5 h-0.5 bg-white rounded-full transition-all duration-300 shadow-xs" />
                  <span className="w-3.5 h-0.5 bg-white rounded-full transition-all duration-300 group-hover:w-5 shadow-xs" />
                </div>

                {/* Notification Ping if review notes or unread messages exist */}
                {(submissions.some(s => s.adminFeedback) || messages.filter(m => m.sender === "admin" && !m.read).length > 0) && (
                  <span className="absolute -top-1 -end-1 w-3 h-3 rounded-full bg-rose-500 border-2 border-background animate-pulse" />
                )}
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent 
              align={isRtl ? "start" : "end"} 
              className="w-80 sm:w-88 max-h-[85vh] overflow-y-auto rounded-3xl p-2.5 shadow-2xl border-2 border-border/80 bg-popover/95 backdrop-blur-xl space-y-1 z-50 font-sans"
              dir={dir}
            >
              {/* Account Header in Dropdown */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-rose-500/15 border-2 border-amber-500/30 text-start space-y-2 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-rose-600 text-white flex items-center justify-center shrink-0 overflow-hidden border border-white/30 shadow-sm">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={profile.fullName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg">👤</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="text-sm font-black text-foreground truncate tracking-tight">{profile.fullName}</span>
                      <Badge className="bg-amber-500/25 text-amber-700 dark:text-amber-300 border-amber-500/40 text-[10px] font-mono font-black px-1.5 py-0 shadow-xs">
                        {profile.authorCode}
                      </Badge>
                    </div>
                    <p className="text-xs font-bold text-muted-foreground truncate">
                      {profile.academicTitleLabel} • {profile.specialization}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 pt-0.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-black">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isRtl ? "حساب معتمد وموثق رسمياً" : "Verified Author Account"}</span>
                </div>
              </div>

              <DropdownMenuSeparator className="my-1.5" />

              {/* 0. الصفحة الرئيسية (نظرة عامة والتحليلات البيانية) */}
              <DropdownMenuItem 
                onClick={() => navigate("/nashr/dashboard?tab=home")}
                className="rounded-xl px-3 py-2 text-xs font-black flex items-center justify-between cursor-pointer hover:bg-amber-500/10 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Home className="w-4 h-4" />
                  </div>
                  <span>{isRtl ? "الصفحة الرئيسية" : "Home & Overview"}</span>
                </div>
                <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40 text-[10px] font-black h-5">
                  {isRtl ? "الرئيسية 📊" : "Main"}
                </Badge>
              </DropdownMenuItem>

              {/* 1. رفع مؤلفات جديدة */}
              <DropdownMenuItem 
                onClick={() => navigate("/nashr/dashboard?tab=submit")}
                className="rounded-xl px-3 py-2 text-xs font-black flex items-center justify-between cursor-pointer hover:bg-amber-500/10 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-600 flex items-center justify-center shrink-0">
                    <UploadCloud className="w-4 h-4" />
                  </div>
                  <span>{isRtl ? "رفع مؤلفات جديدة" : "Submit New Manuscript"}</span>
                </div>
                <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-600 font-bold">
                  {isRtl ? "إرسال 📁" : "Upload"}
                </Badge>
              </DropdownMenuItem>

              {/* 2. المؤلفات المنشورة */}
              <DropdownMenuItem 
                onClick={() => navigate("/nashr/dashboard?tab=published")}
                className="rounded-xl px-3 py-2 text-xs font-black flex items-center justify-between cursor-pointer hover:bg-blue-500/10 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-600 flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <span>{isRtl ? "المؤلفات المنشورة" : "Published Works"}</span>
                </div>
                <Badge className="bg-blue-500 text-white text-[10px] h-5 px-1.5 font-bold">
                  {submissions.filter(s => s.status === "published").length}
                </Badge>
              </DropdownMenuItem>

              {/* 3. الفواتير وطرق الدفع */}
              <DropdownMenuItem 
                onClick={() => navigate("/nashr/dashboard?tab=payments")}
                className="rounded-xl px-3 py-2 text-xs font-black flex items-center justify-between cursor-pointer hover:bg-emerald-500/10 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <span>{isRtl ? "الفواتير وطرق الدفع" : "Invoices & Payments"}</span>
                </div>
                <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-600 font-bold">
                  {isRtl ? "سداد 💳" : "Pay"}
                </Badge>
              </DropdownMenuItem>

              {/* 4. التواصل وملاحظات التدقيق */}
              <DropdownMenuItem 
                onClick={() => navigate("/nashr/dashboard?tab=chat")}
                className="rounded-xl px-3 py-2 text-xs font-black flex items-center justify-between cursor-pointer hover:bg-purple-500/10 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/15 text-purple-600 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <span>{isRtl ? "التواصل وملاحظات التدقيق" : "Review Notes & Chat"}</span>
                </div>
                {messages.filter(m => m.sender === "admin" && !m.read).length > 0 && (
                  <Badge className="bg-purple-500 text-white text-[10px] h-5 px-1.5 font-bold">
                    {messages.filter(m => m.sender === "admin" && !m.read).length}
                  </Badge>
                )}
              </DropdownMenuItem>

              {/* 5. ملاحظات جديدة */}
              <DropdownMenuItem 
                onClick={() => navigate("/nashr/notes")}
                className="rounded-xl px-3 py-2 text-xs font-black flex items-center justify-between cursor-pointer bg-amber-500/10 text-amber-800 dark:text-amber-300 hover:bg-amber-500/20 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
                    <Bell className="w-4 h-4 animate-bounce" />
                  </div>
                  <span>{isRtl ? "ملاحظات جديدة" : "New Review Notes"}</span>
                </div>
                <Badge className="bg-gradient-to-r from-amber-500 to-rose-600 text-white text-[10px] h-5 px-2 font-black shadow-xs">
                  {submissions.filter(s => s.adminFeedback).length > 0 
                    ? (isRtl ? "واردة 🔥" : "Active 🔥") 
                    : (isRtl ? "محدثة" : "Updated")}
                </Badge>
              </DropdownMenuItem>

              {/* 6. مبيعات الكتب والأرباح */}
              <DropdownMenuItem 
                onClick={() => navigate("/nashr/dashboard?tab=sales")}
                className="rounded-xl px-3 py-2 text-xs font-black flex items-center justify-between cursor-pointer hover:bg-emerald-500/10 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <span>{isRtl ? "مبيعات الكتب والأرباح" : "Sales & Royalties"}</span>
                </div>
                <Badge variant="secondary" className="text-[10px] font-black">
                  {isRtl ? "أرباح 📈" : "Sales"}
                </Badge>
              </DropdownMenuItem>

              {/* 7. العقود الرسمية */}
              <DropdownMenuItem 
                onClick={() => {
                  if (contracts.length === 0) {
                    toast({
                      title: isRtl ? "صفحة العقود مقفلة حالياً 🔒" : "Contracts Locked 🔒",
                      description: isRtl 
                        ? "لا تفتح صفحة العقود إلا بعد قيام إدارة المنصة ودار عبيد للنشر بإصدار عقد رسمي معتمد لمخطوطتكم وإرساله لحسابكم."
                        : "Contracts page will only open once an official agreement is issued by Dar Obeid administration.",
                      variant: "destructive"
                    });
                    return;
                  }
                  navigate("/nashr/dashboard?tab=contracts");
                }}
                className={`rounded-xl px-3 py-2 text-xs font-black flex items-center justify-between cursor-pointer transition-colors ${
                  contracts.length === 0
                    ? "opacity-60 hover:bg-muted/50 cursor-not-allowed"
                    : "hover:bg-indigo-500/10 hover:text-indigo-700 dark:hover:text-indigo-300"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-xs ${
                    contracts.length > 0 
                      ? "bg-gradient-to-br from-indigo-500 to-blue-600 text-white" 
                      : "bg-muted text-muted-foreground"
                  }`}>
                    <FileSignature className="w-4 h-4" />
                  </div>
                  <span>{isRtl ? "العقود الرسمية" : "Official Contracts"}</span>
                </div>
                {contracts.filter(c => c.status === "pending_signature").length > 0 ? (
                  <Badge className="bg-amber-500 text-white text-[10px] h-5 px-1.5 font-bold animate-pulse">
                    {contracts.filter(c => c.status === "pending_signature").length} {isRtl ? "بانتظار توقيعك ✍️" : "Pending Sign"}
                  </Badge>
                ) : contracts.length > 0 ? (
                  <Badge variant="outline" className="text-[10px] border-indigo-500/30 text-indigo-600 font-bold">
                    {contracts.length} {isRtl ? "عقود 📜" : "Contracts"}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" />
                    {isRtl ? "بانتظار الإصدار" : "Pending Issue"}
                  </Badge>
                )}
              </DropdownMenuItem>

              <DropdownMenuSeparator className="my-1.5" />

              {/* 7. البيانات الشخصية وإعدادات الأمان (الصفحة الحالية) */}
              <DropdownMenuItem 
                onClick={() => navigate("/nashr/profile")}
                className="rounded-xl px-3 py-2 text-xs font-black flex items-center justify-between cursor-pointer bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 font-black"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500 text-white flex items-center justify-center shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <span>{isRtl ? "البيانات الشخصية" : "Personal Profile"}</span>
                </div>
                <Badge className="bg-indigo-500 text-white text-[10px] font-bold">
                  {isRtl ? "الحالية 👤" : "Current"}
                </Badge>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="my-1.5" />

              {/* 8. تغيير اللغة (Inline Accordion) */}
              <div className="space-y-1">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsMenuLanguageOpen((prev) => !prev);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setIsMenuLanguageOpen((prev) => !prev);
                    }
                  }}
                  className={`rounded-xl px-3 py-2 text-xs font-black flex items-center justify-between cursor-pointer transition-colors select-none ${
                    isMenuLanguageOpen ? "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300" : "hover:bg-cyan-500/10 text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-cyan-500/15 text-cyan-600 flex items-center justify-center shrink-0">
                      <Globe className="w-4 h-4" />
                    </div>
                    <span>{isRtl ? "تغيير اللغة" : "Change Language"}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="text-[10px] font-black border-cyan-500/40 text-cyan-700 dark:text-cyan-300 bg-cyan-500/10">
                      {ALL_SUPPORTED_LANGUAGES.find(l => l.code === language)?.nativeName || (language === "ar" ? "العربية" : "English")}
                    </Badge>
                    <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${isMenuLanguageOpen ? "rotate-180" : ""}`} />
                  </div>
                </div>

                {isMenuLanguageOpen && (
                  <div 
                    className="p-2 rounded-2xl bg-muted/40 border border-border/70 space-y-1.5 animate-in fade-in-50 duration-150"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-black text-cyan-600 uppercase tracking-wider">
                      <Globe className="w-3 h-3 text-cyan-600" />
                      <span>{isRtl ? "اختر لغة المنصة" : "Select Platform Language"}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                      {ALL_SUPPORTED_LANGUAGES.map((lang) => {
                        const isSelected = language === lang.code;
                        return (
                          <button
                            key={lang.code}
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setLanguage(lang.code as Language);
                              toast({
                                title: lang.code === "ar" 
                                  ? "تم تغيير اللغة إلى العربية 🌐" 
                                  : `Language switched to ${lang.nativeName} 🌐`,
                                description: lang.code === "ar"
                                  ? "تم تحديث واجهة المنصة باللغة العربية."
                                  : `Interface language updated to ${lang.name}.`
                              });
                            }}
                            className={`flex items-center justify-between p-2 rounded-xl text-start transition-all cursor-pointer ${
                              isSelected
                                ? "bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 font-black border border-cyan-500/40 shadow-xs"
                                : "hover:bg-background/80 text-foreground border border-transparent"
                            }`}
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="text-xs shrink-0">{lang.flag}</span>
                              <span className="text-xs font-bold truncate">{lang.nativeName}</span>
                            </div>
                            {isSelected && <Check className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0 ms-1" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* 9. السطوع والمظهر (Inline Accordion) */}
              <div className="space-y-1">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsMenuThemeOpen((prev) => !prev);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setIsMenuThemeOpen((prev) => !prev);
                    }
                  }}
                  className={`rounded-xl px-3 py-2 text-xs font-black flex items-center justify-between cursor-pointer transition-colors select-none ${
                    isMenuThemeOpen ? "bg-amber-500/15 text-amber-700 dark:text-amber-300" : "hover:bg-amber-500/10 text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-600 flex items-center justify-center shrink-0">
                      {theme === "dark" ? <Moon className="w-4 h-4" /> : theme === "system" ? <Monitor className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                    </div>
                    <span>{isRtl ? "السطوع والمظهر" : "Appearance & Theme"}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="text-[10px] font-black border-amber-500/40 text-amber-700 dark:text-amber-300 bg-amber-500/10">
                      {theme === "dark" 
                        ? (isRtl ? "داكن 🌙" : "Dark 🌙") 
                        : theme === "system"
                        ? (isRtl ? "تلقائي 💻" : "Auto 💻")
                        : (isRtl ? "فاتح ☀️" : "Light ☀️")}
                    </Badge>
                    <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${isMenuThemeOpen ? "rotate-180" : ""}`} />
                  </div>
                </div>

                {isMenuThemeOpen && (
                  <div 
                    className="p-2 rounded-2xl bg-muted/40 border border-border/70 space-y-1.5 animate-in fade-in-50 duration-150"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-black text-amber-600 uppercase tracking-wider">
                      <SunMoon className="w-3 h-3 text-amber-600" />
                      <span>{isRtl ? "اختيار السطوع والمظهر" : "Select Appearance"}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                      {/* داكن */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setTheme("dark");
                          toast({
                            title: isRtl ? "تم تفعيل الوضع الداكن 🌙" : "Dark Mode Activated 🌙",
                            description: isRtl ? "مظهر داكن مريح للعين في الإضاءة الخافتة." : "Comfortable dark theme for low light."
                          });
                        }}
                        className={`flex flex-col items-center justify-center p-2 rounded-xl text-center transition-all cursor-pointer ${
                          theme === "dark"
                            ? "bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-black border-2 border-indigo-500/40 shadow-xs"
                            : "hover:bg-background/80 text-foreground border border-transparent"
                        }`}
                      >
                        <Moon className="w-4 h-4 mb-1 text-indigo-500" />
                        <span className="text-xs font-bold">{isRtl ? "داكن" : "Dark"}</span>
                        <span className="text-[9px] text-muted-foreground">{isRtl ? "ليلي 🌙" : "Night"}</span>
                      </button>

                      {/* فاتح */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setTheme("light");
                          toast({
                            title: isRtl ? "تم تفعيل الوضع الفاتح ☀️" : "Light Mode Activated ☀️",
                            description: isRtl ? "مظهر ناصع ومشرق مناسب للقراءة بوضوح." : "Crisp and bright appearance."
                          });
                        }}
                        className={`flex flex-col items-center justify-center p-2 rounded-xl text-center transition-all cursor-pointer ${
                          theme === "light"
                            ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 font-black border-2 border-amber-500/40 shadow-xs"
                            : "hover:bg-background/80 text-foreground border border-transparent"
                        }`}
                      >
                        <Sun className="w-4 h-4 mb-1 text-amber-500" />
                        <span className="text-xs font-bold">{isRtl ? "فاتح" : "Light"}</span>
                        <span className="text-[9px] text-muted-foreground">{isRtl ? "نهاري ☀️" : "Day"}</span>
                      </button>

                      {/* تلقائي */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setTheme("system");
                          toast({
                            title: isRtl ? "تم تفعيل الوضع التلقائي 💻" : "System Theme Activated 💻",
                            description: isRtl ? "يتطابق المظهر تلقائياً مع إعدادات نظام جهازك." : "Matches your device system preference."
                          });
                        }}
                        className={`flex flex-col items-center justify-center p-2 rounded-xl text-center transition-all cursor-pointer ${
                          theme === "system"
                            ? "bg-primary/20 text-primary font-black border-2 border-primary/40 shadow-xs"
                            : "hover:bg-background/80 text-foreground border border-transparent"
                        }`}
                      >
                        <Monitor className="w-4 h-4 mb-1 text-primary" />
                        <span className="text-xs font-bold">{isRtl ? "تلقائي" : "Auto"}</span>
                        <span className="text-[9px] text-muted-foreground">{isRtl ? "النظام 💻" : "Device"}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <DropdownMenuSeparator className="my-1.5" />

              {/* 10. تسجيل الخروج */}
              <DropdownMenuItem 
                onClick={() => {
                  toast({
                    title: isRtl ? "تم تسجيل الخروج بنجاح" : "Logged Out Successfully",
                    description: isRtl ? "نتمنى لكم يوماً سعيداً في دار عبيد وUNIGATES." : "See you soon."
                  });
                  navigate("/nashr");
                }}
                className="rounded-xl px-3 py-2 text-xs font-black flex items-center justify-start cursor-pointer text-destructive hover:bg-destructive/10 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-destructive/15 text-destructive flex items-center justify-center shrink-0">
                    <LogOut className="w-4 h-4" />
                  </div>
                  <span>{isRtl ? "تسجيل الخروج" : "Logout"}</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 pb-20 space-y-8">

        {/* Hero Profile Banner */}
        <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-indigo-500/15 via-purple-500/15 to-rose-500/15 border-2 border-indigo-500/30 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-start sm:items-center gap-4">
              <div className="relative group shrink-0">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-rose-600 text-white shadow-xl shadow-indigo-500/25 flex items-center justify-center text-3xl font-black shrink-0 border-2 border-white/20 overflow-hidden">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={profile.fullName}
                      className="w-full h-full object-cover rounded-3xl transition-transform duration-300 group-hover:scale-105"
                      onError={() => setAvatarUrl(generateSampleAuthorAvatarSvg(profile.fullName, profile.academicTitleLabel))}
                    />
                  ) : (
                    <span className="text-3xl">👤</span>
                  )}
                </div>
                {/* Quick Camera button to change profile photo */}
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute -bottom-1 -end-1 w-7 h-7 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-lg border-2 border-background cursor-pointer hover:scale-110 active:scale-95 transition-all"
                  title={isRtl ? "تغيير الصورة الشخصية" : "Change profile photo"}
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </div>
              <div className="space-y-1.5 text-start">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-foreground tracking-tight">
                    {profile.fullName}
                  </h1>
                  <Badge className="bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-500/40 text-xs font-mono font-black px-2.5 py-0.5">
                    {profile.authorCode}
                  </Badge>
                  {isUnderReview ? (
                    <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40 font-black text-xs px-2.5 py-0.5 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                      <span>{isRtl ? "الحساب قيد التدقيق والمراجعة" : "Under Review"}</span>
                    </Badge>
                  ) : (
                    <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40 font-black text-xs px-2.5 py-0.5 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{isRtl ? "حساب معتمد وموثق رسمياً" : "Verified Author"}</span>
                    </Badge>
                  )}
                </div>
                <p className="text-xs sm:text-sm font-bold text-muted-foreground">
                  {profile.academicTitleLabel} • {profile.specialization} {profile.institution ? `• ${profile.institution}` : ""}
                </p>
                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-0.5">
                  <span className="flex items-center gap-1 font-bold">
                    <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{isRtl ? "تاريخ التسجيل:" : "Joined:"} {profile.joinedDate}</span>
                  </span>
                  <span className="flex items-center gap-1 font-bold">
                    <Building2 className="w-3.5 h-3.5 text-rose-500" />
                    <span>{isRtl ? "الناشر الرسمي: دار عبيد للنشر والتوزيع" : "Publisher: Dar Obeid"}</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const el = document.getElementById("password-change-section");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
                className="h-11 px-4 rounded-2xl border-2 border-rose-500/40 text-rose-700 dark:text-rose-300 hover:bg-rose-500/10 text-xs font-black gap-2 shadow-xs"
              >
                <Key className="w-4 h-4 text-rose-500" />
                <span>{isRtl ? "تغيير كلمة المرور 🔐" : "Change Password"}</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Notice for Under Review */}
        {isUnderReview && (
          <div className="p-4 sm:p-5 rounded-3xl bg-amber-500/10 border-2 border-amber-500/30 flex items-start gap-3.5 shadow-sm">
            <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 animate-pulse" />
            <div className="space-y-1 text-xs sm:text-sm text-start">
              <h4 className="font-black text-amber-900 dark:text-amber-300">
                {isRtl ? "ملاحظة أمان وتدقيق: بيانات الحساب والمستندات قيد الفحص الأكاديمي" : "Notice: Credentials Under Editorial Review"}
              </h4>
              <p className="text-amber-800/90 dark:text-amber-300/80 leading-relaxed font-medium">
                {isRtl
                  ? "جميع المستندات الشخصية والشهادات الأكاديمية المدخلة أدناه قيد التحقق من قبل هيئة التحكيم بدار عبيد. يمكنك تحديث بياناتك وتعيين كلمة مرورك الدائمة في أي وقت."
                  : "All submitted identity cards and qualification degrees are currently validated by Dar Obeid editorial board."}
              </p>
            </div>
          </div>
        )}

        {/* Main Grid: Personal Info Form + Merged Password & Banking */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column (2 Cols): Personal Info & Registration Details Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="rounded-3xl border-2 border-border/80 shadow-xl bg-card overflow-hidden">
              <CardHeader className="bg-muted/20 border-b border-border/60 pb-4">
                <div className="flex items-center gap-2.5 text-start">
                  <div className="w-9 h-9 rounded-2xl bg-indigo-500/15 text-indigo-600 flex items-center justify-center font-black">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base sm:text-lg font-black text-foreground">
                      {isRtl ? "البيانات الشخصية المسجلة أثناء إنشاء الحساب" : "Registered Personal Information"}
                    </CardTitle>
                    <CardDescription className="text-xs font-bold">
                      {isRtl ? "راجع أو عدل بيانات هويتك ورتبتك الأكاديمية المسجلة لدى دار عبيد" : "Review or update your identity and academic rank on file"}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6">
                <form onSubmit={handleSaveProfile} className="space-y-5 text-start">
                  
                  {/* Full Name & Academic Title */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2 space-y-2">
                      <Label className="text-xs font-black text-foreground">
                        {isRtl ? "الاسم الكامل (كما في الهوية الرسمية):" : "Full Name:"}
                      </Label>
                      <Input
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder={isRtl ? "الاسم الثلاثي أو الرباعي" : "Full Name"}
                        className="h-11 rounded-xl text-xs font-bold border-2"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-black text-foreground">
                        {isRtl ? "الرتبة الأكاديمية:" : "Academic Title:"}
                      </Label>
                      <Select value={academicTitle} onValueChange={(val: AcademicTitle) => setAcademicTitle(val)}>
                        <SelectTrigger className="h-11 rounded-xl text-xs font-bold border-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {ACADEMIC_TITLES.map((t) => (
                            <SelectItem key={t.value} value={t.value} className="text-xs font-bold">
                              {isRtl ? t.labelAr : t.labelEn}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Specialization & Institution */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-black text-foreground">
                        {isRtl ? "التخصص الأكاديمي الدقيق:" : "Specialization:"}
                      </Label>
                      <Input
                        value={specialization}
                        onChange={(e) => setSpecialization(e.target.value)}
                        placeholder={isRtl ? "مجال التخصص الأكاديمي" : "Specialization"}
                        className="h-11 rounded-xl text-xs font-bold border-2"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-black text-foreground">
                        {isRtl ? "الجامعة / جهة العمل أو البحث:" : "University / Institution:"}
                      </Label>
                      <Input
                        value={institution}
                        onChange={(e) => setInstitution(e.target.value)}
                        placeholder={isRtl ? "مثال: جامعة القاهرة - كلية الدراسات العليا" : "e.g. Cairo University"}
                        className="h-11 rounded-xl text-xs font-bold border-2"
                      />
                    </div>
                  </div>

                  {/* Email & Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-black text-foreground flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{isRtl ? "البريد الإلكتروني المعتمد للتواصل:" : "Official Email:"}</span>
                      </Label>
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="author@example.com"
                        className="h-11 rounded-xl text-xs font-bold font-mono border-2"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-black text-foreground flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{isRtl ? "رقم الهاتف / واتساب للتنبيهات:" : "Phone / WhatsApp:"}</span>
                      </Label>
                      <Input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+20 100 123 4567"
                        className="h-11 rounded-xl text-xs font-bold font-mono border-2"
                        required
                      />
                    </div>
                  </div>

                  {/* Academic Bio */}
                  <div className="space-y-2">
                    <Label className="text-xs font-black text-foreground">
                      {isRtl ? "السيرة الأكاديمية والنبذة التعريفية (تظهر للقراء في المتجر):" : "Academic Bio (Visible in Store):"}
                    </Label>
                    <Textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={3}
                      placeholder={isRtl ? "اكتب نبذة عن مؤلفاتك وأبحاثك العلمية..." : "Brief summary of your academic research..."}
                      className="rounded-xl text-xs font-medium border-2 leading-relaxed"
                    />
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Button
                      type="submit"
                      disabled={savingProfile}
                      className="h-11 px-6 rounded-2xl font-black text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 gap-2 cursor-pointer hover:scale-105 transition-all"
                    >
                      <Save className="w-4 h-4" />
                      <span>{savingProfile ? (isRtl ? "جاري الحفظ..." : "Saving...") : (isRtl ? "حفظ وتحديث البيانات الشخصية" : "Save Profile Changes")}</span>
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Document Verification & Registration Files */}
            <Card className="rounded-3xl border-2 border-border/80 shadow-xl bg-card overflow-hidden">
              <CardHeader className="bg-muted/20 border-b border-border/60 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 text-start">
                    <div className="w-9 h-9 rounded-2xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center font-black">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base sm:text-lg font-black text-foreground">
                        {isRtl ? "مستندات الهوية والمؤهلات الأكاديمية المقدمة" : "Submitted Identity & Credentials"}
                      </CardTitle>
                      <CardDescription className="text-xs font-bold">
                        {isRtl ? "المستندات الرسمية التي تم إرفاقها أثناء التسجيل للتحقق والاعتماد" : "Documents verified by Dar Obeid Editorial Committee"}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className="bg-emerald-500 text-white text-[10px] font-black">
                    {isRtl ? "فحص رسمي معتمد" : "Official Audit"}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-5">
                
                {/* 0. Official Profile Photo */}
                <div className="p-4 rounded-2xl bg-muted/20 border-2 border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/15 text-indigo-600 flex items-center justify-center font-black text-xl shrink-0 overflow-hidden border border-indigo-500/30">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt={profile.fullName} className="w-full h-full object-cover" />
                      ) : (
                        <span>👤</span>
                      )}
                    </div>
                    <div className="space-y-0.5 text-start">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs sm:text-sm font-black text-foreground">
                          {isRtl ? "الصورة الشخصية الرسمية للمؤلف:" : "Official Author Profile Photo:"}
                        </h4>
                        <Badge variant="outline" className="text-[10px] border-indigo-500/40 text-indigo-600 font-bold">
                          {isRtl ? "مرفقة ومعتمدة" : "Verified"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">
                        {profile.avatarName || "Author_Profile_Photo.jpg"} • {isRtl ? "صورة الملف الأكاديمي" : "Academic Avatar"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {avatarUrl && (
                      <Button
                        size="sm"
                        variant="outline"
                        type="button"
                        onClick={() => setPreviewDoc({ url: avatarUrl, title: isRtl ? "معاينة الصورة الشخصية" : "Profile Photo Preview" })}
                        className="h-9 px-3 rounded-xl text-xs font-bold gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{isRtl ? "معاينة" : "View"}</span>
                      </Button>
                    )}
                    <Button
                      size="sm"
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      className="h-9 px-3 rounded-xl text-xs font-bold bg-muted hover:bg-muted/80 text-foreground gap-1.5"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>{isRtl ? "تحديث الصورة" : "Replace Photo"}</span>
                    </Button>
                  </div>
                </div>

                {/* 1. National ID Card */}
                <div className="p-4 rounded-2xl bg-muted/20 border-2 border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center font-black text-xl shrink-0">
                      🪪
                    </div>
                    <div className="space-y-0.5 text-start">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs sm:text-sm font-black text-foreground">
                          {isRtl ? "بطاقة الهوية الوطنية / جواز السفر:" : "National ID / Passport:"}
                        </h4>
                        <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-600 font-bold">
                          {isRtl ? "معتمدة" : "Verified"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">
                        {profile.nationalIdName || "National_ID_Card.svg"} • {profile.nationalIdSize || "1.8 MB"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {profile.nationalIdUrl && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPreviewDoc({ url: profile.nationalIdUrl!, title: isRtl ? "معاينة بطاقة الهوية الوطنية" : "National ID Card Preview" })}
                        className="h-9 px-3 rounded-xl text-xs font-bold gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{isRtl ? "معاينة" : "View"}</span>
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={() => nationalIdInputRef.current?.click()}
                      className="h-9 px-3 rounded-xl text-xs font-bold bg-muted hover:bg-muted/80 text-foreground gap-1.5"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>{isRtl ? "تحديث المستند" : "Replace"}</span>
                    </Button>
                    <input
                      ref={nationalIdInputRef}
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={handleNationalIdUpload}
                    />
                  </div>
                </div>

                {/* 2. Qualification & Academic Degrees */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-black text-foreground flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-indigo-500" />
                      <span>{isRtl ? "الشهادات والمؤهلات الأكاديمية المرفقة:" : "Academic Degrees & Certifications:"}</span>
                    </Label>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const existing = profile.qualificationDocuments || [];
                        if (existing.length >= 20) {
                          toast({
                            title: isRtl ? "تم الوصول للحد الأقصى (20 ملف)" : "Maximum Limit Reached (20 Files)",
                            description: isRtl ? "تتسع القائمة حتى 20 شهادة ومؤهلاً." : "Up to 20 documents allowed.",
                          });
                          return;
                        }
                        qualInputRef.current?.click();
                      }}
                      className="h-8 px-3 rounded-xl text-[11px] font-bold border-indigo-500/40 text-indigo-600 hover:bg-indigo-500/10 gap-1.5"
                    >
                      <UploadCloud className="w-3 h-3 text-indigo-500" />
                      <span>{isRtl ? `إضافة شهادة أخرى (${(profile.qualificationDocuments || []).length}/20)` : `Add Degree (${(profile.qualificationDocuments || []).length}/20)`}</span>
                    </Button>
                    <input
                      ref={qualInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      className="hidden"
                      onChange={handleQualUpload}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(profile.qualificationDocuments && profile.qualificationDocuments.length > 0
                      ? profile.qualificationDocuments
                      : [{ id: "q1", name: "Doctorate_Degree_Certificate.svg", size: "2.5 MB", url: profile.qualificationUrls?.[0] || "" }]
                    ).map((doc, idx) => (
                      <div key={doc.id || idx} className="p-3.5 rounded-2xl bg-card border-2 border-border/80 flex items-center justify-between gap-3 shadow-xs">
                        <div className="flex items-center gap-2.5 overflow-hidden text-start">
                          <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-600 flex items-center justify-center font-bold text-sm shrink-0">
                            🎓
                          </div>
                          <div className="truncate">
                            <span className="text-xs font-black text-foreground block truncate">{doc.name}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">{doc.size || "2.4 MB"} • {isRtl ? "معتمدة" : "Verified"}</span>
                          </div>
                        </div>

                        {doc.url && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={async () => {
                              let targetUrl = doc.url;
                              if (targetUrl.startsWith("idb:")) {
                                const resolved = await NashrFileStore.getFile(targetUrl.replace("idb:", ""));
                                if (resolved) targetUrl = resolved;
                              }
                              setPreviewDoc({ url: targetUrl, title: doc.name });
                            }}
                            className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-indigo-600 hover:bg-indigo-500/10 shrink-0"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

              </CardContent>
            </Card>

          </div>

          {/* Right Column (1 Col): Security & Password Form (MERGED) + Bank Info */}
          <div className="space-y-6">

            {/* 🔐 قسم تغيير كلمة المرور المدمج (Dedicated Merged Security Section) */}
            <Card id="password-change-section" className="rounded-3xl border-2 border-rose-500/40 shadow-xl bg-gradient-to-b from-card to-rose-500/5 overflow-hidden">
              <CardHeader className="bg-rose-500/10 border-b border-rose-500/20 pb-4">
                <div className="flex items-center gap-2.5 text-start">
                  <div className="w-9 h-9 rounded-2xl bg-rose-500 text-white flex items-center justify-center font-black shadow-md">
                    <Key className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-black text-foreground">
                      {isRtl ? "الأمان وتغيير كلمة المرور" : "Security & Password"}
                    </CardTitle>
                    <CardDescription className="text-xs font-bold text-rose-700 dark:text-rose-300">
                      {isRtl ? "دمج تغيير كلمة المرور داخل صفحة البيانات" : "Integrated direct password controls"}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6">
                <form onSubmit={handleUpdatePassword} className="space-y-4 text-start">
                  
                  {/* Status Indicator */}
                  <div className="p-3 rounded-2xl bg-card border border-rose-500/30 flex items-center justify-between text-xs font-bold">
                    <span className="text-muted-foreground">{isRtl ? "حالة كلمة المرور:" : "Password State:"}</span>
                    <Badge className={profile.isTemporaryPassword ? "bg-amber-500 text-white" : "bg-emerald-600 text-white"}>
                      {profile.isTemporaryPassword 
                        ? (isRtl ? "كلمة مرور مؤقتة ⚠️" : "Temporary") 
                        : (isRtl ? "دائمة ومؤمنة 🛡️" : "Permanent")}
                    </Badge>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-black text-foreground">
                      {isRtl ? "كلمة المرور الجديدة:" : "New Password:"}
                    </Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="h-11 rounded-xl text-xs font-bold pe-10 border-2"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute end-3 top-3 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-black text-foreground">
                      {isRtl ? "تأكيد كلمة المرور الجديدة:" : "Confirm New Password:"}
                    </Label>
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-11 rounded-xl text-xs font-bold border-2"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={savingPassword}
                    className="w-full h-11 rounded-2xl font-black text-xs bg-gradient-to-r from-rose-500 via-orange-600 to-amber-600 hover:from-rose-600 hover:to-amber-700 text-white shadow-lg shadow-rose-500/20 gap-2 cursor-pointer hover:scale-105 transition-all"
                  >
                    <Lock className="w-4 h-4" />
                    <span>{savingPassword ? (isRtl ? "جاري التحديث..." : "Updating...") : (isRtl ? "تأكيد وحفظ كلمة المرور" : "Update Password Now")}</span>
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* 🏦 بيانات التحويل البنكي وسحب الأرباح */}
            <Card className="rounded-3xl border-2 border-border/80 shadow-xl bg-card overflow-hidden">
              <CardHeader className="bg-muted/20 border-b border-border/60 pb-4">
                <div className="flex items-center gap-2.5 text-start">
                  <div className="w-9 h-9 rounded-2xl bg-amber-500/15 text-amber-600 flex items-center justify-center font-black">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-black text-foreground">
                      {isRtl ? "بيانات التحويل البنكي وسحب الأرباح" : "Payout & Banking Information"}
                    </CardTitle>
                    <CardDescription className="text-xs font-bold">
                      {isRtl ? "بيانات الحساب المعتمد لتحويل عائدات بيع الكتب" : "Bank coordinates used for royalty transfers"}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-4 text-start">
                <div className="space-y-1.5">
                  <Label className="text-xs font-black text-foreground">
                    {isRtl ? "اسم صاحب الحساب البنكي:" : "Account Holder Name:"}
                  </Label>
                  <Input
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value)}
                    placeholder={fullName}
                    className="h-10 rounded-xl text-xs font-bold border-2"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-black text-foreground">
                    {isRtl ? "اسم البنك أو المحفظة الإلكترونية:" : "Bank / Wallet Provider:"}
                  </Label>
                  <Input
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="مثال: البنك الأهلي المصري / بنك مصر / فودافون كاش"
                    className="h-10 rounded-xl text-xs font-bold border-2"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-black text-foreground">
                    {isRtl ? "رقم الحساب البنكي أو الآيبان (IBAN):" : "IBAN or Account Number:"}
                  </Label>
                  <Input
                    value={ibanOrAccount}
                    onChange={(e) => setIbanOrAccount(e.target.value)}
                    placeholder="EG3800020001..."
                    className="h-10 rounded-xl text-xs font-bold font-mono border-2"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-black text-foreground">
                    {isRtl ? "محفظة إنستاباي / رقم الهاتف المربوط:" : "InstaPay / Mobile Wallet:"}
                  </Label>
                  <Input
                    value={electronicWallet}
                    onChange={(e) => setElectronicWallet(e.target.value)}
                    placeholder="+20 100 123 4567"
                    className="h-10 rounded-xl text-xs font-bold font-mono border-2"
                  />
                </div>

                <Button
                  onClick={handleSaveProfile}
                  variant="outline"
                  className="w-full h-10 rounded-xl text-xs font-black border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10"
                >
                  {isRtl ? "تحديث بيانات السحب البنكي 💾" : "Save Payout Details"}
                </Button>
              </CardContent>
            </Card>

          </div>

        </div>

      </main>

      {/* Document Full View Modal */}
      <Dialog open={Boolean(previewDoc)} onOpenChange={(open) => !open && setPreviewDoc(null)}>
        <DialogContent className="max-w-3xl rounded-3xl p-5 border-2 border-border/80 bg-card">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-foreground text-start">
              {previewDoc?.title}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground text-start">
              {isRtl ? "مستند رسمي معتمد وموثق في ملف المؤلف لدى دار عبيد للنشر والتوزيع" : "Official verified credential document"}
            </DialogDescription>
          </DialogHeader>
          {previewDoc && (
            <div className="p-2 rounded-2xl bg-muted/30 border border-border/70 overflow-hidden max-h-[70vh] flex items-center justify-center">
              <img
                src={previewDoc.url}
                alt={previewDoc.title}
                className="max-h-[65vh] w-auto object-contain rounded-xl shadow-md"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default NasherProfilePage;
