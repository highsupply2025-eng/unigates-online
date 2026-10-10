import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Home,
  BookOpen, 
  Loader2, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Library, 
  PenTool,
  Truck,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { getAuthCallbackUrl } from "@/lib/auth-redirect";
import LanguageSelectorDropdown from "@/components/LanguageSelectorDropdown";
import ThemeToggle from "@/components/ThemeToggle";
import SiteFooter from "@/components/SiteFooter";
import { BookStoreDataStore } from "@/services/bookStoreDataStore";

const countryCodes = [
  { code: "+20", country: "🇪🇬 مصر" },
  { code: "+966", country: "🇸🇦 السعودية" },
  { code: "+971", country: "🇦🇪 الإمارات" },
  { code: "+965", country: "🇰🇼 الكويت" },
  { code: "+974", country: "🇶🇦 قطر" },
  { code: "+973", country: "🇧🇭 البحرين" },
  { code: "+968", country: "🇴🇲 عمان" },
  { code: "+962", country: "🇯🇴 الأردن" },
  { code: "+961", country: "🇱🇧 لبنان" },
  { code: "+964", country: "🇮🇶 العراق" },
  { code: "+212", country: "🇲🇦 المغرب" },
  { code: "+1", country: "🇺🇸 أمريكا" },
  { code: "+44", country: "🇬🇧 بريطانيا" },
];

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

const BookStoreSignup = () => {
  const navigate = useNavigate();
  const { dir } = useLanguage();
  const isRtl = dir === "rtl";
  const { toast } = useToast();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [countryCode, setCountryCode] = useState("+20");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password || !phone) {
      toast({
        title: isRtl ? "بيانات ناقصة" : "Missing fields",
        description: isRtl ? "يرجى ملء جميع الحقول المطلوبة." : "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }
    if (!PASSWORD_REGEX.test(password)) {
      toast({
        title: isRtl ? "كلمة مرور ضعيفة" : "Weak password",
        description: isRtl ? "يجب أن تحتوي كلمة المرور على 8 خانات وحرف كبير وحرف صغير ورقم ورمز خاص." : "Password must be at least 8 chars with uppercase, lowercase, number and symbol.",
        variant: "destructive"
      });
      return;
    }
    if (password !== confirmPassword) {
      toast({
        title: isRtl ? "عدم تطابق كلمة المرور" : "Password mismatch",
        description: isRtl ? "كلمة المرور وتأكيدها غير متطابقين." : "Passwords do not match.",
        variant: "destructive"
      });
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
      if (!userId) throw new Error(isRtl ? "تعذر إنشاء الحساب" : "Could not create user account");

      // Save user session in DataStore
      BookStoreDataStore.setCurrentSession({
        role: "reader",
        name: fullName,
        email
      });

      // Attempt to save role in database if configured
      try {
        await supabase.rpc('complete_signup', {
          p_user_id: userId,
          p_role: "reader",
          p_full_name: fullName,
          p_phone: `${countryCode}${phone}`,
          p_email: email,
          p_platform: 'bookstore',
        });
      } catch (rpcErr) {
        // Fallback gracefully
        console.warn("RPC registration warning:", rpcErr);
      }

      setSubmitted(true);
      toast({
        title: isRtl ? "تم إنشاء الحساب بنجاح! 🎉" : "Account Created Successfully! 🎉",
        description: isRtl ? "مرحباً بك في متجر ومكتبة دار عبيد." : "Welcome to Dar Obeid Bookstore.",
      });
    } catch (error: any) {
      toast({
        title: isRtl ? "فشل إنشاء الحساب" : "Signup Failed",
        description: error.message || (isRtl ? "حدث خطأ أثناء إنشاء الحساب، يرجى المحاولة مرة أخرى." : "An error occurred during signup."),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white" dir={dir}>
      {/* Ambient Lighting Gradients */}
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(59,130,246,0.18),rgba(255,255,255,0))] pointer-events-none" />
      <div className="fixed top-1/4 start-1/6 w-96 h-96 bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-1/4 end-1/6 w-[450px] h-[450px] bg-cyan-500/10 rounded-full blur-[150px] pointer-events-none" />

      {/* Top Header - Unified Bookstore Brand, No "Back" Icon */}
      <header className="border-b border-slate-800/80 px-4 sm:px-8 py-3.5 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <Link to="/book-store" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-500 p-0.5 shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform flex items-center justify-center text-white">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-white tracking-tight">UNIGATES</span>
                <Badge className="bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-bold px-2 py-0.5">
                  {isRtl ? "متجر الكتب" : "Bookstore"}
                </Badge>
              </div>
              <p className="text-[10px] font-bold text-slate-400">
                {isRtl ? "دار عبيد للنشر والتوزيع والطباعة" : "Dar Obeid Publishing & Distribution"}
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* الرئيسية */}
            <Link to="/book-store">
              <Button size="sm" variant="outline" className="font-bold border-slate-700 bg-slate-900/90 text-slate-200 hover:text-white hover:bg-slate-800 text-xs h-9 px-3.5 rounded-xl gap-1.5 transition-all shadow-sm">
                <Home className="w-4 h-4 text-cyan-400" />
                <span>{isRtl ? "الرئيسية" : "Home"}</span>
              </Button>
            </Link>

            {/* تسجيل الدخول */}
            <Link to="/book-store/login">
              <Button size="sm" variant="outline" className="font-bold border-slate-700 bg-slate-900 text-white hover:bg-slate-800 text-xs h-9 px-3.5 rounded-xl">
                <span>{isRtl ? "تسجيل الدخول" : "Sign In"}</span>
              </Button>
            </Link>

            <div className="h-5 w-px bg-slate-800 hidden sm:block" />

            <ThemeToggle className="h-9 w-9 p-0 rounded-xl border-slate-800 bg-slate-900 text-white" />
            <LanguageSelectorDropdown className="h-9 px-2.5 rounded-xl border-slate-800 bg-slate-900 text-white" />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-8 py-10 sm:py-16 flex items-center">
        {!submitted ? (
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
            
            {/* Visual Value Props Column */}
            <div className="lg:col-span-5 space-y-6">
              <div className="space-y-3.5 text-center lg:text-start">
                <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-300 border border-blue-500/30 px-3.5 py-1.5 rounded-full text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{isRtl ? "انضم إلى مجتمع قراء دار عبيد" : "Join Dar Obeid Readers Hub"}</span>
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                  {isRtl ? (
                    <>
                      أنشئ حسابك <br />
                      <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-300 bg-clip-text text-transparent">
                        واستمتع بتجربة قراءة عالمية
                      </span>
                    </>
                  ) : (
                    <>
                      Create your account <br />
                      <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-300 bg-clip-text text-transparent">
                        For a World-Class Reading Journey
                      </span>
                    </>
                  )}
                </h1>

                <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-medium">
                  {isRtl
                    ? "سجل حسابك كقارئ للتمكن من اقتناء الكتب الرقمية المشفرة بنظام DRM، تتبع شحن النسخ الورقية، وتفعيل مكتبتك الرقمية السحابية فوراً."
                    : "Create a reader account to buy DRM-protected digital books, order physical copies with fast door delivery, and build your cloud library."}
                </p>
              </div>

              {/* Benefits list */}
              <div className="space-y-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-white">{isRtl ? "قراءة سحابية فورية وأوفلاين" : "Instant Cloud & Offline Reading"}</h4>
                    <p className="text-[11px] text-slate-400">{isRtl ? "فتح الكتب بضغطة زر بدون أي برامج خارجية" : "Read seamlessly on web, phone, or tablet"}</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center shrink-0">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-white">{isRtl ? "سلة مشتريات وتتبع شحن حي" : "Cart & Doorstep Courier Tracking"}</h4>
                    <p className="text-[11px] text-slate-400">{isRtl ? "توصيل آمن لجميع محافظات مصر والدول العربية" : "Express delivery to all Egyptian cities"}</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-white">{isRtl ? "حماية كاملة للخصوصية والبيانات" : "Strict Privacy & Consumer Rights"}</h4>
                    <p className="text-[11px] text-slate-400">{isRtl ? "وفق أحكام القانون المصري وحماية المستهلك" : "Compliant with Egyptian consumer laws"}</p>
                  </div>
                </div>
              </div>

              {/* Publisher Bridge */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-900/80 border border-slate-800/90 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-200">
                    {isRtl ? "تريد نشر وتوزيع كتابك؟" : "Want to publish your book?"}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {isRtl ? "توجه إلى منصة نشر المتخصصة لدور النشر والمؤلفين." : "Visit our dedicated Nashr Publishing platform."}
                  </p>
                </div>
                <Link to="/nashr" className="shrink-0">
                  <Button size="sm" variant="outline" className="border-amber-500/40 text-amber-300 hover:bg-amber-500/10 text-xs font-bold gap-1.5 h-9 rounded-xl">
                    <PenTool className="w-3.5 h-3.5" />
                    <span>{isRtl ? "منصة نشر" : "Nashr"}</span>
                  </Button>
                </Link>
              </div>
            </div>

            {/* Signup Card Column */}
            <div className="lg:col-span-7 max-w-lg w-full mx-auto">
              <Card className="border-2 border-slate-800 bg-slate-900/90 backdrop-blur-2xl shadow-2xl rounded-3xl p-6 sm:p-8 relative overflow-hidden">
                <div className="absolute top-0 end-0 w-44 h-44 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

                {/* Card Title */}
                <div className="text-center space-y-2 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-500 mx-auto flex items-center justify-center text-white shadow-xl shadow-blue-500/25">
                    <Library className="w-7 h-7" />
                  </div>
                  <h2 className="text-2xl font-black text-white">
                    {isRtl ? "إنشاء حساب قارئ جديد" : "Create Reader Account"}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {isRtl ? "أدخل بياناتك للانضمام إلى متجر ومكتبة دار عبيد" : "Enter your details to create your reader account"}
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="full_name" className="text-xs font-bold text-slate-200 mb-1.5 block">
                      {isRtl ? "الاسم بالكامل" : "Full Name"} <span className="text-rose-400">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="full_name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder={isRtl ? "د. أحمد محمود" : "John Doe"}
                        required
                        className="h-11 bg-slate-950 border-slate-800 focus:border-blue-500 text-white rounded-xl text-xs ps-10"
                      />
                      <User className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="phone" className="text-xs font-bold text-slate-200 mb-1.5 block">
                      {isRtl ? "رقم الهاتف / الواتساب" : "Phone Number"} <span className="text-rose-400">*</span>
                    </Label>
                    <div className="flex gap-2" dir="ltr">
                      <Select value={countryCode} onValueChange={setCountryCode}>
                        <SelectTrigger className="h-11 w-[120px] shrink-0 bg-slate-950 border-slate-800 text-white rounded-xl text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-800 text-white">
                          {countryCodes.map((c) => (
                            <SelectItem key={c.code} value={c.code}>{c.country} {c.code}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="relative flex-1">
                        <Input
                          id="phone"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="1012345678"
                          required
                          className="h-11 bg-slate-950 border-slate-800 focus:border-blue-500 text-white rounded-xl text-xs ps-10"
                          dir="ltr"
                        />
                        <Phone className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-xs font-bold text-slate-200 mb-1.5 block">
                      {isRtl ? "البريد الإلكتروني" : "Email Address"} <span className="text-rose-400">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="reader@example.com"
                        required
                        className="h-11 bg-slate-950 border-slate-800 focus:border-blue-500 text-white rounded-xl text-xs ps-10"
                        dir="ltr"
                      />
                      <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="password" className="text-xs font-bold text-slate-200 mb-1.5 block">
                        {isRtl ? "كلمة المرور" : "Password"} <span className="text-rose-400">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••••••"
                          required
                          className="h-11 bg-slate-950 border-slate-800 focus:border-blue-500 text-white rounded-xl text-xs ps-10 pe-10"
                          dir="ltr"
                        />
                        <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="confirm_password" className="text-xs font-bold text-slate-200 mb-1.5 block">
                        {isRtl ? "تأكيد كلمة المرور" : "Confirm Password"} <span className="text-rose-400">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="confirm_password"
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••••••"
                          required
                          className="h-11 bg-slate-950 border-slate-800 focus:border-blue-500 text-white rounded-xl text-xs ps-10 pe-10"
                          dir="ltr"
                        />
                        <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400 leading-normal">
                    {isRtl ? "8 خانات على الأقل (حرف كبير، حرف صغير، رقم، رمز خاص)." : "At least 8 chars (uppercase, lowercase, number, symbol)."}
                  </p>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 text-sm font-black text-white shadow-xl rounded-xl gap-2 mt-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-blue-500/25"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    <span>{isRtl ? "إنشاء حساب وبدء القراءة" : "Create Account & Start Reading"}</span>
                  </Button>

                  <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 pt-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{isRtl ? "حماية خصوصيتك مشفرة ومحمية وفق القانون المصري" : "Protected under Egyptian consumer privacy laws"}</span>
                  </div>

                  <Separator className="my-3 bg-slate-800" />

                  {/* Card Footer */}
                  <div className="text-center text-xs text-slate-400">
                    <p>
                      {isRtl ? "لديك حساب قارئ بالفعل؟" : "Already have an account?"}{" "}
                      <Link to="/book-store/login" className="text-cyan-400 font-black hover:underline">
                        {isRtl ? "تسجيل الدخول هنا" : "Sign In Here"}
                      </Link>
                    </p>
                  </div>
                </form>
              </Card>
            </div>
          </div>
        ) : (
          /* Confirmation State */
          <div className="max-w-md w-full mx-auto text-center space-y-6 bg-slate-900/90 border-2 border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/25">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white">
                {isRtl ? "تم تفعيل حسابك بنجاح! 🎉" : "Account Ready! 🎉"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {isRtl
                  ? `أهلاً بك يا ${fullName} في متجر ومكتبة دار عبيد. تم تسجيل حسابك (${email}) بنجاح ويمكنك الآن تصفح واقتناء الكتب والوصول لمكتبتك الرقمية.`
                  : `Welcome, ${fullName}! Your account (${email}) is activated. You can now purchase books and access your digital library.`}
              </p>
            </div>
            <div className="pt-2 flex flex-col gap-2.5">
              <Link to="/book-store/reader-dashboard">
                <Button className="w-full h-11 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 font-black text-white">
                  {isRtl ? "الانتقال إلى مكتبتي الرقمية" : "Go to My Digital Library"}
                </Button>
              </Link>
              <Link to="/book-store">
                <Button variant="outline" className="w-full h-11 rounded-xl border-slate-700 bg-slate-950 text-white font-bold hover:bg-slate-800">
                  {isRtl ? "العودة لتصفح متجر الكتب" : "Browse Bookstore"}
                </Button>
              </Link>
            </div>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
};

export default BookStoreSignup;
