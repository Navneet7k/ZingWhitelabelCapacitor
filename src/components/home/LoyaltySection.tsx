import React, { useEffect, useRef } from 'react';
import { LOYALTY } from '../../config/mockData';
import { useTemplate } from '../../context/TemplateContext';
import { useHomeData } from '../../context/HomeDataContext';
import { openWebView } from '../../services/webviewService';
import { getRestaurantId } from '../../services/restaurantConfig';
import { getToken } from '../../services/authApi';
import './LoyaltySection.css';

const LoyaltySection: React.FC = () => {
  const { template } = useTemplate();
  switch (template.id) {
    case 'luxe':    return <LuxeLoyalty />;
    case 'fresh':   return <FreshLoyalty />;
    case 'zen':     return <ZenLoyalty />;
    case 'fiesta':  return <FiestaLoyalty />;
    case 'neon':    return <NeonLoyalty />;
    case 'rustic':  return <RusticLoyalty />;
    case 'ocean':   return <OceanLoyalty />;
    case 'blossom': return <BlossomLoyalty />;
    case 'tropical': return <TropicalLoyalty />;
    case 'royal':    return <RoyalLoyalty />;
    case 'retro':    return <RetroLoyalty />;
    default:         return <FreshLoyalty />;
  }
};

const pct = Math.round((LOYALTY.points / LOYALTY.nextTierPoints) * 100);

/* ── LUXE: Slim gold-bordered card ── */
const LuxeLoyalty: React.FC = () => {
  const { data } = useHomeData();
  const pts = data?.points ?? 0;
  function openPoints() {
    const rid = getRestaurantId() ?? ''; const token = getToken() ?? '';
    openWebView(`https://app.zingmyorder.com/client/app/points/${rid}?token=${encodeURIComponent(token)}`, 'Points', '#C9A84C');
  }
  return (
    <div className="section" style={{ paddingTop: 28 }}>
      <div className="luxe-loyalty">
        <div className="luxe-loyalty__left">
          <span className="luxe-loyalty__label">LOYALTY POINTS</span>
          <span className="luxe-loyalty__points">{pts.toLocaleString()}</span>
          <p className="luxe-loyalty__earn">Earn points for each order</p>
        </div>
        <div className="luxe-loyalty__divider" />
        <div className="luxe-loyalty__right">
          <button className="luxe-loyalty__learn-btn" onClick={openPoints}>Learn More →</button>
        </div>
      </div>
    </div>
  );
};

/* ── FRESH: SVG circular progress ring ── */
const FreshLoyalty: React.FC = () => {
  const { data } = useHomeData();
  const pts = data?.points ?? 0;
  function openPoints() {
    const rid = getRestaurantId() ?? ''; const token = getToken() ?? '';
    openWebView(`https://app.zingmyorder.com/client/app/points/${rid}?token=${encodeURIComponent(token)}`, 'Points', '#00B87C');
  }
  const r = 36; const circ = 2 * Math.PI * r;
  return (
    <div className="section">
      <h2 className="section-title">Your Rewards</h2>
      <div className="fresh-loyalty">
        <div className="fresh-loyalty__ring-wrap">
          <svg width="88" height="88" viewBox="0 0 88 88">
            <circle cx="44" cy="44" r={r} fill="none" stroke="#E8FFF5" strokeWidth="7" />
            <circle cx="44" cy="44" r={r} fill="none" stroke="#00B87C" strokeWidth="7"
              strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={0} transform="rotate(-90 44 44)" />
          </svg>
          <div className="fresh-loyalty__ring-text">
            <span className="fresh-loyalty__pct">✦</span>
          </div>
        </div>
        <div className="fresh-loyalty__info">
          <span className="fresh-loyalty__pts">{pts.toLocaleString()} pts</span>
          <p className="fresh-loyalty__desc">Earn points for each order you place</p>
          <button className="fresh-loyalty__btn" onClick={openPoints}>Learn More →</button>
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
const ZenLoyalty: React.FC = () => {
  const { data } = useHomeData();
  const pts = data?.points ?? 0;
  function openPoints() {
    const rid = getRestaurantId() ?? ''; const token = getToken() ?? '';
    openWebView(`https://app.zingmyorder.com/client/app/points/${rid}?token=${encodeURIComponent(token)}`, 'Points', '#5C3D2E');
  }
  return (
    <div className="section" style={{ paddingTop: 32 }}>
      <div className="zen-loyalty">
        <div className="zen-loyalty__top">
          <span className="zen-loyalty__points">{pts.toLocaleString()}</span>
          <span className="zen-loyalty__unit">points</span>
        </div>
        <p className="zen-loyalty__earn">Earn points for each order you place</p>
        <button className="zen-loyalty__learn-btn" onClick={openPoints}>Learn More →</button>
      </div>
    </div>
  );
};

/* ── FIESTA: Colorful stars card ── */
const FiestaLoyalty: React.FC = () => {
  const { data } = useHomeData();
  const pts = data?.points ?? 0;

  function openPoints() {
    const rid = getRestaurantId() ?? '';
    const token = getToken() ?? '';
    openWebView(`https://app.zingmyorder.com/client/app/points/${rid}?token=${encodeURIComponent(token)}`, 'Points', '#FF6B6B');
  }

  return (
    <div className="section">
      <h2 className="section-title">Your Rewards 🎁</h2>
      <div className="fiesta-loyalty">
        <div className="fiesta-loyalty__top">
          <div>
            <span className="fiesta-loyalty__pts">{pts.toLocaleString()}</span>
            <span className="fiesta-loyalty__label"> points</span>
          </div>
        </div>
        <p className="fiesta-loyalty__earn">Earn points for each order you place</p>
        <button className="fiesta-loyalty__btn" onClick={openPoints}>Learn More →</button>
      </div>
    </div>
  );
};

/* ── NEON: Terminal-style glitch card ── */
const NeonLoyalty: React.FC = () => (
  <div className="section">
    <h2 className="section-title">REWARDS.SYS</h2>
    <div className="neon-loyalty">
      <div className="neon-loyalty__screen">
        <div className="neon-loyalty__line cyan">&gt; USER: GOLD_MEMBER</div>
        <div className="neon-loyalty__line pink">&gt; POINTS: <span className="neon-loyalty__pts">{LOYALTY.points.toLocaleString()}</span></div>
        <div className="neon-loyalty__line cyan">&gt; NEXT_TIER: {LOYALTY.nextTier}</div>
        <div className="neon-loyalty__line muted">&gt; PROGRESS:</div>
        <div className="neon-loyalty__bar-wrap">
          <div className="neon-loyalty__bar">
            <div className="neon-loyalty__fill" style={{ '--progress-width': `${pct}%` } as React.CSSProperties} />
          </div>
          <span className="neon-loyalty__pct">{pct}%</span>
        </div>
        <div className="neon-loyalty__cursor">█</div>
      </div>
    </div>
  </div>
);

/* ── RUSTIC: Wooden badge board ── */
const RusticLoyalty: React.FC = () => {
  const { data } = useHomeData();
  const pts = data?.points ?? 0;

  function openPoints() {
    const rid = getRestaurantId() ?? '';
    const token = getToken() ?? '';
    openWebView(
      `https://app.zingmyorder.com/client/app/points/${rid}?token=${encodeURIComponent(token)}`,
      'Points',
      '#C1440E'
    );
  }

  return (
    <div className="section">
      <h2 className="section-title">Your Rewards</h2>
      <div className="rustic-loyalty">
        <div className="rustic-loyalty__pts-wrap" style={{ textAlign: 'center' }}>
          <span className="rustic-loyalty__pts">{pts.toLocaleString()}</span>
          <span className="rustic-loyalty__pts-label">points earned</span>
        </div>
        <div className="rustic-loyalty__divider">✦ ✦ ✦</div>
        <p className="rustic-loyalty__earn-text">Earn points for each order you place</p>
        <button className="rustic-loyalty__learn-btn" onClick={openPoints}>Learn More →</button>
      </div>
    </div>
  );
};

/* ── OCEAN: Wave progress card ── */
const OceanLoyalty: React.FC = () => {
  const { data } = useHomeData();
  const pts = data?.points ?? 0;
  function openPoints() {
    const rid = getRestaurantId() ?? ''; const token = getToken() ?? '';
    openWebView(`https://app.zingmyorder.com/client/app/points/${rid}?token=${encodeURIComponent(token)}`, 'Points', '#1B4F72');
  }
  return (
    <div className="section">
      <h2 className="section-title">Rewards</h2>
      <div className="ocean-loyalty">
        <div className="ocean-loyalty__left">
          <span className="ocean-loyalty__pts">{pts.toLocaleString()}</span>
          <span className="ocean-loyalty__label">points</span>
        </div>
        <div className="ocean-loyalty__right">
          <p className="ocean-loyalty__earn">Earn points for each order you place</p>
          <button className="ocean-loyalty__btn" onClick={openPoints}>Learn More →</button>
        </div>
      </div>
    </div>
  );
};

/* ── BLOSSOM: Heart-shaped progress ── */
const BlossomLoyalty: React.FC = () => {
  const { data } = useHomeData();
  const pts = data?.points ?? 0;
  function openPoints() {
    const rid = getRestaurantId() ?? ''; const token = getToken() ?? '';
    openWebView(`https://app.zingmyorder.com/client/app/points/${rid}?token=${encodeURIComponent(token)}`, 'Points', '#FF6B95');
  }
  return (
    <div className="section">
      <h2 className="section-title">Your Rewards</h2>
      <div className="blossom-loyalty">
        <div className="blossom-loyalty__header">
          <span className="blossom-loyalty__pts">{pts.toLocaleString()}</span>
          <span className="blossom-loyalty__unit"> pts</span>
        </div>
        <p className="blossom-loyalty__earn">Earn points for each order you place 🌸</p>
        <button className="blossom-loyalty__learn-btn" onClick={openPoints}>Learn More →</button>
      </div>
    </div>
  );
};

/* ── EMBER: Fire-glow progress ── */
const EmberLoyalty: React.FC = () => (
  <div className="section">
    <h2 className="section-title">REWARDS</h2>
    <div className="ember-loyalty">
      <div className="ember-loyalty__top">
        <div>
          <span className="ember-loyalty__pts">{LOYALTY.points.toLocaleString()}</span>
          <span className="ember-loyalty__unit"> PTS</span>
        </div>
        <span className="ember-loyalty__tier">{LOYALTY.tier} 🔥</span>
      </div>
      <div className="ember-loyalty__flames">
        {[...Array(5)].map((_, i) => (
          <span key={i} className={`ember-flame ${i < Math.round(pct/20) ? 'lit' : ''}`}
            style={{ animationDelay: `${i * 0.2}s` }}>🔥</span>
        ))}
      </div>
      <div className="ember-loyalty__track">
        <div className="ember-loyalty__fill" style={{ '--progress-width': `${pct}%` } as React.CSSProperties} />
      </div>
      <p className="ember-loyalty__note">{LOYALTY.nextTierPoints - LOYALTY.points} pts until {LOYALTY.nextTier}</p>
    </div>
  </div>
);

/* ── ROYAL: Heraldic honours card ── */
const RoyalLoyalty: React.FC = () => {
  const { data } = useHomeData();
  const pts = data?.points ?? 0;
  function openPoints() {
    const rid = getRestaurantId() ?? ''; const token = getToken() ?? '';
    openWebView(`https://app.zingmyorder.com/client/app/points/${rid}?token=${encodeURIComponent(token)}`, 'Points', '#C9923A');
  }
  return (
    <div className="section" style={{ paddingTop: 28 }}>
      <div className="royal-loyalty">
        <div className="royal-loyalty__header">
          <span className="royal-loyalty__crown">👑</span>
          <div><span className="royal-loyalty__label">ROYAL HONOURS</span></div>
          <span className="royal-loyalty__pts">{pts.toLocaleString()}</span>
        </div>
        <div className="royal-loyalty__rule">✦ ✦ ✦</div>
        <p className="royal-loyalty__earn">Earn points for each order you place</p>
        <button className="royal-loyalty__learn-btn" onClick={openPoints}>Learn More →</button>
      </div>
    </div>
  );
};

/* ── TROPICAL: Pineapple stamp card ── */
const TropicalLoyalty: React.FC = () => {
  const { data } = useHomeData();
  const pts = data?.points ?? 0;
  function openPoints() {
    const rid = getRestaurantId() ?? ''; const token = getToken() ?? '';
    openWebView(`https://app.zingmyorder.com/client/app/points/${rid}?token=${encodeURIComponent(token)}`, 'Points', '#FF7043');
  }
  return (
    <div className="section">
      <h2 className="section-title">Your Rewards 🌴</h2>
      <div className="tropical-loyalty">
        <div className="tropical-loyalty__top">
          <div>
            <span className="tropical-loyalty__pts">{pts.toLocaleString()}</span>
            <span className="tropical-loyalty__unit"> points</span>
          </div>
        </div>
        <p className="tropical-loyalty__earn">Earn points for each order you place</p>
        <button className="tropical-loyalty__btn" onClick={openPoints}>Learn More 🥥</button>
      </div>
    </div>
  );
};

/* ── RETRO: Diner-check rewards card ── */
const RetroLoyalty: React.FC = () => {
  const { data } = useHomeData();
  const pts = data?.points ?? 0;
  function openPoints() {
    const rid = getRestaurantId() ?? ''; const token = getToken() ?? '';
    openWebView(`https://app.zingmyorder.com/client/app/points/${rid}?token=${encodeURIComponent(token)}`, 'Points', '#D62828');
  }
  return (
    <div className="section">
      <h2 className="section-title">Your Rewards</h2>
      <div className="retro-loyalty">
        <div className="retro-loyalty__top">
          <span className="retro-loyalty__label">LOYALTY POINTS</span>
          <span className="retro-loyalty__pts">{pts.toLocaleString()}</span>
        </div>
        <div className="retro-loyalty__divider" />
        <p className="retro-loyalty__earn">Earn points for each order you place</p>
        <button className="retro-loyalty__learn-btn" onClick={openPoints}>Learn More →</button>
      </div>
    </div>
  );
};

export default LoyaltySection;
