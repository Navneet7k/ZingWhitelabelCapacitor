import React from 'react';
import { createRoot } from 'react-dom/client';
import { initRestaurantConfig } from './services/restaurantConfig';
import App from './App';

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
