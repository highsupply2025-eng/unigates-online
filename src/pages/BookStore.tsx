import SiteFooter from "@/components/SiteFooter";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  BookOpen, 
  Search, 
  ShoppingCart, 
  Star, 
  Filter, 
  Tag, 
  Heart, 
  Eye, 
  CheckCircle, 
  Home, 
  LogIn, 
  User, 
  LogOut, 
  ArrowLeft, 
  ArrowRight,
  Library,
  Truck,
  Lock,
  Building2,
  Sparkles,
  Bookmark,
  Check,
  Crown,
  Bot,
  Headphones,
  Package,
  Gift,
  Users,
  Coins
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useSmartBack } from "@/hooks/use-smart-back";
import { BookStoreDataStore } from "@/services/bookStoreDataStore";
import { BookStoreItem, BookFormat } from "@/types/bookStore";
import LanguageSelectorDropdown from "@/components/LanguageSelectorDropdown";
import ThemeToggle from "@/components/ThemeToggle";

const BookStore = () => {
  const { t, dir, language } = useLanguage();
  const isRtl = dir === "rtl";
  const { toast } = useToast();
  const navigate = useNavigate();
  const goBack = useSmartBack("/");
  const [searchParams] = useSearchParams();

  const [catalog, setCatalog] = useState<BookStoreItem[]>(BookStoreDataStore.getCatalog());
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBookForBuy, setSelectedBookForBuy] = useState<BookStoreItem | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<"digital" | "print">("digital");
  const [wishlist, setWishlist] = useState<string[]>(BookStoreDataStore.getWishlist());
  const [currentSession, setCurrentSession] = useState<{ role: "reader" | "publisher"; name: string; email: string } | null>(
    BookStoreDataStore.getCurrentSession()
  );

  const handleLogout = () => {
    BookStoreDataStore.logout();
    setCurrentSession(null);
    toast({
      title: isRtl ? "تم تسجيل الخروج بنجاح" : "Logged out successfully",
    });
  };

  const categories = [
    { id: "all", label: isRtl ? "الكل" : "All" },
    { id: "academic", label: isRtl ? "مراجع ودراسات أكاديمية" : "Academic References" },
    { id: "technology", label: isRtl ? "الذكاء الاصطناعي والتقنية" : "AI & Technology" },
    { id: "business", label: isRtl ? "إدارة الأعمال والقيادة" : "Business & Leadership" },
    { id: "programming", label: isRtl ? "البرمجة وهندسة النظم" : "Programming" },
    { id: "humanities", label: isRtl ? "العلوم الإنسانية واللغات" : "Humanities" },
  ];

  const filteredBooks = catalog.filter((book) => {
    const matchesCategory = selectedCategory === "all" || book.category === selectedCategory;
    const title = isRtl ? book.title_ar : book.title_en;
    const author = isRtl ? book.author_ar : book.author_en;
    const publisher = isRtl ? book.publisher_ar : book.publisher_en;
    const matchesSearch =
      title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      publisher.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleToggleWishlist = (bookId: string) => {
    const isAdded = BookStoreDataStore.toggleWishlist(bookId);
    setWishlist(BookStoreDataStore.getWishlist());
    toast({
      title: isAdded
        ? isRtl ? "تمت الإضافة للمفضلة ❤️" : "Added to Wishlist ❤️"
        : isRtl ? "تم الحذف من المفضلة" : "Removed from Wishlist",
    });
  };

  const handleOpenBuyDialog = (book: BookStoreItem, defaultFormat: "digital" | "print" = "digital") => {
    if (!currentSession) {
      toast({
        title: isRtl ? "يرجى تسجيل الدخول أولاً" : "Please Login First",
        description: isRtl
          ? "يجب تسجيل الدخول كقارئ للتمكن من إضافة الكتب لسلة الشراء وإتمام الطلب."
          : "Please log in to your reader account to add books to your cart and checkout.",
      });
      navigate("/book-store/login");
      return;
    }
    setSelectedBookForBuy(book);
    setSelectedFormat(defaultFormat);
  };

  const handleProceedToCartOrCheckout = () => {
    if (!selectedBookForBuy) return;
    if (!currentSession) {
      toast({
        title: isRtl ? "يرجى تسجيل الدخول أولاً" : "Please Login First",
        description: isRtl
          ? "يجب تسجيل الدخول للوصول إلى سلة الشراء."
          : "Please log in to access the cart.",
      });
      navigate("/book-store/login");
      return;
    }
    BookStoreDataStore.addToCart(selectedBookForBuy, selectedFormat, 1);
    setSelectedBookForBuy(null);

    toast({
      title: isRtl ? "تمت الإضافة لسلة الشراء 🛒" : "Added to Cart 🛒",
      description: isRtl
        ? `تمت إضافة كتاب «${selectedBookForBuy.title_ar}» بصيغة (${selectedFormat === "digital" ? "رقمي" : "ورقي"}).`
        : `Book added in ${selectedFormat} format.`,
    });

    navigate("/book-store/cart");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-amber-600 selection:text-white" dir={dir}>
      {/* Top Header */}
      <header className="border-b border-border/40 px-4 sm:px-8 py-3.5 bg-card/70 backdrop-blur-md sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={goBack}
              className="font-bold gap-1.5 h-9 px-2.5 sm:px-3 border-border/80 text-foreground hover:bg-muted rounded-xl"
              title={isRtl ? "الرجوع للبوابة الرئيسية" : "Back to Main Portal"}
            >
              {isRtl ? <ArrowRight className="w-4 h-4 text-amber-500" /> : <ArrowLeft className="w-4 h-4 text-amber-500" />}
              <span>{isRtl ? "رجوع" : "Back"}</span>
            </Button>

            <Link to="/book-store" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-600 to-red-600 p-0.5 shadow-md group-hover:scale-105 transition-transform flex items-center justify-center text-white">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xl font-black text-foreground tracking-tight">UNIGATES</span>
                <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                  {isRtl ? "متجر الكتب والمكتبة الرقمية • دار عبيد" : "Book Store & Dar Obeid Publishing"}
                </p>
              </div>
            </Link>
          </div>

          {/* Nav buttons based on Authentication State */}
          <div className="flex items-center gap-2 sm:gap-3">
            {currentSession ? (
              <>
                {currentSession.role === "publisher" ? (
                  <Link to="/book-store/publisher-dashboard">
                    <Button size="sm" variant="outline" className="font-bold gap-1.5 h-9 border-orange-500/40 text-orange-600 dark:text-orange-400 hover:bg-orange-500/10">
                      <Building2 className="w-4 h-4 text-orange-500" />
                      <span>{isRtl ? "استوديو الناشر" : "Publisher Studio"}</span>
                    </Button>
                  </Link>
                ) : (
                  <Link to="/book-store/reader-dashboard">
                    <Button size="sm" variant="outline" className="font-bold gap-1.5 h-9 border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10">
                      <Library className="w-4 h-4 text-amber-500" />
                      <span>{isRtl ? "مكتبتي الرقمية" : "My Library"}</span>
                    </Button>
                  </Link>
                )}

                {/* Cart button only displayed when user is logged in */}
                <Link to="/book-store/cart">
                  <Button size="sm" className="font-bold gap-1.5 h-9 bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-500/20">
                    <ShoppingCart className="w-4 h-4" />
                    <span>{isRtl ? "السلة" : "Cart"}</span>
                  </Button>
                </Link>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleLogout}
                  className="text-xs font-bold text-muted-foreground hover:text-destructive h-9 px-2 gap-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{isRtl ? "خروج" : "Logout"}</span>
                </Button>
              </>
            ) : (
              <>
                <Link to="/book-store/login">
                  <Button size="sm" variant="outline" className="font-bold gap-1.5 h-9 border-border/80 text-foreground hover:bg-muted">
                    <LogIn className="w-4 h-4 text-amber-500" />
                    <span>{isRtl ? "تسجيل الدخول" : "Login"}</span>
                  </Button>
                </Link>

                <Link to="/book-store/signup">
                  <Button size="sm" variant="outline" className="hidden sm:inline-flex font-bold gap-1.5 h-9 border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10">
                    <User className="w-4 h-4 text-amber-500" />
                    <span>{isRtl ? "إنشاء حساب" : "Sign Up"}</span>
                  </Button>
                </Link>
              </>
            )}

            <LanguageSelectorDropdown className="h-9 px-3" />
            <ThemeToggle className="h-9 w-9 p-0 rounded-xl" />
          </div>
        </div>
      </header>

      {/* Hero Search Section */}
      <section className="bg-gradient-to-b from-amber-500/15 via-background to-background py-10 px-4 sm:px-8 border-b border-border/40">
        <div className="max-w-5xl mx-auto text-center space-y-4">
          <Badge className="bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-500/30 text-xs px-3 py-1">
            {isRtl ? "دار عبيد للطباعة والنشر والتوزيع • موثق ومعتمد" : "Dar Obeid Publishing & Distribution"}
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight">
            {isRtl ? "متجر ومكتبة الكتب الأكاديمية والعلمية" : "Academic Book Store & E-Library"}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
            {isRtl
              ? "اقتنِ نسختك الرقمية المشفرة بنظام DRM للقراءة الفورية وأوفلاين، أو اطلب النسخة الورقية الفاخرة مع الشحن السريع لباب منزلك."
              : "Buy DRM-encrypted digital e-books for instant & offline reading, or order deluxe print copies with fast doorstep delivery."}
          </p>

          {/* Search bar */}
          <div className="max-w-2xl mx-auto relative pt-2">
            <Search className="absolute top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 pointer-events-none" style={{ [isRtl ? "right" : "left"]: "1.25rem" }} />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isRtl ? "ابحث بعنوان الكتاب، اسم الباحث أو المؤلف، أو دار النشر..." : "Search by book title, author, or publisher..."}
              className="h-13 rounded-2xl bg-card border-border/80 text-sm shadow-md"
              style={{ [isRtl ? "paddingRight" : "paddingLeft"]: "3.25rem" }}
            />
          </div>
        </div>
      </section>

      {/* Smart Platform Services & Innovations Bar (قريباً باقات بريميوم مدفوعة + خدمات مجانية) */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-8 pt-6 pb-2">
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-purple-500/10 border border-amber-500/30 space-y-3 shadow-xs">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center font-bold shadow-sm">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-foreground">
                  {isRtl ? "الخدمات والحلول الذكية لمتجر الكتب (قريباً • باقات بريميوم)" : "Book Store Innovations & Smart Features"}
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  {isRtl
                    ? "استكشف أحدث ميزات القراءة والذكاء الاصطناعي وتتبع الشحن الحي للكتب الورقية"
                    : "Explore next-gen reading AI, digital bundles, and live courier tracking"}
                </p>
              </div>
            </div>
            <Badge className="bg-amber-600 text-white text-[10px] font-black px-2.5 py-0.5 shadow-xs">
              {isRtl ? "ميزات متقدمة 🚀" : "Upcoming Pro Suite 🚀"}
            </Badge>
          </div>

          {/* Quick Features Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 pt-1">
            {/* 1. Book Pass */}
            <Link to="/book-store/book-pass" className="group">
              <div className="p-2.5 rounded-2xl bg-card/80 hover:bg-card border border-amber-500/30 hover:border-amber-500/70 transition-all flex flex-col items-center text-center gap-1.5 h-full shadow-xs hover:shadow-md">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Crown className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-black text-foreground truncate">{isRtl ? "اشتراك Book Pass" : "Book Pass"}</p>
                  <span className="inline-block text-[9px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/15 px-1.5 py-0.5 rounded-full mt-0.5">
                    {isRtl ? "قريباً • مدفوع" : "Soon • Pro"}
                  </span>
                </div>
              </div>
            </Link>

            {/* 2. AI Companion */}
            <Link to="/book-store/ai-companion" className="group">
              <div className="p-2.5 rounded-2xl bg-card/80 hover:bg-card border border-purple-500/30 hover:border-purple-500/70 transition-all flex flex-col items-center text-center gap-1.5 h-full shadow-xs hover:shadow-md">
                <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-black text-foreground truncate">{isRtl ? "مساعد القراءة AI" : "AI Companion"}</p>
                  <span className="inline-block text-[9px] font-bold text-purple-700 dark:text-purple-300 bg-purple-500/15 px-1.5 py-0.5 rounded-full mt-0.5">
                    {isRtl ? "قريباً • مدفوع" : "Soon • Pro"}
                  </span>
                </div>
              </div>
            </Link>

            {/* 3. Audiobooks */}
            <Link to="/book-store/audiobooks" className="group">
              <div className="p-2.5 rounded-2xl bg-card/80 hover:bg-card border border-emerald-500/30 hover:border-emerald-500/70 transition-all flex flex-col items-center text-center gap-1.5 h-full shadow-xs hover:shadow-md">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Headphones className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-black text-foreground truncate">{isRtl ? "كتاب صوتي AI" : "Audiobook"}</p>
                  <span className="inline-block text-[9px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 px-1.5 py-0.5 rounded-full mt-0.5">
                    {isRtl ? "قريباً • مدفوع" : "Soon • Pro"}
                  </span>
                </div>
              </div>
            </Link>

            {/* 4. Curriculum Bundles */}
            <Link to="/book-store/bundles" className="group">
              <div className="p-2.5 rounded-2xl bg-card/80 hover:bg-card border border-blue-500/30 hover:border-blue-500/70 transition-all flex flex-col items-center text-center gap-1.5 h-full shadow-xs hover:shadow-md">
                <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Package className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-black text-foreground truncate">{isRtl ? "باقات الفرق الدراسية" : "Book Bundles"}</p>
                  <span className="inline-block text-[9px] font-bold text-blue-700 dark:text-blue-300 bg-blue-500/15 px-1.5 py-0.5 rounded-full mt-0.5">
                    {isRtl ? "قريباً • خصم 30%" : "Soon • 30% Off"}
                  </span>
                </div>
              </div>
            </Link>

            {/* 5. Live Courier Tracking */}
            <Link to="/book-store/tracking" className="group">
              <div className="p-2.5 rounded-2xl bg-card/80 hover:bg-card border border-cyan-500/30 hover:border-cyan-500/70 transition-all flex flex-col items-center text-center gap-1.5 h-full shadow-xs hover:shadow-md">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Truck className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-black text-foreground truncate">{isRtl ? "تتبع الشحن الحي" : "Live Courier"}</p>
                  <span className="inline-block text-[9px] font-bold text-cyan-700 dark:text-cyan-300 bg-cyan-500/15 px-1.5 py-0.5 rounded-full mt-0.5">
                    {isRtl ? "مجاني 📍" : "Free 📍"}
                  </span>
                </div>
              </div>
            </Link>

            {/* 6. Gift a Book */}
            <Link to="/book-store/gift" className="group">
              <div className="p-2.5 rounded-2xl bg-card/80 hover:bg-card border border-rose-500/30 hover:border-rose-500/70 transition-all flex flex-col items-center text-center gap-1.5 h-full shadow-xs hover:shadow-md">
                <div className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Gift className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-black text-foreground truncate">{isRtl ? "إهداء كتاب" : "Gift a Book"}</p>
                  <span className="inline-block text-[9px] font-bold text-rose-700 dark:text-rose-300 bg-rose-500/15 px-1.5 py-0.5 rounded-full mt-0.5">
                    {isRtl ? "قريباً • إهداء" : "Soon • Gift"}
                  </span>
                </div>
              </div>
            </Link>

            {/* 7. Reading Circles */}
            <Link to="/book-store/reading-clubs" className="group">
              <div className="p-2.5 rounded-2xl bg-card/80 hover:bg-card border border-indigo-500/30 hover:border-indigo-500/70 transition-all flex flex-col items-center text-center gap-1.5 h-full shadow-xs hover:shadow-md">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Users className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-black text-foreground truncate">{isRtl ? "نوادي القراءة" : "Book Clubs"}</p>
                  <span className="inline-block text-[9px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-500/15 px-1.5 py-0.5 rounded-full mt-0.5">
                    {isRtl ? "قريباً • نقاشات" : "Soon"}
                  </span>
                </div>
              </div>
            </Link>

            {/* 8. Reader Rewards */}
            <Link to="/book-store/rewards" className="group">
              <div className="p-2.5 rounded-2xl bg-card/80 hover:bg-card border border-yellow-500/30 hover:border-yellow-500/70 transition-all flex flex-col items-center text-center gap-1.5 h-full shadow-xs hover:shadow-md">
                <div className="w-8 h-8 rounded-xl bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Coins className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-black text-foreground truncate">{isRtl ? "نقاط المكافآت" : "Rewards"}</p>
                  <span className="inline-block text-[9px] font-bold text-yellow-700 dark:text-yellow-300 bg-yellow-500/15 px-1.5 py-0.5 rounded-full mt-0.5">
                    {isRtl ? "قريباً • خصومات" : "Soon"}
                  </span>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Categories Filter Bar */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-8 pt-6 pb-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat.id)}
              className={`rounded-xl text-xs font-bold shrink-0 transition-all ${
                selectedCategory === cat.id
                  ? "bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-500/20"
                  : "border-border/60"
              }`}
            >
              {cat.label}
            </Button>
          ))}
        </div>
      </section>

      {/* Books Grid */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-8 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBooks.map((book) => {
            const title = isRtl ? book.title_ar : book.title_en;
            const author = isRtl ? book.author_ar : book.author_en;
            const publisher = isRtl ? book.publisher_ar : book.publisher_en;
            const isWishlisted = wishlist.includes(book.id);

            return (
              <Card
                key={book.id}
                className="group overflow-hidden border-border/70 hover:border-amber-500/50 hover:shadow-xl hover:shadow-amber-500/10 transition-all flex flex-col bg-card"
              >
                {/* Book Cover Image */}
                <div className="relative aspect-16/10 overflow-hidden bg-slate-950">
                  <img
                    src={book.cover_url}
                    alt={title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Top Badges */}
                  <div className="absolute top-3 inset-x-3 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {book.is_bestseller && (
                        <Badge className="bg-amber-500 text-slate-950 font-black text-[10px]">
                          {isRtl ? "الأكثر مبيعاً" : "Bestseller"}
                        </Badge>
                      )}
                      {book.is_new && (
                        <Badge className="bg-emerald-500 text-white font-bold text-[10px]">
                          {isRtl ? "جديد" : "New"}
                        </Badge>
                      )}
                    </div>

                    <button
                      onClick={() => handleToggleWishlist(book.id)}
                      className={`p-2 rounded-xl backdrop-blur-md transition-all ${
                        isWishlisted
                          ? "bg-rose-500 text-white"
                          : "bg-black/40 text-white/80 hover:text-white hover:bg-black/60"
                      }`}
                      title={isRtl ? "المفضلة" : "Wishlist"}
                    >
                      <Heart className={`w-4 h-4 ${isWishlisted ? "fill-current" : ""}`} />
                    </button>
                  </div>

                  {/* Bottom Cover Info */}
                  <div className="absolute bottom-3 inset-x-3">
                    <p className="text-white text-xs font-bold opacity-90 truncate">{publisher}</p>
                    <p className="text-[10px] text-amber-300 font-mono">ISBN: {book.isbn}</p>
                  </div>
                </div>

                {/* Book Details */}
                <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <Badge variant="outline" className="text-[10px] font-bold mb-1.5 border-amber-500/30 text-amber-700 dark:text-amber-300">
                      {isRtl ? book.category_ar : book.category_en}
                    </Badge>
                    <h3 className="text-base font-black text-foreground line-clamp-2">
                      {title}
                    </h3>
                    <p className="text-xs text-muted-foreground font-semibold mt-1">
                      {author}
                    </p>

                    <div className="flex items-center gap-2 mt-2.5 text-xs text-muted-foreground">
                      <div className="flex items-center text-amber-500">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span className="font-bold ms-1 text-foreground">{book.rating}</span>
                      </div>
                      <span>•</span>
                      <span>({book.reviews_count} {isRtl ? "تقييم" : "reviews"})</span>
                      <span>•</span>
                      <span>{book.pages} {isRtl ? "صفحة" : "pages"}</span>
                    </div>
                  </div>

                  {/* Pricing Matrix */}
                  <div className="pt-3 border-t border-border/40 space-y-2">
                    <div className="grid grid-cols-2 gap-2 bg-muted/40 p-2.5 rounded-xl text-xs">
                      {/* Digital Price */}
                      <div className="text-center p-1.5 rounded-lg border border-amber-500/20 bg-amber-500/5">
                        <p className="text-[10px] text-muted-foreground font-semibold">
                          {isRtl ? "📱 نسخة رقمية DRM" : "📱 Digital E-Book"}
                        </p>
                        <p className="text-sm font-black text-amber-600 dark:text-amber-400">
                          {book.price_digital} EGP
                        </p>
                      </div>

                      {/* Print Price */}
                      <div className="text-center p-1.5 rounded-lg border border-blue-500/20 bg-blue-500/5">
                        <p className="text-[10px] text-muted-foreground font-semibold">
                          {isRtl ? "📦 نسخة ورقية فاخرة" : "📦 Deluxe Print"}
                        </p>
                        <p className="text-sm font-black text-foreground">
                          {book.price_print} EGP
                        </p>
                      </div>
                    </div>

                    {/* Action Purchase Buttons */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <Button
                        size="sm"
                        onClick={() => handleOpenBuyDialog(book, "digital")}
                        className="font-bold text-xs h-9 bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-xs gap-1"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>{isRtl ? "شراء رقمي" : "Buy Digital"}</span>
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenBuyDialog(book, "print")}
                        className="font-bold text-xs h-9 border-border/80 hover:bg-muted rounded-xl gap-1"
                      >
                        <Truck className="w-3.5 h-3.5 text-blue-500" />
                        <span>{isRtl ? "طلب ورقي" : "Order Print"}</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>

      {/* Buy Format Confirmation Dialog */}
      <Dialog open={!!selectedBookForBuy} onOpenChange={(open) => !open && setSelectedBookForBuy(null)}>
        <DialogContent className="sm:max-w-md" dir={dir}>
          {selectedBookForBuy && (
            <>
              <DialogHeader>
                <DialogTitle className="text-lg font-black">
                  {isRtl ? "تحديد صيغة واقتناء الكتاب" : "Select Format & Purchase"}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  {isRtl ? selectedBookForBuy.title_ar : selectedBookForBuy.title_en}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-3">
                  {/* Digital Choice */}
                  <button
                    type="button"
                    onClick={() => setSelectedFormat("digital")}
                    className={`p-3.5 rounded-2xl border text-start transition-all flex flex-col justify-between ${
                      selectedFormat === "digital"
                        ? "border-amber-500 bg-amber-500/10 shadow-sm"
                        : "border-border/60 hover:border-border"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Lock className="w-4 h-4 text-amber-500" />
                        {selectedFormat === "digital" && <Check className="w-4 h-4 text-amber-600" />}
                      </div>
                      <p className="text-xs font-black">{isRtl ? "نسخة رقمية DRM" : "Digital DRM E-Book"}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {isRtl ? "قراءة فورية وأوفلاين بمكتبتك" : "Instant & offline reader"}
                      </p>
                    </div>
                    <p className="text-base font-black text-amber-600 mt-3">
                      {selectedBookForBuy.price_digital} EGP
                    </p>
                  </button>

                  {/* Print Choice */}
                  <button
                    type="button"
                    onClick={() => setSelectedFormat("print")}
                    className={`p-3.5 rounded-2xl border text-start transition-all flex flex-col justify-between ${
                      selectedFormat === "print"
                        ? "border-amber-500 bg-amber-500/10 shadow-sm"
                        : "border-border/60 hover:border-border"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Truck className="w-4 h-4 text-blue-500" />
                        {selectedFormat === "print" && <Check className="w-4 h-4 text-amber-600" />}
                      </div>
                      <p className="text-xs font-black">{isRtl ? "نسخة ورقية مطبوعة" : "Physical Deluxe Print"}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {isRtl ? "طباعة فاخرة وشحن إكسبريس" : "Express door shipping"}
                      </p>
                    </div>
                    <p className="text-base font-black text-foreground mt-3">
                      {selectedBookForBuy.price_print} EGP
                    </p>
                  </button>
                </div>

                <div className="p-3 bg-muted/40 rounded-xl text-xs space-y-1 text-muted-foreground">
                  <p>• {isRtl ? "الناشر المعتمد: " : "Accredited Publisher: "}<span className="font-bold text-foreground">{selectedBookForBuy.publisher_ar}</span></p>
                  <p>• {isRtl ? "نسبة الناشر: 80% • عمولة المنصة: 20%" : "Publisher Share: 80% • Platform Fee: 20%"}</p>
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedBookForBuy(null)}>
                  {isRtl ? "إلغاء" : "Cancel"}
                </Button>
                <Button
                  size="sm"
                  onClick={handleProceedToCartOrCheckout}
                  className="font-bold bg-amber-600 hover:bg-amber-700 text-white"
                >
                  <ShoppingCart className="w-4 h-4 me-1.5" />
                  <span>{isRtl ? "المتابعة لإتمام الدفع" : "Proceed to Checkout"}</span>
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <SiteFooter />
    </div>
  );
};

export default BookStore;
