import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

interface BackButtonProps {
  className?: string;
  /** When true, navigates straight to /login instead of history.back() */
  toLogin?: boolean;
  /** When set, navigates to this path instead of history.back() */
  to?: string;
}

/**
 * Back button. Default: history.back(). With toLogin: navigates to /login. With to: navigates to that path.
 * Arrow points in the reading direction (RTL → left arrow, LTR → right arrow).
 */
const BackButton = ({ className = "", toLogin = false, to }: BackButtonProps) => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const ar = (a: string, e: string) => (language === "ar" ? a : e);

  if (!toLogin && !to && typeof window !== "undefined" && window.history.length <= 1) return null;

  // Back direction: Arabic (RTL) → ArrowLeft, English (LTR) → ArrowRight
  const Icon = language === "ar" ? ArrowLeft : ArrowRight;

  const handleClick = () => {
    if (toLogin) navigate("/login");
    else if (to) navigate(to);
    else navigate(-1);
  };

  return (
    <Button
      variant="default"
      size="sm"
      onClick={handleClick}
      className={`gap-1.5 font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/30 ${className}`}
      aria-label={ar("رجوع", "Back")}
    >
      <Icon className="w-4 h-4" />
      <span className="hidden sm:inline">{ar("رجوع", "Back")}</span>
    </Button>
  );
};

export default BackButton;
