import React, { useEffect, useRef } from 'react';
import { LOYALTY } from '../../config/mockData';
import { useTemplate } from '../../context/TemplateContext';
import './LoyaltySection.css';

const LoyaltySection: React.FC = () => {
  const { template } = useTemplate();
  switch (template.id) {
    case 'luxe':   return <LuxeLoyalty />;
    case 'fresh':  return <FreshLoyalty />;
    case 'street': return <StreetLoyalty />;
    case 'zen':    return <ZenLoyalty />;
    case 'fiesta': return <FiestaLoyalty />;
    default:       return <FreshLoyalty />;
  }
};

const pct = Math.round((LOYALTY.points / LOYALTY.nextTierPoints) * 100);

/* ── LUXE: Slim gold-bordered card ── */
const LuxeLoyalty: React.FC = () => (
  <div className="section" style={{ paddingTop: 28 }}>
    <div className="luxe-loyalty">
      <div className="luxe-loyalty__left">
        <span className="luxe-loyalty__label">LOYALTY POINTS</span>
        <span className="luxe-loyalty__points">{LOYALTY.points.toLocaleString()}</span>
        <span className="luxe-loyalty__tier">{LOYALTY.tier} Member</span>
      </div>
      <div className="luxe-loyalty__divider" />
      <div className="luxe-loyalty__right">
        <span className="luxe-loyalty__next-label">Next: {LOYALTY.nextTier}</span>
        <span className="luxe-loyalty__next-pts">{LOYALTY.nextTierPoints - LOYALTY.points} pts away</span>
        <div className="luxe-loyalty__bar">
          <div className="luxe-loyalty__fill" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  </div>
);

/* ── FRESH: SVG circular progress ring ── */
const FreshLoyalty: React.FC = () => {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  return (
    <div className="section">
      <h2 className="section-title">Your Rewards</h2>
      <div className="fresh-loyalty">
        <div className="fresh-loyalty__ring-wrap">
          <svg width="88" height="88" viewBox="0 0 88 88">
            <circle cx="44" cy="44" r={radius} fill="none" stroke="#E8FFF5" strokeWidth="7" />
            <circle
              cx="44" cy="44" r={radius}
              fill="none" stroke="#00B87C" strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              transform="rotate(-90 44 44)"
              style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.34,1.56,0.64,1)' }}
            />
          </svg>
          <div className="fresh-loyalty__ring-text">
            <span className="fresh-loyalty__pct">{pct}%</span>
          </div>
        </div>
        <div className="fresh-loyalty__info">
          <span className="fresh-loyalty__pts">{LOYALTY.points.toLocaleString()} pts</span>
          <span className="fresh-loyalty__tier-badge">{LOYALTY.tier}</span>
          <p className="fresh-loyalty__desc">
            Earn {LOYALTY.nextTierPoints - LOYALTY.points} more points to reach <strong>{LOYALTY.nextTier}</strong>
          </p>
          <button className="fresh-loyalty__btn">Redeem Points</button>
        </div>
      </div>
    </div>
  );
};

/* ── STREET: Punch/stamp card ── */
const StreetLoyalty: React.FC = () => {
  const total = 8;
  return (
    <div className="section">
      <h2 className="section-title">Stamp Card</h2>
      <div className="street-loyalty">
        <div className="street-loyalty__header">
          <span className="street-loyalty__name">ZING REWARDS</span>
          <span className="street-loyalty__pts">{LOYALTY.points} PTS</span>
        </div>
        <div className="street-loyalty__stamps">
          {Array.from({ length: total }).map((_, i) => (
            <div
              key={i}
              className={`street-stamp ${i < LOYALTY.stamps ? 'filled' : ''}`}
              style={{ animationDelay: `${i * 0.06}s` }}
            >
              {i < LOYALTY.stamps ? '✕' : ''}
            </div>
          ))}
        </div>
        <p className="street-loyalty__note">
          {total - LOYALTY.stamps} more stamps for a <span>FREE MEAL</span>
        </p>
      </div>
    </div>
  );
};

/* ── ZEN: Minimal text + thin progress bar ── */
const ZenLoyalty: React.FC = () => (
  <div className="section" style={{ paddingTop: 32 }}>
    <div className="zen-loyalty">
      <div className="zen-loyalty__top">
        <span className="zen-loyalty__points">{LOYALTY.points.toLocaleString()}</span>
        <span className="zen-loyalty__unit">points</span>
      </div>
      <div className="zen-loyalty__tier">{LOYALTY.tier} · {LOYALTY.nextTier} in {LOYALTY.nextTierPoints - LOYALTY.points} pts</div>
      <div className="zen-loyalty__track">
        <div className="zen-loyalty__fill" style={{ '--progress-width': `${pct}%` } as React.CSSProperties} />
      </div>
      <div className="zen-loyalty__labels">
        <span>0</span>
        <span>{LOYALTY.nextTier} at {LOYALTY.nextTierPoints.toLocaleString()} pts</span>
      </div>
    </div>
  </div>
);

/* ── FIESTA: Colorful stars card ── */
const FiestaLoyalty: React.FC = () => {
  const stars = Math.round((pct / 100) * 5);
  return (
    <div className="section">
      <h2 className="section-title">Your Rewards 🎁</h2>
      <div className="fiesta-loyalty">
        <div className="fiesta-loyalty__top">
          <div>
            <span className="fiesta-loyalty__pts">{LOYALTY.points.toLocaleString()}</span>
            <span className="fiesta-loyalty__label"> points</span>
          </div>
          <span className="fiesta-loyalty__tier">{LOYALTY.tier} ✦</span>
        </div>
        <div className="fiesta-loyalty__stars">
          {[1,2,3,4,5].map(s => (
            <span
              key={s}
              className={`fiesta-star ${s <= stars ? 'filled' : ''}`}
              style={{ animationDelay: `${s * 0.1}s` }}
            >★</span>
          ))}
        </div>
        <div className="fiesta-loyalty__bar-wrap">
          <div className="fiesta-loyalty__bar">
            <div className="fiesta-loyalty__fill" style={{ '--progress-width': `${pct}%` } as React.CSSProperties} />
          </div>
          <span className="fiesta-loyalty__next">{LOYALTY.nextTierPoints - LOYALTY.points} pts to {LOYALTY.nextTier} 🚀</span>
        </div>
      </div>
    </div>
  );
};

export default LoyaltySection;
