import { CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function PasswordRequirementsHint() {
  const { language } = useLanguage();
  const isRtl = language === "ar";

  return (
    <p className="flex items-start gap-2 text-sm text-muted-foreground">
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
      <span>
        {isRtl
          ? "8 أحرف على الأقل، ويفضل استخدام أحرف كبيرة وصغيرة وأرقام ورموز."
          : "Use at least 8 characters; upper and lowercase letters, numbers, and symbols are recommended."}
      </span>
    </p>
  );
}