import { ShieldCheck } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const PasswordRequirementsHint = () => {
  const { language } = useLanguage();
  const isRtl = language === "ar";

  return (
    <p className="flex items-start gap-2 text-sm font-semibold text-muted-foreground">
      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
      <span>
        {isRtl
          ? "استخدم 8 أحرف على الأقل، ويُفضّل الجمع بين الحروف والأرقام والرموز."
          : "Use at least 8 characters, preferably with letters, numbers, and symbols."}
      </span>
    </p>
  );
};

export default PasswordRequirementsHint;