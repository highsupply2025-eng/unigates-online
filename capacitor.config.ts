import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.unigates.online',
  appName: 'unigates',
  webDir: 'dist',
  server: {
    url: 'https://6530b1d8-8d64-4a1b-b26b-383d9aa20082.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
};

export default config;
