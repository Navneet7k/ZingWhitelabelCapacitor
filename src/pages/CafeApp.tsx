import React, { useState, useRef } from 'react';
import { useTemplate, TEMPLATES } from '../context/TemplateContext';
import { useHomeData } from '../context/HomeDataContext';
import { useMenuData } from '../context/MenuDataContext';
import { getSavedUser, isLoggedIn, login, saveAuth, clearAuth } from '../services/authApi';
import type { AuthUser } from '../services/authApi';
import { getOrderUrl } from '../services/configApi';
import { getRestaurantId, getRestaurantName } from '../services/restaurantConfig';
import { openWebView } from '../services/webviewService';
import './CafeApp.css';

function getInitialUser(): AuthUser | null {
  if (!isLoggedIn()) return null;
  return getSavedUser();
}

function timeGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning ☀️';
  if (h < 17) return 'Good Afternoon ☁️';
  if (h < 21) return 'Good Evening 🌙';
  return 'Good Night ✨';
}

const CafeApp: React.FC = () => {
  const { template, setTemplateId } = useTemplate();
  const { data: homeData } = useHomeData();
  const { data: menuData } = useMenuData();

  const [drawerOpen, setDrawerOpen]           = useState(false);
  const [activeSheet, setActiveSheet]         = useState<'orders' | 'account' | null>(null);
  const [activeCategory, setActiveCategory]   = useState<number | null>(null);
  const [authUser, setAuthUser]               = useState<AuthUser | null>(getInitialUser);
  const [loginEmail, setLoginEmail]           = useState('');
  const [loginPassword, setLoginPassword]     = useState('');
  const [loginError, setLoginError]           = useState('');
  const [loginLoading, setLoginLoading]       = useState(false);

  const menuRef = useRef<HTMLElement>(null);

  const restaurantId   = getRestaurantId();
  const restaurantName = getRestaurantName();
  const greeting       = timeGreeting();

  const featured       = homeData?.popularDishes[0];
  const heroImage      = featured?.image || homeData?.banners[0]?.image;
  const allCategories  = menuData?.categories ?? [];
  const filteredItems  = activeCategory
    ? (allCategories.find(c => c.id === activeCategory)?.items ?? [])
    : allCategories.flatMap(c => c.items);

  const handleOrder = async () => {
    if (!authUser) {
      setActiveSheet('account');
      return;
    }
    const url = getOrderUrl();
    if (!url) return;
    await openWebView(url, 'Place Order', template.colors.primary);
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
      setLoginError(err.message || 'Login failed');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSignOut = () => {
    clearAuth();
    setAuthUser(null);
    setActiveSheet(null);
  };

  const scrollToMenu = () => {
    setTimeout(() => menuRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
  };

  return (
    <div className="cafe">

      {/* ── Top bar ────────────────────────────────── */}
      <header className="cafe__topbar">
        <div className="cafe__topbar-brand">
          <span className="cafe__topbar-icon">☕</span>
          <span className="cafe__topbar-name">{restaurantName || 'Café'}</span>
        </div>
        <button
          className="cafe__topbar-hamburger"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open menu"
        >
          <span /><span /><span />
        </button>
      </header>

      {/* ── Hero ───────────────────────────────────── */}
      <section
        className="cafe__hero"
        style={heroImage ? { backgroundImage: `url(${heroImage})` } : {}}
      >
        <div className="cafe__hero-gradient">
          <p className="cafe__greeting">{greeting}</p>
          <h1 className="cafe__hero-title">{restaurantName || 'Welcome'}</h1>
          <p className="cafe__hero-sub">What are you having today?</p>
          <div className="cafe__hero-actions">
            <button className="cafe__hero-cta" onClick={handleOrder}>
              Order Now <span>→</span>
            </button>
            <button className="cafe__hero-cta cafe__hero-cta--ghost" onClick={scrollToMenu}>
              View Menu
            </button>
          </div>
        </div>
      </section>

      {/* ── Today's Special ───────────────────────── */}
      {featured && (
        <section className="cafe__special-section">
          <div className="cafe__section-header">
            <span className="cafe__section-tag">⭐ Today's Special</span>
          </div>
          <div className="cafe__special-card" onClick={handleOrder}>
            {featured.image && (
              <img
                className="cafe__special-img"
                src={featured.image}
                alt={featured.name}
              />
            )}
            <div className="cafe__special-body">
              <span className="cafe__special-badge">{featured.tag}</span>
              <h3 className="cafe__special-name">{featured.name}</h3>
              {featured.description && (
                <p className="cafe__special-desc">{featured.description}</p>
              )}
              <span className="cafe__special-cta">Order Now →</span>
            </div>
          </div>
        </section>
      )}

      {/* ── Banner thumbnails ─────────────────────── */}
      {(homeData?.banners?.length ?? 0) > 1 && (
        <section className="cafe__banners-section">
          <div className="cafe__banners-strip">
            {homeData!.banners.slice(0, 5).map(b => (
              <div
                key={b.id}
                className="cafe__banner-thumb"
                style={{ backgroundImage: `url(${b.image})` }}
                onClick={handleOrder}
              >
                <div className="cafe__banner-thumb-overlay">
                  <p className="cafe__banner-thumb-title">{b.title}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Category pills ────────────────────────── */}
      {allCategories.length > 0 && (
        <section className="cafe__cats-section">
          <div className="cafe__cats-scroll">
            <button
              className={`cafe__cat-pill${activeCategory === null ? ' active' : ''}`}
              onClick={() => setActiveCategory(null)}
            >All</button>
            {allCategories.map(cat => (
              <button
                key={cat.id}
                className={`cafe__cat-pill${activeCategory === cat.id ? ' active' : ''}`}
                onClick={() => setActiveCategory(cat.id)}
              >{cat.name}</button>
            ))}
          </div>
        </section>
      )}

      {/* ── Menu grid ─────────────────────────────── */}
      <section className="cafe__menu-section" ref={menuRef}>
        <div className="cafe__section-header">
          <h2 className="cafe__section-title">
            {activeCategory
              ? allCategories.find(c => c.id === activeCategory)?.name ?? 'Menu'
              : 'Our Menu'}
          </h2>
        </div>
        {filteredItems.length === 0 ? (
          <p className="cafe__loading">
            {!menuData ? 'Loading…' : 'No items in this category'}
          </p>
        ) : (
          <div className="cafe__menu-grid">
            {filteredItems.map(item => (
              <div key={item.id} className="cafe__menu-card" onClick={handleOrder}>
                <div className="cafe__menu-img-wrap">
                  {item.image
                    ? <img className="cafe__menu-img" src={item.image} alt={item.name} loading="lazy" />
                    : <div className="cafe__menu-img-placeholder">☕</div>
                  }
                </div>
                <div className="cafe__menu-info">
                  <p className="cafe__menu-name">{item.name}</p>
                  {item.description && (
                    <p className="cafe__menu-desc">{item.description}</p>
                  )}
                  <div className="cafe__menu-footer">
                    <span className="cafe__menu-price">₹{item.price}</span>
                    <button
                      className="cafe__menu-add"
                      onClick={e => { e.stopPropagation(); handleOrder(); }}
                      aria-label={`Add ${item.name}`}
                    >+</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="cafe__bottom-pad" />

      {/* ── Floating order pill ───────────────────── */}
      <button className="cafe__float-pill" onClick={handleOrder}>
        <span className="cafe__float-icon">🛍️</span>
        <span className="cafe__float-label">Place Order</span>
        <span className="cafe__float-arrow">→</span>
      </button>

      {/* ── Side Drawer ───────────────────────────── */}
      {drawerOpen && (
        <div className="cafe__drawer-overlay" onClick={() => setDrawerOpen(false)}>
          <div className="cafe__drawer" onClick={e => e.stopPropagation()}>

            <div className="cafe__drawer-profile">
              <div className="cafe__drawer-avatar">
                {authUser ? (authUser.name?.[0]?.toUpperCase() ?? '☕') : '☕'}
              </div>
              <div className="cafe__drawer-profile-text">
                <p className="cafe__drawer-username">
                  {authUser ? authUser.name : 'Hello, Guest'}
                </p>
                <p
                  className="cafe__drawer-useremail"
                  style={!authUser ? { cursor: 'pointer' } : {}}
                  onClick={!authUser ? () => { setDrawerOpen(false); setActiveSheet('account'); } : undefined}
                >
                  {authUser ? authUser.email : 'Sign in →'}
                </p>
              </div>
            </div>

            <div className="cafe__drawer-divider" />

            <nav className="cafe__drawer-nav">
              <button className="cafe__drawer-item" onClick={() => {
                setDrawerOpen(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}>
                <span className="cafe__drawer-item-icon">🏠</span>
                <span className="cafe__drawer-item-label">Home</span>
              </button>
              <button className="cafe__drawer-item" onClick={() => {
                setDrawerOpen(false);
                scrollToMenu();
              }}>
                <span className="cafe__drawer-item-icon">📋</span>
                <span className="cafe__drawer-item-label">Menu</span>
              </button>
              <button className="cafe__drawer-item" onClick={() => {
                setDrawerOpen(false);
                handleOrder();
              }}>
                <span className="cafe__drawer-item-icon">🛍️</span>
                <span className="cafe__drawer-item-label">Place Order</span>
              </button>
              <button className="cafe__drawer-item" onClick={() => {
                setDrawerOpen(false);
                setActiveSheet('orders');
              }}>
                <span className="cafe__drawer-item-icon">📦</span>
                <span className="cafe__drawer-item-label">My Orders</span>
              </button>
              <button className="cafe__drawer-item" onClick={() => {
                setDrawerOpen(false);
                setActiveSheet('account');
              }}>
                <span className="cafe__drawer-item-icon">👤</span>
                <span className="cafe__drawer-item-label">Account</span>
              </button>
            </nav>

            <p className="cafe__drawer-footer">Powered by Zing ✦</p>
          </div>
        </div>
      )}

      {/* ── Orders Sheet ──────────────────────────── */}
      {activeSheet === 'orders' && (
        <div className="cafe__sheet-overlay" onClick={() => setActiveSheet(null)}>
          <div className="cafe__sheet" onClick={e => e.stopPropagation()}>
            <div className="cafe__sheet-handle" />
            <h3 className="cafe__sheet-title">My Orders</h3>
            {(homeData?.recentOrders?.length ?? 0) > 0 ? (
              <div className="cafe__sheet-orders">
                {homeData!.recentOrders.slice(0, 5).map(order => (
                  <div key={order.id} className="cafe__sheet-order-row">
                    <span className="cafe__sheet-order-emoji">{order.statusEmoji}</span>
                    <div className="cafe__sheet-order-detail">
                      <p className="cafe__sheet-order-id">{order.id}</p>
                      <p className="cafe__sheet-order-date">{order.date}</p>
                    </div>
                    <div className="cafe__sheet-order-right">
                      <p className="cafe__sheet-order-total">₹{order.total}</p>
                      <p className="cafe__sheet-order-status" style={{ color: order.color }}>
                        {order.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="cafe__sheet-empty">No orders yet. Time to brew something! ☕</p>
            )}
            <button className="cafe__sheet-cta" onClick={() => { setActiveSheet(null); handleOrder(); }}>
              Place New Order
            </button>
          </div>
        </div>
      )}

      {/* ── Account Sheet ─────────────────────────── */}
      {activeSheet === 'account' && (
        <div className="cafe__sheet-overlay" onClick={() => setActiveSheet(null)}>
          <div className="cafe__sheet" onClick={e => e.stopPropagation()}>
            <div className="cafe__sheet-handle" />
            {authUser ? (
              <div className="cafe__sheet-profile-view">
                <div className="cafe__sheet-big-avatar">
                  {authUser.name?.[0]?.toUpperCase() ?? '?'}
                </div>
                <h3 className="cafe__sheet-profile-name">{authUser.name}</h3>
                <p className="cafe__sheet-profile-email">{authUser.email}</p>
                {(homeData?.points ?? 0) > 0 && (
                  <div className="cafe__sheet-loyalty">
                    <span>✨</span>
                    <span>{homeData!.points} loyalty points</span>
                  </div>
                )}
                <button className="cafe__sheet-signout-btn" onClick={handleSignOut}>
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="cafe__sheet-login-view">
                <h3 className="cafe__sheet-title">Welcome Back</h3>
                <p className="cafe__sheet-login-sub">Sign in to track orders &amp; earn rewards</p>
                {loginError && <p className="cafe__sheet-error">{loginError}</p>}
                <form onSubmit={handleLogin} className="cafe__sheet-form">
                  <input
                    className="cafe__sheet-input"
                    type="email"
                    placeholder="Email address"
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                  <input
                    className="cafe__sheet-input"
                    type="password"
                    placeholder="Password"
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button className="cafe__sheet-cta" type="submit" disabled={loginLoading}>
                    {loginLoading ? 'Signing in…' : 'Sign In'}
                  </button>
                </form>
              </div>
            )}

            {/* ── Template switcher ── */}
            <div className="cafe__sheet-divider" />
            <p className="cafe__sheet-section-label">Switch Template</p>
            <div className="cafe__template-strip">
              {TEMPLATES.map(t => (
                <button
                  key={t.id}
                  className={`cafe__template-pill${t.id === template.id ? ' active' : ''}`}
                  style={{
                    background: t.colors.bg,
                    borderColor: t.id === template.id ? t.colors.primary : 'transparent',
                  }}
                  onClick={() => setTemplateId(t.id)}
                >
                  <span className="cafe__template-pill-emoji">{t.emoji}</span>
                  <span className="cafe__template-pill-name" style={{ color: t.colors.text }}>{t.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CafeApp;
