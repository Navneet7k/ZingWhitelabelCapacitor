import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { InAppBrowser } from '@capgo/inappbrowser';
import { BANNER_SLIDES as MOCK_SLIDES } from '../../config/mockData';
import { useTemplate } from '../../context/TemplateContext';
import { useHomeData } from '../../context/HomeDataContext';
import type { BannerSlide } from '../../services/homeApi';
import { getOrderUrl } from '../../services/configApi';
import { getRestaurantName } from '../../services/restaurantConfig';
import './BannerSection.css';

const openOrder = () => {
  const url = getOrderUrl();
  if (url) InAppBrowser.openWebView({
    url,
    title: 'Place Order',
    visibleTitle: false,
    showArrow: true,
    toolbarColor: '#1A1A1A',
    toolbarTextColor: '#ffffff',
  });
};

const BannerCtx = createContext<BannerSlide[]>(MOCK_SLIDES);

const BannerSection: React.FC = () => {
  const { template } = useTemplate();
  const { data }     = useHomeData();
  const slides = (data?.banners && data.banners.length > 0) ? data.banners : MOCK_SLIDES;

  return (
    <BannerCtx.Provider value={slides}>
      {(() => { switch (template.id) {
        case 'luxe':    return <LuxeBanner />;
        case 'fresh':   return <FreshBanner />;
        case 'street':  return <StreetBanner />;
        case 'zen':     return <ZenBanner />;
        case 'fiesta':  return <FiestaBanner />;
        case 'neon':    return <NeonBanner />;
        case 'rustic':  return <RusticBanner />;
        case 'ocean':   return <OceanBanner />;
        case 'blossom': return <BlossomBanner />;
        case 'ember':   return <EmberBanner />;
        case 'cosmic':  return <CosmicBanner />;
        case 'retro':    return <RetroBanner />;
        case 'tropical': return <TropicalBanner />;
        case 'royal':    return <RoyalBanner />;
        default:         return <FreshBanner />;
      }})()}
    </BannerCtx.Provider>
  );
};

/* ── LUXE ── */
const LuxeBanner: React.FC = () => {
  const BANNER_SLIDES = useContext(BannerCtx);
  const [active, setActive] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  useEffect(() => {
    const t = setInterval(() => {
      setActive(i => (i + 1) % BANNER_SLIDES.length);
      setAnimKey(k => k + 1);
    }, 4500);
    return () => clearInterval(t);
  }, [BANNER_SLIDES.length]);
  const slide = BANNER_SLIDES[active] ?? BANNER_SLIDES[0];
  return (
    <div className="luxe-banner">
      <div key={active} className="luxe-banner__img" style={{ backgroundImage: `url(${slide.image})` }} />
      <div className="luxe-banner__overlay" />
      <div key={animKey} className="luxe-banner__content">
        <span className="luxe-banner__eyebrow">WELCOME TO {(getRestaurantName() ?? 'Zing').toUpperCase()}</span>
        <h1 className="luxe-banner__title">{slide.title}</h1>
        <p className="luxe-banner__subtitle">{slide.subtitle}</p>
        <button className="luxe-banner__cta" onClick={openOrder}>{slide.cta}</button>
      </div>
      <div className="luxe-banner__dots">
        {BANNER_SLIDES.map((_, i) => <span key={i} className={`luxe-dot ${i === active ? 'active' : ''}`} onClick={() => setActive(i)} />)}
      </div>
    </div>
  );
};

/* ── FRESH ── */
const FreshBanner: React.FC = () => {
  const BANNER_SLIDES = useContext(BannerCtx);
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const handleScroll = () => {
    if (!ref.current) return;
    setActive(Math.round(ref.current.scrollLeft / ref.current.clientWidth));
  };
  return (
    <div className="fresh-banner">
      <div className="fresh-banner__track" ref={ref} onScroll={handleScroll}>
        {BANNER_SLIDES.map((slide, i) => (
          <div key={slide.id} className="fresh-banner__card">
            <img src={slide.image} alt={slide.title} className="fresh-banner__img" />
            <div className="fresh-banner__body">
              <span className="fresh-banner__tag">Welcome to {getRestaurantName() ?? 'Zing'}</span>
              <h2 className="fresh-banner__title">{slide.title}</h2>
              <p className="fresh-banner__sub">{slide.subtitle}</p>
              <button className="fresh-banner__cta" onClick={openOrder}>{slide.cta} →</button>
            </div>
          </div>
        ))}
      </div>
      <div className="fresh-banner__dots">
        {BANNER_SLIDES.map((_, i) => <span key={i} className={`fresh-dot ${i === active ? 'active' : ''}`} />)}
      </div>
    </div>
  );
};

/* ── STREET ── */
const StreetBanner: React.FC = () => {
  const BANNER_SLIDES = useContext(BannerCtx);
  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActive(i => (i + 1) % BANNER_SLIDES.length), 3500);
    return () => clearInterval(t);
  }, [BANNER_SLIDES.length]);
  const slide = BANNER_SLIDES[active] ?? BANNER_SLIDES[0];
  return (
    <div className="street-banner">
      <div key={active} className="street-banner__img" style={{ backgroundImage: `url(${slide.image})` }} />
      <div className="street-banner__overlay" />
      <div key={`t-${active}`} className="street-banner__content">
        <div className="street-banner__badge">⚡ WELCOME TO {(getRestaurantName() ?? 'Zing').toUpperCase()}</div>
        <h1 className="street-banner__title">{slide.title.toUpperCase()}</h1>
        <p className="street-banner__sub">{slide.subtitle}</p>
        <button className="street-banner__cta" onClick={openOrder}>{slide.cta.toUpperCase()} →</button>
      </div>
      <div className="street-banner__counter">{String(active + 1).padStart(2, '0')} / {String(BANNER_SLIDES.length).padStart(2, '0')}</div>
    </div>
  );
};

/* ── ZEN ── */
const ZenBanner: React.FC = () => {
  const BANNER_SLIDES = useContext(BannerCtx);
  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActive(i => (i + 1) % BANNER_SLIDES.length), 5000);
    return () => clearInterval(t);
  }, [BANNER_SLIDES.length]);
  const slide = BANNER_SLIDES[active] ?? BANNER_SLIDES[0];
  return (
    <div className="zen-banner">
      <div key={active} className="zen-banner__img" style={{ backgroundImage: `url(${slide.image})` }} />
      <div key={`c-${active}`} className="zen-banner__content">
        <div className="zen-banner__rule" />
        <h1 className="zen-banner__title">{slide.title}</h1>
        <p className="zen-banner__sub">{slide.subtitle}</p>
        <button className="zen-banner__cta" onClick={openOrder}>{slide.cta}</button>
        <div className="zen-banner__dots">
          {BANNER_SLIDES.map((_, i) => <span key={i} className={`zen-dot ${i === active ? 'active' : ''}`} onClick={() => setActive(i)} />)}
        </div>
      </div>
    </div>
  );
};

/* ── FIESTA ── */
const FiestaBanner: React.FC = () => {
  const BANNER_SLIDES = useContext(BannerCtx);
  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActive(i => (i + 1) % BANNER_SLIDES.length), 3800);
    return () => clearInterval(t);
  }, [BANNER_SLIDES.length]);
  const slide = BANNER_SLIDES[active] ?? BANNER_SLIDES[0];
  return (
    <div className="fiesta-banner">
      <div key={active} className="fiesta-banner__img" style={{ backgroundImage: `url(${slide.image})` }} />
      <div className="fiesta-banner__gradient" style={{ background: slide.gradient }} />
      <div key={`c-${active}`} className="fiesta-banner__content">
        <h1 className="fiesta-banner__title">{slide.title}</h1>
        <p className="fiesta-banner__sub">{slide.subtitle}</p>
        <button className="fiesta-banner__cta" onClick={openOrder}>{slide.cta} 🎉</button>
      </div>
      <div className="fiesta-banner__dots">
        {BANNER_SLIDES.map((_, i) => (
          <span key={i} className={`fiesta-dot ${i === active ? 'active' : ''}`} onClick={() => setActive(i)}
            style={{ background: i === active ? '#FFE66D' : 'rgba(255,255,255,0.5)' }} />
        ))}
      </div>
    </div>
  );
};

/* ── NEON ── */
const NeonBanner: React.FC = () => {
  const BANNER_SLIDES = useContext(BannerCtx);
  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActive(i => (i + 1) % BANNER_SLIDES.length), 4000);
    return () => clearInterval(t);
  }, [BANNER_SLIDES.length]);
  const slide = BANNER_SLIDES[active] ?? BANNER_SLIDES[0];
  return (
    <div className="neon-banner">
      <div key={active} className="neon-banner__img" style={{ backgroundImage: `url(${slide.image})` }} />
      <div className="neon-banner__scanlines" />
      <div className="neon-banner__overlay" />
      <div key={`c-${active}`} className="neon-banner__content">
        <div className="neon-banner__chip">WELCOME TO {(getRestaurantName() ?? 'Zing').toUpperCase()}</div>
        <h1 className="neon-banner__title">{slide.title}</h1>
        <p className="neon-banner__sub">{slide.subtitle}</p>
        <button className="neon-banner__cta" onClick={openOrder}>{slide.cta} ›</button>
      </div>
      <div className="neon-banner__dots">
        {BANNER_SLIDES.map((_, i) => <span key={i} className={`neon-dot ${i === active ? 'active' : ''}`} onClick={() => setActive(i)} />)}
      </div>
    </div>
  );
};

/* ── RUSTIC ── */
const RusticBanner: React.FC = () => {
  const BANNER_SLIDES = useContext(BannerCtx);
  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActive(i => (i + 1) % BANNER_SLIDES.length), 5000);
    return () => clearInterval(t);
  }, [BANNER_SLIDES.length]);
  const slide = BANNER_SLIDES[active] ?? BANNER_SLIDES[0];
  return (
    <div className="rustic-banner">
      <div key={active} className="rustic-banner__img" style={{ backgroundImage: `url(${slide.image})` }} />
      <div className="rustic-banner__overlay" />
      <div key={`c-${active}`} className="rustic-banner__content">
        <div className="rustic-banner__rule"><span>✦ Welcome to {getRestaurantName() ?? 'Zing'} ✦</span></div>
        <h1 className="rustic-banner__title">{slide.title}</h1>
        <p className="rustic-banner__sub">{slide.subtitle}</p>
        <button className="rustic-banner__cta" onClick={openOrder}>{slide.cta}</button>
      </div>
      <div className="rustic-banner__dots">
        {BANNER_SLIDES.map((_, i) => <span key={i} className={`rustic-dot ${i === active ? 'active' : ''}`} onClick={() => setActive(i)} />)}
      </div>
    </div>
  );
};

/* ── OCEAN ── */
const OceanBanner: React.FC = () => {
  const BANNER_SLIDES = useContext(BannerCtx);
  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActive(i => (i + 1) % BANNER_SLIDES.length), 4200);
    return () => clearInterval(t);
  }, [BANNER_SLIDES.length]);
  const slide = BANNER_SLIDES[active] ?? BANNER_SLIDES[0];
  return (
    <div className="ocean-banner">
      <div key={active} className="ocean-banner__img" style={{ backgroundImage: `url(${slide.image})` }} />
      <div className="ocean-banner__overlay" />
      <div key={`c-${active}`} className="ocean-banner__content">
        <span className="ocean-banner__tag">🌊 WELCOME TO {(getRestaurantName() ?? 'Zing').toUpperCase()}</span>
        <h1 className="ocean-banner__title">{slide.title}</h1>
        <p className="ocean-banner__sub">{slide.subtitle}</p>
        <button className="ocean-banner__cta" onClick={openOrder}>{slide.cta}</button>
      </div>
      <div className="ocean-banner__wave-wrap"><div className="ocean-banner__wave" /></div>
      <div className="ocean-banner__dots">
        {BANNER_SLIDES.map((_, i) => <span key={i} className={`ocean-dot ${i === active ? 'active' : ''}`} onClick={() => setActive(i)} />)}
      </div>
    </div>
  );
};

/* ── BLOSSOM ── */
const BlossomBanner: React.FC = () => {
  const BANNER_SLIDES = useContext(BannerCtx);
  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActive(i => (i + 1) % BANNER_SLIDES.length), 4500);
    return () => clearInterval(t);
  }, [BANNER_SLIDES.length]);
  const slide = BANNER_SLIDES[active] ?? BANNER_SLIDES[0];
  return (
    <div className="blossom-banner">
      <div key={active} className="blossom-banner__img" style={{ backgroundImage: `url(${slide.image})` }} />
      <div className="blossom-banner__overlay" />
      {['🌸','🌺','🌸','🌸','🌺'].map((p, i) => (
        <span key={i} className="blossom-petal" style={{ '--delay': `${i * 0.5}s`, '--x': `${10 + i * 20}%` } as React.CSSProperties}>{p}</span>
      ))}
      <div key={`c-${active}`} className="blossom-banner__content">
        <h1 className="blossom-banner__title">{slide.title}</h1>
        <div className="blossom-banner__hearts">Welcome to {getRestaurantName() ?? 'Zing'}</div>
        <p className="blossom-banner__sub">{slide.subtitle}</p>
        <button className="blossom-banner__cta" onClick={openOrder}>{slide.cta} ♡</button>
      </div>
      <div className="blossom-banner__dots">
        {BANNER_SLIDES.map((_, i) => <span key={i} className={`blossom-dot ${i === active ? 'active' : ''}`} onClick={() => setActive(i)} />)}
      </div>
    </div>
  );
};

/* ── EMBER ── */
const EmberBanner: React.FC = () => {
  const BANNER_SLIDES = useContext(BannerCtx);
  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActive(i => (i + 1) % BANNER_SLIDES.length), 4000);
    return () => clearInterval(t);
  }, [BANNER_SLIDES.length]);
  const slide = BANNER_SLIDES[active] ?? BANNER_SLIDES[0];
  return (
    <div className="ember-banner">
      <div key={active} className="ember-banner__img" style={{ backgroundImage: `url(${slide.image})` }} />
      <div className="ember-banner__overlay" />
      {[...Array(8)].map((_, i) => (
        <div key={i} className="ember-particle" style={{ '--delay': `${i * 0.35}s`, '--x': `${8 + i * 11}%` } as React.CSSProperties} />
      ))}
      <div key={`c-${active}`} className="ember-banner__content">
        <div className="ember-banner__chip">🔥 WELCOME TO {(getRestaurantName() ?? 'Zing').toUpperCase()}</div>
        <h1 className="ember-banner__title">{slide.title.toUpperCase()}</h1>
        <p className="ember-banner__sub">{slide.subtitle}</p>
        <button className="ember-banner__cta" onClick={openOrder}>{slide.cta.toUpperCase()}</button>
      </div>
      <div className="ember-banner__dots">
        {BANNER_SLIDES.map((_, i) => <span key={i} className={`ember-dot ${i === active ? 'active' : ''}`} onClick={() => setActive(i)} />)}
      </div>
    </div>
  );
};

/* ── COSMIC ── */
const CosmicBanner: React.FC = () => {
  const BANNER_SLIDES = useContext(BannerCtx);
  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActive(i => (i + 1) % BANNER_SLIDES.length), 4200);
    return () => clearInterval(t);
  }, [BANNER_SLIDES.length]);
  const slide = BANNER_SLIDES[active] ?? BANNER_SLIDES[0];
  return (
    <div className="cosmic-banner">
      <div key={active} className="cosmic-banner__img" style={{ backgroundImage: `url(${slide.image})` }} />
      <div className="cosmic-banner__overlay" />
      {[...Array(18)].map((_, i) => (
        <div key={i} className="cosmic-star" style={{ '--sx': `${(i * 17 + 7) % 100}%`, '--sy': `${(i * 13 + 5) % 100}%`, '--sd': `${i * 0.4}s` } as React.CSSProperties} />
      ))}
      <div key={`c-${active}`} className="cosmic-banner__content">
        <div className="cosmic-banner__chip">🚀 WELCOME TO {(getRestaurantName() ?? 'Zing').toUpperCase()}</div>
        <h1 className="cosmic-banner__title">{slide.title}</h1>
        <p className="cosmic-banner__sub">{slide.subtitle}</p>
        <button className="cosmic-banner__cta" onClick={openOrder}>{slide.cta} ›</button>
      </div>
      <div className="cosmic-banner__dots">
        {BANNER_SLIDES.map((_, i) => <span key={i} className={`cosmic-dot ${i === active ? 'active' : ''}`} onClick={() => setActive(i)} />)}
      </div>
    </div>
  );
};

/* ── RETRO ── */
const RetroBanner: React.FC = () => {
  const BANNER_SLIDES = useContext(BannerCtx);
  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActive(i => (i + 1) % BANNER_SLIDES.length), 4000);
    return () => clearInterval(t);
  }, [BANNER_SLIDES.length]);
  const slide = BANNER_SLIDES[active] ?? BANNER_SLIDES[0];
  return (
    <div className="retro-banner">
      <div className="retro-banner__checker" />
      <div key={active} className="retro-banner__img" style={{ backgroundImage: `url(${slide.image})` }} />
      <div className="retro-banner__overlay" />
      <div key={`c-${active}`} className="retro-banner__content">
        <div className="retro-banner__badge">★ WELCOME TO {(getRestaurantName() ?? 'Zing').toUpperCase()} ★</div>
        <h1 className="retro-banner__title">{slide.title}</h1>
        <p className="retro-banner__sub">{slide.subtitle}</p>
        <button className="retro-banner__cta" onClick={openOrder}>{slide.cta}</button>
      </div>
      <div className="retro-banner__counter">{String(active + 1).padStart(2, '0')}/{BANNER_SLIDES.length}</div>
    </div>
  );
};

/* ── ROYAL ── */
const RoyalBanner: React.FC = () => {
  const BANNER_SLIDES = useContext(BannerCtx);
  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActive(i => (i + 1) % BANNER_SLIDES.length), 5000);
    return () => clearInterval(t);
  }, [BANNER_SLIDES.length]);
  const slide = BANNER_SLIDES[active] ?? BANNER_SLIDES[0];
  return (
    <div className="royal-banner">
      <div key={active} className="royal-banner__img" style={{ backgroundImage: `url(${slide.image})` }} />
      <div className="royal-banner__overlay" />
      <div className="royal-banner__corner tl">✦</div>
      <div className="royal-banner__corner tr">✦</div>
      <div key={`c-${active}`} className="royal-banner__content">
        <div className="royal-banner__crest">👑</div>
        <div className="royal-banner__rule">Welcome to {getRestaurantName() ?? 'Zing'}</div>
        <h1 className="royal-banner__title">{slide.title}</h1>
        <p className="royal-banner__sub">{slide.subtitle}</p>
        <button className="royal-banner__cta" onClick={openOrder}>{slide.cta}</button>
      </div>
      <div className="royal-banner__dots">
        {BANNER_SLIDES.map((_, i) => <span key={i} className={`royal-dot ${i === active ? 'active' : ''}`} onClick={() => setActive(i)} />)}
      </div>
    </div>
  );
};

/* ── TROPICAL ── */
const TropicalBanner: React.FC = () => {
  const BANNER_SLIDES = useContext(BannerCtx);
  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActive(i => (i + 1) % BANNER_SLIDES.length), 4000);
    return () => clearInterval(t);
  }, [BANNER_SLIDES.length]);
  const slide = BANNER_SLIDES[active] ?? BANNER_SLIDES[0];
  return (
    <div className="tropical-banner">
      <div key={active} className="tropical-banner__img" style={{ backgroundImage: `url(${slide.image})` }} />
      <div className="tropical-banner__overlay" />
      {['🌺', '🌴', '🍍', '🌺', '🥭'].map((e, i) => (
        <span key={i} className="tropical-float" style={{ '--delay': `${i * 0.7}s`, '--x': `${8 + i * 20}%` } as React.CSSProperties}>{e}</span>
      ))}
      <div key={`c-${active}`} className="tropical-banner__content">
        <div className="tropical-banner__chip">🌴 WELCOME TO {(getRestaurantName() ?? 'Zing').toUpperCase()}</div>
        <h1 className="tropical-banner__title">{slide.title}</h1>
        <p className="tropical-banner__sub">{slide.subtitle}</p>
        <button className="tropical-banner__cta" onClick={openOrder}>{slide.cta} 🥥</button>
      </div>
      <div className="tropical-banner__dots">
        {BANNER_SLIDES.map((_, i) => <span key={i} className={`tropical-dot ${i === active ? 'active' : ''}`} onClick={() => setActive(i)} />)}
      </div>
    </div>
  );
};

export default BannerSection;
