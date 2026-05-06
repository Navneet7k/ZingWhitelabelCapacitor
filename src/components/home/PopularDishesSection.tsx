import React from 'react';
import { POPULAR_DISHES } from '../../config/mockData';
import { useTemplate } from '../../context/TemplateContext';
import './PopularDishesSection.css';

const PopularDishesSection: React.FC = () => {
  const { template } = useTemplate();
  switch (template.id) {
    case 'luxe':   return <LuxeDishes />;
    case 'fresh':  return <FreshDishes />;
    case 'street': return <StreetDishes />;
    case 'zen':    return <ZenDishes />;
    case 'fiesta': return <FiestaDishes />;
    default:       return <FreshDishes />;
  }
};

const FIESTA_GRADIENTS = [
  'linear-gradient(135deg,rgba(255,107,107,0.7),rgba(255,142,83,0.7))',
  'linear-gradient(135deg,rgba(78,205,196,0.7),rgba(69,183,209,0.7))',
  'linear-gradient(135deg,rgba(255,230,109,0.7),rgba(255,195,0,0.7))',
  'linear-gradient(135deg,rgba(168,230,207,0.7),rgba(61,153,112,0.7))',
  'linear-gradient(135deg,rgba(162,155,254,0.7),rgba(100,107,255,0.7))',
  'linear-gradient(135deg,rgba(255,193,142,0.7),rgba(255,120,60,0.7))',
];

/* ── LUXE: Vertical stacked portrait cards ── */
const LuxeDishes: React.FC = () => (
  <div className="section">
    <h2 className="section-title">Popular Dishes</h2>
    <div className="luxe-dishes__scroll">
      {POPULAR_DISHES.map((dish, i) => (
        <div key={dish.id} className="luxe-dish-card" style={{ animationDelay: `${i * 0.08}s` }}>
          <img src={dish.image} alt={dish.name} className="luxe-dish-card__img" />
          <div className="luxe-dish-card__overlay">
            <span className="luxe-dish-card__tag">{dish.tag}</span>
            <h3 className="luxe-dish-card__name">{dish.name}</h3>
            <span className="luxe-dish-card__price">${dish.price.toFixed(2)}</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

/* ── FRESH: 2-column grid ── */
const FreshDishes: React.FC = () => (
  <div className="section">
    <h2 className="section-title">Popular Dishes</h2>
    <div className="fresh-dishes__grid">
      {POPULAR_DISHES.map((dish, i) => (
        <div key={dish.id} className="fresh-dish-card" style={{ animationDelay: `${i * 0.07}s` }}>
          <div className="fresh-dish-card__img-wrap">
            <img src={dish.image} alt={dish.name} />
            <span className="fresh-dish-card__tag">{dish.tag}</span>
          </div>
          <div className="fresh-dish-card__body">
            <h3 className="fresh-dish-card__name">{dish.name}</h3>
            <div className="fresh-dish-card__row">
              <span className="fresh-dish-card__price">${dish.price.toFixed(2)}</span>
              <button className="fresh-dish-card__add">+</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

/* ── STREET: Horizontal scroll with sticker badges ── */
const STREET_STICKERS = ['🔥', '⭐', '💎', '🆕', '🌶️', '✅'];
const StreetDishes: React.FC = () => (
  <div className="section">
    <h2 className="section-title">What's Hot</h2>
    <div className="street-dishes__track">
      {POPULAR_DISHES.map((dish, i) => (
        <div key={dish.id} className="street-dish-card" style={{ animationDelay: `${i * 0.06}s` }}>
          <div className="street-dish-card__img-wrap">
            <img src={dish.image} alt={dish.name} />
            <span className="street-dish-card__sticker">{STREET_STICKERS[i]}</span>
          </div>
          <div className="street-dish-card__body">
            <h3 className="street-dish-card__name">{dish.name.toUpperCase()}</h3>
            <div className="street-dish-card__row">
              <span className="street-dish-card__price">${dish.price.toFixed(2)}</span>
              <span className="street-dish-card__rating">★ {dish.rating}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

/* ── ZEN: Single-column full-width ── */
const ZenDishes: React.FC = () => (
  <div className="section">
    <h2 className="section-title">Today's Selection</h2>
    {POPULAR_DISHES.slice(0, 4).map((dish, i) => (
      <div key={dish.id} className="zen-dish-row" style={{ animationDelay: `${i * 0.1}s` }}>
        <img src={dish.image} alt={dish.name} className="zen-dish-row__img" />
        <div className="zen-dish-row__body">
          <h3 className="zen-dish-row__name">{dish.name}</h3>
          <div className="zen-dish-row__meta">
            <span className="zen-dish-row__tag">{dish.tag}</span>
            <span className="zen-dish-row__rating">★ {dish.rating}</span>
          </div>
        </div>
        <span className="zen-dish-row__price">${dish.price.toFixed(2)}</span>
      </div>
    ))}
  </div>
);

/* ── FIESTA: Horizontal scroll with gradient overlays ── */
const FiestaDishes: React.FC = () => (
  <div className="section">
    <h2 className="section-title">Popular Dishes 🍽️</h2>
    <div className="fiesta-dishes__track">
      {POPULAR_DISHES.map((dish, i) => (
        <div key={dish.id} className="fiesta-dish-card" style={{ animationDelay: `${i * 0.07}s` }}>
          <img src={dish.image} alt={dish.name} className="fiesta-dish-card__img" />
          <div className="fiesta-dish-card__gradient" style={{ background: FIESTA_GRADIENTS[i] }} />
          <div className="fiesta-dish-card__content">
            <span className="fiesta-dish-card__tag">{dish.tag}</span>
            <h3 className="fiesta-dish-card__name">{dish.name}</h3>
            <div className="fiesta-dish-card__row">
              <span className="fiesta-dish-card__price">${dish.price.toFixed(2)}</span>
              <button className="fiesta-dish-card__add">＋</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default PopularDishesSection;
