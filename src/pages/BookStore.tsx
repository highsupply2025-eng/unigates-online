import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { useLanguage } from "@/contexts/LanguageContext";
import { BookOpen, Search, ShoppingCart, Star, Filter, Tag, Heart, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState } from "react";

import webdevBook from "@/assets/books/webdev-book.jpg";
import aiBook from "@/assets/books/ai-book.jpg";
import dataBook from "@/assets/books/data-book.jpg";
import marketingBook from "@/assets/books/marketing-book.jpg";
import designBook from "@/assets/books/design-book.jpg";
import securityBook from "@/assets/books/security-book.jpg";

const BookStore = () => {
  const { t, dir } = useLanguage();
  const isRtl = dir === "rtl";
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const categories = [
    { id: "all", label: isRtl ? "الكل" : "All" },
    { id: "programming", label: isRtl ? "البرمجة" : "Programming" },
    { id: "ai", label: isRtl ? "الذكاء الاصطناعي" : "AI" },
    { id: "data", label: isRtl ? "علوم البيانات" : "Data Science" },
    { id: "marketing", label: isRtl ? "التسويق" : "Marketing" },
    { id: "design", label: isRtl ? "التصميم" : "Design" },
    { id: "security", label: isRtl ? "الأمن السيبراني" : "Cybersecurity" },
  ];

  const books = [
    {
      id: 1,
      title: isRtl ? "أساسيات تطوير الويب الحديث" : "Modern Web Development Fundamentals",
      author: isRtl ? "أحمد محمد" : "Ahmed Mohamed",
      price: 29.99,
      originalPrice: 49.99,
      rating: 4.8,
      reviews: 234,
      image: webdevBook,
      category: "programming",
      isBestseller: true,
      isNew: false,
      pages: 450,
      format: isRtl ? "PDF + كتاب ورقي" : "PDF + Paperback",
    },
    {
      id: 2,
      title: isRtl ? "الذكاء الاصطناعي: من المبتدئ إلى المحترف" : "AI: From Beginner to Pro",
      author: isRtl ? "سارة أحمد" : "Sara Ahmed",
      price: 34.99,
      originalPrice: 59.99,
      rating: 4.9,
      reviews: 189,
      image: aiBook,
      category: "ai",
      isBestseller: true,
      isNew: true,
      pages: 520,
      format: isRtl ? "PDF + كتاب ورقي" : "PDF + Paperback",
    },
    {
      id: 3,
      title: isRtl ? "تحليل البيانات باستخدام بايثون" : "Data Analysis with Python",
      author: isRtl ? "محمد علي" : "Mohamed Ali",
      price: 24.99,
      originalPrice: 39.99,
      rating: 4.7,
      reviews: 156,
      image: dataBook,
      category: "data",
      isBestseller: false,
      isNew: false,
      pages: 380,
      format: isRtl ? "PDF" : "PDF",
    },
    {
      id: 4,
      title: isRtl ? "التسويق الرقمي الشامل" : "Complete Digital Marketing",
      author: isRtl ? "فاطمة حسن" : "Fatima Hassan",
      price: 19.99,
      originalPrice: 34.99,
      rating: 4.6,
      reviews: 312,
      image: marketingBook,
      category: "marketing",
      isBestseller: true,
      isNew: false,
      pages: 290,
      format: isRtl ? "PDF + كتاب ورقي" : "PDF + Paperback",
    },
    {
      id: 5,
      title: isRtl ? "تصميم واجهات المستخدم UI/UX" : "UI/UX Design Mastery",
      author: isRtl ? "ليلى عبدالله" : "Layla Abdullah",
      price: 27.99,
      originalPrice: 44.99,
      rating: 4.8,
      reviews: 198,
      image: designBook,
      category: "design",
      isBestseller: false,
      isNew: true,
      pages: 340,
      format: isRtl ? "PDF" : "PDF",
    },
    {
      id: 6,
      title: isRtl ? "الأمن السيبراني وحماية المعلومات" : "Cybersecurity & Information Protection",
      author: isRtl ? "خالد عمر" : "Khaled Omar",
      price: 32.99,
      originalPrice: 54.99,
      rating: 4.9,
      reviews: 145,
      image: securityBook,
      category: "security",
      isBestseller: false,
      isNew: true,
      pages: 480,
      format: isRtl ? "PDF + كتاب ورقي" : "PDF + Paperback",
    },
  ];

  const filteredBooks = books.filter((book) => {
    const matchesCategory = selectedCategory === "all" || book.category === selectedCategory;
    const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const stats = [
    { value: "500+", label: isRtl ? "كتاب متاح" : "Books Available" },
    { value: "50K+", label: isRtl ? "قارئ" : "Readers" },
    { value: "4.8", label: isRtl ? "متوسط التقييم" : "Avg Rating" },
    { value: "30%", label: isRtl ? "خصم حصري" : "Exclusive Discount" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={dir}>
      {/* Hero */}
      <div className="bg-primary/90 pb-8">
        <SiteHeader />
        <div className="pt-28 pb-12 px-6 md:px-12 text-center max-w-5xl mx-auto">
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

          {/* Search */}
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

      {/* Categories Filter */}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBooks.map((book) => (
            <Card key={book.id} className="group overflow-hidden hover:shadow-lg transition-shadow border-border">
              {/* Image */}
              <div className="relative overflow-hidden">
                <img
                  src={book.image}
                  alt={book.title}
                  className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 flex gap-1.5" style={{ [isRtl ? "right" : "left"]: "0.75rem" }}>
                  {book.isBestseller && (
                    <Badge className="bg-amber-500 text-primary-foreground text-xs">
                      {isRtl ? "الأكثر مبيعاً" : "Bestseller"}
                    </Badge>
                  )}
                  {book.isNew && (
                    <Badge className="bg-emerald-500 text-primary-foreground text-xs">
                      {isRtl ? "جديد" : "New"}
                    </Badge>
                  )}
                </div>
                <button className="absolute top-3 bg-background/80 backdrop-blur-sm p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" style={{ [isRtl ? "left" : "right"]: "0.75rem" }}>
                  <Heart className="w-4 h-4 text-destructive" />
                </button>

                {/* Discount badge */}
                {book.originalPrice > book.price && (
                  <div className="absolute bottom-3 bg-destructive text-destructive-foreground text-xs font-bold px-2 py-1 rounded" style={{ [isRtl ? "left" : "right"]: "0.75rem" }}>
                    -{Math.round(((book.originalPrice - book.price) / book.originalPrice) * 100)}%
                  </div>
                )}
              </div>

              <CardContent className="p-4">
                {/* Category */}
                <div className="flex items-center gap-1.5 mb-2">
                  <Tag className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {categories.find((c) => c.id === book.category)?.label}
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-bold text-foreground leading-tight mb-1 line-clamp-2 min-h-[2.5rem]">
                  {book.title}
                </h3>

                {/* Author */}
                <p className="text-sm text-muted-foreground mb-2">{book.author}</p>

                {/* Rating */}
                <div className="flex items-center gap-1 mb-3">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="text-sm font-semibold text-foreground">{book.rating}</span>
                  <span className="text-xs text-muted-foreground">({book.reviews})</span>
                  <span className="mx-1 text-border">•</span>
                  <span className="text-xs text-muted-foreground">{book.pages} {isRtl ? "صفحة" : "pages"}</span>
                </div>

                {/* Format */}
                <div className="flex items-center gap-1.5 mb-3">
                  <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{book.format}</span>
                </div>

                {/* Price & CTA */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black text-primary">${book.price}</span>
                    {book.originalPrice > book.price && (
                      <span className="text-sm text-muted-foreground line-through">${book.originalPrice}</span>
                    )}
                  </div>
                  <Button size="sm" className="rounded-full gap-1.5">
                    <ShoppingCart className="w-4 h-4" />
                    {isRtl ? "شراء" : "Buy"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredBooks.length === 0 && (
          <div className="text-center py-20">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-lg font-semibold text-muted-foreground">
              {isRtl ? "لا توجد كتب مطابقة للبحث" : "No books match your search"}
            </p>
          </div>
        )}
      </div>

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
