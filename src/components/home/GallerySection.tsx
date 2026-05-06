import React from 'react';
import { GALLERY_ITEMS } from '../../config/mockData';
import { useTemplate } from '../../context/TemplateContext';
import './GallerySection.css';

const POLAROID_ROTATIONS = [-3.5, 2.8, -2.1, 3.7, -1.5, 2.4];

const GallerySection: React.FC = () => {
  const { template } = useTemplate();
  switch (template.id) {
    case 'luxe':    return <LuxeGallery />;
    case 'fresh':   return <FreshGallery />;
    case 'street':  return <StreetGallery />;
    case 'zen':     return <ZenGallery />;
    case 'fiesta':  return <FiestaGallery />;
    case 'neon':    return <NeonGallery />;
    case 'rustic':  return <RusticGallery />;
    case 'ocean':   return <OceanGallery />;
    case 'blossom': return <BlossomGallery />;
    case 'ember':   return <EmberGallery />;
    default:        return <FreshGallery />;
  }
};

/* ── LUXE: 2-col masonry with gold glow ── */
const LuxeGallery: React.FC = () => (
  <div className="section" style={{ paddingBottom: 16 }}>
    <h2 className="section-title">Our Gallery</h2>
    <div className="luxe-gallery">
      {GALLERY_ITEMS.map((item, i) => (
        <div key={item.id} className="luxe-gallery__tile" style={{ animationDelay: `${i * 0.07}s` }}>
          <img src={item.url} alt="" style={{ aspectRatio: item.aspect }} />
        </div>
      ))}
    </div>
  </div>
);

/* ── FRESH: 3-col uniform grid ── */
const FreshGallery: React.FC = () => (
  <div className="section" style={{ paddingBottom: 16 }}>
    <h2 className="section-title">Our Gallery</h2>
    <div className="fresh-gallery">
      {GALLERY_ITEMS.map((item, i) => (
        <div
          key={item.id}
          className={`fresh-gallery__tile stagger-${Math.min(i + 1, 6)}`}
        >
          <img src={item.url} alt="" />
        </div>
      ))}
    </div>
  </div>
);

/* ── STREET: Polaroid frames ── */
const StreetGallery: React.FC = () => (
  <div className="section" style={{ paddingBottom: 24 }}>
    <h2 className="section-title">From The Streets</h2>
    <div className="street-gallery__track">
      {GALLERY_ITEMS.map((item, i) => (
        <div
          key={item.id}
          className="street-polaroid"
          style={{
            transform: `rotate(${POLAROID_ROTATIONS[i]}deg)`,
            animationDelay: `${i * 0.07}s`,
          }}
        >
          <img src={item.url} alt="" className="street-polaroid__img" />
          <div className="street-polaroid__label">ZING</div>
        </div>
      ))}
    </div>
  </div>
);

/* ── ZEN: Staggered 2-col minimal ── */
const ZenGallery: React.FC = () => (
  <div className="section" style={{ paddingBottom: 24 }}>
    <h2 className="section-title">Our Gallery</h2>
    <div className="zen-gallery">
      {GALLERY_ITEMS.map((item, i) => (
        <div key={item.id} className="zen-gallery__tile" style={{ animationDelay: `${i * 0.1}s` }}>
          <img src={item.url} alt="" style={{ aspectRatio: item.aspect }} />
        </div>
      ))}
    </div>
  </div>
);

/* ── FIESTA: Instagram-style 3-col ── */
const FiestaGallery: React.FC = () => {
  const [liked, setLiked] = React.useState<Set<number>>(new Set());
  const toggle = (id: number) => setLiked(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  return (
    <div className="section" style={{ paddingBottom: 16 }}>
      <h2 className="section-title">Our Gallery 📸</h2>
      <div className="fiesta-gallery">
        {GALLERY_ITEMS.map((item, i) => (
          <div key={item.id} className="fiesta-gallery__tile" style={{ animationDelay: `${i * 0.06}s` }}>
            <img src={item.url} alt="" />
            <button
              className={`fiesta-gallery__like ${liked.has(item.id) ? 'liked' : ''}`}
              onClick={() => toggle(item.id)}
            >
              {liked.has(item.id) ? '❤️' : '🤍'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const NeonGallery: React.FC = () => (
  <div className="section" style={{ paddingBottom: 16 }}><h2 className="section-title">GALLERY.EXE</h2>
    <div className="neon-gallery">{GALLERY_ITEMS.map((item, i) => <div key={item.id} className="neon-gallery__tile" style={{ animationDelay: `${i * 0.06}s` }}><img src={item.url} alt="" /></div>)}</div>
  </div>
);

const RusticGallery: React.FC = () => (
  <div className="section" style={{ paddingBottom: 24 }}><h2 className="section-title">Our Gallery</h2>
    <div className="rustic-gallery">{GALLERY_ITEMS.map((item, i) => <div key={item.id} className="rustic-gallery__tile" style={{ animationDelay: `${i * 0.08}s` }}><img src={item.url} alt="" /><div className="rustic-gallery__label">ZING</div></div>)}</div>
  </div>
);

const OceanGallery: React.FC = () => (
  <div className="section" style={{ paddingBottom: 16 }}><h2 className="section-title">Our Gallery</h2>
    <div className="ocean-gallery">{GALLERY_ITEMS.map((item, i) => <div key={item.id} className="ocean-gallery__tile" style={{ animationDelay: `${i * 0.06}s` }}><img src={item.url} alt="" /></div>)}</div>
  </div>
);

const BlossomGallery: React.FC = () => (
  <div className="section" style={{ paddingBottom: 16 }}><h2 className="section-title">Our Gallery 🌸</h2>
    <div className="blossom-gallery">{GALLERY_ITEMS.map((item, i) => <div key={item.id} className="blossom-gallery__tile" style={{ animationDelay: `${i * 0.07}s` }}><img src={item.url} alt="" /></div>)}</div>
  </div>
);

const EmberGallery: React.FC = () => (
  <div className="section" style={{ paddingBottom: 24 }}><h2 className="section-title">GALLERY</h2>
    <div className="ember-gallery">{GALLERY_ITEMS.map((item, i) => <div key={item.id} className="ember-gallery__tile" style={{ animationDelay: `${i * 0.07}s` }}><img src={item.url} alt="" /></div>)}</div>
  </div>
);

export default GallerySection;
