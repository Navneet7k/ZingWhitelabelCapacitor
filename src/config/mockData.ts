import { getRestaurantId } from '../services/restaurantConfig';
import { getRestaurantMockData } from './restaurantMockData';

// Resolve restaurant-aware data once at module load time.
// After OTA updates, the module reloads with the same restaurantId from localStorage.
const _rid  = getRestaurantId();
const _data = getRestaurantMockData(_rid);

export const BANNER_SLIDES   = _data.banners;
export const POPULAR_DISHES  = _data.popularDishes;

export const RECENT_ORDERS = [
  { id: 'ORD-001', items: ['Margherita Classic', 'Garlic Bread', 'Cola'], total: 18.99, status: 'Delivered',   statusEmoji: '✅', date: 'Today, 2:30 PM',  color: '#00B87C' },
  { id: 'ORD-002', items: ['BBQ Chicken Pizza', 'Cheesy Dip'],            total: 21.50, status: 'In Progress', statusEmoji: '🔥', date: 'Today, 1:15 PM',  color: '#FF6B35' },
  { id: 'ORD-003', items: ['Pepperoni Supreme', 'Fries'],                 total: 19.99, status: 'Delivered',   statusEmoji: '✅', date: 'Yesterday',        color: '#00B87C' },
  { id: 'ORD-004', items: ['Four Cheese Feast', 'Coke x2'],               total: 22.50, status: 'Delivered',   statusEmoji: '✅', date: '2 days ago',       color: '#00B87C' },
];

export const GALLERY_ITEMS = [
  { id: 1, url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500', aspect: 0.67 },
  { id: 2, url: 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=500', aspect: 1.33 },
  { id: 3, url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500', aspect: 1.0  },
  { id: 4, url: 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=500', aspect: 0.75 },
  { id: 5, url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500', aspect: 1.25 },
  { id: 6, url: 'https://images.unsplash.com/photo-1573821663912-6df460f9c684?w=500', aspect: 0.8  },
];

export const LOYALTY = { points: 1240, tier: 'Gold', nextTier: 'Platinum', nextTierPoints: 2000, stamps: 5 };

export const MENU_ITEMS = [
  { id: 1,  name: 'Margherita Classic',  price: 11.99, category: 'Pizzas',  desc: 'San Marzano tomato, buffalo mozzarella, fresh basil',           image: 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=400' },
  { id: 2,  name: 'BBQ Chicken Pizza',   price: 14.99, category: 'Pizzas',  desc: 'Smoky BBQ, grilled chicken, red onion, coriander',              image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400' },
  { id: 3,  name: 'Pepperoni Supreme',   price: 13.99, category: 'Pizzas',  desc: 'Double pepperoni, mozzarella, tomato, oregano',                  image: 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=400' },
  { id: 4,  name: 'Veggie Garden',       price: 12.49, category: 'Pizzas',  desc: 'Roasted peppers, mushrooms, olives, sundried tomato',            image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400' },
  { id: 5,  name: 'Four Cheese Feast',   price: 15.49, category: 'Pizzas',  desc: 'Mozzarella, cheddar, gouda, parmesan, truffle oil',              image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400' },
  { id: 6,  name: 'Garlic Bread Basket', price:  5.99, category: 'Sides',   desc: 'Toasted ciabatta, roasted garlic butter, parsley',               image: 'https://images.unsplash.com/photo-1573821663912-6df460f9c684?w=400' },
  { id: 7,  name: 'Loaded Fries',        price:  6.99, category: 'Sides',   desc: 'Crispy fries, cheese sauce, jalapeños, sour cream',              image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400' },
  { id: 8,  name: 'Tiramisu',            price:  7.49, category: 'Desserts',desc: 'Classic Italian mascarpone & espresso dessert',                  image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400' },
  { id: 9,  name: 'Coke / Diet Coke',   price:  2.99, category: 'Drinks',  desc: '330ml chilled can',                                              image: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=400' },
  { id: 10, name: 'Fresh Lemonade',      price:  3.99, category: 'Drinks',  desc: 'Hand-squeezed, mint, sparkling water',                           image: 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=400' },
];

export const MENU_CATEGORIES = ['All', 'Pizzas', 'Sides', 'Desserts', 'Drinks'];
