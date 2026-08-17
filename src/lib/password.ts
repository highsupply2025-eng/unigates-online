type PasswordError = {
  message?: string;
  code?: string;
};

/** Returns a friendly localized message for known password-policy failures. */
export function getPasswordErrorMessage(error: unknown, isRtl: boolean): string | null {
  const value = error as PasswordError | null;
  const message = value?.message ?? "";
  const code = value?.code ?? "";

  if (/same_password|different from the old|new password should be different/i.test(`${code} ${message}`)) {
    return isRtl
      ? "يجب أن تكون كلمة المرور الجديدة مختلفة عن الحالية."
      : "The new password must be different from your current password.";
  }

  if (/weak|known to be weak|easy to guess|compromised|breached|pwned/i.test(`${code} ${message}`)) {
    return isRtl
      ? "كلمة المرور ضعيفة أو ظهرت في تسريب سابق. اختر كلمة أقوى تحتوي على أحرف كبيرة وصغيرة وأرقام ورموز."
      : "This password is weak or has appeared in a data breach. Choose a stronger password with upper and lowercase letters, numbers, and symbols.";
  }

  if (/password.*(short|length)|at least.*characters/i.test(message)) {
    return isRtl
      ? "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل."
      : "Password must be at least 8 characters.";
  }

  return null;
}