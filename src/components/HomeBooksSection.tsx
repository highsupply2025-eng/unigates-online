import { useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useBooks } from "@/hooks/useBooks";
import { BookOpen, Star, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const categoryColors: Record<string, string> = {
  "تقنية": "from-cyan-800 to-cyan-600",
  "تصميم": "from-pink-800 to-pink-600",
  "تسويق": "from-amber-800 to-amber-600",
  "برمجة": "from-teal-800 to-teal-600",
  "أمن": "from-red-800 to-red-600",
  "بيانات": "from-emerald-800 to-emerald-600",
  "Technology": "from-cyan-800 to-cyan-600",
  "Design": "from-pink-800 to-pink-600",
  "Marketing": "from-amber-800 to-amber-600",
  "Programming": "from-teal-800 to-teal-600",
  "Security": "from-red-800 to-red-600",
  "Data": "from-emerald-800 to-emerald-600",
};

const HomeBooksSection = () => {
  const { t, language } = useLanguage();
  const { data: books } = useBooks();
  const isRtl = language === "ar";
  const scrollRef = useRef<HTMLDivElement>(null);

  const allFeaturedBooks = [
    ...(books?.filter((b) => b.is_new) ?? []),
    ...(books?.filter((b) => b.is_bestseller && !b.is_new) ?? []),
  ].slice(0, 12);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = 260;
    const dir = isRtl
      ? (direction === "left" ? scrollAmount : -scrollAmount)
      : (direction === "left" ? -scrollAmount : scrollAmount);
    scrollRef.current.scrollBy({ left: dir, behavior: "smooth" });
  };

  const isEmpty = !allFeaturedBooks.length;

  return (
    <section className="py-12 md:py-20 px-6 md:px-12">
      <div className="max-w-full mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-bold">
            📖 {t.homepage.newBooks} & {t.homepage.bestsellerBooks}
          </h2>
          <Link to="/book-store">
            <Button variant="outline" size="sm">{t.homepage.viewAll}</Button>
          </Link>
        </div>

        {isEmpty ? (
          <div className="flex justify-center">
            <div className="bg-card rounded-xl p-8 border-2 border-dashed border-border shadow-sm w-full max-w-sm text-center">
              <Clock className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-xl font-bold text-muted-foreground">
                {isRtl ? "قريباً" : "Coming Soon"}
              </p>
            </div>
          </div>
        ) : (
          <div className="relative flex items-center gap-2">
            <button
              onClick={() => scroll("left")}
              className="absolute -left-5 z-10 w-9 h-9 rounded-full border border-border bg-background/90 backdrop-blur-sm flex items-center justify-center hover:bg-accent transition-colors shadow-md"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>

            <div ref={scrollRef} className="flex gap-3 overflow-x-auto pb-4 px-2" style={{ scrollbarWidth: 'none' }}>
              {allFeaturedBooks.map((book) => (
                <div key={book.id} className="relative flex-shrink-0 w-[200px] md:w-[240px] group cursor-pointer card-hover">
                  <div className={`aspect-[3/4] rounded-lg bg-gradient-to-br ${categoryColors[book.category] || "from-slate-800 to-slate-600"} flex flex-col justify-between p-4 relative overflow-hidden`}>
                    {book.cover_url && (
                      <img
                        src={book.cover_url}
                        alt={isRtl ? book.title_ar : book.title_en}
                        className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-40 transition-opacity"
                      />
                    )}
                    <div className="flex justify-between items-start relative z-10">
                      <Badge className="bg-background/80 text-foreground text-xs backdrop-blur-sm hover:bg-background/80">
                        {book.category}
                      </Badge>
                      {book.is_bestseller && (
                        <Badge className="bg-primary/90 text-primary-foreground text-xs backdrop-blur-sm">
                          {isRtl ? "الأكثر طلباً" : "Bestseller"}
                        </Badge>
                      )}
                    </div>
                    <div className="relative z-10">
                      <p className="text-sm font-bold text-white leading-snug mb-2 line-clamp-2">
                        {isRtl ? book.title_ar : book.title_en}
                      </p>
                      <p className="text-xs text-white/70 mb-1">
                        {isRtl ? book.author_ar : book.author_en}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-white">
                          {book.price} {isRtl ? "ر.س" : "SAR"}
                        </span>
                        {book.rating > 0 && (
                          <span className="flex items-center gap-1 text-xs text-white/80">
                            <Star className="w-3 h-3 fill-current" /> {book.rating}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => scroll("right")}
              className="absolute -right-5 z-10 w-9 h-9 rounded-full border border-border bg-background/90 backdrop-blur-sm flex items-center justify-center hover:bg-accent transition-colors shadow-md"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-5 h-5 text-foreground" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default HomeBooksSection;
