import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { 
  PenTool, 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  User, 
  Key, 
  Lock, 
  ShieldCheck, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight,
  BookOpen,
  Home,
  Info,
  Clock,
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff,
  Check,
  Building2,
  FileCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageSelectorDropdown from "@/components/LanguageSelectorDropdown";
import { NashrDataStore } from "@/services/nashrDataStore";
import { AuthorProfile } from "@/types/nashr";

type LoginViewMode = "login" | "change_temp_password" | "pending_review";

const NasherLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { dir } = useLanguage();
  const isRtl = dir === "rtl";

  // State from location (e.g. from NasherSignup)
  const stateData = location.state as {
    authorCode?: string;
    email?: string;
    tempPassword?: string;
    needsPasswordChange?: boolean;
    reason?: string;
  } | null;

  const [mode, setMode] = useState<LoginViewMode>(
    stateData?.needsPasswordChange ? "change_temp_password" : "login"
  );

  const [identifier, setIdentifier] = useState(
    stateData?.authorCode || stateData?.email || ""
  );
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshingStatus, setRefreshingStatus] = useState(false);

  // Author object being acted on
  const [currentAuthor, setCurrentAuthor] = useState<AuthorProfile | null>(() => {
    if (stateData?.authorCode || stateData?.email) {
      return NashrDataStore.findAuthorByIdentifier(stateData.authorCode || stateData.email || "");
    }
    return NashrDataStore.getAuthorProfile();
  });

  // Change temp password form states
  const [tempPasswordInput, setTempPasswordInput] = useState(stateData?.tempPassword || "");
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [confirmPasswordInput, setConfirmPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (stateData?.needsPasswordChange) {
      setMode("change_temp_password");
      if (stateData.authorCode || stateData.email) {
        const found = NashrDataStore.findAuthorByIdentifier(stateData.authorCode || stateData.email || "");
        if (found) setCurrentAuthor(found);
      }
      if (stateData.tempPassword) {
        setTempPasswordInput(stateData.tempPassword);
      }
    }
  }, [stateData]);

  // Handle Login submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      toast({
        title: isRtl ? "بيانات ناقصة" : "Missing Info",
        description: isRtl ? "يرجى إدخال البريد الإلكتروني أو كود المؤلف وكلمة المرور." : "Please enter email/author code and password.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await NashrDataStore.syncAuthorsFromCloud();

      const author = NashrDataStore.findAuthorByIdentifier(identifier.trim()) || NashrDataStore.getAuthorProfile();
      setCurrentAuthor(author);

      // Case 1: Temporary password not changed yet -> MUST change temp password first
      if (author.isTemporaryPassword || (author.tempPassword && password === author.tempPassword)) {
        setTempPasswordInput(password || author.tempPassword || "");
        setMode("change_temp_password");
        toast({
          title: isRtl ? "مطلوب تغيير كلمة المرور المؤقتة أولاً" : "Temporary Password Change Required",
          description: isRtl 
            ? "هذا أول دخول لحسابك. يجب تعيين كلمة مرور شخصية دائمة قبل متابعة الدخول."
            : "Please set a permanent password before continuing."
        });
        return;
      }

      // Case 2: Account is still under review -> show pending review screen
      if (author.verificationStatus === "pending_review") {
        setMode("pending_review");
        toast({
          title: isRtl ? "الحساب قيد المراجعة والتدقيق" : "Account Under Review",
          description: isRtl 
            ? "حسابك لا يزال قيد الفحص والتدقيق من قبل إدارة دار عبيد للنشر ولم تتم الموافقة عليه بعد."
            : "Your account is still under administrative review."
        });
        return;
      }

      // Case 3: Approved -> Enter Dashboard
      NashrDataStore.saveAuthorProfile(author);
      toast({
        title: isRtl ? "🎉 مرحباً بك في منصة نشر!" : "Welcome to Nashr Platform!",
        description: isRtl 
          ? `أهلاً بك ${author.fullName} في استوديو مؤلفات دار عبيد.`
          : `Welcome ${author.fullName} to your publishing studio.`
      });

      navigate("/nashr/dashboard");
    } catch (err: any) {
      toast({
        title: isRtl ? "خطأ في تسجيل الدخول" : "Login Error",
        description: isRtl ? "يرجى التحقق من بيانات الدخول." : "Invalid credentials.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle Change Temp Password submission
  const handleChangeTempPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPasswordInput || !confirmPasswordInput) {
      toast({
        title: isRtl ? "بيانات ناقصة" : "Missing Info",
        description: isRtl ? "يرجى إدخال كلمة المرور الجديدة وتأكيدها." : "Please enter and confirm your new password.",
        variant: "destructive"
      });
      return;
    }

    if (newPasswordInput.length < 6) {
      toast({
        title: isRtl ? "كلمة المرور قصيرة" : "Password Too Short",
        description: isRtl ? "يجب أن تتكون كلمة المرور الجديدة من 6 خانات على الأقل." : "Password must be at least 6 characters.",
        variant: "destructive"
      });
      return;
    }

    if (newPasswordInput !== confirmPasswordInput) {
      toast({
        title: isRtl ? "كلمتا المرور غير متطابقتين" : "Passwords Do Not Match",
        description: isRtl ? "تأكد من كتابة نفس كلمة المرور في خانتي الإدخال." : "Please make sure your passwords match.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await new Promise(r => setTimeout(r, 600));

      const authorId = currentAuthor?.id;
      NashrDataStore.updatePassword(newPasswordInput, authorId);

      // Reload updated profile
      const updatedAuthor = authorId 
        ? (NashrDataStore.getAllAuthors().find(a => a.id === authorId) || NashrDataStore.getAuthorProfile())
        : NashrDataStore.getAuthorProfile();
      // Switch the session to this author so the dashboard opens their account
      NashrDataStore.saveAuthorProfile({ ...updatedAuthor, isTemporaryPassword: false });

      setCurrentAuthor(updatedAuthor);

      // Check verification status:
      // If approved -> open dashboard
      // If pending_review -> show under review notice, DO NOT open dashboard
      if (updatedAuthor.verificationStatus === "approved") {
        toast({
          title: isRtl ? "🎉 تم تغيير كلمة المرور واعتماد الحساب!" : "Password Changed & Account Approved!",
          description: isRtl 
            ? "حسابك معتمد رسمياً. جاري توجيهك إلى استوديو المؤلف..."
            : "Your account is verified. Entering dashboard..."
        });
        navigate("/nashr/dashboard");
      } else {
        toast({
          title: isRtl ? "تم تغيير كلمة المرور بنجاح ✅" : "Password Updated Successfully",
          description: isRtl 
            ? "تم حفظ كلمة المرور الدائمة. حسابك حالياً قيد المراجعة والتدقيق من إدارة المنصة."
            : "Password updated. Your account is currently under administrative review."
        });
        setMode("pending_review");
      }
    } catch (err: any) {
      toast({
        title: isRtl ? "خطأ في التحديث" : "Update Error",
        description: isRtl ? "حدث خطأ أثناء حفظ كلمة المرور الجديدة." : "Failed to update password.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Re-check verification status
  const handleCheckStatus = () => {
    setRefreshingStatus(true);
    setTimeout(() => {
      setRefreshingStatus(false);
      const targetId = currentAuthor?.id;
      const refreshed = targetId 
        ? (NashrDataStore.getAllAuthors().find(a => a.id === targetId) || NashrDataStore.getAuthorProfile())
        : NashrDataStore.getAuthorProfile();

      setCurrentAuthor(refreshed);

      if (refreshed.verificationStatus === "approved") {
        toast({
          title: isRtl ? "🎉 تهانينا! تمت الموافقة على الحساب!" : "Account Approved!",
          description: isRtl 
            ? "تم اعتماد حسابك رسمياً من إدارة دار عبيد للنشر. جاري الدخول للوحة التحكم..."
            : "Your account has been officially approved. Entering dashboard..."
        });
        navigate("/nashr/dashboard");
      } else {
        toast({
          title: isRtl ? "الحساب لا يزال قيد الفحص والتدقيق ⏳" : "Still Under Review",
          description: isRtl 
            ? "يقوم فريق الفحص والتحكيم بمراجعة وثائق الهوية والمؤهلات الأكاديمية. يرجى المتابعة لاحقاً."
            : "Our editorial committee is still reviewing your credentials."
        });
      }
    }, 600);
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
                {isRtl ? "بوابة دخول المؤلفين والباحثين • دار عبيد للنشر" : "Author Sign In Portal • Dar Obeid"}
              </span>
            </div>
          </Link>

          {/* Header Navigation & Controls: (الرئيسية ثم تسجيل مؤلف جديد ثم السطوع ثم تغيير اللغه) */}
          <div className="flex items-center gap-2">
            {/* 1. الرئيسية (يرجع لصفحة منصة نشر) */}
            <Link to="/nashr">
              <Button variant="ghost" size="sm" className="h-9 px-3.5 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-xl gap-1.5 transition-all">
                <Home className="w-3.5 h-3.5 text-amber-500" />
                <span>{isRtl ? "الرئيسية" : "Home"}</span>
              </Button>
            </Link>

            {/* 2. تسجيل مؤلف جديد */}
            <Link to="/nashr/signup">
              <Button size="sm" className="font-extrabold bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white text-xs h-9 px-3.5 rounded-xl gap-1.5 shadow-sm transition-all">
                <PenTool className="w-3.5 h-3.5" />
                <span>{isRtl ? "تسجيل مؤلف جديد" : "Sign Up"}</span>
              </Button>
            </Link>

            <div className="h-5 w-px bg-border/80 mx-1 hidden sm:block" />

            {/* 3. السطوع (ThemeToggle) */}
            <ThemeToggle />

            {/* 4. تغيير اللغة (LanguageSelectorDropdown) */}
            <LanguageSelectorDropdown />
          </div>

        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 my-auto relative">
        {/* Ambient Glows */}
        <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-amber-500/5 via-rose-500/5 to-transparent pointer-events-none -z-10" />
        <div className="absolute top-10 start-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-[140px] pointer-events-none -z-10" />
        <div className="absolute top-32 end-1/4 w-80 h-80 bg-rose-500/10 rounded-full blur-[140px] pointer-events-none -z-10" />

        <div className="w-full max-w-lg space-y-6">

          {/* ----------------------------------------------------------- */}
          {/* MODE 1: Standard Login Screen */}
          {/* ----------------------------------------------------------- */}
          {mode === "login" && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold mb-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isRtl ? "استوديو المؤلفين ومتابعة المبيعات" : "Author Studio & Sales Management"}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                  {isRtl ? "تسجيل دخول المؤلفين" : "Author Sign In"}
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                  {isRtl ? "أدخل بريدك الإلكتروني أو كود المؤلف مع كلمة المرور للدخول للوحتك" : "Enter your email or author code with password to access your dashboard"}
                </p>
              </div>

              <Card className="border-2 border-border/70 shadow-2xl bg-card rounded-3xl overflow-hidden">
                <CardContent className="p-6 sm:p-8">
                  <form onSubmit={handleLogin} className="space-y-4">
                    
                    <div className="space-y-1.5">
                      <Label className="text-xs font-extrabold flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>{isRtl ? "البريد الإلكتروني أو كود المؤلف" : "Email or Author Code"}</span>
                      </Label>
                      <Input 
                        placeholder={isRtl ? "author@unigates.online أو AUT-7890" : "author@unigates.online or AUT-7890"}
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        required
                        className="h-11 rounded-xl text-xs sm:text-sm font-semibold border-border bg-muted/30 focus:bg-background focus:border-amber-500 transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-extrabold flex items-center gap-1">
                          <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>{isRtl ? "كلمة المرور (أو كلمة المرور المؤقتة)" : "Password (or Temp Password)"}</span>
                        </Label>
                      </div>
                      <Input 
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="h-11 rounded-xl text-xs sm:text-sm font-semibold border-border bg-muted/30 focus:bg-background focus:border-amber-500 transition-all"
                      />
                    </div>

                    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-[11px] text-amber-900 dark:text-amber-300 flex items-start gap-2.5">
                      <Key className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <span className="font-bold block">
                          {isRtl ? "تنبيه الحسابات الجديدة والكلمات المؤقتة:" : "New Accounts Notice:"}
                        </span>
                        <p className="text-muted-foreground">
                          {isRtl 
                            ? "عند تسجيل الدخول لأول مرة بالكلمة المؤقتة، سيطلب منك النظام إجبارياً تعيين كلمة مرور شخصية جديدة، ثم ينتظر الحساب اعتماد وموافقة إدارة المنصة."
                            : "On first login with a temporary password, you must set a permanent password, then wait for admin approval."}
                        </p>
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      disabled={loading}
                      size="lg"
                      className="w-full h-12 rounded-2xl font-black text-sm sm:text-base bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white shadow-xl shadow-amber-500/25 gap-2 hover:scale-[1.01] transition-all"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>{isRtl ? "جاري الدخول والتحقق..." : "Checking Credentials..."}</span>
                        </>
                      ) : (
                        <>
                          <BookOpen className="w-5 h-5" />
                          <span>{isRtl ? "تسجيل الدخول للمنصة ➔" : "Sign In to Platform ➔"}</span>
                        </>
                      )}
                    </Button>

                    <div className="text-center pt-2">
                      <p className="text-xs text-muted-foreground font-medium">
                        {isRtl ? "ليس لديك حساب مؤلف حتى الآن؟" : "Don't have an author account yet?"}{" "}
                        <Link to="/nashr/signup" className="font-bold text-amber-600 dark:text-amber-400 hover:underline">
                          {isRtl ? "تسجيل مؤلف جديد" : "Sign Up"}
                        </Link>
                      </p>
                    </div>

                  </form>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ----------------------------------------------------------- */}
          {/* MODE 2: Mandatory Change Temporary Password Screen */}
          {/* ----------------------------------------------------------- */}
          {mode === "change_temp_password" && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-400 text-xs font-black mb-1">
                  <Lock className="w-3.5 h-3.5" />
                  <span>{isRtl ? "خطوة أمنية إلزامية أولى" : "Mandatory Security Step"}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                  {isRtl ? "تغيير كلمة المرور المؤقتة" : "Change Temporary Password"}
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground font-medium max-w-md mx-auto">
                  {isRtl 
                    ? "لقد تم إنشاء حسابك بنجاح. لحماية بياناتك ومؤلفاتك، يرجى تعيين كلمة مرور شخصية دائمة لحسابك الآن."
                    : "Your account is created. Please replace your temporary password with a permanent secure one."}
                </p>
              </div>

              <Card className="border-2 border-border/80 shadow-2xl bg-card rounded-3xl overflow-hidden">
                <CardContent className="p-6 sm:p-8 space-y-5">
                  
                  {/* Account Summary Banner */}
                  <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="text-muted-foreground font-bold flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-amber-500" />
                        <span>{isRtl ? "المؤلف:" : "Author:"}</span>
                        <strong className="text-foreground">{currentAuthor?.fullName || (isRtl ? "مؤلف جديد" : "New Author")}</strong>
                      </div>
                      <div className="text-muted-foreground font-bold flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-orange-500" />
                        <span>{isRtl ? "البريد:" : "Email:"}</span>
                        <span className="text-foreground font-mono">{currentAuthor?.email || identifier}</span>
                      </div>
                    </div>
                    <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 text-xs font-black px-3 py-1 self-start sm:self-center">
                      {isRtl ? "كود المؤلف:" : "Code:"} {currentAuthor?.authorCode || identifier || "AUT-NEW"}
                    </Badge>
                  </div>

                  <form onSubmit={handleChangeTempPassword} className="space-y-4">
                    
                    {/* Temp Password */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-extrabold flex items-center gap-1">
                        <Key className="w-3.5 h-3.5 text-amber-500" />
                        <span>{isRtl ? "كلمة المرور المؤقتة الصادرة لحسابك" : "Temporary Password Issued"}</span>
                      </Label>
                      <Input 
                        type={showPassword ? "text" : "password"}
                        value={tempPasswordInput}
                        onChange={(e) => setTempPasswordInput(e.target.value)}
                        required
                        placeholder="AUTH-XXXX-X"
                        className="h-11 rounded-xl text-xs sm:text-sm font-mono font-bold border-border bg-muted/30 focus:bg-background focus:border-amber-500 transition-all"
                      />
                    </div>

                    {/* New Permanent Password */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-extrabold flex items-center gap-1">
                          <Lock className="w-3.5 h-3.5 text-emerald-500" />
                          <span>{isRtl ? "كلمة المرور الشخصية الدائمة الجديدة" : "New Permanent Password"}</span>
                        </Label>
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-[11px] font-bold text-muted-foreground hover:text-foreground flex items-center gap-1"
                        >
                          {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          <span>{showPassword ? (isRtl ? "إخفاء" : "Hide") : (isRtl ? "إظهار" : "Show")}</span>
                        </button>
                      </div>
                      <Input 
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••••••"
                        value={newPasswordInput}
                        onChange={(e) => setNewPasswordInput(e.target.value)}
                        required
                        minLength={6}
                        className="h-11 rounded-xl text-xs sm:text-sm font-semibold border-border bg-muted/30 focus:bg-background focus:border-amber-500 transition-all"
                      />
                      <span className="text-[10px] text-muted-foreground font-medium block">
                        {isRtl ? "يجب ألا تقل عن 6 أحرف أو أرقام." : "At least 6 characters."}
                      </span>
                    </div>

                    {/* Confirm New Password */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-extrabold flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{isRtl ? "تأكيد كلمة المرور الشخصية الجديدة" : "Confirm New Password"}</span>
                      </Label>
                      <Input 
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••••••"
                        value={confirmPasswordInput}
                        onChange={(e) => setConfirmPasswordInput(e.target.value)}
                        required
                        minLength={6}
                        className="h-11 rounded-xl text-xs sm:text-sm font-semibold border-border bg-muted/30 focus:bg-background focus:border-amber-500 transition-all"
                      />
                    </div>

                    {/* Next Step Info Alert */}
                    <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                      <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <span className="font-black block">
                          {isRtl ? "ماذا يحدث بعد تغيير الكلمة المؤقتة؟" : "What happens next?"}
                        </span>
                        <p className="text-[11px] leading-relaxed text-amber-800/90 dark:text-amber-300/80">
                          {isRtl 
                            ? "سيتم حفظ كلمة المرور الدائمة الخاصة بك. في حال كانت المنصة قد وافقت على حسابك ستفتح لك لوحة المؤلف مباشرة، أما إذا كان الحساب لا يزال تحت المراجعة فستظهر لك شاشة متابعة حالة المراجعة الأكاديمية لحين اعتماد الإدارة."
                            : "Your permanent password will be saved. If approved, dashboard opens directly; otherwise review status screen will display until approved."}
                        </p>
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      disabled={loading}
                      size="lg"
                      className="w-full h-12 rounded-2xl font-black text-sm sm:text-base bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 hover:from-emerald-700 hover:to-amber-700 text-white shadow-xl shadow-emerald-600/25 gap-2 hover:scale-[1.01] transition-all"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>{isRtl ? "جاري تعيين كلمة المرور وفحص الحالة..." : "Saving & Verifying Status..."}</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-5 h-5" />
                          <span>{isRtl ? "حفظ كلمة المرور الدائمة ومتابعة ➔" : "Save Permanent Password & Proceed ➔"}</span>
                        </>
                      )}
                    </Button>

                    <div className="text-center pt-2">
                      <button
                        type="button"
                        onClick={() => setMode("login")}
                        className="text-xs text-muted-foreground hover:text-foreground font-bold underline"
                      >
                        {isRtl ? "العودة إلى شاشة تسجيل الدخول العادية" : "Back to standard login"}
                      </button>
                    </div>

                  </form>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ----------------------------------------------------------- */}
          {/* MODE 3: Account Under Review (Pending Review Screen) */}
          {/* ----------------------------------------------------------- */}
          {mode === "pending_review" && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-3xl bg-amber-500/15 border-2 border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20">
                  <Clock className="w-8 h-8 animate-pulse" />
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-black">
                  <span>{isRtl ? "الحساب قيد المراجعة والتدقيق الأكاديمي ⏳" : "Account Under Platform Review"}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                  {isRtl ? "طلبكم تحت المراجعة من قبل المنصة" : "Application Under Review"}
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground font-medium max-w-md mx-auto">
                  {isRtl 
                    ? "تم تغيير كلمة المرور المؤقتة بنجاح! لم يُفتح الموقع بعد لأن حسابك ومستنداتك تخضع حالياً للتدقيق والاعتماد من قبل إدارة دار عبيد للنشر."
                    : "Password updated successfully! Dashboard access will be enabled once your credentials receive official editorial approval."}
                </p>
              </div>

              <Card className="border-2 border-amber-500/40 shadow-2xl bg-card rounded-3xl overflow-hidden relative">
                <div className="h-2 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500" />
                
                <CardContent className="p-6 sm:p-8 space-y-6">
                  
                  {/* Detailed Alert Message */}
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2 text-start">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      <h4 className="font-black text-xs sm:text-sm text-amber-900 dark:text-amber-200">
                        {isRtl ? "حالة التحقق: قيد فحص وثائق الهوية والدرجة العلمية" : "Verification Status: Pending Review"}
                      </h4>
                    </div>
                    <p className="text-xs text-amber-800/90 dark:text-amber-300/80 leading-relaxed font-medium">
                      {isRtl
                        ? "أهلاً بك دكتور/أستاذ. لحماية حقوق الملكية الفكرية وضمان معايير النشر الأكاديمي، يقوم فريق التدقيق بمراجعة بطاقة الهوية الوطنية والشهادات العلمية المسجلة. فور الموافقة الرسمية من قبل الإدارة ستتمكن من تسجيل الدخول وفتح لوحة المؤلف ورفع الملفات ومتابعة عقود النشر."
                        : "Welcome. To safeguard academic standards and copyright, our editorial team is verifying your submitted documents. You will gain full access upon approval."}
                    </p>
                  </div>

                  {/* Registered Author Details */}
                  <div className="rounded-2xl border border-border/80 bg-muted/20 p-4 space-y-2.5 text-xs text-start">
                    <h5 className="font-extrabold text-foreground border-b border-border/60 pb-1.5 flex items-center justify-between">
                      <span>{isRtl ? "بيانات حساب المؤلف المسجل:" : "Registered Author Record:"}</span>
                      <Badge variant="outline" className="text-[10px] font-mono border-amber-500/40 text-amber-600 dark:text-amber-400">
                        {currentAuthor?.authorCode || "AUT-PENDING"}
                      </Badge>
                    </h5>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-muted-foreground">
                      <div>
                        <span className="font-bold">{isRtl ? "الاسم الكامل: " : "Full Name: "}</span>
                        <span className="text-foreground font-semibold">{currentAuthor?.fullName}</span>
                      </div>
                      <div>
                        <span className="font-bold">{isRtl ? "البريد الإلكتروني: " : "Email: "}</span>
                        <span className="text-foreground font-mono">{currentAuthor?.email}</span>
                      </div>
                      <div>
                        <span className="font-bold">{isRtl ? "التخصص الأكاديمي: " : "Specialization: "}</span>
                        <span className="text-foreground">{currentAuthor?.specialization}</span>
                      </div>
                      <div>
                        <span className="font-bold">{isRtl ? "حالة الحساب: " : "Status: "}</span>
                        <span className="text-amber-600 dark:text-amber-400 font-black">
                          {isRtl ? "قيد المراجعة والاعتماد ⏳" : "Pending Approval ⏳"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    {/* Check Status Button */}
                    <Button 
                      type="button" 
                      onClick={handleCheckStatus}
                      disabled={refreshingStatus}
                      variant="outline"
                      size="lg"
                      className="w-full h-11 rounded-2xl font-black text-xs sm:text-sm border-2 border-amber-500/40 hover:bg-amber-500/10 text-foreground gap-2"
                    >
                      <RefreshCw className={`w-4 h-4 text-amber-600 dark:text-amber-400 ${refreshingStatus ? "animate-spin" : ""}`} />
                      <span>{refreshingStatus ? (isRtl ? "جاري فحص حالة الاعتماد..." : "Checking Status...") : (isRtl ? "فحص وتحديث حالة الاعتماد الآن" : "Check Approval Status Now")}</span>
                    </Button>

                    {/* Back to Login Button */}
                    <div className="text-center pt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setMode("login")}
                        className="text-xs text-muted-foreground hover:text-foreground font-bold gap-1"
                      >
                        <span>{isRtl ? "العودة إلى شاشة تسجيل الدخول" : "Back to Sign In"}</span>
                      </Button>
                    </div>

                  </div>

                </CardContent>
              </Card>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default NasherLogin;
