import { useRef, useEffect, memo } from "react";
import { Link } from "react-router-dom";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

interface ShowcaseItem {
  id: string;
  title: string;
  subtitle?: string;
  image: string;
  badge?: string;
  badgeColor?: string;
  href?: string;
  extra?: string;
}

interface HomepageShowcaseCarouselProps {
  title: string;
  emoji: string;
  items: ShowcaseItem[];
  isRtl: boolean;
  autoScrollSpeed?: number;
}

const comingSoonGradients = [
  "from-primary/15 to-primary/5",
  "from-indigo-200/30 to-indigo-100/10",
  "from-orange-200/30 to-orange-100/10",
  "from-emerald-200/30 to-emerald-100/10",
  "from-amber-200/30 to-amber-100/10",
];

const ShowcaseCard = memo(({ item }: { item: ShowcaseItem }) => {
  const card = (
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
        <p className="text-sm font-bold text-white leading-snug mb-0.5 line-clamp-2">
          {item.title}
        </p>
        {item.subtitle && (
          <p className="text-xs text-white/80 leading-tight mb-0.5 line-clamp-1">{item.subtitle}</p>
        )}
        {item.extra && (
          <p className="text-xs font-semibold text-amber-300">{item.extra}</p>
        )}
      </div>
    </div>
  );

  if (item.href) {
    return (
      <Link to={item.href} className="relative flex-shrink-0 w-[220px] md:w-[260px] group">
        {card}
      </Link>
    );
  }

  return <div className="relative flex-shrink-0 w-[220px] md:w-[260px] group cursor-pointer">{card}</div>;
});

ShowcaseCard.displayName = "ShowcaseCard";

const ComingSoonCard = memo(({ badge, badgeColor, gradientIndex }: { badge: string; badgeColor: string; gradientIndex: number }) => (
  <div className="relative flex-shrink-0 w-[220px] md:w-[260px]">
    <div className={`aspect-video rounded-xl overflow-hidden relative shadow-md bg-gradient-to-br ${comingSoonGradients[gradientIndex % comingSoonGradients.length]} border border-border/30`}>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
        {badge && (
          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold text-white backdrop-blur-sm ${badgeColor}`}>
            {badge}
          </span>
        )}
        <span className="text-lg font-black text-muted-foreground/50">قريباً</span>
      </div>
    </div>
  </div>
));

ComingSoonCard.displayName = "ComingSoonCard";

const HomepageShowcaseCarousel = ({
  title,
  emoji,
  items,
  isRtl,
  autoScrollSpeed = 65,
}: HomepageShowcaseCarouselProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isPausedRef = useRef(false);
  const { ref, isVisible } = useScrollAnimation();

  // Auto-scroll with requestAnimationFrame
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !isVisible || items.length === 0) return;

    let frameId: number;
    let lastTime = 0;
    const pixelsPerSecond = 4000 / autoScrollSpeed;

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
  }, [isVisible, isRtl, autoScrollSpeed, items.length]);

  const isEmpty = items.length === 0;
  const soonLabel = isRtl ? "قريباً" : "Soon";

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
          onTouchEnd={() => { setTimeout(() => { isPausedRef.current = false; }, 3000); }}
        >
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto pb-4 px-4"
            style={{ scrollbarWidth: "none" }}
          >
            {isEmpty
              ? Array.from({ length: 5 }, (_, i) => (
                  <ComingSoonCard
                    key={`soon-${i}`}
                    badge={soonLabel}
                    badgeColor="bg-muted/60"
                    gradientIndex={i}
                  />
                ))
              : items.map((item) => (
                  <ShowcaseCard key={item.id} item={item} />
                ))
            }
          </div>
        </div>
      </div>
    </section>
  );
};

export default memo(HomepageShowcaseCarousel);
