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
  LogIn, UserPlus
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

  // User 2-Row Layout Navigation State:
  // Main Tab: "bestsellers" | "offers" | "categories" | "new_arrivals"
  const [activeMainTab, setActiveMainTab] = useState<"bestsellers" | "offers" | "categories" | "new_arrivals">("categories");
  // Sub-Category filter for the active tab (or 'all')
  const [activeSubCategory, setActiveSubCategory] = useState<string>("all");
  // Dedicated Row 1 Live Instant Search
  const [liveSearchQuery, setLiveSearchQuery] = useState<string>("");
  const [liveSearchCategory, setLiveSearchCategory] = useState<string>("all");

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

  // Dynamic books for the 2-row layout (الأكثر طلبا، العروض، الأقسام، جديدنا) + البحث المباشر
  const displayedBooks = useMemo(() => {
    let result = [...catalog];

    // 1. Filter by activeMainTab
    if (activeMainTab === "bestsellers") {
      // الأكثر طلبا: الكتب الأكثر مبيعاً أو تقييماً عالياً
      result = result.filter((b) => b.is_bestseller || (b.rating && b.rating >= 4.7));
      if (result.length === 0) {
        result = [...catalog].sort((a, b) => (b.reviews_count || 0) - (a.reviews_count || 0));
      }
    } else if (activeMainTab === "offers") {
      // العروض: الكتب التي يتوفر فيها خصم (وفر وفرق السعر أو مضافة للعروض)
      result = result.filter(
        (b) => (b.price_print > b.price_digital) || (b.price_digital < 180) || b.is_bestseller
      );
    } else if (activeMainTab === "new_arrivals") {
      // جديدنا: الكتب المضافة حديثاً
      result = [...catalog].sort((a, b) => {
        const da = a.created_at ? new Date(a.created_at).getTime() : 0;
        const db = b.created_at ? new Date(b.created_at).getTime() : 0;
        return db - da;
      });
    } else if (activeMainTab === "categories") {
      // الأقسام: تشمل جميع الكتب
      result = [...catalog];
    }

    // 2. Filter by sub-category if selected
    if (activeSubCategory !== "all") {
      result = result.filter((b) => b.category === activeSubCategory);
    }

    // 3. Filter by Live Instant Search (Row 1)
    if (liveSearchCategory !== "all") {
      result = result.filter((b) => b.category === liveSearchCategory);
    }

    const query = liveSearchQuery.trim().toLowerCase();
    if (query) {
      result = result.filter(
        (b) =>
          b.title_ar.toLowerCase().includes(query) ||
          b.title_en.toLowerCase().includes(query) ||
          b.author_ar.toLowerCase().includes(query) ||
          b.author_en.toLowerCase().includes(query) ||
          b.isbn.toLowerCase().includes(query) ||
          (b.category && b.category.toLowerCase().includes(query))
      );
    }

    return result;
  }, [catalog, activeMainTab, activeSubCategory, liveSearchCategory, liveSearchQuery]);

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
      <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-blue-600 selection:text-white transition-colors" dir={dir}>
        
        {/* ========================================================================= */}
        {/* 1. E-COMMERCE TOP HEADER BAR (CLEAN, WORLD-CLASS BOOKSTORE LOOK)           */}
        {/* ========================================================================= */}
        <header className="sticky top-0 z-50 bg-card/90 dark:bg-slate-950/95 backdrop-blur-xl border-b border-border/80 dark:border-slate-800/80 shadow-sm transition-colors">
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
                    <span className="text-xl sm:text-2xl font-black text-foreground tracking-tight">UNIGATES</span>
                    <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-300 border border-blue-400/30 text-[10px] font-bold px-2 py-0.5">
                      {isRtl ? "متجر الكتب" : "Bookstore"}
                    </Badge>
                  </div>
                  <p className="text-[11px] font-bold text-muted-foreground tracking-wide">
                    {isRtl ? "دار عبيد للنشر والتوزيع والطباعة" : "Dar Obeid Publishing & Distribution"}
                  </p>
                </div>
              </Link>
            </div>

            {/* Left Side (End in RTL): Actions, Auth, Utils */}
            <div className="flex items-center gap-2 sm:gap-2.5">
              
              {/* 1. الرئيسية بجوار طلب نشر كتاب */}
              <Link to="/">
                <Button variant="ghost" size="sm" className="hover:bg-muted text-muted-foreground hover:text-foreground gap-1.5 h-10 px-3 rounded-xl font-bold">
                  <Home className="w-4 h-4 text-blue-500" />
                  <span>{isRtl ? "الرئيسية" : "Home"}</span>
                </Button>
              </Link>

              {/* 2. CROSS-LINK: طلب نشر -> opens /nashr */}
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
                    className="relative h-10 px-3.5 rounded-xl border-border/80 bg-card/90 text-foreground hover:bg-muted gap-2 shadow-xs"
                  >
                    <ShoppingCart className="w-4 h-4 text-cyan-500" />
                    <span className="hidden sm:inline text-xs font-bold">{isRtl ? "السلة" : "Cart"}</span>
                    {cartCount > 0 && (
                      <span className="w-5 h-5 rounded-full bg-cyan-500 text-white font-black text-xs flex items-center justify-center animate-pulse">
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
                      className="hidden sm:flex h-10 px-3.5 rounded-xl border-border/80 bg-card text-foreground hover:bg-muted text-xs font-bold gap-1.5"
                    >
                      <User className="w-4 h-4 text-emerald-500" />
                      <span>{currentSession.name || (currentSession.role === "reader" ? (isRtl ? "حسابي" : "My Account") : (isRtl ? "الناشر" : "Publisher"))}</span>
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleLogout}
                    className="text-xs font-bold text-muted-foreground hover:text-rose-500 h-10 px-2.5 gap-1 rounded-xl"
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
                      className="h-10 px-3 sm:px-3.5 rounded-xl border-border/80 bg-card/90 text-foreground hover:bg-muted text-xs font-bold gap-1.5 shadow-xs"
                    >
                      <LogIn className="w-4 h-4 text-blue-500" />
                      <span>{isRtl ? "تسجيل الدخول" : "Sign In"}</span>
                    </Button>
                  </Link>

                  <Link to="/book-store/signup">
                    <Button
                      size="sm"
                      className="h-10 px-3.5 sm:px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black gap-1.5 shadow-md shadow-blue-500/25 hover:scale-105 transition-all"
                    >
                      <UserPlus className="w-4 h-4 text-white" />
                      <span>{isRtl ? "إنشاء حساب" : "Sign Up"}</span>
                    </Button>
                  </Link>
                </div>
              )}

              {/* Utility Dropdowns */}
              <div className="flex items-center gap-1">
                <LanguageSelectorDropdown className="h-10 px-2.5 rounded-xl border-border/80 bg-card/90 text-foreground shadow-xs" />
                <ThemeToggle className="h-10 w-10 p-0 rounded-xl border-border/80 bg-card/90 text-foreground shadow-xs" />
              </div>

              {/* Mobile Menu Trigger */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden text-foreground hover:bg-muted p-2 h-10 w-10 rounded-xl"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </Button>
            </div>
          </div>

          {/* Mobile Drawer Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden bg-card border-b border-border px-6 py-5 space-y-3 animate-fade-in text-foreground shadow-lg">
              <Link to="/" onClick={() => setMobileMenuOpen(false)} className="block">
                <Button variant="outline" className="w-full justify-start border-border bg-card text-foreground h-11 gap-2 font-bold rounded-xl">
                  <Home className="w-4 h-4 text-blue-500" />
                  <span>{isRtl ? "العودة للرئيسية" : "Home"}</span>
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
                    <Button variant="outline" className="w-full justify-start border-border bg-card text-foreground h-11 gap-2 font-bold rounded-xl">
                      <User className="w-4 h-4 text-emerald-500" />
                      <span>{isRtl ? "لوحة حسابي" : "My Account"}</span>
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full justify-start text-rose-500 hover:bg-rose-500/10 h-11 font-bold gap-2 rounded-xl"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{isRtl ? "تسجيل الخروج" : "Logout"}</span>
                  </Button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Link to="/book-store/login" onClick={() => setMobileMenuOpen(false)} className="block">
                    <Button variant="outline" className="w-full border-border bg-card text-foreground hover:bg-muted h-11 font-bold rounded-xl gap-1.5">
                      <LogIn className="w-4 h-4 text-blue-500" />
                      <span>{isRtl ? "تسجيل الدخول" : "Sign In"}</span>
                    </Button>
                  </Link>
                  <Link to="/book-store/signup" onClick={() => setMobileMenuOpen(false)} className="block">
                    <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white h-11 font-black rounded-xl gap-1.5 shadow-md">
                      <UserPlus className="w-4 h-4 text-white" />
                      <span>{isRtl ? "إنشاء حساب" : "Sign Up"}</span>
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </header>

        {/* ========================================================================= */}
        {/* ROW 1: DEDICATED LIVE INSTANT SEARCH BAR (STICKY ROW UNDER HEADER)        */}
        {/* ========================================================================= */}
        <div className="sticky top-18 z-40 bg-card/95 dark:bg-slate-900/95 backdrop-blur-2xl border-b border-border dark:border-slate-800/90 shadow-sm dark:shadow-md py-2.5 px-4 sm:px-6 md:px-8 transition-colors">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center gap-2.5">
            {/* Category Dropdown */}
            <div className="w-full sm:w-auto shrink-0">
              <select
                value={liveSearchCategory}
                onChange={(e) => {
                  setLiveSearchCategory(e.target.value);
                  const el = document.getElementById("books-results-grid");
                  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="w-full sm:w-auto h-11 px-3.5 rounded-xl bg-background dark:bg-slate-950 border border-input dark:border-slate-700/80 text-xs sm:text-sm font-black text-foreground dark:text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer shadow-xs transition-colors"
              >
                <option value="all" className="bg-background text-foreground dark:bg-slate-900 dark:text-white">{isRtl ? "🌟 كل الأقسام" : "All Genres"}</option>
                <option value="academic" className="bg-background text-foreground dark:bg-slate-900 dark:text-white">{isRtl ? "🎓 مراجع أكاديمية وجامعية" : "Academic Textbooks"}</option>
                <option value="programming" className="bg-background text-foreground dark:bg-slate-900 dark:text-white">{isRtl ? "💻 برمجة وذكاء اصطناعي" : "Programming & AI"}</option>
                <option value="business" className="bg-background text-foreground dark:bg-slate-900 dark:text-white">{isRtl ? "📈 إدارة أعمال و PMP" : "Business & PMP"}</option>
                <option value="humanities" className="bg-background text-foreground dark:bg-slate-900 dark:text-white">{isRtl ? "📚 علوم إنسانية وتطوير" : "Humanities & Life"}</option>
                <option value="school" className="bg-background text-foreground dark:bg-slate-900 dark:text-white">{isRtl ? "🎒 مناهج ومذكرات مدرسية" : "K-12 School Guides"}</option>
                <option value="literature" className="bg-background text-foreground dark:bg-slate-900 dark:text-white">{isRtl ? "📖 روايات وأدب عالمي" : "Literature & Novels"}</option>
              </select>
            </div>

            {/* Instant Search Input */}
            <div className="relative flex-1 w-full flex items-center">
              <Search className="w-4 h-4 sm:w-5 sm:h-5 absolute start-3 text-cyan-600 dark:text-cyan-400" />
              <input
                type="text"
                value={liveSearchQuery}
                onChange={(e) => setLiveSearchQuery(e.target.value)}
                placeholder={isRtl ? "بحث مباشر وفوري: اكتب اسم الكتاب، المؤلف، رقم ISBN، أو الكلمة المفتاحية..." : "Instant Live Search: title, author, ISBN, or keywords..."}
                className="w-full h-11 ps-9 sm:ps-10 pe-10 rounded-xl bg-background dark:bg-slate-950 border border-input dark:border-slate-700/80 text-xs sm:text-sm text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 font-semibold shadow-xs transition-colors"
              />
              {liveSearchQuery && (
                <button
                  type="button"
                  onClick={() => setLiveSearchQuery("")}
                  className="absolute end-3 text-muted-foreground hover:text-foreground dark:text-slate-400 dark:hover:text-white p-1 rounded-full hover:bg-muted dark:hover:bg-slate-800"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Instant Search Counter & Jump Button */}
            <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-2 shrink-0">
              <span className="text-[11px] font-bold text-muted-foreground dark:text-slate-400 px-2 py-1 rounded-lg bg-muted/60 dark:bg-slate-950/70 border border-border dark:border-slate-800">
                {isRtl ? `${displayedBooks.length} كتاب متاح` : `${displayedBooks.length} Books Found`}
              </span>
              <Button
                type="button"
                onClick={() => {
                  const el = document.getElementById("books-results-grid");
                  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="h-11 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-black text-xs shadow-md gap-1.5"
              >
                <Zap className="w-3.5 h-3.5 text-cyan-200 dark:text-cyan-300" />
                <span>{isRtl ? "عرض النتائج" : "Show Books"}</span>
              </Button>
            </div>
          </div>

          {/* Trending Search Tags */}
          <div className="max-w-7xl mx-auto flex items-center gap-1.5 pt-2 text-[11px] overflow-x-auto no-scrollbar">
            <span className="text-muted-foreground dark:text-slate-400 font-bold shrink-0">{isRtl ? "رائج الآن:" : "Trending:"}</span>
            {["الذكاء الاصطناعي", "إدارة المشاريع", "الطب البشري", "الثانوية العامة", "البرمجة"].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => {
                  setLiveSearchQuery(tag);
                  const el = document.getElementById("books-results-grid");
                  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="px-2.5 py-0.5 rounded-full bg-muted/80 hover:bg-muted text-foreground/80 hover:text-foreground dark:bg-slate-800/80 dark:hover:bg-slate-700 dark:text-slate-300 dark:hover:text-white border border-border/80 dark:border-slate-700/60 shrink-0 font-medium transition-colors"
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* ROW 2: 4 HORIZONTAL SECTION TABS (الأكثر طلباً - العروض - الأقسام - جديدنا) */}
        {/* ========================================================================= */}
        <div className="sticky top-[138px] z-30 bg-card/95 dark:bg-slate-950/95 backdrop-blur-xl border-b border-border dark:border-slate-800/80 shadow-md py-2 px-4 sm:px-6 md:px-8 transition-colors">
          <div className="max-w-7xl mx-auto flex flex-col gap-2">
            
            {/* 4 Main Section Buttons */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              
              {/* 1. الأكثر طلباً */}
              <button
                type="button"
                onClick={() => {
                  setActiveMainTab("bestsellers");
                  const el = document.getElementById("books-results-grid");
                  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm transition-all border ${
                  activeMainTab === "bestsellers"
                    ? "bg-amber-500/15 dark:bg-gradient-to-r dark:from-amber-500/20 dark:to-orange-500/20 border-amber-500 text-amber-700 dark:text-amber-300 shadow-sm"
                    : "bg-muted/50 dark:bg-slate-900/80 border-border dark:border-slate-800 text-muted-foreground dark:text-slate-300 hover:text-foreground dark:hover:text-white hover:bg-muted dark:hover:bg-slate-800/80"
                }`}
              >
                <Flame className={`w-4 h-4 ${activeMainTab === "bestsellers" ? "text-amber-600 dark:text-amber-400 animate-pulse" : "text-amber-500 dark:text-amber-400"}`} />
                <span>{isRtl ? "الأكثر طلباً" : "Bestsellers"}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/15 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                  {catalog.filter((b) => b.is_bestseller).length || 4}
                </span>
              </button>

              {/* 2. العروض */}
              <button
                type="button"
                onClick={() => {
                  setActiveMainTab("offers");
                  const el = document.getElementById("books-results-grid");
                  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm transition-all border ${
                  activeMainTab === "offers"
                    ? "bg-rose-500/15 dark:bg-gradient-to-r dark:from-rose-500/20 dark:to-pink-500/20 border-rose-500 text-rose-700 dark:text-rose-300 shadow-sm"
                    : "bg-muted/50 dark:bg-slate-900/80 border-border dark:border-slate-800 text-muted-foreground dark:text-slate-300 hover:text-foreground dark:hover:text-white hover:bg-muted dark:hover:bg-slate-800/80"
                }`}
              >
                <Tag className={`w-4 h-4 ${activeMainTab === "offers" ? "text-rose-600 dark:text-rose-400 animate-bounce" : "text-rose-500 dark:text-rose-400"}`} />
                <span>{isRtl ? "العروض والتخفيضات" : "Special Offers"}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-500/15 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                  {isRtl ? "وفر حتى 40%" : "Save 40%"}
                </span>
              </button>

              {/* 3. الأقسام */}
              <button
                type="button"
                onClick={() => {
                  setActiveMainTab("categories");
                  const el = document.getElementById("books-results-grid");
                  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm transition-all border ${
                  activeMainTab === "categories"
                    ? "bg-blue-500/15 dark:bg-gradient-to-r dark:from-blue-600/25 dark:to-indigo-600/25 border-blue-500 text-blue-700 dark:text-blue-300 shadow-sm"
                    : "bg-muted/50 dark:bg-slate-900/80 border-border dark:border-slate-800 text-muted-foreground dark:text-slate-300 hover:text-foreground dark:hover:text-white hover:bg-muted dark:hover:bg-slate-800/80"
                }`}
              >
                <Layers className={`w-4 h-4 ${activeMainTab === "categories" ? "text-blue-600 dark:text-cyan-400" : "text-blue-500 dark:text-cyan-400"}`} />
                <span>{isRtl ? "الأقسام والتخصصات" : "All Departments"}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-500/15 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30">
                  {storeCategories.length}
                </span>
              </button>

              {/* 4. جديدنا */}
              <button
                type="button"
                onClick={() => {
                  setActiveMainTab("new_arrivals");
                  const el = document.getElementById("books-results-grid");
                  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm transition-all border ${
                  activeMainTab === "new_arrivals"
                    ? "bg-emerald-500/15 dark:bg-gradient-to-r dark:from-emerald-500/20 dark:to-teal-500/20 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-sm"
                    : "bg-muted/50 dark:bg-slate-900/80 border-border dark:border-slate-800 text-muted-foreground dark:text-slate-300 hover:text-foreground dark:hover:text-white hover:bg-muted dark:hover:bg-slate-800/80"
                }`}
              >
                <Sparkles className={`w-4 h-4 ${activeMainTab === "new_arrivals" ? "text-emerald-600 dark:text-emerald-400 animate-spin" : "text-emerald-500 dark:text-emerald-400"}`} />
                <span>{isRtl ? "جديدنا (إصدارات حديثة)" : "New Arrivals"}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  2026
                </span>
              </button>
            </div>

            {/* Department Sub-Filter Chips inside the Active Section */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              <span className="text-xs text-muted-foreground dark:text-slate-400 font-bold shrink-0">
                {activeMainTab === "bestsellers" && (isRtl ? "الأكثر طلباً في:" : "Top in:")}
                {activeMainTab === "offers" && (isRtl ? "عروض قسم:" : "Offers in:")}
                {activeMainTab === "categories" && (isRtl ? "تصفية القسم:" : "Filter:")}
                {activeMainTab === "new_arrivals" && (isRtl ? "جديد قسم:" : "New in:")}
              </span>

              <button
                type="button"
                onClick={() => setActiveSubCategory("all")}
                className={`px-3 py-1 rounded-full text-xs font-black shrink-0 transition-all border ${
                  activeSubCategory === "all"
                    ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                    : "bg-muted/60 dark:bg-slate-900 text-muted-foreground dark:text-slate-400 border-border dark:border-slate-800 hover:text-foreground dark:hover:text-white hover:bg-muted dark:hover:bg-slate-800"
                }`}
              >
                {isRtl ? "الكل" : "All"} ({catalog.length})
              </button>

              {storeCategories.map((cat) => (
                <button
                  key={`sub-${cat.id}`}
                  type="button"
                  onClick={() => setActiveSubCategory(cat.id)}
                  className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 transition-all border ${
                    activeSubCategory === cat.id
                      ? "bg-cyan-600 text-white border-cyan-600 shadow-sm"
                      : "bg-muted/60 dark:bg-slate-900 text-muted-foreground dark:text-slate-400 border-border dark:border-slate-800 hover:text-foreground dark:hover:text-white hover:bg-muted dark:hover:bg-slate-800"
                  }`}
                >
                  {isRtl ? cat.titleAr : cat.titleEn}
                </button>
              ))}
            </div>

          </div>
        </div>

        {/* ========================================================================= */}
        {/* DYNAMIC BOOKS RESULTS GRID (INSTANT RESPONSE TO ROW 1 & ROW 2 SELECTIONS) */}
        {/* ========================================================================= */}
        <section id="books-results-grid" className="py-10 sm:py-14 px-4 sm:px-6 md:px-12 bg-background dark:bg-slate-950 border-b border-border dark:border-slate-800/80 transition-colors">
          <div className="max-w-7xl mx-auto space-y-8">
            
            {/* Status if subCategory is filtered */}
            {activeSubCategory !== "all" && (
              <div className="flex items-center justify-between pb-2">
                <Badge className="bg-muted/80 dark:bg-slate-900 border border-border dark:border-slate-700 text-foreground dark:text-slate-200 text-xs font-black px-3 py-1">
                  {isRtl ? `${displayedBooks.length} مؤلف معتمد` : `${displayedBooks.length} Books`}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveSubCategory("all")}
                  className="text-xs text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 h-8 px-2"
                >
                  {isRtl ? "إلغاء التصفية ✕" : "Clear Filter ✕"}
                </Button>
              </div>
            )}

            {/* If no books match filters */}
            {displayedBooks.length === 0 ? (
              <div className="text-center py-16 bg-card/60 dark:bg-slate-900/40 rounded-3xl border border-border dark:border-slate-800 space-y-4">
                <BookOpen className="w-12 h-12 text-muted-foreground/60 dark:text-slate-600 mx-auto" />
                <h3 className="text-lg font-black text-foreground dark:text-white">
                  {isRtl ? "لم يتم العثور على كتب مطابقة للبحث أو التصفية" : "No books match your criteria"}
                </h3>
                <p className="text-xs text-muted-foreground dark:text-slate-400 max-w-md mx-auto">
                  {isRtl
                    ? "جرّب تغيير كلمات البحث في الصف العلوي أو إزالة تصفية القسم لاستعراض باقي كتب المتجر."
                    : "Try modifying your search terms in the top bar or clearing sub-department filters."}
                </p>
                <Button
                  onClick={() => {
                    setLiveSearchQuery("");
                    setLiveSearchCategory("all");
                    setActiveSubCategory("all");
                    setActiveMainTab("categories");
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl"
                >
                  {isRtl ? "عرض كل كتب المتجر" : "Reset & View All"}
                </Button>
              </div>
            ) : (
              /* Books Grid */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {displayedBooks.map((book, idx) => (
                  <Card
                    key={`book-grid-${book.id}-${idx}`}
                    className="relative bg-card dark:bg-slate-900/90 border-2 border-border dark:border-slate-800 hover:border-blue-500/50 rounded-3xl overflow-hidden shadow-md hover:shadow-xl dark:shadow-xl dark:hover:shadow-2xl transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1"
                  >
                    {/* Bestseller Rank or Offer Badge */}
                    {activeMainTab === "bestsellers" && (
                      <div className="absolute top-3 start-3 z-20">
                        <div className="w-8 h-8 rounded-full bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center shadow-lg border border-amber-300">
                          #{idx + 1}
                        </div>
                      </div>
                    )}

                    {activeMainTab === "offers" && book.price_print > book.price_digital && (
                      <div className="absolute top-3 start-3 z-20">
                        <Badge className="bg-rose-600 text-white font-black text-[10px] shadow-lg">
                          {isRtl ? `وفر ${book.price_print - book.price_digital} ج.م` : "Special Offer"}
                        </Badge>
                      </div>
                    )}

                    {/* Book Cover */}
                    <div className="relative aspect-[3/4] w-full overflow-hidden bg-muted dark:bg-slate-950">
                      <img
                        src={book.cover_url}
                        alt={book.title_ar}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 dark:from-slate-950 dark:via-slate-950/20 to-transparent" />
                      
                      <div className="absolute top-3 end-3 z-10">
                        <Badge className="bg-emerald-600/90 text-white font-bold text-[10px]">
                          {isRtl ? "جاهز للشحن" : "In Stock"}
                        </Badge>
                      </div>

                      <div className="absolute bottom-2.5 start-2.5 text-[10px] text-slate-200 dark:text-slate-400 bg-black/60 dark:bg-slate-950/80 px-2 py-0.5 rounded-md font-mono border border-white/20 dark:border-slate-800">
                        {book.isbn}
                      </div>
                    </div>

                    {/* Book Metadata & Pricing */}
                    <CardContent className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs text-muted-foreground dark:text-slate-400">
                          <span className="truncate max-w-[140px]">{isRtl ? book.publisher_ar : book.publisher_en}</span>
                          <span className="flex items-center gap-1 text-amber-500 dark:text-amber-400 font-bold">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span>{book.rating}</span>
                          </span>
                        </div>
                        <h3 className="font-black text-sm sm:text-base text-foreground dark:text-white line-clamp-2 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {isRtl ? book.title_ar : book.title_en}
                        </h3>
                        <p className="text-xs font-semibold text-muted-foreground dark:text-slate-400 line-clamp-1">
                          {isRtl ? book.author_ar : book.author_en}
                        </p>
                      </div>

                      {/* Pricing and Cart Buttons */}
                      <div className="pt-2 border-t border-border dark:border-slate-800 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[11px] text-muted-foreground dark:text-slate-400 font-semibold">{isRtl ? "السعر:" : "Price:"}</span>
                          <div className="text-end">
                            <span className="text-sm font-black text-foreground dark:text-white">
                              {book.price_digital} {isRtl ? "ج.م" : book.currency}
                            </span>
                            {book.price_print > 0 && (
                              <span className="text-[10px] text-muted-foreground dark:text-slate-400 block">
                                {isRtl ? `ورقي: ${book.price_print} ج.م` : `Print: ${book.price_print}`}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <Button
                            size="sm"
                            onClick={() => setQuickBuyBook(book)}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-9 rounded-xl gap-1 shadow-xs"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            <span>{isRtl ? "شراء سريع" : "Quick Buy"}</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/book-store/browse?code=${book.code}`)}
                            className="w-full border-border dark:border-slate-700 bg-muted/60 dark:bg-slate-800/80 hover:bg-muted dark:hover:bg-slate-700 text-foreground dark:text-white font-bold text-xs h-9 rounded-xl gap-1"
                          >
                            <Eye className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                            <span>{isRtl ? "تفاصيل" : "Details"}</span>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

          </div>
        </section>



        {/* ========================================================================= */}
        {/* 2.6. JARIR-STYLE TOP BESTSELLERS SHOWCASE (الأكثر طلباً ورواجاً)            */}
        {/* ========================================================================= */}
        {bestsellers.length > 0 && (
          <section className="py-10 sm:py-14 px-4 sm:px-6 md:px-12 bg-background dark:bg-slate-950 border-b border-border dark:border-slate-800/80 transition-colors">
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border dark:border-slate-800 pb-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-2 text-amber-500 dark:text-amber-400 text-xs font-black">
                    <Trophy className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                    <span>{isRtl ? "إصدارات دار عبيد الأكثر رواجاً" : "Top Bestselling Books"}</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-foreground dark:text-white tracking-tight">
                    {isRtl ? "🏆 قائمة الكتب الأكثر طلباً هذا الأسبوع" : "Top Trending Bestsellers This Week"}
                  </h2>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground dark:text-slate-400">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{isRtl ? "توصيل إكسبريس خلال 48 ساعة" : "48h Express Shipping"}</span>
                </div>
              </div>

              {/* Bestsellers Grid with Rank Medals */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {bestsellers.map((book, idx) => (
                  <Card
                    key={`bestseller-${book.id}`}
                    className="relative bg-card dark:bg-slate-900/90 border-2 border-border dark:border-slate-800 hover:border-blue-500/50 rounded-3xl overflow-hidden shadow-md hover:shadow-xl dark:shadow-xl dark:hover:shadow-2xl transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1"
                  >
                    {/* Rank Badge (#1, #2, #3, #4) */}
                    <div className="absolute top-3 start-3 z-20">
                      <div className="w-8 h-8 rounded-full bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center shadow-lg border border-amber-300">
                        #{idx + 1}
                      </div>
                    </div>

                    {/* Book Cover */}
                    <div className="relative aspect-[3/4] w-full overflow-hidden bg-muted dark:bg-slate-950">
                      <img
                        src={book.cover_url}
                        alt={book.title_ar}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 dark:from-slate-950 dark:via-slate-950/20 to-transparent" />
                      <div className="absolute top-3 end-3 z-10">
                        <Badge className="bg-emerald-600/90 text-white font-bold text-[10px]">
                          {isRtl ? "جاهز للشحن" : "In Stock"}
                        </Badge>
                      </div>
                      <div className="absolute bottom-2.5 start-2.5 text-[10px] text-slate-200 dark:text-slate-400 bg-black/60 dark:bg-slate-950/80 px-2 py-0.5 rounded-md font-mono border border-white/20 dark:border-slate-800">
                        {book.isbn}
                      </div>
                    </div>

                    {/* Content */}
                    <CardContent className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs text-muted-foreground dark:text-slate-400">
                          <span className="truncate max-w-[140px]">{isRtl ? book.publisher_ar : book.publisher_en}</span>
                          <span className="flex items-center gap-1 text-amber-500 dark:text-amber-400 font-bold">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span>{book.rating}</span>
                          </span>
                        </div>
                        <h3 className="font-black text-sm sm:text-base text-foreground dark:text-white line-clamp-2 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {isRtl ? book.title_ar : book.title_en}
                        </h3>
                        <p className="text-xs font-semibold text-muted-foreground dark:text-slate-400 line-clamp-1">
                          {isRtl ? book.author_ar : book.author_en}
                        </p>
                      </div>

                      {/* Pricing & Fast Buy */}
                      <div className="pt-2 border-t border-border dark:border-slate-800 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[11px] text-muted-foreground dark:text-slate-400 font-semibold">{isRtl ? "سعر النسخة:" : "Price:"}</span>
                          <div className="text-end">
                            <span className="text-sm font-black text-foreground dark:text-white">
                              {book.price_digital} {isRtl ? "ج.م" : book.currency}
                            </span>
                            {book.price_print > 0 && (
                              <span className="text-[10px] text-muted-foreground dark:text-slate-400 block">
                                {isRtl ? `ورقي: ${book.price_print} ج.م` : `Print: ${book.price_print}`}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <Button
                            size="sm"
                            onClick={() => setQuickBuyBook(book)}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-9 rounded-xl gap-1 shadow-xs"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            <span>{isRtl ? "شراء سريع" : "Quick Buy"}</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/book-store/browse?code=${book.code}`)}
                            className="w-full border-border dark:border-slate-700 bg-muted/60 dark:bg-slate-800/80 hover:bg-muted dark:hover:bg-slate-700 text-foreground dark:text-white font-bold text-xs h-9 rounded-xl gap-1"
                          >
                            <Eye className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
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
        <section className="py-6 px-4 sm:px-6 md:px-12 bg-muted/30 dark:bg-gradient-to-r dark:from-blue-950/60 dark:via-indigo-950/70 dark:to-slate-950 border-b border-border dark:border-slate-800 transition-colors">
          <div className="max-w-7xl mx-auto rounded-3xl p-6 sm:p-8 bg-card dark:bg-gradient-to-r dark:from-blue-600/15 dark:via-indigo-600/15 dark:to-cyan-500/15 border border-border dark:border-blue-500/30 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md dark:shadow-xl">
            <div className="space-y-2 text-center md:text-start">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/15 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-400/30">
                <Sparkles className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                <span>{isRtl ? "خدمات متميزة للجامعات والمؤسسات والطلاب" : "Institutional & Student Priority Services"}</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-foreground dark:text-white">
                {isRtl ? "شحن فوري لباب المنزل • توريد كميات مجمعة • حماية DRM متطورة" : "Fast Door Delivery • Bulk Institutional Orders • Advanced DRM"}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground dark:text-slate-300 max-w-2xl">
                {isRtl
                  ? "توفر دار عبيد للمؤسسات والجامعات والباحثين إمكانية طلب النسخ المطبوعة الفاخرة بأسعار خاصة وفواتير ضريبية، أو ترخيص مكاتب رقمية كاملة للطلاب مع دعم فني مستمر."
                  : "Dar Obeid provides academic institutions with official tax invoices, bulk student licenses, and secure doorstep express book packaging."}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Link to="/contact">
                <Button variant="outline" className="h-11 px-5 rounded-2xl border-border dark:border-slate-700 bg-background dark:bg-slate-900 text-foreground dark:text-white font-bold text-xs hover:bg-muted dark:hover:bg-slate-800">
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
        <section id="catalog-section" className="py-14 sm:py-20 px-4 sm:px-6 md:px-12 bg-background dark:bg-slate-950 transition-colors">
          <div className="max-w-7xl mx-auto space-y-10">
            
            {/* Header with Title and Filter Tabs */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-border dark:border-slate-800/80 pb-6">
              <div>
                <div className="inline-flex items-center gap-2 text-cyan-600 dark:text-cyan-400 text-xs font-bold mb-1">
                  <Flame className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <span>{isRtl ? "الكتالوج الرسمي المتاح للشراء الفوري" : "Official Catalog Ready to Order"}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-foreground dark:text-white tracking-tight">
                  {isRtl ? "📚 أحدث الإصدارات والمراجع الأكاديمية" : "Latest Releases & Textbooks"}
                </h2>
              </div>

              {/* Genre Filter Tabs */}
              <div className="flex flex-wrap items-center gap-1.5 p-1 bg-muted/60 dark:bg-slate-900 rounded-2xl border border-border dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedCategoryTab("all")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedCategoryTab === "all" ? "bg-blue-600 text-white shadow-md" : "text-muted-foreground dark:text-slate-400 hover:text-foreground dark:hover:text-white"
                  }`}
                >
                  {isRtl ? "جميع الكتب" : "All Books"}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCategoryTab("academic")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedCategoryTab === "academic" ? "bg-blue-600 text-white shadow-md" : "text-muted-foreground dark:text-slate-400 hover:text-foreground dark:hover:text-white"
                  }`}
                >
                  {isRtl ? "مراجع أكاديمية" : "Academic"}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCategoryTab("programming")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedCategoryTab === "programming" ? "bg-blue-600 text-white shadow-md" : "text-muted-foreground dark:text-slate-400 hover:text-foreground dark:hover:text-white"
                  }`}
                >
                  {isRtl ? "برمجة وذكاء اصطناعي" : "Tech & Coding"}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCategoryTab("business")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedCategoryTab === "business" ? "bg-blue-600 text-white shadow-md" : "text-muted-foreground dark:text-slate-400 hover:text-foreground dark:hover:text-white"
                  }`}
                >
                  {isRtl ? "إدارة أعمال و PMP" : "Business"}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCategoryTab("humanities")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedCategoryTab === "humanities" ? "bg-blue-600 text-white shadow-md" : "text-muted-foreground dark:text-slate-400 hover:text-foreground dark:hover:text-white"
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
                  className="bg-card dark:bg-slate-900/90 border-2 border-border dark:border-slate-800 hover:border-blue-500/50 rounded-3xl overflow-hidden shadow-md hover:shadow-xl dark:shadow-xl dark:hover:shadow-2xl transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1"
                >
                  {/* Book Cover with Badges */}
                  <div className="relative aspect-[3/4] w-full overflow-hidden bg-muted dark:bg-slate-950">
                    <img
                      src={book.cover_url}
                      alt={book.title_ar}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 dark:from-slate-950 dark:via-slate-950/20 to-transparent" />

                    {/* Format Badge */}
                    <div className="absolute top-3 start-3">
                      <Badge className="bg-black/70 dark:bg-slate-950/80 backdrop-blur-md text-white border border-white/20 dark:border-slate-700 text-[10px] font-bold">
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
                    <div className="absolute bottom-2.5 start-2.5 text-[10px] text-slate-200 dark:text-slate-400 bg-black/60 dark:bg-slate-950/80 px-2 py-0.5 rounded-md font-mono border border-white/20 dark:border-slate-800">
                      {book.isbn}
                    </div>
                  </div>

                  {/* Book Metadata Body */}
                  <CardContent className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-muted-foreground dark:text-slate-400">
                        <span className="truncate max-w-[150px]">{isRtl ? book.publisher_ar : book.publisher_en}</span>
                        <span className="flex items-center gap-1 text-amber-500 dark:text-amber-400 font-bold">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>{book.rating}</span>
                          <span className="text-[10px] text-muted-foreground/70 dark:text-slate-500">({book.reviews_count})</span>
                        </span>
                      </div>

                      <h3 className="font-black text-sm sm:text-base text-foreground dark:text-white line-clamp-2 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {isRtl ? book.title_ar : book.title_en}
                      </h3>

                      <p className="text-xs font-semibold text-muted-foreground dark:text-slate-400 line-clamp-1">
                        {isRtl ? book.author_ar : book.author_en}
                      </p>
                    </div>

                    {/* In-Stock status & Savings */}
                    <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground dark:text-slate-400">
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <Check className="w-3.5 h-3.5" />
                        <span>{isRtl ? "متوفر بالمستودع • شحن 48 س" : "In Stock • Ships 48h"}</span>
                      </span>
                      {book.price_print > book.price_digital && (
                        <span className="text-[10px] text-cyan-700 dark:text-cyan-300 font-bold bg-cyan-500/10 dark:bg-cyan-950/80 border border-cyan-400/30 dark:border-cyan-800/60 px-2 py-0.5 rounded-full">
                          {isRtl ? `وفر ${book.price_print - book.price_digital} ج.م` : `Save ${book.price_print - book.price_digital}`}
                        </span>
                      )}
                    </div>

                    {/* Dual Pricing Boxes */}
                    <div className="pt-2 border-t border-border dark:border-slate-800/80 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1 text-cyan-700 dark:text-cyan-400 font-bold">
                          <Zap className="w-3.5 h-3.5" />
                          <span>{isRtl ? "نسخة رقمية:" : "E-Book:"}</span>
                        </div>
                        <span className="font-black text-foreground dark:text-white text-sm">
                          {book.price_digital} {isRtl ? "ج.م" : book.currency}
                        </span>
                      </div>

                      {book.price_print > 0 && (
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1 text-amber-700 dark:text-amber-400 font-bold">
                            <Truck className="w-3.5 h-3.5" />
                            <span>{isRtl ? "نسخة ورقية:" : "Print:"}</span>
                          </div>
                          <span className="font-black text-foreground dark:text-white text-sm">
                            {book.price_print} {isRtl ? "ج.م" : book.currency}
                          </span>
                        </div>
                      )}

                      {/* Buy & Cart Buttons */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <Button
                          size="sm"
                          onClick={() => setQuickBuyBook(book)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-9 rounded-xl gap-1 shadow-xs"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>{isRtl ? "شراء / سلة" : "Buy / Cart"}</span>
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/book-store/browse?code=${book.code}`)}
                          className="w-full border-border dark:border-slate-700 bg-muted/60 dark:bg-slate-800/70 hover:bg-muted dark:hover:bg-slate-700 text-foreground dark:text-white font-bold text-xs h-9 rounded-xl gap-1"
                        >
                          <Eye className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
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
                <Button size="lg" className="h-12 px-8 rounded-2xl bg-card dark:bg-slate-900 hover:bg-muted dark:hover:bg-slate-800 text-foreground dark:text-white border-2 border-border dark:border-slate-700 font-black text-sm gap-2">
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
          <section className="py-12 sm:py-16 px-4 sm:px-6 md:px-12 bg-muted/30 dark:bg-gradient-to-r dark:from-slate-900 dark:via-indigo-950 dark:to-slate-900 border-y border-border dark:border-slate-800 transition-colors">
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-8 md:gap-12">
              {/* Cover 3D Mockup */}
              <div className="w-56 sm:w-64 shrink-0 aspect-[3/4] rounded-3xl overflow-hidden shadow-xl dark:shadow-2xl dark:shadow-blue-500/20 border-2 border-border dark:border-blue-500/30 group">
                <img
                  src={catalog[0].cover_url}
                  alt={catalog[0].title_ar}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>

              {/* Book Details & Fast Buy */}
              <div className="flex-1 space-y-4 text-center md:text-start">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 text-xs font-bold border border-cyan-400/30 dark:border-cyan-500/30">
                  <Star className="w-3.5 h-3.5 fill-cyan-500 text-cyan-500 dark:fill-cyan-400 dark:text-cyan-400" />
                  <span>{isRtl ? "كتاب الشهر الأكثر تميزاً واستشهاداً أكاديمياً" : "Book of the Month Spotlight"}</span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-black text-foreground dark:text-white leading-tight">
                  {isRtl ? catalog[0].title_ar : catalog[0].title_en}
                </h3>

                <p className="text-xs sm:text-sm text-muted-foreground dark:text-slate-300 leading-relaxed max-w-2xl font-medium">
                  {isRtl ? catalog[0].description_ar : catalog[0].description_en}
                </p>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs font-bold text-muted-foreground dark:text-slate-300 pt-1">
                  <span>✍️ {catalog[0].author_ar}</span>
                  <span>🏛️ {catalog[0].publisher_ar}</span>
                  <span>📄 {catalog[0].pages} صفحة</span>
                  <span>🔒 حماية DRM</span>
                </div>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
                  <Button
                    size="lg"
                    onClick={() => handleAddToCart(catalog[0], "digital")}
                    className="h-11 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-black text-xs gap-2 shadow-md"
                  >
                    <Zap className="w-4 h-4" />
                    <span>{isRtl ? `شراء النسخة الرقمية (${catalog[0].price_digital} ج.م)` : "Buy Digital Edition"}</span>
                  </Button>

                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => handleAddToCart(catalog[0], "print")}
                    className="h-11 px-6 rounded-xl border-border dark:border-slate-700 bg-background dark:bg-slate-900/90 text-foreground dark:text-white hover:bg-muted dark:hover:bg-slate-800 font-black text-xs gap-2"
                  >
                    <Truck className="w-4 h-4 text-amber-500 dark:text-amber-400" />
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
        <section className="py-14 sm:py-20 px-4 sm:px-6 md:px-12 bg-muted/30 dark:bg-slate-900/40 border-b border-border dark:border-slate-800 transition-colors">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="text-center space-y-2">
              <Badge className="bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-500/20 text-xs px-3 py-1">
                {isRtl ? "تجربة القراءة والشراء" : "Shopping Experience"}
              </Badge>
              <h2 className="text-2xl sm:text-4xl font-black text-foreground dark:text-white">
                {isRtl ? "كيف تطلب وتقرأ كتبك في 3 خطوات بسيطة؟" : "How to Buy & Read in 3 Steps"}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-3xl bg-card dark:bg-slate-900 border border-border dark:border-slate-800 text-center space-y-3 shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/15 text-blue-600 dark:text-blue-400 font-black text-lg mx-auto flex items-center justify-center">
                  1
                </div>
                <h4 className="text-base font-black text-foreground dark:text-white">{isRtl ? "تصفح واختر كتابك" : "Browse & Choose"}</h4>
                <p className="text-xs text-muted-foreground dark:text-slate-400 leading-relaxed">
                  {isRtl
                    ? "ابحث في الكتالوج الشامل، واقرأ العينات وفهارس الفصول المجانية لاختيار الكتاب المناسب."
                    : "Search thousands of books and preview free chapter samples."}
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-card dark:bg-slate-900 border border-border dark:border-slate-800 text-center space-y-3 shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 font-black text-lg mx-auto flex items-center justify-center">
                  2
                </div>
                <h4 className="text-base font-black text-foreground dark:text-white">{isRtl ? "حدد الصيغة المفضلة" : "Select Format"}</h4>
                <p className="text-xs text-muted-foreground dark:text-slate-400 leading-relaxed">
                  {isRtl
                    ? "اختر النسخة الرقمية للقراءة الفورية بأسعار مخفضة، أو النسخة الورقية المطبوعة للشحن الفاخر."
                    : "Choose instant DRM e-book or high-grade printed physical edition."}
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-card dark:bg-slate-900 border border-border dark:border-slate-800 text-center space-y-3 shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-black text-lg mx-auto flex items-center justify-center">
                  3
                </div>
                <h4 className="text-base font-black text-foreground dark:text-white">{isRtl ? "دفع آمن واستلام مباشر" : "Secure Pay & Receive"}</h4>
                <p className="text-xs text-muted-foreground dark:text-slate-400 leading-relaxed">
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
        <section className="py-14 sm:py-18 px-4 sm:px-6 md:px-12 bg-background dark:bg-slate-950 border-b border-border dark:border-slate-800 transition-colors">
          <div className="max-w-5xl mx-auto rounded-3xl bg-card dark:bg-gradient-to-br dark:from-amber-950/60 dark:via-slate-900 dark:to-orange-950/60 border-2 border-amber-500/30 p-8 sm:p-10 shadow-lg dark:shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 end-0 w-80 h-80 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />
            
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-start">
              <div className="space-y-3 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-black">
                  <PenTool className="w-3.5 h-3.5" />
                  <span>{isRtl ? "بوابة المؤلفين والباحثين المستقلة (منصة نشر)" : "Authors & Scholars Portal (Nashr)"}</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-foreground dark:text-white leading-tight">
                  {isRtl ? "هل أنت كاتب أو باحث أو أستاذ جامعي؟" : "Are you an Author or Academic Researcher?"}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground dark:text-slate-300 leading-relaxed font-medium">
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
                    className="h-13 px-7 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white font-black text-sm shadow-lg dark:shadow-xl dark:shadow-amber-500/25 gap-2 hover:scale-105 transition-all"
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
        <section className="py-14 sm:py-20 px-4 sm:px-6 md:px-12 bg-muted/20 dark:bg-slate-950 border-b border-border dark:border-slate-800 transition-colors">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-2">
              <Badge className="bg-card dark:bg-slate-900 text-muted-foreground dark:text-slate-300 border border-border dark:border-slate-800 text-xs px-3 py-1">
                <HelpCircle className="w-3.5 h-3.5 me-1 text-cyan-600 dark:text-cyan-400 inline" />
                {isRtl ? "مركز المساعدة واستفسارات الشراء" : "Shopping & Help Center"}
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-black text-foreground dark:text-white">
                {isRtl ? "الأسئلة الشائعة حول متجر الكتب والتوصيل" : "Frequently Asked Questions"}
              </h2>
            </div>

            <Accordion type="single" collapsible className="space-y-3">
              {storeFaqs.map((faq, idx) => (
                <AccordionItem key={idx} value={`faq-${idx}`} className="bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-2xl px-5 shadow-xs transition-colors">
                  <AccordionTrigger className="font-black text-sm sm:text-base text-foreground dark:text-white hover:no-underline py-4 text-start">
                    {isRtl ? faq.qAr : faq.qEn}
                  </AccordionTrigger>
                  <AccordionContent className="text-xs sm:text-sm text-muted-foreground dark:text-slate-400 leading-relaxed pt-1 pb-4 text-start">
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
            <DialogContent className="max-w-md bg-card dark:bg-slate-900 border-2 border-border dark:border-slate-700 text-foreground dark:text-white rounded-3xl p-6 shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-lg font-black text-foreground dark:text-white">
                  {isRtl ? "إضافة الكتاب لسلة الشراء" : "Add Book to Cart"}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground dark:text-slate-400">
                  {isRtl ? quickBuyBook.title_ar : quickBuyBook.title_en}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="text-xs font-bold text-foreground dark:text-slate-300">{isRtl ? "اختر صيغة الكتاب المطلوبة:" : "Select format:"}</div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedFormat("digital")}
                    className={`p-3.5 rounded-2xl border-2 text-start transition-all ${
                      selectedFormat === "digital"
                        ? "border-cyan-500 bg-cyan-500/10 dark:bg-cyan-500/15 text-foreground dark:text-white shadow-xs"
                        : "border-border dark:border-slate-800 bg-muted/40 dark:bg-slate-950 text-muted-foreground dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-black text-sm mb-1 text-cyan-600 dark:text-cyan-300">
                      <Zap className="w-4 h-4" />
                      <span>{isRtl ? "نسخة رقمية" : "Digital E-Book"}</span>
                    </div>
                    <div className="text-xs font-bold text-foreground dark:text-white">
                      {quickBuyBook.price_digital} {isRtl ? "ج.م" : quickBuyBook.currency}
                    </div>
                    <div className="text-[10px] text-muted-foreground dark:text-slate-400 mt-1">{isRtl ? "قراءة سحابية فورية" : "Instant Cloud Read"}</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedFormat("print")}
                    className={`p-3.5 rounded-2xl border-2 text-start transition-all ${
                      selectedFormat === "print"
                        ? "border-amber-500 bg-amber-500/10 dark:bg-amber-500/15 text-foreground dark:text-white shadow-xs"
                        : "border-border dark:border-slate-800 bg-muted/40 dark:bg-slate-950 text-muted-foreground dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-black text-sm mb-1 text-amber-600 dark:text-amber-300">
                      <Truck className="w-4 h-4" />
                      <span>{isRtl ? "نسخة ورقية" : "Printed Book"}</span>
                    </div>
                    <div className="text-xs font-bold text-foreground dark:text-white">
                      {quickBuyBook.price_print} {isRtl ? "ج.م" : quickBuyBook.currency}
                    </div>
                    <div className="text-[10px] text-muted-foreground dark:text-slate-400 mt-1">{isRtl ? "شحن وتوصيل منزلي" : "Doorstep Delivery"}</div>
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
