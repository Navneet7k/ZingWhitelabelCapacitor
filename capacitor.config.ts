import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cafedolce.zingmyorder',
  appName: 'Cafe Dolce Amore',
  webDir: 'dist',
  plugins: {
    CapacitorUpdater: {
      autoUpdate: false,
      // Prevent Capgo from resetting to the built-in APK bundle when
      // a native app update is installed from the Play Store.
      resetWhenUpdate: false,
      // Give the app 30 s to confirm notifyAppReady (default is 10 s which
      // is too tight when the bridge or config fetch is slow on first load).
      appReadyTimeout: 30000,
    },
  },
};

export default config;
