import { useState } from "react";
import { Link } from "react-router-dom";
import { GraduationCap, Monitor, Tablet, Smartphone, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      {/* Header */}
      <header className="border-b border-border px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <GraduationCap className="w-8 h-8 text-primary" />
            <span className="text-2xl font-black text-foreground tracking-tight">مَعرِفة</span>
          </Link>
          <Link to="/" className="text-sm font-semibold text-primary hover:underline">
            تسجيل الدخول
          </Link>
        </div>
      </header>

      <Separator />

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-lg w-full text-center">
          {/* Device Icons */}
          <div className="flex items-center justify-center gap-6 mb-8">
            <Monitor className="w-16 h-16 text-primary stroke-[1.2]" />
            <Tablet className="w-14 h-14 text-primary stroke-[1.2]" />
            <Smartphone className="w-10 h-10 text-primary stroke-[1.2]" />
          </div>

          {/* Step Indicator */}
          <p className="text-sm text-muted-foreground mb-2">
            الخطوة <span className="font-bold text-foreground">1</span> من <span className="font-bold text-foreground">3</span>
          </p>

          {/* Title */}
          <h1 className="text-2xl md:text-3xl font-black text-foreground mb-4">
            أكمل إعداد حسابك
          </h1>

          {/* Description */}
          <p className="text-muted-foreground mb-8 leading-relaxed max-w-md mx-auto">
            سنرسل رابط التسجيل إلى بريدك الإلكتروني حتى تتمكن من استخدام{" "}
            <span className="font-bold text-foreground">مَعرِفة</span>{" "}
            على أي جهاز في أي وقت.
          </p>

          {/* Email Input */}
          <div className="space-y-4 max-w-md mx-auto">
            <Input
              type="email"
              placeholder="أدخل بريدك الإلكتروني"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-14 text-base bg-secondary border-border text-center"
            />

            {/* Checkbox */}
            <div className="flex items-center gap-3 justify-start text-right">
              <Checkbox
                id="no-offers"
                checked={agreed}
                onCheckedChange={(checked) => setAgreed(checked as boolean)}
                className="border-muted-foreground data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <label
                htmlFor="no-offers"
                className="text-sm text-muted-foreground cursor-pointer select-none"
              >
                لا ترسل لي عروض وتحديثات عبر البريد الإلكتروني
              </label>
            </div>

            {/* Send Link Button */}
            <Button
              size="lg"
              className="w-full h-14 text-lg font-bold gap-2"
              disabled={!email}
            >
              <ChevronLeft className="w-5 h-5" />
              إرسال الرابط
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-secondary/50 px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-muted-foreground text-sm mb-4">
            أسئلة؟ اتصل بنا: <span className="font-semibold">800 850 1076</span> (مجاني)
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            {["الأسئلة الشائعة", "مركز المساعدة", "شروط الاستخدام", "الخصوصية", "تفضيلات ملفات تعريف الارتباط", "معلومات الشركة"].map(
              (link) => (
                <a key={link} href="#" className="text-muted-foreground hover:text-foreground hover:underline py-1">
                  {link}
                </a>
              )
            )}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Signup;
