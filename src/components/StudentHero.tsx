import { Sparkles, type LucideIcon } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  titleAr: string;
  titleEn: string;
  subtitleAr?: string;
  subtitleEn?: string;
  Icon: LucideIcon;
  /** Tailwind gradient e.g. "from-indigo-600 via-purple-600 to-pink-600" */
  gradient?: string;
  /** Tailwind shadow tint e.g. "shadow-purple-500/30" */
  shadow?: string;
}

const StudentHero = ({
  titleAr,
  titleEn,
  subtitleAr,
  subtitleEn,
  Icon,
  gradient = "from-indigo-600 via-purple-600 to-pink-600",
  shadow = "shadow-purple-500/30",
}: Props) => {
  const { language } = useLanguage();
  const isRtl = language === "ar";
  return (
    <div className={`relative overflow-hidden rounded-2xl sm:rounded-3xl mb-6 sm:mb-8 p-5 sm:p-7 bg-gradient-to-br ${gradient} shadow-2xl ${shadow}`}>
      <div className="absolute -top-12 -end-12 w-48 h-48 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -bottom-16 -start-16 w-56 h-56 rounded-full bg-white/15 blur-3xl" />
      <div className="relative flex items-center gap-3 sm:gap-4">
        <div className="shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center ring-1 ring-white/30 shadow-lg">
          <Icon className="w-7 h-7 sm:w-8 sm:h-8 text-white" strokeWidth={2.5} />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            {isRtl ? titleAr : titleEn}
            <Sparkles className="w-5 h-5 text-yellow-300 shrink-0" />
          </h1>
          {(subtitleAr || subtitleEn) && (
            <p className="text-[11px] sm:text-sm text-white/90 mt-1 font-medium">
              {isRtl ? subtitleAr : subtitleEn}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentHero;
