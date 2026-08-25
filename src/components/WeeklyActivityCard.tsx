import { Card, CardContent } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import { Sparkline, bucketByDay } from "@/components/Sparkline";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  /** All activity timestamps (any length, will be bucketed by day). */
  timestamps: (string | null | undefined)[];
  /** Optional total ratings count to show in the footer. */
  ratingsCount?: number;
  /** Custom subtitle (e.g. "نشاط الكلية…"). */
  subtitle?: string;
  className?: string;
}

/**
 * Weekly Activity sparkline card — same look used on the Dean dashboard.
 * Shared across all dashboards for visual consistency.
 */
export const WeeklyActivityCard = ({
  timestamps,
  ratingsCount,
  subtitle,
  className = "mb-4 sm:mb-6",
}: Props) => {
  const { language, dir } = useLanguage();
  const isRtl = dir === "rtl";
  const cleanDates = (timestamps || []).filter(Boolean) as string[];
  const total = cleanDates.length;
  const data = bucketByDay(cleanDates, 7);

  return (
    <Card className={className}>
      <CardContent className="p-4 sm:p-5">
        <div
          className="flex items-center justify-between mb-3 sm:mb-4 gap-2"
          dir={isRtl ? "rtl" : "ltr"}
        >
          <div className="min-w-0">
            <h3 className="font-bold text-foreground text-sm sm:text-base">
              {isRtl ? "النشاط الأسبوعي" : "Weekly Activity"}
            </h3>
            <p className="text-[11px] sm:text-xs text-muted-foreground">
              {subtitle ||
                (isRtl ? "النشاط خلال آخر 7 أيام" : "Activity over the last 7 days")}
            </p>
          </div>
          <BarChart3 className="w-5 h-5 text-primary shrink-0" />
        </div>
        <div className="h-24 sm:h-32">
          <Sparkline data={data} color="hsl(var(--primary))" />
        </div>
        <div
          className="flex items-center justify-between mt-3 text-[11px] sm:text-xs text-muted-foreground gap-2"
          dir={isRtl ? "rtl" : "ltr"}
        >
          <span>
            {isRtl ? "إجمالي الأنشطة: " : "Total activities: "}
            {total}
          </span>
          {typeof ratingsCount === "number" && (
            <span>
              {isRtl ? "إجمالي التقييمات: " : "Total ratings: "}
              {ratingsCount}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default WeeklyActivityCard;
