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
  Target
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/contexts/LanguageContext";
import { BookStoreDataStore } from "@/services/bookStoreDataStore";
import { PurchasedBook, BookOrder } from "@/types/bookStore";
import { ReaderEbookModal } from "@/components/bookstore/ReaderEbookModal";
import SiteFooter from "@/components/SiteFooter";
import LanguageSelectorDropdown from "@/components/LanguageSelectorDropdown";
import ThemeToggle from "@/components/ThemeToggle";

export const ReaderDashboard: React.FC = () => {
  const { dir, language } = useLanguage();
  const isRtl = dir === "rtl";
  const navigate = useNavigate();

  const [purchasedBooks, setPurchasedBooks] = useState<PurchasedBook[]>(
    BookStoreDataStore.getPurchasedBooks()
  );
  const [orders, setOrders] = useState<BookOrder[]>(BookStoreDataStore.getOrders());
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("library");

  // Selected Book for DRM Reader
  const [readingBook, setReadingBook] = useState<PurchasedBook | null>(null);

  // Reading Goal
  const readingGoal = BookStoreDataStore.getReadingGoal();
  const wishlistIds = BookStoreDataStore.getWishlist();
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
  const completedBooks = purchasedBooks.filter((p) => (p.lastReadProgress || 0) >= 100).length;

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={dir}>
      {/* Top Header */}
      <header className="border-b border-border/40 px-4 sm:px-8 py-3.5 bg-card/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link to="/book-store" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-600 to-red-600 p-0.5 shadow-md flex items-center justify-center text-white">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg sm:text-xl font-black text-foreground">
                  UNIGATES
                </span>
                <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                  {isRtl ? "مكتبتي الرقمية ومشترياتي" : "My Reader Portal & Library"}
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

      {/* Hero Reader Stats */}
      <section className="bg-gradient-to-b from-amber-500/10 via-background to-background py-8 px-4 sm:px-8 border-b border-border/40">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30">
                  {isRtl ? "حساب قارئ معتمد" : "Verified Reader Account"}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  DRM Protected
                </Badge>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-foreground">
                {isRtl ? "أهلاً بك في مكتبتك الخاصة 📚" : "Welcome to Your Personal Library 📚"}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {isRtl
                  ? "جميع كتبك الرقمية متاحة للقراءة الفورية والأوفلاين مع حماية DRM المشفرة."
                  : "All your digital purchases are ready for instant & offline DRM-encrypted reading."}
              </p>
            </div>

            {/* Reading Challenge Goal Card */}
            <Card className="bg-card/80 border-amber-500/30 shadow-md p-4 w-full md:w-80 shrink-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold text-foreground">
                    {isRtl ? "تحدي القراءة السنوي" : "Annual Reading Goal"}
                  </span>
                </div>
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                  {completedBooks} / {readingGoal.targetBooks} {isRtl ? "كتب" : "books"}
                </span>
              </div>
              <Progress value={(completedBooks / (readingGoal.targetBooks || 1)) * 100} className="h-2 bg-amber-500/20" />
              <p className="text-[11px] text-muted-foreground mt-2">
                {isRtl ? "أنجزت 45 دقيقة قراءة هذا الأسبوع • استمر!" : "45 mins read this week • Keep it up!"}
              </p>
            </Card>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold">{isRtl ? "الكتب المكتملة" : "Completed"}</p>
                <p className="text-xl font-black text-foreground">{completedBooks}</p>
              </div>
            </Card>

            <Card className="bg-card/60 border-border/60 p-3.5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-600 flex items-center justify-center shrink-0">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold">{isRtl ? "إجمالي الطلبات" : "Total Orders"}</p>
                <p className="text-xl font-black text-foreground">{orders.length}</p>
              </div>
            </Card>

            <Card className="bg-card/60 border-border/60 p-3.5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-600 flex items-center justify-center shrink-0">
                <Heart className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold">{isRtl ? "قائمة الرغبات" : "Wishlist"}</p>
                <p className="text-xl font-black text-foreground">{wishlistBooks.length}</p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Main Content Tabs */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-8 py-8 space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
            <TabsList className="bg-muted/80 p-1 rounded-2xl h-11">
              <TabsTrigger value="library" className="font-bold text-xs sm:text-sm rounded-xl gap-2">
                <Library className="w-4 h-4" />
                <span>{isRtl ? "مكتبتي الرقمية (القراءة)" : "My E-Library"}</span>
                <Badge variant="secondary" className="text-[10px] px-1.5 h-4">
                  {purchasedBooks.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="purchases" className="font-bold text-xs sm:text-sm rounded-xl gap-2">
                <ShoppingBag className="w-4 h-4" />
                <span>{isRtl ? "سجل المشتريات والفواتير" : "Purchases & Invoices"}</span>
                <Badge variant="secondary" className="text-[10px] px-1.5 h-4">
                  {orders.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="wishlist" className="font-bold text-xs sm:text-sm rounded-xl gap-2">
                <Heart className="w-4 h-4" />
                <span>{isRtl ? "قائمة الرغبات" : "Wishlist"}</span>
                <Badge variant="secondary" className="text-[10px] px-1.5 h-4">
                  {wishlistBooks.length}
                </Badge>
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

          {/* TAB 2: Purchases and Invoices */}
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

                    {/* Order items list */}
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

          {/* TAB 3: Wishlist */}
          <TabsContent value="wishlist" className="space-y-4 mt-0">
            {wishlistBooks.length === 0 ? (
              <Card className="text-center p-12 border-dashed">
                <Heart className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-base font-bold text-foreground mb-1">
                  {isRtl ? "قائمة رغباتك فارغة" : "Wishlist is Empty"}
                </h3>
                <p className="text-xs text-muted-foreground mb-4">
                  {isRtl ? "أضف كتباً إلى قائمة الرغبات لحفظها وشرائها لاحقاً." : "Save books to your wishlist to buy later."}
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
                  <Card key={b.id} className="p-4 flex gap-4 items-center">
                    <img src={b.cover_url} alt={b.title_ar} className="w-16 h-22 object-cover rounded-lg shadow-xs" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-black truncate">{isRtl ? b.title_ar : b.title_en}</h4>
                      <p className="text-xs text-muted-foreground truncate">{isRtl ? b.author_ar : b.author_en}</p>
                      <p className="text-xs font-bold text-amber-600 mt-1">{b.price_digital} EGP</p>
                      <Link to={`/book-store/catalog?id=${b.id}`}>
                        <Button size="sm" variant="default" className="mt-2 h-7 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white">
                          {isRtl ? "شراء الآن" : "Buy Now"}
                        </Button>
                      </Link>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

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
