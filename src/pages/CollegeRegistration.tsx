import { useState } from "react";
import { Link } from "react-router-dom";
import { Landmark, Loader2, Globe, ArrowLeft, ArrowRight, CheckCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

const countryCodes = [
  { code: "+20", country: "🇪🇬" }, { code: "+966", country: "🇸🇦" },
  { code: "+971", country: "🇦🇪" }, { code: "+965", country: "🇰🇼" },
  { code: "+974", country: "🇶🇦" }, { code: "+962", country: "🇯🇴" },
  { code: "+1", country: "🇺🇸" }, { code: "+44", country: "🇬🇧" },
];

const CollegeRegistration = () => {
  const { t, dir, language, toggleLanguage } = useLanguage();
  const isRtl = dir === "rtl";
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
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!collegeName || !city || !deanName || !email || !phone) {
      toast({
        title: isRtl ? "خطأ" : "Error",
        description: isRtl ? "يرجى ملء جميع الحقول المطلوبة" : "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
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
      <header className="border-b border-border px-6 py-4 bg-primary/5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Landmark className="w-8 h-8 text-primary" />
            <span className="text-2xl font-black text-foreground tracking-tight">{t.brandName}</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="default" size="sm" className="font-semibold">{t.login}</Button>
            </Link>
            <Button variant="default" size="sm" onClick={toggleLanguage} className="font-semibold gap-1.5">
              <Globe className="w-4 h-4" />
              {t.langSwitch}
            </Button>
            <Link to="/signup">
              <Button variant="default" size="icon" className="rounded-full w-9 h-9">
                {isRtl ? <ArrowLeft className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
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
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
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

              <Button size="lg" className="w-full h-14 text-lg font-bold gap-2" disabled={!collegeName || !city || !deanName || !email || !phone || loading} onClick={handleSubmit}>
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                {isRtl ? "إرسال الطلب" : "Submit Request"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="max-w-lg w-full text-center">
            <div className="mb-8 flex justify-center">
              <div className="w-24 h-24 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-emerald-500" />
              </div>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-foreground mb-4">
              {isRtl ? "تم إرسال طلبك بنجاح!" : "Request Submitted Successfully!"}
            </h1>
            <p className="text-muted-foreground mb-10 leading-relaxed max-w-md mx-auto">
              {isRtl
                ? "شكراً لك! سيتم مراجعة طلب تسجيل كليتك من قبل فريق الإدارة والتواصل معك قريباً."
                : "Thank you! Your college registration request will be reviewed and we'll contact you soon."}
            </p>
            <div className="flex gap-3 justify-center">
              <Link to="/university-platform">
                <Button size="lg" className="h-14 text-lg font-bold px-8">
                  {isRtl ? "العودة للمنصة" : "Back to Platform"}
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
