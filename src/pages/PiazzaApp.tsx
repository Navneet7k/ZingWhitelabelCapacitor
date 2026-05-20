import React, { useState, useEffect } from 'react';
import { useTemplate, TEMPLATES } from '../context/TemplateContext';
import { useHomeData } from '../context/HomeDataContext';
import { useMenuData } from '../context/MenuDataContext';
import { getSavedUser, isLoggedIn, login, saveAuth, clearAuth } from '../services/authApi';
import type { AuthUser } from '../services/authApi';
import { getOrderUrl } from '../services/configApi';
import { getRestaurantId, getRestaurantName } from '../services/restaurantConfig';
import { openWebView } from '../services/webviewService';
import './PiazzaApp.css';

function safe(v: unknown, fallback = ''): string {
  try { return (v != null && v !== '') ? String(v) : fallback; } catch { return fallback; }
}

function getInitialUser(): AuthUser | null {
  try { return isLoggedIn() ? getSavedUser() : null; } catch { return null; }
}

type PiazzaView = 'home' | 'menu' | 'orders' | 'account';

const NAV: { id: PiazzaView; icon: string; label: string }[] = [
  { id: 'home',    icon: '🏠', label: 'Home'    },
  { id: 'menu',    icon: '📋', label: 'Menu'    },
  { id: 'orders',  icon: '🛍️', label: 'Order'   },
  { id: 'account', icon: '👤', label: 'Account' },
];

const PiazzaApp: React.FC = () => {
  const { template, setTemplateId } = useTemplate();
  const { data: homeData }          = useHomeData();
  const { data: menuData }          = useMenuData();

  const [view, setView]               = useState<PiazzaView>('home');
  const [heroIndex, setHeroIndex]     = useState(0);
  const [featIndex, setFeatIndex]     = useState(0);
  const [activeCategory, setCategory] = useState<number | null>(null);
  const [authUser, setAuthUser]       = useState<AuthUser | null>(getInitialUser);
  const [loginEmail, setEmail]        = useState('');
  const [loginPassword, setPassword]  = useState('');
  const [loginError, setLoginError]   = useState('');
  const [loginLoading, setLoading]    = useState(false);

  const restaurantId   = getRestaurantId();
  const restaurantName = safe(getRestaurantName(), 'Our Restaurant');
  const allCategories  = menuData?.categories ?? [];
  const popularDishes  = homeData?.popularDishes ?? [];
  const banners        = homeData?.banners ?? [];
  const recentOrders   = homeData?.recentOrders ?? [];
  const points         = homeData?.points ?? 0;

  const filteredItems = activeCategory
    ? (allCategories.find(c => c.id === activeCategory)?.items ?? [])
    : allCategories.flatMap(c => c.items ?? []);

  // Hero auto-advance every 3 s
  useEffect(() => {
    if (popularDishes.length <= 1) return;
    const t = setInterval(() => setHeroIndex(i => (i + 1) % popularDishes.length), 3000);
    return () => clearInterval(t);
  }, [popularDishes.length]);

  // Featured images auto-advance every 4 s (offset from hero)
  useEffect(() => {
    if (popularDishes.length <= 1) return;
    const t = setInterval(() => setFeatIndex(i => (i + 1) % popularDishes.length), 4000);
    return () => clearInterval(t);
  }, [popularDishes.length]);

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
    } catch (err: unknown) {
      setLoginError(safe((err as { message?: string })?.message, 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pz">

      {/* ── Header ── */}
      <header className="pz__header">
        <div className="pz__logo-wrap">
          <span className="pz__logo-icon">🍕</span>
        </div>
        {points > 0 && <span className="pz__pts-badge">{points.toLocaleString()} pts</span>}
      </header>

      {/* ── Scrollable Content ── */}
      <div className="pz__scroll">

        {/* ── HOME ── */}
        {view === 'home' && (
          <>
            {/* ── Hero: large blob + sliding circular image ── */}
            <div className="pz__hero">
              <div className="pz__blob" />
              <div className="pz__deco pz__deco--1" />
              <div className="pz__deco pz__deco--2" />
              {popularDishes[heroIndex]?.image
                ? <img
                    key={heroIndex}
                    className="pz__hero-img"
                    src={popularDishes[heroIndex].image}
                    alt=""
                    loading="lazy"
                  />
                : <div className="pz__hero-img pz__hero-ph">🍕</div>
              }
              {popularDishes.length > 1 && (
                <div className="pz__slider-dots">
                  {popularDishes.map((_, i) => (
                    <button
                      key={i}
                      className={`pz__slider-dot${i === heroIndex ? ' active' : ''}`}
                      onClick={() => setHeroIndex(i)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* ── Welcome text ── */}
            <div className="pz__welcome">
              <p className="pz__welcome-sub">Welcome to</p>
              <h1 className="pz__welcome-name">{restaurantName}</h1>
            </div>

            {/* ── Points banner ── */}
            {points > 0 && (
              <div className="pz__pts-card">
                <span className="pz__pts-star">⭐</span>
                <div className="pz__pts-text">
                  <p className="pz__pts-title">Earn Points</p>
                  <p className="pz__pts-desc">for Each Order.</p>
                </div>
                <p className="pz__pts-count">{points.toLocaleString()}<span>Pts</span></p>
              </div>
            )}

            {/* ── Popular dishes — horizontal scroll strip ── */}
            {popularDishes.length > 0 && (
              <div className="pz__hstrip">
                {popularDishes.map((dish, i) => (
                  <div key={i} className="pz__strip-card" onClick={handleOrder}>
                    <div className="pz__strip-img-ring">
                      {dish.image
                        ? <img className="pz__strip-img" src={dish.image} alt="" loading="lazy" />
                        : <div className="pz__strip-img pz__strip-ph">🍕</div>
                      }
                    </div>
                    {safe(dish.name) && <p className="pz__strip-name">{safe(dish.name)}</p>}
                    {dish.description && <p className="pz__strip-desc">{dish.description}</p>}
                    <button
                      className="pz__strip-add"
                      onClick={e => { e.stopPropagation(); handleOrder(); }}
                    >+</button>
                  </div>
                ))}
              </div>
            )}

            {/* ── Featured Images — same scale as hero, stacked cards instead of blob ── */}
            {popularDishes.length > 0 && (
              <>
                <p className="pz__section-title">Featured Images</p>
                <div className="pz__feat-section">
                  <div className="pz__feat-stack pz__feat-stack--b" />
                  <div className="pz__feat-stack pz__feat-stack--m" />
                  {popularDishes[featIndex]?.image
                    ? <img
                        key={featIndex}
                        className="pz__feat-hero-img"
                        src={popularDishes[featIndex].image}
                        alt=""
                        loading="lazy"
                        onClick={handleOrder}
                      />
                    : <div className="pz__feat-hero-img pz__feat-hero-ph">🍕</div>
                  }
                </div>
                {popularDishes.length > 1 && (
                  <div className="pz__feat-dots">
                    {popularDishes.map((_, i) => (
                      <button
                        key={i}
                        className={`pz__slider-dot${i === featIndex ? ' active' : ''}`}
                        onClick={() => setFeatIndex(i)}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {/* ── Gallery ── */}
            {banners.length > 0 && (
              <>
                <p className="pz__section-title">Gallery</p>
                <div className="pz__gallery">
                  {banners.slice(0, 8).map((b, i) => (
                    b.image
                      ? <img key={i} className="pz__gallery-img" src={b.image} alt="" loading="lazy" onClick={handleOrder} />
                      : null
                  ))}
                </div>
              </>
            )}

            <div style={{ height: 24 }} />
          </>
        )}

        {/* ── MENU ── */}
        {view === 'menu' && (
          <>
            <p className="pz__view-title">Menu</p>
            {allCategories.length > 0 && (
              <div className="pz__cats">
                <button
                  className={`pz__cat-pill${activeCategory === null ? ' active' : ''}`}
                  onClick={() => setCategory(null)}
                >All</button>
                {allCategories.map(cat => (
                  <button
                    key={cat.id}
                    className={`pz__cat-pill${activeCategory === cat.id ? ' active' : ''}`}
                    onClick={() => setCategory(cat.id)}
                  >{safe(cat.name)}</button>
                ))}
              </div>
            )}
            {filteredItems.length === 0
              ? <p className="pz__empty">{!menuData ? 'Loading…' : 'No items'}</p>
              : (
                <div className="pz__menu-list">
                  {filteredItems.map(item => (
                    <div key={item.id} className="pz__menu-row" onClick={handleOrder}>
                      {item.image
                        ? <img className="pz__menu-row-img" src={item.image} alt="" loading="lazy" />
                        : <div className="pz__menu-row-img pz__menu-row-ph">🍕</div>
                      }
                      <div className="pz__menu-row-info">
                        <p className="pz__menu-row-name">{safe(item.name)}</p>
                        <p className="pz__menu-row-price">${safe(String(item.price))}</p>
                        {item.description && <p className="pz__menu-row-desc">{item.description}</p>}
                      </div>
                      <button
                        className="pz__menu-row-add"
                        onClick={e => { e.stopPropagation(); handleOrder(); }}
                      >+</button>
                    </div>
                  ))}
                </div>
              )
            }
            <div style={{ height: 20 }} />
          </>
        )}

        {/* ── ORDERS ── */}
        {view === 'orders' && (
          <>
            <p className="pz__view-title">My Orders</p>
            {recentOrders.length > 0
              ? recentOrders.map(o => (
                  <div key={o.id} className="pz__order-row">
                    <span className="pz__order-emoji">{safe(o.statusEmoji, '📦')}</span>
                    <div className="pz__order-info">
                      <p className="pz__order-id">{safe(o.id)}</p>
                      <p className="pz__order-date">{safe(o.date)}</p>
                    </div>
                    <div className="pz__order-right">
                      <p className="pz__order-total">${safe(o.total)}</p>
                      <p className="pz__order-status" style={{ color: safe(o.color, '#8FBF9F') }}>
                        {safe(o.status)}
                      </p>
                    </div>
                  </div>
                ))
              : <p className="pz__empty">No orders yet 🌿</p>
            }
            <button className="pz__cta" onClick={handleOrder}>Place New Order</button>
            <div style={{ height: 20 }} />
          </>
        )}

        {/* ── ACCOUNT ── */}
        {view === 'account' && (
          <>
            <p className="pz__view-title">Account</p>
            {authUser ? (
              <div className="pz__profile-card">
                <div className="pz__avatar">
                  {safe(authUser.name?.[0], '?').toUpperCase()}
                </div>
                <p className="pz__profile-name">{safe(authUser.name)}</p>
                <p className="pz__profile-email">{safe(authUser.email)}</p>
                {points > 0 && (
                  <div className="pz__loyalty">
                    <span>⭐</span>
                    <span>{points.toLocaleString()} loyalty points</span>
                  </div>
                )}
                <button className="pz__signout" onClick={() => { clearAuth(); setAuthUser(null); }}>
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="pz__login-card">
                <p className="pz__login-title">Welcome Back</p>
                <p className="pz__login-sub">Sign in to track your orders</p>
                {loginError && <p className="pz__login-error">{loginError}</p>}
                <form onSubmit={handleLogin}>
                  <input
                    className="pz__input"
                    type="email"
                    placeholder="Email address"
                    value={loginEmail}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                  <input
                    className="pz__input"
                    type="password"
                    placeholder="Password"
                    value={loginPassword}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button className="pz__submit" type="submit" disabled={loginLoading}>
                    {loginLoading ? 'Signing in…' : 'Sign In'}
                  </button>
                </form>
              </div>
            )}

            <p className="pz__tmpl-label">Switch Template</p>
            <div className="pz__tmpl-strip">
              {TEMPLATES.map(t => (
                <button
                  key={t.id}
                  className={`pz__tmpl-pill${t.id === template.id ? ' active' : ''}`}
                  style={{
                    background: t.colors.bg,
                    borderColor: t.id === template.id ? t.colors.primary : 'transparent',
                  }}
                  onClick={() => setTemplateId(t.id)}
                >
                  <span className="pz__tmpl-emoji">{t.emoji}</span>
                  <span className="pz__tmpl-name" style={{ color: t.colors.text }}>{t.name}</span>
                </button>
              ))}
            </div>
            <div style={{ height: 20 }} />
          </>
        )}

      </div>

      {/* ── Bottom Nav ── */}
      <nav className="pz__nav">
        {NAV.map(n => (
          <button
            key={n.id}
            className={`pz__nav-btn${view === n.id ? ' active' : ''}`}
            onClick={() => setView(n.id)}
            aria-label={n.label}
          >
            <span className="pz__nav-icon">{n.icon}</span>
            <span className="pz__nav-label">{n.label}</span>
          </button>
        ))}
      </nav>

    </div>
  );
};

export default PiazzaApp;
