import React, { useState, useEffect, useRef } from 'react';
import { useTemplate, TEMPLATES } from '../context/TemplateContext';
import { useHomeData } from '../context/HomeDataContext';
import { useMenuData } from '../context/MenuDataContext';
import { getSavedUser, isLoggedIn, login, saveAuth, clearAuth, getToken } from '../services/authApi';
import type { AuthUser } from '../services/authApi';
import { getOrderUrl } from '../services/configApi';
import { getRestaurantId, getRestaurantName } from '../services/restaurantConfig';
import { openWebView } from '../services/webviewService';
import { checkConfigColorsOnTabSwitch } from '../services/configColorsService';
import CustomizePage from './CustomizePage';
import './VapourApp.css';

function safe(v: unknown, fallback = ''): string {
  try { return (v != null && v !== '') ? String(v) : fallback; } catch { return fallback; }
}

function getInitialUser(): AuthUser | null {
  try { return isLoggedIn() ? getSavedUser() : null; } catch { return null; }
}

type VapourView = 'home' | 'menu' | 'orders' | 'account';

const NAV: { id: VapourView; label: string }[] = [
  { id: 'home',    label: 'Home'    },
  { id: 'menu',    label: 'Menu'    },
  { id: 'orders',  label: 'Orders'  },
  { id: 'account', label: 'Account' },
];

const VapourApp: React.FC = () => {
  const { template, setTemplateId } = useTemplate();
  const { data: homeData }          = useHomeData();
  const { data: menuData }          = useMenuData();

  const [view, setView]              = useState<VapourView>('home');
  const [activeCategory, setCategory]= useState<number | null>(null);
  const [authUser, setAuthUser]      = useState<AuthUser | null>(getInitialUser);
  const [loginEmail, setEmail]       = useState('');
  const [loginPassword, setPassword] = useState('');
  const [loginError, setLoginError]  = useState('');
  const [loginLoading, setLoading]   = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const restaurantId   = getRestaurantId();
  const restaurantName = safe(getRestaurantName(), 'Vapour');
  const allCategories  = menuData?.categories ?? [];
  const popularDishes  = homeData?.popularDishes ?? [];
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
    setLoading(true);
    setLoginError('');
    try {
      const { token, user } = await login(loginEmail, loginPassword, restaurantId);
      saveAuth(token, user);
      setAuthUser(user);
      setEmail('');
      setPassword('');
    } catch (err: any) {
      setLoginError(safe(err?.message, 'Login failed'));
    } finally {
      setLoading(false);
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
    <div className="vp">
      <div className="vp__grid-bg" />
      <div className="vp__scanlines" />

      {/* ── Header + top nav ── */}
      <header className="vp__header">
        <p className="vp__restaurant-name">{restaurantName}</p>
        <nav className="vp__nav">
          {NAV.map(n => (
            <button
              key={n.id}
              className={`vp__nav-btn${view === n.id ? ' active' : ''}`}
              onClick={() => setView(n.id)}
            >{n.label}</button>
          ))}
        </nav>
      </header>
      <div className="vp__divider" />

      {/* ── Scrollable content ── */}
      <div className="vp__scroll">

        {/* ── HOME ── */}
        {view === 'home' && (
          <>
            {/* Hero */}
            {popularDishes[0] && (
              <div className="vp__hero" onClick={handleOrder}>
                <div
                  className="vp__hero-bg"
                  style={popularDishes[0].image ? { backgroundImage: `url(${popularDishes[0].image})` } : {}}
                />
                <div className="vp__hero-overlay" />
                <div className="vp__hero-content">
                  <p className="vp__hero-name">{safe(popularDishes[0].name, 'Featured')}</p>
                  {popularDishes[0].description
                    ? <p className="vp__hero-desc">{popularDishes[0].description}</p>
                    : null
                  }
                  <button className="vp__hero-btn" onClick={e => { e.stopPropagation(); handleOrder(); }}>
                    Order Now
                  </button>
                </div>
              </div>
            )}

            {/* Popular strip */}
            {popularDishes.length > 1 && (
              <>
                <p className="vp__section-label">Popular Dishes</p>
                <div className="vp__hscroll">
                  {popularDishes.slice(1).map((dish, i) => (
                    <div key={i} className="vp__dish-tile" onClick={handleOrder}>
                      {dish.image
                        ? <img className="vp__dish-img" src={dish.image} alt="" loading="lazy" />
                        : <div className="vp__dish-img-ph">⚡</div>
                      }
                      <div className="vp__dish-info">
                        <p className="vp__dish-name">{safe(dish.name)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Recent orders */}
            {recentOrders.length > 0 && (
              <>
                <p className="vp__section-label">Recent Orders</p>
                {recentOrders.slice(0, 2).map(o => (
                  <div key={o.id} className="vp__order-row">
                    <span className="vp__order-emoji">{safe(o.statusEmoji, '📦')}</span>
                    <div className="vp__order-detail">
                      <p className="vp__order-id">{safe(o.id)}</p>
                      <p className="vp__order-date">{safe(o.date)}</p>
                    </div>
                    <div className="vp__order-meta">
                      <p className="vp__order-total">${safe(o.total)}</p>
                      <p className="vp__order-status" style={{ color: safe(o.color, '#40C4FF') }}>
                        {safe(o.status)}
                      </p>
                    </div>
                  </div>
                ))}
                <button className="vp__text-link" onClick={() => setView('orders')}>
                  View all →
                </button>
              </>
            )}

            <div style={{ height: 16 }} />
            <button className="vp__cta" onClick={handleOrder}>Place Order</button>
            <div style={{ height: 20 }} />
          </>
        )}

        {/* ── MENU ── */}
        {view === 'menu' && (
          <>
            {allCategories.length > 0 && (
              <div className="vp__cats">
                <button
                  className={`vp__cat-pill${activeCategory === null ? ' active' : ''}`}
                  onClick={() => setCategory(null)}
                >All</button>
                {allCategories.map(cat => (
                  <button
                    key={cat.id}
                    className={`vp__cat-pill${activeCategory === cat.id ? ' active' : ''}`}
                    onClick={() => setCategory(cat.id)}
                  >{safe(cat.name)}</button>
                ))}
              </div>
            )}

            {filteredItems.length === 0 ? (
              <p className="vp__empty">{!menuData ? 'Loading…' : 'No items'}</p>
            ) : (
              <div className="vp__menu-list">
                {filteredItems.map(item => (
                  <div key={item.id} className="vp__menu-item" onClick={handleOrder}>
                    {item.image
                      ? <img className="vp__menu-thumb" src={item.image} alt="" loading="lazy" />
                      : <div className="vp__menu-thumb-ph">⚡</div>
                    }
                    <div className="vp__menu-info">
                      <p className="vp__menu-name">{safe(item.name)}</p>
                      {item.description
                        ? <p className="vp__menu-desc">{item.description}</p>
                        : null
                      }
                      <div className="vp__menu-row">
                        <span className="vp__menu-price">${safe(String(item.price))}</span>
                        <button
                          className="vp__menu-add"
                          onClick={e => { e.stopPropagation(); handleOrder(); }}
                        >+</button>
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
            <p className="vp__section-label">My Orders</p>
            {recentOrders.length > 0
              ? recentOrders.map(o => (
                  <div key={o.id} className="vp__order-row">
                    <span className="vp__order-emoji">{safe(o.statusEmoji, '📦')}</span>
                    <div className="vp__order-detail">
                      <p className="vp__order-id">{safe(o.id)}</p>
                      <p className="vp__order-date">{safe(o.date)}</p>
                    </div>
                    <div className="vp__order-meta">
                      <p className="vp__order-total">${safe(o.total)}</p>
                      <p className="vp__order-status" style={{ color: safe(o.color, '#40C4FF') }}>
                        {safe(o.status)}
                      </p>
                    </div>
                  </div>
                ))
              : <p className="vp__empty">No orders yet ⚡</p>
            }
            <div style={{ height: 16 }} />
            <button className="vp__cta" onClick={handleOrder}>Place New Order</button>
            <div style={{ height: 20 }} />
          </>
        )}

        {/* ── ACCOUNT ── */}
        {view === 'account' && (
          <>
            {authUser ? (
              <div className="vp__profile-card">
                <div className="vp__avatar">
                  {safe(authUser.name?.[0], '?').toUpperCase()}
                </div>
                <p className="vp__profile-name">{safe(authUser.name)}</p>
                <p className="vp__profile-email">{safe(authUser.email)}</p>
                {points > 0 && (
                  <div className="vp__loyalty">
                    <span>⚡</span>
                    <span>{points} loyalty points</span>
                  </div>
                )}
                <button className="vp__signout" onClick={() => { clearAuth(); setAuthUser(null); }}>
                  Sign Out
                </button>
                <div style={{ margin: '12px 0 4px', borderTop: '1px solid rgba(64,196,255,0.2)' }} />
                <button className="vp__signout" style={{ marginTop: 6 }} onClick={() => openWebView(clientUrl('edit-profile'), 'Edit Profile', template.colors.primary)}>
                  ✏️ Edit Profile
                </button>
                <button className="vp__signout" style={{ marginTop: 6 }} onClick={() => openWebView(clientUrl('favorites'), 'Favorites', template.colors.primary)}>
                  ❤️ Favorites
                </button>
                <button className="vp__signout" style={{ marginTop: 6 }} onClick={() => openWebView(clientUrl('points'), 'Points', template.colors.primary)}>
                  ⭐ Points
                </button>
                <button className="vp__signout" style={{ marginTop: 6 }} onClick={() => openWebView(clientUrl('address'), 'Saved Addresses', template.colors.primary)}>
                  🏠 Saved Addresses
                </button>
                <button className="vp__signout" style={{ marginTop: 6 }} onClick={() => setShowCustomize(true)}>
                  🎨 Customize
                </button>
                <button className="vp__signout" style={{ marginTop: 6 }}>
                  📋 Terms &amp; Conditions
                </button>
                <button className="vp__signout" style={{ marginTop: 6, background: '#EF4444', color: '#fff' }} onClick={() => setShowDeleteConfirm(true)}>
                  🗑️ Delete Account
                </button>
              </div>
            ) : (
              <div className="vp__login-card">
                <p className="vp__login-title">Access</p>
                <p className="vp__login-sub">Sign in to track orders &amp; earn rewards</p>
                {loginError && <p className="vp__login-error">{loginError}</p>}
                <form onSubmit={handleLogin}>
                  <input
                    className="vp__input"
                    type="email"
                    placeholder="Email address"
                    value={loginEmail}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                  <input
                    className="vp__input"
                    type="password"
                    placeholder="Password"
                    value={loginPassword}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button className="vp__submit" type="submit" disabled={loginLoading}>
                    {loginLoading ? 'Connecting…' : 'Sign In'}
                  </button>
                </form>
              </div>
            )}

            <p className="vp__tmpl-label">Switch Template</p>
            <div className="vp__tmpl-strip">
              {TEMPLATES.map(t => (
                <button
                  key={t.id}
                  className={`vp__tmpl-pill${t.id === template.id ? ' active' : ''}`}
                  style={{
                    background: t.colors.bg,
                    borderColor: t.id === template.id ? t.colors.primary : 'transparent',
                  }}
                  onClick={() => setTemplateId(t.id)}
                >
                  <span className="vp__tmpl-emoji">{t.emoji}</span>
                  <span className="vp__tmpl-name" style={{ color: t.colors.text }}>{t.name}</span>
                </button>
              ))}
            </div>
            <div style={{ height: 20 }} />
          </>
        )}

      </div>
      {showCustomize && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: '#0d0d1a' }}>
          <CustomizePage onBack={() => setShowCustomize(false)} />
        </div>
      )}

      {showDeleteConfirm && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-end' }}
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            style={{ width: '100%', background: '#0d0d1a', border: '1px solid rgba(64,196,255,0.3)', borderRadius: '16px 16px 0 0', padding: '20px 20px 32px', textAlign: 'center' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ width: 40, height: 4, background: 'rgba(64,196,255,0.3)', borderRadius: 2, margin: '0 auto 16px' }} />
            <span style={{ fontSize: 32 }}>⚠️</span>
            <h3 style={{ margin: '8px 0 4px', fontSize: 18, fontWeight: 700, color: '#40C4FF' }}>Delete Account?</h3>
            <p style={{ margin: '0 0 16px', fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>
              This will permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <button className="vp__cta" style={{ background: '#EF4444', marginBottom: 8 }} onClick={handleDeleteConfirmed}>
              Yes, Delete My Account
            </button>
            <button className="vp__cta" style={{ background: 'rgba(255,255,255,0.15)' }} onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default VapourApp;
