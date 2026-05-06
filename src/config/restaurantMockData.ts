/**
 * Per-restaurant mock data keyed by restaurantId.
 * Replace with real API calls once the backend is ready.
 */

export interface RestaurantInfo {
  name: string;
  tagline: string;
  address: string;
  phone: string;
}

export interface BannerSlide {
  id: number;
  image: string;
  title: string;
  subtitle: string;
  cta: string;
  gradient: string;
}

export interface Dish {
  id: number;
  name: string;
  price: number;
  rating: number;
  tag: string;
  image: string;
}

export interface RestaurantMockData {
  info: RestaurantInfo;
  banners: BannerSlide[];
  popularDishes: Dish[];
}

const DATA_BY_RESTAURANT: Record<string, RestaurantMockData> = {
  '24395': {
    info: {
      name: 'Right Slice Pizza',
      tagline: 'Every slice, made right.',
      address: '42 Main Street, Downtown',
      phone: '+1 800 RIGHT SLICE',
    },
    banners: [
      {
        id: 1,
        image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800',
        title: 'Every Slice, Made Right',
        subtitle: 'Fresh dough, real cheese, handcrafted daily.',
        cta: 'Order Now',
        gradient: 'linear-gradient(135deg,rgba(60,120,60,0.7),rgba(30,60,30,0.9))',
      },
      {
        id: 2,
        image: 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=800',
        title: 'New: BBQ Loaded Pizza',
        subtitle: 'Smoky BBQ, grilled chicken & caramelised onions.',
        cta: 'Try It Now',
        gradient: 'linear-gradient(135deg,rgba(180,60,0,0.7),rgba(80,20,0,0.9))',
      },
      {
        id: 3,
        image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800',
        title: 'Free Delivery Today',
        subtitle: 'On all orders above $20. No code needed.',
        cta: 'Grab the Deal',
        gradient: 'linear-gradient(135deg,rgba(30,100,180,0.7),rgba(10,40,80,0.9))',
      },
    ],
    popularDishes: [
      { id: 1, name: 'Margherita Classic',   price: 11.99, rating: 4.9, tag: 'Bestseller', image: 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=400' },
      { id: 2, name: 'BBQ Chicken Pizza',    price: 14.99, rating: 4.7, tag: 'Chef\'s Pick', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400' },
      { id: 3, name: 'Pepperoni Supreme',    price: 13.99, rating: 4.8, tag: 'Spicy 🌶️', image: 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=400' },
      { id: 4, name: 'Veggie Garden',        price: 12.49, rating: 4.5, tag: 'Veg',      image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400' },
      { id: 5, name: 'Four Cheese Feast',    price: 15.49, rating: 4.8, tag: 'New',      image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400' },
      { id: 6, name: 'Garlic Bread Basket',  price:  5.99, rating: 4.6, tag: 'Sides',    image: 'https://images.unsplash.com/photo-1573821663912-6df460f9c684?w=400' },
    ],
  },
  '24532': {
    info: {
      name: 'Soda Lab',
      tagline: 'Every slice, made right.',
      address: '42 Main Street, Downtown',
      phone: '+1 800 RIGHT SLICE',
    },
    banners: [
      {
        id: 1,
        image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800',
        title: 'Every Slice, Made Right',
        subtitle: 'Fresh dough, real cheese, handcrafted daily.',
        cta: 'Order Now',
        gradient: 'linear-gradient(135deg,rgba(60,120,60,0.7),rgba(30,60,30,0.9))',
      },
      {
        id: 2,
        image: 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=800',
        title: 'New: BBQ Loaded Pizza',
        subtitle: 'Smoky BBQ, grilled chicken & caramelised onions.',
        cta: 'Try It Now',
        gradient: 'linear-gradient(135deg,rgba(180,60,0,0.7),rgba(80,20,0,0.9))',
      },
      {
        id: 3,
        image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800',
        title: 'Free Delivery Today',
        subtitle: 'On all orders above $20. No code needed.',
        cta: 'Grab the Deal',
        gradient: 'linear-gradient(135deg,rgba(30,100,180,0.7),rgba(10,40,80,0.9))',
      },
    ],
    popularDishes: [
      { id: 1, name: 'Margherita Classic',   price: 11.99, rating: 4.9, tag: 'Bestseller', image: 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=400' },
      { id: 2, name: 'BBQ Chicken Pizza',    price: 14.99, rating: 4.7, tag: 'Chef\'s Pick', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400' },
      { id: 3, name: 'Pepperoni Supreme',    price: 13.99, rating: 4.8, tag: 'Spicy 🌶️', image: 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=400' },
      { id: 4, name: 'Veggie Garden',        price: 12.49, rating: 4.5, tag: 'Veg',      image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400' },
      { id: 5, name: 'Four Cheese Feast',    price: 15.49, rating: 4.8, tag: 'New',      image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400' },
      { id: 6, name: 'Garlic Bread Basket',  price:  5.99, rating: 4.6, tag: 'Sides',    image: 'https://images.unsplash.com/photo-1573821663912-6df460f9c684?w=400' },
    ],
  },
};

const DEFAULT_DATA: RestaurantMockData = {
  info: {
    name: 'Zing Restaurant',
    tagline: 'Great food, delivered fast.',
    address: '1 Food Street',
    phone: '+1 800 ZING',
  },
  banners: [
    { id: 1, image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800', title: 'Welcome to Zing', subtitle: 'Delicious meals, delivered fast.', cta: 'Order Now', gradient: 'linear-gradient(135deg,rgba(0,184,124,0.7),rgba(0,80,60,0.9))' },
    { id: 2, image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800', title: 'Today\'s Special', subtitle: 'Chef\'s selection, freshly prepared.', cta: 'See Menu', gradient: 'linear-gradient(135deg,rgba(255,107,107,0.7),rgba(180,0,0,0.9))' },
    { id: 3, image: 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=800', title: 'Free Delivery', subtitle: 'On orders above $20 today only.', cta: 'Order Now', gradient: 'linear-gradient(135deg,rgba(78,205,196,0.7),rgba(0,100,100,0.9))' },
  ],
  popularDishes: [
    { id: 1, name: 'House Special',     price: 12.99, rating: 4.8, tag: 'Bestseller', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400' },
    { id: 2, name: 'Grilled Chicken',   price: 14.99, rating: 4.7, tag: 'Healthy',    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400' },
    { id: 3, name: 'Pasta Primavera',   price: 11.49, rating: 4.6, tag: 'Veg',        image: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=400' },
    { id: 4, name: 'Caesar Salad',      price:  9.99, rating: 4.5, tag: 'Light',      image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400' },
    { id: 5, name: 'Beef Burger',       price: 13.99, rating: 4.7, tag: 'New',        image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400' },
    { id: 6, name: 'Chocolate Lava',    price:  6.99, rating: 4.9, tag: 'Dessert',    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400' },
  ],
};

export function getRestaurantMockData(restaurantId: string | null): RestaurantMockData {
  if (!restaurantId) return DEFAULT_DATA;
  return DATA_BY_RESTAURANT[restaurantId] ?? DEFAULT_DATA;
}
