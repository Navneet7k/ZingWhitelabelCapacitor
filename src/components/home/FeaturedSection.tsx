import React, { createContext, useContext } from 'react';
import { useTemplate } from '../../context/TemplateContext';
import { useHomeData } from '../../context/HomeDataContext';
import type { GalleryItem } from '../../services/homeApi';
import './FeaturedSection.css';

const FeaturedCtx = createContext<GalleryItem[]>([]);

const FeaturedSection: React.FC = () => {
  const { template } = useTemplate();
  const { data }     = useHomeData();
  const items = data?.featuredImages ?? [];

  if (!items.length) return null;

  return (
    <FeaturedCtx.Provider value={items}>
      {(() => { switch (template.id) {
        case 'luxe':     return <LuxeFeatured />;
        case 'fresh':    return <FreshFeatured />;
        case 'zen':      return <ZenFeatured />;
        case 'fiesta':   return <FiestaFeatured />;
        case 'neon':     return <NeonFeatured />;
        case 'rustic':   return <RusticFeatured />;
        case 'ocean':    return <OceanFeatured />;
        case 'blossom':  return <BlossomFeatured />;
        case 'cosmic':   return <CosmicFeatured />;
        case 'retro':    return <RetroFeatured />;
        case 'tropical': return <TropicalFeatured />;
        case 'royal':    return <RoyalFeatured />;
        default:         return <FreshFeatured />;
      }})()}
    </FeaturedCtx.Provider>
  );
};

/* ── Luxe ── dark cinematic wide cards with gold shimmer line */
const LuxeFeatured: React.FC = () => {
  const items = useContext(FeaturedCtx);
  return (
    <div className="section feat-section">
      <h2 className="section-title feat-title--luxe">Featured Dishes</h2>
      <div className="feat-scroll feat-scroll--luxe">
        {items.map((item, i) => (
          <div key={item.id} className="feat-card feat-card--luxe" style={{ animationDelay: `${i * 0.07}s` }}>
            <img src={item.url} alt="" className="feat-card__img" />
            <div className="feat-card--luxe__shimmer" />
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── Fresh ── clean white cards with rounded corners and subtle shadow */
const FreshFeatured: React.FC = () => {
  const items = useContext(FeaturedCtx);
  return (
    <div className="section feat-section">
      <h2 className="section-title feat-title--fresh">Featured Dishes</h2>
      <div className="feat-scroll feat-scroll--fresh">
        {items.map((item, i) => (
          <div key={item.id} className="feat-card feat-card--fresh" style={{ animationDelay: `${i * 0.07}s` }}>
            <img src={item.url} alt="" className="feat-card__img" />
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── Zen ── minimal, full-bleed scroll, extra whitespace */
const ZenFeatured: React.FC = () => {
  const items = useContext(FeaturedCtx);
  return (
    <div className="section feat-section">
      <h2 className="section-title feat-title--zen">Featured</h2>
      <div className="feat-scroll feat-scroll--zen">
        {items.map((item, i) => (
          <div key={item.id} className="feat-card feat-card--zen" style={{ animationDelay: `${i * 0.1}s` }}>
            <img src={item.url} alt="" className="feat-card__img" />
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── Fiesta ── colorful gradient badge + bold border */
const FiestaFeatured: React.FC = () => {
  const items = useContext(FeaturedCtx);
  const BADGES = ['🌟', '🔥', '🎉', '💃', '⭐', '🎊', '✨', '🎈'];
  return (
    <div className="section feat-section">
      <h2 className="section-title feat-title--fiesta">Featured Picks 🌟</h2>
      <div className="feat-scroll feat-scroll--fiesta">
        {items.map((item, i) => (
          <div key={item.id} className="feat-card feat-card--fiesta" style={{ animationDelay: `${i * 0.06}s` }}>
            <img src={item.url} alt="" className="feat-card__img" />
            <span className="feat-card--fiesta__badge">{BADGES[i % BADGES.length]}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── Neon ── dark bg, neon glow border, scanline overlay */
const NeonFeatured: React.FC = () => {
  const items = useContext(FeaturedCtx);
  return (
    <div className="section feat-section">
      <h2 className="section-title feat-title--neon">FEATURED.EXE</h2>
      <div className="feat-scroll feat-scroll--neon">
        {items.map((item, i) => (
          <div key={item.id} className="feat-card feat-card--neon" style={{ animationDelay: `${i * 0.06}s` }}>
            <img src={item.url} alt="" className="feat-card__img" />
            <div className="feat-card--neon__scanline" />
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── Rustic ── rough wood-like border, vintage label */
const RusticFeatured: React.FC = () => {
  const items = useContext(FeaturedCtx);
  return (
    <div className="section feat-section">
      <h2 className="section-title feat-title--rustic">House Specials</h2>
      <div className="feat-scroll feat-scroll--rustic">
        {items.map((item, i) => (
          <div key={item.id} className="feat-card feat-card--rustic" style={{ animationDelay: `${i * 0.08}s` }}>
            <img src={item.url} alt="" className="feat-card__img" />
            <div className="feat-card--rustic__tag">SPECIAL</div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── Ocean ── wave bottom mask, aqua gradient overlay */
const OceanFeatured: React.FC = () => {
  const items = useContext(FeaturedCtx);
  return (
    <div className="section feat-section">
      <h2 className="section-title feat-title--ocean">Featured Dishes</h2>
      <div className="feat-scroll feat-scroll--ocean">
        {items.map((item, i) => (
          <div key={item.id} className="feat-card feat-card--ocean" style={{ animationDelay: `${i * 0.06}s` }}>
            <img src={item.url} alt="" className="feat-card__img" />
            <div className="feat-card--ocean__wave" />
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── Blossom ── rounded with pink petal shadow */
const BlossomFeatured: React.FC = () => {
  const items = useContext(FeaturedCtx);
  return (
    <div className="section feat-section">
      <h2 className="section-title feat-title--blossom">Featured Dishes 🌸</h2>
      <div className="feat-scroll feat-scroll--blossom">
        {items.map((item, i) => (
          <div key={item.id} className="feat-card feat-card--blossom" style={{ animationDelay: `${i * 0.07}s` }}>
            <img src={item.url} alt="" className="feat-card__img" />
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── Cosmic ── deep space dark, subtle star-glow border */
const CosmicFeatured: React.FC = () => {
  const items = useContext(FeaturedCtx);
  return (
    <div className="section feat-section">
      <h2 className="section-title feat-title--cosmic">FEATURED.SYS</h2>
      <div className="feat-scroll feat-scroll--cosmic">
        {items.map((item, i) => (
          <div key={item.id} className="feat-card feat-card--cosmic" style={{ animationDelay: `${i * 0.07}s` }}>
            <img src={item.url} alt="" className="feat-card__img" />
            <div className="feat-card--cosmic__glow" />
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── Retro ── film-strip frame with sepia tint strip */
const RetroFeatured: React.FC = () => {
  const items = useContext(FeaturedCtx);
  return (
    <div className="section feat-section">
      <h2 className="section-title feat-title--retro">Today's Specials</h2>
      <div className="feat-scroll feat-scroll--retro">
        {items.map((item, i) => (
          <div key={item.id} className="feat-card feat-card--retro" style={{ animationDelay: `${i * 0.06}s` }}>
            <div className="feat-card--retro__holes">
              {[...Array(4)].map((_, h) => <span key={h} className="feat-card--retro__hole" />)}
            </div>
            <img src={item.url} alt="" className="feat-card__img" />
            <div className="feat-card--retro__holes">
              {[...Array(4)].map((_, h) => <span key={h} className="feat-card--retro__hole" />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── Tropical ── vibrant, leaf emoji badge, rounded */
const TropicalFeatured: React.FC = () => {
  const items = useContext(FeaturedCtx);
  return (
    <div className="section feat-section">
      <h2 className="section-title feat-title--tropical">Island Specials 🌴</h2>
      <div className="feat-scroll feat-scroll--tropical">
        {items.map((item, i) => (
          <div key={item.id} className="feat-card feat-card--tropical" style={{ animationDelay: `${i * 0.07}s` }}>
            <img src={item.url} alt="" className="feat-card__img" />
            <span className="feat-card--tropical__leaf">🌿</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── Royal ── ornate gold-bordered showcase cards */
const RoyalFeatured: React.FC = () => {
  const items = useContext(FeaturedCtx);
  return (
    <div className="section feat-section">
      <h2 className="section-title feat-title--royal">Featured Selections</h2>
      <div className="feat-scroll feat-scroll--royal">
        {items.map((item, i) => (
          <div key={item.id} className="feat-card feat-card--royal" style={{ animationDelay: `${i * 0.08}s` }}>
            <div className="feat-card--royal__corner feat-card--royal__corner--tl" />
            <div className="feat-card--royal__corner feat-card--royal__corner--tr" />
            <img src={item.url} alt="" className="feat-card__img" />
            <div className="feat-card--royal__corner feat-card--royal__corner--bl" />
            <div className="feat-card--royal__corner feat-card--royal__corner--br" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default FeaturedSection;
