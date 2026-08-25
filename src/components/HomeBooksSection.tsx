import { useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useBooks } from "@/hooks/useBooks";
import { Star, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

import bookBg1 from "@/assets/book-bg-1.jpg";
import bookBg2 from "@/assets/book-bg-2.jpg";

const bookImages = [bookBg1, bookBg2];

const HomeBooksSection = () => {
  const { language, dir } = useLanguage();
  const { data: books } = useBooks();
  const isRtl = dir === "rtl";
  const scrollRef = useRef<HTMLDivElement>(null);

  const allFeaturedBooks = [
    ...(books?.filter((b) => b.is_new) ?? []),
    ...(books?.filter((b) => b.is_bestseller && !b.is_new) ?? []),
  ].slice(0, 12);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = 280;
    const dir = isRtl
      ? (direction === "left" ? scrollAmount : -scrollAmount)
      : (direction === "left" ? -scrollAmount : scrollAmount);
    scrollRef.current.scrollBy({ left: dir, behavior: "smooth" });
  };

  const isEmpty = !allFeaturedBooks.length;
  const { ref: animRef, isVisible } = useScrollAnimation();

  return (
    <section ref={animRef} className={`py-6 md:py-10 px-6 md:px-12 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
      <div className="max-w-full mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Link to="/book-store" className="text-2xl md:text-3xl font-bold text-primary hover:opacity-80 transition-opacity">
            📖 {isRtl ? "الكتب" : "Books"}
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
            <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-4 px-2" style={{ scrollbarWidth: 'none' }}>
              {allFeaturedBooks.map((book, i) => (
                <div key={book.id} className="relative flex-shrink-0 w-[180px] md:w-[210px] group cursor-pointer card-hover">
                  <div className="aspect-[3/4] rounded-xl overflow-hidden relative shadow-lg group-hover:shadow-xl transition-shadow">
                    <img
                      src={book.cover_url || bookImages[i % bookImages.length]}
                      alt={isRtl ? book.title_ar : book.title_en}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="flex justify-between items-start absolute top-3 left-3 right-3 z-10">
                      <Badge className="bg-background/80 text-foreground text-xs backdrop-blur-sm hover:bg-background/80">
                        {book.category}
                      </Badge>
                      {book.is_bestseller && (
                        <Badge className="bg-primary/90 text-primary-foreground text-xs backdrop-blur-sm">
                          {isRtl ? "الأكثر طلباً" : "Bestseller"}
                        </Badge>
                      )}
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
                      <p className="text-sm font-bold text-white leading-snug mb-2 line-clamp-2">
                        {isRtl ? book.title_ar : book.title_en}
                      </p>
                      <p className="text-xs text-white/80 mb-1">
                        {isRtl ? book.author_ar : book.author_en}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-white">
                          {book.price} {isRtl ? "ر.س" : "SAR"}
                        </span>
                        {book.rating && book.rating > 0 && (
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
          </div>

        )}
      </div>
    </section>
  );
};

export default HomeBooksSection;
