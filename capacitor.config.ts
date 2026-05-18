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
    },
  },
};

export default config;
