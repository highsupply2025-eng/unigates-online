import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import Login from "@/pages/Login";

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({
    t: {
      brandName: "UNIGATES",
      home: "الرئيسية",
      login: "تسجيل الدخول",
      signup: "إنشاء حساب",
      loginPage: {
        title: "تسجيل الدخول",
        subtitle: "مرحباً بعودتك",
        emailPlaceholder: "البريد الإلكتروني",
        passwordPlaceholder: "كلمة المرور",
        forgotPassword: "نسيت كلمة المرور",
        noAccount: "ليس لديك حساب؟",
        createAccount: "إنشاء حساب",
        error: "خطأ",
      },
    },
    dir: "rtl",
    language: "ar",
    toggleLanguage: vi.fn(),
  }),
}));

vi.mock("@/hooks/use-smart-back", () => ({
  useSmartBack: () => vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {},
}));

describe("Login password input", () => {
  it("centers the placeholder and typed password without overlapping the eye button", () => {
    render(<Login />, { wrapper: MemoryRouter });

    const input = screen.getByPlaceholderText("كلمة المرور");
    const button = screen.getByLabelText("إظهار كلمة المرور");

    expect(input).toHaveAttribute("dir", "ltr");
    expect(input).toHaveStyle({ unicodeBidi: "plaintext" });
    expect(input).not.toHaveStyle({ textAlign: "left", textIndent: "38px" });
    // RTL-aware padding: extra start-side padding keeps typed text centered
    // and clear of the eye button (rendered here with dir="rtl").
    expect(input).toHaveClass("h-12", "md:h-14", "text-center", "pr-10", "pl-12");
    expect(input.parentElement).toHaveClass("relative");
    expect(button).toHaveClass("absolute", "left-2", "top-1/2", "-translate-y-1/2");

    fireEvent.change(input, { target: { value: "Aa$#@159753" } });
    expect(input).toHaveValue("Aa$#@159753");
    expect(input).toHaveClass("pl-12", "pr-10", "text-center");
  }, 15000);

  it("preserves password visibility toggling", () => {
    render(<Login />, { wrapper: MemoryRouter });
    const input = screen.getByPlaceholderText("كلمة المرور");

    expect(input).toHaveAttribute("type", "password");
    fireEvent.click(screen.getByLabelText("إظهار كلمة المرور"));
    expect(input).toHaveAttribute("type", "text");
    fireEvent.click(screen.getByLabelText("إخفاء كلمة المرور"));
    expect(input).toHaveAttribute("type", "password");
  }, 15000);
});
