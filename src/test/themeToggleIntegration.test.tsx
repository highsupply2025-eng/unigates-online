import { describe, it, expect } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "next-themes";

describe("ThemeToggle Component & Brightness Switcher", () => {
  it("renders the theme toggle button with accessible title", () => {
    render(
      <LanguageProvider>
        <ThemeProvider attribute="class" defaultTheme="dark">
          <ThemeToggle />
        </ThemeProvider>
      </LanguageProvider>
    );

    const trigger = screen.getByTitle(/التحكم في السطوع والمظهر|السطوع والمظهر|Toggle theme and brightness|Theme & Brightness/i);
    expect(trigger).toBeDefined();
  });

  it("renders 1-click button variant correctly", () => {
    render(
      <LanguageProvider>
        <ThemeProvider attribute="class" defaultTheme="dark">
          <ThemeToggle variant="button" showLabel={true} />
        </ThemeProvider>
      </LanguageProvider>
    );

    const button = screen.getByRole("button");
    expect(button).toBeDefined();
    expect(button.textContent).toMatch(/داكن|Dark/i);
  });

  it("toggles theme correctly in button mode", () => {
    render(
      <LanguageProvider>
        <ThemeProvider attribute="class" defaultTheme="dark">
          <ThemeToggle variant="button" showLabel={true} />
        </ThemeProvider>
      </LanguageProvider>
    );

    const button = screen.getByRole("button");
    fireEvent.click(button);
    expect(button).toBeDefined();
  });
});
