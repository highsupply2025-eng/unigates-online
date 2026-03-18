import { useLanguage } from "@/contexts/LanguageContext";
import { useBooks } from "@/hooks/useBooks";
import { BookOpen, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const HomeBooksSection = () => {
  const { t, language } = useLanguage();
  const { data: books } = useBooks();
  const isRtl = language === "ar";

  const allFeaturedBooks = [
    ...(books?.filter((b) => b.is_new) ?? []),
    ...(books?.filter((b) => b.is_bestseller && !b.is_new) ?? []),
  ].slice(0, 8);

  if (!books?.length) return null;

  const BookCard = ({ book }: { book: typeof newBooks[0] }) => (
    <div className="bg-card rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow border border-border group">
      {book.cover_url ? (
        <img src={book.cover_url} alt={isRtl ? book.title_ar : book.title_en} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" />
      ) : (
        <div className="w-full h-48 bg-muted flex items-center justify-center">
          <BookOpen className="w-12 h-12 text-muted-foreground" />
        </div>
      )}
      <div className="p-4">
        <h3 className="font-bold text-sm line-clamp-1">{isRtl ? book.title_ar : book.title_en}</h3>
        <p className="text-xs text-muted-foreground mt-1">{isRtl ? book.author_ar : book.author_en}</p>
        <div className="flex items-center justify-between mt-3">
          <span className="text-primary font-bold">{book.price} {isRtl ? "ر.س" : "SAR"}</span>
          {book.rating > 0 && (
            <span className="flex items-center gap-1 text-xs text-amber-500">
              <Star className="w-3 h-3 fill-current" /> {book.rating}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <section className="py-12 px-6 md:px-12">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* New Books */}
        {newBooks.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">{t.homepage.newBooks}</h2>
              <Link to="/book-store">
                <Button variant="outline" size="sm">{t.homepage.viewAll}</Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {newBooks.map((book) => <BookCard key={book.id} book={book} />)}
            </div>
          </div>
        )}

        {/* Bestsellers */}
        {bestsellerBooks.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">{t.homepage.bestsellerBooks}</h2>
              <Link to="/book-store">
                <Button variant="outline" size="sm">{t.homepage.viewAll}</Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {bestsellerBooks.map((book) => <BookCard key={book.id} book={book} />)}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default HomeBooksSection;
