const BASE_URL = 'https://app.zingmyorder.com/api';
const IMG_BASE  = 'https://app.zingmyorder.com/image/original/';

// ── Raw API shapes ────────────────────────────────────────────────────────────
interface ApiOrder {
  order_id: number;
  total_items: number;
  image: string | null;
  total_amount: number;
  created_at: string;
  order_status: string;
}

export interface ApiHomeResponse {
  slider_images:  Array<{ url: string; title: string | null; caption: string; desc: string | null }>;
  points:         { points: number; total_amount: number };
  popular_dishes: Array<{ name: string; description: string; image: string }>;
  featured_images:Array<{ url: string; caption: string }>;
  gallery:        Array<{ url: string; caption: string }>;
  order_now:      string;
  orders: {
    currorders:  ApiOrder[];
    pastorders:  ApiOrder[];
    favourites:  ApiOrder[];
  };
}

// ── Normalized types (what section components expect) ─────────────────────────
export interface BannerSlide {
  id: number; image: string; title: string; subtitle: string; cta: string; gradient: string;
}

export interface Dish {
  id: number; name: string; description?: string;
  price?: number; rating?: number; tag: string; image: string;
}

export interface GalleryItem {
  id: number; url: string; aspect: number;
}

export interface RecentOrder {
  id: string; items: string[]; total: number;
  status: string; statusEmoji: string; date: string; color: string;
  orderStatusUrl?: string;
}

export interface HomeData {
  banners:      BannerSlide[];
  popularDishes:Dish[];
  gallery:      GalleryItem[];
  recentOrders: RecentOrder[];
  points:       number;
  orderNowUrl:  string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const SLIDE_GRADIENTS = [
  'linear-gradient(135deg,rgba(60,120,60,0.7),rgba(30,60,30,0.9))',
  'linear-gradient(135deg,rgba(180,60,0,0.7),rgba(80,20,0,0.9))',
  'linear-gradient(135deg,rgba(30,100,180,0.7),rgba(10,40,80,0.9))',
];
const DISH_TAGS = ['Bestseller', "Chef's Pick", 'Popular', 'New', 'Spicy 🌶️', 'Featured'];

function toAbsImg(path: string): string {
  return path.startsWith('http') ? path : `${IMG_BASE}${path}`;
}

function fmtDate(dateStr: string): string {
  try {
    const d    = new Date(dateStr);
    const days = Math.floor((Date.now() - d.getTime()) / 86_400_000);
    if (days === 0) return `Today, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  } catch { return dateStr; }
}

// ── Mapper ────────────────────────────────────────────────────────────────────
export function mapHomeResponse(raw: ApiHomeResponse): HomeData {
  const banners: BannerSlide[] = raw.slider_images.map((s, i) => ({
    id: i + 1,
    image: s.url,
    title: s.title ?? s.caption ?? 'Special Offer',
    subtitle: s.desc ?? '',
    cta: 'Order Now',
    gradient: SLIDE_GRADIENTS[i % SLIDE_GRADIENTS.length],
  }));

  const popularDishes: Dish[] = raw.popular_dishes.map((d, i) => ({
    id: i + 1,
    name: d.name,
    description: d.description,
    tag: DISH_TAGS[i % DISH_TAGS.length],
    image: toAbsImg(d.image),
  }));

  const gallerySrc = raw.gallery.length > 0 ? raw.gallery : raw.featured_images;
  const gallery: GalleryItem[] = gallerySrc.map((g, i) => ({
    id: i + 1,
    url: g.url,
    aspect: 1.0,
  }));

  const mapOrder = (o: ApiOrder, current: boolean): RecentOrder => ({
    id: `ORD-${o.order_id}`,
    items: [`${o.total_items} item${o.total_items !== 1 ? 's' : ''}`],
    total: o.total_amount,
    status:      current ? 'In Progress' : 'Delivered',
    statusEmoji: current ? '🔥' : '✅',
    date:  fmtDate(o.created_at),
    color: current ? '#FF6B35' : '#00B87C',
    orderStatusUrl: o.order_status,
  });

  return {
    banners:       banners,
    popularDishes: popularDishes,
    gallery:       gallery,
    recentOrders:  [
      ...raw.orders.currorders.map(o => mapOrder(o, true)),
      ...raw.orders.pastorders.map(o => mapOrder(o, false)),
    ],
    points:      raw.points.points,
    orderNowUrl: raw.order_now,
  };
}

// ── Fetch + cache ─────────────────────────────────────────────────────────────
export function getCachedHomeData(restaurantId: string): HomeData | null {
  try {
    const raw = localStorage.getItem(`zing_home_${restaurantId}`);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export async function fetchHomeData(restaurantId: string): Promise<HomeData> {
  const res = await fetch(`${BASE_URL}/home/${restaurantId}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const raw: ApiHomeResponse = await res.json();
  const data = mapHomeResponse(raw);
  localStorage.setItem(`zing_home_${restaurantId}`, JSON.stringify(data));
  return data;
}
