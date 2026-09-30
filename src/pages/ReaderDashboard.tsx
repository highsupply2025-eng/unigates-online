import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Library, 
  BookOpen, 
  ShoppingBag, 
  Clock, 
  Bookmark, 
  Search, 
  Filter, 
  ShieldCheck, 
  Lock, 
  Sparkles, 
  Truck, 
  CheckCircle2, 
  ArrowLeft, 
  ArrowRight, 
  Heart, 
  FileText, 
  TrendingUp, 
  Award,
  Calendar,
  Layers,
  ChevronRight,
  ChevronLeft,
  Store,
  CreditCard,
  Target,
  Bell,
  BellRing,
  Flame,
  Trophy,
  Zap,
  Tag,
  Gift,
  Check,
  AlertCircle,
  Crown, Coins, Bot, Users, Headphones, Package,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { BookStoreDataStore } from "@/services/bookStoreDataStore";
import { PurchasedBook, BookOrder, WishlistAlert, ReadingChallengeData } from "@/types/bookStore";
import { ReaderEbookModal } from "@/components/bookstore/ReaderEbookModal";
import SiteFooter from "@/components/SiteFooter";
import LanguageSelectorDropdown from "@/components/LanguageSelectorDropdown";
import ThemeToggle from "@/components/ThemeToggle";
import { useSmartBack } from "@/hooks/use-smart-back";

export const ReaderDashboard: React.FC = () => {
  const { dir, language } = useLanguage();
  const isRtl = dir === "rtl";
  const { toast } = useToast();
  const navigate = useNavigate();
  const goBack = useSmartBack("/book-store");

  const [purchasedBooks, setPurchasedBooks] = useState<PurchasedBook[]>(
    BookStoreDataStore.getPurchasedBooks()
  );
  const [orders, setOrders] = useState<BookOrder[]>(BookStoreDataStore.getOrders());
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("library");

  // Selected Book for DRM Reader
  const [readingBook, setReadingBook] = useState<PurchasedBook | null>(null);

  // Reading Challenge State
  const [challenge, setChallenge] = useState<ReadingChallengeData>(
    BookStoreDataStore.getReadingChallenge()
  );
  const [isEditGoalOpen, setIsEditGoalOpen] = useState(false);
  const [newTargetBooks, setNewTargetBooks] = useState(challenge.targetBooks);
  const [newWeeklyMinutes, setNewWeeklyMinutes] = useState(challenge.weeklyTargetMinutes);

  // Wishlist & Price Alerts State
  const [wishlistIds, setWishlistIds] = useState<string[]>(BookStoreDataStore.getWishlist());
  const [alerts, setAlerts] = useState<WishlistAlert[]>(BookStoreDataStore.getWishlistAlerts());
  const unreadAlertsCount = alerts.filter((a) => !a.isRead).length;

  const catalog = BookStoreDataStore.getCatalog();
  const wishlistBooks = catalog.filter((b) => wishlistIds.includes(b.id));

  const filteredBooks = purchasedBooks.filter((pb) => {
    const title = isRtl ? pb.book.title_ar : pb.book.title_en;
    const author = isRtl ? pb.book.author_ar : pb.book.author_en;
    return (
      title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      author.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const totalDigitalBooks = purchasedBooks.filter((p) => p.format === "digital").length;
  const completedBooks = challenge.completedBooks;

  const handleUpdateGoal = () => {
    BookStoreDataStore.updateReadingChallengeTarget(Number(newTargetBooks) || 12, Number(newWeeklyMinutes) || 120);
    setChallenge(BookStoreDataStore.getReadingChallenge());
    setIsEditGoalOpen(false);
    toast({
      title: isRtl ? "تم تحديث هدف القراءة السنوي 🎯" : "Reading Goal Updated 🎯",
      description: isRtl
        ? `الهدف الجديد: ${newTargetBooks} كتاباً سنوياً و ${newWeeklyMinutes} دقيقة قراءة أسبوعياً.`
        : `New goal: ${newTargetBooks} books and ${newWeeklyMinutes} mins/week.`,
    });
  };

  const handleMarkAlertRead = (alertId: string) => {
    BookStoreDataStore.markAlertAsRead(alertId);
    setAlerts(BookStoreDataStore.getWishlistAlerts());
  };

  const handleRemoveFromWishlist = (bookId: string) => {
    BookStoreDataStore.toggleWishlist(bookId);
    setWishlistIds(BookStoreDataStore.getWishlist());
    toast({
      title: isRtl ? "تمت إزالة الكتاب من المفضلة" : "Removed from Wishlist",
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
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg sm:text-xl font-black text-foreground">
                  UNIGATES
                </span>
                <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                  {isRtl ? "مكتبتي الرقمية وتحدي القراءة" : "My Reader Portal & Library"}
                </p>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/book-store/browse">
              <Button size="sm" variant="outline" className="font-bold gap-1.5 h-9">
                <Store className="w-4 h-4 text-amber-500" />
                <span>{isRtl ? "تصفح المتجر" : "Browse Store"}</span>
              </Button>
            </Link>
            <Link to="/book-store/cart">
              <Button size="sm" variant="outline" className="font-bold gap-1.5 h-9">
                <ShoppingBag className="w-4 h-4 text-amber-500" />
                <span>{isRtl ? "السلة" : "Cart"}</span>
              </Button>
            </Link>
            <LanguageSelectorDropdown className="h-9 px-3" />
            <ThemeToggle className="h-9 w-9 p-0 rounded-xl" />
          </div>
        </div>
      </header>

      {/* Hero Reader Stats with Reading Challenge Highlight */}
      <section className="bg-gradient-to-b from-amber-500/10 via-background to-background py-8 px-4 sm:px-8 border-b border-border/40">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30">
                  {isRtl ? "حساب قارئ وباحث معتمد" : "Verified Reader Account"}
                </Badge>
                <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/30 font-bold gap-1">
                  <Flame className="w-3.5 h-3.5 text-orange-500" />
                  <span>{challenge.currentStreakDays} {isRtl ? "أيام قراءة متتالية 🔥" : "Days Streak 🔥"}</span>
                </Badge>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight">
                {isRtl ? "أهلاً بك في مكتبتك وتحدي القراءة 2026 📚" : "Welcome to Your Reading Hub 2026 📚"}
              </h1>
              <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                {isRtl
                  ? "اقرأ مؤلفاتك الرقمية المشفرة بنظام DRM بأمان، تابع تحدي القراءة السنوي، واستقبل تنبيهات التخفيضات لكتبك المفضلة."
                  : "Read DRM-encrypted e-books securely, track your annual reading goals, and receive instant price drop alerts."}
              </p>
            </div>

            {/* Reading Challenge Interactive Card */}
            <Card className="bg-card/90 border-amber-500/30 shadow-xl p-5 w-full lg:w-96 shrink-0 relative overflow-hidden">
              <div className="absolute top-0 end-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-600 flex items-center justify-center">
                    <Target className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-foreground block">
                      {isRtl ? "تحدي القراءة السنوي 2026" : "2026 Annual Reading Challenge"}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {isRtl ? "هدف الكتب السنوي" : "Annual Target"}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditGoalOpen(true)}
                  className="h-7 text-[11px] font-bold text-amber-600 hover:text-amber-700 hover:bg-amber-500/10"
                >
                  {isRtl ? "تعديل الهدف" : "Edit Goal"}
                </Button>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-muted-foreground">{isRtl ? "الكتب المنجزة:" : "Completed:"}</span>
                  <span className="text-amber-600 dark:text-amber-400">
                    {completedBooks} / {challenge.targetBooks} {isRtl ? "كتاب" : "books"} ({Math.round((completedBooks / (challenge.targetBooks || 1)) * 100)}%)
                  </span>
                </div>
                <Progress value={(completedBooks / (challenge.targetBooks || 1)) * 100} className="h-2.5 bg-amber-500/20" />
              </div>

              {/* Weekly Time Tracker */}
              <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-500" />
                  <span className="text-muted-foreground">{isRtl ? "هذا الأسبوع:" : "This Week:"}</span>
                  <span className="font-bold text-foreground">{challenge.weeklyMinutesDone} / {challenge.weeklyTargetMinutes} {isRtl ? "دقيقة" : "mins"}</span>
                </div>
                <Badge variant="secondary" className="text-[10px] bg-amber-500/10 text-amber-700 dark:text-amber-300">
                  {Math.round((challenge.weeklyMinutesDone / (challenge.weeklyTargetMinutes || 1)) * 100)}%
                </Badge>
              </div>
            </Card>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <Card className="bg-card/60 border-border/60 p-3.5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold">{isRtl ? "الكتب الرقمية" : "Digital Books"}</p>
                <p className="text-xl font-black text-foreground">{totalDigitalBooks}</p>
              </div>
            </Card>

            <Card className="bg-card/60 border-border/60 p-3.5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0">
                <Flame className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold">{isRtl ? "أطول سلسلة قراءة" : "Longest Streak"}</p>
                <p className="text-xl font-black text-foreground">{challenge.longestStreakDays} {isRtl ? "يوم" : "days"}</p>
              </div>
            </Card>

            <Card className="bg-card/60 border-border/60 p-3.5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-600 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold">{isRtl ? "إجمالي وقت القراءة" : "Total Time"}</p>
                <p className="text-xl font-black text-foreground">{Math.round(challenge.totalMinutesRead / 60)} {isRtl ? "ساعة" : "hrs"}</p>
              </div>
            </Card>

            <Card className="bg-card/60 border-border/60 p-3.5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-600 flex items-center justify-center shrink-0">
                <BellRing className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold">{isRtl ? "تنبيهات الأسعار" : "Price Alerts"}</p>
                <p className="text-xl font-black text-foreground">{alerts.length}</p>
              </div>
            </Card>
          </div>
          {/* Smart Reader Features Hub (المميزات الذكية - قريباً باقة مدفوعة) */}
          <div className="pt-2">
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-blue-500/10 border border-amber-500/30 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-foreground">
                      {isRtl ? "المميزات الذكية للقارئ (قريباً • باقات بريميوم مدفوعة)" : "Smart Reader Ecosystem (Coming Soon • Premium Tiers)"}
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      {isRtl ? "استكشف الأدوات الذكية الإضافية المخصصة لتسهيل المطالعة والبحث الأكاديمي" : "Explore smart reader add-ons designed for academic excellence"}
                    </p>
                  </div>
                </div>
                <Badge className="bg-amber-600 text-white text-[10px] font-black">
                  {isRtl ? "قريباً جداً 🚀" : "Coming Soon 🚀"}
                </Badge>
              </div>

              {/* Smart Features Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 pt-1">
                <Link to="/book-store/book-pass" className="group">
                  <div className="p-2.5 rounded-xl bg-card/80 hover:bg-card border border-amber-500/30 hover:border-amber-500/70 transition-all flex flex-col items-center text-center gap-1.5 h-full shadow-sm">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Crown className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-black text-foreground truncate">{isRtl ? "Book Pass" : "Book Pass"}</p>
                      <Badge className="bg-amber-600 text-white text-[8px] py-0 px-1">{isRtl ? "قريباً • مدفوع" : "Soon"}</Badge>
                    </div>
                  </div>
                </Link>

                <Link to="/book-store/tracking" className="group">
                  <div className="p-2.5 rounded-xl bg-card/80 hover:bg-card border border-blue-500/30 hover:border-blue-500/70 transition-all flex flex-col items-center text-center gap-1.5 h-full shadow-sm">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Truck className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-black text-foreground truncate">{isRtl ? "تتبع الشحن" : "Live Track"}</p>
                      <Badge className="bg-emerald-600 text-white text-[8px] py-0 px-1">{isRtl ? "مجاني 📍" : "Free"}</Badge>
                    </div>
                  </div>
                </Link>

                <Link to="/book-store/rewards" className="group">
                  <div className="p-2.5 rounded-xl bg-card/80 hover:bg-card border border-yellow-500/30 hover:border-yellow-500/70 transition-all flex flex-col items-center text-center gap-1.5 h-full shadow-sm">
                    <div className="w-8 h-8 rounded-lg bg-yellow-500/20 text-yellow-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Coins className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-black text-foreground truncate">{isRtl ? "نقاط الولاء" : "Rewards"}</p>
                      <Badge className="bg-yellow-600 text-white text-[8px] py-0 px-1">{isRtl ? "قريباً" : "Soon"}</Badge>
                    </div>
                  </div>
                </Link>

                <Link to="/book-store/ai-companion" className="group">
                  <div className="p-2.5 rounded-xl bg-card/80 hover:bg-card border border-amber-500/20 hover:border-amber-500/60 transition-all flex flex-col items-center text-center gap-1.5 h-full">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-black text-foreground truncate">{isRtl ? "المساعد الذكي" : "AI Helper"}</p>
                      <Badge variant="outline" className="text-[8px] py-0 px-1 text-amber-600 border-amber-500/40">{isRtl ? "مدفوع" : "Pro"}</Badge>
                    </div>
                  </div>
                </Link>

                <Link to="/book-store/reading-clubs" className="group">
                  <div className="p-2.5 rounded-xl bg-card/80 hover:bg-card border border-indigo-500/20 hover:border-indigo-500/60 transition-all flex flex-col items-center text-center gap-1.5 h-full">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/15 text-indigo-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Users className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-black text-foreground truncate">{isRtl ? "نوادي القراءة" : "Clubs"}</p>
                      <Badge variant="outline" className="text-[8px] py-0 px-1 text-indigo-600 border-indigo-500/40">{isRtl ? "مدفوع" : "Pro"}</Badge>
                    </div>
                  </div>
                </Link>

                <Link to="/book-store/audiobooks" className="group">
                  <div className="p-2.5 rounded-xl bg-card/80 hover:bg-card border border-emerald-500/20 hover:border-emerald-500/60 transition-all flex flex-col items-center text-center gap-1.5 h-full">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Headphones className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-black text-foreground truncate">{isRtl ? "صوتيات" : "Audio"}</p>
                      <Badge variant="outline" className="text-[8px] py-0 px-1 text-emerald-600 border-emerald-500/40">{isRtl ? "مدفوع" : "Pro"}</Badge>
                    </div>
                  </div>
                </Link>

                <Link to="/book-store/bundles" className="group">
                  <div className="p-2.5 rounded-xl bg-card/80 hover:bg-card border border-blue-500/20 hover:border-blue-500/60 transition-all flex flex-col items-center text-center gap-1.5 h-full">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Package className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-black text-foreground truncate">{isRtl ? "باقات الفرق" : "Bundles"}</p>
                      <Badge variant="outline" className="text-[8px] py-0 px-1 text-blue-600 border-blue-500/40">-30%</Badge>
                    </div>
                  </div>
                </Link>

                <Link to="/book-store/gift" className="group">
                  <div className="p-2.5 rounded-xl bg-card/80 hover:bg-card border border-rose-500/20 hover:border-rose-500/60 transition-all flex flex-col items-center text-center gap-1.5 h-full">
                    <div className="w-8 h-8 rounded-lg bg-rose-500/15 text-rose-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Gift className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-black text-foreground truncate">{isRtl ? "إهداء كتاب" : "Gift"}</p>
                      <Badge variant="outline" className="text-[8px] py-0 px-1 text-rose-600 border-rose-500/40">{isRtl ? "جديد" : "New"}</Badge>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Tabs */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-8 py-8 space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
            <TabsList className="bg-muted/80 p-1 rounded-2xl h-11 flex-wrap">
              <TabsTrigger value="library" className="font-bold text-xs sm:text-sm rounded-xl gap-2">
                <Library className="w-4 h-4" />
                <span>{isRtl ? "مكتبتي الرقمية (القراءة)" : "My E-Library"}</span>
                <Badge variant="secondary" className="text-[10px] px-1.5 h-4">
                  {purchasedBooks.length}
                </Badge>
              </TabsTrigger>

              <TabsTrigger value="challenge" className="font-bold text-xs sm:text-sm rounded-xl gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                <span>{isRtl ? "تحدي القراءة والأوسمة" : "Challenge & Badges"}</span>
              </TabsTrigger>

              <TabsTrigger value="alerts" className="font-bold text-xs sm:text-sm rounded-xl gap-2">
                <Bell className="w-4 h-4 text-rose-500" />
                <span>{isRtl ? "تنبيهات انخفاض الأسعار" : "Price Drop Alerts"}</span>
                {unreadAlertsCount > 0 && (
                  <Badge className="bg-rose-500 text-white text-[10px] px-1.5 h-4">
                    {unreadAlertsCount}
                  </Badge>
                )}
              </TabsTrigger>

              <TabsTrigger value="wishlist" className="font-bold text-xs sm:text-sm rounded-xl gap-2">
                <Heart className="w-4 h-4 text-rose-400" />
                <span>{isRtl ? "قائمة الرغبات" : "Wishlist"}</span>
                <Badge variant="secondary" className="text-[10px] px-1.5 h-4">
                  {wishlistBooks.length}
                </Badge>
              </TabsTrigger>

              <TabsTrigger value="purchases" className="font-bold text-xs sm:text-sm rounded-xl gap-2">
                <ShoppingBag className="w-4 h-4" />
                <span>{isRtl ? "سجل الفواتير" : "Invoices"}</span>
              </TabsTrigger>
            </TabsList>

            {activeTab === "library" && (
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 text-muted-foreground" style={{ [isRtl ? "right" : "left"]: "0.75rem" }} />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isRtl ? "ابحث في مكتبتك..." : "Search your library..."}
                  className="h-10 text-xs rounded-xl"
                  style={{ [isRtl ? "paddingRight" : "paddingLeft"]: "2.25rem" }}
                />
              </div>
            )}
          </div>

          {/* TAB 1: Reader Library */}
          <TabsContent value="library" className="space-y-6 mt-0">
            {filteredBooks.length === 0 ? (
              <Card className="text-center p-12 border-dashed border-2">
                <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-black text-foreground mb-2">
                  {isRtl ? "مكتبتك خالية حالياً" : "Your Library is Empty"}
                </h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
                  {isRtl
                    ? "تصفح متجر الكتب والنسخ الرقمية المعتمدة من دار عبيد واقتنِ أول كتاب لتتمكن من قراءته فوراً."
                    : "Browse Dar Obeid bookstore to purchase digital e-books with DRM protection."}
                </p>
                <Link to="/book-store/browse">
                  <Button className="font-bold bg-amber-600 hover:bg-amber-700 text-white gap-2">
                    <Store className="w-4 h-4" />
                    <span>{isRtl ? "تصفح متجر الكتب الآن" : "Explore Book Store Now"}</span>
                  </Button>
                </Link>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBooks.map((item) => {
                  const progress = item.lastReadProgress || 0;
                  return (
                    <Card
                      key={item.id}
                      className="group overflow-hidden border-border/70 hover:border-amber-500/50 hover:shadow-xl hover:shadow-amber-500/10 transition-all flex flex-col bg-card"
                    >
                      <div className="relative aspect-16/10 overflow-hidden bg-slate-950">
                        <img
                          src={item.book.cover_url}
                          alt={item.book.title_ar}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                        {/* Top Badges */}
                        <div className="absolute top-3 inset-x-3 flex items-center justify-between">
                          <Badge className="bg-amber-500 text-slate-950 font-black text-[10px]">
                            {isRtl ? "نسخة رقمية مشفرة" : "DRM E-Book"}
                          </Badge>
                          <Badge className="bg-emerald-500/90 text-white font-bold text-[10px] gap-1">
                            <Lock className="w-2.5 h-2.5" />
                            {isRtl ? "جاهز للأوفلاين" : "Offline Ready"}
                          </Badge>
                        </div>

                        {/* Bottom Book Info inside Cover */}
                        <div className="absolute bottom-3 inset-x-3">
                          <p className="text-white text-xs font-bold opacity-80">
                            {isRtl ? item.book.publisher_ar : item.book.publisher_en}
                          </p>
                        </div>
                      </div>

                      <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div>
                          <p className="text-xs font-bold text-amber-600 dark:text-amber-400 mb-1">
                            {isRtl ? item.book.category_ar : item.book.category_en}
                          </p>
                          <h3 className="text-base font-black text-foreground line-clamp-2">
                            {isRtl ? item.book.title_ar : item.book.title_en}
                          </h3>
                          <p className="text-xs text-muted-foreground font-semibold mt-1">
                            {isRtl ? item.book.author_ar : item.book.author_en}
                          </p>
                        </div>

                        {/* Reading Progress */}
                        <div className="space-y-1.5 pt-2 border-t border-border/40">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground font-semibold">
                              {isRtl ? "نسبة التقدم في القراءة:" : "Reading Progress:"}
                            </span>
                            <span className="font-bold text-foreground">{progress}%</span>
                          </div>
                          <Progress value={progress} className="h-2 bg-amber-500/20" />
                        </div>

                        {/* Actions */}
                        <div className="pt-2 flex items-center gap-2">
                          <Button
                            onClick={() => setReadingBook(item)}
                            className="w-full font-bold bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-md shadow-amber-500/20 gap-2 h-10 rounded-xl"
                          >
                            <BookOpen className="w-4 h-4" />
                            <span>
                              {progress > 0
                                ? isRtl
                                  ? "متابعة القراءة الآن"
                                  : "Continue Reading"
                                : isRtl
                                ? "بدء القراءة المحمية"
                                : "Start Reading (DRM)"}
                            </span>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* TAB 2: Reading Challenge & Achievements */}
          <TabsContent value="challenge" className="space-y-6 mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Detailed Progress Card */}
              <Card className="lg:col-span-1 p-6 space-y-4 border-amber-500/30">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  <h3 className="text-base font-black text-foreground">
                    {isRtl ? "إحصائيات التحدي السنوي" : "Challenge Insights"}
                  </h3>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40">
                    <span className="text-muted-foreground font-semibold">{isRtl ? "الهدف المحدد:" : "Yearly Goal:"}</span>
                    <span className="font-black text-foreground">{challenge.targetBooks} {isRtl ? "كتب" : "books"}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40">
                    <span className="text-muted-foreground font-semibold">{isRtl ? "الكتب المكتملة:" : "Finished:"}</span>
                    <span className="font-black text-emerald-600">{challenge.completedBooks} {isRtl ? "كتب" : "books"}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40">
                    <span className="text-muted-foreground font-semibold">{isRtl ? "السلسلة الحالية:" : "Current Streak:"}</span>
                    <span className="font-black text-orange-500">{challenge.currentStreakDays} {isRtl ? "أيام متتالية 🔥" : "Days"}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40">
                    <span className="text-muted-foreground font-semibold">{isRtl ? "المجال المفضل:" : "Top Genre:"}</span>
                    <span className="font-bold text-foreground truncate max-w-[140px]">{challenge.favoriteGenre}</span>
                  </div>
                </div>

                <Button
                  onClick={() => setIsEditGoalOpen(true)}
                  className="w-full font-bold bg-amber-600 hover:bg-amber-700 text-white gap-2"
                >
                  <Target className="w-4 h-4" />
                  <span>{isRtl ? "تعديل أهداف التحدي" : "Customize Target"}</span>
                </Button>
              </Card>

              {/* Achievements & Badges List */}
              <Card className="lg:col-span-2 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-black text-foreground">
                      {isRtl ? "أوسمة وشارات الإنجاز القرائي" : "Reading Badges & Milestones"}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {isRtl
                        ? "أوسمة تحفيزية تفتح تلقائياً عند إتمام فصول وكتب وساعات قراءة منتظمة."
                        : "Unlocked automatically as you achieve reading milestones."}
                    </p>
                  </div>
                  <Badge variant="outline" className="border-amber-500/30 text-amber-700 dark:text-amber-300 font-bold">
                    {challenge.achievements.filter((a) => a.isUnlocked).length} / {challenge.achievements.length} {isRtl ? "مفتوح" : "Unlocked"}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {challenge.achievements.map((ach) => (
                    <div
                      key={ach.id}
                      className={`p-4 rounded-2xl border transition-all flex gap-3 items-start ${
                        ach.isUnlocked
                          ? "bg-amber-500/5 border-amber-500/30 shadow-xs"
                          : "bg-muted/20 border-border/40 opacity-60"
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
                          ach.isUnlocked
                            ? "bg-gradient-to-br from-amber-500 to-orange-600 text-white"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {ach.icon === "Flame" ? (
                          <Flame className="w-5 h-5" />
                        ) : ach.icon === "Trophy" ? (
                          <Trophy className="w-5 h-5" />
                        ) : ach.icon === "Award" ? (
                          <Award className="w-5 h-5" />
                        ) : (
                          <BookOpen className="w-5 h-5" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-xs font-black text-foreground truncate">
                            {isRtl ? ach.title_ar : ach.title_en}
                          </h4>
                          {ach.isUnlocked && (
                            <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-[9px] px-1 h-4">
                              {isRtl ? "مكتمل" : "Earned"}
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                          {isRtl ? ach.desc_ar : ach.desc_en}
                        </p>
                        {ach.unlockedAt && (
                          <p className="text-[10px] text-amber-600 dark:text-amber-400 font-mono mt-1">
                            {isRtl ? "تم الفتح:" : "Unlocked:"} {ach.unlockedAt}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* TAB 3: Price Drop & Wishlist Alerts */}
          <TabsContent value="alerts" className="space-y-4 mt-0">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-black text-foreground flex items-center gap-2">
                    <BellRing className="w-5 h-5 text-rose-500" />
                    <span>{isRtl ? "مركز تنبيهات انخفاض الأسعار والطبعات الجديدة" : "Wishlist & Price Drop Alerts Center"}</span>
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isRtl
                      ? "إشعارات فورية ترصد تخفيضات الأسعار وصدور الطبعات المنقحة للكتب في قائمة رغباتك."
                      : "Instant notifications regarding discounts and new editions for your favorited books."}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {alerts.map((alert) => (
                  <Card
                    key={alert.id}
                    className={`p-4 border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      !alert.isRead
                        ? "bg-rose-500/5 border-rose-500/30 shadow-xs"
                        : "bg-card/50 border-border/60 opacity-80"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          alert.type === "price_drop"
                            ? "bg-rose-500/15 text-rose-600"
                            : alert.type === "new_edition"
                            ? "bg-amber-500/15 text-amber-600"
                            : "bg-blue-500/15 text-blue-600"
                        }`}
                      >
                        {alert.type === "price_drop" ? (
                          <Tag className="w-5 h-5" />
                        ) : alert.type === "new_edition" ? (
                          <Sparkles className="w-5 h-5" />
                        ) : (
                          <Truck className="w-5 h-5" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black text-foreground">{alert.bookTitle}</h4>
                          <Badge
                            className={
                              alert.type === "price_drop"
                                ? "bg-rose-500 text-white text-[10px]"
                                : "bg-amber-500 text-slate-950 text-[10px]"
                            }
                          >
                            {alert.type === "price_drop"
                              ? isRtl
                                ? "خصم حصري 🔥"
                                : "Price Drop"
                              : isRtl
                              ? "طبعة جديدة ✨"
                              : "New Edition"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {isRtl ? alert.message_ar : alert.message_en}
                        </p>
                        <span className="text-[10px] text-muted-foreground font-mono mt-1 block">
                          {alert.date}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <Link to={`/book-store/catalog`}>
                        <Button size="sm" className="h-8 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white gap-1">
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>{isRtl ? "اقتناء الآن" : "Buy Now"}</span>
                        </Button>
                      </Link>

                      {!alert.isRead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkAlertRead(alert.id)}
                          className="h-8 text-xs font-bold text-muted-foreground hover:text-foreground"
                        >
                          {isRtl ? "تعيين كمقروء" : "Mark as read"}
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* TAB 4: Wishlist */}
          <TabsContent value="wishlist" className="space-y-4 mt-0">
            {wishlistBooks.length === 0 ? (
              <Card className="text-center p-12 border-dashed">
                <Heart className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-base font-bold text-foreground mb-1">
                  {isRtl ? "قائمة رغباتك فارغة" : "Wishlist is Empty"}
                </h3>
                <p className="text-xs text-muted-foreground mb-4">
                  {isRtl ? "أضف كتباً إلى قائمة الرغبات لحفظها وتلقي تنبيهات الأسعار عليها." : "Save books to your wishlist for price drop tracking."}
                </p>
                <Link to="/book-store/browse">
                  <Button size="sm" variant="outline" className="font-bold">
                    {isRtl ? "تصفح الكتب" : "Browse Books"}
                  </Button>
                </Link>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {wishlistBooks.map((b) => (
                  <Card key={b.id} className="p-4 flex gap-4 items-center relative group">
                    <img src={b.cover_url} alt={b.title_ar} className="w-20 h-28 object-cover rounded-xl shadow-md shrink-0" />
                    <div className="flex-1 min-w-0">
                      <Badge variant="outline" className="text-[9px] mb-1">
                        {isRtl ? b.category_ar : b.category_en}
                      </Badge>
                      <h4 className="text-sm font-black truncate">{isRtl ? b.title_ar : b.title_en}</h4>
                      <p className="text-xs text-muted-foreground truncate">{isRtl ? b.author_ar : b.author_en}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-sm font-black text-amber-600">{b.price_digital} EGP</span>
                        <span className="text-[10px] text-muted-foreground">({isRtl ? "رقمي" : "Digital"})</span>
                      </div>

                      <div className="flex items-center gap-2 mt-3">
                        <Link to={`/book-store/catalog`} className="flex-1">
                          <Button size="sm" className="w-full h-8 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white">
                            {isRtl ? "شراء" : "Buy"}
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFromWishlist(b.id)}
                          className="h-8 text-xs text-muted-foreground hover:text-red-500"
                        >
                          {isRtl ? "إزالة" : "Remove"}
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* TAB 5: Purchases */}
          <TabsContent value="purchases" className="space-y-4 mt-0">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-black text-foreground">
                    {isRtl ? "سجل المشتريات والطلبات السابقة" : "Order & Invoices History"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {isRtl
                      ? "جميع عمليات شراء الكتب الرقمية والطلبات الورقية والشحن الصادرة من حسابك."
                      : "All physical book shipments and digital purchases registered to your account."}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {orders.map((order) => (
                  <Card key={order.id} className="p-4 border-border/60 hover:border-border transition-all bg-card/50">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border/40">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-xs">
                          #
                        </div>
                        <div>
                          <p className="text-sm font-black text-foreground">{order.orderNumber}</p>
                          <p className="text-xs text-muted-foreground">{order.createdAt}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge
                          className={
                            order.status === "completed"
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                              : "bg-blue-500/10 text-blue-600 border-blue-500/20"
                          }
                        >
                          {order.status === "completed"
                            ? isRtl
                              ? "مكتمل ومدفوع"
                              : "Completed & Paid"
                            : isRtl
                            ? "قيد المعالجة"
                            : "Processing"}
                        </Badge>
                        <span className="text-base font-black text-foreground">
                          {order.totalAmount} {order.currency}
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 space-y-2">
                      {order.items.map((it, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground font-bold">•</span>
                            <span className="font-bold text-foreground">{it.bookTitle}</span>
                            <Badge variant="outline" className="text-[10px]">
                              {it.format === "digital" ? (isRtl ? "رقمي" : "Digital") : (isRtl ? "ورقي مطبوع" : "Print")}
                            </Badge>
                          </div>
                          <span className="font-bold">{it.price} EGP</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Edit Reading Goal Dialog */}
      <Dialog open={isEditGoalOpen} onOpenChange={setIsEditGoalOpen}>
        <DialogContent className="sm:max-w-md" dir={dir}>
          <DialogHeader>
            <DialogTitle className="font-black text-lg">
              {isRtl ? "تخصيص تحدي القراءة السنوي" : "Customize Reading Challenge"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {isRtl
                ? "حدد عدد الكتب المستهدفة لعام 2026 ووقت القراءة الأسبوعي لبناء عادة معرفية مستدامة."
                : "Set your target book count and weekly reading minutes for 2026."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground">
                {isRtl ? "عدد الكتب المستهدفة سنوياً (كتاب)" : "Target Books / Year"}
              </label>
              <Input
                type="number"
                value={newTargetBooks}
                onChange={(e) => setNewTargetBooks(Number(e.target.value))}
                min={1}
                max={100}
                className="h-10 text-xs rounded-xl font-mono"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground">
                {isRtl ? "وقت القراءة المستهدف أسبوعياً (دقيقة)" : "Target Minutes / Week"}
              </label>
              <Input
                type="number"
                value={newWeeklyMinutes}
                onChange={(e) => setNewWeeklyMinutes(Number(e.target.value))}
                min={15}
                max={1000}
                className="h-10 text-xs rounded-xl font-mono"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsEditGoalOpen(false)}>
              {isRtl ? "إلغاء" : "Cancel"}
            </Button>
            <Button size="sm" onClick={handleUpdateGoal} className="font-bold bg-amber-600 hover:bg-amber-700 text-white">
              {isRtl ? "حفظ وتثبيت التحدي" : "Save Challenge"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DRM E-Reader Modal */}
      {readingBook && (
        <ReaderEbookModal
          purchasedBook={readingBook}
          isOpen={!!readingBook}
          onClose={() => setReadingBook(null)}
          userEmail="reader@unigates.online"
        />
      )}

      <SiteFooter />
    </div>
  );
};
export default ReaderDashboard;
