import React, { useState } from "react";
import { Link } from "react-router-dom";
import { 
  BarChart3, 
  Sparkles, 
  Clock, 
  BookOpen, 
  Users, 
  TrendingUp, 
  Crown, 
  CheckCircle2, 
  ArrowLeft, 
  ArrowRight,
  Store,
  Building2,
  Activity,
  Layers,
  FileText,
  Percent,
  LineChart
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { BookStoreDataStore } from "@/services/bookStoreDataStore";
import SiteFooter from "@/components/SiteFooter";
import LanguageSelectorDropdown from "@/components/LanguageSelectorDropdown";
import ThemeToggle from "@/components/ThemeToggle";

export const PublisherAnalyticsPage: React.FC = () => {
  const { dir } = useLanguage();
  const isRtl = dir === "rtl";
  const { toast } = useToast();

  const catalog = BookStoreDataStore.getCatalog();
  const [selectedBookId, setSelectedBookId] = useState(catalog[0]?.id || "bk-dar-001");
  const heatmap = BookStoreDataStore.getReadingHeatmap(selectedBookId);

  const [isWaitlisted, setIsWaitlisted] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState("");

  const handleWaitlist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistEmail) return;
    setIsWaitlisted(true);
    toast({
      title: isRtl ? "تم تسجيل دار النشر في باقة التحليلات المتقدمة! 📊" : "Publisher Analytics Waitlist Confirmed!",
      description: isRtl
        ? "ستحصل على تقارير تفصيلية فورية لكل قارئ وفصل مع فترة تجريبية مجانية."
        : "You'll receive advanced reader telemetry and heatmaps upon release."
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-purple-600 selection:text-white" dir={dir}>
      {/* Top Header */}
      <header className="border-b border-border/40 px-4 sm:px-8 py-3.5 bg-card/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link to="/book-store/publisher-dashboard" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 via-indigo-600 to-blue-600 p-0.5 shadow-md flex items-center justify-center text-white">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg sm:text-xl font-black text-foreground">
                  UNIGATES STUDIO
                </span>
                <p className="text-[10px] font-bold text-purple-600 dark:text-purple-400">
                  {isRtl ? "تحليلات القراءة المتعمقة والخرائط الحرارية" : "Reading Heatmaps & Telemetry"}
                </p>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/book-store/publisher-dashboard">
              <Button variant="outline" size="sm" className="text-xs font-bold gap-1.5 border-purple-500/30 text-purple-600 dark:text-purple-400">
                <Building2 className="w-4 h-4" />
                {isRtl ? "استوديو الناشر" : "Publisher Studio"}
              </Button>
            </Link>
            <Link to="/book-store/browse">
              <Button variant="ghost" size="sm" className="text-xs font-bold gap-1.5 text-muted-foreground hover:text-foreground">
                <Store className="w-4 h-4" />
                {isRtl ? "المتجر" : "Store"}
              </Button>
            </Link>
            <LanguageSelectorDropdown />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Hero Banner with Coming Soon Paid Tier Badge */}
      <section className="relative overflow-hidden bg-gradient-to-b from-purple-500/10 via-background to-background py-12 sm:py-16 border-b border-border/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-700 dark:text-purple-300 text-xs font-extrabold shadow-sm">
                <Crown className="w-4 h-4 text-purple-500" />
                <span>{isRtl ? "ميزة احترافية لدور النشر • قريباً (باقة مدفوعة)" : "Publisher Pro Tier • Coming Soon (Paid Package)"}</span>
                <Badge variant="secondary" className="bg-purple-600 text-white hover:bg-purple-700 text-[10px] py-0 px-2">
                  Coming Soon
                </Badge>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground leading-tight">
                {isRtl ? (
                  <>
                    تحليلات القراءة المتعمقة <span className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent">والخرائط الحرارية لتفاعل القراء (Reading Heatmaps)</span>
                  </>
                ) : (
                  <>
                    In-Depth Reading Analytics & <span className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent">Reader Heatmaps</span>
                  </>
                )}
              </h1>

              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                {isRtl
                  ? "تقارير دقيقة توضح لدار النشر والمؤلف: أي الفصول هي الأكثر قراءة، متوسط الدقائق المقضاة في كل صفحة وفصل، نسبة القراء الذين أتموا الكتاب للنهاية، ونقاط توقف القراء (Drop-off Rate) لتحسين الطبعات القادمة."
                  : "Comprehensive publisher telemetry revealing chapter engagement, average reading duration, whole-book completion rates, and precise drop-off metrics to optimize future editions."}
              </p>
            </div>

            {/* Waitlist Box */}
            <Card className="w-full lg:w-96 border-purple-500/30 shadow-xl bg-card/90 backdrop-blur">
              <CardHeader className="p-5 pb-3">
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  {isRtl ? "احجز اشتراك باقة التحليلات الذكية" : "Join Analytics Tier Waitlist"}
                </CardTitle>
                <CardDescription className="text-xs">
                  {isRtl ? "احصل على قياسات دقيقة لتفاعل القراء مع مؤلفاتك" : "Unlock deep chapter-level analytics and reader insights"}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 pt-0">
                {isWaitlisted ? (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-center text-xs font-bold space-y-1">
                    <CheckCircle2 className="w-6 h-6 mx-auto text-emerald-500 mb-1" />
                    <p>{isRtl ? "تم تسجيل طلبك بنجاح!" : "Waitlist Confirmed!"}</p>
                    <p className="text-[11px] font-normal text-muted-foreground">
                      {isRtl ? "سيتم إشعارك فور تفعيل محرك التحليلات الحية." : "We'll notify you when live."}
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleWaitlist} className="space-y-3">
                    <Input
                      type="email"
                      required
                      placeholder={isRtl ? "بريدك المهني أو بريد الدار..." : "Enter your email..."}
                      value={waitlistEmail}
                      onChange={(e) => setWaitlistEmail(e.target.value)}
                      className="text-xs"
                    />
                    <Button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs py-2 shadow-md">
                      {isRtl ? "انضم لقائمة الانتظار الحصرية" : "Join Early Access"}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Main Heatmap & In-Depth Analytics Simulator */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-8 py-10 w-full space-y-8">
        {/* Book Selector Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-card border border-border">
          <div>
            <span className="text-xs text-muted-foreground font-semibold block">
              {isRtl ? "عرض تحليلات المرجع المحدد:" : "Selected Title Analytics:"}
            </span>
            <h3 className="text-base font-black text-foreground">{heatmap.bookTitle}</h3>
          </div>
          <div className="w-full sm:w-80">
            <Select value={selectedBookId} onValueChange={setSelectedBookId}>
              <SelectTrigger className="text-xs h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {catalog.map((b) => (
                  <SelectItem key={b.id} value={b.id} className="text-xs">
                    {isRtl ? b.title_ar : b.title_en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Aggregate KPI Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 bg-card border-border/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-600 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold">{isRtl ? "إجمالي القراء الفريدين" : "Unique Readers"}</p>
                <p className="text-xl font-black text-foreground">{heatmap.totalUniqueReaders}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-card border-border/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold">{isRtl ? "نسبة إتمام الكتاب للنهاية" : "Completion Rate"}</p>
                <p className="text-xl font-black text-emerald-600">{heatmap.overallCompletionRate}%</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-card border-border/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-600 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold">{isRtl ? "إجمالي ساعات القراءة" : "Total Read Hours"}</p>
                <p className="text-xl font-black text-foreground">{heatmap.totalHoursRead.toLocaleString()} {isRtl ? "ساعة" : "hrs"}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-card border-border/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold">{isRtl ? "متوسط الجلسة اليومية" : "Avg Daily Session"}</p>
                <p className="text-xl font-black text-foreground">{heatmap.avgDailyMinutes} {isRtl ? "دقيقة" : "mins"}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Chapter-by-Chapter Heatmap Table & Visualization */}
        <Card className="border-border shadow-md">
          <CardHeader className="p-5 pb-3 border-b border-border/40">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <Activity className="w-4 h-4 text-purple-600" />
                  {isRtl ? "الخريطة الحرارية للفصول الأكثر تفاعلاً وقراءة" : "Chapter Engagement & Heatmap Breakdown"}
                </CardTitle>
                <CardDescription className="text-xs">
                  {isRtl ? "تحليل دقيق لمتوسط الوقت، نسبة الإكمال، والهوامش المدونة في كل فصل" : "Granular chapter-level duration and dropout indicators"}
                </CardDescription>
              </div>
              <Badge className="bg-purple-600 text-white text-[10px]">
                {heatmap.chaptersAnalytics.length} {isRtl ? "فصول تم تحليلها" : "Chapters"}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-5 space-y-4">
            {heatmap.chaptersAnalytics.map((ch, idx) => (
              <div key={ch.chapterId} className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-purple-600 text-white text-xs font-black flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <h4 className="font-bold text-sm text-foreground">
                      {isRtl ? ch.chapterTitleAr : ch.chapterTitleEn}
                    </h4>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-semibold">
                    <span className="text-muted-foreground">
                      👥 {ch.readersCount} {isRtl ? "قارئ" : "readers"}
                    </span>
                    <span className="text-purple-600">
                      ⏱️ {ch.averageMinutesSpent} {isRtl ? "دقيقة/قارئ" : "mins/reader"}
                    </span>
                    <span className="text-blue-600">
                      📝 {ch.highlightNotesCount} {isRtl ? "ملاحظة مسجلة" : "notes"}
                    </span>
                  </div>
                </div>

                {/* Heatmap Progress Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-emerald-600">
                      {isRtl ? `نسبة إكمال الفصل: ${ch.completionRate}%` : `Completion: ${ch.completionRate}%`}
                    </span>
                    <span className="text-rose-500">
                      {isRtl ? `نسبة التوقف والانسحاب: ${ch.dropoffRate}%` : `Drop-off: ${ch.dropoffRate}%`}
                    </span>
                  </div>
                  <div className="h-3 w-full bg-muted rounded-full overflow-hidden flex">
                    <div
                      style={{ width: `${ch.completionRate}%` }}
                      className="bg-gradient-to-r from-purple-600 to-emerald-500 h-full rounded-full transition-all duration-500"
                    />
                    <div
                      style={{ width: `${ch.dropoffRate}%` }}
                      className="bg-rose-500/30 h-full"
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Back Link */}
        <div className="pt-4 flex items-center justify-center">
          <Link to="/book-store/publisher-dashboard">
            <Button variant="outline" className="text-xs font-bold gap-2">
              {isRtl ? (
                <>
                  <ArrowRight className="w-4 h-4" /> العودة لاستوديو الناشر
                </>
              ) : (
                <>
                  <ArrowLeft className="w-4 h-4" /> Back to Publisher Studio
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

export default PublisherAnalyticsPage;
