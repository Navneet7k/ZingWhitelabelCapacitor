import React from 'react';
import { createRoot } from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import { initRestaurantConfig } from './services/restaurantConfig';
import App from './App';

// notifyAppReady must be called before Capgo's rollback timeout (~10 s from launch).
// Calling it here — before React renders — fires it in the first few ms of startup,
// well ahead of the useEffect chain that would otherwise delay it by 500 ms–2 s.
if (Capacitor.isNativePlatform()) {
  import('@capgo/capacitor-updater').then(({ CapacitorUpdater }) => {
    CapacitorUpdater.notifyAppReady();
  });
}

// Seed restaurant ID + template into localStorage before anything renders.
// Runs synchronously — safe because it's just localStorage reads/writes.
initRestaurantConfig();

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
