export const PASSWORD_MIN_LENGTH = 8;

export type PasswordRule = {
  key: string;
  ar: string;
  en: string;
  test: (value: string) => boolean;
};

export const PASSWORD_RULES: PasswordRule[] = [
  { key: "length", ar: "8 أحرف على الأقل", en: "At least 8 characters", test: (v) => v.length >= PASSWORD_MIN_LENGTH },
  { key: "upper", ar: "حرف كبير (A-Z)", en: "One uppercase letter (A-Z)", test: (v) => /[A-Z]/.test(v) },
  { key: "lower", ar: "حرف صغير (a-z)", en: "One lowercase letter (a-z)", test: (v) => /[a-z]/.test(v) },
  { key: "digit", ar: "رقم (0-9)", en: "One number (0-9)", test: (v) => /[0-9]/.test(v) },
  { key: "special", ar: "رمز خاص مثل !@#$%", en: "One special character e.g. !@#$%", test: (v) => /[^A-Za-z0-9]/.test(v) },
];

export function getPasswordRuleTexts(lang: "ar" | "en"): string[] {
  return PASSWORD_RULES.map((rule) => rule[lang]);
}

export function getMissingPasswordRules(value: string): PasswordRule[] {
  return PASSWORD_RULES.filter((rule) => !rule.test(value));
}

export function isPasswordStrong(value: string): boolean {
  return getMissingPasswordRules(value).length === 0;
}

const WEAK_PASSWORD_PATTERN =
  /common passwords|1,000,000|pwned|breached|compromised|leaked|weak|easy to guess|too easy/i;
const LENGTH_PATTERN = /at least|minimum|too short|short|\d+\s*characters|length/i;

/**
 * Translates Supabase/GoTrue password-rejection errors (e.g. the English
 * message returned by "Leaked Password Protection" or the minimum-length
 * policy) into a friendly Arabic/English message. Returns null when the
 * error is not password-related so the caller can fall back to the raw text.
 */
export function getPasswordErrorMessage(error: unknown, isRtl: boolean): string | null {
  if (!error) return null;
  const message = typeof error === "string" ? error : error instanceof Error ? error.message : "";
  if (!message) return null;

  if (WEAK_PASSWORD_PATTERN.test(message)) {
    return isRtl
      ? "كلمة المرور ضعيفة أو ظهرت في تسريبات سابقة. اختر كلمة مرور قوية وغير شائعة."
      : "This password is weak or has appeared in a data breach. Choose a strong, uncommon password.";
  }

  if (LENGTH_PATTERN.test(message)) {
    return isRtl
      ? `كلمة المرور يجب أن تتكون من ${PASSWORD_MIN_LENGTH} أحرف على الأقل.`
      : `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  }

  return null;
}
