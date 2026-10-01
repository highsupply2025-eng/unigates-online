import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { 
  Bot, 
  Sparkles, 
  BookOpen, 
  MessageSquare, 
  BrainCircuit, 
  HelpCircle, 
  Layers, 
  Lock, 
  Send, 
  Crown, 
  CheckCircle2, 
  ArrowLeft, 
  ArrowRight,
  Flame,
  FileQuestion,
  RefreshCw,
  Library,
  Store
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { useSmartBack } from "@/hooks/use-smart-back";
import SiteFooter from "@/components/SiteFooter";
import LanguageSelectorDropdown from "@/components/LanguageSelectorDropdown";
import ThemeToggle from "@/components/ThemeToggle";

export const BookStoreAICompanionPage: React.FC = () => {
  const { dir } = useLanguage();
  const isRtl = dir === "rtl";
  const { toast } = useToast();
  const goBack = useSmartBack("/book-store");

  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([
    {
      sender: "ai",
      text: isRtl
        ? "مرحباً بك! أنا مساعد القراءة الذكي AI Book Companion الخاص بمتجر كتب UNIGATES. يمكنني تلخيص أي فصل، الإجابة على استفساراتك حول المراجع العلمية، وتوليد بطاقات استذكار فورية."
        : "Hello! I am your AI Book Companion for UNIGATES Book Store. I can summarize complex chapters, answer research questions, and generate quick quiz flashcards.",
      time: "الآن"
    }
  ]);
  const [selectedTool, setSelectedTool] = useState<"summary" | "chat" | "flashcards">("summary");
  const [isSubscribedToWaitlist, setIsSubscribedToWaitlist] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState("");

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const userText = chatMessage.trim();
    setChatHistory((prev) => [...prev, { sender: "user", text: userText, time: "الآن" }]);
    setChatMessage("");

    setTimeout(() => {
      setChatHistory((prev) => [
        ...prev,
        {
          sender: "ai",
          text: isRtl
            ? `(معاينة ذكية): استناداً إلى كتاب «مستقبل الحوكمة الرقمية في الجامعات»، فإن النقاط الأساسية تشير إلى أهمية سلاسل الاعتماد المشفرة لضمان سرية الاختبارات ومنع التلاعب بالنتائج المؤسسية.`
            : `(AI Preview): Based on the academic references in digital governance, the key takeaway focuses on cryptographic sign-off workflows to eliminate exam leaks.`,
          time: "الآن"
        }
      ]);
    }, 800);
  };

  const handleWaitlist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistEmail) return;
    setIsSubscribedToWaitlist(true);
    toast({
      title: isRtl ? "تم تسجيلك في قائمة الانتظار الحصرية! 🌟" : "Subscribed to Early Access! 🌟",
      description: isRtl
        ? "سيتم إشعارك فور إطلاق باقة المساعد الذكي المدفوعة مع خصم تدشين حصري 50%."
        : "You will be notified upon release with an exclusive 50% launch discount.",
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-amber-600 selection:text-white" dir={dir}>
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
              {isRtl ? <ArrowRight className="w-4 h-4 text-amber-500" /> : <ArrowLeft className="w-4 h-4 text-amber-500" />}
              <span>{isRtl ? "رجوع" : "Back"}</span>
            </Button>

            <Link to="/book-store" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-600 to-red-600 p-0.5 shadow-md flex items-center justify-center text-white">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg sm:text-xl font-black text-foreground">
                  UNIGATES
                </span>
                <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                  {isRtl ? "المساعد الذكي للمطالعة (AI Book Companion)" : "AI Book Companion"}
                </p>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Badge className="bg-amber-500 text-slate-950 font-black text-xs px-3 py-1 animate-pulse">
              {isRtl ? "قريباً • باقة مدفوعة" : "Coming Soon • Premium Add-on"}
            </Badge>
            <Link to="/book-store/reader-dashboard">
              <Button size="sm" variant="outline" className="font-bold gap-1.5 h-9">
                <Library className="w-4 h-4 text-amber-500" />
                <span>{isRtl ? "مكتبتي" : "My Library"}</span>
              </Button>
            </Link>
            <LanguageSelectorDropdown className="h-9 px-3" />
            <ThemeToggle className="h-9 w-9 p-0 rounded-xl" />
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="bg-gradient-to-b from-amber-500/15 via-background to-background py-10 px-4 sm:px-8 border-b border-border/40">
        <div className="max-w-5xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30 px-3.5 py-1 rounded-full text-xs font-bold">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>{isRtl ? "ذكاء اصطناعي توليدي مخصص للكتب والمراجع الأكاديمية (قريباً)" : "Specialized Generative AI for Academic Books (Coming Soon)"}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight">
            {isRtl ? "المساعد الذكي للمطالعة والاستذكار (قريباً)" : "AI Book Companion (Coming Soon)"}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
            {isRtl
              ? "رفيقك الذكي أثناء القراءة: يلخص الفصول المعقدة، يجيب على استفساراتك دون مغادرة الكتاب، ويولد بطاقات استذكار واختبارات تفاعلية."
              : "Your smart reading co-pilot: Instant chapter summaries, deep context Q&A, and interactive quiz flashcards on demand."}
          </p>
        </div>
      </section>

      {/* Main Interactive Preview */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-8 py-8 space-y-8">
        {/* Core AI Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Feature 1 */}
          <Card className="p-6 border-amber-500/30 bg-card/60 relative overflow-hidden flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-600 flex items-center justify-center">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-foreground">
                  {isRtl ? "التلخيص الأكاديمي الفوري" : "Instant Chapter Summary"}
                </h3>
                <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px]">{isRtl ? "قريباً" : "Soon"}</Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isRtl
                  ? "تلخيص مكثف لأي فصل طويل أو أطروحة علمية في 5 نقاط جوهرية مركزة دون الإخلال بالمادة العلمية."
                  : "Concise key takeaways and high-level bullet summaries for multi-page research chapters."}
              </p>
            </div>
          </Card>

          {/* Feature 2 */}
          <Card className="p-6 border-amber-500/30 bg-card/60 relative overflow-hidden flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/15 text-blue-600 flex items-center justify-center">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-foreground">
                  {isRtl ? "اسأل الكتاب واشرح لي" : "In-Context Book Q&A"}
                </h3>
                <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px]">{isRtl ? "قريباً" : "Soon"}</Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isRtl
                  ? "اسأل الذكاء الاصطناعي عن المصطلحات الغامضة أو المعايير القانونية والطبية واستقبل شرحاً فورياً مدعماً بالمصادر."
                  : "Ask questions on complex terminology directly within the DRM reader."}
              </p>
            </div>
          </Card>

          {/* Feature 3 */}
          <Card className="p-6 border-amber-500/30 bg-card/60 relative overflow-hidden flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center">
                <FileQuestion className="w-6 h-6" />
              </div>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-foreground">
                  {isRtl ? "بطاقات استذكار واختبارات" : "Flashcards & Quizzes"}
                </h3>
                <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px]">{isRtl ? "قريباً" : "Soon"}</Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isRtl
                  ? "توليد كروت مراجعة ذكية واختبارات سريعة لقياس فهمك لمحتوى الكتاب وتثبيت المعلومة للامتحانات الجامعية."
                  : "Auto-generate flashcards and multiple-choice quizzes from chapters."}
              </p>
            </div>
          </Card>
        </div>

        {/* Live Interactive Chat Simulator */}
        <Card className="border-border/70 overflow-hidden shadow-xl bg-card">
          <div className="p-4 border-b border-border/40 bg-muted/40 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-foreground">
                  {isRtl ? "محاكي المساعد الذكي التفاعلي (معاينة تجريبية)" : "AI Companion Sandbox Simulator"}
                </h3>
                <p className="text-[10px] text-muted-foreground">
                  {isRtl ? "المرجع: مستقبل الحوكمة الرقمية في الجامعات • دار عبيد" : "Book: Digital Governance in Universities"}
                </p>
              </div>
            </div>
            <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30 text-xs">
              {isRtl ? "قريباً • باقة مدفوعة" : "Premium Feature"}
            </Badge>
          </div>

          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="h-64 overflow-y-auto space-y-3 p-3 rounded-2xl bg-muted/20 border border-border/40">
              {chatHistory.map((item, idx) => (
                <div
                  key={idx}
                  className={`flex gap-2.5 ${item.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  {item.sender === "ai" && (
                    <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0 text-xs">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}
                  <div
                    className={`p-3 rounded-2xl text-xs max-w-lg leading-relaxed ${
                      item.sender === "user"
                        ? "bg-amber-600 text-white font-semibold"
                        : "bg-card border border-border/60 text-foreground"
                    }`}
                  >
                    {item.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Simulated Chat Input */}
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder={isRtl ? "اطرح سؤالاً على المساعد الذكي حول هذا الكتاب..." : "Ask AI a question about this book..."}
                className="h-11 text-xs rounded-xl"
              />
              <Button type="submit" className="h-11 px-5 font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl">
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Waitlist Callout */}
        <Card className="p-8 text-center bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/5 border-amber-500/30 rounded-3xl">
          <div className="max-w-xl mx-auto space-y-4">
            <Crown className="w-12 h-12 text-amber-500 mx-auto" />
            <h3 className="text-xl sm:text-2xl font-black text-foreground">
              {isRtl ? "انضم لقائمة الانتظار المبكرة لباقة الذكاء الاصطناعي (قريباً)" : "Join Early Access Waitlist (Coming Soon)"}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {isRtl
                ? "احصل على وصول تجريبي مجاني لمدة شهر وخصم 50% عند الإطلاق الرسمي للباقة المدفوعة."
                : "Get 1-month free trial and 50% discount upon official launch."}
            </p>

            {!isSubscribedToWaitlist ? (
              <form onSubmit={handleWaitlist} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto pt-2">
                <Input
                  type="email"
                  value={waitlistEmail}
                  onChange={(e) => setWaitlistEmail(e.target.value)}
                  placeholder={isRtl ? "أدخل بريدك الإلكتروني..." : "Enter your email..."}
                  required
                  className="h-11 text-xs rounded-xl bg-card"
                />
                <Button type="submit" className="h-11 font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shrink-0">
                  {isRtl ? "سجل اهتمامك" : "Join Waitlist"}
                </Button>
              </form>
            ) : (
              <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold text-xs rounded-xl flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{isRtl ? "تم تسجيلك بنجاح في قائمة الوصول المبكر!" : "Successfully registered on the waitlist!"}</span>
              </div>
            )}
          </div>
        </Card>
      </main>

      <SiteFooter />
    </div>
  );
};
export default BookStoreAICompanionPage;
