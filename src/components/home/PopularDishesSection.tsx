import React, { createContext, useContext } from 'react';
import { POPULAR_DISHES as MOCK_DISHES } from '../../config/mockData';
import { useTemplate } from '../../context/TemplateContext';
import { useHomeData } from '../../context/HomeDataContext';
import type { Dish } from '../../services/homeApi';
import './PopularDishesSection.css';

const DishesCtx = createContext<Dish[]>(MOCK_DISHES);

const PopularDishesSection: React.FC = () => {
  const { template } = useTemplate();
  const { data }     = useHomeData();
  const dishes = (data?.popularDishes && data.popularDishes.length > 0) ? data.popularDishes : MOCK_DISHES;

  return (
    <DishesCtx.Provider value={dishes}>
      {(() => { switch (template.id) {
        case 'luxe':    return <LuxeDishes />;
        case 'fresh':   return <FreshDishes />;
        case 'zen':     return <ZenDishes />;
        case 'fiesta':  return <FiestaDishes />;
        case 'neon':    return <NeonDishes />;
        case 'rustic':  return <RusticDishes />;
        case 'ocean':   return <OceanDishes />;
        case 'blossom': return <BlossomDishes />;
        case 'cosmic':  return <CosmicDishes />;
        case 'retro':    return <RetroDishes />;
        case 'tropical': return <TropicalDishes />;
        case 'royal':    return <RoyalDishes />;
        default:         return <FreshDishes />;
      }})()}
    </DishesCtx.Provider>
  );
};

const FIESTA_GRADIENTS = [
  'linear-gradient(135deg,rgba(255,107,107,0.7),rgba(255,142,83,0.7))',
  'linear-gradient(135deg,rgba(78,205,196,0.7),rgba(69,183,209,0.7))',
  'linear-gradient(135deg,rgba(255,230,109,0.7),rgba(255,195,0,0.7))',
  'linear-gradient(135deg,rgba(168,230,207,0.7),rgba(61,153,112,0.7))',
  'linear-gradient(135deg,rgba(162,155,254,0.7),rgba(100,107,255,0.7))',
  'linear-gradient(135deg,rgba(255,193,142,0.7),rgba(255,120,60,0.7))',
];

// Helper: show price only if available
const Price: React.FC<{ dish: Dish; className: string }> = ({ dish, className }) =>
  dish.price != null ? <span className={className}>${dish.price.toFixed(2)}</span> : null;

const LuxeDishes: React.FC = () => {
  const POPULAR_DISHES = useContext(DishesCtx);
  return (
    <div className="section">
      <h2 className="section-title">Popular Dishes</h2>
      <div className="luxe-dishes__scroll">
        {POPULAR_DISHES.map((dish, i) => (
          <div key={dish.id} className="luxe-dish-card" style={{ animationDelay: `${i * 0.08}s` }}>
            <img src={dish.image} alt={dish.name} className="luxe-dish-card__img" />
            <div className="luxe-dish-card__overlay">
              <h3 className="luxe-dish-card__name">{dish.name}</h3>
              {dish.description && <p className="luxe-dish-card__desc">{dish.description}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const FreshDishes: React.FC = () => {
  const POPULAR_DISHES = useContext(DishesCtx);
  return (
    <div className="section">
      <h2 className="section-title">Popular Dishes</h2>
      <div className="fresh-dishes__grid">
        {POPULAR_DISHES.map((dish, i) => (
          <div key={dish.id} className="fresh-dish-card" style={{ animationDelay: `${i * 0.07}s` }}>
            <div className="fresh-dish-card__img-wrap">
              <img src={dish.image} alt={dish.name} />
            </div>
            <div className="fresh-dish-card__body">
              <h3 className="fresh-dish-card__name">{dish.name}</h3>
              {dish.description && <p className="fresh-dish-card__desc">{dish.description}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const STREET_STICKERS = ['🔥', '⭐', '💎', '🆕', '🌶️', '✅'];
const StreetDishes: React.FC = () => {
  const POPULAR_DISHES = useContext(DishesCtx);
  return (
    <div className="section">
      <h2 className="section-title">What's Hot</h2>
      <div className="street-dishes__track">
        {POPULAR_DISHES.map((dish, i) => (
          <div key={dish.id} className="street-dish-card" style={{ animationDelay: `${i * 0.06}s` }}>
            <div className="street-dish-card__img-wrap">
              <img src={dish.image} alt={dish.name} />
              <span className="street-dish-card__sticker">{STREET_STICKERS[i % STREET_STICKERS.length]}</span>
            </div>
            <div className="street-dish-card__body">
              <h3 className="street-dish-card__name">{dish.name.toUpperCase()}</h3>
              <div className="street-dish-card__row">
                <Price dish={dish} className="street-dish-card__price" />
                {dish.rating != null && <span className="street-dish-card__rating">★ {dish.rating}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ZenDishes: React.FC = () => {
  const POPULAR_DISHES = useContext(DishesCtx);
  return (
    <div className="section">
      <h2 className="section-title">Today's Selection</h2>
      {POPULAR_DISHES.slice(0, 4).map((dish, i) => (
        <div key={dish.id} className="zen-dish-row" style={{ animationDelay: `${i * 0.1}s` }}>
          <img src={dish.image} alt={dish.name} className="zen-dish-row__img" />
          <div className="zen-dish-row__body">
            <h3 className="zen-dish-row__name">{dish.name}</h3>
            {dish.description && <p className="zen-dish-row__desc">{dish.description}</p>}
          </div>
        </div>
      ))}
    </div>
  );
};

const FiestaImg: React.FC<{ src: string; alt?: string; cls?: string }> = ({ src, alt = '', cls }) => {
  const [loaded, setLoaded]   = React.useState(false);
  const [errored, setErrored] = React.useState(false);
  if (!src || errored) return null;
  return (
    <div className={cls} style={{ position: 'relative', overflow: 'hidden' }}>
      <div className="fiesta-shimmer" style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', opacity: loaded ? 0 : 1, transition: 'opacity 0.4s ease', pointerEvents: 'none' }} />
      <img src={src} alt={alt}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: loaded ? 1 : 0, transition: 'opacity 0.4s ease' }}
        onLoad={() => setLoaded(true)} onError={() => setErrored(true)} loading="lazy" decoding="async" />
    </div>
  );
};

const FiestaDishes: React.FC = () => {
  const POPULAR_DISHES = useContext(DishesCtx);
  return (
    <div className="section">
      <h2 className="section-title">Popular Dishes 🍽️</h2>
      <div className="fiesta-dishes__track">
        {POPULAR_DISHES.map((dish, i) => (
          <div key={dish.id} className="fiesta-dish-card" style={{ animationDelay: `${i * 0.07}s` }}>
            <FiestaImg src={dish.image} alt={dish.name} cls="fiesta-dish-card__img" />
            <div className="fiesta-dish-card__gradient" style={{ background: FIESTA_GRADIENTS[i % FIESTA_GRADIENTS.length] }} />
            <div className="fiesta-dish-card__content">
              <h3 className="fiesta-dish-card__name">{dish.name}</h3>
              {dish.description && <p className="fiesta-dish-card__desc">{dish.description}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const NeonDishes: React.FC = () => {
  const POPULAR_DISHES = useContext(DishesCtx);
  return (
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
                <Price dish={dish} className="neon-dish-card__price" />
                <button className="neon-dish-card__add">+</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const RusticDishes: React.FC = () => {
  const POPULAR_DISHES = useContext(DishesCtx);
  return (
    <div className="section">
      <h2 className="section-title">From Our Kitchen</h2>
      <div className="rustic-dishes__track">
        {POPULAR_DISHES.map((dish, i) => (
          <div key={dish.id} className="rustic-dish-card" style={{ animationDelay: `${i * 0.08}s` }}>
            <img src={dish.image} alt={dish.name} className="rustic-dish-card__img" />
            <div className="rustic-dish-card__body">
              <h3 className="rustic-dish-card__name">{dish.name}</h3>
              {dish.description && <p className="rustic-dish-card__desc">{dish.description}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const OceanDishes: React.FC = () => {
  const POPULAR_DISHES = useContext(DishesCtx);
  return (
    <div className="section">
      <h2 className="section-title">Today's Catch</h2>
      <div className="ocean-dishes__list">
        {POPULAR_DISHES.slice(0, 4).map((dish, i) => (
          <div key={dish.id} className="ocean-dish-row" style={{ animationDelay: `${i * 0.08}s` }}>
            <img src={dish.image} alt={dish.name} className="ocean-dish-row__img" />
            <div className="ocean-dish-row__body">
              <h3 className="ocean-dish-row__name">{dish.name}</h3>
              {dish.description && <p className="ocean-dish-row__desc">{dish.description}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const BlossomDishes: React.FC = () => {
  const POPULAR_DISHES = useContext(DishesCtx);
  return (
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
              {dish.description && <p className="blossom-dish-card__desc">{dish.description}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const EmberDishes: React.FC = () => {
  const POPULAR_DISHES = useContext(DishesCtx);
  return (
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
                <Price dish={dish} className="ember-dish-card__price" />
                <button className="ember-dish-card__add">ORDER</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const CosmicDishes: React.FC = () => {
  const POPULAR_DISHES = useContext(DishesCtx);
  return (
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
                <Price dish={dish} className="cosmic-dish-card__price" />
                <button className="cosmic-dish-card__add">+</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const RetroDishes: React.FC = () => {
  const POPULAR_DISHES = useContext(DishesCtx);
  return (
    <div className="section">
      <h2 className="section-title">Today's Specials</h2>
      <div className="retro-dishes__list">
        {POPULAR_DISHES.slice(0, 5).map((dish, i) => (
          <div key={dish.id} className="retro-dish-row" style={{ animationDelay: `${i * 0.06}s` }}>
            <img src={dish.image} alt={dish.name} className="retro-dish-row__img" />
            <div className="retro-dish-row__body">
              <h3 className="retro-dish-row__name">{dish.name}</h3>
              {dish.description && <p className="retro-dish-row__desc">{dish.description}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const RoyalDishes: React.FC = () => {
  const POPULAR_DISHES = useContext(DishesCtx);
  return (
    <div className="section">
      <h2 className="section-title">From The Kitchen</h2>
      <div className="royal-dishes__track">
        {POPULAR_DISHES.map((dish, i) => (
          <div key={dish.id} className="royal-dish-card" style={{ animationDelay: `${i * 0.08}s` }}>
            <img src={dish.image} alt={dish.name} className="royal-dish-card__img" />
            <div className="royal-dish-card__body">
              <h3 className="royal-dish-card__name">{dish.name}</h3>
              {dish.description && <p className="royal-dish-card__desc">{dish.description}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const TROPICAL_FRUITS = ['🥭', '🍍', '🥥', '🍋', '🌶️', '🫐'];
const TropicalDishes: React.FC = () => {
  const POPULAR_DISHES = useContext(DishesCtx);
  return (
    <div className="section">
      <h2 className="section-title">Island Favorites 🥭</h2>
      <div className="tropical-dishes__track">
        {POPULAR_DISHES.map((dish, i) => (
          <div key={dish.id} className="tropical-dish-card" style={{ animationDelay: `${i * 0.07}s` }}>
            <div className="tropical-dish-card__img-wrap">
              <img src={dish.image} alt={dish.name} />
              <span className="tropical-dish-card__fruit">{TROPICAL_FRUITS[i % TROPICAL_FRUITS.length]}</span>
            </div>
            <div className="tropical-dish-card__body">
              <h3 className="tropical-dish-card__name">{dish.name}</h3>
              {dish.description && <p className="tropical-dish-card__desc">{dish.description}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PopularDishesSection;
