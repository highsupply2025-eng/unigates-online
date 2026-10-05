import { useState, useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import SiteFooter from "@/components/SiteFooter";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  BookOpen, Search, ShoppingCart, Star, Filter, Sparkles, Truck,
  Lock, ShieldCheck, CheckCircle2, ArrowLeft, ArrowRight, Building2,
  PackageCheck, Bookmark, Store, Menu, X, GraduationCap, Cpu,
  Trophy, BookCheck, Palette, ShoppingBag, Zap, Flame, PenTool,
  Home, Heart, Eye, Check, Clock, HelpCircle, Layers, ChevronRight,
  SlidersHorizontal, Library, User, LogOut, Award, TrendingUp, Tag,
  LogIn, UserPlus, Compass
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import LanguageSelectorDropdown from "@/components/LanguageSelectorDropdown";
import ThemeToggle from "@/components/ThemeToggle";
import { useToast } from "@/hooks/use-toast";
import { BookStoreDataStore } from "@/services/bookStoreDataStore";
import { BookStoreItem } from "@/types/bookStore";
import PlatformUnderDevelopmentOverlay from "@/components/PlatformUnderDevelopmentOverlay";

const BookStorePlatform = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { t, dir, language } = useLanguage();
  const isRtl = dir === "rtl";
  const { toast } = useToast();
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  // Real store catalog from BookStoreDataStore
  const catalog = useMemo(() => BookStoreDataStore.getCatalog(), []);
  const bestsellers = useMemo(() => {
    const list = catalog.filter((b) => b.is_bestseller);
    return list.length > 0 ? list.slice(0, 4) : catalog.slice(0, 4);
  }, [catalog]);
  const [selectedCategoryTab, setSelectedCategoryTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchCategory, setSearchCategory] = useState("all");

  // Buy / Add to cart modal state
  const [quickBuyBook, setQuickBuyBook] = useState<BookStoreItem | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<"digital" | "print">("digital");

  // Cart count from BookStoreDataStore
  const [cartCount, setCartCount] = useState<number>(() => {
    try {
      const items = BookStoreDataStore.getCart();
      return items.reduce((acc, item) => acc + (item.quantity || 1), 0);
    } catch {
      return 0;
    }
  });

  const refreshCartCount = () => {
    try {
      const items = BookStoreDataStore.getCart();
      setCartCount(items.reduce((acc, item) => acc + (item.quantity || 1), 0));
    } catch {
      setCartCount(0);
    }
  };

  useEffect(() => {
    refreshCartCount();
    window.addEventListener("storage", refreshCartCount);
    return () => window.removeEventListener("storage", refreshCartCount);
  }, []);

  // Current authenticated user session (Reader or Publisher)
  const [currentSession, setCurrentSession] = useState<{ role: "reader" | "publisher"; name: string; email: string } | null>(
    () => BookStoreDataStore.getCurrentSession()
  );

  const handleLogout = () => {
    BookStoreDataStore.logout();
    setCurrentSession(null);
    toast({
      title: isRtl ? "تم تسجيل الخروج بنجاح" : "Logged out successfully",
    });
  };

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    const cat = searchCategory !== "all" ? `&category=${encodeURIComponent(searchCategory)}` : "";
    navigate(`/book-store/browse?search=${encodeURIComponent(query)}${cat}`);
  };

  const handleAddToCart = (book: BookStoreItem, format: "digital" | "print" = "digital") => {
    if (!currentSession) {
      toast({
        title: isRtl ? "يرجى تسجيل الدخول أولاً" : "Please Login First",
        description: isRtl
          ? "يجب تسجيل الدخول كقارئ للتمكن من إضافة الكتب لسلة الشراء والوصول لحسابك."
          : "Please log in to your reader account to add books to cart.",
      });
      navigate("/book-store/login");
      return;
    }
    BookStoreDataStore.addToCart(book, format, 1);
    refreshCartCount();
    toast({
      title: isRtl ? "تمت الإضافة إلى سلة الشراء 🛒" : "Added to Cart 🛒",
      description: isRtl
        ? `أضيف كتاب «${book.title_ar}» (${format === "digital" ? "نسخة رقمية" : "نسخة مطبوعة"}) بنجاح.`
        : `Book added in ${format} format.`,
    });
    setQuickBuyBook(null);
  };

  // Categories list for store
  const storeCategories = [
    {
      id: "academic",
      titleAr: "المراجع الأكاديمية والجامعية",
      titleEn: "Academic References",
      descAr: "مؤلفات الطب، الهندسة، القانون، والعلوم الإدارية والتربوية.",
      descEn: "Medical, Engineering, Law, and Management textbooks.",
      icon: GraduationCap,
      color: "from-blue-600 to-indigo-600",
      badge: isRtl ? "مراجع معتمدة" : "Accredited",
    },
    {
      id: "programming",
      titleAr: "البرمجة والذكاء الاصطناعي",
      titleEn: "Coding & Artificial Intelligence",
      descAr: "هندسة النظم السحابية، التعلم العميق، والأمن السيبراني.",
      descEn: "Cloud Systems, Deep Learning & Cybersecurity.",
      icon: Cpu,
      color: "from-indigo-600 to-cyan-600",
      badge: isRtl ? "أحدث التقنيات" : "Cutting Edge",
    },
    {
      id: "business",
      titleAr: "إدارة الأعمال والقيادة (PMP)",
      titleEn: "Business & Management",
      descAr: "إدارة المشاريع الاحترافية، ريادة الأعمال، والتحول المؤسسي.",
      descEn: "PMP Project Management & Business Leadership.",
      icon: Trophy,
      color: "from-blue-700 to-indigo-800",
      badge: isRtl ? "الأكثر طلباً" : "Top Ranked",
    },
    {
      id: "humanities",
      titleAr: "العلوم الإنسانية وتطوير الذات",
      titleEn: "Humanities & Self Development",
      descAr: "التفكير الإبداعي، علم النفس المعرفي، والمهارات الشخصية.",
      descEn: "Creative Thinking, Cognitive Psychology & Soft Skills.",
      icon: Bookmark,
      color: "from-cyan-600 to-blue-600",
      badge: isRtl ? "تطوير المهارات" : "Life Skills",
    },
    {
      id: "school",
      titleAr: "المناهج والكتب المدرسية",
      titleEn: "K-12 Curricula & Guides",
      descAr: "مذكرات وبنوك أسئلة وشروح للمراحل الابتدائية والإعدادية والثانوية.",
      descEn: "Comprehensive study guides and exercise workbooks.",
      icon: BookCheck,
      color: "from-teal-600 to-emerald-600",
      badge: isRtl ? "شامل الاختبارات" : "Exams Ready",
    },
    {
      id: "literature",
      titleAr: "الروايات والأدب العالمي",
      titleEn: "Novels & World Literature",
      descAr: "روائع السرد العربي، الروايات المترجمة، والدراسات النقدية الفاخرة.",
      descEn: "Classic and contemporary world literature masterpieces.",
      icon: Palette,
      color: "from-blue-500 to-indigo-600",
      badge: isRtl ? "طبعات فاخرة" : "Deluxe Editions",
    },
  ];

  // Filter catalog items
  const filteredCatalog = useMemo(() => {
    if (selectedCategoryTab === "all") return catalog;
    return catalog.filter((b) => b.category === selectedCategoryTab);
  }, [catalog, selectedCategoryTab]);

  // Frequently Asked Questions strictly for store shoppers
  const storeFaqs = [
    {
      qAr: "كيف يمكنني شراء كتاب ورقي وتوصيله إلى عنواني؟",
      qEn: "How can I purchase a print book and get home delivery?",
      aAr: "اختر أي كتاب في المتجر، وحدد خيار «نسخة ورقية»، ثم أضفه للسلة وأتمم الدفع مع إدخال عنوانك بالتفصيل. يتم شحن وتغليف الكتب في كراتين مقواة فاخرة عبر شركائنا اللوجستيين المعتمدين لجميع محافظات مصر والدول العربية في غضون 48 إلى 72 ساعة.",
      aEn: "Select any book, choose 'Print Copy', add to cart, and checkout with your shipping address. Books are safely packaged and shipped across Egypt and internationally within 48-72 hours.",
    },
    {
      qAr: "كيف أقرأ الكتب الرقمية (E-Book) بعد شرائها؟",
      qEn: "How do I access and read purchased digital e-books?",
      aAr: "بمجرد إتمام الدفع، يتاح الكتاب فوراً في حسابك بتبويب «مكتبتي الرقمية». يمكنك القراءة الفورية عبر قارئ الكتب السحابي المتطور على الهاتف، التابلت، أو الكمبيوتر بدون الحاجة لتحميل أي برامج خارجية، مع تشفير DRM متقدم لحماية المحتوى.",
      aEn: "Upon checkout, e-books unlock instantly under 'My Library'. You can read seamlessly via our cloud reader on mobile, tablet, or desktop with no additional software required.",
    },
    {
      qAr: "ما هي وسائل الدفع المعتمدة في متجر دار عبيد؟",
      qEn: "What payment methods are supported in the Book Store?",
      aAr: "نوفر وسائل دفع إلكترونية آمنة ومشفرة 100%: البطاقات الائتمانية والبنكية (Visa, MasterCard, Meeza)، شبكة التحويل اللحظي إنستاباي (InstaPay)، المحافظ الإلكترونية للهواتف (فودافون كاش، اتصالات، أورنج، وي باي)، بالإضافة لخيار الدفع عند الاستلام للطلبات الورقية.",
      aEn: "We support Visa, MasterCard, Meeza, InstaPay, mobile cash wallets, and cash on delivery for eligible print orders.",
    },
    {
      qAr: "هل يمكن للمؤسسات والجامعات والمدارس شراء كميات مجمعة؟",
      qEn: "Can educational institutions place bulk orders?",
      aAr: "نعم، تتيح دار عبيد للمكتبات الجامعية والمدارس ومراكز التدريب طلب كميات مجمعة بأسعار وخصومات خاصة، مع توفير فواتير ضريبية رسمية وتوصيل للمقرات الأكاديمية مباشرة.",
      aEn: "Yes, institutions can order bulk quantities with tailored educational discounts and official tax invoices.",
    },
  ];

  return (
    <PlatformUnderDevelopmentOverlay platform="bookstore">
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white" dir={dir}>
        
        {/* ========================================================================= */}
        {/* 1. E-COMMERCE TOP HEADER BAR (CLEAN, WORLD-CLASS BOOKSTORE LOOK)           */}
        {/* ========================================================================= */}
        <header className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur-xl border-b border-slate-800/80 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 h-18 flex items-center justify-between gap-4">
            
            {/* Right Side (Start in RTL): Brand Logo & Primary Navigation */}
            <div className="flex items-center gap-4 sm:gap-6 lg:gap-8">
              {/* Store Brand Logo */}
              <Link to="/book-store" className="flex items-center gap-3 group">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-500 p-0.5 shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform flex items-center justify-center text-white shrink-0">
                  <BookOpen className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl sm:text-2xl font-black text-white tracking-tight">UNIGATES</span>
                    <Badge className="bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-bold px-2 py-0.5">
                      {isRtl ? "متجر الكتب" : "Bookstore"}
                    </Badge>
                  </div>
                  <p className="text-[11px] font-bold text-slate-400 tracking-wide">
                    {isRtl ? "دار عبيد للنشر والتوزيع والطباعة" : "Dar Obeid Publishing & Distribution"}
                  </p>
                </div>
              </Link>

              {/* Desktop Navigation Links anchored next to brand */}
              <nav className="hidden md:flex items-center gap-1.5 text-sm font-bold text-slate-300">
                <Link to="/">
                  <Button variant="ghost" size="sm" className="hover:bg-slate-800/80 text-slate-300 hover:text-white gap-1.5 h-10 px-3 rounded-xl font-bold">
                    <Home className="w-4 h-4 text-blue-400" />
                    <span>{isRtl ? "الرئيسية" : "Home"}</span>
                  </Button>
                </Link>
                <Link to="/book-store/browse">
                  <Button variant="ghost" size="sm" className="hover:bg-slate-800/80 text-slate-300 hover:text-white gap-1.5 h-10 px-3 rounded-xl font-bold">
                    <Compass className="w-4 h-4 text-cyan-400" />
                    <span>{isRtl ? "تصفح الكتالوج" : "Catalog"}</span>
                  </Button>
                </Link>
              </nav>
            </div>

            {/* Left Side (End in RTL): Actions, Auth, Utils */}
            <div className="flex items-center gap-2 sm:gap-2.5">
              
              {/* CROSS-LINK: طلب نشر -> opens /nashr */}
              <Link to="/nashr" title={isRtl ? "هل تريد نشر كتابك؟ انتقل إلى منصة نشر الرسمية" : "Publish with us on Nashr Platform"}>
                <Button
                  size="sm"
                  className="font-black text-xs sm:text-sm h-10 px-3 sm:px-4 rounded-xl bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white shadow-md shadow-amber-500/20 gap-1.5 hover:scale-105 transition-all"
                >
                  <PenTool className="w-3.5 h-3.5" />
                  <span>{isRtl ? "طلب نشر كتاب" : "Publish a Book"}</span>
                  <span className="hidden sm:inline-block px-1.5 py-0.5 rounded-md bg-white/20 text-[10px]">
                    {isRtl ? "منصة نشر" : "Nashr"}
                  </span>
                </Button>
              </Link>

              {/* Shopping Cart Button - ONLY visible inside user accounts / when logged in */}
              {currentSession && (
                <Link to="/book-store/cart">
                  <Button
                    variant="outline"
                    size="sm"
                    className="relative h-10 px-3.5 rounded-xl border-slate-700 bg-slate-900/90 text-white hover:bg-slate-800 gap-2 shadow-xs"
                  >
                    <ShoppingCart className="w-4 h-4 text-cyan-400" />
                    <span className="hidden sm:inline text-xs font-bold">{isRtl ? "السلة" : "Cart"}</span>
                    {cartCount > 0 && (
                      <span className="w-5 h-5 rounded-full bg-cyan-500 text-slate-950 font-black text-xs flex items-center justify-center animate-pulse">
                        {cartCount}
                      </span>
                    )}
                  </Button>
                </Link>
              )}

              {/* Sign In / Sign Up / Account Link */}
              {currentSession ? (
                <div className="flex items-center gap-1.5">
                  <Link to={currentSession.role === "reader" ? "/book-store/reader-dashboard" : "/book-store/publisher-dashboard"}>
                    <Button
                      size="sm"
                      variant="outline"
                      className="hidden sm:flex h-10 px-3.5 rounded-xl border-slate-700 bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold gap-1.5"
                    >
                      <User className="w-4 h-4 text-emerald-400" />
                      <span>{currentSession.name || (currentSession.role === "reader" ? (isRtl ? "حسابي" : "My Account") : (isRtl ? "الناشر" : "Publisher"))}</span>
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleLogout}
                    className="text-xs font-bold text-slate-400 hover:text-rose-400 h-10 px-2.5 gap-1 rounded-xl"
                    title={isRtl ? "تسجيل الخروج" : "Logout"}
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-1.5 sm:gap-2">
                  <Link to="/book-store/login">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-10 px-3 sm:px-3.5 rounded-xl border-slate-700 bg-slate-900/90 text-white hover:bg-slate-800 text-xs font-bold gap-1.5 shadow-xs"
                    >
                      <LogIn className="w-4 h-4 text-blue-400" />
                      <span>{isRtl ? "تسجيل الدخول" : "Sign In"}</span>
                    </Button>
                  </Link>

                  <Link to="/book-store/signup">
                    <Button
                      size="sm"
                      className="h-10 px-3.5 sm:px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black gap-1.5 shadow-md shadow-blue-500/25 hover:scale-105 transition-all"
                    >
                      <UserPlus className="w-4 h-4 text-cyan-200" />
                      <span>{isRtl ? "إنشاء حساب" : "Sign Up"}</span>
                    </Button>
                  </Link>
                </div>
              )}

              {/* Utility Dropdowns */}
              <div className="flex items-center gap-1">
                <LanguageSelectorDropdown className="h-10 px-2.5 rounded-xl border-slate-800 bg-slate-900 text-white" />
                <ThemeToggle className="h-10 w-10 p-0 rounded-xl border-slate-800 bg-slate-900 text-white" />
              </div>

              {/* Mobile Menu Trigger */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden text-white hover:bg-slate-800 p-2 h-10 w-10 rounded-xl"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </Button>
            </div>
          </div>

          {/* Mobile Drawer Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden bg-slate-950/98 border-b border-slate-800 px-6 py-5 space-y-3 animate-fade-in text-white">
              <Link to="/" onClick={() => setMobileMenuOpen(false)} className="block">
                <Button variant="outline" className="w-full justify-start border-slate-800 bg-slate-900 text-white h-11 gap-2 font-bold rounded-xl">
                  <Home className="w-4 h-4 text-blue-400" />
                  <span>{isRtl ? "العودة للرئيسية" : "Home"}</span>
                </Button>
              </Link>
              <Link to="/book-store/browse" onClick={() => setMobileMenuOpen(false)} className="block">
                <Button variant="outline" className="w-full justify-start border-slate-800 bg-slate-900 text-white h-11 gap-2 font-bold rounded-xl">
                  <Compass className="w-4 h-4 text-cyan-400" />
                  <span>{isRtl ? "استكشف كتالوج الكتب" : "Browse Catalog"}</span>
                </Button>
              </Link>
              <Link to="/nashr" onClick={() => setMobileMenuOpen(false)} className="block">
                <Button className="w-full justify-start bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600 text-white h-11 gap-2 font-black rounded-xl shadow-md">
                  <PenTool className="w-4 h-4" />
                  <span>{isRtl ? "طلب نشر كتاب (منصة نشر)" : "Publish Book on Nashr"}</span>
                </Button>
              </Link>
              {currentSession ? (
                <>
                  <Link to="/book-store/cart" onClick={() => setMobileMenuOpen(false)} className="block">
                    <Button className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-white h-11 gap-2 font-bold rounded-xl">
                      <ShoppingCart className="w-4 h-4" />
                      <span>{isRtl ? `سلة المشتريات (${cartCount})` : `Cart (${cartCount})`}</span>
                    </Button>
                  </Link>
                  <Link to={currentSession.role === "reader" ? "/book-store/reader-dashboard" : "/book-store/publisher-dashboard"} onClick={() => setMobileMenuOpen(false)} className="block">
                    <Button variant="outline" className="w-full justify-start border-slate-800 bg-slate-900 text-white h-11 gap-2 font-bold rounded-xl">
                      <User className="w-4 h-4 text-emerald-400" />
                      <span>{isRtl ? "لوحة حسابي" : "My Account"}</span>
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full justify-start text-rose-400 hover:bg-rose-500/10 h-11 font-bold gap-2 rounded-xl"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{isRtl ? "تسجيل الخروج" : "Logout"}</span>
                  </Button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Link to="/book-store/login" onClick={() => setMobileMenuOpen(false)} className="block">
                    <Button variant="outline" className="w-full border-slate-800 bg-slate-900 text-white hover:bg-slate-800 h-11 font-bold rounded-xl gap-1.5">
                      <LogIn className="w-4 h-4 text-blue-400" />
                      <span>{isRtl ? "تسجيل الدخول" : "Sign In"}</span>
                    </Button>
                  </Link>
                  <Link to="/book-store/signup" onClick={() => setMobileMenuOpen(false)} className="block">
                    <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white h-11 font-black rounded-xl gap-1.5 shadow-md">
                      <UserPlus className="w-4 h-4 text-cyan-200" />
                      <span>{isRtl ? "إنشاء حساب" : "Sign Up"}</span>
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </header>

        {/* ========================================================================= */}
        {/* 2. WORLD-CLASS STORE HERO (SEARCH, FILTERS & VALUE PROPOSITIONS)          */}
        {/* ========================================================================= */}
        <section className="relative overflow-hidden pt-12 sm:pt-16 pb-16 sm:pb-24 px-4 sm:px-6 md:px-12 border-b border-slate-800">
          {/* Subtle Ambient Lighting Gradients */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(59,130,246,0.22),rgba(255,255,255,0))]" />
          <div className="absolute top-1/4 start-1/6 w-80 h-80 bg-cyan-500/10 rounded-full blur-[130px]" />
          <div className="absolute bottom-10 end-1/6 w-96 h-96 bg-indigo-600/15 rounded-full blur-[150px]" />

          <div className="relative z-10 max-w-5xl mx-auto text-center space-y-6 sm:space-y-8">
            
            {/* Store Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-300 text-xs sm:text-sm font-bold shadow-sm">
              <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span>{isRtl ? "المتجر الإلكتروني المعتمد لدار عبيد للنشر والتوزيع" : "Dar Obeid Global E-Bookstore & Distribution"}</span>
            </div>

            {/* Main Headline */}
            <div className="space-y-4">
              <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-tight">
                {isRtl ? (
                  <>
                    عالم الكتب والمراجع الأكاديمية <br />
                    <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-300 bg-clip-text text-transparent">
                      بين يديك ورقياً ورقمياً
                    </span>
                  </>
                ) : (
                  <>
                    Discover Global Textbooks & Books <br />
                    <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-300 bg-clip-text text-transparent">
                      In Digital & Print Editions
                    </span>
                  </>
                )}
              </h1>

              <p className="text-sm sm:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed font-medium">
                {isRtl
                  ? "آلاف المراجع الأكاديمية والكتب العلمية والروايات المعتمدة، مع خيارات القراءة السحابية الفورية المشفرة بنظام DRM أو طلب النسخ الورقية الفاخرة مع شحن سريع وتغليف آمن لباب منزلك."
                  : "Thousands of verified academic references, textbooks, and literature with DRM instant cloud reading or express doorstep print delivery."}
              </p>
            </div>

            {/* Global Bookstore Live Search Bar */}
            <form
              onSubmit={handleHeroSearch}
              className="max-w-3xl mx-auto p-2 rounded-2xl sm:rounded-3xl bg-slate-900/90 border-2 border-slate-700/80 shadow-2xl backdrop-blur-2xl flex flex-col sm:flex-row items-center gap-2"
            >
              {/* Category selector */}
              <div className="w-full sm:w-auto shrink-0 px-2 border-b sm:border-b-0 sm:border-e border-slate-800">
                <select
                  value={searchCategory}
                  onChange={(e) => setSearchCategory(e.target.value)}
                  className="bg-transparent text-slate-300 text-xs sm:text-sm font-bold py-2 px-1 focus:outline-none cursor-pointer w-full sm:w-auto"
                >
                  <option value="all" className="bg-slate-900 text-white">{isRtl ? "🌟 كل الأقسام" : "All Genres"}</option>
                  <option value="academic" className="bg-slate-900 text-white">{isRtl ? "🎓 مراجع أكاديمية" : "Academic"}</option>
                  <option value="programming" className="bg-slate-900 text-white">{isRtl ? "💻 برمجة وذكاء اصطناعي" : "Tech & AI"}</option>
                  <option value="business" className="bg-slate-900 text-white">{isRtl ? "📈 إدارة أعمال و PMP" : "Business"}</option>
                  <option value="humanities" className="bg-slate-900 text-white">{isRtl ? "📚 علوم إنسانية وتطوير" : "Humanities"}</option>
                </select>
              </div>

              {/* Keyword input */}
              <div className="relative flex-1 w-full flex items-center">
                <Search className="w-5 h-5 absolute start-3 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isRtl ? "ابحث بعنوان الكتاب، اسم المؤلف، أو الترقيم الدولي (ISBN)..." : "Search title, author, or ISBN..."}
                  className="w-full h-12 ps-10 pe-4 bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none font-semibold"
                />
              </div>

              {/* Submit Search Button */}
              <Button
                type="submit"
                className="w-full sm:w-auto h-12 px-6 rounded-xl sm:rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-black text-sm shadow-lg gap-2"
              >
                <span>{isRtl ? "بحث في المتجر" : "Search Store"}</span>
                <ArrowIcon className="w-4 h-4" />
              </Button>
            </form>

            {/* Quick Filter Pills */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs">
              <span className="text-slate-400 font-bold me-1">{isRtl ? "الأقسام الرائجة:" : "Trending:"}</span>
              {storeCategories.slice(0, 5).map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => navigate(`/book-store/browse?category=${cat.id}`)}
                  className="px-3 py-1 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-medium transition-colors"
                >
                  {isRtl ? cat.titleAr : cat.titleEn}
                </button>
              ))}
            </div>

            {/* Trust and Value Proposition Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 pt-6 max-w-4xl mx-auto text-start">
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-white">{isRtl ? "قراءة سحابية فورية" : "Instant E-Reading"}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">{isRtl ? "مكتبة مشفرة بدون برامج" : "DRM protected e-books"}</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center shrink-0">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-white">{isRtl ? "شحن وتوصيل سريع" : "Express Delivery"}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">{isRtl ? "لكافة المحافظات والدول" : "Safe packaging to home"}</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-white">{isRtl ? "كتب أصلية 100%" : "100% Authentic"}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">{isRtl ? "ترقيم دولي ISBN معتمد" : "Official Dar Obeid ISBN"}</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-white">{isRtl ? "دفع آمن ومتعدد" : "Safe Payments"}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">{isRtl ? "فيزا • كاش • عند الاستلام" : "Cards • Wallets • COD"}</p>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ========================================================================= */}
        {/* 2.5. JARIR-STYLE VISUAL CATEGORIES SHOWCASE                               */}
        {/* ========================================================================= */}
        <section className="py-8 px-4 sm:px-6 md:px-12 bg-slate-900/60 border-b border-slate-800">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm sm:text-base font-black text-white">
                  {isRtl ? "تصفح حسب القسم الأكاديمي" : "Browse by Department"}
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-bold hidden sm:inline">
                {isRtl ? "اختر القسم لتصفية الكتب فوراً" : "Click to filter instant catalog"}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {storeCategories.map((cat) => {
                const IconComponent = cat.icon;
                const isSelected = selectedCategoryTab === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategoryTab(cat.id);
                      const el = document.getElementById("catalog-section");
                      if (el) el.scrollIntoView({ behavior: "smooth" });
                    }}
                    className={`p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center gap-2 group ${
                      isSelected
                        ? "bg-blue-600/20 border-blue-500 shadow-md shadow-blue-500/10"
                        : "bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-800/80"
                    }`}
                  >
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${cat.color} p-2 text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div className="text-center w-full">
                      <p className="text-xs font-black text-white line-clamp-1">
                        {isRtl ? cat.titleAr : cat.titleEn}
                      </p>
                      <span className="text-[10px] text-cyan-400 font-bold block mt-0.5">
                        {cat.badge}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 2.6. JARIR-STYLE TOP BESTSELLERS SHOWCASE (الأكثر طلباً ورواجاً)            */}
        {/* ========================================================================= */}
        {bestsellers.length > 0 && (
          <section className="py-10 sm:py-14 px-4 sm:px-6 md:px-12 bg-slate-950 border-b border-slate-800/80">
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-2 text-amber-400 text-xs font-black">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span>{isRtl ? "إصدارات دار عبيد الأكثر رواجاً" : "Top Bestselling Books"}</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    {isRtl ? "🏆 قائمة الكتب الأكثر طلباً هذا الأسبوع" : "Top Trending Bestsellers This Week"}
                  </h2>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{isRtl ? "توصيل إكسبريس خلال 48 ساعة" : "48h Express Shipping"}</span>
                </div>
              </div>

              {/* Bestsellers Grid with Rank Medals */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {bestsellers.map((book, idx) => (
                  <Card
                    key={`bestseller-${book.id}`}
                    className="relative bg-slate-900/90 border-2 border-slate-800 hover:border-blue-500/50 rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1"
                  >
                    {/* Rank Badge (#1, #2, #3, #4) */}
                    <div className="absolute top-3 start-3 z-20">
                      <div className="w-8 h-8 rounded-full bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center shadow-lg border border-amber-300">
                        #{idx + 1}
                      </div>
                    </div>

                    {/* Book Cover */}
                    <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-950">
                      <img
                        src={book.cover_url}
                        alt={book.title_ar}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                      <div className="absolute top-3 end-3 z-10">
                        <Badge className="bg-emerald-600/90 text-white font-bold text-[10px]">
                          {isRtl ? "جاهز للشحن" : "In Stock"}
                        </Badge>
                      </div>
                      <div className="absolute bottom-2.5 start-2.5 text-[10px] text-slate-400 bg-slate-950/80 px-2 py-0.5 rounded-md font-mono border border-slate-800">
                        {book.isbn}
                      </div>
                    </div>

                    {/* Content */}
                    <CardContent className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span className="truncate max-w-[140px]">{isRtl ? book.publisher_ar : book.publisher_en}</span>
                          <span className="flex items-center gap-1 text-amber-400 font-bold">
                            <Star className="w-3.5 h-3.5 fill-amber-400" />
                            <span>{book.rating}</span>
                          </span>
                        </div>
                        <h3 className="font-black text-sm sm:text-base text-white line-clamp-2 leading-snug group-hover:text-blue-400 transition-colors">
                          {isRtl ? book.title_ar : book.title_en}
                        </h3>
                        <p className="text-xs font-semibold text-slate-400 line-clamp-1">
                          {isRtl ? book.author_ar : book.author_en}
                        </p>
                      </div>

                      {/* Pricing & Fast Buy */}
                      <div className="pt-2 border-t border-slate-800 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[11px] text-slate-400 font-semibold">{isRtl ? "سعر النسخة:" : "Price:"}</span>
                          <div className="text-end">
                            <span className="text-sm font-black text-white">
                              {book.price_digital} {isRtl ? "ج.م" : book.currency}
                            </span>
                            {book.price_print > 0 && (
                              <span className="text-[10px] text-slate-400 block">
                                {isRtl ? `ورقي: ${book.price_print} ج.م` : `Print: ${book.price_print}`}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <Button
                            size="sm"
                            onClick={() => setQuickBuyBook(book)}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-9 rounded-xl gap-1 shadow-sm"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            <span>{isRtl ? "شراء سريع" : "Quick Buy"}</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/book-store/browse?code=${book.code}`)}
                            className="w-full border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-white font-bold text-xs h-9 rounded-xl gap-1"
                          >
                            <Eye className="w-3.5 h-3.5 text-cyan-400" />
                            <span>{isRtl ? "تفاصيل" : "Details"}</span>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* 2.7. JARIR-STYLE STORE PROMO DEALS BANNER                                 */}
        {/* ========================================================================= */}
        <section className="py-6 px-4 sm:px-6 md:px-12 bg-gradient-to-r from-blue-950/60 via-indigo-950/70 to-slate-950 border-b border-slate-800">
          <div className="max-w-7xl mx-auto rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-blue-600/15 via-indigo-600/15 to-cyan-500/15 border border-blue-500/30 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="space-y-2 text-center md:text-start">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-400/30">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>{isRtl ? "خدمات متميزة للجامعات والمؤسسات والطلاب" : "Institutional & Student Priority Services"}</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white">
                {isRtl ? "شحن فوري لباب المنزل • توريد كميات مجمعة • حماية DRM متطورة" : "Fast Door Delivery • Bulk Institutional Orders • Advanced DRM"}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
                {isRtl
                  ? "توفر دار عبيد للمؤسسات والجامعات والباحثين إمكانية طلب النسخ المطبوعة الفاخرة بأسعار خاصة وفواتير ضريبية، أو ترخيص مكاتب رقمية كاملة للطلاب مع دعم فني مستمر."
                  : "Dar Obeid provides academic institutions with official tax invoices, bulk student licenses, and secure doorstep express book packaging."}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Link to="/contact">
                <Button variant="outline" className="h-11 px-5 rounded-2xl border-slate-700 bg-slate-900 text-white font-bold text-xs hover:bg-slate-800">
                  {isRtl ? "طلب توريد مؤسسي" : "Institutional Inquiry"}
                </Button>
              </Link>
              <Link to="/nashr">
                <Button className="h-11 px-5 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold text-xs hover:from-blue-700 hover:to-cyan-700 shadow-md">
                  {isRtl ? "نشر مؤلف جديد" : "Publish With Us"}
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 3. INTERACTIVE BOOK CATALOG SHOWCASE (REAL BOOKS FROM DATASTORE)          */}
        {/* ========================================================================= */}
        <section id="catalog-section" className="py-14 sm:py-20 px-4 sm:px-6 md:px-12 bg-slate-950">
          <div className="max-w-7xl mx-auto space-y-10">
            
            {/* Header with Title and Filter Tabs */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
              <div>
                <div className="inline-flex items-center gap-2 text-cyan-400 text-xs font-bold mb-1">
                  <Flame className="w-4 h-4 text-cyan-400" />
                  <span>{isRtl ? "الكتالوج الرسمي المتاح للشراء الفوري" : "Official Catalog Ready to Order"}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {isRtl ? "📚 أحدث الإصدارات والمراجع الأكاديمية" : "Latest Releases & Textbooks"}
                </h2>
              </div>

              {/* Genre Filter Tabs */}
              <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-900 rounded-2xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedCategoryTab("all")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedCategoryTab === "all" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"
                  }`}
                >
                  {isRtl ? "جميع الكتب" : "All Books"}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCategoryTab("academic")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedCategoryTab === "academic" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"
                  }`}
                >
                  {isRtl ? "مراجع أكاديمية" : "Academic"}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCategoryTab("programming")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedCategoryTab === "programming" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"
                  }`}
                >
                  {isRtl ? "برمجة وذكاء اصطناعي" : "Tech & Coding"}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCategoryTab("business")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedCategoryTab === "business" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"
                  }`}
                >
                  {isRtl ? "إدارة أعمال و PMP" : "Business"}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCategoryTab("humanities")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedCategoryTab === "humanities" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"
                  }`}
                >
                  {isRtl ? "علوم إنسانية" : "Humanities"}
                </button>
              </div>
            </div>

            {/* Books Cards Grid (Global Bookstore Standard) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {filteredCatalog.map((book) => (
                <Card
                  key={book.id}
                  className="bg-slate-900/90 border-2 border-slate-800 hover:border-blue-500/50 rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1"
                >
                  {/* Book Cover with Badges */}
                  <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-950">
                    <img
                      src={book.cover_url}
                      alt={book.title_ar}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                    {/* Format Badge */}
                    <div className="absolute top-3 start-3">
                      <Badge className="bg-slate-950/80 backdrop-blur-md text-white border border-slate-700 text-[10px] font-bold">
                        {book.format === "both"
                          ? isRtl ? "ورقي + رقمي" : "Print & E-Book"
                          : book.format === "digital"
                          ? isRtl ? "رقمي فقط" : "E-Book Only"
                          : isRtl ? "ورقي فقط" : "Print Only"}
                      </Badge>
                    </div>

                    {/* Bestseller Pill */}
                    {book.is_bestseller && (
                      <div className="absolute top-3 end-3">
                        <Badge className="bg-amber-500/95 text-slate-950 font-black text-[10px] shadow-md">
                          {isRtl ? "الأكثر طلباً ⭐" : "Bestseller"}
                        </Badge>
                      </div>
                    )}

                    {/* ISBN Pill */}
                    <div className="absolute bottom-2.5 start-2.5 text-[10px] text-slate-400 bg-slate-950/80 px-2 py-0.5 rounded-md font-mono border border-slate-800">
                      {book.isbn}
                    </div>
                  </div>

                  {/* Book Metadata Body */}
                  <CardContent className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span className="truncate max-w-[150px]">{isRtl ? book.publisher_ar : book.publisher_en}</span>
                        <span className="flex items-center gap-1 text-amber-400 font-bold">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          <span>{book.rating}</span>
                          <span className="text-[10px] text-slate-500">({book.reviews_count})</span>
                        </span>
                      </div>

                      <h3 className="font-black text-sm sm:text-base text-white line-clamp-2 leading-snug group-hover:text-blue-400 transition-colors">
                        {isRtl ? book.title_ar : book.title_en}
                      </h3>

                      <p className="text-xs font-semibold text-slate-400 line-clamp-1">
                        {isRtl ? book.author_ar : book.author_en}
                      </p>
                    </div>

                    {/* In-Stock status & Savings */}
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                      <span className="flex items-center gap-1 text-emerald-400">
                        <Check className="w-3.5 h-3.5" />
                        <span>{isRtl ? "متوفر بالمستودع • شحن 48 س" : "In Stock • Ships 48h"}</span>
                      </span>
                      {book.price_print > book.price_digital && (
                        <span className="text-[10px] text-cyan-300 font-bold bg-cyan-950/80 border border-cyan-800/60 px-2 py-0.5 rounded-full">
                          {isRtl ? `وفر ${book.price_print - book.price_digital} ج.م` : `Save ${book.price_print - book.price_digital}`}
                        </span>
                      )}
                    </div>

                    {/* Dual Pricing Boxes */}
                    <div className="pt-2 border-t border-slate-800/80 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1 text-cyan-400 font-bold">
                          <Zap className="w-3.5 h-3.5" />
                          <span>{isRtl ? "نسخة رقمية:" : "E-Book:"}</span>
                        </div>
                        <span className="font-black text-white text-sm">
                          {book.price_digital} {isRtl ? "ج.م" : book.currency}
                        </span>
                      </div>

                      {book.price_print > 0 && (
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1 text-amber-400 font-bold">
                            <Truck className="w-3.5 h-3.5" />
                            <span>{isRtl ? "نسخة ورقية:" : "Print:"}</span>
                          </div>
                          <span className="font-black text-white text-sm">
                            {book.price_print} {isRtl ? "ج.م" : book.currency}
                          </span>
                        </div>
                      )}

                      {/* Buy & Cart Buttons */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <Button
                          size="sm"
                          onClick={() => setQuickBuyBook(book)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-9 rounded-xl gap-1 shadow-sm"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>{isRtl ? "شراء / سلة" : "Buy / Cart"}</span>
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/book-store/browse?code=${book.code}`)}
                          className="w-full border-slate-700 bg-slate-800/70 hover:bg-slate-700 text-white font-bold text-xs h-9 rounded-xl gap-1"
                        >
                          <Eye className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{isRtl ? "معاينة" : "Preview"}</span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* View Full Catalog Link */}
            <div className="text-center pt-4">
              <Link to="/book-store/browse">
                <Button size="lg" className="h-12 px-8 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white border-2 border-slate-700 font-black text-sm gap-2">
                  <span>{isRtl ? "استكشاف كامل كتالوج الكتب والمراجع (المتجر الكامل)" : "Explore Full Book Catalog"}</span>
                  <ArrowIcon className="w-4 h-4" />
                </Button>
              </Link>
            </div>

          </div>
        </section>

        {/* ========================================================================= */}
        {/* 4. FEATURED BOOK SPOTLIGHT BANNER                                         */}
        {/* ========================================================================= */}
        {catalog[0] && (
          <section className="py-12 sm:py-16 px-4 sm:px-6 md:px-12 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-y border-slate-800">
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-8 md:gap-12">
              {/* Cover 3D Mockup */}
              <div className="w-56 sm:w-64 shrink-0 aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl shadow-blue-500/20 border-2 border-blue-500/30 group">
                <img
                  src={catalog[0].cover_url}
                  alt={catalog[0].title_ar}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>

              {/* Book Details & Fast Buy */}
              <div className="flex-1 space-y-4 text-center md:text-start">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-bold border border-cyan-500/30">
                  <Star className="w-3.5 h-3.5 fill-cyan-400" />
                  <span>{isRtl ? "كتاب الشهر الأكثر تميزاً واستشهاداً أكاديمياً" : "Book of the Month Spotlight"}</span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                  {isRtl ? catalog[0].title_ar : catalog[0].title_en}
                </h3>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl font-medium">
                  {isRtl ? catalog[0].description_ar : catalog[0].description_en}
                </p>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs font-bold text-slate-300 pt-1">
                  <span>✍️ {catalog[0].author_ar}</span>
                  <span>🏛️ {catalog[0].publisher_ar}</span>
                  <span>📄 {catalog[0].pages} صفحة</span>
                  <span>🔒 حماية DRM</span>
                </div>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
                  <Button
                    size="lg"
                    onClick={() => handleAddToCart(catalog[0], "digital")}
                    className="h-11 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-black text-xs gap-2 shadow-lg"
                  >
                    <Zap className="w-4 h-4" />
                    <span>{isRtl ? `شراء النسخة الرقمية (${catalog[0].price_digital} ج.م)` : "Buy Digital Edition"}</span>
                  </Button>

                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => handleAddToCart(catalog[0], "print")}
                    className="h-11 px-6 rounded-xl border-slate-700 bg-slate-900/90 text-white hover:bg-slate-800 font-black text-xs gap-2"
                  >
                    <Truck className="w-4 h-4 text-amber-400" />
                    <span>{isRtl ? `طلب النسخة المطبوعة (${catalog[0].price_print} ج.م)` : "Order Print Copy"}</span>
                  </Button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* 5. HOW SHOPPING & READING WORKS FOR BUYERS (3 SIMPLE STEPS)               */}
        {/* ========================================================================= */}
        <section className="py-14 sm:py-20 px-4 sm:px-6 md:px-12 bg-slate-900/40 border-b border-slate-800">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="text-center space-y-2">
              <Badge className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs px-3 py-1">
                {isRtl ? "تجربة القراءة والشراء" : "Shopping Experience"}
              </Badge>
              <h2 className="text-2xl sm:text-4xl font-black text-white">
                {isRtl ? "كيف تطلب وتقرأ كتبك في 3 خطوات بسيطة؟" : "How to Buy & Read in 3 Steps"}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-3 shadow-md">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 font-black text-lg mx-auto flex items-center justify-center">
                  1
                </div>
                <h4 className="text-base font-black text-white">{isRtl ? "تصفح واختر كتابك" : "Browse & Choose"}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {isRtl
                    ? "ابحث في الكتالوج الشامل، واقرأ العينات وفهارس الفصول المجانية لاختيار الكتاب المناسب."
                    : "Search thousands of books and preview free chapter samples."}
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-3 shadow-md">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 font-black text-lg mx-auto flex items-center justify-center">
                  2
                </div>
                <h4 className="text-base font-black text-white">{isRtl ? "حدد الصيغة المفضلة" : "Select Format"}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {isRtl
                    ? "اختر النسخة الرقمية للقراءة الفورية بأسعار مخفضة، أو النسخة الورقية المطبوعة للشحن الفاخر."
                    : "Choose instant DRM e-book or high-grade printed physical edition."}
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-3 shadow-md">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 font-black text-lg mx-auto flex items-center justify-center">
                  3
                </div>
                <h4 className="text-base font-black text-white">{isRtl ? "دفع آمن واستلام مباشر" : "Secure Pay & Receive"}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {isRtl
                    ? "ادفع بأمان عبر البطاقات أو إنستاباي أو المحافظ، واستمتع بالقراءة فوراً أو استلم طلبك في 48 ساعة."
                    : "Instant cloud reading unlocked immediately, or tracked doorstep courier delivery."}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 7. STRICTLY SEPARATED INDEPENDENT PUBLISHING BRIDGE BANNER               */}
        {/* ========================================================================= */}
        <section className="py-14 sm:py-18 px-4 sm:px-6 md:px-12 bg-slate-950 border-b border-slate-800">
          <div className="max-w-5xl mx-auto rounded-3xl bg-gradient-to-br from-amber-950/60 via-slate-900 to-orange-950/60 border-2 border-amber-500/30 p-8 sm:p-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 end-0 w-80 h-80 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />
            
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-start">
              <div className="space-y-3 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-black">
                  <PenTool className="w-3.5 h-3.5" />
                  <span>{isRtl ? "بوابة المؤلفين والباحثين المستقلة (منصة نشر)" : "Authors & Scholars Portal (Nashr)"}</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                  {isRtl ? "هل أنت كاتب أو باحث أو أستاذ جامعي؟" : "Are you an Author or Academic Researcher?"}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                  {isRtl
                    ? "انشر كتابك القادم ورقياً ورقمياً مع دار عبيد عبر منصة نشر المستقلة، واستفد من الترقيم الدولي المعتمد (ISBN)، التحكيم الأكاديمي، الطباعة الفاخرة، والتوزيع في المعارض الدولية مع عوائد أرباح فورية تصل إلى 70%."
                    : "Publish your manuscript with Dar Obeid via our dedicated Nashr Platform with official ISBN, peer-review, and fair royalties."}
                </p>
              </div>

              {/* The Single Connection: Navigates directly to /nashr */}
              <div className="shrink-0">
                <Link to="/nashr">
                  <Button
                    size="lg"
                    className="h-13 px-7 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white font-black text-sm shadow-xl shadow-amber-500/25 gap-2 hover:scale-105 transition-all"
                  >
                    <span>{isRtl ? "الانتقال إلى منصة نشر لطلب نشر كتاب" : "Open Nashr Publishing Platform"}</span>
                    <ArrowIcon className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 8. READER & SHOPPING FAQS                                                 */}
        {/* ========================================================================= */}
        <section className="py-14 sm:py-20 px-4 sm:px-6 md:px-12 bg-slate-950 border-b border-slate-800">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-2">
              <Badge className="bg-slate-900 text-slate-300 border border-slate-800 text-xs px-3 py-1">
                <HelpCircle className="w-3.5 h-3.5 me-1 text-cyan-400 inline" />
                {isRtl ? "مركز المساعدة واستفسارات الشراء" : "Shopping & Help Center"}
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                {isRtl ? "الأسئلة الشائعة حول متجر الكتب والتوصيل" : "Frequently Asked Questions"}
              </h2>
            </div>

            <Accordion type="single" collapsible className="space-y-3">
              {storeFaqs.map((faq, idx) => (
                <AccordionItem key={idx} value={`faq-${idx}`} className="bg-slate-900 border border-slate-800 rounded-2xl px-5 shadow-xs">
                  <AccordionTrigger className="font-black text-sm sm:text-base text-white hover:no-underline py-4 text-start">
                    {isRtl ? faq.qAr : faq.qEn}
                  </AccordionTrigger>
                  <AccordionContent className="text-xs sm:text-sm text-slate-400 leading-relaxed pt-1 pb-4 text-start">
                    {isRtl ? faq.aAr : faq.aEn}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 9. FAST PURCHASE / ADD TO CART MODAL                                      */}
        {/* ========================================================================= */}
        {quickBuyBook && (
          <Dialog open={!!quickBuyBook} onOpenChange={(open) => !open && setQuickBuyBook(null)}>
            <DialogContent className="max-w-md bg-slate-900 border-2 border-slate-700 text-white rounded-3xl p-6">
              <DialogHeader>
                <DialogTitle className="text-lg font-black text-white">
                  {isRtl ? "إضافة الكتاب لسلة الشراء" : "Add Book to Cart"}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-400">
                  {isRtl ? quickBuyBook.title_ar : quickBuyBook.title_en}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="text-xs font-bold text-slate-300">{isRtl ? "اختر صيغة الكتاب المطلوبة:" : "Select format:"}</div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedFormat("digital")}
                    className={`p-3.5 rounded-2xl border-2 text-start transition-all ${
                      selectedFormat === "digital"
                        ? "border-cyan-400 bg-cyan-500/15 text-white"
                        : "border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-black text-sm mb-1 text-cyan-300">
                      <Zap className="w-4 h-4" />
                      <span>{isRtl ? "نسخة رقمية" : "Digital E-Book"}</span>
                    </div>
                    <div className="text-xs font-bold text-white">
                      {quickBuyBook.price_digital} {isRtl ? "ج.م" : quickBuyBook.currency}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">{isRtl ? "قراءة سحابية فورية" : "Instant Cloud Read"}</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedFormat("print")}
                    className={`p-3.5 rounded-2xl border-2 text-start transition-all ${
                      selectedFormat === "print"
                        ? "border-amber-400 bg-amber-500/15 text-white"
                        : "border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-black text-sm mb-1 text-amber-300">
                      <Truck className="w-4 h-4" />
                      <span>{isRtl ? "نسخة ورقية" : "Printed Book"}</span>
                    </div>
                    <div className="text-xs font-bold text-white">
                      {quickBuyBook.price_print} {isRtl ? "ج.م" : quickBuyBook.currency}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">{isRtl ? "شحن وتوصيل منزلي" : "Doorstep Delivery"}</div>
                  </button>
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0 pt-2">
                <Button
                  onClick={() => handleAddToCart(quickBuyBook, selectedFormat)}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-black text-sm h-11 rounded-xl shadow-lg"
                >
                  <ShoppingCart className="w-4 h-4 me-1.5" />
                  <span>{isRtl ? "تأكيد الإضافة للسلة" : "Confirm Add to Cart"}</span>
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Global Footer */}
        <SiteFooter />
      </div>
    </PlatformUnderDevelopmentOverlay>
  );
};

export default BookStorePlatform;
