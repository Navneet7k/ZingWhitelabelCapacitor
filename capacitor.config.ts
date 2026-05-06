import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.zing.whitelabel',
  appName: 'ZingWhitelabelCapacitor',
  webDir: 'dist',
  plugins: {
    CapacitorUpdater: {
      // Manual update mode — we control when to check & apply
      autoUpdate: false,
    },
  },
};

export default config;
