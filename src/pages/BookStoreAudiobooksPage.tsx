import React, { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Headphones, 
  Volume2, 
  Sparkles, 
  Play, 
  Pause, 
  RotateCcw, 
  RotateCw, 
  Gauge, 
  Car, 
  Moon, 
  Crown, 
  CheckCircle2, 
  ArrowLeft, 
  ArrowRight,
  Library,
  Store,
  Sliders,
  Radio
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { useSmartBack } from "@/hooks/use-smart-back";
import SiteFooter from "@/components/SiteFooter";
import LanguageSelectorDropdown from "@/components/LanguageSelectorDropdown";
import ThemeToggle from "@/components/ThemeToggle";

export const BookStoreAudiobooksPage: React.FC = () => {
  const { dir } = useLanguage();
  const isRtl = dir === "rtl";
  const { toast } = useToast();
  const goBack = useSmartBack("/book-store");

  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [selectedVoice, setSelectedVoice] = useState<"fusha_male" | "fusha_female" | "academic">("fusha_male");
  const [currentProgress, setCurrentProgress] = useState<number>(34);
  const [carMode, setCarMode] = useState<boolean>(false);
  const [isWaitlisted, setIsWaitlisted] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState("");

  const voices = [
    { id: "fusha_male", nameAr: "صوت طارق (فصحى أكاديمية رصينة)", nameEn: "Tariq (Academic Classical)", descAr: "مثالي للمراجع والكتب القانونية والطبية" },
    { id: "fusha_female", nameAr: "صوت مريم (فصحى حوارية طبيعية)", nameEn: "Maryam (Natural Conversational)", descAr: "مثالي للروايات وكتب الإدارة والتطوير" },
    { id: "academic", nameAr: "صوت الدكتور (شرح وتفسير المصطلحات)", nameEn: "Prof. Voice (Exploratory AI)", descAr: "يتوقف لشرح المصطلحات الإنجليزية باللغة العربية" }
  ];

  const handlePlayToggle = () => {
    setIsPlaying(!isPlaying);
    toast({
      title: isPlaying ? (isRtl ? "تم إيقاف القراءة الصوتية مؤقتاً" : "Paused") : (isRtl ? "جاري الاستماع بصوت الذكاء الاصطناعي 🎧" : "Playing AI Audiobook"),
      description: isRtl ? `السرعة: ${playbackSpeed}x • الصوت المختار: ${selectedVoice}` : `Speed: ${playbackSpeed}x`
    });
  };

  const handleWaitlist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistEmail) return;
    setIsWaitlisted(true);
    toast({
      title: isRtl ? "تم تسجيلك في قائمة انتظار باقة الكتب المسموعة! 🎧" : "Subscribed to Audiobooks Tier!",
      description: isRtl
        ? "ستحصل على 3 كتب مسموعة مجاناً عند التدشين الرسمي للباقة."
        : "You will receive 3 free audiobooks upon official release."
    });
  };

  return (
    <div className={`min-h-screen bg-background flex flex-col selection:bg-emerald-600 selection:text-white ${carMode ? "bg-zinc-950 text-white" : ""}`} dir={dir}>
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
              {isRtl ? <ArrowRight className="w-4 h-4 text-emerald-500" /> : <ArrowLeft className="w-4 h-4 text-emerald-500" />}
              <span>{isRtl ? "رجوع" : "Back"}</span>
            </Button>

            <Link to="/book-store" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 p-0.5 shadow-md flex items-center justify-center text-white">
                <Headphones className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg sm:text-xl font-black text-foreground">
                  UNIGATES
                </span>
                <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  {isRtl ? "الكتب المسموعة والتحويل الصوتي الذكي" : "AI Audiobooks & Smart Voice"}
                </p>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={carMode ? "secondary" : "outline"}
              size="sm"
              onClick={() => setCarMode(!carMode)}
              className="text-xs font-bold gap-1.5 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
            >
              <Car className="w-4 h-4" />
              {isRtl ? (carMode ? "إلغاء وضع القيادة" : "وضع القيادة 🚗") : (carMode ? "Exit Car Mode" : "Car Mode")}
            </Button>
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
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-500/10 via-background to-background py-12 sm:py-16 border-b border-border/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-extrabold shadow-sm">
                <Crown className="w-4 h-4 text-emerald-500" />
                <span>{isRtl ? "ميزة مدفوعة • قريباً جداً" : "Premium Tier • Coming Soon"}</span>
                <Badge variant="secondary" className="bg-emerald-600 text-white hover:bg-emerald-700 text-[10px] py-0 px-2">
                  Coming Soon
                </Badge>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground leading-tight">
                {isRtl ? (
                  <>
                    الكتب المسموعة والتحويل الصوتي الذكي <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">بأصوات عربية طبيعية فصحى</span>
                  </>
                ) : (
                  <>
                    Smart AI Audiobooks & <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">Natural Arabic Speech</span>
                  </>
                )}
              </h1>

              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                {isRtl
                  ? "استمع لمراجعك الجامعية وكتبك المفضلة أثناء تنقلك أو قيادة سيارتك أو أثناء ممارسة الرياضة، مع إمكانية تسريع الصوت حتى 2.5x، وضع القيادة المريح، وضبط نبرة الإلقاء الأكاديمي."
                  : "Listen to academic textbooks and literature on the go. Featuring natural Arabic AI narration, speed multiplier up to 2.5x, distraction-free Car Mode, and instant academic term pronunciation."}
              </p>
            </div>

            {/* Waitlist Box */}
            <Card className="w-full lg:w-96 border-emerald-500/30 shadow-xl bg-card/90 backdrop-blur">
              <CardHeader className="p-5 pb-3">
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  {isRtl ? "احجز اشتراك باقة الصوتيات" : "Join Audiobooks Waitlist"}
                </CardTitle>
                <CardDescription className="text-xs">
                  {isRtl ? "استمع لجميع كتبك الرقمية المشفرة بصوت الذكاء الاصطناعي" : "Unlock AI TTS playback for all your DRM e-books"}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 pt-0">
                {isWaitlisted ? (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-center text-xs font-bold space-y-1">
                    <CheckCircle2 className="w-6 h-6 mx-auto text-emerald-500 mb-1" />
                    <p>{isRtl ? "تم تسجيل بريدك بنجاح!" : "Waitlist Confirmed!"}</p>
                    <p className="text-[11px] font-normal text-muted-foreground">
                      {isRtl ? "سنرسل لك إشعاراً فور تفعيل ميزة الكتب المسموعة." : "We'll notify you as soon as it launches."}
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleWaitlist} className="space-y-3">
                    <Input
                      type="email"
                      required
                      placeholder={isRtl ? "أدخل بريدك الإلكتروني..." : "Enter your email..."}
                      value={waitlistEmail}
                      onChange={(e) => setWaitlistEmail(e.target.value)}
                      className="text-xs"
                    />
                    <Button type="submit" className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs py-2 shadow-md">
                      {isRtl ? "انضم للحصول على خصم التدشين 50%" : "Get 50% Launch Discount"}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Interactive Audiobook Player Simulator */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-8 py-10 w-full space-y-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Player Box */}
          <Card className={`lg:col-span-8 border-emerald-500/30 shadow-xl overflow-hidden ${carMode ? "bg-zinc-900 border-zinc-700 p-8" : "bg-card"}`}>
            <CardHeader className="p-6 pb-4 border-b border-border/40">
              <div className="flex items-center justify-between">
                <Badge className="bg-emerald-600 text-white font-bold text-xs">
                  {isRtl ? "مشغل الكتب الصوتية الذكي — تجربة حية" : "Interactive Audio Player Demo"}
                </Badge>
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                  <Radio className={`w-3.5 h-3.5 ${isPlaying ? "text-emerald-500 animate-pulse" : ""}`} />
                  <span>{isPlaying ? (isRtl ? "جاري البث الصوتي..." : "Playing...") : (isRtl ? "جاهز للتشغيل" : "Ready")}</span>
                </div>
              </div>
              <CardTitle className="text-lg sm:text-2xl font-black mt-3">
                {isRtl ? "مستقبل الذكاء الاصطناعي في الطب الحديث" : "The Future of AI in Modern Medicine"}
              </CardTitle>
              <CardDescription className="text-xs">
                {isRtl ? "الفصل الثالث: التشخيص الإشعاعي الدقيق وتوليد التقارير الطبية (ص 52-78)" : "Chapter 3: Radiology Diagnostics & Automated Reporting (pp. 52-78)"}
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {/* Soundwave Simulation */}
              <div className="h-24 bg-muted/30 rounded-2xl border border-border/50 p-4 flex items-center justify-center gap-1.5 overflow-hidden">
                {[40, 65, 85, 30, 95, 55, 75, 45, 90, 60, 35, 80, 100, 70, 50, 85, 60, 40, 75, 90, 30, 65, 50, 80, 45, 70, 95, 40].map((h, i) => (
                  <div
                    key={i}
                    style={{ height: isPlaying ? `${h}%` : "15%" }}
                    className={`w-1.5 rounded-full transition-all duration-300 ${
                      isPlaying
                        ? "bg-gradient-to-t from-emerald-600 to-teal-400"
                        : "bg-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>

              {/* Progress Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
                  <span>14:20</span>
                  <span>42:15</span>
                </div>
                <Slider
                  value={[currentProgress]}
                  onValueChange={(val) => setCurrentProgress(val[0])}
                  max={100}
                  step={1}
                  className="accent-emerald-600"
                />
              </div>

              {/* Player Controls */}
              <div className="flex items-center justify-center gap-4 sm:gap-6 py-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full w-12 h-12"
                  onClick={() => setCurrentProgress(Math.max(0, currentProgress - 5))}
                >
                  <RotateCcw className="w-5 h-5 text-muted-foreground" />
                </Button>

                <Button
                  onClick={handlePlayToggle}
                  size="icon"
                  className={`rounded-full shadow-lg transition-transform active:scale-95 ${
                    carMode ? "w-20 h-20 bg-emerald-500 hover:bg-emerald-600 text-white" : "w-16 h-16 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
                  }`}
                >
                  {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 translate-x-0.5" />}
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full w-12 h-12"
                  onClick={() => setCurrentProgress(Math.min(100, currentProgress + 5))}
                >
                  <RotateCw className="w-5 h-5 text-muted-foreground" />
                </Button>
              </div>

              {/* Speed Controls */}
              <div className="flex items-center justify-between flex-wrap gap-3 pt-4 border-t border-border/40">
                <div className="flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold">{isRtl ? "سرعة القراءة:" : "Speed:"}</span>
                  <div className="flex gap-1">
                    {[0.75, 1.0, 1.25, 1.5, 2.0].map((spd) => (
                      <Button
                        key={spd}
                        variant={playbackSpeed === spd ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPlaybackSpeed(spd)}
                        className={`h-7 px-2 text-xs font-extrabold ${playbackSpeed === spd ? "bg-emerald-600 text-white" : ""}`}
                      >
                        {spd}x
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Moon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{isRtl ? "مؤقت النوم: 30 دقيقة" : "Sleep timer: 30m"}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Voice Models Selector */}
          <div className="lg:col-span-4 space-y-4">
            <Card className="border-border shadow-md bg-card">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-black flex items-center gap-2 text-foreground">
                  <Volume2 className="w-4 h-4 text-emerald-600" />
                  {isRtl ? "اختيار نبرة الصوت الأكاديمي" : "Academic AI Voice Model"}
                </CardTitle>
                <CardDescription className="text-xs">
                  {isRtl ? "نماذج ذكاء اصطناعي مدربة على مخارج الحروف الفصحى" : "Trained on Arabic classical pronunciation"}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-1 space-y-2.5">
                {voices.map((v) => (
                  <div
                    key={v.id}
                    onClick={() => setSelectedVoice(v.id as any)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all text-xs space-y-1 ${
                      selectedVoice === v.id
                        ? "bg-emerald-500/10 border-emerald-500 text-foreground font-bold shadow-sm"
                        : "bg-muted/30 border-border/60 text-muted-foreground hover:border-emerald-500/30"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-foreground">{isRtl ? v.nameAr : v.nameEn}</span>
                      {selectedVoice === v.id && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    </div>
                    <p className="text-[11px] font-normal text-muted-foreground">
                      {isRtl ? v.descAr : v.nameEn}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border shadow-md bg-card p-4 space-y-2">
              <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Car className="w-4 h-4 text-emerald-600" />
                {isRtl ? "ميزة وضع القيادة الذكي (Car Mode)" : "Smart Car Mode"}
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isRtl
                  ? "واجهة مبسطة بأزرار ضخمة وأوامر صوتية لمنع تشتت الانتباه أثناء قيادة السيارة على الطرقات."
                  : "Large tactile buttons with voice commands designed specifically for distraction-free commute."}
              </p>
            </Card>
          </div>
        </div>

        {/* Plan Details */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-900/20 via-teal-900/20 to-cyan-900/20 border border-emerald-500/30 text-center space-y-3">
          <Badge className="bg-emerald-600 text-white text-xs font-black">
            {isRtl ? "باقة الكتب المسموعة — قريباً" : "Audiobooks Pass — Coming Soon"}
          </Badge>
          <h3 className="text-lg sm:text-xl font-black text-foreground">
            {isRtl ? "حول أي كتاب تشتريه في مكتبتك إلى نسخة صوتية بنقرة واحدة" : "Instant Audio Conversion for All Your DRM Library"}
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl mx-auto">
            {isRtl
              ? "استمع بدون اتصال بالإنترنت في أي وقت ومكان، مع استئناف الاستماع تلقائياً من الموضع الذي توقفت عنده على هاتفك أو حاسوبك."
              : "Listen offline anywhere with seamless cross-device progress sync between phone, tablet, and PC."}
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
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
        </div>
      </main>

      {/* Footer */}
      <SiteFooter />
    </div>
  );
};

export default BookStoreAudiobooksPage;
