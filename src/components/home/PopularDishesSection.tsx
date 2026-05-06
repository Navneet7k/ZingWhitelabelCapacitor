import React from 'react';
import { POPULAR_DISHES } from '../../config/mockData';
import { useTemplate } from '../../context/TemplateContext';
import './PopularDishesSection.css';

const PopularDishesSection: React.FC = () => {
  const { template } = useTemplate();
  switch (template.id) {
    case 'luxe':    return <LuxeDishes />;
    case 'fresh':   return <FreshDishes />;
    case 'street':  return <StreetDishes />;
    case 'zen':     return <ZenDishes />;
    case 'fiesta':  return <FiestaDishes />;
    case 'neon':    return <NeonDishes />;
    case 'rustic':  return <RusticDishes />;
    case 'ocean':   return <OceanDishes />;
    case 'blossom': return <BlossomDishes />;
    case 'ember':   return <EmberDishes />;
    case 'cosmic':  return <CosmicDishes />;
    case 'retro':   return <RetroDishes />;
    default:        return <FreshDishes />;
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

/* ── NEON: Dark cards with neon price ── */
const NeonDishes: React.FC = () => (
  <div className="section">
    <h2 className="section-title">MENU.DAT</h2>
    <div className="neon-dishes__grid">
      {POPULAR_DISHES.map((dish, i) => (
        <div key={dish.id} className="neon-dish-card" style={{ animationDelay: `${i * 0.07}s` }}>
          <img src={dish.image} alt={dish.name} className="neon-dish-card__img" />
          <div className="neon-dish-card__body">
            <span className="neon-dish-card__tag">{dish.tag}</span>
            <h3 className="neon-dish-card__name">{dish.name}</h3>
            <div className="neon-dish-card__row">
              <span className="neon-dish-card__price">${dish.price.toFixed(2)}</span>
              <button className="neon-dish-card__add">+</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

/* ── RUSTIC: Warm cards with terracotta tag ── */
const RusticDishes: React.FC = () => (
  <div className="section">
    <h2 className="section-title">From Our Kitchen</h2>
    <div className="rustic-dishes__track">
      {POPULAR_DISHES.map((dish, i) => (
        <div key={dish.id} className="rustic-dish-card" style={{ animationDelay: `${i * 0.08}s` }}>
          <img src={dish.image} alt={dish.name} className="rustic-dish-card__img" />
          <div className="rustic-dish-card__body">
            <span className="rustic-dish-card__tag">{dish.tag}</span>
            <h3 className="rustic-dish-card__name">{dish.name}</h3>
            <div className="rustic-dish-card__row">
              <span className="rustic-dish-card__price">${dish.price.toFixed(2)}</span>
              <span className="rustic-dish-card__rating">★ {dish.rating}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

/* ── OCEAN: Horizontal cards with wave accent ── */
const OceanDishes: React.FC = () => (
  <div className="section">
    <h2 className="section-title">Today's Catch</h2>
    <div className="ocean-dishes__list">
      {POPULAR_DISHES.slice(0, 4).map((dish, i) => (
        <div key={dish.id} className="ocean-dish-row" style={{ animationDelay: `${i * 0.08}s` }}>
          <img src={dish.image} alt={dish.name} className="ocean-dish-row__img" />
          <div className="ocean-dish-row__body">
            <span className="ocean-dish-row__tag">{dish.tag}</span>
            <h3 className="ocean-dish-row__name">{dish.name}</h3>
            <div className="ocean-dish-row__row">
              <span className="ocean-dish-row__price">${dish.price.toFixed(2)}</span>
              <button className="ocean-dish-row__add">Add →</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

/* ── BLOSSOM: Soft rounded cards with pink gradient ── */
const BlossomDishes: React.FC = () => (
  <div className="section">
    <h2 className="section-title">Sweet Selections</h2>
    <div className="blossom-dishes__track">
      {POPULAR_DISHES.map((dish, i) => (
        <div key={dish.id} className="blossom-dish-card" style={{ animationDelay: `${i * 0.07}s` }}>
          <div className="blossom-dish-card__img-wrap">
            <img src={dish.image} alt={dish.name} />
            <div className="blossom-dish-card__heart">♡</div>
          </div>
          <div className="blossom-dish-card__body">
            <h3 className="blossom-dish-card__name">{dish.name}</h3>
            <span className="blossom-dish-card__tag">{dish.tag}</span>
            <div className="blossom-dish-card__row">
              <span className="blossom-dish-card__price">${dish.price.toFixed(2)}</span>
              <button className="blossom-dish-card__add">+</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

/* ── EMBER: Dark dramatic cards ── */
const EmberDishes: React.FC = () => (
  <div className="section">
    <h2 className="section-title">OFF THE GRILL</h2>
    <div className="ember-dishes__track">
      {POPULAR_DISHES.map((dish, i) => (
        <div key={dish.id} className="ember-dish-card" style={{ animationDelay: `${i * 0.07}s` }}>
          <img src={dish.image} alt={dish.name} className="ember-dish-card__img" />
          <div className="ember-dish-card__glow" />
          <div className="ember-dish-card__body">
            <span className="ember-dish-card__tag">🔥 {dish.tag}</span>
            <h3 className="ember-dish-card__name">{dish.name.toUpperCase()}</h3>
            <div className="ember-dish-card__row">
              <span className="ember-dish-card__price">${dish.price.toFixed(2)}</span>
              <button className="ember-dish-card__add">ORDER</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

/* ── COSMIC: Holographic horizontal cards ── */
const CosmicDishes: React.FC = () => (
  <div className="section">
    <h2 className="section-title">FEATURED.DAT</h2>
    <div className="cosmic-dishes__track">
      {POPULAR_DISHES.map((dish, i) => (
        <div key={dish.id} className="cosmic-dish-card" style={{ animationDelay: `${i * 0.07}s` }}>
          <img src={dish.image} alt={dish.name} className="cosmic-dish-card__img" />
          <div className="cosmic-dish-card__glow" />
          <div className="cosmic-dish-card__body">
            <span className="cosmic-dish-card__tag">{dish.tag}</span>
            <h3 className="cosmic-dish-card__name">{dish.name}</h3>
            <div className="cosmic-dish-card__row">
              <span className="cosmic-dish-card__price">${dish.price.toFixed(2)}</span>
              <button className="cosmic-dish-card__add">+</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

/* ── RETRO: Diner menu board cards ── */
const RetroDishes: React.FC = () => (
  <div className="section">
    <h2 className="section-title">Today's Specials</h2>
    <div className="retro-dishes__list">
      {POPULAR_DISHES.slice(0, 5).map((dish, i) => (
        <div key={dish.id} className="retro-dish-row" style={{ animationDelay: `${i * 0.06}s` }}>
          <img src={dish.image} alt={dish.name} className="retro-dish-row__img" />
          <div className="retro-dish-row__body">
            <h3 className="retro-dish-row__name">{dish.name}</h3>
            <span className="retro-dish-row__tag">{dish.tag}</span>
          </div>
          <div className="retro-dish-row__right">
            <span className="retro-dish-row__price">${dish.price.toFixed(2)}</span>
            <button className="retro-dish-row__add">ORDER</button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default PopularDishesSection;
