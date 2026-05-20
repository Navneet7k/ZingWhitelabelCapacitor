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
import './GroveApp.css';

// Crash-safe helper: always returns a string, never throws
function safe(v: unknown, fallback = ''): string {
  try { return (v != null && v !== '') ? String(v) : fallback; } catch { return fallback; }
}

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

type GroveView = 'home' | 'menu' | 'orders' | 'account';

const NAV: { id: GroveView; icon: string; label: string }[] = [
  { id: 'home',    icon: '🌿', label: 'Home'    },
  { id: 'menu',    icon: '🍽️', label: 'Menu'    },
  { id: 'orders',  icon: '📦', label: 'Orders'  },
  { id: 'account', icon: '👤', label: 'Account' },
];

function getInitialUser(): AuthUser | null {
  try { return isLoggedIn() ? getSavedUser() : null; } catch { return null; }
}

const GroveApp: React.FC = () => {
  const { template, setTemplateId } = useTemplate();
  const { data: homeData }          = useHomeData();
  const { data: menuData }          = useMenuData();

  const [view, setView]              = useState<GroveView>('home');
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
  const restaurantName = safe(getRestaurantName(), 'Grove');
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
    checkOnTabSwitch();
    checkConfigColorsOnTabSwitch(restaurantId ?? '');
  }, [view]);

  const handleOrder = async () => {
    try {
      if (!authUser) { setView('account'); return; }
      const url = getOrderUrl();
      if (!url) return;
      await openWebView(url, 'Place Order', template.colors.primary);
    } catch { /* silent — never crash on order tap */ }
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
    <div className="gv">

      {/* ── Header ── */}
      <header className="gv__header">
        <p className="gv__header-name">{restaurantName}</p>
        {points > 0 && (
          <span className="gv__header-badge">{points} pts</span>
        )}
      </header>

      {/* ── Scrollable content ── */}
      <div className="gv__scroll">

        {/* ── HOME ── */}
        {view === 'home' && (
          <>
            {/* Hero — first popular dish or first banner */}
            {(() => {
              const hero = popularDishes[0];
              if (!hero) return null;
              return (
                <div className="gv__hero" onClick={handleOrder}>
                  {hero.image
                    ? <img className="gv__hero-img" src={hero.image} alt="" loading="lazy" />
                    : null
                  }
                  <div className="gv__hero-veil">
                    <p className="gv__hero-name">{safe(hero.name, 'Featured Dish')}</p>
                    {hero.description
                      ? <p className="gv__hero-sub">{hero.description}</p>
                      : null
                    }
                    <button className="gv__hero-btn" onClick={e => { e.stopPropagation(); handleOrder(); }}>
                      Order Now
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Popular dishes strip */}
            {popularDishes.length > 1 && (
              <>
                <p className="gv__section-label">Popular Dishes</p>
                <div className="gv__hscroll">
                  {popularDishes.slice(1).map((dish, i) => (
                    <div key={i} className="gv__dish-card" onClick={handleOrder}>
                      {dish.image
                        ? <img className="gv__dish-img" src={dish.image} alt="" loading="lazy" />
                        : <div className="gv__dish-img-placeholder">🌿</div>
                      }
                      <div className="gv__dish-info">
                        <p className="gv__dish-name">{safe(dish.name)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Banners strip */}
            {banners.length > 0 && (
              <>
                <p className="gv__section-label">Offers</p>
                <div className="gv__hscroll">
                  {banners.slice(0, 5).map(b => (
                    <div key={b.id} className="gv__dish-card" onClick={handleOrder}
                      style={b.image ? { backgroundImage: `url(${b.image})`, backgroundSize: 'cover' } : {}}
                    >
                      <div className="gv__dish-img-placeholder" style={b.image ? { opacity: 0 } : {}}>
                        🍃
                      </div>
                      <div className="gv__dish-info">
                        <p className="gv__dish-name">{safe(b.title)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Recent orders */}
            {recentOrders.length > 0 && (
              <>
                <p className="gv__section-label">Recent Orders</p>
                {recentOrders.slice(0, 2).map(o => (
                  <div key={o.id} className="gv__order-row">
                    <span className="gv__order-emoji">{safe(o.statusEmoji, '📦')}</span>
                    <div className="gv__order-detail">
                      <p className="gv__order-id">{safe(o.id)}</p>
                      <p className="gv__order-date">{safe(o.date)}</p>
                    </div>
                    <div className="gv__order-meta">
                      <p className="gv__order-total">${safe(o.total)}</p>
                      <p className="gv__order-status" style={{ color: safe(o.color, '#2C5F2E') }}>
                        {safe(o.status)}
                      </p>
                    </div>
                  </div>
                ))}
                <button className="gv__text-link" onClick={() => setView('orders')}>
                  View all orders →
                </button>
              </>
            )}

            <div style={{ height: 8 }} />
            <button className="gv__cta" onClick={handleOrder}>
              Place Order
            </button>
            <div style={{ height: 20 }} />
          </>
        )}

        {/* ── MENU ── */}
        {view === 'menu' && (
          <>
            <p className="gv__view-title">Menu</p>
            {allCategories.length > 0 && (
              <div className="gv__cats">
                <button
                  className={`gv__cat-pill${activeCategory === null ? ' active' : ''}`}
                  onClick={() => setCategory(null)}
                >All</button>
                {allCategories.map(cat => (
                  <button
                    key={cat.id}
                    className={`gv__cat-pill${activeCategory === cat.id ? ' active' : ''}`}
                    onClick={() => setCategory(cat.id)}
                  >{safe(cat.name)}</button>
                ))}
              </div>
            )}
            {filteredItems.length === 0 ? (
              <p className="gv__empty">{!menuData ? 'Loading…' : 'No items'}</p>
            ) : (
              <div className="gv__menu-grid">
                {filteredItems.map(item => (
                  <div key={item.id} className="gv__menu-card" onClick={handleOrder}>
                    {item.image
                      ? <img className="gv__menu-img" src={item.image} alt="" loading="lazy" />
                      : <div className="gv__menu-img-ph">🌿</div>
                    }
                    <div className="gv__menu-info">
                      <p className="gv__menu-name">{safe(item.name)}</p>
                      {item.description
                        ? <p className="gv__menu-desc">{item.description}</p>
                        : null
                      }
                      <div className="gv__menu-footer">
                        <span className="gv__menu-price">${safe(String(item.price))}</span>
                        <button
                          className="gv__menu-add"
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
            <p className="gv__view-title">My Orders</p>
            {recentOrders.length > 0
              ? recentOrders.map(o => (
                  <div key={o.id} className="gv__order-row">
                    <span className="gv__order-emoji">{safe(o.statusEmoji, '📦')}</span>
                    <div className="gv__order-detail">
                      <p className="gv__order-id">{safe(o.id)}</p>
                      <p className="gv__order-date">{safe(o.date)}</p>
                    </div>
                    <div className="gv__order-meta">
                      <p className="gv__order-total">${safe(o.total)}</p>
                      <p className="gv__order-status" style={{ color: safe(o.color, '#2C5F2E') }}>
                        {safe(o.status)}
                      </p>
                    </div>
                  </div>
                ))
              : <p className="gv__empty">No orders yet 🌿</p>
            }
            <div style={{ height: 12 }} />
            <button className="gv__cta" onClick={handleOrder}>Place New Order</button>
            <div style={{ height: 20 }} />
          </>
        )}

        {/* ── ACCOUNT ── */}
        {view === 'account' && (
          <>
            <p className="gv__view-title">Account</p>
            {authUser ? (
              <div className="gv__profile-card">
                <div className="gv__avatar">
                  {safe(authUser.name?.[0], '?').toUpperCase()}
                </div>
                <p className="gv__profile-name">{safe(authUser.name)}</p>
                <p className="gv__profile-email">{safe(authUser.email)}</p>
                {points > 0 && (
                  <div className="gv__loyalty">
                    <span>🌿</span>
                    <span>{points} loyalty points</span>
                  </div>
                )}
                <button className="gv__signout" onClick={() => { clearAuth(); setAuthUser(null); }}>
                  Sign Out
                </button>
                <div style={{ margin: '12px 0 4px', borderTop: '1px solid rgba(44,95,46,0.2)' }} />
                <button className="gv__signout" style={{ marginTop: 6 }} onClick={() => openWebView(clientUrl('edit-profile'), 'Edit Profile', template.colors.primary)}>
                  ✏️ Edit Profile
                </button>
                <button className="gv__signout" style={{ marginTop: 6 }} onClick={() => openWebView(clientUrl('favorites'), 'Favorites', template.colors.primary)}>
                  ❤️ Favorites
                </button>
                <button className="gv__signout" style={{ marginTop: 6 }} onClick={() => openWebView(clientUrl('points'), 'Points', template.colors.primary)}>
                  ⭐ Points
                </button>
                <button className="gv__signout" style={{ marginTop: 6 }} onClick={() => openWebView(clientUrl('address'), 'Saved Addresses', template.colors.primary)}>
                  🏠 Saved Addresses
                </button>
                <button className="gv__signout" style={{ marginTop: 6 }} onClick={() => setShowCustomize(true)}>
                  🎨 Customize
                </button>
                <button className="gv__signout" style={{ marginTop: 6 }}>
                  📋 Terms &amp; Conditions
                </button>
                <button className="gv__signout" style={{ marginTop: 6, background: '#EF4444', color: '#fff' }} onClick={() => setShowDeleteConfirm(true)}>
                  🗑️ Delete Account
                </button>
              </div>
            ) : (
              <div className="gv__login-card">
                <p className="gv__login-title">Sign In</p>
                <p className="gv__login-sub">Track orders &amp; earn rewards</p>
                {loginError && <p className="gv__login-error">{loginError}</p>}
                <form onSubmit={handleLogin}>
                  <input
                    className="gv__input"
                    type="email"
                    placeholder="Email address"
                    value={loginEmail}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                  <input
                    className="gv__input"
                    type="password"
                    placeholder="Password"
                    value={loginPassword}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button className="gv__submit" type="submit" disabled={loginLoading}>
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

            <p className="gv__tmpl-label">Switch Template</p>
            <div className="gv__tmpl-strip">
              {TEMPLATES.map(t => (
                <button
                  key={t.id}
                  className={`gv__tmpl-pill${t.id === template.id ? ' active' : ''}`}
                  style={{
                    background: t.colors.bg,
                    borderColor: t.id === template.id ? t.colors.primary : 'transparent',
                  }}
                  onClick={() => setTemplateId(t.id)}
                >
                  <span className="gv__tmpl-emoji">{t.emoji}</span>
                  <span className="gv__tmpl-name" style={{ color: t.colors.text }}>{t.name}</span>
                </button>
              ))}
            </div>
            <div style={{ height: 20 }} />
          </>
        )}

      </div>

      {/* ── Bottom nav ── */}
      <nav className="gv__nav">
        {NAV.map(n => (
          <button
            key={n.id}
            className={`gv__nav-btn${view === n.id ? ' active' : ''}`}
            onClick={() => setView(n.id)}
            aria-label={n.label}
          >
            <span className="gv__nav-icon">{n.icon}</span>
            <span className="gv__nav-label">{n.label}</span>
          </button>
        ))}
      </nav>

      {showCustomize && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: '#fff' }}>
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
            <button className="gv__cta" style={{ background: '#EF4444', marginBottom: 8 }} onClick={handleDeleteConfirmed}>
              Yes, Delete My Account
            </button>
            <button className="gv__cta" style={{ background: '#aaa' }} onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default GroveApp;
