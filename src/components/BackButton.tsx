import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * Simple "go back one page" button.
 * Always uses history.back() — never navigates to a fallback.
 * Hidden when there is no previous page in history.
 */
const BackButton = ({ className = "" }: { className?: string }) => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const ar = (a: string, e: string) => (language === "ar" ? a : e);

  // If the tab was opened fresh (target=_blank), there's no previous page — hide it.
  if (typeof window !== "undefined" && window.history.length <= 1) return null;

  const Icon = language === "ar" ? ArrowRight : ArrowLeft;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => navigate(-1)}
      className={`gap-1.5 font-semibold ${className}`}
      aria-label={ar("رجوع", "Back")}
    >
      <Icon className="w-4 h-4" />
      <span className="hidden sm:inline">{ar("رجوع", "Back")}</span>
    </Button>
  );
};

export default BackButton;
