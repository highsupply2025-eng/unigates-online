import React, { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Gift, 
  Sparkles, 
  Heart, 
  Send, 
  Mail, 
  Phone, 
  Crown, 
  CheckCircle2, 
  ArrowLeft, 
  ArrowRight,
  BookOpen,
  Store,
  Library,
  Palette,
  Truck
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { useSmartBack } from "@/hooks/use-smart-back";
import SiteFooter from "@/components/SiteFooter";
import LanguageSelectorDropdown from "@/components/LanguageSelectorDropdown";
import ThemeToggle from "@/components/ThemeToggle";

export const BookStoreGiftPage: React.FC = () => {
  const { dir } = useLanguage();
  const isRtl = dir === "rtl";
  const { toast } = useToast();
  const goBack = useSmartBack("/book-store");

  const [giftType, setGiftType] = useState<"digital" | "physical">("digital");
  const [recipientName, setRecipientName] = useState("");
  const [recipientContact, setRecipientContact] = useState("");
  const [senderName, setSenderName] = useState("");
  const [giftMessage, setGiftMessage] = useState(
    isRtl
      ? "إلى زميلي العزيز، أتمنى لك التوفيق والتميز الأكاديمي الدائم! استمتع بقراءة هذا المرجع القيم."
      : "To my dear friend, wishing you great academic success and inspiration! Enjoy this valuable book."
  );
  const [cardTheme, setCardTheme] = useState<"rose" | "gold" | "royal" | "emerald">("gold");
  const [isWaitlisted, setIsWaitlisted] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState("");

  const themeClasses = {
    gold: "from-amber-500/20 via-orange-500/10 to-transparent border-amber-500/40 text-amber-600",
    rose: "from-rose-500/20 via-pink-500/10 to-transparent border-rose-500/40 text-rose-600",
    royal: "from-indigo-500/20 via-purple-500/10 to-transparent border-indigo-500/40 text-indigo-600",
    emerald: "from-emerald-500/20 via-teal-500/10 to-transparent border-emerald-500/40 text-emerald-600"
  };

  const handleSendGift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientName || !recipientContact) {
      toast({
        title: isRtl ? "يرجى تعبئة بيانات المستلم" : "Please fill recipient details",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: isRtl ? "تم تجهيز بطاقة الإهداء بنجاح! 🎁" : "Gift Card Prepared Successfully!",
      description: isRtl
        ? `سيتم إرسال الإهداء لـ ${recipientName} عبر ${recipientContact} فور تفعيل باقة الهدايا.`
        : `Gift card will be dispatched to ${recipientName} upon official launch.`
    });
  };

  const handleWaitlist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistEmail) return;
    setIsWaitlisted(true);
    toast({
      title: isRtl ? "تم التسجيل في قائمة باقة الإهداءات! 🎁" : "Gift Service Waitlist Confirmed!",
      description: isRtl
        ? "ستحصل على بطاقة تغليف وإهداء فاخرة مجاناً مع أول كتاب تهديه."
        : "You'll get free luxury packaging on your first gift."
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-rose-600 selection:text-white" dir={dir}>
      {/* Top Header */}
      <header className="border-b border-border/40 px-4 sm:px-8 py-3.5 bg-card/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={goBack}
              className="font-bold gap-1.5 h-9 px-2.5 sm:px-3 border-border/80 text-foreground hover:bg-muted rounded-xl"
              title={isRtl ? "رجوع لمتجر الكتب" : "Back to Store"}
            >
              {isRtl ? <ArrowRight className="w-4 h-4 text-rose-500" /> : <ArrowLeft className="w-4 h-4 text-rose-500" />}
              <span>{isRtl ? "رجوع" : "Back"}</span>
            </Button>

            <Link to="/book-store" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-500 via-pink-600 to-red-600 p-0.5 shadow-md flex items-center justify-center text-white">
                <Gift className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg sm:text-xl font-black text-foreground">
                  UNIGATES
                </span>
                <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400">
                  {isRtl ? "إهداء الكتب الرقمية والورقية" : "Gift a Book Service"}
                </p>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/book-store">
              <Button variant="ghost" size="sm" className="text-xs font-bold gap-1.5 text-muted-foreground hover:text-foreground">
                <Store className="w-4 h-4" />
                {isRtl ? "المتجر" : "Store"}
              </Button>
            </Link>
            <Link to="/book-store/reader/dashboard">
              <Button variant="outline" size="sm" className="text-xs font-bold gap-1.5 border-border">
                <Library className="w-4 h-4" />
                {isRtl ? "مكتبتي" : "My Library"}
              </Button>
            </Link>
            <LanguageSelectorDropdown />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="relative overflow-hidden bg-gradient-to-b from-rose-500/10 via-background to-background py-12 sm:py-16 border-b border-border/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-extrabold shadow-sm">
                <Heart className="w-4 h-4 text-rose-500" />
                <span>{isRtl ? "شارك المعرفة • إهداء فاخر • قريباً" : "Share Knowledge • Gift Packs • Coming Soon"}</span>
                <Badge variant="secondary" className="bg-rose-600 text-white hover:bg-rose-700 text-[10px] py-0 px-2">
                  Coming Soon
                </Badge>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground leading-tight">
                {isRtl ? (
                  <>
                    إهداء الكتب الرقمية والورقية <span className="bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">مع بطاقة إهداء مخصصة ورسالة شخصية</span>
                  </>
                ) : (
                  <>
                    Gift Digital & Print Books <span className="bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">with Custom Gift Cards</span>
                  </>
                )}
              </h1>

              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                {isRtl
                  ? "أهدِ زملائك في الكلية، أصدقائك أو باحثيك كتاباً مميزاً. اختر ما بين إرسال نسخة رقمية مشفرة تصل فوراً إلى مكتبة المستلم الخاصة، أو نسخة ورقية فاخرة مغلفة تُشحن لباب منزله."
                  : "Gift an inspiring textbook or novel to a friend or classmate. Choose instant digital DRM delivery straight into their e-library or premium gift-wrapped doorstep courier dispatch."}
              </p>
            </div>

            {/* Waitlist Box */}
            <Card className="w-full lg:w-96 border-rose-500/30 shadow-xl bg-card/90 backdrop-blur">
              <CardHeader className="p-5 pb-3">
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-rose-600" />
                  {isRtl ? "احجز اشتراك باقة الهدايا" : "Gift Service Early Access"}
                </CardTitle>
                <CardDescription className="text-xs">
                  {isRtl ? "كن أول من يهدي المعرفة مع تغليف مجاني" : "Free gift wrapping on launch"}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 pt-0">
                {isWaitlisted ? (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-center text-xs font-bold space-y-1">
                    <CheckCircle2 className="w-6 h-6 mx-auto text-emerald-500 mb-1" />
                    <p>{isRtl ? "تم تسجيلك بنجاح!" : "Waitlist Confirmed!"}</p>
                    <p className="text-[11px] font-normal text-muted-foreground">
                      {isRtl ? "سنرسل لك دعوة لتجربة الإهداء فور التدشين." : "We'll notify you upon release."}
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleWaitlist} className="space-y-3">
                    <Input
                      type="email"
                      required
                      placeholder={isRtl ? "بريدك الإلكتروني..." : "Enter your email..."}
                      value={waitlistEmail}
                      onChange={(e) => setWaitlistEmail(e.target.value)}
                      className="text-xs"
                    />
                    <Button type="submit" className="w-full bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white font-bold text-xs py-2 shadow-md">
                      {isRtl ? "انضم لقائمة الانتظار" : "Join Waitlist"}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Gift Configurator & Live Card Preview */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-8 py-10 w-full space-y-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Form Side */}
          <Card className="lg:col-span-6 border-border shadow-md bg-card">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-base font-black flex items-center gap-2">
                <Palette className="w-4 h-4 text-rose-600" />
                {isRtl ? "تخصيص بطاقة وهدية الكتاب" : "Customize Book Gift"}
              </CardTitle>
              <CardDescription className="text-xs">
                {isRtl ? "اختر نوع الهدية، وسيلة الإرسال ونمط بطاقة التهنئة" : "Select format, recipient info, and card theme"}
              </CardDescription>
            </CardHeader>

            <CardContent className="p-5 pt-0 space-y-4">
              {/* Type Selector */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant={giftType === "digital" ? "default" : "outline"}
                  onClick={() => setGiftType("digital")}
                  className={`text-xs font-bold h-11 gap-2 ${giftType === "digital" ? "bg-rose-600 text-white" : ""}`}
                >
                  <BookOpen className="w-4 h-4" />
                  {isRtl ? "إهداء رقمي مشفر (فوري)" : "Digital DRM Gift"}
                </Button>
                <Button
                  type="button"
                  variant={giftType === "physical" ? "default" : "outline"}
                  onClick={() => setGiftType("physical")}
                  className={`text-xs font-bold h-11 gap-2 ${giftType === "physical" ? "bg-rose-600 text-white" : ""}`}
                >
                  <Truck className="w-4 h-4" />
                  {isRtl ? "إهداء ورقي مع تغليف فاخر" : "Physical Print Gift"}
                </Button>
              </div>

              {/* Form Inputs */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-foreground mb-1 block">
                    {isRtl ? "اسمك (المرسِل)" : "Your Name (Sender)"}
                  </label>
                  <Input
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder={isRtl ? "مثال: م. أحمد عبد العزيز" : "e.g., Ahmed"}
                    className="text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground mb-1 block">
                    {isRtl ? "اسم المهدى إليه (المستلم)" : "Recipient Name"}
                  </label>
                  <Input
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder={isRtl ? "مثال: د. مريم خالد" : "e.g., Mariam"}
                    className="text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground mb-1 block">
                    {isRtl ? (giftType === "digital" ? "بريد أو هاتف المستلم (لإرسال كود التفعيل)" : "عنوان المستلم أو رقم هاتفه") : "Recipient Email / Phone"}
                  </label>
                  <Input
                    value={recipientContact}
                    onChange={(e) => setRecipientContact(e.target.value)}
                    placeholder={isRtl ? "recipient@example.com أو 010xxxxxxxx" : "recipient@example.com"}
                    className="text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground mb-1 block">
                    {isRtl ? "رسالة الإهداء الشخصية" : "Personal Gift Note"}
                  </label>
                  <Textarea
                    value={giftMessage}
                    onChange={(e) => setGiftMessage(e.target.value)}
                    rows={3}
                    className="text-xs resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground mb-1 block">
                    {isRtl ? "تصميم وطابع بطاقة التهنئة" : "Gift Card Theme"}
                  </label>
                  <div className="flex gap-2">
                    {[
                      { id: "gold", nameAr: "ذهبي ملكي", color: "bg-amber-500" },
                      { id: "rose", nameAr: "وردي أنيق", color: "bg-rose-500" },
                      { id: "royal", nameAr: "أزرق أكاديمي", color: "bg-indigo-500" },
                      { id: "emerald", nameAr: "زمردي فاخر", color: "bg-emerald-500" }
                    ].map((t) => (
                      <Button
                        key={t.id}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setCardTheme(t.id as any)}
                        className={`text-xs font-bold gap-1.5 flex-1 ${cardTheme === t.id ? "border-rose-600 border-2" : ""}`}
                      >
                        <span className={`w-3 h-3 rounded-full ${t.color}`} />
                        {isRtl ? t.nameAr : t.id}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <Button
                onClick={handleSendGift}
                className="w-full bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white font-bold text-xs py-2.5 shadow-md gap-2"
              >
                <Gift className="w-4 h-4" />
                {isRtl ? "معاينة وإرسال الإهداء (قريباً)" : "Send Gift Preview (Coming Soon)"}
              </Button>
            </CardContent>
          </Card>

          {/* Live Digital Card Preview */}
          <div className="lg:col-span-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-foreground flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-rose-600" />
                {isRtl ? "معاينة بطاقة الإهداء كما ستصل للمستلم" : "Live Recipient Card Preview"}
              </h3>
              <Badge variant="outline" className="text-[10px] text-rose-600 border-rose-500/40">
                {giftType === "digital" ? (isRtl ? "إهداء رقمي" : "Digital Gift") : (isRtl ? "إهداء ورقي فاخر" : "Physical Gift")}
              </Badge>
            </div>

            {/* Gift Card Visual */}
            <div className={`p-8 rounded-3xl border-2 bg-gradient-to-br ${themeClasses[cardTheme]} shadow-2xl relative overflow-hidden transition-all duration-300 space-y-6`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-card/80 backdrop-blur shadow flex items-center justify-center text-rose-600">
                    <Gift className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-black tracking-wider text-foreground">UNIGATES GIFT</span>
                    <p className="text-[10px] text-muted-foreground">{isRtl ? "بطاقة إهداء معرفية" : "Knowledge Gift Card"}</p>
                  </div>
                </div>
                <Badge className="bg-foreground text-background text-[10px] font-black">
                  VIP GIFT
                </Badge>
              </div>

              <div className="space-y-2 text-center py-4">
                <p className="text-xs text-muted-foreground font-semibold">
                  {isRtl ? "إهداء خاص ومميز إلى" : "A special gift for"}
                </p>
                <h4 className="text-2xl font-black text-foreground">
                  {recipientName || (isRtl ? "اسم المستلم العزيز" : "Recipient Name")}
                </h4>
                <div className="w-16 h-0.5 bg-rose-500/50 mx-auto my-2" />
                <p className="text-xs text-foreground/90 italic max-w-md mx-auto leading-relaxed px-4">
                  “{giftMessage}”
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-card/70 backdrop-blur border border-border/50 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-base shadow">
                    📖
                  </div>
                  <div>
                    <p className="font-black text-foreground">{isRtl ? "المرجع المهدى: الذكاء الاصطناعي الأكاديمي" : "Gifted: Academic AI Systems"}</p>
                    <p className="text-[10px] text-muted-foreground">{isRtl ? "مرسل من: " : "From: "} {senderName || (isRtl ? "صديقك المخلص" : "A Friend")}</p>
                  </div>
                </div>
                <Badge className="bg-emerald-600 text-white text-[10px] font-bold">
                  {isRtl ? "مُهدى بالكامل" : "Fully Paid"}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Back Link */}
        <div className="pt-4 flex items-center justify-center">
          <Link to="/book-store">
            <Button variant="outline" className="text-xs font-bold gap-2">
              {isRtl ? (
                <>
                  <ArrowRight className="w-4 h-4" /> العودة لمتجر الكتب
                </>
              ) : (
                <>
                  <ArrowLeft className="w-4 h-4" /> Back to Book Store
                </>
              )}
            </Button>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <SiteFooter />
    </div>
  );
};

export default BookStoreGiftPage;
