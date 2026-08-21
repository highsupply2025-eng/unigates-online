import { CheckCircle2, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { PASSWORD_RULES } from "@/lib/password";

const PasswordRequirementsHint = () => {
  const { language } = useLanguage();
  const isRtl = language === "ar";

  return (
    <div className="rounded-lg border border-primary/15 bg-primary/5 p-3 space-y-1.5 text-start">
      <p className="flex items-center gap-1.5 text-xs font-bold text-foreground">
        <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
        {isRtl ? "شروط كلمة مرور قوية" : "Strong password requirements"}
      </p>
      <ul className="space-y-1">
        {PASSWORD_RULES.map((rule) => (
          <li key={rule.key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CheckCircle2 className="w-3.5 h-3.5 text-primary/60 shrink-0" />
            {isRtl ? rule.ar : rule.en}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PasswordRequirementsHint;
