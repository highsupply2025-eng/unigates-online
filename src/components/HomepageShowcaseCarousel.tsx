import { useRef, useEffect, useState, memo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

interface ShowcaseItem {
  id: string;
  title: string;
  subtitle?: string;
  image: string;
  badge?: string;
  badgeColor?: string;
}

interface HomepageShowcaseCarouselProps {
  title: string;
  emoji: string;
  items: ShowcaseItem[];
  isRtl: boolean;
  autoScrollSpeed?: number;
}

const ShowcaseCard = memo(({ item }: { item: ShowcaseItem }) => (
  <div className="relative flex-shrink-0 w-[220px] md:w-[260px] group cursor-pointer">
    <div className="aspect-video rounded-xl overflow-hidden relative shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-[1.03]">
      <img
        src={item.image}
        alt={item.title}
        className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
      {item.badge && (
        <div className="absolute top-3 left-3 z-10">
          <span
            className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold text-white backdrop-blur-sm ${
              item.badgeColor || "bg-primary/90"
            }`}
          >
            {item.badge}
          </span>
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
        <p className="text-sm font-bold text-white leading-snug mb-1 line-clamp-2">
          {item.title}
        </p>
        {item.subtitle && (
          <p className="text-xs text-white/80">{item.subtitle}</p>
        )}
      </div>
    </div>
  </div>
));

ShowcaseCard.displayName = "ShowcaseCard";

const HomepageShowcaseCarousel = ({
  title,
  emoji,
  items,
  isRtl,
  autoScrollSpeed = 30,
}: HomepageShowcaseCarouselProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isPausedRef = useRef(false);
  const { ref, isVisible } = useScrollAnimation();

  // Use requestAnimationFrame instead of setInterval for smooth, efficient scrolling
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !isVisible) return;

    let frameId: number;
    let lastTime = 0;
    // Convert speed to pixels per second (lower autoScrollSpeed = faster interval = faster scroll)
    const pixelsPerSecond = 1000 / autoScrollSpeed;

    const tick = (now: number) => {
      if (!isPausedRef.current) {
        const delta = lastTime ? (now - lastTime) / 1000 : 0;
        const px = delta * pixelsPerSecond;
        
        if (px > 0) {
          const maxScroll = el.scrollWidth - el.clientWidth;
          if (el.scrollLeft >= maxScroll - 2) {
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
  }, [isVisible, isRtl, autoScrollSpeed]);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = 300;
    const dir = isRtl
      ? direction === "left" ? amount : -amount
      : direction === "left" ? -amount : amount;
    scrollRef.current.scrollBy({ left: dir, behavior: "smooth" });
  };

  return (
    <section
      ref={ref}
      className={`py-8 md:py-12 px-6 md:px-12 transition-all duration-700 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
    >
      <div className="max-w-full mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold mb-6 text-primary">
          {emoji} {title}
        </h2>

        <div
          className="relative"
          onMouseEnter={() => { isPausedRef.current = true; }}
          onMouseLeave={() => { isPausedRef.current = false; }}
          onTouchStart={() => { isPausedRef.current = true; }}
          onTouchEnd={() => { setTimeout(() => { isPausedRef.current = false; }, 2000); }}
        >
          <button
            onClick={() => scroll("left")}
            className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full border border-border bg-background/90 backdrop-blur-sm flex items-center justify-center hover:bg-accent transition-colors shadow-md"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>

          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto pb-4 px-2"
            style={{ scrollbarWidth: "none" }}
          >
            {items.map((item) => (
              <ShowcaseCard key={item.id} item={item} />
            ))}
          </div>

          <button
            onClick={() => scroll("right")}
            className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full border border-border bg-background/90 backdrop-blur-sm flex items-center justify-center hover:bg-accent transition-colors shadow-md"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5 text-foreground" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default memo(HomepageShowcaseCarousel);
