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
import { getStatus, onStatusChange, applyIfReady, checkOnTabSwitch } from '../services/updater';
import type { UpdateStatus } from '../services/updater';
import CustomizePage from './CustomizePage';
import './NoirApp.css';

function updateStatusLabel(s: UpdateStatus): { text: string; color: string } {
  switch (s.state) {
    case 'idle':        return { text: 'Idle', color: '#888' };
    case 'checking':    return { text: 'Checking for updates…', color: '#F5A623' };
    case 'up_to_date':  return { text: `Up to date (${s.version})`, color: '#4CAF50' };
    case 'downloading': return { text: `Downloading update ${s.from} → ${s.to}…`, color: '#2196F3' };
    case 'ready':       return { text: `Update ready (v${s.version}) — restart app to apply`, color: '#9C27B0' };
    case 'error':       return { text: `Update error: ${s.reason}`, color: '#F44336' };
  }
}

function safe(v: unknown, fallback = ''): string {
  try { return (v != null && v !== '') ? String(v) : fallback; } catch { return fallback; }
}

function getInitialUser(): AuthUser | null {
  try { return isLoggedIn() ? getSavedUser() : null; } catch { return null; }
}

type NoirView = 'home' | 'menu' | 'orders' | 'account';

const NoirApp: React.FC = () => {
  const { template, setTemplateId } = useTemplate();
  const { data: homeData }          = useHomeData();
  const { data: menuData }          = useMenuData();

  const [view, setView]              = useState<NoirView>('home');
  const [activeCategory, setCategory]= useState<number | null>(null);
  const [authUser, setAuthUser]      = useState<AuthUser | null>(getInitialUser);
  const [loginEmail, setEmail]       = useState('');
  const [loginPassword, setPassword] = useState('');
  const [loginError, setLoginError]  = useState('');
  const [loginLoading, setLoading]   = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>(getStatus);
  useEffect(() => onStatusChange(setUpdateStatus), []);

  const restaurantId   = getRestaurantId();
  const restaurantName = safe(getRestaurantName(), 'Noir');
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
    checkOnTabSwitch();
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
    <div className="nr">
      <header className="nr__header">
        <span className="nr__logo">{restaurantName}</span>
        <div className="nr__header-rule" />
      </header>

      <div className="nr__scroll">

        {/* ── HOME ── */}
        {view === 'home' && (
          <>
            {popularDishes[0] && (
              <div className="nr__hero" onClick={handleOrder}>
                {popularDishes[0].image
                  ? <img className="nr__hero-img" src={popularDishes[0].image} alt="" />
                  : <div className="nr__hero-ph">🎭</div>
                }
                <div className="nr__hero-overlay">
                  <p className="nr__hero-name">{safe(popularDishes[0].name, 'Featured')}</p>
                  {popularDishes[0].description
                    ? <p className="nr__hero-desc">{popularDishes[0].description}</p>
                    : null
                  }
                  <button className="nr__hero-btn" onClick={e => { e.stopPropagation(); handleOrder(); }}>
                    Order Now
                  </button>
                </div>
              </div>
            )}

            {popularDishes.length > 1 && (
              <>
                <p className="nr__section-label">Today's Picks</p>
                <div className="nr__hscroll">
                  {popularDishes.slice(1).map((dish, i) => (
                    <div key={i} className="nr__pick-card" onClick={handleOrder}>
                      {dish.image
                        ? <img className="nr__pick-img" src={dish.image} alt="" loading="lazy" />
                        : <div className="nr__pick-ph">🎭</div>
                      }
                      <p className="nr__pick-name">{safe(dish.name)}</p>
                    </div>
                  ))}
                </div>
              </>
            )}

            {recentOrders.length > 0 && (
              <>
                <p className="nr__section-label">Recent Orders</p>
                {recentOrders.slice(0, 2).map(o => (
                  <div key={o.id} className="nr__order-row">
                    <div className="nr__order-left">
                      <p className="nr__order-id">{safe(o.id)}</p>
                      <p className="nr__order-date">{safe(o.date)}</p>
                    </div>
                    <div className="nr__order-right">
                      <p className="nr__order-total">${safe(o.total)}</p>
                      <p className="nr__order-status" style={{ color: safe(o.color, '#E8C87A') }}>
                        {safe(o.status)}
                      </p>
                    </div>
                  </div>
                ))}
              </>
            )}

            <div style={{ height: 16 }} />
            <button className="nr__cta" onClick={handleOrder}>Place Order</button>
            <div style={{ height: 24 }} />
          </>
        )}

        {/* ── MENU ── */}
        {view === 'menu' && (
          <>
            {allCategories.length > 0 && (
              <div className="nr__cats">
                <button
                  className={`nr__cat${activeCategory === null ? ' active' : ''}`}
                  onClick={() => setCategory(null)}
                >All</button>
                {allCategories.map(cat => (
                  <button
                    key={cat.id}
                    className={`nr__cat${activeCategory === cat.id ? ' active' : ''}`}
                    onClick={() => setCategory(cat.id)}
                  >{safe(cat.name)}</button>
                ))}
              </div>
            )}

            {filteredItems.length === 0 ? (
              <p className="nr__empty">{!menuData ? 'Loading…' : 'No items'}</p>
            ) : (
              <div className="nr__menu-list">
                {filteredItems.map(item => (
                  <div key={item.id} className="nr__menu-row" onClick={handleOrder}>
                    {item.image
                      ? <img className="nr__menu-thumb" src={item.image} alt="" loading="lazy" />
                      : <div className="nr__menu-thumb-ph">🎭</div>
                    }
                    <div className="nr__menu-info">
                      <p className="nr__menu-name">{safe(item.name)}</p>
                      {item.description
                        ? <p className="nr__menu-desc">{item.description}</p>
                        : null
                      }
                    </div>
                    <div className="nr__menu-end">
                      <p className="nr__menu-price">${safe(String(item.price))}</p>
                      <button className="nr__menu-add" onClick={e => { e.stopPropagation(); handleOrder(); }}>+</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ height: 24 }} />
          </>
        )}

        {/* ── ORDERS ── */}
        {view === 'orders' && (
          <>
            <p className="nr__section-label">My Orders</p>
            {recentOrders.length > 0
              ? recentOrders.map(o => (
                  <div key={o.id} className="nr__order-row">
                    <div className="nr__order-left">
                      <p className="nr__order-id">{safe(o.id)}</p>
                      <p className="nr__order-date">{safe(o.date)}</p>
                    </div>
                    <div className="nr__order-right">
                      <p className="nr__order-total">${safe(o.total)}</p>
                      <p className="nr__order-status" style={{ color: safe(o.color, '#E8C87A') }}>
                        {safe(o.status)}
                      </p>
                    </div>
                  </div>
                ))
              : <p className="nr__empty">No orders yet 🎭</p>
            }
            <div style={{ height: 16 }} />
            <button className="nr__cta" onClick={handleOrder}>Place New Order</button>
            <div style={{ height: 24 }} />
          </>
        )}

        {/* ── ACCOUNT ── */}
        {view === 'account' && (
          <>
            {authUser ? (
              <div className="nr__profile">
                <div className="nr__avatar">
                  {safe(authUser.name?.[0], '?').toUpperCase()}
                </div>
                <p className="nr__profile-name">{safe(authUser.name)}</p>
                <p className="nr__profile-email">{safe(authUser.email)}</p>
                {points > 0 && (
                  <div className="nr__loyalty">
                    <span>🎭 {points} loyalty points</span>
                  </div>
                )}
                <button className="nr__signout" onClick={() => { clearAuth(); setAuthUser(null); }}>
                  Sign Out
                </button>
                <div style={{ margin: '12px 0 4px', borderTop: '1px solid rgba(232,200,122,0.2)' }} />
                <button className="nr__signout" style={{ marginTop: 6 }} onClick={() => openWebView(clientUrl('edit-profile'), 'Edit Profile', template.colors.primary)}>
                  ✏️ Edit Profile
                </button>
                <button className="nr__signout" style={{ marginTop: 6 }} onClick={() => openWebView(clientUrl('favorites'), 'Favorites', template.colors.primary)}>
                  ❤️ Favorites
                </button>
                <button className="nr__signout" style={{ marginTop: 6 }} onClick={() => openWebView(clientUrl('points'), 'Points', template.colors.primary)}>
                  ⭐ Points
                </button>
                <button className="nr__signout" style={{ marginTop: 6 }} onClick={() => openWebView(clientUrl('address'), 'Saved Addresses', template.colors.primary)}>
                  🏠 Saved Addresses
                </button>
                <button className="nr__signout" style={{ marginTop: 6 }} onClick={() => setShowCustomize(true)}>
                  🎨 Customize
                </button>
                <button className="nr__signout" style={{ marginTop: 6 }}>
                  📋 Terms &amp; Conditions
                </button>
                <button className="nr__signout" style={{ marginTop: 6, background: '#EF4444', color: '#fff' }} onClick={() => setShowDeleteConfirm(true)}>
                  🗑️ Delete Account
                </button>
              </div>
            ) : (
              <div className="nr__login">
                <p className="nr__login-title">Sign In</p>
                <p className="nr__login-sub">Access your orders &amp; rewards</p>
                {loginError && <p className="nr__login-error">{loginError}</p>}
                <form onSubmit={handleLogin}>
                  <input
                    className="nr__input"
                    type="email"
                    placeholder="Email address"
                    value={loginEmail}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                  <input
                    className="nr__input"
                    type="password"
                    placeholder="Password"
                    value={loginPassword}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button className="nr__submit" type="submit" disabled={loginLoading}>
                    {loginLoading ? 'Signing in…' : 'Sign In'}
                  </button>
                </form>
              </div>
            )}

            <div style={{ margin: '16px 16px 4px', background: 'rgba(0,0,0,0.15)', borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 18 }}>
                  {updateStatus.state === 'checking' || updateStatus.state === 'downloading' ? '🔄' :
                   updateStatus.state === 'ready' ? '⬆️' :
                   updateStatus.state === 'error' ? '❌' : '🔃'}
                </span>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--t-text, #fff)' }}>App Updates</span>
              </div>
              <p style={{ margin: '0 0 8px', fontSize: 12, color: updateStatusLabel(updateStatus).color }}>
                {updateStatus.state === 'ready'
                  ? `v${(updateStatus as any).version} downloaded — tap to install`
                  : updateStatusLabel(updateStatus).text}
              </p>
              {updateStatus.state === 'ready' && (
                <button
                  style={{ padding: '8px 16px', background: template.colors.primary, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                  onClick={() => applyIfReady()}
                >Apply Update Now</button>
              )}
            </div>

            <p className="nr__tmpl-label">Switch Template</p>
            <div className="nr__tmpl-grid">
              {TEMPLATES.map(t => (
                <button
                  key={t.id}
                  className={`nr__tmpl-btn${t.id === template.id ? ' active' : ''}`}
                  style={{
                    background: t.colors.bg,
                    borderColor: t.id === template.id ? '#E8C87A' : 'transparent',
                  }}
                  onClick={() => setTemplateId(t.id)}
                >
                  <span className="nr__tmpl-emoji">{t.emoji}</span>
                  <span className="nr__tmpl-name" style={{ color: t.colors.text }}>{t.name}</span>
                </button>
              ))}
            </div>
            <div style={{ height: 24 }} />
          </>
        )}

      </div>

      {/* ── Floating pill nav ── */}
      <nav className="nr__nav">
        {(['home', 'menu', 'orders', 'account'] as NoirView[]).map(v => (
          <button
            key={v}
            className={`nr__nav-btn${view === v ? ' active' : ''}`}
            onClick={() => setView(v)}
          >
            <span className="nr__nav-icon">
              {v === 'home' ? '⌂' : v === 'menu' ? '⊞' : v === 'orders' ? '≡' : '○'}
            </span>
            <span className="nr__nav-label">{v}</span>
          </button>
        ))}
      </nav>
      {showCustomize && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: '#0a0a0a' }}>
          <CustomizePage onBack={() => setShowCustomize(false)} />
        </div>
      )}

      {showDeleteConfirm && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-end' }}
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            style={{ width: '100%', background: '#111', borderRadius: '16px 16px 0 0', padding: '20px 20px 32px', textAlign: 'center' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ width: 40, height: 4, background: 'rgba(232,200,122,0.4)', borderRadius: 2, margin: '0 auto 16px' }} />
            <span style={{ fontSize: 32 }}>⚠️</span>
            <h3 style={{ margin: '8px 0 4px', fontSize: 18, fontWeight: 700, color: '#E8C87A' }}>Delete Account?</h3>
            <p style={{ margin: '0 0 16px', fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>
              This will permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <button className="nr__cta" style={{ background: '#EF4444', marginBottom: 8 }} onClick={handleDeleteConfirmed}>
              Yes, Delete My Account
            </button>
            <button className="nr__cta" style={{ background: 'rgba(255,255,255,0.15)' }} onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default NoirApp;
