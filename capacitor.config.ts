import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.unigates.online',
  appName: 'UNIGATES',
  webDir: 'dist',
  backgroundColor: '#0f766e',
  server: {
    url: 'https://6530b1d8-8d64-4a1b-b26b-383d9aa20082.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  ios: {
    contentInset: 'always',
    limitsNavigationsToAppBoundDomains: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      launchFadeOutDuration: 300,
      backgroundColor: '#0f766e',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0f766e',
      overlaysWebView: false,
    },
    App: {
      launchUrl: '',
    },
  },
};

export default config;
