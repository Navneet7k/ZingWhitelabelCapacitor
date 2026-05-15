import { getToken } from './authApi';

const BASE_URL  = 'https://app.zingmyorder.com/api';
const ORDER_BASE = 'https://app.zingmyorder.com/order/eatery';
const SLUG_KEY  = 'zing_restaurant_slug';

interface ApiConfigResponse {
  restaurant?: { slug?: string; [key: string]: unknown };
  [key: string]: unknown;
}

export async function fetchRestaurantConfig(restaurantId: string): Promise<void> {
  try {
    const res = await fetch(`${BASE_URL}/config/${restaurantId}`, { cache: 'no-store' });
    if (!res.ok) return;
    const data: ApiConfigResponse = await res.json();
    const slug = data?.restaurant?.slug;
    if (slug) localStorage.setItem(SLUG_KEY, slug as string);
  } catch { /* non-critical — app works without it */ }
}

export function getRestaurantSlug(): string | null {
  return localStorage.getItem(SLUG_KEY);
}

export function getOrderUrl(): string | null {
  const slug  = getRestaurantSlug();
  if (!slug) return null;
  const token = getToken();
  return token
    ? `${ORDER_BASE}/${slug}?token=${token}`
    : `${ORDER_BASE}/${slug}`;
}
