import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Landmark, Loader2, Globe, ArrowLeft, ArrowRight, CheckCircle, Send, Eye, EyeOff, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSmartBack } from "@/hooks/use-smart-back";

const countryCodes = [
  { code: "+20", country: "🇪🇬" }, { code: "+966", country: "🇸🇦" },
  { code: "+971", country: "🇦🇪" }, { code: "+965", country: "🇰🇼" },
  { code: "+974", country: "🇶🇦" }, { code: "+962", country: "🇯🇴" },
  { code: "+1", country: "🇺🇸" }, { code: "+44", country: "🇬🇧" },
];

const CollegeRegistration = () => {
  const { t, dir, language, toggleLanguage } = useLanguage();
  const isRtl = dir === "rtl";
  const goBack = useSmartBack();
  const { toast } = useToast();

  const [collegeName, setCollegeName] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [deanName, setDeanName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+20");
  const [studentCount, setStudentCount] = useState("");
  const [departmentCount, setDepartmentCount] = useState("");
  const [message, setMessage] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!collegeName || !city || !deanName || !email || !phone || !password) {
      toast({
        title: isRtl ? "خطأ" : "Error",
        description: isRtl ? "يرجى ملء جميع الحقول المطلوبة" : "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: isRtl ? "خطأ" : "Error",
        description: isRtl ? "الرقم السري غير متطابق" : "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Create auth account with email verification
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: { institution_type: 'college', institution_name: collegeName },
        },
      });
      if (authError) throw authError;

      // Insert registration record
      const { error } = await supabase.from("college_registrations").insert({
        college_name: collegeName,
        city,
        address: address || null,
        dean_name: deanName,
        email,
        phone: `${countryCode}${phone}`,
        student_count: studentCount ? parseInt(studentCount) : 0,
        message: departmentCount ? `${isRtl ? "عدد الأقسام" : "Departments"}: ${departmentCount}. ${message}` : message || null,
        type: "college",
      });
      if (error) throw error;
      setSubmitted(true);
    } catch (error: any) {
      toast({
        title: isRtl ? "خطأ" : "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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
            <Button size="icon" className="rounded-full w-10 h-10 bg-gradient-to-br from-primary to-[hsl(200,75%,30%)] shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/30 transition-all text-white" onClick={goBack}>
              {isRtl ? <ArrowLeft className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </header>

      <Separator />

      <main className="flex-1 flex items-center justify-center px-4 py-10">
        {!submitted ? (
          <div className="max-w-2xl w-full">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 shadow-lg shadow-primary/20 flex items-center justify-center">
                  <Landmark className="w-8 h-8 text-primary" />
                </div>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-foreground mb-2">
                {isRtl ? "تسجيل كلية جديدة" : "Register a New College"}
              </h1>
              <p className="text-muted-foreground">
                {isRtl
                  ? "أكمل النموذج التالي وسيتم مراجعة طلبك من قبل الإدارة"
                  : "Complete the form below and your request will be reviewed by administration"}
              </p>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="mb-2 block font-semibold">
                    {isRtl ? "اسم الكلية" : "College Name"} <span className="text-destructive">*</span>
                  </Label>
                  <Input placeholder={isRtl ? "أدخل اسم الكلية" : "Enter college name"} value={collegeName} onChange={(e) => setCollegeName(e.target.value)} className="h-12" />
                </div>
                <div>
                  <Label className="mb-2 block font-semibold">
                    {isRtl ? "المدينة" : "City"} <span className="text-destructive">*</span>
                  </Label>
                  <Input placeholder={isRtl ? "أدخل المدينة" : "Enter city"} value={city} onChange={(e) => setCity(e.target.value)} className="h-12" />
                </div>
              </div>

              <div>
                <Label className="mb-2 block font-semibold">{isRtl ? "العنوان التفصيلي" : "Detailed Address"}</Label>
                <Input placeholder={isRtl ? "أدخل العنوان التفصيلي" : "Enter detailed address"} value={address} onChange={(e) => setAddress(e.target.value)} className="h-12" />
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="mb-2 block font-semibold">
                    {isRtl ? "اسم العميد / المسؤول" : "Dean / Contact Name"} <span className="text-destructive">*</span>
                  </Label>
                  <Input placeholder={isRtl ? "أدخل اسم العميد" : "Enter dean name"} value={deanName} onChange={(e) => setDeanName(e.target.value)} className="h-12" />
                </div>
                <div>
                  <Label className="mb-2 block font-semibold">
                    {isRtl ? "البريد الإلكتروني" : "Email"} <span className="text-destructive">*</span>
                  </Label>
                  <Input type="email" placeholder="college@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12" dir="ltr" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="mb-2 block font-semibold">
                    {isRtl ? "الرقم السري" : "Password"} <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder={isRtl ? "أدخل الرقم السري" : "Enter password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 pe-12 text-right"
                      dir="rtl"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute top-1/2 -translate-y-1/2 left-3 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <Label className="mb-2 block font-semibold">
                    {isRtl ? "إعادة كتابة الرقم السري" : "Confirm Password"} <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder={isRtl ? "أعد كتابة الرقم السري" : "Re-enter password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="h-12 pe-12 text-right"
                      dir="rtl"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute top-1/2 -translate-y-1/2 left-3 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {password && confirmPassword && password !== confirmPassword && (
                    <p className="text-sm text-destructive mt-1">{isRtl ? "الرقم السري غير متطابق" : "Passwords do not match"}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="mb-2 block font-semibold">
                    {isRtl ? "رقم الهاتف" : "Phone Number"} <span className="text-destructive">*</span>
                  </Label>
                  <div className="flex gap-2" dir="ltr">
                    <Select value={countryCode} onValueChange={setCountryCode}>
                      <SelectTrigger className="h-12 w-[110px] shrink-0"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {countryCodes.map((c) => (
                          <SelectItem key={c.code} value={c.code}>{c.country} {c.code}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input type="tel" placeholder="12345678" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-12 flex-1" dir="ltr" />
                  </div>
                </div>
                <div>
                  <Label className="mb-2 block font-semibold">{isRtl ? "عدد الطلاب (تقريبي)" : "Student Count (approx.)"}</Label>
                  <Input type="number" placeholder={isRtl ? "مثال: 2000" : "e.g. 2000"} value={studentCount} onChange={(e) => setStudentCount(e.target.value)} className="h-12" dir="ltr" />
                </div>
              </div>

              <div>
                <Label className="mb-2 block font-semibold">{isRtl ? "عدد الأقسام العلمية" : "Number of Departments"}</Label>
                <Input type="number" placeholder={isRtl ? "مثال: 10" : "e.g. 10"} value={departmentCount} onChange={(e) => setDepartmentCount(e.target.value)} className="h-12" dir="ltr" />
              </div>

              <div>
                <Label className="mb-2 block font-semibold">{isRtl ? "رسالة إضافية" : "Additional Message"}</Label>
                <Textarea placeholder={isRtl ? "أي ملاحظات أو متطلبات خاصة..." : "Any notes or special requirements..."} value={message} onChange={(e) => setMessage(e.target.value)} className="min-h-[100px]" />
              </div>

              <Button size="lg" className="w-full h-14 text-lg font-bold gap-2" disabled={!collegeName || !city || !deanName || !email || !phone || !password || !confirmPassword || password !== confirmPassword || loading} onClick={handleSubmit}>
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                {isRtl ? "إرسال الطلب" : "Submit Request"}
              </Button>

              {/* Subscription Pricing Banner */}
              <div className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-6 space-y-4">
                <div className="flex items-center justify-center gap-3">
                  <div className="bg-primary text-primary-foreground rounded-xl px-5 py-3 text-center">
                    <p className="text-3xl font-black">299</p>
                    <p className="text-xs font-semibold opacity-90">{isRtl ? "جنيه / طالب / شهرياً" : "EGP / Student / Monthly"}</p>
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-bold text-foreground">
                    {isRtl ? "خطة اشتراك الكلية" : "College Subscription Plan"}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {isRtl
                      ? "التسجيل مجاني تماماً. يخضع الطلب لمراجعة المنصة والتواصل مع الكلية لإبرام العقد. يتم تفعيل الحساب بعد الموافقة من لوحة الإدارة."
                      : "Registration is completely free. Your request will be reviewed by the platform and we will contact the college to finalize the contract. Account activation is done after admin approval."}
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-primary font-semibold">
                  <CheckCircle className="w-4 h-4" />
                  <span>{isRtl ? "التسجيل مجاني - الدفع عند تسجيل الأقسام فقط" : "Free registration - Payment only when adding departments"}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-lg w-full text-center">
            <div className="mb-8 flex justify-center">
              <div className="w-24 h-24 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                <Send className="w-12 h-12 text-emerald-500" />
              </div>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-foreground mb-4">
              {isRtl ? "تم إرسال طلبك بنجاح!" : "Request Submitted Successfully!"}
            </h1>
            <p className="text-muted-foreground mb-4 leading-relaxed max-w-md mx-auto">
              {isRtl
                ? "تم إرسال رابط التفعيل إلى بريدك الإلكتروني. يرجى تفعيل حسابك لإكمال عملية التسجيل."
                : "A verification link has been sent to your email. Please verify your account to complete registration."}
            </p>
            <p className="text-sm font-bold text-foreground mb-2">{email}</p>
            <p className="text-muted-foreground mb-10 text-sm leading-relaxed max-w-md mx-auto">
              {isRtl
                ? "بعد التفعيل، سيتم مراجعة طلب تسجيل كليتك من قبل فريق إدارة منصة إدراك والتواصل معك قريباً."
                : "After verification, your college registration request will be reviewed by the Edrak platform team and we'll contact you soon."}
            </p>
            <div className="flex gap-3 justify-center">
              <Link to="/login">
                <Button size="lg" className="h-14 text-lg font-bold px-8">
                  {isRtl ? "الذهاب لتسجيل الدخول" : "Go to Login"}
                </Button>
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default CollegeRegistration;
