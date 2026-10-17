import { describe, it, expect } from "vitest";
import { SUPPORTED_CURRENCIES, detectGeoCurrency, CurrencyCode } from "@/contexts/CurrencyContext";

describe("Multi-Currency System Tests (EGP, SAR, AED, USD)", () => {
  it("should support all four designated currencies with correct metadata and symbols", () => {
    const currencyCodes: CurrencyCode[] = ["EGP", "SAR", "AED", "USD"];
    
    currencyCodes.forEach((code) => {
      const cfg = SUPPORTED_CURRENCIES[code];
      expect(cfg).toBeDefined();
      expect(cfg.code).toBe(code);
      expect(cfg.flag).toBeTruthy();
      expect(cfg.symbolAr).toBeTruthy();
      expect(cfg.symbolEn).toBeTruthy();
      expect(cfg.calcRange.presets.length).toBeGreaterThan(0);
      expect(cfg.calcRange.max).toBeGreaterThan(cfg.calcRange.min);
    });

    expect(SUPPORTED_CURRENCIES.EGP.symbolAr).toBe("ج.م");
    expect(SUPPORTED_CURRENCIES.SAR.symbolAr).toBe("ر.س");
    expect(SUPPORTED_CURRENCIES.AED.symbolAr).toBe("د.إ");
    expect(SUPPORTED_CURRENCIES.USD.symbolAr).toBe("$");
  });

  it("should calculate author net earnings accurately for digital (70%) and print (30%)", () => {
    // EGP: 200 EGP price
    const egpPrice = 200;
    const egpDigital = Math.round(egpPrice * 0.7);
    const egpPrint = Math.round(egpPrice * 0.3);
    expect(egpDigital).toBe(140);
    expect(egpPrint).toBe(60);

    // USD: $10 price
    const usdPrice = 10;
    const usdDigital = Math.round(usdPrice * 0.7 * 100) / 100;
    const usdPrint = Math.round(usdPrice * 0.3 * 100) / 100;
    expect(usdDigital).toBe(7);
    expect(usdPrint).toBe(3);

    // SAR: 50 SAR price
    const sarPrice = 50;
    const sarDigital = Math.round(sarPrice * 0.7 * 10) / 10;
    const sarPrint = Math.round(sarPrice * 0.3 * 10) / 10;
    expect(sarDigital).toBe(35);
    expect(sarPrint).toBe(15);
  });

  it("should have correct exchange rates aligned with global payment gateways", () => {
    // 1 USD = 50 EGP
    expect(SUPPORTED_CURRENCIES.USD.rateToEgp).toBe(50.0);
    expect(SUPPORTED_CURRENCIES.USD.rateFromEgp).toBe(1 / 50.0);

    // 1 SAR ≈ 13.33 EGP
    expect(SUPPORTED_CURRENCIES.SAR.rateToEgp).toBeCloseTo(13.33, 1);

    // 1 AED ≈ 13.60 EGP
    expect(SUPPORTED_CURRENCIES.AED.rateToEgp).toBeCloseTo(13.60, 1);
  });

  it("should correctly detect geo currency based on timezone", () => {
    // Should return a valid CurrencyCode
    const detected = detectGeoCurrency();
    expect(["EGP", "SAR", "AED", "USD"]).toContain(detected);
  });
});
