/**
 * Native (Capacitor) runtime bootstrap.
 * Safe to import in a normal web build: every native API call is guarded
 * by Capacitor.isNativePlatform() so browser users are unaffected.
 */
import { Capacitor } from "@capacitor/core";

export async function initNativeApp() {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    // Don't overlay: reserve space so app content never sits under the status bar.
    await StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {});
    await StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
    if (Capacitor.getPlatform() === "android") {
      await StatusBar.setBackgroundColor({ color: "#0f766e" }).catch(() => {});
    }
  } catch {
    /* status-bar plugin unavailable */
  }

  try {
    const { SplashScreen } = await import("@capacitor/splash-screen");
    await SplashScreen.hide({ fadeOutDuration: 250 }).catch(() => {});
  } catch {
    /* splash-screen plugin unavailable */
  }

  try {
    const { App } = await import("@capacitor/app");
    // Hardware back button: navigate back in-app instead of instantly exiting.
    App.addListener("backButton", ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back();
      } else {
        App.exitApp();
      }
    });
  } catch {
    /* app plugin unavailable */
  }

  // Prevent long-press context menu / text selection callout on native shells
  // so it feels like a real app, not a web view.
  document.documentElement.classList.add("is-native-app");
}
