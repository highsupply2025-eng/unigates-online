type PasswordError = {
  message?: string;
  code?: string;
};

export const getPasswordErrorMessage = (
  error: PasswordError | null | undefined,
  isRtl: boolean,
): string | null => {
  if (!error) return null;

  const message = (error.message || "").toLowerCase();
  const code = (error.code || "").toLowerCase();

  if (message.includes("same password") || message.includes("different from the old") || code.includes("same_password")) {
    return isRtl
      ? "يجب أن تكون كلمة المرور الجديدة مختلفة عن كلمة المرور الحالية."
      : "The new password must be different from your current password.";
  }

  if (message.includes("weak") || message.includes("breached") || code.includes("weak_password")) {
    return isRtl
      ? "كلمة المرور ضعيفة أو ظهرت في تسريب سابق. اختر كلمة مرور أقوى."
      : "This password is weak or has appeared in a previous data breach. Choose a stronger password.";
  }

  if (message.includes("least") || message.includes("short") || code.includes("password_length")) {
    return isRtl
      ? "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل."
      : "Password must be at least 8 characters long.";
  }

  return null;
};