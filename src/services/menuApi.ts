const BASE_URL  = 'https://app.zingmyorder.com/api';
const IMG_BASE  = 'https://app.zingmyorder.com/image/original/';
const CACHE_KEY = (id: string) => `zing_menu_v1_${id}`;

// ── Raw API shapes ─────────────────────────────────────────────────────────────
interface ApiImage { path: string; }

interface ApiMenuItem {
  id: number;
  name: string;
  description?: string;
  price: number | string;
  category_id: number;
  image?: ApiImage[];
}

interface ApiCategory {
  id: number;
  name: string;
  menu: ApiMenuItem[];
}

interface ApiGroup {
  id: number;
  name: string;
  logo?: ApiImage[];
  category?: Array<{ id: number; name: string }>;
}

interface ApiMenuResponse {
  category: ApiCategory[];
  group?: ApiGroup[];
  is_subcategory?: string;
}

// ── Normalized types ───────────────────────────────────────────────────────────
export interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  categoryId: number;
  image: string;
}

export interface MenuCategory {
  id: number;
  name: string;
  items: MenuItem[];
}

export interface MenuGroup {
  id: number;
  name: string;
  logo: string;
  categoryIds: number[];
}

export interface MenuData {
  isGroupMode: boolean;
  categories: MenuCategory[];
  groups: MenuGroup[];
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function toAbsImg(path: string): string {
  if (!path) return '';
  return path.startsWith('http') ? path : `${IMG_BASE}${path}`;
}

function toPrice(raw: number | string): number {
  const n = typeof raw === 'string' ? parseFloat(raw) : raw;
  return isNaN(n) ? 0 : n;
}

// ── Mapper ─────────────────────────────────────────────────────────────────────
export function mapMenuResponse(raw: ApiMenuResponse): MenuData {
  const categories: MenuCategory[] = (raw.category ?? []).map(cat => ({
    id: cat.id,
    name: cat.name,
    items: (cat.menu ?? []).map(item => ({
      id: item.id,
      name: item.name,
      description: item.description ?? '',
      price: toPrice(item.price),
      categoryId: item.category_id,
      image: toAbsImg(item.image?.[0]?.path ?? ''),
    })),
  }));

  const groups: MenuGroup[] = (raw.group ?? []).map(g => ({
    id: g.id,
    name: g.name,
    logo: toAbsImg(g.logo?.[0]?.path ?? ''),
    categoryIds: (g.category ?? []).map(c => c.id),
  }));

  return {
    isGroupMode: raw.is_subcategory?.toLowerCase() === 'yes',
    categories,
    groups,
  };
}

// ── Fetch + cache ──────────────────────────────────────────────────────────────
export function getCachedMenuData(restaurantId: string): MenuData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY(restaurantId));
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export async function fetchMenuData(restaurantId: string): Promise<MenuData> {
  const res = await fetch(`${BASE_URL}/menu/${restaurantId}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const raw: ApiMenuResponse = await res.json();
  const data = mapMenuResponse(raw);
  localStorage.setItem(CACHE_KEY(restaurantId), JSON.stringify(data));
  return data;
}
