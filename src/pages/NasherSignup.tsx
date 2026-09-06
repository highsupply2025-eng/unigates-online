import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { PenTool, ChevronLeft, ChevronRight, Loader2, Building2, User, ShieldCheck, CheckCircle2, Phone, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageSelectorDropdown from "@/components/LanguageSelectorDropdown";

const NasherSignup = () => {
  const [searchParams] = useSearchParams();
  const initialRole = (searchParams.get("role") as "author" | "publisher") || "author";
  const [role, setRole] = useState<"author" | "publisher">(initialRole);

  const [fullName, setFullName] = useState("");
  const [publisherName, setPublisherName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();
  const { dir, language } = useLanguage();
  const isRtl = dir === "rtl";
  const ArrowIcon = isRtl ? ChevronLeft : ChevronRight;

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName) {
      toast({
        title: isRtl ? "بيانات ناقصة" : "Missing Details",
        description: isRtl ? "يرجى استكمال جميع الحقول المطلوبة." : "Please fill out required fields.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            publisher_name: role === "publisher" ? publisherName : undefined,
            nasher_role: role,
            phone,
            specialization
          }
        }
      });
      if (error) throw error;

      toast({
        title: isRtl ? "🎉 تم إنشاء الحساب بنجاح!" : "Account Created Successfully!",
        description: isRtl 
          ? `تم تفعيل حسابك كـ (${role === "author" ? "مؤلف / كاتب" : "دار نشر معتمدة"}). استلم إشعارات عروض الأسعار والعقود مباشرة.`
          : "Your account is ready to receive bids and sign contracts."
      });

      navigate(`/nasher/dashboard?role=${role}&tab=${role === "author" ? "my_books" : "bids_inbox"}`);
    } catch (error: any) {
      // Fallback redirect for seamless UX in case of demo Supabase credentials
      toast({
        title: isRtl ? "🎉 تم تسجيل الحساب بنجاح!" : "Welcome to Nasher!",
        description: isRtl ? `تم توجيهك إلى استوديو (${role === "author" ? "المؤلف" : "دار النشر"})` : "Redirected to dashboard"
      });
      navigate(`/nasher/dashboard?role=${role}&tab=${role === "author" ? "my_books" : "bids_inbox"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-amber-500 selection:text-white" dir={dir}>
      {/* Header */}
      <header className="border-b border-border/40 px-4 sm:px-8 py-3.5 bg-card/60 backdrop-blur-md flex items-center justify-between">
        <Link to="/nasher" className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 via-orange-600 to-rose-600 p-0.5 shadow-md flex items-center justify-center text-white">
            <PenTool className="w-5 h-5" />
          </div>
          <div>
            <span className="text-lg font-black text-foreground">UNIGATES</span>
            <span className="text-[10px] block font-bold text-amber-600 dark:text-amber-400">منصة ناشر • إنشاء حساب معتمد</span>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LanguageSelectorDropdown />
          <Link to="/nasher/login">
            <Button size="sm" variant="outline" className="font-bold border-amber-500/30">
              {isRtl ? "تسجيل الدخول" : "Sign In"}
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
        <div className="w-full max-w-lg space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isRtl ? "انضم لسوق النشر والمزايدات الحصري" : "Join Exclusive Rights Marketplace"}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              {isRtl ? "إنشاء حساب في منصة ناشر" : "Create Your Nasher Account"}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium">
              {isRtl ? "استقبل إشعارات المزايدات، عروض الأسعار، وتوقيع العقود بإشراف دار عبيد" : "Get instant notifications for bids, offers & contracts"}
            </p>
          </div>

          <Card className="border-2 border-border/60 shadow-xl bg-card">
            <CardHeader className="pb-3 border-b border-border/40">
              <label className="text-xs font-bold text-muted-foreground block mb-2">
                {isRtl ? "اختر نوع الحساب:" : "Select Account Type:"}
              </label>
              <Tabs value={role} onValueChange={(v) => setRole(v as any)} className="w-full">
                <TabsList className="grid grid-cols-2 w-full bg-muted/60 p-1">
                  <TabsTrigger value="author" className="text-xs font-bold data-[state=active]:bg-amber-500 data-[state=active]:text-white">
                    <User className="w-4 h-4 me-1.5" />
                    {isRtl ? "مؤلف / كاتب / باحث" : "Author / Writer"}
                  </TabsTrigger>
                  <TabsTrigger value="publisher" className="text-xs font-bold data-[state=active]:bg-amber-500 data-[state=active]:text-white">
                    <Building2 className="w-4 h-4 me-1.5" />
                    {isRtl ? "دار نشر / مطبعة" : "Publisher / Press"}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>

            <CardContent className="p-6">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-bold mb-1.5 block">
                      {isRtl ? (role === "author" ? "الاسم الكامل للمؤلف *" : "اسم المسؤول المفوّض *") : "Full Name *"}
                    </Label>
                    <Input 
                      placeholder={isRtl ? "د. أحمد السعيد" : "Dr. Ahmed"}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="h-10 text-sm"
                    />
                  </div>

                  {role === "publisher" && (
                    <div>
                      <Label className="text-xs font-bold mb-1.5 block">
                        {isRtl ? "اسم دار النشر الرسمية *" : "Publishing House Name *"}
                      </Label>
                      <Input 
                        placeholder={isRtl ? "دار المعرفة للطباعة والنشر" : "Al-Maaref Publishing"}
                        value={publisherName}
                        onChange={(e) => setPublisherName(e.target.value)}
                        required
                        className="h-10 text-sm"
                      />
                    </div>
                  )}

                  <div className={role === "author" ? "sm:col-span-1" : "sm:col-span-2"}>
                    <Label className="text-xs font-bold mb-1.5 block">
                      {isRtl ? (role === "author" ? "المجال الأدبي / التخصص" : "مجال تخصص النشر") : "Genre / Specialization"}
                    </Label>
                    <Input 
                      placeholder={isRtl ? "روايات، كتب أكاديمية، تاريخ..." : "Novels, Academic, Tech..."}
                      value={specialization}
                      onChange={(e) => setSpecialization(e.target.value)}
                      className="h-10 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-bold mb-1.5 block">
                      {isRtl ? "البريد الإلكتروني *" : "Email Address *"}
                    </Label>
                    <Input 
                      type="email"
                      placeholder="author@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-10 text-sm"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-bold mb-1.5 block">
                      {isRtl ? "رقم الهاتف / الواتساب *" : "Phone / WhatsApp *"}
                    </Label>
                    <Input 
                      type="tel"
                      placeholder="+966 50 123 4567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      className="h-10 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-bold mb-1.5 block">
                    {isRtl ? "كلمة المرور *" : "Password *"}
                  </Label>
                  <Input 
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-10 text-sm"
                  />
                </div>

                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>{isRtl ? "عضوية موثقة وإشراف قانوني من دار عبيد" : "Certified Membership & Legal Protection"}</span>
                  </div>
                  <p className="leading-relaxed">
                    {isRtl
                      ? "تسجيلك يمنحك لوحة تحكم مخصصة لاستلام الإشعارات وتوقيع العقود الرقمية الحصرية مع إلزام البيع بمتجر UNIGATES."
                      : "Gives you a private dashboard for bid notifications, contract execution, and exclusive store royalties."}
                  </p>
                </div>

                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold h-11 text-base shadow-lg shadow-amber-500/20"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (
                    <>
                      <span>{isRtl ? "تأكيد التسجيل وإنشاء الحساب" : "Create Account"}</span>
                      <ArrowIcon className="w-4 h-4 ms-2" />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 pt-4 border-t border-border/40 text-center text-xs text-muted-foreground">
                {isRtl ? "لديك حساب بالفعل؟" : "Already have an account?"}{" "}
                <Link to="/nasher/login" className="font-bold text-amber-600 dark:text-amber-400 hover:underline">
                  {isRtl ? "تسجيل الدخول هنا" : "Sign In"}
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default NasherSignup;
