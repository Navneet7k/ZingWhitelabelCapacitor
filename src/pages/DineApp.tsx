import React, { useState, useEffect, useRef } from 'react';
import { useTemplate, TEMPLATES } from '../context/TemplateContext';
import { useHomeData } from '../context/HomeDataContext';
import { useMenuData } from '../context/MenuDataContext';
import { getSavedUser, isLoggedIn, login, saveAuth, clearAuth } from '../services/authApi';
import type { AuthUser } from '../services/authApi';
import { getOrderUrl } from '../services/configApi';
import { getRestaurantId, getRestaurantName } from '../services/restaurantConfig';
import { openWebView } from '../services/webviewService';
import CustomizePage from './CustomizePage';
import './DineApp.css';

function safe(v: unknown, fallback = ''): string {
  try { return (v != null && v !== '') ? String(v) : fallback; } catch { return fallback; }
}

function getInitialUser(): AuthUser | null {
  try { return isLoggedIn() ? getSavedUser() : null; } catch { return null; }
}

type DineView = 'home' | 'menu' | 'orders' | 'account';

const NAV: { id: DineView; icon: string; label: string }[] = [
  { id: 'home',    icon: '🏠', label: 'Home'    },
  { id: 'menu',    icon: '🍽️', label: 'Menu'    },
  { id: 'orders',  icon: '🛍️', label: 'Orders'  },
  { id: 'account', icon: '👤', label: 'Account' },
];

const DineApp: React.FC = () => {
  const { template, setTemplateId } = useTemplate();
  const { data: homeData }          = useHomeData();
  const { data: menuData }          = useMenuData();

  const [view, setView]                         = useState<DineView>('home');
  const [heroIndex, setHeroIndex]               = useState(0);
  const [activeGalleryIndex, setGalleryIndex]   = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [showCustomize, setShowCustomize]       = useState(false);
  const [authUser, setAuthUser]                 = useState<AuthUser | null>(getInitialUser);
  const [loginEmail, setEmail]                  = useState('');
  const [loginPassword, setPassword]            = useState('');
  const [loginError, setLoginError]             = useState('');
  const [loginLoading, setLoading]              = useState(false);
  const galleryRef = useRef<HTMLDivElement>(null);

  const restaurantId   = getRestaurantId();
  const restaurantName = safe(getRestaurantName(), 'Our Restaurant');
  const allCategories  = menuData?.categories ?? [];
  const popularDishes  = homeData?.popularDishes ?? [];
  const banners        = homeData?.banners ?? [];
  const galleryBanners = banners.slice(0, 8).filter(b => b.image);
  const recentOrders   = homeData?.recentOrders ?? [];
  const points         = homeData?.points ?? 0;

  const menuItems = selectedCategory !== null
    ? (allCategories.find(c => c.id === selectedCategory)?.items ?? [])
    : [];

  useEffect(() => {
    if (popularDishes.length <= 1) return;
    const t = setInterval(() => setHeroIndex(i => (i + 1) % popularDishes.length), 3500);
    return () => clearInterval(t);
  }, [popularDishes.length]);

  useEffect(() => {
    if (view !== 'menu') setSelectedCategory(null);
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
    } catch (err: unknown) {
      setLoginError(safe((err as { message?: string })?.message, 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleGalleryScroll = () => {
    const el = galleryRef.current;
    if (!el) return;
    const center = el.scrollLeft + el.clientWidth / 2;
    const items = Array.from(el.children) as HTMLElement[];
    let closest = 0, minDist = Infinity;
    items.forEach((item, i) => {
      const dist = Math.abs(item.offsetLeft + item.offsetWidth / 2 - center);
      if (dist < minDist) { minDist = dist; closest = i; }
    });
    setGalleryIndex(closest);
  };

  const scrollGalleryTo = (i: number) => {
    const el = galleryRef.current;
    if (!el) return;
    const items = Array.from(el.children) as HTMLElement[];
    if (items[i]) {
      el.scrollTo({ left: items[i].offsetLeft + items[i].offsetWidth / 2 - el.clientWidth / 2, behavior: 'smooth' });
    }
  };

  return (
    <div className="dn">

      {showCustomize ? (
        <div className="dn__customize-view">
          <CustomizePage onBack={() => setShowCustomize(false)} />
        </div>
      ) : (
        <>
          {/* ── Header ── */}
          <header className="dn__header">
            <div className="dn__logo-circle">🍃</div>
            <span className="dn__header-name">{restaurantName}</span>
            {homeData !== null && (
              <div className="dn__pts-pill">
                <span className="dn__pts-num">{points.toLocaleString()}</span>
                <span className="dn__pts-lbl">Pts</span>
              </div>
            )}
          </header>

          <div className="dn__scroll">

            {/* ── HOME ── */}
            {view === 'home' && (
              <>
                {/* ── Banner ── */}
                <div className="dn__banner">
                  {/* Blob + hero wrapped together so hero is always aligned to blob's visual centroid */}
                  <div className="dn__banner-center">
                    <svg className="dn__blob" viewBox="0 0 349 345" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M272.385 38.9189C294.802 56.1067 366.372 92.571 345.095 131.075C320.658 175.297 365.139 256.033 294.443 261.787C248.364 264.578 225.549 323.305 196.439 338.21C166.802 353.228 108.184 345.164 113.051 295.471C117.825 246.733 -56.3113 195.138 18.8588 157.164C63.3352 134.697 14.9014 109.686 36.1603 72.0065C78.3537 -1.58443 182.405 -29.0653 272.385 38.9189Z" fill="#C2D9BA"/>
                    </svg>
                    <div className="dn__hero-outer" key={heroIndex}>
                      {popularDishes[heroIndex]?.image
                        ? <img className="dn__hero-img" src={popularDishes[heroIndex].image} alt="" loading="lazy" />
                        : <div className="dn__hero-img dn__hero-ph">🍽️</div>
                      }
                    </div>
                  </div>
                  {/* Welcome text */}
                  <div className="dn__welcome">
                    <p className="dn__welcome-sub">Welcome to</p>
                    <h1 className="dn__welcome-name">{restaurantName}</h1>
                  </div>
                  {/* Slide dots */}
                  {popularDishes.length > 1 && (
                    <div className="dn__banner-dots">
                      {popularDishes.map((_, i) => (
                        <button
                          key={i}
                          className={`dn__dot${i === heroIndex ? ' active' : ''}`}
                          onClick={() => setHeroIndex(i)}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* ── Popular Dishes ── */}
                {popularDishes.length > 0 && (
                  <>
                    <p className="dn__section-title">Popular Dishes</p>
                    <div className="dn__dishes-scroll">
                      {popularDishes.map((dish, i) => (
                        <div key={i} className="dn__dish-card" onClick={handleOrder}>
                          <div className="dn__dish-img-ring">
                            {dish.image
                              ? <img className="dn__dish-img" src={dish.image} alt="" loading="lazy" />
                              : <div className="dn__dish-img dn__dish-ph">🍽️</div>
                            }
                          </div>
                          <p className="dn__dish-name">{safe(dish.name) || 'Featured Dish'}</p>
                          {dish.description && (
                            <p className="dn__dish-desc">{dish.description}</p>
                          )}
                          <button
                            className="dn__dish-add"
                            onClick={e => { e.stopPropagation(); handleOrder(); }}
                          >+</button>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* ── Featured Images ── */}
                {popularDishes.length > 0 && (
                  <>
                    <p className="dn__section-title">Featured Images</p>
                    <div className="dn__feat-scroll">
                      {popularDishes.map((dish, i) => (
                        <div key={i} className="dn__feat-outer" onClick={handleOrder}>
                          {dish.image
                            ? <img className="dn__feat-img" src={dish.image} alt="" loading="lazy" />
                            : <div className="dn__feat-img dn__feat-ph">🍽️</div>
                          }
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* ── Gallery — snap carousel ── */}
                {galleryBanners.length > 0 && (
                  <>
                    <p className="dn__section-title">Gallery</p>
                    <div className="dn__gallery" ref={galleryRef} onScroll={handleGalleryScroll}>
                      {galleryBanners.map((b, i) => (
                        <img
                          key={i}
                          className={`dn__gallery-img${i === activeGalleryIndex ? ' active' : ''}`}
                          src={b.image!}
                          alt=""
                          loading="lazy"
                          onClick={handleOrder}
                        />
                      ))}
                    </div>
                    {galleryBanners.length > 1 && (
                      <div className="dn__dots-row">
                        {galleryBanners.map((_, i) => (
                          <button
                            key={i}
                            className={`dn__dot${i === activeGalleryIndex ? ' active' : ''}`}
                            onClick={() => scrollGalleryTo(i)}
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}

                <div style={{ height: 24 }} />
              </>
            )}

            {/* ── MENU ── */}
            {view === 'menu' && (
              <>
                {selectedCategory !== null ? (
                  /* Item list */
                  <>
                    <div className="dn__menu-header">
                      <button className="dn__back-btn" onClick={() => setSelectedCategory(null)}>‹</button>
                      <p className="dn__view-title" style={{ margin: 0 }}>
                        {safe(allCategories.find(c => c.id === selectedCategory)?.name)}
                      </p>
                    </div>
                    {menuItems.length === 0
                      ? <p className="dn__empty">No items</p>
                      : (
                        <div className="dn__item-list">
                          {menuItems.map((item, i) => (
                            <div key={item.id} className="dn__item-row" onClick={handleOrder}>
                              <div className="dn__item-top">
                                {item.image
                                  ? <img className="dn__item-img" src={item.image} alt="" loading="lazy" />
                                  : <div className="dn__item-img dn__item-ph">🍽️</div>
                                }
                                <div className="dn__item-info">
                                  <p className="dn__item-name">{safe(item.name)}</p>
                                  <p className="dn__item-price">${safe(String(item.price))}</p>
                                </div>
                                <button
                                  className="dn__item-add"
                                  onClick={e => { e.stopPropagation(); handleOrder(); }}
                                >+</button>
                              </div>
                              {item.description && (
                                <div className={`dn__item-strip dn__item-strip--${i % 2 === 0 ? 'green' : 'peach'}`}>
                                  <p className="dn__item-desc">{item.description}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )
                    }
                  </>
                ) : (
                  /* Category grid */
                  <>
                    <p className="dn__view-title">Menu</p>
                    {allCategories.length === 0
                      ? <p className="dn__empty">{!menuData ? 'Loading…' : 'No categories'}</p>
                      : (
                        <div className="dn__cat-grid">
                          {allCategories.map(cat => {
                            const preview = cat.items?.[0]?.image;
                            return (
                              <div key={cat.id} className="dn__cat-tile" onClick={() => setSelectedCategory(cat.id)}>
                                {preview
                                  ? <img className="dn__cat-img" src={preview} alt="" loading="lazy" />
                                  : <div className="dn__cat-img dn__cat-ph">🍽️</div>
                                }
                                <div className="dn__cat-overlay">
                                  <p className="dn__cat-name">{safe(cat.name)}</p>
                                  <p className="dn__cat-count">{cat.items?.length ?? 0} items</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )
                    }
                  </>
                )}
                <div style={{ height: 20 }} />
              </>
            )}

            {/* ── ORDERS ── */}
            {view === 'orders' && (
              <>
                <p className="dn__view-title">My Orders</p>
                {recentOrders.length > 0
                  ? recentOrders.map(o => (
                      <div key={o.id} className="dn__order-row">
                        <span className="dn__order-emoji">{safe(o.statusEmoji, '📦')}</span>
                        <div className="dn__order-info">
                          <p className="dn__order-id">{safe(o.id)}</p>
                          <p className="dn__order-date">{safe(o.date)}</p>
                        </div>
                        <div className="dn__order-right">
                          <p className="dn__order-total">${safe(o.total)}</p>
                          <p className="dn__order-status" style={{ color: safe(o.color, '#84BD93') }}>
                            {safe(o.status)}
                          </p>
                        </div>
                      </div>
                    ))
                  : <p className="dn__empty">No orders yet</p>
                }
                <button className="dn__cta" onClick={handleOrder}>Place New Order</button>
                <div style={{ height: 20 }} />
              </>
            )}

            {/* ── ACCOUNT ── */}
            {view === 'account' && (
              <>
                <p className="dn__view-title">Account</p>
                {authUser ? (
                  <div className="dn__profile-card">
                    <div className="dn__avatar">
                      {safe(authUser.name?.[0], '?').toUpperCase()}
                    </div>
                    <p className="dn__profile-name">{safe(authUser.name)}</p>
                    <p className="dn__profile-email">{safe(authUser.email)}</p>
                    {points > 0 && (
                      <div className="dn__loyalty">
                        <span>⭐</span>
                        <span>{points.toLocaleString()} loyalty points</span>
                      </div>
                    )}
                    <button className="dn__signout" onClick={() => { clearAuth(); setAuthUser(null); }}>
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="dn__login-card">
                    <p className="dn__login-title">Welcome Back</p>
                    <p className="dn__login-sub">Sign in to track your orders</p>
                    {loginError && <p className="dn__login-error">{loginError}</p>}
                    <form onSubmit={handleLogin}>
                      <input
                        className="dn__input"
                        type="email"
                        placeholder="Email address"
                        value={loginEmail}
                        onChange={e => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                      />
                      <input
                        className="dn__input"
                        type="password"
                        placeholder="Password"
                        value={loginPassword}
                        onChange={e => setPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                      />
                      <button className="dn__submit" type="submit" disabled={loginLoading}>
                        {loginLoading ? 'Signing in…' : 'Sign In'}
                      </button>
                    </form>
                  </div>
                )}

                {/* ── Customize ── */}
                <button className="dn__customize-btn" onClick={() => setShowCustomize(true)}>
                  🎨 Customize
                </button>

                {/* ── Template Switcher ── */}
                <p className="dn__tmpl-label">Switch Template</p>
                <div className="dn__tmpl-strip">
                  {TEMPLATES.map(t => (
                    <button
                      key={t.id}
                      className={`dn__tmpl-pill${t.id === template.id ? ' active' : ''}`}
                      style={{
                        background: t.colors.bg,
                        borderColor: t.id === template.id ? t.colors.primary : 'transparent',
                      }}
                      onClick={() => setTemplateId(t.id)}
                    >
                      <span className="dn__tmpl-emoji">{t.emoji}</span>
                      <span className="dn__tmpl-name" style={{ color: t.colors.text }}>{t.name}</span>
                    </button>
                  ))}
                </div>
                <div style={{ height: 20 }} />
              </>
            )}

          </div>

          {/* ── Bottom Nav ── */}
          <nav className="dn__nav">
            {NAV.map(n => (
              <button
                key={n.id}
                className={`dn__nav-btn${view === n.id ? ' active' : ''}`}
                onClick={() => setView(n.id)}
                aria-label={n.label}
              >
                <span className="dn__nav-icon">{n.icon}</span>
                <span className="dn__nav-label">{n.label}</span>
              </button>
            ))}
          </nav>
        </>
      )}

    </div>
  );
};

export default DineApp;
