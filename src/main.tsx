import React from 'react';
import { createRoot } from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { initRestaurantConfig } from './services/restaurantConfig';
import App from './App';

// Static import + synchronous call = notifyAppReady fires in the first tick of JS
// execution, before any async code, React rendering, or user interaction.
// This is the absolute earliest possible moment — Capgo cannot time out and roll back.
if (Capacitor.isNativePlatform()) {
  CapacitorUpdater.notifyAppReady();
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
