import { useRef, useEffect, memo } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, ArrowLeft, ArrowRight, Star, CheckCircle2, Eye, BookOpen, GraduationCap, School, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

export interface ShowcaseItem {
  id: string;
  title: string;
  subtitle?: string;
  image: string;
  badge?: string;
  badgeColor?: string;
  href?: string;
  extra?: string;
  meta?: string;
}

interface HomepageShowcaseCarouselProps {
  title: string;
  emoji: string;
  items: ShowcaseItem[];
  isRtl: boolean;
  viewAllLink?: string;
  viewAllText?: string;
  autoScrollSpeed?: number;
}

const ShowcaseCard = memo(({ item }: { item: ShowcaseItem }) => {
  const cardContent = (
    <div className="group relative w-[280px] sm:w-[320px] rounded-3xl overflow-hidden border-2 border-border/80 hover:border-primary/60 bg-card hover:bg-card/90 shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col justify-between cursor-pointer">
      {/* Cover Image Container */}
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        <img
          src={item.image}
          alt={item.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

        {/* Floating Category Badge */}
        {item.badge && (
          <div className="absolute top-3 start-3 z-10">
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-black text-white shadow-md backdrop-blur-md ${
                item.badgeColor || "bg-primary/90"
              }`}
            >
              {item.badge}
            </span>
          </div>
        )}

        {/* Verified Indicator on Top End */}
        <div className="absolute top-3 end-3 z-10">
          <span className="w-7 h-7 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </span>
        </div>

        {/* Floating Bottom Metadata */}
        <div className="absolute bottom-3 start-3 end-3 z-10 text-start">
          <p className="text-sm sm:text-base font-black text-white leading-tight line-clamp-1 group-hover:text-amber-300 transition-colors drop-shadow">
            {item.title}
          </p>
          {item.subtitle && (
            <p className="text-xs font-medium text-slate-200 line-clamp-1 mt-0.5 drop-shadow">
              {item.subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Card Details Footer */}
      <div className="p-4 flex items-center justify-between gap-2 border-t border-border/50 bg-card text-xs font-bold">
        <div className="flex items-center gap-2 min-w-0">
          {item.extra ? (
            <span className="text-amber-500 font-black flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-amber-500" />
              <span>{item.extra}</span>
            </span>
          ) : item.meta ? (
            <span className="text-muted-foreground truncate">{item.meta}</span>
          ) : (
            <span className="text-primary font-bold">معتمد رسمياً ✓</span>
          )}
        </div>

        <div className="flex items-center gap-1 text-primary group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform">
          <span className="text-xs font-black">استكشف</span>
          <ArrowLeft className="w-3.5 h-3.5 rtl:block hidden" />
          <ArrowRight className="w-3.5 h-3.5 rtl:hidden block" />
        </div>
      </div>
    </div>
  );

  if (item.href) {
    return (
      <Link to={item.href} className="flex-shrink-0">
        {cardContent}
      </Link>
    );
  }

  return <div className="flex-shrink-0">{cardContent}</div>;
});

ShowcaseCard.displayName = "ShowcaseCard";

const HomepageShowcaseCarousel = ({
  title,
  emoji,
  items,
  isRtl,
  viewAllLink,
  viewAllText,
  autoScrollSpeed = 65,
}: HomepageShowcaseCarouselProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isPausedRef = useRef(false);
  const { ref, isVisible } = useScrollAnimation();

  // Smooth scroll handler for manual arrows
  const scrollByOffset = (offset: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: isRtl ? -offset : offset, behavior: "smooth" });
    }
  };

  // Auto-scroll loop when visible
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !isVisible || items.length === 0) return;

    let frameId: number;
    let lastTime = 0;
    const pixelsPerSecond = 3200 / autoScrollSpeed;

    const tick = (now: number) => {
      if (!isPausedRef.current) {
        const delta = lastTime ? (now - lastTime) / 1000 : 0;
        const px = delta * pixelsPerSecond;

        if (px > 0) {
          const maxScroll = el.scrollWidth - el.clientWidth;
          if (Math.abs(el.scrollLeft) >= maxScroll - 4) {
            el.scrollLeft = 0;
          } else {
            el.scrollLeft += isRtl ? -px : px;
          }
        }
      }
      lastTime = now;
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [isVisible, isRtl, autoScrollSpeed, items.length]);

  if (items.length === 0) return null;

  return (
    <section
      ref={ref}
      className={`py-8 sm:py-12 px-4 sm:px-6 md:px-12 transition-all duration-700 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
    >
      <div className="max-w-7xl mx-auto space-y-5">
        {/* Header with Title, Actions, and Navigation Arrows */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl sm:text-3xl">{emoji}</span>
            <div>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-foreground tracking-tight">
                {title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {viewAllLink && (
              <Link to={viewAllLink}>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-2xl font-bold text-xs h-9 px-4 border-2 border-border hover:border-primary/50 hover:bg-primary/5 gap-1.5"
                >
                  <span>{viewAllText || (isRtl ? "عرض الكل" : "View All")}</span>
                  {isRtl ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                </Button>
              </Link>
            )}

            {/* Carousel Arrow Controls */}
            <div className="hidden sm:flex items-center gap-1.5">
              <Button
                variant="outline"
                size="icon"
                onClick={() => scrollByOffset(-340)}
                className="w-9 h-9 rounded-xl border-2 border-border hover:border-primary/50"
                aria-label="Scroll backward"
              >
                {isRtl ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => scrollByOffset(340)}
                className="w-9 h-9 rounded-xl border-2 border-border hover:border-primary/50"
                aria-label="Scroll forward"
              >
                {isRtl ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Carousel Container (Zero empty boxes!) */}
        <div
          ref={scrollRef}
          onMouseEnter={() => { isPausedRef.current = true; }}
          onMouseLeave={() => { isPausedRef.current = false; }}
          onTouchStart={() => { isPausedRef.current = true; }}
          onTouchEnd={() => { isPausedRef.current = false; }}
          className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 pt-1 scrollbar-none snap-x"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {items.map((item) => (
            <ShowcaseCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default HomepageShowcaseCarousel;
