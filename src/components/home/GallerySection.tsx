import React, { createContext, useContext } from 'react';
import { GALLERY_ITEMS as MOCK_GALLERY } from '../../config/mockData';
import { useTemplate } from '../../context/TemplateContext';
import { useHomeData } from '../../context/HomeDataContext';
import type { GalleryItem } from '../../services/homeApi';
import './GallerySection.css';

const GalleryCtx = createContext<GalleryItem[]>(MOCK_GALLERY);

const POLAROID_ROTATIONS = [-3.5, 2.8, -2.1, 3.7, -1.5, 2.4];

const GallerySection: React.FC = () => {
  const { template } = useTemplate();
  const { data }     = useHomeData();
  const items = (data?.gallery && data.gallery.length > 0) ? data.gallery : MOCK_GALLERY;

  return (
    <GalleryCtx.Provider value={items}>
      {(() => { switch (template.id) {
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
        case 'cosmic':  return <CosmicGallery />;
        case 'retro':   return <RetroGallery />;
        default:        return <FreshGallery />;
      }})()}
    </GalleryCtx.Provider>
  );
};

const LuxeGallery: React.FC = () => {
  const GALLERY_ITEMS = useContext(GalleryCtx);
  return (
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
};

const FreshGallery: React.FC = () => {
  const GALLERY_ITEMS = useContext(GalleryCtx);
  return (
    <div className="section" style={{ paddingBottom: 16 }}>
      <h2 className="section-title">Our Gallery</h2>
      <div className="fresh-gallery">
        {GALLERY_ITEMS.map((item, i) => (
          <div key={item.id} className={`fresh-gallery__tile stagger-${Math.min(i + 1, 6)}`}>
            <img src={item.url} alt="" />
          </div>
        ))}
      </div>
    </div>
  );
};

const StreetGallery: React.FC = () => {
  const GALLERY_ITEMS = useContext(GalleryCtx);
  return (
    <div className="section" style={{ paddingBottom: 24 }}>
      <h2 className="section-title">From The Streets</h2>
      <div className="street-gallery__track">
        {GALLERY_ITEMS.map((item, i) => (
          <div key={item.id} className="street-polaroid"
            style={{ transform: `rotate(${POLAROID_ROTATIONS[i % POLAROID_ROTATIONS.length]}deg)`, animationDelay: `${i * 0.07}s` }}>
            <img src={item.url} alt="" className="street-polaroid__img" />
            <div className="street-polaroid__label">ZING</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ZenGallery: React.FC = () => {
  const GALLERY_ITEMS = useContext(GalleryCtx);
  return (
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
};

const FiestaGallery: React.FC = () => {
  const GALLERY_ITEMS = useContext(GalleryCtx);
  const [liked, setLiked] = React.useState<Set<number>>(new Set());
  const toggle = (id: number) => setLiked(prev => {
    const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next;
  });
  return (
    <div className="section" style={{ paddingBottom: 16 }}>
      <h2 className="section-title">Our Gallery 📸</h2>
      <div className="fiesta-gallery">
        {GALLERY_ITEMS.map((item, i) => (
          <div key={item.id} className="fiesta-gallery__tile" style={{ animationDelay: `${i * 0.06}s` }}>
            <img src={item.url} alt="" />
            <button className={`fiesta-gallery__like ${liked.has(item.id) ? 'liked' : ''}`} onClick={() => toggle(item.id)}>
              {liked.has(item.id) ? '❤️' : '🤍'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const NeonGallery: React.FC = () => {
  const GALLERY_ITEMS = useContext(GalleryCtx);
  return (
    <div className="section" style={{ paddingBottom: 16 }}><h2 className="section-title">GALLERY.EXE</h2>
      <div className="neon-gallery">{GALLERY_ITEMS.map((item, i) => <div key={item.id} className="neon-gallery__tile" style={{ animationDelay: `${i * 0.06}s` }}><img src={item.url} alt="" /></div>)}</div>
    </div>
  );
};

const RusticGallery: React.FC = () => {
  const GALLERY_ITEMS = useContext(GalleryCtx);
  return (
    <div className="section" style={{ paddingBottom: 24 }}><h2 className="section-title">Our Gallery</h2>
      <div className="rustic-gallery">{GALLERY_ITEMS.map((item, i) => <div key={item.id} className="rustic-gallery__tile" style={{ animationDelay: `${i * 0.08}s` }}><img src={item.url} alt="" /><div className="rustic-gallery__label">ZING</div></div>)}</div>
    </div>
  );
};

const OceanGallery: React.FC = () => {
  const GALLERY_ITEMS = useContext(GalleryCtx);
  return (
    <div className="section" style={{ paddingBottom: 16 }}><h2 className="section-title">Our Gallery</h2>
      <div className="ocean-gallery">{GALLERY_ITEMS.map((item, i) => <div key={item.id} className="ocean-gallery__tile" style={{ animationDelay: `${i * 0.06}s` }}><img src={item.url} alt="" /></div>)}</div>
    </div>
  );
};

const BlossomGallery: React.FC = () => {
  const GALLERY_ITEMS = useContext(GalleryCtx);
  return (
    <div className="section" style={{ paddingBottom: 16 }}><h2 className="section-title">Our Gallery 🌸</h2>
      <div className="blossom-gallery">{GALLERY_ITEMS.map((item, i) => <div key={item.id} className="blossom-gallery__tile" style={{ animationDelay: `${i * 0.07}s` }}><img src={item.url} alt="" /></div>)}</div>
    </div>
  );
};

const EmberGallery: React.FC = () => {
  const GALLERY_ITEMS = useContext(GalleryCtx);
  return (
    <div className="section" style={{ paddingBottom: 24 }}><h2 className="section-title">GALLERY</h2>
      <div className="ember-gallery">{GALLERY_ITEMS.map((item, i) => <div key={item.id} className="ember-gallery__tile" style={{ animationDelay: `${i * 0.07}s` }}><img src={item.url} alt="" /></div>)}</div>
    </div>
  );
};

const CosmicGallery: React.FC = () => {
  const GALLERY_ITEMS = useContext(GalleryCtx);
  return (
    <div className="section" style={{ paddingBottom: 16 }}><h2 className="section-title">GALLERY.SYS</h2>
      <div className="cosmic-gallery">{GALLERY_ITEMS.map((item, i) => <div key={item.id} className="cosmic-gallery__tile" style={{ animationDelay: `${i * 0.07}s` }}><img src={item.url} alt="" /></div>)}</div>
    </div>
  );
};

const RetroGallery: React.FC = () => {
  const GALLERY_ITEMS = useContext(GalleryCtx);
  return (
    <div className="section" style={{ paddingBottom: 16 }}><h2 className="section-title">Photo Wall</h2>
      <div className="retro-gallery">{GALLERY_ITEMS.map((item, i) => <div key={item.id} className="retro-gallery__tile" style={{ animationDelay: `${i * 0.06}s` }}><img src={item.url} alt="" /><div className="retro-gallery__label">ZING DINER</div></div>)}</div>
    </div>
  );
};

export default GallerySection;
