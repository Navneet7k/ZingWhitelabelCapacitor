import React, { useState } from 'react';
import { useTemplate, TEMPLATES } from '../context/TemplateContext';
import { useHomeData } from '../context/HomeDataContext';
import { useMenuData } from '../context/MenuDataContext';
import { getSavedUser, isLoggedIn, login, saveAuth, clearAuth } from '../services/authApi';
import type { AuthUser } from '../services/authApi';
import { getOrderUrl } from '../services/configApi';
import { getRestaurantId, getRestaurantName } from '../services/restaurantConfig';
import { openWebView } from '../services/webviewService';
import './GroveApp.css';

// Crash-safe helper: always returns a string, never throws
function safe(v: unknown, fallback = ''): string {
  try { return (v != null && v !== '') ? String(v) : fallback; } catch { return fallback; }
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
                      <p className="gv__order-total">₹{safe(o.total)}</p>
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
                        <span className="gv__menu-price">₹{safe(String(item.price))}</span>
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
                      <p className="gv__order-total">₹{safe(o.total)}</p>
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

    </div>
  );
};

export default GroveApp;
