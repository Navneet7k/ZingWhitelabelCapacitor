import React, { useState } from 'react';
import { useTemplate, TEMPLATES } from '../context/TemplateContext';
import { useHomeData } from '../context/HomeDataContext';
import { useMenuData } from '../context/MenuDataContext';
import { getSavedUser, isLoggedIn, login, saveAuth, clearAuth } from '../services/authApi';
import type { AuthUser } from '../services/authApi';
import { getOrderUrl } from '../services/configApi';
import { getRestaurantId, getRestaurantName } from '../services/restaurantConfig';
import { openWebView } from '../services/webviewService';
import './DuskApp.css';

function safe(v: unknown, fallback = ''): string {
  try { return (v != null && v !== '') ? String(v) : fallback; } catch { return fallback; }
}

function getInitialUser(): AuthUser | null {
  try { return isLoggedIn() ? getSavedUser() : null; } catch { return null; }
}

type DuskView = 'home' | 'menu' | 'orders' | 'account';

const NAV: { id: DuskView; icon: string; label: string }[] = [
  { id: 'home',    icon: '⌂', label: 'Home'    },
  { id: 'menu',    icon: '⊞', label: 'Menu'    },
  { id: 'orders',  icon: '≡', label: 'Orders'  },
  { id: 'account', icon: '○', label: 'Account' },
];

const DuskApp: React.FC = () => {
  const { template, setTemplateId } = useTemplate();
  const { data: homeData }          = useHomeData();
  const { data: menuData }          = useMenuData();

  const [view, setView]              = useState<DuskView>('home');
  const [activeCategory, setCategory]= useState<number | null>(null);
  const [authUser, setAuthUser]      = useState<AuthUser | null>(getInitialUser);
  const [loginEmail, setEmail]       = useState('');
  const [loginPassword, setPassword] = useState('');
  const [loginError, setLoginError]  = useState('');
  const [loginLoading, setLoading]   = useState(false);

  const restaurantId   = getRestaurantId();
  const restaurantName = safe(getRestaurantName(), 'Dusk');
  const allCategories  = menuData?.categories ?? [];
  const popularDishes  = homeData?.popularDishes ?? [];
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

  return (
    <div className="dk">
      <div className="dk__bg" />

      {/* ── Header ── */}
      <header className="dk__header">
        <p className="dk__restaurant-name">{restaurantName}</p>
      </header>

      {/* ── Scrollable content ── */}
      <div className="dk__scroll">

        {/* ── HOME ── */}
        {view === 'home' && (
          <>
            {popularDishes[0] && (
              <div className="dk__hero" onClick={handleOrder}>
                {popularDishes[0].image
                  ? <img className="dk__hero-img" src={popularDishes[0].image} alt="" />
                  : <div className="dk__hero-ph">🌅</div>
                }
                <div className="dk__hero-overlay">
                  <p className="dk__hero-tag">Featured</p>
                  <p className="dk__hero-name">{safe(popularDishes[0].name, 'Featured Dish')}</p>
                  {popularDishes[0].description
                    ? <p className="dk__hero-desc">{popularDishes[0].description}</p>
                    : null
                  }
                  <button className="dk__hero-btn" onClick={e => { e.stopPropagation(); handleOrder(); }}>
                    Order Now
                  </button>
                </div>
              </div>
            )}

            {popularDishes.length > 1 && (
              <>
                <p className="dk__section-label">Popular</p>
                <div className="dk__hscroll">
                  {popularDishes.slice(1).map((dish, i) => (
                    <div key={i} className="dk__dish-card" onClick={handleOrder}>
                      {dish.image
                        ? <img className="dk__dish-img" src={dish.image} alt="" loading="lazy" />
                        : <div className="dk__dish-ph">🌅</div>
                      }
                      <div className="dk__dish-footer">
                        <p className="dk__dish-name">{safe(dish.name)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {recentOrders.length > 0 && (
              <>
                <p className="dk__section-label">Recent Orders</p>
                {recentOrders.slice(0, 2).map(o => (
                  <div key={o.id} className="dk__order-card">
                    <span className="dk__order-emoji">{safe(o.statusEmoji, '📦')}</span>
                    <div className="dk__order-info">
                      <p className="dk__order-id">{safe(o.id)}</p>
                      <p className="dk__order-date">{safe(o.date)}</p>
                    </div>
                    <div className="dk__order-meta">
                      <p className="dk__order-total">${safe(o.total)}</p>
                      <p className="dk__order-status" style={{ color: safe(o.color, '#FFB347') }}>
                        {safe(o.status)}
                      </p>
                    </div>
                  </div>
                ))}
              </>
            )}

            <div style={{ height: 16 }} />
            <button className="dk__cta" onClick={handleOrder}>Place Order</button>
            <div style={{ height: 20 }} />
          </>
        )}

        {/* ── MENU ── */}
        {view === 'menu' && (
          <>
            {/* Stories-style category bubbles */}
            {allCategories.length > 0 && (
              <div className="dk__stories">
                <button
                  className={`dk__story${activeCategory === null ? ' active' : ''}`}
                  onClick={() => setCategory(null)}
                >
                  <div className="dk__story-circle">★</div>
                  <span className="dk__story-label">All</span>
                </button>
                {allCategories.map(cat => (
                  <button
                    key={cat.id}
                    className={`dk__story${activeCategory === cat.id ? ' active' : ''}`}
                    onClick={() => setCategory(cat.id)}
                  >
                    <div className="dk__story-circle">
                      {safe(cat.name)?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <span className="dk__story-label">{safe(cat.name)}</span>
                  </button>
                ))}
              </div>
            )}

            {filteredItems.length === 0 ? (
              <p className="dk__empty">{!menuData ? 'Loading…' : 'No items'}</p>
            ) : (
              <div className="dk__menu-list">
                {filteredItems.map(item => (
                  <div key={item.id} className="dk__menu-card" onClick={handleOrder}>
                    {item.image
                      ? <img className="dk__menu-thumb" src={item.image} alt="" loading="lazy" />
                      : <div className="dk__menu-thumb-ph">🌅</div>
                    }
                    <div className="dk__menu-info">
                      <p className="dk__menu-name">{safe(item.name)}</p>
                      {item.description
                        ? <p className="dk__menu-desc">{item.description}</p>
                        : null
                      }
                      <div className="dk__menu-row">
                        <span className="dk__menu-price">${safe(String(item.price))}</span>
                        <button
                          className="dk__menu-add"
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
            <p className="dk__section-label">My Orders</p>
            {recentOrders.length > 0
              ? recentOrders.map(o => (
                  <div key={o.id} className="dk__order-card">
                    <span className="dk__order-emoji">{safe(o.statusEmoji, '📦')}</span>
                    <div className="dk__order-info">
                      <p className="dk__order-id">{safe(o.id)}</p>
                      <p className="dk__order-date">{safe(o.date)}</p>
                    </div>
                    <div className="dk__order-meta">
                      <p className="dk__order-total">${safe(o.total)}</p>
                      <p className="dk__order-status" style={{ color: safe(o.color, '#FFB347') }}>
                        {safe(o.status)}
                      </p>
                    </div>
                  </div>
                ))
              : <p className="dk__empty">No orders yet 🌅</p>
            }
            <div style={{ height: 16 }} />
            <button className="dk__cta" onClick={handleOrder}>Place New Order</button>
            <div style={{ height: 20 }} />
          </>
        )}

        {/* ── ACCOUNT ── */}
        {view === 'account' && (
          <>
            {authUser ? (
              <div className="dk__profile-card">
                <div className="dk__avatar">
                  {safe(authUser.name?.[0], '?').toUpperCase()}
                </div>
                <p className="dk__profile-name">{safe(authUser.name)}</p>
                <p className="dk__profile-email">{safe(authUser.email)}</p>
                {points > 0 && (
                  <div className="dk__loyalty">
                    <span>🌅 {points} loyalty points</span>
                  </div>
                )}
                <button className="dk__signout" onClick={() => { clearAuth(); setAuthUser(null); }}>
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="dk__login-card">
                <p className="dk__login-title">Welcome</p>
                <p className="dk__login-sub">Sign in to track orders &amp; earn rewards</p>
                {loginError && <p className="dk__login-error">{loginError}</p>}
                <form onSubmit={handleLogin}>
                  <input
                    className="dk__input"
                    type="email"
                    placeholder="Email address"
                    value={loginEmail}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                  <input
                    className="dk__input"
                    type="password"
                    placeholder="Password"
                    value={loginPassword}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button className="dk__submit" type="submit" disabled={loginLoading}>
                    {loginLoading ? 'Signing in…' : 'Sign In'}
                  </button>
                </form>
              </div>
            )}

            <p className="dk__tmpl-label">Switch Template</p>
            <div className="dk__tmpl-strip">
              {TEMPLATES.map(t => (
                <button
                  key={t.id}
                  className={`dk__tmpl-pill${t.id === template.id ? ' active' : ''}`}
                  style={{
                    background: t.colors.bg,
                    borderColor: t.id === template.id ? '#FFB347' : 'transparent',
                  }}
                  onClick={() => setTemplateId(t.id)}
                >
                  <span className="dk__tmpl-emoji">{t.emoji}</span>
                  <span className="dk__tmpl-name" style={{ color: t.colors.text }}>{t.name}</span>
                </button>
              ))}
            </div>
            <div style={{ height: 20 }} />
          </>
        )}

      </div>

      {/* ── Tab bar ── */}
      <nav className="dk__tabbar">
        {NAV.map(n => (
          <button
            key={n.id}
            className={`dk__tab${view === n.id ? ' active' : ''}`}
            onClick={() => setView(n.id)}
          >
            <span className="dk__tab-icon">{n.icon}</span>
            <span className="dk__tab-label">{n.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default DuskApp;
