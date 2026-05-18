import type { TemplateId } from '../context/TemplateContext';

const RESTAURANT_ID_KEY    = 'zing_restaurant_id';
const RESTAURANT_TMPL_KEY  = 'zing_template';        // shared with TemplateContext
const RESTAURANT_NAME_KEY  = 'zing_restaurant_name';

const TEMPLATE_MAP: Record<number, TemplateId> = {
  1: 'luxe',   2: 'fresh',  3: 'street', 4: 'zen',
  5: 'fiesta', 6: 'neon',   7: 'rustic', 8: 'ocean',
  9: 'blossom',10: 'ember', 11: 'cosmic',12: 'retro',13: 'tropical',14: 'royal',15: 'brew',16: 'dynasty',17: 'float',
};

/**
 * Called once at app startup (main.tsx).
 * Seeds localStorage from env vars baked into the APK bundle.
 * Safe to call on every launch — only writes on first install.
 */
export function initRestaurantConfig(): void {
  if (localStorage.getItem(RESTAURANT_ID_KEY)) return; // already seeded

  const restaurantId = import.meta.env.VITE_RESTAURANT_ID as string | undefined;
  const templateId   = import.meta.env.VITE_RESTAURANT_TEMPLATE_ID as string | undefined;
  const appName      = import.meta.env.VITE_RESTAURANT_APP_NAME as string | undefined;

  if (!restaurantId) return; // not a restaurant build

  localStorage.setItem(RESTAURANT_ID_KEY, restaurantId);

  if (appName) {
    localStorage.setItem(RESTAURANT_NAME_KEY, appName);
  }

  if (templateId) {
    const name = TEMPLATE_MAP[Number(templateId)];
    if (name) localStorage.setItem(RESTAURANT_TMPL_KEY, name);
  }
}

export function getRestaurantId(): string | null {
  return localStorage.getItem(RESTAURANT_ID_KEY);
}

export function getRestaurantName(): string | null {
  return localStorage.getItem(RESTAURANT_NAME_KEY);
}

export function isRestaurantMode(): boolean {
  return !!getRestaurantId();
}
