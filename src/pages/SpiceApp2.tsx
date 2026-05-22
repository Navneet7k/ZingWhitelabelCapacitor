import React, { useState, useEffect, useRef } from 'react';
import { useTemplate, TEMPLATES } from '../context/TemplateContext';
import { useHomeData } from '../context/HomeDataContext';
import { useMenuData } from '../context/MenuDataContext';
import { getSavedUser, isLoggedIn, login, register, saveAuth, clearAuth, getToken } from '../services/authApi';
import type { AuthUser } from '../services/authApi';
import { getOrderUrl, getRestaurantLogo, getRestaurantPhone, getRestaurantAddress, getRestaurantLocations } from '../services/configApi';
import type { RestaurantLocation } from '../services/configApi';
import { getRestaurantId, getRestaurantName } from '../services/restaurantConfig';
import { openWebView } from '../services/webviewService';
import { checkConfigColorsOnTabSwitch } from '../services/configColorsService';
import { getStatus, onStatusChange, applyIfReady, checkOnTabSwitch } from '../services/updater';
import type { UpdateStatus } from '../services/updater';
import CustomizePage from './CustomizePage';
import './SpiceApp2.css';

function safe(v: unknown, fallback = ''): string {
  try { return (v != null && v !== '') ? String(v) : fallback; } catch { return fallback; }
}

// Shimmer image loader — wrapper div inherits identical dimensions/shape from cls,
// shimmer fades out as the actual image fades in.
const Sp2Img: React.FC<{
  src: string; alt?: string; cls: string; fallback?: React.ReactNode;
}> = ({ src, alt = '', cls, fallback }) => {
  const [loaded,   setLoaded]   = useState(false);
  const [errored,  setErrored]  = useState(false);
  if (!src || errored) return fallback ? <>{fallback}</> : null;
  return (
    <div className={cls} style={{ position: 'relative', display: 'block', overflow: 'hidden' }}>
      <div
        className="sp2__shimmer"
        style={{
          position: 'absolute', inset: 0, borderRadius: 'inherit',
          opacity: loaded ? 0 : 1,
          transition: 'opacity 0.45s ease',
          pointerEvents: 'none',
        }}
      />
      <img
        src={src} alt={alt}
        style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          objectFit: 'cover', display: 'block',
          opacity: loaded ? 1 : 0,
          transition: 'opacity 0.45s ease',
        }}
        onLoad={() => setLoaded(true)}
        onError={() => setErrored(true)}
        loading="lazy" decoding="async"
      />
    </div>
  );
};

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

type Spice2View = 'home' | 'menu' | 'orders' | 'account' | 'location';
type Auth2Mode = 'login' | 'register';

const NAV: { id: Spice2View; label: string }[] = [
  { id: 'home',     label: 'Home'     },
  { id: 'menu',     label: 'Menu'     },
  { id: 'orders',   label: 'Order'    },
  { id: 'account',  label: 'Account'  },
  { id: 'location', label: 'Location' },
];

const NAV_ICONS: Record<Spice2View, React.ReactNode> = {
  home: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3L2 12h3v8h5v-5h4v5h5v-8h3L12 3z"/>
    </svg>
  ),
  menu: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/>
      <rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/>
    </svg>
  ),
  orders: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3C7.6 3 4 6.1 4 10h16c0-3.9-3.6-7-8-7z"/>
      <rect x="2" y="11" width="20" height="2.5" rx="1.25"/>
      <rect x="9" y="1.5" width="6" height="2" rx="1"/>
    </svg>
  ),
  account: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="7" r="4"/>
      <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8H4z"/>
    </svg>
  ),
  location: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  ),
};

const EMAIL_RE  = /^[\w.-]+@([\w-]+\.)+[\w-]{2,4}$/;
const MOBILE_RE = /^\+?\d{7,15}$/;

function getInitialUser(): AuthUser | null {
  try { return isLoggedIn() ? getSavedUser() : null; } catch { return null; }
}

const SpiceApp2: React.FC = () => {
  const { template, setTemplateId } = useTemplate();
  const { data: homeData } = useHomeData();
  const { data: menuData } = useMenuData();

  const [view, setView]                   = useState<Spice2View>('home');
  const [selectedBanner, setSelectedBanner] = useState(0);
  const [activeGallery, setActiveGallery] = useState(0);
  const [expandedCatId, setExpandedCatId] = useState<number | null>(null);
  const [orderTab, setOrderTab]           = useState<'current' | 'past' | 'favorite'>('current');
  const galleryTouchX = useRef(0);
  const [authUser, setAuthUser]           = useState<AuthUser | null>(getInitialUser);
  const [authMode, setAuth2Mode]           = useState<Auth2Mode>('login');
  const [showCustomize, setShowCustomize] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [loginEmail,    setLoginEmail]    = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError,    setLoginError]    = useState('');
  const [loginLoading,  setLoginLoading]  = useState(false);
  const [showLoginPass, setShowLoginPass] = useState(false);

  const [regName,     setRegName]     = useState('');
  const [regEmail,    setRegEmail]    = useState('');
  const [regMobile,   setRegMobile]   = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm,  setRegConfirm]  = useState('');
  const [regError,    setRegError]    = useState('');
  const [regLoading,  setRegLoading]  = useState(false);
  const [regSuccess,  setRegSuccess]  = useState(false);
  const [showRegPass, setShowRegPass] = useState(false);
  const [showRegConf, setShowRegConf] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>(getStatus);
  useEffect(() => onStatusChange(setUpdateStatus), []);

  const restaurantId   = getRestaurantId();
  const restaurantName    = safe(getRestaurantName(), 'Spice Kitchen');
  const logoUrl           = getRestaurantLogo();
  const restaurantPhone   = getRestaurantPhone();
  const restaurantAddress = getRestaurantAddress();
  const locations         = getRestaurantLocations();
  const allCategories  = menuData?.categories ?? [];
  const popularDishes  = homeData?.popularDishes ?? [];
  const banners        = homeData?.banners ?? [];
  const recentOrders   = homeData?.recentOrders ?? [];
  const points         = homeData?.points ?? 0;

  const currentOrders  = homeData?.currentOrders  ?? [];
  const pastOrders     = homeData?.pastOrders      ?? [];
  const favoriteOrders = homeData?.favoriteOrders  ?? [];

  const groups = menuData?.groups ?? [];
  const menuSections = (() => {
    const secs: Array<{ group: typeof groups[number] | null; categories: typeof allCategories }> = [];
    groups.forEach(g => {
      const cats = allCategories.filter(c => c.groupId === g.id);
      if (cats.length > 0) secs.push({ group: g, categories: cats });
    });
    const placed = new Set(secs.flatMap(s => s.categories.map(c => c.id)));
    const remaining = allCategories.filter(c => !placed.has(c.id));
    if (remaining.length > 0) secs.push({ group: null, categories: remaining });
    return secs;
  })();

  const didMountRef = useRef(false);
  useEffect(() => {
    if (!didMountRef.current) { didMountRef.current = true; return; }
    checkOnTabSwitch();
    applyIfReady();
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
    setLoginLoading(true);
    setLoginError('');
    try {
      const { token, user } = await login(loginEmail, loginPassword, restaurantId);
      saveAuth(token, user);
      setAuthUser(user);
      setLoginEmail('');
      setLoginPassword('');
    } catch (err: any) {
      setLoginError(safe(err?.message, 'Login failed'));
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim())                   { setRegError('Please enter your name'); return; }
    if (!EMAIL_RE.test(regEmail.trim()))   { setRegError('Please enter a valid email'); return; }
    if (!MOBILE_RE.test(regMobile.trim())) { setRegError('Please enter a valid mobile number'); return; }
    if (regPassword.length < 6)            { setRegError('Password must be at least 6 characters'); return; }
    if (regPassword !== regConfirm)        { setRegError('Passwords do not match'); return; }
    if (!restaurantId)                     { setRegError('Restaurant not configured'); return; }
    setRegLoading(true);
    setRegError('');
    try {
      await register({
        name:                 regName.trim(),
        email:                regEmail.trim(),
        mobile:               regMobile.trim(),
        password:             regPassword,
        passwordConfirmation: regConfirm,
        restaurantId,
      });
      setRegSuccess(true);
      setTimeout(() => { setRegSuccess(false); setAuth2Mode('login'); }, 1500);
    } catch (err: any) {
      setRegError(safe(err?.message, 'Registration failed'));
    } finally {
      setRegLoading(false);
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
    <div className="sp">

      <div className="sp2__scroll">

        {/* ── HOME ── */}
        {view === 'home' && (
          <>
            {/* Header / Action Bar */}
            <div className="sp2__header">
              {logoUrl
                ? <img src={logoUrl} alt={restaurantName} className="sp2__header-logo" />
                : <div className="sp2__header-logo sp2__header-logo--ph">
                    {safe(restaurantName[0], '🍽').toUpperCase()}
                  </div>
              }
            </div>

            {(() => {
              const slide = banners[selectedBanner];
              return (
                <div className="sp2__hero" onClick={handleOrder}>
                  <Sp2Img src={slide?.image ?? ''} cls="sp2__hero-img" fallback={<div className="sp2__hero-img sp2__hero-img--ph" />} />
                  <div className="sp2__hero-veil">
                    <p className="sp2__hero-welcome">Welcome To</p>
                    <h1 className="sp2__hero-name">{restaurantName}</h1>
                  </div>
                </div>
              );
            })()}

            {banners.length > 0 && (
              <div className="sp2__circles">
                {banners.map((banner, i) => (
                  <button
                    key={i}
                    className={`sp2__circle${i === selectedBanner ? ' sp2__circle--active' : ''}`}
                    onClick={() => setSelectedBanner(i)}
                  >
                    <Sp2Img src={banner.image ?? ''} cls="sp2__circle-img" fallback={<div className="sp2__circle-ph">🌶</div>} />
                    <span className="sp2__circle-label">{safe(banner.title)}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="sp2__divider" />

            <div className="sp2__points-wrap">
              <div className="sp2__points-circle">
                <span className="sp2__points-num">{points > 0 ? points : '0'}</span>
                <span className="sp2__points-lbl">Pts</span>
              </div>
              <div className="sp2__points-card">
                <p className="sp2__points-text">Each Points For Each Orders</p>
                <button className="sp2__points-btn" onClick={() => openWebView(clientUrl('points'), 'Points', template.colors.primary)}>
                  Learn More | ▶
                </button>
              </div>
            </div>

            <div className="sp2__divider" />

            {(currentOrders.length > 0 || pastOrders.length > 0 || favoriteOrders.length > 0) && (
              <div className="sp2__section">
                <div className="sp2__section-header">
                  <p className="sp2__section-title sp2__section-title--flush">My Orders</p>
                  <button className="sp2__text-link" onClick={() => setView('orders')}>View all</button>
                </div>
                <div className="sp2__ord-tabs">
                  {(['current', 'past', 'favorite'] as const).map(tab => (
                    <button
                      key={tab}
                      className={`sp2__ord-tab${orderTab === tab ? ' active' : ''}`}
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
                    <div className="sp2__ord-empty">No {orderTab} orders</div>
                  );
                  return (
                    <div className="sp2__ord-card">
                      <Sp2Img
                        src={o.image ?? ''}
                        cls="sp2__ord-img"
                        fallback={<div className="sp2__ord-img-ph"><span>Order Image</span></div>}
                      />
                      <div className="sp2__ord-info">
                        <p className="sp2__ord-date">{safe(o.date)}</p>
                        <p className="sp2__ord-id">Order #{safe(String(o.id)).replace('ORD-', '')}</p>
                        <p className="sp2__ord-items">{o.items?.length ?? 0} Items</p>
                        <p className="sp2__ord-price">${Number(o.total).toFixed(2)}</p>
                      </div>
                      <button
                        className="sp2__ord-status-btn"
                        onClick={() => setView('orders')}
                      >
                        Order Status | 🔔
                      </button>
                    </div>
                  );
                })()}
              </div>
            )}

            <div className="sp2__divider" />

            {banners.length > 0 && (
              <div className="sp2__section">
                <p className="sp2__section-title">Gallery</p>
                <div
                  className="sp2__gallery"
                  onTouchStart={e => { galleryTouchX.current = e.touches[0].clientX; }}
                  onTouchEnd={e => {
                    const dx = galleryTouchX.current - e.changedTouches[0].clientX;
                    if (Math.abs(dx) > 40) {
                      if (dx > 0) setActiveGallery(g => Math.min(g + 1, banners.length - 1));
                      else        setActiveGallery(g => Math.max(g - 1, 0));
                    }
                  }}
                >
                  {banners.map((b, i) => {
                    const off = i - activeGallery;
                    const abs = Math.abs(off);
                    if (abs > 2) return null;
                    const scale   = abs === 0 ? 1 : abs === 1 ? 0.88 : 0.78;
                    const opacity = abs === 0 ? 1 : abs === 1 ? 0.52 : 0.28;
                    const blur    = abs === 0 ? 'none' : abs === 1 ? 'blur(2px) brightness(0.62)' : 'blur(4px) brightness(0.48)';
                    return (
                      <div
                        key={b.id}
                        className="sp2__gallery-item"
                        style={{
                          transform: `translateX(${off * 55}px) scale(${scale})`,
                          zIndex:    abs === 0 ? 10 : abs === 1 ? 8 : 6,
                          opacity,
                          filter: blur,
                          cursor: 'pointer',
                        }}
                        onClick={abs === 0 ? handleOrder : () => setActiveGallery(i)}
                      >
                        <Sp2Img src={b.image ?? ''} cls="sp2__gallery-img" fallback={<div className="sp2__gallery-ph">🌶️</div>} />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="sp2__divider" />

            <div className="sp2__section">
              <p className="sp2__section-title">Contact Us</p>
              <div className="sp2__contact-card">
                {restaurantPhone && (
                  <div className="sp2__contact-row">
                    <span className="sp2__contact-icon">📞</span>
                    <span className="sp2__contact-text">{restaurantPhone}</span>
                  </div>
                )}
                {restaurantAddress && (
                  <div className="sp2__contact-row">
                    <span className="sp2__contact-icon">🏠</span>
                    <span className="sp2__contact-text">{restaurantAddress}</span>
                  </div>
                )}
                {!restaurantPhone && !restaurantAddress && (
                  <div className="sp2__contact-row">
                    <span className="sp2__contact-icon">🍽️</span>
                    <span className="sp2__contact-text">{restaurantName}</span>
                  </div>
                )}
                <button className="sp2__contact-btn" onClick={handleOrder}>Order Again 🛒</button>
              </div>
            </div>

            <div style={{ height: 20 }} />
          </>
        )}

        {/* ── MENU ── */}
        {view === 'menu' && (
          <>
            <p className="sp2__view-title">Menu</p>
            {!menuData ? (
              <p className="sp2__empty">Loading…</p>
            ) : allCategories.length === 0 ? (
              <p className="sp2__empty">No items available</p>
            ) : (
              <div className="sp2__accordion">
                {allCategories.map(cat => (
                  <div key={cat.id} className="sp2__acc-cat-wrap">
                    <button
                      className={`sp2__acc-cat-row${expandedCatId === cat.id ? ' expanded' : ''}`}
                      onClick={() => setExpandedCatId(prev => prev === cat.id ? null : cat.id)}
                    >
                      <span className="sp2__acc-cat-name">{safe(cat.name)}</span>
                      <span className="sp2__acc-cat-badges">
                        {cat.stockStatus === 0 && <span className="sp2__acc-oos">Sold Out</span>}
                        {cat.isLocked && <span className="sp2__acc-locked">🔒</span>}
                      </span>
                      <span className="sp2__acc-cat-toggle">{expandedCatId === cat.id ? '−' : '+'}</span>
                    </button>
                    {expandedCatId === cat.id && (
                      <div className="sp2__acc-items">
                        {cat.items.length === 0 ? (
                          <p className="sp2__acc-no-items">No items in this category</p>
                        ) : cat.items.map(item => (
                          <div key={item.id} className="sp2__acc-item-row">
                            <div className="sp2__acc-item-info">
                              <p className="sp2__acc-item-name">{safe(item.name)}</p>
                              {item.description && (
                                <p className="sp2__acc-item-desc">{item.description}</p>
                              )}
                              <p className="sp2__acc-item-price">${item.price.toFixed(2)}</p>
                            </div>
                            <div className="sp2__acc-item-right">
                              <Sp2Img
                                src={item.image ?? ''}
                                cls="sp2__acc-item-img"
                                fallback={<div className="sp2__acc-item-img sp2__acc-item-img--ph" />}
                              />
                              <button
                                className="sp2__acc-item-add"
                                disabled={cat.stockStatus === 0}
                                onClick={e => { e.stopPropagation(); handleOrder(); }}
                              >+</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
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
            <p className="sp2__view-title">My Orders</p>
            {recentOrders.length > 0 ? (
              recentOrders.map(o => (
                <div key={o.id} className="sp2__order-row">
                  <span className="sp2__order-row-emoji">{safe(o.statusEmoji, '📦')}</span>
                  <div className="sp2__order-row-detail">
                    <p className="sp2__order-row-id">{safe(String(o.id))}</p>
                    <p className="sp2__order-row-date">{safe(o.date)}</p>
                  </div>
                  <div className="sp2__order-row-meta">
                    <p className="sp2__order-row-total">${Number(o.total).toFixed(2)}</p>
                    <p className="sp2__order-row-status" style={{ color: safe(o.color) || undefined }}>
                      {safe(o.status)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="sp2__empty">No orders yet 🌶️</p>
            )}
            <div style={{ height: 12 }} />
            <button className="sp2__cta" onClick={handleOrder}>Place New Order</button>
            <div style={{ height: 20 }} />
          </>
        )}

        {/* ── ACCOUNT ── */}
        {view === 'account' && (
          <>
            {authUser ? (
              <>
                {/* Primary-colour header band */}
                <div className="sp2__profile-hero">
                  <div className="sp2__profile-avatar">
                    {safe(authUser.name?.[0], '?').toUpperCase()}
                  </div>
                  <h2 className="sp2__profile-name">{safe(authUser.name)}</h2>
                  <p className="sp2__profile-email">{safe(authUser.email)}</p>
                </div>

                {/* Quick-action card — overlaps the colour boundary */}
                <div className="sp2__acc-quick">
                  <button className="sp2__acc-quick-item" onClick={() => setView('orders')}>
                    <span className="sp2__acc-quick-icon">🛍️</span>
                    <span className="sp2__acc-quick-label">My Orders</span>
                  </button>
                  <button className="sp2__acc-quick-item" onClick={() => openWebView(clientUrl('favorites'), 'Favorites', template.colors.primary)}>
                    <span className="sp2__acc-quick-icon">♡</span>
                    <span className="sp2__acc-quick-label">Favorites</span>
                  </button>
                  <button className="sp2__acc-quick-item" onClick={() => openWebView(clientUrl('points'), 'Points', template.colors.primary)}>
                    <span className="sp2__acc-quick-icon">☆</span>
                    <span className="sp2__acc-quick-label">Points</span>
                  </button>
                </div>

                {/* Settings card */}
                <div className="sp2__acc-menu">
                  {([
                    { icon: '✏️', label: 'Edit Profile',       action: () => openWebView(clientUrl('edit-profile'), 'Edit Profile', template.colors.primary) },
                    { icon: '🏠', label: 'Saved Addresses',    action: () => openWebView(clientUrl('address'), 'Saved Addresses', template.colors.primary) },
                    { icon: '🎨', label: 'Customize',          action: () => setShowCustomize(true) },
                    { icon: '📋', label: 'Terms & Conditions', action: () => {} },
                    { icon: '🗑️', label: 'Delete Account',     action: () => setShowDeleteConfirm(true) },
                    { icon: '🚪', label: 'Sign Out',           action: () => { clearAuth(); setAuthUser(null); } },
                  ] as { icon: string; label: string; action: () => void }[]).map((item, i) => (
                    <button key={i} className="sp2__acc-item" onClick={item.action}>
                      <span className="sp2__acc-icon">{item.icon}</span>
                      <span className="sp2__acc-label">{item.label}</span>
                      <span className="sp2__acc-arrow">›</span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="sp2__auth">
                <div className="sp2__auth-header">
                  {logoUrl
                    ? <img src={logoUrl} alt={restaurantName} className="sp2__auth-logo" />
                    : <div className="sp2__auth-logo-ph">
                        {safe(restaurantName[0], '🍽').toUpperCase()}
                      </div>
                  }
                  <p className="sp2__auth-brand">{restaurantName}</p>
                </div>

                <div className="sp2__auth-tabs">
                  <button
                    className={`sp2__auth-tab${authMode === 'login' ? ' active' : ''}`}
                    onClick={() => setAuth2Mode('login')}
                  >Sign In</button>
                  <button
                    className={`sp2__auth-tab${authMode === 'register' ? ' active' : ''}`}
                    onClick={() => setAuth2Mode('register')}
                  >Sign Up</button>
                </div>

                {authMode === 'login' ? (
                  <form className="sp2__auth-form" onSubmit={handleLogin}>
                    {loginError && <p className="sp2__auth-error">{loginError}</p>}
                    <div className="sp2__field">
                      <label className="sp2__label">Email</label>
                      <input className="sp2__input" type="email" placeholder="your@email.com"
                        value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
                        required autoComplete="email" />
                    </div>
                    <div className="sp2__field">
                      <label className="sp2__label">Password</label>
                      <div className="sp2__input-wrap">
                        <input className="sp2__input" type={showLoginPass ? 'text' : 'password'} placeholder="••••••••"
                          value={loginPassword} onChange={e => setLoginPassword(e.target.value)}
                          required autoComplete="current-password" />
                        <span className="sp2__eye" onClick={() => setShowLoginPass(p => !p)}>
                          {showLoginPass ? '🙈' : '👁️'}
                        </span>
                      </div>
                    </div>
                    <button className="sp2__auth-btn" type="submit" disabled={loginLoading}>
                      {loginLoading ? 'Signing in…' : 'Sign In'}
                    </button>
                  </form>
                ) : (
                  <form className="sp2__auth-form" onSubmit={handleRegister}>
                    {regError   && <p className="sp2__auth-error">{regError}</p>}
                    {regSuccess && <p className="sp2__auth-success">Registration successful!</p>}
                    <div className="sp2__field">
                      <label className="sp2__label">Full Name</label>
                      <input className="sp2__input" type="text" placeholder="John Doe"
                        value={regName} onChange={e => setRegName(e.target.value)} />
                    </div>
                    <div className="sp2__field">
                      <label className="sp2__label">Email</label>
                      <input className="sp2__input" type="email" placeholder="your@email.com"
                        value={regEmail} onChange={e => setRegEmail(e.target.value)} />
                    </div>
                    <div className="sp2__field">
                      <label className="sp2__label">Mobile Number</label>
                      <input className="sp2__input" type="tel" placeholder="+1 000 000 0000"
                        value={regMobile} onChange={e => setRegMobile(e.target.value)} />
                    </div>
                    <div className="sp2__field">
                      <label className="sp2__label">Password</label>
                      <div className="sp2__input-wrap">
                        <input className="sp2__input" type={showRegPass ? 'text' : 'password'} placeholder="Min. 6 characters"
                          value={regPassword} onChange={e => setRegPassword(e.target.value)} />
                        <span className="sp2__eye" onClick={() => setShowRegPass(p => !p)}>
                          {showRegPass ? '🙈' : '👁️'}
                        </span>
                      </div>
                    </div>
                    <div className="sp2__field">
                      <label className="sp2__label">Confirm Password</label>
                      <div className="sp2__input-wrap">
                        <input className="sp2__input" type={showRegConf ? 'text' : 'password'} placeholder="Repeat password"
                          value={regConfirm} onChange={e => setRegConfirm(e.target.value)} />
                        <span className="sp2__eye" onClick={() => setShowRegConf(p => !p)}>
                          {showRegConf ? '🙈' : '👁️'}
                        </span>
                      </div>
                    </div>
                    <button className="sp2__auth-btn" type="submit" disabled={regLoading || regSuccess}>
                      {regLoading ? 'Creating account…' : 'Create Account'}
                    </button>
                  </form>
                )}
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

            <p className="sp2__tmpl-label">Switch Template</p>
            <div className="sp2__tmpl-strip">
              {TEMPLATES.map(t => (
                <button
                  key={t.id}
                  className={`sp2__tmpl-pill${t.id === template.id ? ' active' : ''}`}
                  style={{ background: t.colors.bg, borderColor: t.id === template.id ? t.colors.primary : 'transparent' }}
                  onClick={() => setTemplateId(t.id)}
                >
                  <span className="sp2__tmpl-emoji">{t.emoji}</span>
                  <span className="sp2__tmpl-name" style={{ color: t.colors.text }}>{t.name}</span>
                </button>
              ))}
            </div>

            <div style={{ height: 20 }} />
          </>
        )}

        {/* ── LOCATION ── */}
        {view === 'location' && (
          <>
            <div className="sp2__loc-header">
              <span className="sp2__loc-header-text">LOCATIONS</span>
            </div>

            {locations.length > 0 ? locations.map((loc: RestaurantLocation, i: number) => (
              <div key={i} className="sp2__loc-item">
                <div className="sp2__loc-title-bar">
                  <p className="sp2__loc-title-text">{i + 1}.{safe(loc.text, restaurantName)}</p>
                </div>
                <div className="sp2__loc-detail-card">
                  {loc.address && (
                    <div className="sp2__loc-row">
                      <span className="sp2__loc-icon">📍</span>
                      <p className="sp2__loc-detail-text">{loc.address}</p>
                    </div>
                  )}
                  {loc.phone && (
                    <div className="sp2__loc-row">
                      <span className="sp2__loc-icon">📞</span>
                      <p className="sp2__loc-detail-text">{loc.phone}</p>
                    </div>
                  )}
                  {loc.email && (
                    <div className="sp2__loc-row">
                      <span className="sp2__loc-icon">✉️</span>
                      <p className="sp2__loc-detail-text">{loc.email}</p>
                    </div>
                  )}
                  {loc.url && (
                    <button
                      className="sp2__loc-order-btn"
                      onClick={() => openWebView(loc.url!, 'Order Now', template.colors.primary)}
                    >Order Now</button>
                  )}
                </div>
              </div>
            )) : (
              <div className="sp2__loc-item">
                <div className="sp2__loc-title-bar">
                  <p className="sp2__loc-title-text">{restaurantName}</p>
                </div>
                <div className="sp2__loc-detail-card">
                  {restaurantAddress && (
                    <div className="sp2__loc-row">
                      <span className="sp2__loc-icon">📍</span>
                      <p className="sp2__loc-detail-text">{restaurantAddress}</p>
                    </div>
                  )}
                  {restaurantPhone && (
                    <div className="sp2__loc-row">
                      <span className="sp2__loc-icon">📞</span>
                      <p className="sp2__loc-detail-text">{restaurantPhone}</p>
                    </div>
                  )}
                  <button className="sp2__loc-order-btn" onClick={handleOrder}>Order Now</button>
                </div>
              </div>
            )}

            <div style={{ height: 24 }} />
          </>
        )}

      </div>

      {/* ── Bottom nav ── */}
      <nav className="sp2__nav">
        {NAV.map(n => (
          <button
            key={n.id}
            className={`sp2__nav-btn${view === n.id ? ' active' : ''}`}
            onClick={() => setView(n.id)}
            aria-label={n.label}
          >
            <span className="sp2__nav-icon">{NAV_ICONS[n.id]}</span>
            <span className="sp2__nav-label">{n.label}</span>
          </button>
        ))}
      </nav>

      {showCustomize && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'var(--t-bg, #2C5F3E)' }}>
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
            <button
              style={{ display: 'block', width: '100%', padding: '14px', background: '#EF4444', color: '#fff', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 700, marginBottom: 8, cursor: 'pointer' }}
              onClick={handleDeleteConfirmed}
            >
              Yes, Delete My Account
            </button>
            <button
              style={{ display: 'block', width: '100%', padding: '14px', background: '#aaa', color: '#fff', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 700, cursor: 'pointer' }}
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default SpiceApp2;
