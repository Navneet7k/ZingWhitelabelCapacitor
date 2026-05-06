import React, { useState, useEffect, useRef } from 'react';
import { BANNER_SLIDES } from '../../config/mockData';
import { useTemplate } from '../../context/TemplateContext';
import './BannerSection.css';

const BannerSection: React.FC = () => {
  const { template } = useTemplate();
  switch (template.id) {
    case 'luxe':   return <LuxeBanner />;
    case 'fresh':  return <FreshBanner />;
    case 'street': return <StreetBanner />;
    case 'zen':    return <ZenBanner />;
    case 'fiesta': return <FiestaBanner />;
    default:       return <FreshBanner />;
  }
};

/* ── LUXE: Full-screen crossfade hero ── */
const LuxeBanner: React.FC = () => {
  const [active, setActive] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  useEffect(() => {
    const t = setInterval(() => {
      setActive(i => (i + 1) % BANNER_SLIDES.length);
      setAnimKey(k => k + 1);
    }, 4500);
    return () => clearInterval(t);
  }, []);
  const slide = BANNER_SLIDES[active];
  return (
    <div className="luxe-banner">
      <div
        key={active}
        className="luxe-banner__img"
        style={{ backgroundImage: `url(${slide.image})` }}
      />
      <div className="luxe-banner__overlay" />
      <div key={animKey} className="luxe-banner__content">
        <span className="luxe-banner__eyebrow">EST. 2020 · ZING</span>
        <h1 className="luxe-banner__title">{slide.title}</h1>
        <p className="luxe-banner__subtitle">{slide.subtitle}</p>
        <button className="luxe-banner__cta">{slide.cta}</button>
      </div>
      <div className="luxe-banner__dots">
        {BANNER_SLIDES.map((_, i) => (
          <span
            key={i}
            className={`luxe-dot ${i === active ? 'active' : ''}`}
            onClick={() => setActive(i)}
          />
        ))}
      </div>
    </div>
  );
};

/* ── FRESH: Swipe scroll-snap cards ── */
const FreshBanner: React.FC = () => {
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const handleScroll = () => {
    if (!ref.current) return;
    const idx = Math.round(ref.current.scrollLeft / ref.current.clientWidth);
    setActive(idx);
  };
  return (
    <div className="fresh-banner">
      <div className="fresh-banner__track" ref={ref} onScroll={handleScroll}>
        {BANNER_SLIDES.map((slide, i) => (
          <div key={slide.id} className="fresh-banner__card">
            <img src={slide.image} alt={slide.title} className="fresh-banner__img" />
            <div className="fresh-banner__body">
              <span className="fresh-banner__tag">{i === 0 ? '🔥 Hot Deal' : i === 1 ? '🚚 Free Delivery' : '🎉 Weekend'}</span>
              <h2 className="fresh-banner__title">{slide.title}</h2>
              <p className="fresh-banner__sub">{slide.subtitle}</p>
              <button className="fresh-banner__cta">{slide.cta} →</button>
            </div>
          </div>
        ))}
      </div>
      <div className="fresh-banner__dots">
        {BANNER_SLIDES.map((_, i) => (
          <span key={i} className={`fresh-dot ${i === active ? 'active' : ''}`} />
        ))}
      </div>
    </div>
  );
};

/* ── STREET: Bold full-bleed with slide-up text ── */
const StreetBanner: React.FC = () => {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActive(i => (i + 1) % BANNER_SLIDES.length), 3500);
    return () => clearInterval(t);
  }, []);
  const slide = BANNER_SLIDES[active];
  return (
    <div className="street-banner">
      <div key={active} className="street-banner__img" style={{ backgroundImage: `url(${slide.image})` }} />
      <div className="street-banner__overlay" />
      <div key={`t-${active}`} className="street-banner__content">
        <div className="street-banner__badge">⚡ ZING EATS</div>
        <h1 className="street-banner__title">{slide.title.toUpperCase()}</h1>
        <p className="street-banner__sub">{slide.subtitle}</p>
        <button className="street-banner__cta">{slide.cta.toUpperCase()} →</button>
      </div>
      <div className="street-banner__counter">{String(active + 1).padStart(2, '0')} / 03</div>
    </div>
  );
};

/* ── ZEN: Split layout — image left, text right ── */
const ZenBanner: React.FC = () => {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActive(i => (i + 1) % BANNER_SLIDES.length), 5000);
    return () => clearInterval(t);
  }, []);
  const slide = BANNER_SLIDES[active];
  return (
    <div className="zen-banner">
      <div key={active} className="zen-banner__img" style={{ backgroundImage: `url(${slide.image})` }} />
      <div key={`c-${active}`} className="zen-banner__content">
        <div className="zen-banner__rule" />
        <h1 className="zen-banner__title">{slide.title}</h1>
        <p className="zen-banner__sub">{slide.subtitle}</p>
        <button className="zen-banner__cta">{slide.cta}</button>
        <div className="zen-banner__dots">
          {BANNER_SLIDES.map((_, i) => (
            <span key={i} className={`zen-dot ${i === active ? 'active' : ''}`} onClick={() => setActive(i)} />
          ))}
        </div>
      </div>
    </div>
  );
};

/* ── FIESTA: Auto-rotate with gradient overlays ── */
const FiestaBanner: React.FC = () => {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActive(i => (i + 1) % BANNER_SLIDES.length), 3800);
    return () => clearInterval(t);
  }, []);
  const slide = BANNER_SLIDES[active];
  return (
    <div className="fiesta-banner">
      <div key={active} className="fiesta-banner__img" style={{ backgroundImage: `url(${slide.image})` }} />
      <div className="fiesta-banner__gradient" style={{ background: slide.gradient }} />
      <div key={`c-${active}`} className="fiesta-banner__content">
        <h1 className="fiesta-banner__title">{slide.title}</h1>
        <p className="fiesta-banner__sub">{slide.subtitle}</p>
        <button className="fiesta-banner__cta">{slide.cta} 🎉</button>
      </div>
      <div className="fiesta-banner__dots">
        {BANNER_SLIDES.map((_, i) => (
          <span
            key={i}
            className={`fiesta-dot ${i === active ? 'active' : ''}`}
            onClick={() => setActive(i)}
            style={{ background: i === active ? '#FFE66D' : 'rgba(255,255,255,0.5)' }}
          />
        ))}
      </div>
    </div>
  );
};

export default BannerSection;
