import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { School, Loader2, Globe, ArrowRight, ArrowLeft, CheckCircle, Send } from "lucide-react";
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

const SchoolRegistration = () => {
  const { t, dir, language, toggleLanguage } = useLanguage();
  const isRtl = dir === "rtl";
  const goBack = useSmartBack();
  const { toast } = useToast();

  const [schoolName, setSchoolName] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [principalName, setPrincipalName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+20");
  const [studentCount, setStudentCount] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!schoolName || !city || !principalName || !email || !phone) {
      toast({
        title: isRtl ? "خطأ" : "Error",
        description: isRtl ? "يرجى ملء جميع الحقول المطلوبة" : "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("school_registrations").insert({
        school_name: schoolName,
        city,
        address: address || null,
        principal_name: principalName,
        email,
        phone: `${countryCode}${phone}`,
        student_count: studentCount ? parseInt(studentCount) : 0,
        message: message || null,
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
          <Link to="/school-platform" className="flex items-center gap-2">
            <School className="w-8 h-8 text-primary" />
            <span className="text-2xl font-black text-foreground tracking-tight">{t.schoolPlatform}</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="default" size="sm" onClick={toggleLanguage} className="font-semibold gap-1.5">
              <Globe className="w-4 h-4" />
              {t.langSwitch}
            </Button>
            <Button variant="default" size="icon" className="rounded-full w-9 h-9" onClick={goBack}>
              {isRtl ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
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
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <School className="w-8 h-8 text-primary" />
                </div>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-foreground mb-2">
                {isRtl ? "طلب تسجيل مدرسة" : "School Registration Request"}
              </h1>
              <p className="text-muted-foreground">
                {isRtl
                  ? "أكمل النموذج التالي وسيتم مراجعة طلبك من قبل الإدارة"
                  : "Complete the form below and your request will be reviewed by the administration"}
              </p>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="mb-2 block font-semibold">
                    {isRtl ? "اسم المدرسة" : "School Name"} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    placeholder={isRtl ? "أدخل اسم المدرسة" : "Enter school name"}
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    className="h-12"
                  />
                </div>
                <div>
                  <Label className="mb-2 block font-semibold">
                    {isRtl ? "المدينة" : "City"} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    placeholder={isRtl ? "أدخل المدينة" : "Enter city"}
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="h-12"
                  />
                </div>
              </div>

              <div>
                <Label className="mb-2 block font-semibold">
                  {isRtl ? "العنوان التفصيلي" : "Detailed Address"}
                </Label>
                <Input
                  placeholder={isRtl ? "أدخل العنوان التفصيلي" : "Enter detailed address"}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="h-12"
                />
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="mb-2 block font-semibold">
                    {isRtl ? "اسم المدير / المسؤول" : "Principal / Contact Name"} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    placeholder={isRtl ? "أدخل اسم المسؤول" : "Enter contact name"}
                    value={principalName}
                    onChange={(e) => setPrincipalName(e.target.value)}
                    className="h-12"
                  />
                </div>
                <div>
                  <Label className="mb-2 block font-semibold">
                    {isRtl ? "البريد الإلكتروني" : "Email"} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="email"
                    placeholder="school@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="mb-2 block font-semibold">
                    {isRtl ? "رقم الهاتف" : "Phone Number"} <span className="text-destructive">*</span>
                  </Label>
                  <div className="flex gap-2" dir="ltr">
                    <Select value={countryCode} onValueChange={setCountryCode}>
                      <SelectTrigger className="h-12 w-[110px] shrink-0">
                        <SelectValue />
                      </SelectTrigger>
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
                  <Label className="mb-2 block font-semibold">
                    {isRtl ? "عدد الطلاب (تقريبي)" : "Student Count (approx.)"}
                  </Label>
                  <Input
                    type="number"
                    placeholder={isRtl ? "مثال: 500" : "e.g. 500"}
                    value={studentCount}
                    onChange={(e) => setStudentCount(e.target.value)}
                    className="h-12"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <Label className="mb-2 block font-semibold">
                  {isRtl ? "رسالة إضافية" : "Additional Message"}
                </Label>
                <Textarea
                  placeholder={isRtl ? "أي ملاحظات أو متطلبات خاصة..." : "Any notes or special requirements..."}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              <Button
                size="lg"
                className="w-full h-14 text-lg font-bold gap-2"
                disabled={!schoolName || !city || !principalName || !email || !phone || loading}
                onClick={handleSubmit}
              >
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
                ? "شكراً لك! سيتم مراجعة طلب تسجيل مدرستك من قبل فريق الإدارة والتواصل معك قريباً عبر البريد الإلكتروني."
                : "Thank you! Your school registration request will be reviewed by the administration team and we'll contact you soon via email."}
            </p>
            <div className="flex gap-3 justify-center">
              <Link to="/school-platform">
                <Button size="lg" className="h-14 text-lg font-bold px-8">
                  {isRtl ? "العودة للمنصة" : "Back to Platform"}
                </Button>
              </Link>
              <Link to="/">
                <Button variant="outline" size="icon" className="rounded-full w-12 h-12">
                  {isRtl ? <ArrowRight className="w-6 h-6" /> : <ArrowLeft className="w-6 h-6" />}
                </Button>
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default SchoolRegistration;
