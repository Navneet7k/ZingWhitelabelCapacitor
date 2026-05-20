import { getToken } from './authApi';

const BASE_URL    = 'https://app.zingmyorder.com/api';
const IMG_BASE    = 'https://app.zingmyorder.com/image/original/';
const ORDER_BASE  = 'https://app.zingmyorder.com/order/eatery';
const SLUG_KEY    = 'zing_restaurant_slug';
const LOGO_KEY    = 'zing_restaurant_logo';
const COLORS_KEY  = 'zing_config_colors';
const PHONE_KEY   = 'zing_restaurant_phone';
const ADDRESS_KEY = 'zing_restaurant_address';

interface ApiConfigResponse {
  restaurant?: {
    slug?:    string;
    phone?:   string;
    address?: string;
    logo?: { path?: string }[];
    [key: string]: unknown;
  };
  app?: {
    colors?: Record<string, string>;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export async function fetchRestaurantConfig(restaurantId: string): Promise<void> {
  try {
    const res = await fetch(`${BASE_URL}/config/${restaurantId}`, { cache: 'no-store' });
    if (!res.ok) return;
    const data: ApiConfigResponse = await res.json();
    const slug = data?.restaurant?.slug;
    if (slug) localStorage.setItem(SLUG_KEY, slug as string);
    const logoPath = data?.restaurant?.logo?.[0]?.path;
    if (logoPath) localStorage.setItem(LOGO_KEY, `${IMG_BASE}${logoPath}`);
    const phone = data?.restaurant?.phone;
    if (phone) localStorage.setItem(PHONE_KEY, String(phone));
    const address = data?.restaurant?.address;
    if (address) localStorage.setItem(ADDRESS_KEY, String(address));
    const colors = data?.app?.colors;
    if (colors && typeof colors === 'object') localStorage.setItem(COLORS_KEY, JSON.stringify(colors));
  } catch { /* non-critical */ }
}

export function getRestaurantSlug(): string | null {
  return localStorage.getItem(SLUG_KEY);
}

export function getRestaurantLogo(): string | null {
  return localStorage.getItem(LOGO_KEY);
}

export function getRestaurantPhone(): string | null {
  return localStorage.getItem(PHONE_KEY);
}

export function getRestaurantAddress(): string | null {
  return localStorage.getItem(ADDRESS_KEY);
}

export function getOrderUrl(): string | null {
  const slug  = getRestaurantSlug();
  if (!slug) return null;
  const token = getToken();
  return token
    ? `${ORDER_BASE}/${slug}?token=${token}`
    : `${ORDER_BASE}/${slug}`;
}
