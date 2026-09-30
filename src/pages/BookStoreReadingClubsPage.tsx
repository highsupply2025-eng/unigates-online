import React, { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Users, 
  MessageSquare, 
  Sparkles, 
  BookOpen, 
  GraduationCap, 
  Crown, 
  Lock, 
  CheckCircle2, 
  ArrowLeft, 
  ArrowRight,
  Send,
  Pin,
  Share2,
  ShieldCheck,
  Building2,
  Store,
  Library
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import SiteFooter from "@/components/SiteFooter";
import LanguageSelectorDropdown from "@/components/LanguageSelectorDropdown";
import ThemeToggle from "@/components/ThemeToggle";

export const BookStoreReadingClubsPage: React.FC = () => {
  const { dir } = useLanguage();
  const isRtl = dir === "rtl";
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<"circles" | "annotations">("circles");
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState([
    {
      id: 1,
      author: "أ.د. سمير المنشاوي (أستاذ هندسة البرمجيات)",
      role: "faculty",
      avatar: "👨‍🏫",
      text: "هام جداً للاختبار النهائي: ركزوا في الصفحة 84 على مقارنة معمارية Microservices vs Monolith وحالات الاختناق في قواعد البيانات الموزعة.",
      time: "منذ ساعتين",
      likes: 42,
      page: 84
    },
    {
      id: 2,
      author: "م. سارة المهدي (طالبة امتياز)",
      role: "student",
      avatar: "👩‍🎓",
      text: "هل يوجد مثال تطبيقي في المرجع لحساب CAP Theorem عند انقطاع الشبكة؟",
      time: "منذ ساعة",
      likes: 15,
      page: 86
    }
  ]);

  const [isWaitlisted, setIsWaitlisted] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState("");

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setComments((prev) => [
      ...prev,
      {
        id: Date.now(),
        author: "طالب أكاديمي (أنت)",
        role: "student",
        avatar: "🎓",
        text: commentText.trim(),
        time: "الآن",
        likes: 1,
        page: 85
      }
    ]);
    setCommentText("");
    toast({
      title: isRtl ? "تمت إضافة مشاركتك في نادي القراءة 💬" : "Contribution posted!",
      description: isRtl ? "تظهر مشاركتك فوراً لأعضاء الدفعة الدراسية وأستاذ المادة." : "Visible to all enrolled classmates and faculty."
    });
  };

  const handleWaitlist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistEmail) return;
    setIsWaitlisted(true);
    toast({
      title: isRtl ? "تم الانضمام لقائمة الانتظار الحصرية! 🌟" : "Subscribed to Early Access! 🌟",
      description: isRtl
        ? "سيتم تفعيل نوادي القراءة والهوامش المشتركة لحسابك فور الإطلاق الرسمي."
        : "You will receive early access upon official rollout."
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-indigo-600 selection:text-white" dir={dir}>
      {/* Top Header */}
      <header className="border-b border-border/40 px-4 sm:px-8 py-3.5 bg-card/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link to="/book-store" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 p-0.5 shadow-md flex items-center justify-center text-white">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg sm:text-xl font-black text-foreground">
                  UNIGATES
                </span>
                <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                  {isRtl ? "نوادي القراءة الأكاديمية" : "Reading Circles & Clubs"}
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
              <Button variant="outline" size="sm" className="text-xs font-bold gap-1.5 border-indigo-500/30 text-indigo-600 dark:text-indigo-400">
                <Library className="w-4 h-4" />
                {isRtl ? "مكتبتي الخاصة" : "My Library"}
              </Button>
            </Link>
            <LanguageSelectorDropdown />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-500/10 via-background to-background py-12 sm:py-16 border-b border-border/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-700 dark:text-indigo-300 text-xs font-extrabold shadow-sm">
                <Crown className="w-4 h-4 text-indigo-500" />
                <span>{isRtl ? "ميزة مدفوعة • قريباً جداً" : "Premium Tier • Coming Soon"}</span>
                <Badge variant="secondary" className="bg-indigo-600 text-white hover:bg-indigo-700 text-[10px] py-0 px-2">
                  Coming Soon
                </Badge>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground leading-tight">
                {isRtl ? (
                  <>
                    نوادي القراءة الأكاديمية <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">والهوامش التفاعلية المشتركة</span>
                  </>
                ) : (
                  <>
                    Academic Reading Circles & <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">Social Annotations</span>
                  </>
                )}
              </h1>

              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                {isRtl
                  ? "حول القراءة الفردية إلى بيئة تفاعلية حية؛ أنشئ نوادي قراءة لدفعتك أو كليتك لمناقشة الكتب والمراجع المقررة، واطلع على توجيهات وملاحظات أساتذة المادة في هوامش الصفحات مباشرة."
                  : "Turn solitary reading into an active collaborative experience. Form reading circles for your cohort, discuss academic texts in real time, and view verified professor annotations inside book margins."}
              </p>
            </div>

            {/* Waitlist Box */}
            <Card className="w-full lg:w-96 border-indigo-500/30 shadow-xl bg-card/90 backdrop-blur">
              <CardHeader className="p-5 pb-3">
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  {isRtl ? "احجز اشتراكك في باقة النوادي" : "Join Reading Clubs Waitlist"}
                </CardTitle>
                <CardDescription className="text-xs">
                  {isRtl ? "كن أول من يحصل على غرف النقاش وهوامش الأساتذة مع شهر مجاني" : "Get 1 month free trial upon official launch"}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 pt-0">
                {isWaitlisted ? (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-center text-xs font-bold space-y-1">
                    <CheckCircle2 className="w-6 h-6 mx-auto text-emerald-500 mb-1" />
                    <p>{isRtl ? "تم حجز مقعدك بنجاح!" : "Seat Reserved Successfully!"}</p>
                    <p className="text-[11px] font-normal text-muted-foreground">
                      {isRtl ? "سنرسل لك دعوة التفعيل فور الانطلاق." : "We'll send an invite once live."}
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleWaitlist} className="space-y-3">
                    <Input
                      type="email"
                      required
                      placeholder={isRtl ? "بريدك الإلكتروني الجامعي أو الشخصي..." : "Enter your email..."}
                      value={waitlistEmail}
                      onChange={(e) => setWaitlistEmail(e.target.value)}
                      className="text-xs"
                    />
                    <Button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs py-2 shadow-md">
                      {isRtl ? "انضم إلى قائمة الانتظار الحصرية" : "Join Early Access"}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Main Content & Interactive Showcase */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-8 py-10 w-full space-y-10">
        {/* Features Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Card className="border-border/60 hover:border-indigo-500/40 transition-all shadow-sm">
            <CardContent className="p-5 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-foreground text-base">
                {isRtl ? "نوادي الدفعات والكليات" : "Cohort & Department Circles"}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isRtl
                  ? "غرف دراسية مغلقة ومحمية لطلاب الكلية والقسم لمراجعة فصول المنهج معاً وتحديد النقاط الصعبة."
                  : "Private cohort-based rooms for course colleagues to review chapters and align on exam topics."}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/60 hover:border-indigo-500/40 transition-all shadow-sm">
            <CardContent className="p-5 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600">
                <Pin className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-foreground text-base">
                {isRtl ? "هوامش وتوجيهات الأساتذة" : "Faculty Margin Directives"}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isRtl
                  ? "ملاحظات معتمدة وموثقة تظهر مباشرة في جانب الصفحة كإرشاد رسمي من أستاذ المادة لطلابه."
                  : "Verified notes pinned directly to page margins by course instructors to guide student focus."}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/60 hover:border-indigo-500/40 transition-all shadow-sm">
            <CardContent className="p-5 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-600">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-foreground text-base">
                {isRtl ? "حماية وحظر التشتيت" : "Moderated Academic Safe Space"}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isRtl
                  ? "بيئة نقاش أكاديمية خاضعة للإشراف، تضمن بقاء النقاش في صلب المادة العلمية دون إزعاج."
                  : "AI-moderated academic discourse ensuring zero distraction and 100% curriculum focus."}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Live Interactive Preview */}
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                {isRtl ? "معاينة تجريبية حية: هامش الكتاب التفاعلي" : "Live Interactive Preview: Smart Social Margin"}
              </h2>
              <p className="text-xs text-muted-foreground">
                {isRtl ? "جرب إضافة مشاركة أو استفسار على صفحة مرجع هندسة البرمجيات" : "Simulate adding a note or question to an academic reference page"}
              </p>
            </div>
            <div className="flex items-center gap-2 bg-muted/60 p-1 rounded-xl border border-border/50">
              <Button
                variant={activeTab === "circles" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("circles")}
                className={activeTab === "circles" ? "bg-indigo-600 text-white font-bold text-xs" : "text-xs font-bold"}
              >
                {isRtl ? "نقاش الدفعة (الصفحة 84-86)" : "Cohort Discussions"}
              </Button>
              <Button
                variant={activeTab === "annotations" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("annotations")}
                className={activeTab === "annotations" ? "bg-indigo-600 text-white font-bold text-xs" : "text-xs font-bold"}
              >
                {isRtl ? "توجيهات الدكتور فقط" : "Faculty Notes Only"}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Mock Book Page */}
            <Card className="lg:col-span-7 border-border shadow-md bg-card relative overflow-hidden">
              <div className="border-b border-border/50 px-4 py-3 bg-muted/30 flex items-center justify-between text-xs font-bold text-muted-foreground">
                <span className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  {isRtl ? "هندسة البرمجيات المتقدمة — ص 84" : "Advanced Software Engineering — Page 84"}
                </span>
                <Badge variant="outline" className="text-[10px] border-indigo-500/40 text-indigo-600">
                  {isRtl ? "قراءة مشفرة DRM" : "DRM Protected"}
                </Badge>
              </div>
              <CardContent className="p-6 space-y-4 text-xs sm:text-sm text-foreground/80 leading-relaxed select-none">
                <h4 className="text-base font-black text-foreground">
                  {isRtl ? "الفصل الرابع: النظم الموزعة ونظرية CAP" : "Chapter 4: Distributed Systems & CAP Theorem"}
                </h4>
                <p>
                  {isRtl
                    ? "تعتبر نظرية CAP حجر الزاوية في تصميم الأنظمة الموزعة فائقة التوسع. تنص النظرية على أنه من المستحيل لأي مخزن بيانات موزع أن يقدم في آن واحد أكثر من اثنتين من الضمانات الثلاث: الاتساق (Consistency)، التوافرية (Availability)، وتحمل انقسام الشبكة (Partition Tolerance)."
                    : "The CAP theorem states that any distributed data store can only provide two of the following three guarantees: Consistency, Availability, and Partition Tolerance."}
                </p>
                <div className="p-3.5 rounded-xl bg-indigo-500/10 border-s-4 border-indigo-600 text-foreground font-medium text-xs">
                  {isRtl
                    ? "«في بيئات السحاب الحديثة، لا يمكن تفادي انقطاع الشبكة P، لذا يكون القرار الهندسي دائماً بين التضحية بالاتساق لصالح التوافرية AP أو العكس CP.»"
                    : "“In modern cloud environments, partition tolerance is mandatory, meaning engineers must choose between AP or CP.”"}
                </div>
                <p className="text-muted-foreground text-xs">
                  {isRtl
                    ? "تطبيق عملي: بنوك الدفع الإلكتروني تعتمد النموذج CP لضمان عدم حدوث ازدواجية في السحب المالي، بينما شبكات التواصل تفضل النموذج AP لضمان سرعة التصفح والتفاعل المستمر."
                    : "Practical example: Financial banking adopts CP to prevent double-spending, while social feeds prioritize AP for high availability."}
                </p>
              </CardContent>
            </Card>

            {/* Social Margin Chat / Annotations Column */}
            <Card className="lg:col-span-5 border-indigo-500/30 shadow-md bg-card flex flex-col h-[480px]">
              <div className="p-3.5 border-b border-border/50 bg-indigo-500/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-black text-foreground">
                    {isRtl ? "الهامش التفاعلي (ص 84-86)" : "Social Margin Stream"}
                  </span>
                </div>
                <Badge className="bg-indigo-600 text-white text-[10px]">
                  {comments.length} {isRtl ? "ملاحظة" : "notes"}
                </Badge>
              </div>

              {/* Comments List */}
              <div className="flex-1 p-3.5 space-y-3 overflow-y-auto">
                {comments
                  .filter((c) => activeTab === "circles" || c.role === "faculty")
                  .map((c) => (
                    <div
                      key={c.id}
                      className={`p-3 rounded-xl border transition-all text-xs space-y-1.5 ${
                        c.role === "faculty"
                          ? "bg-amber-500/10 border-amber-500/40 text-foreground"
                          : "bg-muted/40 border-border/60 text-foreground"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 font-bold">
                          <span className="text-base">{c.avatar}</span>
                          <span className="text-xs truncate">{c.author}</span>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-[9px] px-1.5 py-0 ${
                            c.role === "faculty"
                              ? "border-amber-600 text-amber-700 dark:text-amber-300 font-extrabold"
                              : "text-muted-foreground"
                          }`}
                        >
                          {c.role === "faculty" ? (isRtl ? "أستاذ المادة" : "Professor") : isRtl ? "طالب" : "Student"}
                        </Badge>
                      </div>
                      <p className="text-xs leading-relaxed text-foreground/90">{c.text}</p>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/30">
                        <span>{c.time} • {isRtl ? `ص ${c.page}` : `p. ${c.page}`}</span>
                        <span>❤️ {c.likes} {isRtl ? "تأييد" : "agrees"}</span>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Add Comment Input */}
              <form onSubmit={handleAddComment} className="p-3 border-t border-border/50 bg-muted/20 flex gap-2">
                <Input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={isRtl ? "اكتب تعليقاً أو استفساراً في الهامش..." : "Write a note in the margin..."}
                  className="text-xs h-9"
                />
                <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 h-9">
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </form>
            </Card>
          </div>
        </div>

        {/* Pricing Tier Notice */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-900/20 via-purple-900/20 to-pink-900/20 border border-indigo-500/30 text-center space-y-3">
          <Badge className="bg-indigo-600 text-white text-xs font-black">
            {isRtl ? "باقة اشتراك مدفوعة — قريباً" : "Premium Tier — Coming Soon"}
          </Badge>
          <h3 className="text-lg sm:text-xl font-black text-foreground">
            {isRtl ? "باقة نوادي القراءة والملاحظات المشتركة" : "Reading Circles & Social Annotation Pass"}
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl mx-auto">
            {isRtl
              ? "ستتوفر هذه الميزة كترقية مدفوعة باشتراك فصلي للطلاب وأعضاء هيئة التدريس، وتتضمن غرف نقاش غير محدودة، هوامش صوتية، ومزامنة تلقائية مع المنصة الجامعية."
              : "Available soon as a semester pass for students and faculty with unlimited reading circles, voice margins, and automatic sync with the University Platform."}
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

export default BookStoreReadingClubsPage;
