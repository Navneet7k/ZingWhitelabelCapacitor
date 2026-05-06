export const BANNER_SLIDES = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80',
    title: 'Welcome to Zing',
    subtitle: 'Fresh ingredients, bold flavours',
    cta: 'Order Now',
    gradient: 'linear-gradient(135deg,#FF6B6B,#FFE66D)',
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
    title: 'Free Delivery',
    subtitle: 'On all orders above $25',
    cta: 'Browse Menu',
    gradient: 'linear-gradient(135deg,#4ECDC4,#45B7D1)',
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?auto=format&fit=crop&w=800&q=80',
    title: 'Weekend Special',
    subtitle: 'Up to 30% off on all combos',
    cta: 'See Offers',
    gradient: 'linear-gradient(135deg,#A8E6CF,#3D9970)',
  },
];

export const POPULAR_DISHES = [
  { id: 1, name: 'Classic Burger', price: 12.99, tag: 'Best Seller', rating: 4.8, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80' },
  { id: 2, name: 'Margherita Pizza', price: 14.99, tag: "Chef's Pick", rating: 4.7, image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80' },
  { id: 3, name: 'Grilled Steak', price: 28.99, tag: 'Premium', rating: 4.9, image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=400&q=80' },
  { id: 4, name: 'Truffle Pasta', price: 18.99, tag: 'New', rating: 4.6, image: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?auto=format&fit=crop&w=400&q=80' },
  { id: 5, name: 'Dragon Roll', price: 16.99, tag: 'Popular', rating: 4.7, image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=400&q=80' },
  { id: 6, name: 'Caesar Salad', price: 10.99, tag: 'Healthy', rating: 4.5, image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=400&q=80' },
];

export const RECENT_ORDERS = [
  { id: 'ORD-001', items: ['Classic Burger', 'Fries', 'Cola'], total: 18.99, status: 'Delivered', statusEmoji: '✅', date: 'Today, 2:30 PM', color: '#00B87C' },
  { id: 'ORD-002', items: ['Margherita Pizza', 'Garlic Bread'], total: 21.50, status: 'In Progress', statusEmoji: '🔥', date: 'Today, 1:15 PM', color: '#FF6B35' },
  { id: 'ORD-003', items: ['Grilled Steak', 'Mashed Potatoes'], total: 34.99, status: 'Delivered', statusEmoji: '✅', date: 'Yesterday', color: '#00B87C' },
  { id: 'ORD-004', items: ['Dragon Roll x2', 'Miso Soup'], total: 38.50, status: 'Delivered', statusEmoji: '✅', date: '2 days ago', color: '#00B87C' },
];

export const GALLERY_ITEMS = [
  { id: 1, url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=500&q=80', aspect: 0.67 },
  { id: 2, url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=500&q=80', aspect: 1.33 },
  { id: 3, url: 'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?auto=format&fit=crop&w=500&q=80', aspect: 1.0 },
  { id: 4, url: 'https://images.unsplash.com/photo-1466637574441-749b8f19452f?auto=format&fit=crop&w=500&q=80', aspect: 0.75 },
  { id: 5, url: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=500&q=80', aspect: 1.25 },
  { id: 6, url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=500&q=80', aspect: 0.8 },
];

export const LOYALTY = { points: 1240, tier: 'Gold', nextTier: 'Platinum', nextTierPoints: 2000, stamps: 5 };

export const MENU_ITEMS = [
  { id: 1, name: 'Classic Burger', price: 12.99, category: 'Mains', desc: 'Juicy beef patty with lettuce, tomato, pickles', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80' },
  { id: 2, name: 'Margherita Pizza', price: 14.99, category: 'Mains', desc: 'Fresh mozzarella, tomato, basil on crispy base', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80' },
  { id: 3, name: 'Grilled Steak', price: 28.99, category: 'Mains', desc: '200g prime cut, served with fries & salad', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=400&q=80' },
  { id: 4, name: 'Truffle Pasta', price: 18.99, category: 'Mains', desc: 'Fettuccine in creamy truffle & parmesan sauce', image: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?auto=format&fit=crop&w=400&q=80' },
  { id: 5, name: 'Dragon Roll', price: 16.99, category: 'Starters', desc: 'Avocado, tempura prawn, spicy mayo', image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=400&q=80' },
  { id: 6, name: 'Caesar Salad', price: 10.99, category: 'Starters', desc: 'Romaine, croutons, parmesan, caesar dressing', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=400&q=80' },
];

export const MENU_CATEGORIES = ['All', 'Mains', 'Starters', 'Desserts', 'Drinks'];
