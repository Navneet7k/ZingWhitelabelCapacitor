import React, { useState, useEffect, useRef } from 'react';
import { useTemplate, TEMPLATES } from '../context/TemplateContext';
import { useHomeData } from '../context/HomeDataContext';
import { useMenuData } from '../context/MenuDataContext';
import { getSavedUser, isLoggedIn, login, register, saveAuth, clearAuth, getToken } from '../services/authApi';
import type { AuthUser } from '../services/authApi';
import { getOrderUrl, getRestaurantLocations, getRestaurantAddress, getRestaurantPhone } from '../services/configApi';
import type { RestaurantLocation } from '../services/configApi';
import { getRestaurantId, getRestaurantName } from '../services/restaurantConfig';
import { openWebView } from '../services/webviewService';
import { getSavedFcmToken } from '../services/fcmService';
import { checkConfigColorsOnTabSwitch } from '../services/configColorsService';
import { getStatus, onStatusChange } from '../services/updater';
import type { UpdateStatus } from '../services/updater';
import CustomizePage from './CustomizePage';
import './DineApp.css';
import { ICON_MY_ORDERS, ICON_FAVOURITES, ICON_POINTS, ICON_ADDRESS, ICON_DELETE, ICON_EDIT_PROFILE, ICON_SIGNOUT } from './DineAppIcons';

function updateStatusLabel(s: UpdateStatus): { text: string; color: string } {
  switch (s.state) {
    case 'idle':        return { text: 'Idle', color: '#888' };
    case 'checking':    return { text: 'Checking for updates…', color: '#F5A623' };
    case 'up_to_date':  return { text: `Up to date (${s.version})`, color: '#4CAF50' };
    case 'downloading': return { text: `Downloading update ${s.from} → ${s.to}…`, color: '#2196F3' };
    case 'ready':       return { text: `Update ready (v${s.version}) — will apply when app backgrounds`, color: '#9C27B0' };
    case 'error':       return { text: `Update error: ${s.reason}`, color: '#F44336' };
  }
}

function safe(v: unknown, fallback = ''): string {
  try { return (v != null && v !== '') ? String(v) : fallback; } catch { return fallback; }
}

function getInitialUser(): AuthUser | null {
  try { return isLoggedIn() ? getSavedUser() : null; } catch { return null; }
}

type DineView = 'home' | 'menu' | 'orders' | 'account' | 'location';

const HOME_ICON = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
  </svg>
);
const MENU_ICON = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <rect x="3" y="3" width="8" height="8" rx="1.5"/>
    <rect x="13" y="3" width="8" height="8" rx="1.5"/>
    <rect x="3" y="13" width="8" height="8" rx="1.5"/>
    <rect x="13" y="13" width="8" height="8" rx="1.5"/>
  </svg>
);

const NAV: { id: DineView; icon: React.ReactNode; label: string }[] = [
  { id: 'home', icon: HOME_ICON, label: 'Home' },
  { id: 'menu', icon: MENU_ICON, label: 'Menu' },
];

const DineApp: React.FC = () => {
  const { template, setTemplateId } = useTemplate();
  const { data: homeData }          = useHomeData();
  const { data: menuData }          = useMenuData();

  const [view, setView]                         = useState<DineView>('home');
  const [heroIndex, setHeroIndex]               = useState(0);
  const [orderTab, setOrderTab]                 = useState<'current' | 'past' | 'favorite'>('current');
  const [featuredIndex, setFeaturedIndex]       = useState(0);
  const [activeGalleryIndex, setGalleryIndex]   = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [showCustomize, setShowCustomize]       = useState(false);
  const [showDevOptions, setShowDevOptions] = useState(false);
  const [copiedFcm, setCopiedFcm]           = useState(false);
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>(getStatus);
  useEffect(() => onStatusChange(setUpdateStatus), []);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [authUser, setAuthUser]                 = useState<AuthUser | null>(getInitialUser);
  const [authScreen, setAuthScreen]             = useState<'signin' | 'signup'>('signin');
  const [loginEmail, setEmail]                  = useState('');
  const [loginPassword, setPassword]            = useState('');
  const [showLoginPass, setShowLoginPass]       = useState(false);
  const [loginError, setLoginError]             = useState('');
  const [loginLoading, setLoading]              = useState(false);
  const [regName, setRegName]                   = useState('');
  const [regEmail, setRegEmail]                 = useState('');
  const [regMobile, setRegMobile]               = useState('');
  const [regPassword, setRegPassword]           = useState('');
  const [regConfirm, setRegConfirm]             = useState('');
  const [showRegPass, setShowRegPass]           = useState(false);
  const [showRegConf, setShowRegConf]           = useState(false);
  const [regError, setRegError]                 = useState('');
  const [regSuccess, setRegSuccess]             = useState(false);
  const [regLoading, setRegLoading]             = useState(false);

  useEffect(() => {
    const handler = () => { setAuthUser(null); setView('account'); };
    window.addEventListener('zing:force-logout', handler);
    return () => window.removeEventListener('zing:force-logout', handler);
  }, []);
  const galleryRef  = useRef<HTMLDivElement>(null);
  const featTouchX  = useRef(0);

  const restaurantId      = getRestaurantId();
  const restaurantName    = safe(getRestaurantName(), 'Our Restaurant');
  const restaurantAddress = getRestaurantAddress();
  const restaurantPhone   = getRestaurantPhone();
  const locations         = getRestaurantLocations();
  const allCategories  = menuData?.categories ?? [];
  const popularDishes  = homeData?.popularDishes ?? [];
  const banners        = homeData?.banners ?? [];
  const galleryBanners = banners.slice(0, 8).filter(b => b.image);
  const recentOrders   = homeData?.recentOrders ?? [];
  const currentOrders  = homeData?.currentOrders  ?? [];
  const pastOrders     = homeData?.pastOrders      ?? [];
  const favoriteOrders = homeData?.favoriteOrders  ?? [];
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
    if (popularDishes.length <= 1) return;
    const t = setInterval(() => setFeaturedIndex(i => (i + 1) % popularDishes.length), 3500);
    return () => clearInterval(t);
  }, [popularDishes.length]);

  useEffect(() => {
    if (view !== 'menu') setSelectedCategory(null);
  }, [view]);

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

  const EMAIL_RE  = /^[\w.-]+@([\w-]+\.)+[\w-]{2,4}$/;
  const MOBILE_RE = /^\+?\d{7,15}$/;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim())                       { setRegError('Please enter your name'); return; }
    if (!EMAIL_RE.test(regEmail.trim()))       { setRegError('Please enter a valid email'); return; }
    if (!MOBILE_RE.test(regMobile.trim()))     { setRegError('Please enter a valid mobile number'); return; }
    if (regPassword.length < 6)               { setRegError('Password must be at least 6 characters'); return; }
    if (regPassword !== regConfirm)           { setRegError('Passwords do not match'); return; }
    if (!restaurantId) return;
    setRegLoading(true);
    setRegError('');
    try {
      await register({ name: regName.trim(), email: regEmail.trim(), mobile: regMobile.trim(), password: regPassword, passwordConfirmation: regConfirm, restaurantId });
      setRegSuccess(true);
      setTimeout(() => {
        setRegSuccess(false);
        setRegName(''); setRegEmail(''); setRegMobile(''); setRegPassword(''); setRegConfirm('');
        setAuthScreen('signin');
      }, 1500);
    } catch (err: unknown) {
      setRegError(safe((err as { message?: string })?.message, 'Registration failed'));
    } finally {
      setRegLoading(false);
    }
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

  function clientUrl(path: string) {
    const rid   = getRestaurantId() ?? '';
    const token = getToken() ?? '';
    return `https://app.zingmyorder.com/client/app/${path}/${rid}?token=${encodeURIComponent(token)}`;
  }

  function handleDeleteConfirmed() {
    setShowDeleteConfirm(false);
    const rid   = getRestaurantId() ?? '';
    const token = getToken() ?? '';
    openWebView(`https://app.zingmyorder.com/app/delete-user/${rid}?token=${encodeURIComponent(token)}`, 'Delete Account', template.colors.primary);
  }

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
            <button className="dn__pts-pill" onClick={() => setView('account')}>
              <span className="dn__pts-num">{points.toLocaleString()}</span>
              <span className="dn__pts-lbl">Pts</span>
            </button>
          </header>

          <div className="dn__scroll">

            {/* ── HOME ── */}
            {view === 'home' && (
              <>
                {/* ── Banner ── */}
                <div className="dn__banner">
                  {/* Welcome text — sits above the blob in flex-column flow */}
                  <div className="dn__welcome">
                    <p className="dn__welcome-sub">Welcome to</p>
                    <h1 className="dn__welcome-name">{restaurantName}</h1>
                  </div>
                  {/* Blob + hero below the text */}
                  <div className="dn__banner-center">
                    <svg className="dn__blob" viewBox="0 0 349 345" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M272.385 38.9189C294.802 56.1067 366.372 92.571 345.095 131.075C320.658 175.297 365.139 256.033 294.443 261.787C248.364 264.578 225.549 323.305 196.439 338.21C166.802 353.228 108.184 345.164 113.051 295.471C117.825 246.733 -56.3113 195.138 18.8588 157.164C63.3352 134.697 14.9014 109.686 36.1603 72.0065C78.3537 -1.58443 182.405 -29.0653 272.385 38.9189Z" style={{ fill: 'var(--t-primary)' }} fillOpacity="0.4"/>
                    </svg>
                    <div className="dn__hero-outer" key={heroIndex}>
                      {popularDishes[heroIndex]?.image
                        ? <img className="dn__hero-img" src={popularDishes[heroIndex].image} alt="" loading="lazy" />
                        : <div className="dn__hero-img dn__hero-ph">🍽️</div>
                      }
                    </div>
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

                {/* ── My Orders ── */}
                {(currentOrders.length > 0 || pastOrders.length > 0 || favoriteOrders.length > 0) && (
                  <div className="dn__ord-section">
                    <div className="dn__ord-header">
                      <p className="dn__section-title dn__section-title--flush">My Orders</p>
                      <button className="dn__ord-view-all" onClick={() => setView('orders')}>View all</button>
                    </div>
                    <div className="dn__ord-tabs">
                      {(['current', 'past', 'favorite'] as const).map(tab => (
                        <button
                          key={tab}
                          className={`dn__ord-tab${orderTab === tab ? ' active' : ''}`}
                          onClick={() => setOrderTab(tab)}
                        >
                          {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                      ))}
                    </div>
                    {(() => {
                      const list = orderTab === 'current' ? currentOrders : orderTab === 'past' ? pastOrders : favoriteOrders;
                      const o = list[0];
                      if (!o) return (
                        <div className="dn__ord-empty">No {orderTab} orders</div>
                      );
                      return (
                        <div className="dn__ord-card">
                          {o.image
                            ? <img className="dn__ord-img" src={o.image} alt="" loading="lazy" />
                            : <div className="dn__ord-img-ph"><span>Order Image</span></div>
                          }
                          <div className="dn__ord-info">
                            <p className="dn__ord-date">{safe(o.date)}</p>
                            <p className="dn__ord-id">Order #{safe(String(o.id)).replace('ORD-', '')}</p>
                            <p className="dn__ord-items">{o.items?.length ?? 0} Items</p>
                            <p className="dn__ord-price">$ {Number(o.total).toFixed(2)}</p>
                          </div>
                          <button
                            className="dn__ord-status-btn"
                            onClick={() => setView('orders')}
                          >
                            Order Status | 🕐
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                )}

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

                {/* ── Featured Images — stacked card slider ── */}
                {popularDishes.length > 0 && (
                  <>
                    <p className="dn__section-title">Featured Images</p>
                    <div
                      className="dn__feat-slider"
                      onTouchStart={e => { featTouchX.current = e.touches[0].clientX; }}
                      onTouchEnd={e => {
                        const dx = featTouchX.current - e.changedTouches[0].clientX;
                        if (Math.abs(dx) > 40) {
                          if (dx > 0) setFeaturedIndex(i => (i + 1) % popularDishes.length);
                          else        setFeaturedIndex(i => (i - 1 + popularDishes.length) % popularDishes.length);
                        }
                      }}
                    >
                      <div className="dn__feat-stack">
                        <div className="dn__feat-bg-card dn__feat-bg-card--1" />
                        <div className="dn__feat-bg-card dn__feat-bg-card--2" />
                        <div className="dn__feat-bg-card dn__feat-bg-card--3" />
                        <div className="dn__feat-circle" onClick={handleOrder}>
                          {popularDishes[featuredIndex]?.image
                            ? <img className="dn__feat-img" src={popularDishes[featuredIndex].image} alt="" loading="lazy" />
                            : <div className="dn__feat-img dn__feat-ph">🍽️</div>
                          }
                        </div>
                      </div>
                      {popularDishes.length > 1 && (
                        <div className="dn__dots-row">
                          {popularDishes.map((_, i) => (
                            <button
                              key={i}
                              className={`dn__dot${i === featuredIndex ? ' active' : ''}`}
                              onClick={() => setFeaturedIndex(i)}
                            />
                          ))}
                        </div>
                      )}
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
                {/* Avatar + Name */}
                <div className="dn__acc-hero">
                  <div className="dn__acc-avatar">
                    {authUser ? safe(authUser.name?.[0], '?').toUpperCase() : '?'}
                  </div>
                  <p className="dn__acc-welcome">Welcome</p>
                  <h2 className="dn__acc-name">{authUser ? safe(authUser.name, 'Guest') : 'Guest'}</h2>
                  <p className="dn__acc-email">{authUser ? safe(authUser.email) : ''}</p>
                </div>

                {authUser && (
                  <>
                    {/* Icon grid */}
                    <div className="dn__acc-grid">
                      <button className="dn__acc-tile" onClick={() => setView('orders')}>
                        <span className="dn__acc-tile-icon" dangerouslySetInnerHTML={{ __html: ICON_MY_ORDERS }} />
                        <span className="dn__acc-tile-label">My Orders</span>
                      </button>
                      <button className="dn__acc-tile" onClick={() => openWebView(clientUrl('favorites'), 'Favourites', template.colors.primary)}>
                        <span className="dn__acc-tile-icon" dangerouslySetInnerHTML={{ __html: ICON_FAVOURITES }} />
                        <span className="dn__acc-tile-label">Favourites</span>
                      </button>
                      <button className="dn__acc-tile" onClick={() => openWebView(clientUrl('points'), 'Points', template.colors.primary)}>
                        <span className="dn__acc-tile-icon" dangerouslySetInnerHTML={{ __html: ICON_POINTS }} />
                        <span className="dn__acc-tile-label">Points</span>
                      </button>
                      <button className="dn__acc-tile" onClick={() => openWebView(clientUrl('address'), 'Saved Addresses', template.colors.primary)}>
                        <span className="dn__acc-tile-icon" dangerouslySetInnerHTML={{ __html: ICON_ADDRESS }} />
                        <span className="dn__acc-tile-label">Address</span>
                      </button>
                      <button className="dn__acc-tile" onClick={() => openWebView(clientUrl('edit-profile'), 'Edit Profile', template.colors.primary)}>
                        <span className="dn__acc-tile-icon" dangerouslySetInnerHTML={{ __html: ICON_EDIT_PROFILE }} />
                        <span className="dn__acc-tile-label">Edit Profile</span>
                      </button>
                      <button className="dn__acc-tile" onClick={() => setView('location')}>
                        <span className="dn__acc-tile-icon">
                          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#84BD93"/>
                          </svg>
                        </span>
                        <span className="dn__acc-tile-label">Location</span>
                      </button>
                      <button className="dn__acc-tile" onClick={() => setShowDeleteConfirm(true)}>
                        <span className="dn__acc-tile-icon" dangerouslySetInnerHTML={{ __html: ICON_DELETE }} />
                        <span className="dn__acc-tile-label">Delete</span>
                      </button>
                    </div>

                    {/* Footer */}
                    <div className="dn__acc-footer">
                      <button className="dn__acc-signout-btn" onClick={() => { clearAuth(); setAuthUser(null); }}>
                        <span dangerouslySetInnerHTML={{ __html: ICON_SIGNOUT }} />
                      </button>
                      <button className="dn__acc-order-btn" onClick={handleOrder}>
                        Order Now
                      </button>
                    </div>
                  </>
                )}

                {/* ── Customize ── */}
                {showDevOptions && (
                <button className="dn__customize-btn" onClick={() => setShowCustomize(true)}>
                  🎨 Customize
                </button>
                )}

                {/* ── OTA Update panel ── */}
                <div style={{ margin: '16px 16px 4px', background: 'rgba(0,0,0,0.15)', borderRadius: 12, padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 18 }}>
                      {updateStatus.state === 'checking' || updateStatus.state === 'downloading' ? '🔄' :
                       updateStatus.state === 'ready' ? '⬆️' :
                       updateStatus.state === 'error' ? '❌' : '🔃'}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--t-text, #fff)', cursor: 'pointer' }} onClick={() => setShowDevOptions(d => !d)}>App Updates</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: updateStatusLabel(updateStatus).color }}>
                    {updateStatusLabel(updateStatus).text}
                  </p>
                </div>

                {/* ── Template Switcher ── */}
                {showDevOptions && (<>
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
                <button
                  onClick={() => { const t = getSavedFcmToken(); if (!t) return; navigator.clipboard.writeText(t).then(() => { setCopiedFcm(true); setTimeout(() => setCopiedFcm(false), 2000); }); }}
                  style={{ display: 'block', width: 'calc(100% - 32px)', margin: '0 16px 8px', padding: '12px', border: '1px solid rgba(128,128,128,0.25)', borderRadius: 12, background: 'rgba(128,128,128,0.1)', color: 'inherit', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                >{copiedFcm ? '✅ Copied!' : getSavedFcmToken() ? '📋 Copy FCM Token' : 'Token not available'}</button>
                <div style={{ height: 20 }} />
                </>)}
              </>
            )}

          </div>

          {/* ── LOCATION ── */}
          {view === 'location' && (
            <div className="dn__loc-wrap">
              <div className="dn__loc-header">
                <button className="dn__back-btn" onClick={() => setView('account')}>‹</button>
                <p className="dn__loc-title">Locations</p>
              </div>
              <div className="dn__loc-list">
                {(locations.length > 0 ? locations : [{
                  text: restaurantName,
                  address: restaurantAddress ?? undefined,
                  phone: restaurantPhone ?? undefined,
                } as RestaurantLocation]).map((loc: RestaurantLocation, i: number) => (
                  <div key={i} className="dn__loc-card">
                    <span className="dn__loc-chip">{safe(loc.text, restaurantName)}</span>
                    {loc.address && (
                      <div className="dn__loc-row">
                        <svg className="dn__loc-icon" width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#A26161"/>
                        </svg>
                        <p className="dn__loc-addr">{loc.address}</p>
                      </div>
                    )}
                    {loc.email && (
                      <div className="dn__loc-row">
                        <svg className="dn__loc-icon" width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" fill="#8A7A70"/>
                        </svg>
                        <p className="dn__loc-text">{loc.email}</p>
                      </div>
                    )}
                    {loc.phone && (
                      <div className="dn__loc-row">
                        <svg className="dn__loc-icon" width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" fill="#8A7A70"/>
                        </svg>
                        <p className="dn__loc-text">{loc.phone}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Full-screen auth overlay ── */}
          {!authUser && view === 'account' && (
            <div className="dn__auth">
              <svg className="dn__auth-blob dn__auth-blob--tr" viewBox="0 0 349 345" fill="none" aria-hidden="true">
                <path d="M272.385 38.9189C294.802 56.1067 366.372 92.571 345.095 131.075C320.658 175.297 365.139 256.033 294.443 261.787C248.364 264.578 225.549 323.305 196.439 338.21C166.802 353.228 108.184 345.164 113.051 295.471C117.825 246.733 -56.3113 195.138 18.8588 157.164C63.3352 134.697 14.9014 109.686 36.1603 72.0065C78.3537 -1.58443 182.405 -29.0653 272.385 38.9189Z" fill={template.colors.primary} fillOpacity="0.4"/>
              </svg>
              <svg className="dn__auth-blob dn__auth-blob--bl" viewBox="0 0 349 345" fill="none" aria-hidden="true">
                <path d="M272.385 38.9189C294.802 56.1067 366.372 92.571 345.095 131.075C320.658 175.297 365.139 256.033 294.443 261.787C248.364 264.578 225.549 323.305 196.439 338.21C166.802 353.228 108.184 345.164 113.051 295.471C117.825 246.733 -56.3113 195.138 18.8588 157.164C63.3352 134.697 14.9014 109.686 36.1603 72.0065C78.3537 -1.58443 182.405 -29.0653 272.385 38.9189Z" fill={template.colors.primary} fillOpacity="0.4"/>
              </svg>
              <div className="dn__auth-content">
                <div className="dn__auth-logo-ring">
                  <div className="dn__logo-circle" style={{ width: 78, height: 78, fontSize: 30 }}>🍃</div>
                </div>
                <p className="dn__auth-title">{authScreen === 'signin' ? 'Sign in' : 'Sign up'}</p>
                <p className="dn__auth-sub">Or with Email</p>
                {authScreen === 'signin' && loginError && <p className="dn__login-error">{loginError}</p>}
                {authScreen === 'signup' && regError && <p className="dn__login-error">{regError}</p>}
                {authScreen === 'signin' ? (
                  <form className="dn__auth-form" onSubmit={handleLogin}>
                    <div className="dn__auth-field">
                      <label className="dn__auth-label">Email</label>
                      <input className="dn__input" type="email" placeholder="your@email.com" value={loginEmail} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
                    </div>
                    <div className="dn__auth-field">
                      <label className="dn__auth-label">Password</label>
                      <div className="dn__auth-input-wrap">
                        <input className="dn__input" type={showLoginPass ? 'text' : 'password'} placeholder="••••••••" value={loginPassword} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" />
                        <span className="dn__auth-eye" onClick={() => setShowLoginPass(p => !p)}>{showLoginPass ? '🙈' : '👁️'}</span>
                      </div>
                    </div>
                    <button className="dn__submit" type="submit" disabled={loginLoading}>{loginLoading ? 'Signing in…' : 'Sign In'}</button>
                  </form>
                ) : (
                  <form className="dn__auth-form" onSubmit={handleRegister}>
                    {regSuccess && <p className="dn__auth-success">Registration successful! Redirecting to login…</p>}
                    <div className="dn__auth-field">
                      <label className="dn__auth-label">Full Name</label>
                      <input className="dn__input" type="text" placeholder="John Doe" value={regName} onChange={e => setRegName(e.target.value)} autoComplete="name" />
                    </div>
                    <div className="dn__auth-field">
                      <label className="dn__auth-label">Email</label>
                      <input className="dn__input" type="email" placeholder="your@email.com" value={regEmail} onChange={e => setRegEmail(e.target.value)} autoComplete="email" />
                    </div>
                    <div className="dn__auth-field">
                      <label className="dn__auth-label">Mobile Number</label>
                      <input className="dn__input" type="tel" placeholder="+1 000 000 0000" value={regMobile} onChange={e => setRegMobile(e.target.value)} autoComplete="tel" />
                    </div>
                    <div className="dn__auth-field">
                      <label className="dn__auth-label">Password</label>
                      <div className="dn__auth-input-wrap">
                        <input className="dn__input" type={showRegPass ? 'text' : 'password'} placeholder="Min. 6 characters" value={regPassword} onChange={e => setRegPassword(e.target.value)} autoComplete="new-password" />
                        <span className="dn__auth-eye" onClick={() => setShowRegPass(p => !p)}>{showRegPass ? '🙈' : '👁️'}</span>
                      </div>
                    </div>
                    <div className="dn__auth-field">
                      <label className="dn__auth-label">Confirm Password</label>
                      <div className="dn__auth-input-wrap">
                        <input className="dn__input" type={showRegConf ? 'text' : 'password'} placeholder="Repeat password" value={regConfirm} onChange={e => setRegConfirm(e.target.value)} autoComplete="new-password" />
                        <span className="dn__auth-eye" onClick={() => setShowRegConf(p => !p)}>{showRegConf ? '🙈' : '👁️'}</span>
                      </div>
                    </div>
                    <button className="dn__submit" type="submit" disabled={regLoading || regSuccess}>{regLoading ? 'Creating account…' : 'Create Account'}</button>
                  </form>
                )}
                <p className="dn__auth-footer">
                  {authScreen === 'signin'
                    ? <><span>New User? </span><button className="dn__auth-link" type="button" onClick={() => setAuthScreen('signup')}>Sign Up</button></>
                    : <><span>Already a Member? </span><button className="dn__auth-link" type="button" onClick={() => setAuthScreen('signin')}>Sign In</button></>
                  }
                </p>
              </div>
            </div>
          )}

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
              </button>
            ))}
          </nav>

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
                <button className="dn__cta" style={{ background: '#EF4444', marginBottom: 8 }} onClick={handleDeleteConfirmed}>
                  Yes, Delete My Account
                </button>
                <button className="dn__cta" style={{ background: '#aaa' }} onClick={() => setShowDeleteConfirm(false)}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      )}

    </div>
  );
};

export default DineApp;
