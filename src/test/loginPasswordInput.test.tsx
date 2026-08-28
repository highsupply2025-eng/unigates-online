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
  it("renders password input with LTR direction and proper controls", () => {
    render(<Login />, { wrapper: MemoryRouter });

    const input = screen.getByPlaceholderText("كلمة المرور");
    const button = screen.getByLabelText("إظهار كلمة المرور");

    expect(input).toHaveAttribute("dir", "ltr");
    expect(input.parentElement).toHaveClass("relative");
    expect(button).toBeDefined();

    fireEvent.change(input, { target: { value: "Aa$#@159753" } });
    expect(input).toHaveValue("Aa$#@159753");
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
