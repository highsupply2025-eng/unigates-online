import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ResetPassword from "@/pages/ResetPassword";

const { dismiss, toast, updateUser } = vi.hoisted(() => ({
  dismiss: vi.fn(),
  toast: vi.fn(() => ({ id: "password-mismatch" })),
  updateUser: vi.fn(() => new Promise(() => {})),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ dismiss, toast }),
}));

vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({
    t: { brandName: "UNIGATES", login: "تسجيل الدخول", langSwitch: "English" },
    dir: "rtl",
    language: "ar",
    toggleLanguage: vi.fn(),
  }),
}));

vi.mock("@/hooks/use-smart-back", () => ({
  useSmartBack: () => vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
      updateUser,
    },
  },
}));

describe("ResetPassword password inputs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps both fields LTR with plaintext bidi behavior on the Arabic page", () => {
    render(<ResetPassword />, { wrapper: MemoryRouter });

    const inputs = screen.getAllByDisplayValue("");
    expect(inputs).toHaveLength(2);
    for (const input of inputs) {
      expect(input).toHaveAttribute("dir", "ltr");
      expect(input).toHaveStyle({ textAlign: "left", unicodeBidi: "plaintext" });
    }
  });

  it("places a centered visibility button on the far right of both padded fields", () => {
    render(<ResetPassword />, { wrapper: MemoryRouter });

    const inputs = screen.getAllByDisplayValue("");
    const passwordButton = screen.getByRole("button", { name: "إظهار كلمة المرور" });
    const confirmationButton = screen.getByRole("button", { name: "إظهار تأكيد كلمة المرور" });

    for (const input of inputs) {
      expect(input).toHaveClass("pr-14");
      expect(input.parentElement).toHaveClass("relative");
    }
    for (const button of [passwordButton, confirmationButton]) {
      expect(button).toHaveClass("absolute", "right-2", "top-1/2", "-translate-y-1/2");
    }
  }, 15000);

  it("toggles both password fields from either visibility button", () => {
    render(<ResetPassword />, { wrapper: MemoryRouter });
    const inputs = screen.getAllByDisplayValue("");

    expect(inputs.every((input) => input.getAttribute("type") === "password")).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "إظهار كلمة المرور" }));
    expect(inputs.every((input) => input.getAttribute("type") === "text")).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "إخفاء تأكيد كلمة المرور" }));
    expect(inputs.every((input) => input.getAttribute("type") === "password")).toBe(true);
  });

  it("submits matching raw values without altering mixed-direction symbols", async () => {
    render(<ResetPassword />, { wrapper: MemoryRouter });
    const [password, confirmation] = screen.getAllByDisplayValue("");

    fireEvent.change(password, { target: { value: "Aa$#@159753" } });
    fireEvent.change(confirmation, { target: { value: "Aa$#@159753" } });
    fireEvent.submit(password.closest("form")!);

    await waitFor(() => {
      expect(updateUser).toHaveBeenCalledWith({ password: "Aa$#@159753" });
    });
    expect(toast).not.toHaveBeenCalled();
  });

  it("dismisses the mismatch error as soon as the raw values match", () => {
    render(<ResetPassword />, { wrapper: MemoryRouter });
    const [password, confirmation] = screen.getAllByDisplayValue("");

    fireEvent.change(password, { target: { value: "Aa$#@159753" } });
    fireEvent.change(confirmation, { target: { value: "different" } });
    fireEvent.submit(password.closest("form")!);
    expect(toast).toHaveBeenCalledTimes(1);

    fireEvent.change(confirmation, { target: { value: "Aa$#@159753" } });
    expect(dismiss).toHaveBeenCalledWith("password-mismatch");
  });
});
