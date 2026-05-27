import React, { useState, useEffect, useRef } from 'react';
import { useTemplate, TEMPLATES } from '../context/TemplateContext';
import { useHomeData } from '../context/HomeDataContext';
import { useMenuData } from '../context/MenuDataContext';
import { getSavedUser, isLoggedIn, login, register, saveAuth, clearAuth, getToken } from '../services/authApi';
import type { AuthUser } from '../services/authApi';
import { getOrderUrl, getRestaurantLocations, getRestaurantAddress, getRestaurantPhone, getRestaurantLogo } from '../services/configApi';
import type { RestaurantLocation } from '../services/configApi';
import { getRestaurantId, getRestaurantName } from '../services/restaurantConfig';
import { openWebView } from '../services/webviewService';
import { checkConfigColorsOnTabSwitch } from '../services/configColorsService';
import { getStatus, onStatusChange, applyIfReady, checkOnTabSwitch } from '../services/updater';
import type { UpdateStatus } from '../services/updater';
import CustomizePage from './CustomizePage';
import './PulseApp.css';

function safe(v: unknown, fallback = ''): string {
  try { return (v != null && v !== '') ? String(v) : fallback; } catch { return fallback; }
}

const PlImg: React.FC<{ src: string; cls: string; fallback?: React.ReactNode }> = ({ src, cls, fallback }) => {
  const [loaded, setLoaded]   = React.useState(false);
  const [errored, setErrored] = React.useState(false);
  const imgRef = React.useRef<HTMLImageElement>(null);
  React.useEffect(() => { if (imgRef.current?.complete) setLoaded(true); }, []);
  if (!src || errored) return fallback ? <>{fallback}</> : <div className={`${cls} pl__img-ph`} />;
  return (
    <div className={cls} style={{ position: 'relative', overflow: 'hidden' }}>
      <div className="pl__shimmer" style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', opacity: loaded ? 0 : 1, transition: 'opacity 0.45s ease', pointerEvents: 'none' }} />
      <img ref={imgRef} src={src} alt=""
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: loaded ? 1 : 0, transition: 'opacity 0.45s ease' }}
        onLoad={() => setLoaded(true)} onError={() => setErrored(true)} loading="lazy" decoding="async" />
    </div>
  );
};

const PlGalleryImg: React.FC<{ src: string }> = ({ src }) => {
  const [loaded, setLoaded] = React.useState(false);
  const imgRef = React.useRef<HTMLImageElement>(null);
  React.useEffect(() => { if (imgRef.current?.complete) setLoaded(true); }, []);
  return (
    <div className="pl__gallery-tile">
      <div className="pl__shimmer" style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', opacity: loaded ? 0 : 1, transition: 'opacity 0.4s ease', pointerEvents: 'none' }} />
      <img ref={imgRef} src={src} alt=""
        style={{ width: '100%', height: 'auto', display: 'block', opacity: loaded ? 1 : 0, minHeight: loaded ? 0 : 80, transition: 'opacity 0.4s ease' }}
        onLoad={() => setLoaded(true)} loading="lazy" decoding="async" />
    </div>
  );
};

function updateStatusLabel(s: UpdateStatus): { text: string; color: string } {
  switch (s.state) {
    case 'idle':        return { text: 'Idle',                                              color: '#888' };
    case 'checking':    return { text: 'Checking for updates…',                             color: '#F5A623' };
    case 'up_to_date':  return { text: `Up to date (${s.version})`,                         color: '#4CAF50' };
    case 'downloading': return { text: `Downloading update ${s.from} → ${s.to}…`,           color: '#2196F3' };
    case 'ready':       return { text: `Update ready (v${s.version}) — restart to apply`,   color: '#9C27B0' };
    case 'error':       return { text: `Update error: ${s.reason}`,                         color: '#F44336' };
  }
}

type PulseView = 'home' | 'menu' | 'orders' | 'account' | 'location';

const NAV: { id: PulseView; icon: React.ReactNode; label: string }[] = [
  { id: 'home', label: 'Home', icon: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9.5z"/>
      <path d="M9 21V12h6v9"/>
    </svg>
  )},
  { id: 'menu', label: 'Menu', icon: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2h12a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z"/>
      <path d="M9 7h6M9 11h6M9 15h4"/>
    </svg>
  )},
  { id: 'orders', label: 'Order', icon: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  )},
  { id: 'account', label: 'Account', icon: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4"/>
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
    </svg>
  )},
  { id: 'location', label: 'Locations', icon: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
      <circle cx="12" cy="9" r="2.5"/>
    </svg>
  )},
];

function getInitialUser(): AuthUser | null {
  try { return isLoggedIn() ? getSavedUser() : null; } catch { return null; }
}

const PulseApp: React.FC = () => {
  const { template, setTemplateId } = useTemplate();
  const { data: homeData }          = useHomeData();
  const { data: menuData }          = useMenuData();

  const [view, setView]              = useState<PulseView>('home');
  const [bannerIdx, setBannerIdx]    = useState(0);
  const [activeCategory, setCategory]= useState<number | null>(null);
  const [authUser, setAuthUser]      = useState<AuthUser | null>(getInitialUser);
  const [authTab, setAuthTab]         = useState<'login' | 'register'>('login');
  const [loginEmail, setEmail]        = useState('');
  const [loginPassword, setPassword]  = useState('');
  const [loginError, setLoginError]   = useState('');
  const [loginLoading, setLoading]    = useState(false);
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [regName,    setRegName]      = useState('');
  const [regEmail,   setRegEmail]     = useState('');
  const [regMobile,  setRegMobile]    = useState('');
  const [regPass,    setRegPass]      = useState('');
  const [regConfirm, setRegConfirm]   = useState('');
  const [regError,   setRegError]     = useState('');
  const [regLoading, setRegLoading]   = useState(false);
  const [regSuccess, setRegSuccess]   = useState(false);
  const [showRegPass,    setShowRegPass]    = useState(false);
  const [showRegConfirm, setShowRegConfirm] = useState(false);
  const [showCustomize, setShowCustomize]       = useState(false);
  const [showDevOptions, setShowDevOptions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>(getStatus);
  const [orderTab, setOrderTab]      = useState<'current' | 'past' | 'favorite'>('current');
  useEffect(() => onStatusChange(setUpdateStatus), []);

  const restaurantId      = getRestaurantId();
  const restaurantName    = safe(getRestaurantName(), 'Nice Food');
  const restaurantLogo    = getRestaurantLogo();
  const restaurantAddress = getRestaurantAddress();
  const restaurantPhone   = getRestaurantPhone();
  const locations         = getRestaurantLocations();
  const allCategories  = menuData?.categories ?? [];
  const popularDishes  = homeData?.popularDishes ?? [];
  const banners        = homeData?.banners ?? [];
  const recentOrders   = homeData?.recentOrders ?? [];
  const currentOrders  = homeData?.currentOrders  ?? [];
  const pastOrders     = homeData?.pastOrders      ?? [];
  const favoriteOrders = homeData?.favoriteOrders  ?? [];
  const points         = homeData?.points ?? 0;
  const featuredImages = homeData?.featuredImages ?? [];
  const gallery        = homeData?.gallery ?? [];

  const filteredItems = activeCategory
    ? (allCategories.find(c => c.id === activeCategory)?.items ?? [])
    : allCategories.flatMap(c => c.items ?? []);

  // Tab switch → OTA + config colors
  const didMountRef = useRef(false);
  useEffect(() => {
    if (!didMountRef.current) { didMountRef.current = true; return; }
    checkOnTabSwitch();
    applyIfReady();
    checkConfigColorsOnTabSwitch(restaurantId ?? '');
  }, [view]);

  // Banner auto-advance
  const sliderItems = banners.length > 0
    ? banners
    : (popularDishes[0] ? [{ id: 0, image: popularDishes[0].image, title: `Welcome To\n${restaurantName}`, subtitle: '' }] : []);

  useEffect(() => {
    if (sliderItems.length < 2) return;
    const t = setInterval(() => setBannerIdx(i => (i + 1) % sliderItems.length), 3500);
    return () => clearInterval(t);
  }, [sliderItems.length]);

  const touchRef = useRef(0);
  const cur = sliderItems[bannerIdx];

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
    setLoading(true); setLoginError('');
    try {
      const { token, user } = await login(loginEmail, loginPassword, restaurantId);
      saveAuth(token, user); setAuthUser(user); setEmail(''); setPassword('');
    } catch (err: any) {
      setLoginError(safe(err?.message, 'Login failed'));
    } finally { setLoading(false); }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantId) return;
    if (!regName.trim())                                    { setRegError('Please enter your name'); return; }
    if (!/\S+@\S+\.\S+/.test(regEmail.trim()))             { setRegError('Please enter a valid email'); return; }
    if (!/^\+?[\d\s\-()]{7,}$/.test(regMobile.trim()))    { setRegError('Please enter a valid mobile number'); return; }
    if (regPass.length < 6)                                 { setRegError('Password must be at least 6 characters'); return; }
    if (regPass !== regConfirm)                             { setRegError('Passwords do not match'); return; }
    setRegLoading(true); setRegError('');
    try {
      await register({ name: regName.trim(), email: regEmail.trim(), mobile: regMobile.trim(), password: regPass, passwordConfirmation: regConfirm, restaurantId });
      setRegSuccess(true);
      setTimeout(() => { setAuthTab('login'); setRegSuccess(false); setRegName(''); setRegEmail(''); setRegMobile(''); setRegPass(''); setRegConfirm(''); }, 2000);
    } catch (err: any) {
      setRegError(safe(err?.message, 'Registration failed'));
    } finally { setRegLoading(false); }
  };

  function clientUrl(path: string) {
    return `https://app.zingmyorder.com/client/app/${path}/${getRestaurantId() ?? ''}?token=${encodeURIComponent(getToken() ?? '')}`;
  }

  function handleDeleteConfirmed() {
    setShowDeleteConfirm(false);
    openWebView(`https://app.zingmyorder.com/app/delete-user/${getRestaurantId() ?? ''}?token=${getToken() ?? ''}`, 'Delete Account', template.colors.primary);
  }

  return (
    <div className="pl">
      <div className="pl__scroll">

        {/* ── HOME ── */}
        {view === 'home' && (
          <>
            {/* Banner slider */}
            {sliderItems.length > 0 && cur && (
              <div className="pl__banner"
                onTouchStart={e => { touchRef.current = e.touches[0].clientX; }}
                onTouchEnd={e => {
                  const dx = touchRef.current - e.changedTouches[0].clientX;
                  if (Math.abs(dx) > 40) {
                    if (dx > 0) setBannerIdx(i => (i + 1) % sliderItems.length);
                    else        setBannerIdx(i => (i - 1 + sliderItems.length) % sliderItems.length);
                  }
                }}
              >
                {cur.image
                  ? <div className="pl__banner-img" style={{ backgroundImage: `url(${cur.image})` }} />
                  : <div className="pl__banner-img pl__banner-img--ph" />
                }
                <div className="pl__banner-overlay" />
                <div className="pl__banner-content">
                  <p className="pl__banner-title">{`Welcome To\n${restaurantName}`}</p>
                  <button className="pl__banner-btn" onClick={handleOrder}>Order Now</button>
                </div>
                {sliderItems.length > 1 && (
                  <div className="pl__banner-dots">
                    {sliderItems.map((_, i) => (
                      <span key={i} className={`pl__dot${i === bannerIdx ? ' active' : ''}`} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Points card */}
            <div className="pl__pts-card">
              <div className="pl__pts-left">
                <span className="pl__pts-val">{points}</span>
                <span className="pl__pts-suf">Pts</span>
              </div>
              <div className="pl__pts-right">
                <p className="pl__pts-text">Earn Points for Each Order.</p>
                <button className="pl__pts-link" onClick={() => openWebView(clientUrl('points'), 'Points', '#fff')}>
                  Learn More
                </button>
              </div>
            </div>

            {/* Popular dishes 2-col grid */}
            {popularDishes.length > 0 && (
              <div className="pl__dishes-grid">
                {popularDishes.slice(0, 6).map((dish, i) => (
                  <div key={i} className="pl__dish-card" onClick={handleOrder}>
                    <PlImg cls="pl__dish-img" src={dish.image ?? ''} />
                    <div className="pl__dish-info">
                      <p className="pl__dish-name">{safe(dish.name)}</p>
                      {dish.description
                        ? <p className="pl__dish-desc">{dish.description}</p>
                        : null
                      }
                      <button className="pl__dish-btn" onClick={e => { e.stopPropagation(); handleOrder(); }}>
                        Order Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* My Orders */}
            {(currentOrders.length > 0 || pastOrders.length > 0 || favoriteOrders.length > 0) && (
              <div className="pl__ord-section">
                <div className="pl__ord-header">
                  <p className="pl__ord-title">My Orders</p>
                  <button className="pl__ord-view-all" onClick={() => setView('orders')}>View all</button>
                </div>
                <div className="pl__ord-tabs">
                  {(['current', 'past', 'favorite'] as const).map(tab => (
                    <button
                      key={tab}
                      className={`pl__ord-tab${orderTab === tab ? ' active' : ''}`}
                      onClick={() => setOrderTab(tab)}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>
                {(() => {
                  const list = orderTab === 'current' ? currentOrders : orderTab === 'past' ? pastOrders : favoriteOrders;
                  const o = list[0];
                  if (!o) return <div className="pl__ord-empty">No {orderTab} orders</div>;
                  return (
                    <div className="pl__ord-card">
                      <PlImg cls="pl__ord-img" src={o.image ?? ''}
                        fallback={<div className="pl__ord-img-ph"><span>Order Image</span></div>} />
                      <div className="pl__ord-info">
                        <p className="pl__ord-date">{safe(o.date)}</p>
                        <p className="pl__ord-id">Order #{safe(String(o.id)).replace('ORD-', '')}</p>
                        <p className="pl__ord-items">{o.items?.length ?? 0} Items</p>
                        <p className="pl__ord-price">${Number(o.total).toFixed(2)}</p>
                      </div>
                      <button className="pl__ord-status-btn" onClick={() => setView('orders')}>
                        Order Status | 🕐
                      </button>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Featured Images */}
            {featuredImages.length > 0 && (
              <div className="pl__section">
                <div className="pl__section-header">
                  <p className="pl__section-title">Featured Images</p>
                  <button className="pl__view-all" onClick={handleOrder}>View all ›</button>
                </div>
                <div className="pl__feat-scroll">
                  {featuredImages.map(item => (
                    <PlImg key={item.id} cls="pl__feat-card" src={item.url ?? ''} />
                  ))}
                </div>
              </div>
            )}

            {/* Gallery */}
            {gallery.length > 0 && (
              <div className="pl__section">
                <div className="pl__section-header">
                  <p className="pl__section-title">Gallery</p>
                  <button className="pl__view-all" onClick={handleOrder}>View all ›</button>
                </div>
                <div className="pl__gallery-grid">
                  {gallery.slice(0, 9).map(item => (
                    <PlGalleryImg key={item.id} src={item.url ?? ''} />
                  ))}
                </div>
              </div>
            )}

            <div style={{ height: 20 }} />
          </>
        )}

        {/* ── MENU ── */}
        {view === 'menu' && (
          <>
            {activeCategory === null ? (
              <>
                <p className="pl__view-title">Menu</p>
                {!menuData
                  ? <p className="pl__empty">Loading…</p>
                  : allCategories.length === 0
                    ? <p className="pl__empty">No categories</p>
                    : (
                      <div className="pl__cat-grid">
                        {allCategories.map(cat => (
                          <button key={cat.id} className="pl__cat-cell"
                            onClick={() => setCategory(cat.id)}>
                            {safe(cat.name)}
                          </button>
                        ))}
                      </div>
                    )
                }
              </>
            ) : (
              <>
                <div className="pl__items-header">
                  <button className="pl__items-back" onClick={() => setCategory(null)}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 18l-6-6 6-6"/>
                    </svg>
                  </button>
                  <p className="pl__items-title">
                    {safe(allCategories.find(c => c.id === activeCategory)?.name)}
                  </p>
                </div>
                {filteredItems.length === 0
                  ? <p className="pl__empty">No items</p>
                  : (
                    <div className="pl__item-list">
                      {filteredItems.map(item => (
                        <div key={item.id} className="pl__item-row" onClick={handleOrder}>
                          <div className="pl__item-left">
                            <p className="pl__item-name">{safe(item.name)}</p>
                            {item.description && <p className="pl__item-desc">{item.description}</p>}
                            <p className="pl__item-price">${safe(String(item.price ?? 0))}</p>
                          </div>
                          <PlImg cls="pl__item-thumb" src={item.image ?? ''}
                            fallback={<div className="pl__item-thumb pl__item-thumb--ph" />} />
                        </div>
                      ))}
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
            <p className="pl__view-title">My Orders</p>
            {recentOrders.length > 0
              ? recentOrders.map(o => (
                  <div key={o.id} className="pl__order-row">
                    <span className="pl__order-emoji">{safe(o.statusEmoji, '📦')}</span>
                    <div className="pl__order-detail">
                      <p className="pl__order-id">{safe(o.id)}</p>
                      <p className="pl__order-date">{safe(o.date)}</p>
                    </div>
                    <div className="pl__order-meta">
                      <p className="pl__order-total">${safe(String(o.total ?? 0))}</p>
                      <p className="pl__order-status" style={{ color: safe(o.color, '#28A96B') }}>
                        {safe(o.status)}
                      </p>
                    </div>
                  </div>
                ))
              : <p className="pl__empty">No orders yet 🛒</p>
            }
            <div style={{ height: 12 }} />
            <button className="pl__cta" onClick={handleOrder}>Place New Order</button>
            <div style={{ height: 20 }} />
          </>
        )}

        {/* ── ACCOUNT ── */}
        {view === 'account' && (
          <>
            {authUser ? (
              <>
                {/* Hero */}
                <div className="pl__acc-hero">
                  <div className="pl__acc-avatar">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="8" r="4"/>
                      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                    </svg>
                  </div>
                  <p className="pl__acc-name">{safe(restaurantName)}</p>
                  <p className="pl__acc-email">{safe(authUser.email)}</p>

                {/* Quick actions */}
                <div className="pl__acc-actions">
                  <button className="pl__acc-action" onClick={() => setView('orders')}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
                    </svg>
                    <span>My Orders</span>
                  </button>
                  <div className="pl__acc-action-div" />
                  <button className="pl__acc-action" onClick={() => openWebView(clientUrl('favorites'), 'Favorites', template.colors.primary)}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                    <span>Favorite</span>
                  </button>
                  <div className="pl__acc-action-div" />
                  <button className="pl__acc-action" onClick={() => openWebView(clientUrl('points'), 'Points', template.colors.primary)}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
                    </svg>
                    <span>Points</span>
                  </button>
                </div>
                </div>{/* end hero */}

                {/* List rows */}
                <div className="pl__acc-list">
                  <button className="pl__acc-row" onClick={() => openWebView(clientUrl('edit-profile'), 'Edit Profile', template.colors.primary)}>
                    <span className="pl__acc-row-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </span>
                    <span className="pl__acc-row-label">Edit Profile</span>
                    <svg className="pl__acc-row-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 18l6-6-6-6"/>
                    </svg>
                  </button>
                  <button className="pl__acc-row" onClick={() => { clearAuth(); setAuthUser(null); }}>
                    <span className="pl__acc-row-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                      </svg>
                    </span>
                    <span className="pl__acc-row-label">Sign out</span>
                  </button>
                  <button className="pl__acc-row pl__acc-row--danger" onClick={() => setShowDeleteConfirm(true)}>
                    <span className="pl__acc-row-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                      </svg>
                    </span>
                    <span className="pl__acc-row-label">Delete My Account</span>
                  </button>
                  {showDevOptions && (
                    <button className="pl__acc-row" onClick={() => setShowCustomize(true)}>
                      <span className="pl__acc-row-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                        </svg>
                      </span>
                      <span className="pl__acc-row-label">Customize</span>
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="pl__auth-screen">
                {/* Hero */}
                <div className="pl__auth-hero">
                  <div className="pl__auth-logo-wrap">
                    {restaurantLogo
                      ? <img src={restaurantLogo} alt={restaurantName} className="pl__auth-logo-img" />
                      : <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="var(--t-primary,#28A96B)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 2h18v4H3z"/><path d="M3 6c0 7 4 12 9 12s9-5 9-12"/><path d="M12 18v4"/><path d="M8 22h8"/>
                        </svg>
                    }
                  </div>
                  <p className="pl__auth-brand">{restaurantName}</p>
                  <p className="pl__auth-tagline">Order fresh, earn rewards</p>
                </div>

                {/* Card */}
                <div className="pl__auth-card">
                  {/* Tabs */}
                  <div className="pl__auth-tabs">
                    <button className={`pl__auth-tab${authTab === 'login' ? ' active' : ''}`}
                      onClick={() => { setAuthTab('login'); setLoginError(''); setRegError(''); }}>
                      Sign In
                    </button>
                    <button className={`pl__auth-tab${authTab === 'register' ? ' active' : ''}`}
                      onClick={() => { setAuthTab('register'); setLoginError(''); setRegError(''); }}>
                      Sign Up
                    </button>
                  </div>

                  {/* Sign In */}
                  {authTab === 'login' && (
                    <form className="pl__auth-form" onSubmit={handleLogin}>
                      {loginError && <div className="pl__auth-error">{loginError}</div>}
                      <div className="pl__auth-field">
                        <label className="pl__auth-label">Email</label>
                        <div className="pl__auth-input-wrap">
                          <svg className="pl__auth-field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                          </svg>
                          <input className="pl__auth-input" type="email" placeholder="your@email.com"
                            value={loginEmail} onChange={e => setEmail(e.target.value)}
                            required autoComplete="email" />
                        </div>
                      </div>
                      <div className="pl__auth-field">
                        <label className="pl__auth-label">Password</label>
                        <div className="pl__auth-input-wrap">
                          <svg className="pl__auth-field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                          </svg>
                          <input className="pl__auth-input" type={showLoginPass ? 'text' : 'password'} placeholder="••••••••"
                            value={loginPassword} onChange={e => setPassword(e.target.value)}
                            required autoComplete="current-password" />
                          <button type="button" className="pl__auth-eye" onClick={() => setShowLoginPass(v => !v)}>
                            {showLoginPass
                              ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                              : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            }
                          </button>
                        </div>
                      </div>
                      <button className="pl__auth-submit" type="submit" disabled={loginLoading}
                        style={{ background: 'var(--t-primary,#28A96B)' }}>
                        {loginLoading ? 'Signing in…' : 'Sign In'}
                      </button>
                    </form>
                  )}

                  {/* Sign Up */}
                  {authTab === 'register' && (
                    <form className="pl__auth-form" onSubmit={handleRegister}>
                      {regError   && <div className="pl__auth-error">{regError}</div>}
                      {regSuccess && <div className="pl__auth-success">Account created! Redirecting to sign in…</div>}
                      <div className="pl__auth-field">
                        <label className="pl__auth-label">Full Name</label>
                        <div className="pl__auth-input-wrap">
                          <svg className="pl__auth-field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                          </svg>
                          <input className="pl__auth-input" type="text" placeholder="John Doe"
                            value={regName} onChange={e => setRegName(e.target.value)} required />
                        </div>
                      </div>
                      <div className="pl__auth-field">
                        <label className="pl__auth-label">Email</label>
                        <div className="pl__auth-input-wrap">
                          <svg className="pl__auth-field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                          </svg>
                          <input className="pl__auth-input" type="email" placeholder="your@email.com"
                            value={regEmail} onChange={e => setRegEmail(e.target.value)} required autoComplete="email" />
                        </div>
                      </div>
                      <div className="pl__auth-field">
                        <label className="pl__auth-label">Mobile Number</label>
                        <div className="pl__auth-input-wrap">
                          <svg className="pl__auth-field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>
                          </svg>
                          <input className="pl__auth-input" type="tel" placeholder="+1 000 000 0000"
                            value={regMobile} onChange={e => setRegMobile(e.target.value)} required autoComplete="tel" />
                        </div>
                      </div>
                      <div className="pl__auth-field">
                        <label className="pl__auth-label">Password</label>
                        <div className="pl__auth-input-wrap">
                          <svg className="pl__auth-field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                          </svg>
                          <input className="pl__auth-input" type={showRegPass ? 'text' : 'password'} placeholder="Min 6 characters"
                            value={regPass} onChange={e => setRegPass(e.target.value)} required />
                          <button type="button" className="pl__auth-eye" onClick={() => setShowRegPass(v => !v)}>
                            {showRegPass
                              ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                              : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            }
                          </button>
                        </div>
                      </div>
                      <div className="pl__auth-field">
                        <label className="pl__auth-label">Confirm Password</label>
                        <div className="pl__auth-input-wrap">
                          <svg className="pl__auth-field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                          </svg>
                          <input className="pl__auth-input" type={showRegConfirm ? 'text' : 'password'} placeholder="Repeat password"
                            value={regConfirm} onChange={e => setRegConfirm(e.target.value)} required />
                          <button type="button" className="pl__auth-eye" onClick={() => setShowRegConfirm(v => !v)}>
                            {showRegConfirm
                              ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                              : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            }
                          </button>
                        </div>
                      </div>
                      <button className="pl__auth-submit" type="submit" disabled={regLoading || regSuccess}
                        style={{ background: 'var(--t-primary,#28A96B)' }}>
                        {regLoading ? 'Creating account…' : 'Create Account'}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )}

            <div className="pl__update-panel">
              <div className="pl__update-header">
                <span style={{ fontSize: 16 }}>
                  {updateStatus.state === 'checking' || updateStatus.state === 'downloading' ? '🔄'
                   : updateStatus.state === 'ready' ? '⬆️'
                   : updateStatus.state === 'error'  ? '❌' : '🔃'}
                </span>
                <span className="pl__update-title" onClick={() => setShowDevOptions(d => !d)} style={{ cursor: 'pointer' }}>App Updates</span>
              </div>
              <p className="pl__update-text" style={{ color: updateStatusLabel(updateStatus).color }}>
                {updateStatus.state === 'ready'
                  ? `v${(updateStatus as any).version} downloaded — tap to install`
                  : updateStatusLabel(updateStatus).text}
              </p>
              {updateStatus.state === 'ready' && (
                <button className="pl__cta" style={{ marginTop: 8 }} onClick={() => applyIfReady()}>
                  Apply Update Now
                </button>
              )}
            </div>

            {showDevOptions && (<>
            <p className="pl__tmpl-label">Switch Template</p>
            <div className="pl__tmpl-strip">
              {TEMPLATES.map(t => (
                <button key={t.id}
                  className={`pl__tmpl-pill${t.id === template.id ? ' active' : ''}`}
                  style={{ background: t.colors.bg, borderColor: t.id === template.id ? t.colors.primary : 'transparent' }}
                  onClick={() => setTemplateId(t.id)}>
                  <span className="pl__tmpl-emoji">{t.emoji}</span>
                  <span className="pl__tmpl-name" style={{ color: t.colors.text }}>{t.name}</span>
                </button>
              ))}
            </div>
            <div style={{ height: 20 }} />
            </>)}
          </>
        )}
        {/* ── LOCATION ── */}
        {view === 'location' && (
          <>
            <p className="pl__view-title">Location</p>

            {/* Map placeholder */}
            <div className="pl__loc-map-ph">
              <svg width="110" height="110" viewBox="0 0 110 110" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Terrain spread */}
                <ellipse cx="55" cy="85" rx="38" ry="12" fill="#A5D6A7" opacity="0.5"/>
                <path d="M20 85 Q35 72 55 78 Q75 84 90 75 L90 90 Q70 100 55 95 Q35 100 20 90 Z" fill="#C8E6C9" opacity="0.7"/>
                {/* Pin shadow */}
                <ellipse cx="55" cy="82" rx="10" ry="4" fill="rgba(0,0,0,0.15)"/>
                {/* Pin body */}
                <path d="M55 22C44.5 22 36 30.5 36 41C36 55 55 78 55 78C55 78 74 55 74 41C74 30.5 65.5 22 55 22Z" fill="#E53935"/>
                {/* Pin inner circle */}
                <circle cx="55" cy="41" r="8" fill="#fff" opacity="0.9"/>
              </svg>
            </div>

            {/* Location entries */}
            <div className="pl__loc-list">
              {(locations.length > 0 ? locations : [{
                text: restaurantName,
                address: restaurantAddress ?? undefined,
                phone: restaurantPhone ?? undefined,
              } as RestaurantLocation]).map((loc: RestaurantLocation, i: number) => (
                <div key={i} className="pl__loc-entry">
                  <p className="pl__loc-name">{safe(loc.text, restaurantName)}</p>

                  {loc.phone && (
                    <div className="pl__loc-row">
                      <span className="pl__loc-icon-wrap">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1C7.61 21 2 15.39 2 8.82c0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" fill="currentColor"/>
                        </svg>
                      </span>
                      <span className="pl__loc-val">{loc.phone}</span>
                    </div>
                  )}

                  {loc.email && (
                    <div className="pl__loc-row">
                      <span className="pl__loc-icon-wrap pl__loc-icon-wrap--rect">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" fill="currentColor"/>
                        </svg>
                      </span>
                      <span className="pl__loc-val">{loc.email}</span>
                    </div>
                  )}

                  {loc.address && (
                    <div className="pl__loc-row">
                      <span className="pl__loc-icon-wrap pl__loc-icon-wrap--pin">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor"/>
                        </svg>
                      </span>
                      <span className="pl__loc-val">{loc.address}</span>
                    </div>
                  )}

                  <button
                    className="pl__loc-order-btn"
                    onClick={() => loc.url ? openWebView(loc.url, 'Order Online', template.colors.primary) : handleOrder()}
                  >Order Online</button>
                </div>
              ))}
            </div>
            <div style={{ height: 20 }} />
          </>
        )}

      </div>

      {/* ── Bottom nav ── */}
      <nav className="pl__nav">
        {NAV.map(n => (
          <button key={n.id} className={`pl__nav-btn${view === n.id ? ' active' : ''}`}
            onClick={() => setView(n.id)} aria-label={n.label}>
            <span className="pl__nav-icon">{n.icon}</span>
            <span className="pl__nav-label">{n.label}</span>
          </button>
        ))}
      </nav>

      {showCustomize && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: '#fff' }}>
          <CustomizePage onBack={() => setShowCustomize(false)} />
        </div>
      )}

      {showDeleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end' }}
          onClick={() => setShowDeleteConfirm(false)}>
          <div style={{ width: '100%', background: '#fff', borderRadius: '16px 16px 0 0', padding: '20px 20px 32px', textAlign: 'center' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ width: 40, height: 4, background: '#ddd', borderRadius: 2, margin: '0 auto 16px' }} />
            <span style={{ fontSize: 32 }}>⚠️</span>
            <h3 style={{ margin: '8px 0 4px', fontSize: 18, fontWeight: 700 }}>Delete Account?</h3>
            <p style={{ margin: '0 0 16px', fontSize: 14, color: '#666' }}>
              This will permanently delete your account and all associated data.
            </p>
            <button className="pl__cta" style={{ background: '#EF4444', marginBottom: 8 }} onClick={handleDeleteConfirmed}>
              Yes, Delete My Account
            </button>
            <button className="pl__cta" style={{ background: '#aaa' }} onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PulseApp;
