import React, { useState, useEffect, useRef } from 'react';
import { useTemplate, TEMPLATES } from '../context/TemplateContext';
import { useHomeData } from '../context/HomeDataContext';
import { useMenuData } from '../context/MenuDataContext';
import { getSavedUser, isLoggedIn, login, register, saveAuth, clearAuth, getToken } from '../services/authApi';
import type { AuthUser } from '../services/authApi';
import { getOrderUrl, getRestaurantLogo } from '../services/configApi';
import { getRestaurantId, getRestaurantName } from '../services/restaurantConfig';
import { openWebView } from '../services/webviewService';
import { checkConfigColorsOnTabSwitch } from '../services/configColorsService';
import CustomizePage from './CustomizePage';
import './SpiceApp.css';

function safe(v: unknown, fallback = ''): string {
  try { return (v != null && v !== '') ? String(v) : fallback; } catch { return fallback; }
}

type SpiceView = 'home' | 'menu' | 'orders' | 'account' | 'location';
type AuthMode = 'login' | 'register';

const NAV: { id: SpiceView; icon: string; label: string }[] = [
  { id: 'home',     icon: '🏠', label: 'Home'     },
  { id: 'menu',     icon: '🍽️', label: 'Menu'     },
  { id: 'orders',   icon: '🛒', label: 'Order'    },
  { id: 'account',  icon: '👤', label: 'Account'  },
  { id: 'location', icon: '📍', label: 'Location' },
];

const EMAIL_RE  = /^[\w.-]+@([\w-]+\.)+[\w-]{2,4}$/;
const MOBILE_RE = /^\+?\d{7,15}$/;

function getInitialUser(): AuthUser | null {
  try { return isLoggedIn() ? getSavedUser() : null; } catch { return null; }
}

const SpiceApp: React.FC = () => {
  const { template, setTemplateId } = useTemplate();
  const { data: homeData } = useHomeData();
  const { data: menuData } = useMenuData();

  const [view, setView]                   = useState<SpiceView>('home');
  const [activeCategory, setCategory]     = useState<number | null>(null);
  const [authUser, setAuthUser]           = useState<AuthUser | null>(getInitialUser);
  const [authMode, setAuthMode]           = useState<AuthMode>('login');
  const [showCustomize, setShowCustomize] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [loginEmail,    setLoginEmail]    = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError,    setLoginError]    = useState('');
  const [loginLoading,  setLoginLoading]  = useState(false);
  const [showLoginPass, setShowLoginPass] = useState(false);

  const [regName,     setRegName]     = useState('');
  const [regEmail,    setRegEmail]    = useState('');
  const [regMobile,   setRegMobile]   = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm,  setRegConfirm]  = useState('');
  const [regError,    setRegError]    = useState('');
  const [regLoading,  setRegLoading]  = useState(false);
  const [regSuccess,  setRegSuccess]  = useState(false);
  const [showRegPass, setShowRegPass] = useState(false);
  const [showRegConf, setShowRegConf] = useState(false);

  const restaurantId   = getRestaurantId();
  const restaurantName = safe(getRestaurantName(), 'Spice Kitchen');
  const logoUrl        = getRestaurantLogo();
  const allCategories  = menuData?.categories ?? [];
  const popularDishes  = homeData?.popularDishes ?? [];
  const banners        = homeData?.banners ?? [];
  const recentOrders   = homeData?.recentOrders ?? [];
  const points         = homeData?.points ?? 0;

  const filteredItems = activeCategory
    ? (allCategories.find(c => c.id === activeCategory)?.items ?? [])
    : allCategories.flatMap(c => c.items ?? []);

  const didMountRef = useRef(false);
  useEffect(() => {
    if (!didMountRef.current) { didMountRef.current = true; return; }
    checkConfigColorsOnTabSwitch(restaurantId ?? '');
  }, [view]);

  const handleOrder = async () => {
    try {
      if (!authUser) { setView('account'); return; }
      const url = getOrderUrl();
      if (!url) return;
      await openWebView(url, 'Place Order', template.colors.primary);
    } catch { /* silent */ }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantId) return;
    setLoginLoading(true);
    setLoginError('');
    try {
      const { token, user } = await login(loginEmail, loginPassword, restaurantId);
      saveAuth(token, user);
      setAuthUser(user);
      setLoginEmail('');
      setLoginPassword('');
    } catch (err: any) {
      setLoginError(safe(err?.message, 'Login failed'));
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim())                   { setRegError('Please enter your name'); return; }
    if (!EMAIL_RE.test(regEmail.trim()))   { setRegError('Please enter a valid email'); return; }
    if (!MOBILE_RE.test(regMobile.trim())) { setRegError('Please enter a valid mobile number'); return; }
    if (regPassword.length < 6)            { setRegError('Password must be at least 6 characters'); return; }
    if (regPassword !== regConfirm)        { setRegError('Passwords do not match'); return; }
    if (!restaurantId)                     { setRegError('Restaurant not configured'); return; }
    setRegLoading(true);
    setRegError('');
    try {
      await register({
        name:                 regName.trim(),
        email:                regEmail.trim(),
        mobile:               regMobile.trim(),
        password:             regPassword,
        passwordConfirmation: regConfirm,
        restaurantId,
      });
      setRegSuccess(true);
      setTimeout(() => { setRegSuccess(false); setAuthMode('login'); }, 1500);
    } catch (err: any) {
      setRegError(safe(err?.message, 'Registration failed'));
    } finally {
      setRegLoading(false);
    }
  };

  function clientUrl(path: string) {
    const rid   = getRestaurantId() ?? '';
    const token = getToken() ?? '';
    return `https://app.zingmyorder.com/client/app/${path}/${rid}?token=${token}`;
  }

  function handleDeleteConfirmed() {
    setShowDeleteConfirm(false);
    const rid   = getRestaurantId() ?? '';
    const token = getToken() ?? '';
    openWebView(`https://app.zingmyorder.com/app/delete-user/${rid}?token=${token}`, 'Delete Account', template.colors.primary);
  }

  return (
    <div className="sp">

      <div className="sp__scroll">

        {/* ── HOME ── */}
        {view === 'home' && (
          <>
            <div className="sp__hero" onClick={handleOrder}>
              {popularDishes[0]?.image
                ? <img className="sp__hero-img" src={popularDishes[0].image} alt="" loading="lazy" decoding="async" />
                : <div className="sp__hero-img sp__hero-img--ph" />
              }
              <div className="sp__hero-veil">
                <p className="sp__hero-welcome">Welcome To</p>
                <h1 className="sp__hero-name">{restaurantName}</h1>
                <button className="sp__hero-btn" onClick={e => { e.stopPropagation(); handleOrder(); }}>
                  Order Now
                </button>
              </div>
            </div>

            {popularDishes.length > 0 && (
              <>
                <p className="sp__section-title">Popular Dishes</p>
                <div className="sp__circles">
                  {popularDishes.slice(0, 6).map((dish, i) => (
                    <button key={i} className={`sp__circle${i === 0 ? ' sp__circle--active' : ''}`} onClick={handleOrder}>
                      {dish.image
                        ? <img className="sp__circle-img" src={dish.image} alt="" loading="lazy" decoding="async" />
                        : <div className="sp__circle-img sp__circle-ph">{safe(dish.name?.[0], '🌶')}</div>
                      }
                      <span className="sp__circle-label">{safe(dish.name)}</span>
                    </button>
                  ))}
                </div>
              </>
            )}

            <div className="sp__points-wrap">
              <div className="sp__points-circle">
                <span className="sp__points-num">{points > 0 ? points : '0'}</span>
                <span className="sp__points-lbl">Pts</span>
              </div>
              <div className="sp__points-card">
                <p className="sp__points-text">Each Points For Each Orders</p>
                <button className="sp__points-btn" onClick={() => setView('account')}>
                  Learn More | ▶
                </button>
              </div>
            </div>

            {recentOrders.length > 0 && (
              <div className="sp__section">
                <div className="sp__section-header">
                  <p className="sp__section-title sp__section-title--flush">My Orders</p>
                  <button className="sp__text-link" onClick={() => setView('orders')}>View all</button>
                </div>
                <div className="sp__order-grid">
                  {recentOrders.slice(0, 4).map(o => (
                    <div key={o.id} className="sp__order-card">
                      <div className="sp__order-card-img-ph">🍽️</div>
                      <p className="sp__order-card-date">{safe(o.date)}</p>
                      <p className="sp__order-card-id">{safe(String(o.id))}</p>
                      <p className="sp__order-card-total">${Number(o.total).toFixed(2)}</p>
                      <button className="sp__order-status-btn">
                        {safe(o.statusEmoji, '●')} {safe(o.status)}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {banners.length > 0 && (
              <div className="sp__section">
                <p className="sp__section-title">Gallery</p>
                <div className="sp__gallery">
                  {banners.slice(0, 5).map((b, i) => {
                    const total   = Math.min(banners.length, 5);
                    const midIdx  = Math.floor(total / 2);
                    const isCenter = i === midIdx;
                    return (
                      <div key={b.id} className={`sp__gallery-item${isCenter ? ' sp__gallery-item--center' : ''}`} onClick={handleOrder}>
                        {b.image
                          ? <img className="sp__gallery-img" src={b.image} alt="" loading="lazy" decoding="async" />
                          : <div className="sp__gallery-ph">🌶️</div>
                        }
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="sp__section">
              <p className="sp__section-title">Contact Us</p>
              <div className="sp__contact-card">
                <div className="sp__contact-row">
                  <span className="sp__contact-icon">📞</span>
                  <span className="sp__contact-text">{restaurantName}</span>
                </div>
                <div className="sp__contact-row">
                  <span className="sp__contact-icon">🏠</span>
                  <span className="sp__contact-text">Visit us for the best dining experience</span>
                </div>
                <button className="sp__contact-btn" onClick={handleOrder}>Order Again 🛒</button>
              </div>
            </div>

            <div style={{ height: 20 }} />
          </>
        )}

        {/* ── MENU ── */}
        {view === 'menu' && (
          <>
            <p className="sp__view-title">Menu</p>
            {allCategories.length > 0 && (
              <div className="sp__cats">
                <button
                  className={`sp__cat-pill${activeCategory === null ? ' active' : ''}`}
                  onClick={() => setCategory(null)}
                >All</button>
                {allCategories.map(cat => (
                  <button
                    key={cat.id}
                    className={`sp__cat-pill${activeCategory === cat.id ? ' active' : ''}`}
                    onClick={() => setCategory(cat.id)}
                  >{safe(cat.name)}</button>
                ))}
              </div>
            )}
            {filteredItems.length === 0 ? (
              <p className="sp__empty">{!menuData ? 'Loading…' : 'No items'}</p>
            ) : (
              <div className="sp__menu-grid">
                {filteredItems.map(item => (
                  <div key={item.id} className="sp__menu-card" onClick={handleOrder}>
                    {item.image
                      ? <img className="sp__menu-img" src={item.image} alt="" loading="lazy" decoding="async" />
                      : <div className="sp__menu-img-ph">🌶️</div>
                    }
                    <div className="sp__menu-info">
                      <p className="sp__menu-name">{safe(item.name)}</p>
                      {item.description
                        ? <p className="sp__menu-desc">{item.description}</p>
                        : null
                      }
                      <div className="sp__menu-footer">
                        <span className="sp__menu-price">${safe(String(item.price))}</span>
                        <button className="sp__menu-add" onClick={e => { e.stopPropagation(); handleOrder(); }}>+</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ height: 20 }} />
          </>
        )}

        {/* ── ORDERS ── */}
        {view === 'orders' && (
          <>
            <p className="sp__view-title">My Orders</p>
            {recentOrders.length > 0 ? (
              recentOrders.map(o => (
                <div key={o.id} className="sp__order-row">
                  <span className="sp__order-row-emoji">{safe(o.statusEmoji, '📦')}</span>
                  <div className="sp__order-row-detail">
                    <p className="sp__order-row-id">{safe(String(o.id))}</p>
                    <p className="sp__order-row-date">{safe(o.date)}</p>
                  </div>
                  <div className="sp__order-row-meta">
                    <p className="sp__order-row-total">${Number(o.total).toFixed(2)}</p>
                    <p className="sp__order-row-status" style={{ color: safe(o.color) || undefined }}>
                      {safe(o.status)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="sp__empty">No orders yet 🌶️</p>
            )}
            <div style={{ height: 12 }} />
            <button className="sp__cta" onClick={handleOrder}>Place New Order</button>
            <div style={{ height: 20 }} />
          </>
        )}

        {/* ── ACCOUNT ── */}
        {view === 'account' && (
          <>
            {authUser ? (
              <>
                <div className="sp__profile-hero">
                  <div className="sp__profile-avatar">
                    {safe(authUser.name?.[0], '?').toUpperCase()}
                  </div>
                  <h2 className="sp__profile-name">{safe(authUser.name)}</h2>
                  <p className="sp__profile-email">{safe(authUser.email)}</p>
                  {points > 0 && (
                    <div className="sp__profile-pts">{points} pts</div>
                  )}
                </div>

                <div className="sp__acc-menu">
                  {([
                    { icon: '✏️', label: 'Edit Profile',       action: () => openWebView(clientUrl('edit-profile'), 'Edit Profile', template.colors.primary) },
                    { icon: '🛍️', label: 'My Orders',          action: () => setView('orders') },
                    { icon: '❤️', label: 'Favorites',          action: () => openWebView(clientUrl('favorites'), 'Favorites', template.colors.primary) },
                    { icon: '⭐', label: 'Points',             action: () => openWebView(clientUrl('points'), 'Points', template.colors.primary) },
                    { icon: '🏠', label: 'Saved Addresses',    action: () => openWebView(clientUrl('address'), 'Saved Addresses', template.colors.primary) },
                    { icon: '🎨', label: 'Customize',          action: () => setShowCustomize(true) },
                    { icon: '📋', label: 'Terms & Conditions', action: () => {} },
                    { icon: '🗑️', label: 'Delete Account',     action: () => setShowDeleteConfirm(true) },
                    { icon: '🚪', label: 'Sign Out',           action: () => { clearAuth(); setAuthUser(null); } },
                  ] as { icon: string; label: string; action: () => void }[]).map((item, i) => (
                    <button key={i} className="sp__acc-item" onClick={item.action}>
                      <span className="sp__acc-icon">{item.icon}</span>
                      <span className="sp__acc-label">{item.label}</span>
                      <span className="sp__acc-arrow">›</span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="sp__auth">
                <div className="sp__auth-header">
                  {logoUrl
                    ? <img src={logoUrl} alt={restaurantName} className="sp__auth-logo" />
                    : <div className="sp__auth-brand">{restaurantName}</div>
                  }
                </div>

                <div className="sp__auth-tabs">
                  <button
                    className={`sp__auth-tab${authMode === 'login' ? ' active' : ''}`}
                    onClick={() => setAuthMode('login')}
                  >Sign In</button>
                  <button
                    className={`sp__auth-tab${authMode === 'register' ? ' active' : ''}`}
                    onClick={() => setAuthMode('register')}
                  >Sign Up</button>
                </div>

                {authMode === 'login' ? (
                  <form className="sp__auth-form" onSubmit={handleLogin}>
                    {loginError && <p className="sp__auth-error">{loginError}</p>}
                    <div className="sp__field">
                      <label className="sp__label">Email</label>
                      <input className="sp__input" type="email" placeholder="your@email.com"
                        value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
                        required autoComplete="email" />
                    </div>
                    <div className="sp__field">
                      <label className="sp__label">Password</label>
                      <div className="sp__input-wrap">
                        <input className="sp__input" type={showLoginPass ? 'text' : 'password'} placeholder="••••••••"
                          value={loginPassword} onChange={e => setLoginPassword(e.target.value)}
                          required autoComplete="current-password" />
                        <span className="sp__eye" onClick={() => setShowLoginPass(p => !p)}>
                          {showLoginPass ? '🙈' : '👁️'}
                        </span>
                      </div>
                    </div>
                    <button className="sp__auth-btn" type="submit" disabled={loginLoading}>
                      {loginLoading ? 'Signing in…' : 'Sign In'}
                    </button>
                  </form>
                ) : (
                  <form className="sp__auth-form" onSubmit={handleRegister}>
                    {regError   && <p className="sp__auth-error">{regError}</p>}
                    {regSuccess && <p className="sp__auth-success">Registration successful!</p>}
                    <div className="sp__field">
                      <label className="sp__label">Full Name</label>
                      <input className="sp__input" type="text" placeholder="John Doe"
                        value={regName} onChange={e => setRegName(e.target.value)} />
                    </div>
                    <div className="sp__field">
                      <label className="sp__label">Email</label>
                      <input className="sp__input" type="email" placeholder="your@email.com"
                        value={regEmail} onChange={e => setRegEmail(e.target.value)} />
                    </div>
                    <div className="sp__field">
                      <label className="sp__label">Mobile Number</label>
                      <input className="sp__input" type="tel" placeholder="+1 000 000 0000"
                        value={regMobile} onChange={e => setRegMobile(e.target.value)} />
                    </div>
                    <div className="sp__field">
                      <label className="sp__label">Password</label>
                      <div className="sp__input-wrap">
                        <input className="sp__input" type={showRegPass ? 'text' : 'password'} placeholder="Min. 6 characters"
                          value={regPassword} onChange={e => setRegPassword(e.target.value)} />
                        <span className="sp__eye" onClick={() => setShowRegPass(p => !p)}>
                          {showRegPass ? '🙈' : '👁️'}
                        </span>
                      </div>
                    </div>
                    <div className="sp__field">
                      <label className="sp__label">Confirm Password</label>
                      <div className="sp__input-wrap">
                        <input className="sp__input" type={showRegConf ? 'text' : 'password'} placeholder="Repeat password"
                          value={regConfirm} onChange={e => setRegConfirm(e.target.value)} />
                        <span className="sp__eye" onClick={() => setShowRegConf(p => !p)}>
                          {showRegConf ? '🙈' : '👁️'}
                        </span>
                      </div>
                    </div>
                    <button className="sp__auth-btn" type="submit" disabled={regLoading || regSuccess}>
                      {regLoading ? 'Creating account…' : 'Create Account'}
                    </button>
                  </form>
                )}
              </div>
            )}

            <p className="sp__tmpl-label">Switch Template</p>
            <div className="sp__tmpl-strip">
              {TEMPLATES.map(t => (
                <button
                  key={t.id}
                  className={`sp__tmpl-pill${t.id === template.id ? ' active' : ''}`}
                  style={{ background: t.colors.bg, borderColor: t.id === template.id ? t.colors.primary : 'transparent' }}
                  onClick={() => setTemplateId(t.id)}
                >
                  <span className="sp__tmpl-emoji">{t.emoji}</span>
                  <span className="sp__tmpl-name" style={{ color: t.colors.text }}>{t.name}</span>
                </button>
              ))}
            </div>

            <div style={{ height: 20 }} />
          </>
        )}

        {/* ── LOCATION ── */}
        {view === 'location' && (
          <>
            <p className="sp__view-title">Find Us</p>
            <div className="sp__location-card">
              <div className="sp__location-map-ph">📍</div>
              <h3 className="sp__location-name">{restaurantName}</h3>
              <p className="sp__location-sub">Come visit us for the best dining experience</p>
              <button className="sp__cta sp__cta--flush" onClick={handleOrder}>Order Online 🛒</button>
            </div>
            <div style={{ height: 20 }} />
          </>
        )}

      </div>

      {/* ── Bottom nav ── */}
      <nav className="sp__nav">
        {NAV.map(n => (
          <button
            key={n.id}
            className={`sp__nav-btn${view === n.id ? ' active' : ''}`}
            onClick={() => setView(n.id)}
            aria-label={n.label}
          >
            <span className="sp__nav-icon">{n.icon}</span>
            <span className="sp__nav-label">{n.label}</span>
          </button>
        ))}
      </nav>

      {showCustomize && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'var(--t-bg, #2C5F3E)' }}>
          <CustomizePage onBack={() => setShowCustomize(false)} />
        </div>
      )}

      {showDeleteConfirm && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end' }}
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            style={{ width: '100%', background: '#fff', borderRadius: '16px 16px 0 0', padding: '20px 20px 32px', textAlign: 'center' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ width: 40, height: 4, background: '#ddd', borderRadius: 2, margin: '0 auto 16px' }} />
            <span style={{ fontSize: 32 }}>⚠️</span>
            <h3 style={{ margin: '8px 0 4px', fontSize: 18, fontWeight: 700 }}>Delete Account?</h3>
            <p style={{ margin: '0 0 16px', fontSize: 14, color: '#666' }}>
              This will permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <button
              style={{ display: 'block', width: '100%', padding: '14px', background: '#EF4444', color: '#fff', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 700, marginBottom: 8, cursor: 'pointer' }}
              onClick={handleDeleteConfirmed}
            >
              Yes, Delete My Account
            </button>
            <button
              style={{ display: 'block', width: '100%', padding: '14px', background: '#aaa', color: '#fff', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 700, cursor: 'pointer' }}
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default SpiceApp;
