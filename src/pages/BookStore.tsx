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
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { BookStoreDataStore } from "@/services/bookStoreDataStore";
import { BookStoreItem, BookFormat } from "@/types/bookStore";
import LanguageSelectorDropdown from "@/components/LanguageSelectorDropdown";
import ThemeToggle from "@/components/ThemeToggle";

const BookStore = () => {
  const { t, dir, language } = useLanguage();
  const isRtl = dir === "rtl";
  const { toast } = useToast();
  const navigate = useNavigate();
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
    setSelectedBookForBuy(book);
    setSelectedFormat(defaultFormat);
  };

  const handleProceedToCartOrCheckout = () => {
    if (!selectedBookForBuy) return;
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

            <Link to="/book-store/cart">
              <Button size="sm" className="font-bold gap-1.5 h-9 bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-500/20">
                <ShoppingCart className="w-4 h-4" />
                <span>{isRtl ? "السلة" : "Cart"}</span>
              </Button>
            </Link>

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

      {/* Categories Filter Bar */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-8 pt-8 pb-4">
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
