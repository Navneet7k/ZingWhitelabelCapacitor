import React, { useState } from 'react';
import { useTemplate, TEMPLATES } from '../context/TemplateContext';
import { useHomeData } from '../context/HomeDataContext';
import { useMenuData } from '../context/MenuDataContext';
import { getSavedUser, isLoggedIn, login, saveAuth, clearAuth } from '../services/authApi';
import type { AuthUser } from '../services/authApi';
import { getOrderUrl } from '../services/configApi';
import { getRestaurantId, getRestaurantName } from '../services/restaurantConfig';
import { openWebView } from '../services/webviewService';
import './FloatApp.css';

type FloatView = 'home' | 'menu' | 'orders' | 'account';

function getInitialUser(): AuthUser | null {
  return isLoggedIn() ? getSavedUser() : null;
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning ☀️';
  if (h < 17) return 'Good Afternoon';
  if (h < 21) return 'Good Evening 🌙';
  return 'Good Night ✨';
}

const NAV: { id: FloatView; icon: string; label: string }[] = [
  { id: 'home',    icon: '⌂',  label: 'Home'    },
  { id: 'menu',    icon: '◉',  label: 'Menu'    },
  { id: 'orders',  icon: '◫',  label: 'Orders'  },
  { id: 'account', icon: '○',  label: 'Account' },
];

const FloatApp: React.FC = () => {
  const { template, setTemplateId } = useTemplate();
  const { data: homeData }          = useHomeData();
  const { data: menuData }          = useMenuData();

  const [view, setView]               = useState<FloatView>('home');
  const [activeCategory, setCategory] = useState<number | null>(null);
  const [authUser, setAuthUser]       = useState<AuthUser | null>(getInitialUser);
  const [loginEmail, setEmail]        = useState('');
  const [loginPassword, setPassword]  = useState('');
  const [loginError, setLoginError]   = useState('');
  const [loginLoading, setLoading]    = useState(false);

  const restaurantId   = getRestaurantId();
  const restaurantName = getRestaurantName();
  const allCategories  = menuData?.categories ?? [];

  const filteredItems = activeCategory
    ? (allCategories.find(c => c.id === activeCategory)?.items ?? [])
    : allCategories.flatMap(c => c.items);

  const handleOrder = async () => {
    if (!authUser) { setView('account'); return; }
    const url = getOrderUrl();
    if (!url) return;
    await openWebView(url, 'Place Order', template.colors.primary);
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
      setLoginError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const featured   = homeData?.popularDishes[0];
  const heroImage  = featured?.image || homeData?.banners[0]?.image;

  return (
    <div className="fl">

      {/* ── Animated gradient backdrop ─────────── */}
      <div className="fl__bg" />

      {/* ── Content area ───────────────────────── */}
      <div className="fl__scroll">

        {/* ── HOME view ────────────────────────── */}
        {view === 'home' && (
          <div className="fl__view" key="home">

            {/* Welcome card */}
            <div className="fl__glass-card fl__welcome">
              <div className="fl__welcome-top">
                <div>
                  <p className="fl__greeting">{greeting()}</p>
                  <h1 className="fl__restaurant-name">{restaurantName || 'Welcome'}</h1>
                </div>
                {(homeData?.points ?? 0) > 0 && (
                  <div className="fl__points-badge">
                    <span className="fl__points-val">{homeData!.points}</span>
                    <span className="fl__points-lbl">pts</span>
                  </div>
                )}
              </div>
              <button className="fl__order-btn" onClick={handleOrder}>
                Order Now →
              </button>
            </div>

            {/* Featured dish */}
            {featured && (
              <div
                className="fl__glass-card fl__featured"
                style={featured.image ? { backgroundImage: `url(${featured.image})` } : {}}
                onClick={handleOrder}
              >
                <div className="fl__featured-veil">
                  <span className="fl__featured-tag">{featured.tag}</span>
                  <h2 className="fl__featured-name">{featured.name}</h2>
                  {featured.description && (
                    <p className="fl__featured-desc">{featured.description}</p>
                  )}
                  <span className="fl__featured-cta">Tap to order →</span>
                </div>
              </div>
            )}

            {/* Popular dishes scroll */}
            {(homeData?.popularDishes?.length ?? 0) > 1 && (
              <div className="fl__section">
                <p className="fl__section-label">Popular Dishes</p>
                <div className="fl__horiz-scroll">
                  {homeData!.popularDishes.slice(1).map((dish, i) => (
                    <div key={i} className="fl__glass-card fl__dish-card" onClick={handleOrder}>
                      {dish.image && (
                        <img className="fl__dish-img" src={dish.image} alt={dish.name} loading="lazy" />
                      )}
                      <p className="fl__dish-name">{dish.name}</p>
                      <span className="fl__dish-tag">{dish.tag}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Banners */}
            {(homeData?.banners?.length ?? 0) > 0 && (
              <div className="fl__section">
                <p className="fl__section-label">Offers</p>
                <div className="fl__horiz-scroll">
                  {homeData!.banners.slice(0, 4).map(b => (
                    <div
                      key={b.id}
                      className="fl__glass-card fl__banner-card"
                      style={{ backgroundImage: `url(${b.image})` }}
                      onClick={handleOrder}
                    >
                      <div className="fl__banner-veil">
                        <p className="fl__banner-title">{b.title}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent orders teaser */}
            {(homeData?.recentOrders?.length ?? 0) > 0 && (
              <div className="fl__section">
                <p className="fl__section-label">Recent Orders</p>
                {homeData!.recentOrders.slice(0, 2).map(o => (
                  <div key={o.id} className="fl__glass-card fl__order-row">
                    <span className="fl__order-emoji">{o.statusEmoji}</span>
                    <div className="fl__order-detail">
                      <p className="fl__order-id">{o.id}</p>
                      <p className="fl__order-date">{o.date}</p>
                    </div>
                    <div className="fl__order-meta">
                      <p className="fl__order-total">₹{o.total}</p>
                      <p className="fl__order-status" style={{ color: o.color }}>{o.status}</p>
                    </div>
                  </div>
                ))}
                <button className="fl__text-link" onClick={() => setView('orders')}>
                  View all orders →
                </button>
              </div>
            )}

          </div>
        )}

        {/* ── MENU view ────────────────────────── */}
        {view === 'menu' && (
          <div className="fl__view" key="menu">
            <p className="fl__view-title">Menu</p>

            {/* Category pills */}
            {allCategories.length > 0 && (
              <div className="fl__cats-scroll">
                <button
                  className={`fl__cat-pill${activeCategory === null ? ' active' : ''}`}
                  onClick={() => setCategory(null)}
                >All</button>
                {allCategories.map(cat => (
                  <button
                    key={cat.id}
                    className={`fl__cat-pill${activeCategory === cat.id ? ' active' : ''}`}
                    onClick={() => setCategory(cat.id)}
                  >{cat.name}</button>
                ))}
              </div>
            )}

            {/* Menu grid */}
            {filteredItems.length === 0 ? (
              <p className="fl__empty">{!menuData ? 'Loading…' : 'No items'}</p>
            ) : (
              <div className="fl__menu-grid">
                {filteredItems.map(item => (
                  <div key={item.id} className="fl__glass-card fl__menu-card" onClick={handleOrder}>
                    {item.image
                      ? <img className="fl__menu-img" src={item.image} alt={item.name} loading="lazy" />
                      : <div className="fl__menu-img-placeholder">🍽️</div>
                    }
                    <div className="fl__menu-info">
                      <p className="fl__menu-name">{item.name}</p>
                      {item.description && (
                        <p className="fl__menu-desc">{item.description}</p>
                      )}
                      <div className="fl__menu-footer">
                        <span className="fl__menu-price">₹{item.price}</span>
                        <button
                          className="fl__menu-add"
                          onClick={e => { e.stopPropagation(); handleOrder(); }}
                        >+</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── ORDERS view ──────────────────────── */}
        {view === 'orders' && (
          <div className="fl__view" key="orders">
            <p className="fl__view-title">My Orders</p>
            {(homeData?.recentOrders?.length ?? 0) > 0 ? (
              homeData!.recentOrders.map(o => (
                <div key={o.id} className="fl__glass-card fl__order-row fl__order-row--full">
                  <span className="fl__order-emoji">{o.statusEmoji}</span>
                  <div className="fl__order-detail">
                    <p className="fl__order-id">{o.id}</p>
                    <p className="fl__order-date">{o.date}</p>
                  </div>
                  <div className="fl__order-meta">
                    <p className="fl__order-total">₹{o.total}</p>
                    <p className="fl__order-status" style={{ color: o.color }}>{o.status}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="fl__empty">No orders yet 🔮</p>
            )}
            <button className="fl__cta-btn" onClick={handleOrder}>
              Place New Order
            </button>
          </div>
        )}

        {/* ── ACCOUNT view ─────────────────────── */}
        {view === 'account' && (
          <div className="fl__view" key="account">
            <p className="fl__view-title">Account</p>
            {authUser ? (
              <div className="fl__glass-card fl__profile-card">
                <div className="fl__profile-avatar">
                  {authUser.name?.[0]?.toUpperCase() ?? '?'}
                </div>
                <h2 className="fl__profile-name">{authUser.name}</h2>
                <p className="fl__profile-email">{authUser.email}</p>
                {(homeData?.points ?? 0) > 0 && (
                  <div className="fl__loyalty">
                    <span>✨</span>
                    <span>{homeData!.points} loyalty points</span>
                  </div>
                )}
                <button
                  className="fl__signout-btn"
                  onClick={() => { clearAuth(); setAuthUser(null); }}
                >Sign Out</button>
              </div>
            ) : (
              <div className="fl__glass-card fl__login-card">
                <h2 className="fl__login-title">Sign In</h2>
                <p className="fl__login-sub">Track orders &amp; earn rewards</p>
                {loginError && <p className="fl__login-error">{loginError}</p>}
                <form onSubmit={handleLogin} className="fl__form">
                  <input
                    className="fl__input"
                    type="email"
                    placeholder="Email address"
                    value={loginEmail}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                  <input
                    className="fl__input"
                    type="password"
                    placeholder="Password"
                    value={loginPassword}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button className="fl__cta-btn" type="submit" disabled={loginLoading}>
                    {loginLoading ? 'Signing in…' : 'Sign In'}
                  </button>
                </form>
              </div>
            )}

            {/* Template switcher */}
            <div className="fl__section">
              <p className="fl__section-label">Switch Template</p>
              <div className="fl__template-strip">
                {TEMPLATES.map(t => (
                  <button
                    key={t.id}
                    className={`fl__template-pill${t.id === template.id ? ' active' : ''}`}
                    style={{
                      background: t.colors.bg,
                      borderColor: t.id === template.id ? t.colors.primary : 'transparent',
                    }}
                    onClick={() => setTemplateId(t.id)}
                  >
                    <span className="fl__template-emoji">{t.emoji}</span>
                    <span className="fl__template-name" style={{ color: t.colors.text }}>{t.name}</span>
                  </button>
                ))}
              </div>
            </div>

          </div>
        )}

        <div className="fl__nav-pad" />
      </div>

      {/* ── Floating glass nav bubble ───────────── */}
      <nav className="fl__nav">
        {NAV.map(n => (
          <button
            key={n.id}
            className={`fl__nav-btn${view === n.id ? ' active' : ''}`}
            onClick={() => setView(n.id)}
            aria-label={n.label}
          >
            <span className="fl__nav-icon">{n.icon}</span>
            <span className="fl__nav-label">{n.label}</span>
          </button>
        ))}
      </nav>

    </div>
  );
};

export default FloatApp;
