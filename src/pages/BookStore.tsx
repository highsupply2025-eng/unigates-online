import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { useLanguage } from "@/contexts/LanguageContext";
import { BookOpen, Search, ShoppingCart, Star, Filter, Tag, Heart, Eye, Loader2, CheckCircle, Home, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useBooks } from "@/hooks/useBooks";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

import webdevBook from "@/assets/books/webdev-book.jpg";
import aiBook from "@/assets/books/ai-book.jpg";
import dataBook from "@/assets/books/data-book.jpg";
import marketingBook from "@/assets/books/marketing-book.jpg";
import designBook from "@/assets/books/design-book.jpg";
import securityBook from "@/assets/books/security-book.jpg";

const fallbackCovers: Record<string, string> = {
  programming: webdevBook,
  ai: aiBook,
  data: dataBook,
  marketing: marketingBook,
  design: designBook,
  security: securityBook,
};

const BookStore = () => {
  const { t, dir } = useLanguage();
  const isRtl = dir === "rtl";
  const { toast } = useToast();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [buyingBook, setBuyingBook] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [purchasing, setPurchasing] = useState(false);

  const { data: books, isLoading } = useBooks();

  const categories = [
    { id: "all", label: isRtl ? "الكل" : "All" },
    { id: "programming", label: isRtl ? "البرمجة" : "Programming" },
    { id: "ai", label: isRtl ? "الذكاء الاصطناعي" : "AI" },
    { id: "data", label: isRtl ? "علوم البيانات" : "Data Science" },
    { id: "marketing", label: isRtl ? "التسويق" : "Marketing" },
    { id: "design", label: isRtl ? "التصميم" : "Design" },
    { id: "security", label: isRtl ? "الأمن السيبراني" : "Cybersecurity" },
  ];

  const filteredBooks = (books ?? []).filter((book) => {
    const matchesCategory = selectedCategory === "all" || book.category === selectedCategory;
    const title = isRtl ? book.title_ar : book.title_en;
    const author = isRtl ? book.author_ar : book.author_en;
    const matchesSearch =
      title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      author.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const selectedBook = books?.find((b) => b.id === buyingBook);

  const handleBuy = async () => {
    if (!selectedBook) return;
    setPurchasing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setBuyingBook(null);
        setPurchasing(false);
        navigate("/book-store/login");
        return;
      }
      const { error } = await supabase.from("book_orders").insert({
        user_id: user.id,
        book_id: selectedBook.id,
        amount: selectedBook.price,
      });
      if (error) throw error;
      setOrderSuccess(true);
    } catch (err: any) {
      toast({
        title: isRtl ? "حدث خطأ" : "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setPurchasing(false);
    }
  };

  const stats = [
    { value: `${books?.length ?? 0}+`, label: isRtl ? "كتاب متاح" : "Books Available" },
    { value: "50K+", label: isRtl ? "قارئ" : "Readers" },
    { value: "4.8", label: isRtl ? "متوسط التقييم" : "Avg Rating" },
    { value: "30%", label: isRtl ? "خصم حصري" : "Exclusive Discount" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={dir}>
      {/* Hero */}
      <div className="bg-primary/90 pb-8">
        {/* Book Store Header with auth links */}
        <div className="px-6 py-3 flex items-center justify-between max-w-6xl mx-auto pt-6">
          <Link to="/book-store" className="flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-primary-foreground" />
            <span className="text-xl font-black text-primary-foreground">{t.bookStore}</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/book-store/login">
              <Button variant="outline" size="sm" className="font-semibold border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 gap-1.5">
                <LogIn className="w-4 h-4" />
                {t.login}
              </Button>
            </Link>
            <Link to="/book-store/signup">
              <Button variant="secondary" size="sm" className="font-semibold">
                {t.signup}
              </Button>
            </Link>
            <Link to="/">
              <Button variant="outline" size="sm" className="font-semibold border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 gap-1.5">
                <Home className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
        <div className="pt-8 pb-12 px-6 md:px-12 text-center max-w-5xl mx-auto">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-primary-foreground/10 flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-primary-foreground mb-3">
            {t.bookStore}
          </h1>
          <p className="text-primary-foreground/70 text-lg mb-8 max-w-2xl mx-auto">
            {isRtl
              ? "اكتشف مكتبتنا الرقمية الشاملة — كتب تعليمية متخصصة في التقنية والبرمجة والتصميم"
              : "Explore our comprehensive digital library — specialized educational books in tech, programming, and design"}
          </p>
          <div className="max-w-xl mx-auto relative">
            <Search className="absolute top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" style={{ [isRtl ? "right" : "left"]: "1rem" }} />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isRtl ? "ابحث عن كتاب أو مؤلف..." : "Search for a book or author..."}
              className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/40 h-12 rounded-xl"
              style={{ [isRtl ? "paddingRight" : "paddingLeft"]: "3rem" }}
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-card border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-2xl md:text-3xl font-black text-primary">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div className="max-w-6xl mx-auto px-6 pt-8 pb-4">
        <div className="flex items-center gap-2 mb-2">
          <Filter className="w-5 h-5 text-muted-foreground" />
          <span className="text-sm font-semibold text-muted-foreground">
            {isRtl ? "التصنيفات" : "Categories"}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat.id)}
              className="rounded-full"
            >
              {cat.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Books Grid */}
      <div className="flex-1 max-w-6xl mx-auto px-6 py-6">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-56 w-full" />
                <CardContent className="p-4 space-y-3">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-8 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBooks.map((book) => {
              const title = isRtl ? book.title_ar : book.title_en;
              const author = isRtl ? book.author_ar : book.author_en;
              const coverImg = book.cover_url || fallbackCovers[book.category] || webdevBook;
              const discount = book.original_price && book.original_price > book.price
                ? Math.round(((book.original_price - book.price) / book.original_price) * 100)
                : 0;

              return (
                <Card key={book.id} className="group overflow-hidden hover:shadow-lg transition-shadow border-border">
                  <div className="relative overflow-hidden">
                    <img src={coverImg} alt={title} className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute top-3 flex gap-1.5" style={{ [isRtl ? "right" : "left"]: "0.75rem" }}>
                      {book.is_bestseller && (
                        <Badge className="bg-amber-500 text-primary-foreground text-xs">
                          {isRtl ? "الأكثر مبيعاً" : "Bestseller"}
                        </Badge>
                      )}
                      {book.is_new && (
                        <Badge className="bg-emerald-500 text-primary-foreground text-xs">
                          {isRtl ? "جديد" : "New"}
                        </Badge>
                      )}
                    </div>
                    <button className="absolute top-3 bg-background/80 backdrop-blur-sm p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" style={{ [isRtl ? "left" : "right"]: "0.75rem" }}>
                      <Heart className="w-4 h-4 text-destructive" />
                    </button>
                    {discount > 0 && (
                      <div className="absolute bottom-3 bg-destructive text-destructive-foreground text-xs font-bold px-2 py-1 rounded" style={{ [isRtl ? "left" : "right"]: "0.75rem" }}>
                        -{discount}%
                      </div>
                    )}
                  </div>

                  <CardContent className="p-4">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Tag className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {categories.find((c) => c.id === book.category)?.label}
                      </span>
                    </div>
                    <h3 className="font-bold text-foreground leading-tight mb-1 line-clamp-2 min-h-[2.5rem]">{title}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{author}</p>
                    <div className="flex items-center gap-1 mb-3">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span className="text-sm font-semibold text-foreground">{book.rating}</span>
                      <span className="text-xs text-muted-foreground">({book.reviews_count})</span>
                      <span className="mx-1 text-border">•</span>
                      <span className="text-xs text-muted-foreground">{book.pages} {isRtl ? "صفحة" : "pages"}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mb-3">
                      <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{book.format}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-black text-primary">${book.price}</span>
                        {discount > 0 && (
                          <span className="text-sm text-muted-foreground line-through">${book.original_price}</span>
                        )}
                      </div>
                      <Button size="sm" className="rounded-full gap-1.5" onClick={() => { setBuyingBook(book.id); setOrderSuccess(false); }}>
                        <ShoppingCart className="w-4 h-4" />
                        {isRtl ? "شراء" : "Buy"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {!isLoading && filteredBooks.length === 0 && (
          <div className="text-center py-20">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-lg font-semibold text-muted-foreground">
              {isRtl ? "لا توجد كتب مطابقة للبحث" : "No books match your search"}
            </p>
          </div>
        )}
      </div>

      {/* Purchase Dialog */}
      <Dialog open={!!buyingBook} onOpenChange={(open) => { if (!open) { setBuyingBook(null); setOrderSuccess(false); } }}>
        <DialogContent className="sm:max-w-md" dir={dir}>
          {orderSuccess ? (
            <div className="text-center py-6 space-y-4">
              <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto" />
              <DialogTitle className="text-xl font-bold">
                {isRtl ? "تم الشراء بنجاح!" : "Purchase Successful!"}
              </DialogTitle>
              <DialogDescription>
                {isRtl ? "شكراً لك! تم تسجيل طلبك بنجاح وسيتم إرسال الكتاب إليك قريباً." : "Thank you! Your order has been recorded and the book will be sent to you soon."}
              </DialogDescription>
              <Button onClick={() => { setBuyingBook(null); setOrderSuccess(false); }} className="rounded-full">
                {isRtl ? "متابعة التصفح" : "Continue Browsing"}
              </Button>
            </div>
          ) : selectedBook ? (
            <>
              <DialogHeader>
                <DialogTitle>{isRtl ? "تأكيد الشراء" : "Confirm Purchase"}</DialogTitle>
                <DialogDescription>
                  {isRtl ? "راجع تفاصيل الكتاب قبل إتمام الشراء" : "Review book details before completing purchase"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="flex gap-4">
                  <img
                    src={selectedBook.cover_url || fallbackCovers[selectedBook.category] || webdevBook}
                    alt={isRtl ? selectedBook.title_ar : selectedBook.title_en}
                    className="w-20 h-28 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h3 className="font-bold text-foreground">{isRtl ? selectedBook.title_ar : selectedBook.title_en}</h3>
                    <p className="text-sm text-muted-foreground">{isRtl ? selectedBook.author_ar : selectedBook.author_en}</p>
                    <p className="text-sm text-muted-foreground mt-1">{selectedBook.format} • {selectedBook.pages} {isRtl ? "صفحة" : "pages"}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xl font-black text-primary">${selectedBook.price}</span>
                      {selectedBook.original_price && selectedBook.original_price > selectedBook.price && (
                        <span className="text-sm text-muted-foreground line-through">${selectedBook.original_price}</span>
                      )}
                    </div>
                  </div>
                </div>
                {(isRtl ? selectedBook.description_ar : selectedBook.description_en) && (
                  <p className="text-sm text-muted-foreground border-t border-border pt-3">
                    {isRtl ? selectedBook.description_ar : selectedBook.description_en}
                  </p>
                )}
                <Button onClick={handleBuy} disabled={purchasing} className="w-full rounded-full gap-2">
                  {purchasing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingCart className="w-4 h-4" />}
                  {purchasing
                    ? (isRtl ? "جارٍ المعالجة..." : "Processing...")
                    : (isRtl ? `شراء الآن - $${selectedBook.price}` : `Buy Now - $${selectedBook.price}`)}
                </Button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* CTA */}
      <div className="bg-primary/5 border-t border-border">
        <div className="max-w-4xl mx-auto px-6 py-12 text-center">
          <h2 className="text-2xl md:text-3xl font-black text-foreground mb-3">
            {isRtl ? "هل أنت مؤلف؟ انشر كتابك معنا" : "Are you an author? Publish with us"}
          </h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            {isRtl
              ? "انضم إلى مجتمع المؤلفين لدينا وشارك معرفتك مع آلاف القراء"
              : "Join our author community and share your knowledge with thousands of readers"}
          </p>
          <Button size="lg" className="rounded-full px-8">
            {isRtl ? "تواصل معنا" : "Contact Us"}
          </Button>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
};

export default BookStore;
