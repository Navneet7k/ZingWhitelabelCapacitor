import React, { useState, useEffect, useRef } from 'react';
import { useTemplate, TEMPLATES } from '../context/TemplateContext';
import { useHomeData } from '../context/HomeDataContext';
import { useMenuData } from '../context/MenuDataContext';
import { getSavedUser, isLoggedIn, login, register, saveAuth, clearAuth, getToken } from '../services/authApi';
import type { AuthUser } from '../services/authApi';
import { getOrderUrl, getRestaurantLogo } from '../services/configApi';
import { getRestaurantId, getRestaurantName } from '../services/restaurantConfig';
import { openWebView } from '../services/webviewService';
import { getSavedFcmToken } from '../services/fcmService';
import { checkConfigColorsOnTabSwitch } from '../services/configColorsService';
import { getStatus, onStatusChange, applyIfReady, checkOnTabSwitch } from '../services/updater';
import type { UpdateStatus } from '../services/updater';
import CustomizePage from './CustomizePage';
import './OnyxApp.css';

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

function safe(v: unknown, fallback = ''): string {
  try { return (v != null && v !== '') ? String(v) : fallback; } catch { return fallback; }
}

function getInitialUser(): AuthUser | null {
  try { return isLoggedIn() ? getSavedUser() : null; } catch { return null; }
}

type OnyxView = 'home' | 'menu' | 'orders' | 'account';

const OnyxApp: React.FC = () => {
  const { template, setTemplateId } = useTemplate();
  const { data: homeData }          = useHomeData();
  const { data: menuData }          = useMenuData();

  const [view, setView]                         = useState<OnyxView>('home');
  const [heroIndex, setHeroIndex]               = useState(0);
  const [activeGalleryIndex, setGalleryIndex]   = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [showCustomize, setShowCustomize]       = useState(false);
  const [showDevOptions, setShowDevOptions] = useState(false);
  const [copiedFcm, setCopiedFcm]           = useState(false);
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
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>(getStatus);
  useEffect(() => onStatusChange(setUpdateStatus), []);
  useEffect(() => {
    const handler = () => setView('account');
    const forceLogout = () => { setAuthUser(null); setView('account'); };
    window.addEventListener('zing:auth-required', handler);
    window.addEventListener('zing:force-logout', forceLogout);
    return () => {
      window.removeEventListener('zing:auth-required', handler);
      window.removeEventListener('zing:force-logout', forceLogout);
    };
  }, []);
  const galleryRef = useRef<HTMLDivElement>(null);

  const restaurantId   = getRestaurantId();
  const restaurantName = safe(getRestaurantName(), 'Our Restaurant');
  const logoUrl        = getRestaurantLogo();
  const allCategories  = menuData?.categories ?? [];
  const popularDishes  = homeData?.popularDishes ?? [];
  const banners        = homeData?.banners ?? [];
  const recentOrders   = homeData?.recentOrders ?? [];
  const points         = homeData?.points ?? 0;
  const galleryItems   = homeData?.gallery ?? [];

  const menuItems = selectedCategory !== null
    ? (allCategories.find(c => c.id === selectedCategory)?.items ?? [])
    : [];

  // Hero auto-advance using banners (or fallback to popularDishes)
  const heroSlides = banners.length > 0 ? banners : popularDishes.map((d, i) => ({ id: i, image: d.image, title: d.name, subtitle: d.description ?? '', cta: '', gradient: '' }));

  useEffect(() => {
    if (heroSlides.length <= 1) return;
    const t = setInterval(() => setHeroIndex(i => (i + 1) % heroSlides.length), 3500);
    return () => clearInterval(t);
  }, [heroSlides.length]);

  useEffect(() => {
    if (view !== 'menu') setSelectedCategory(null);
  }, [view]);

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

  const EMAIL_RE  = /^[\w.-]+@([\w-]+\.)+[\w-]{2,4}$/;
  const MOBILE_RE = /^\+?\d{7,15}$/;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim())                   { setRegError('Please enter your name'); return; }
    if (!EMAIL_RE.test(regEmail.trim()))   { setRegError('Please enter a valid email'); return; }
    if (!MOBILE_RE.test(regMobile.trim())) { setRegError('Please enter a valid mobile number'); return; }
    if (regPassword.length < 6)           { setRegError('Password must be at least 6 characters'); return; }
    if (regPassword !== regConfirm)       { setRegError('Passwords do not match'); return; }
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
    <div className="ox">

      {showCustomize ? (
        <div className="ox__customize-view">
          <CustomizePage onBack={() => setShowCustomize(false)} />
        </div>
      ) : (
        <>
          {/* ── Header ── */}
          <header className="ox__header">
            <div className="ox__logo-circle">
              {logoUrl
                ? <img src={logoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                : '🍽️'
              }
            </div>
            <span className="ox__header-name">{restaurantName}</span>
            {homeData !== null && (
              <div className="ox__pts-pill">
                <span className="ox__pts-pill-num">{points.toLocaleString()}</span>
                <span className="ox__pts-pill-lbl"> Pts</span>
              </div>
            )}
          </header>

          <div className="ox__scroll">

            {/* ── HOME ── */}
            {view === 'home' && (
              <>
                {/* ── Hero carousel ── */}
                <div className="ox__hero-wrap">
                  <div className="ox__hero">
                    {heroSlides.length > 0 && (
                      heroSlides[heroIndex]?.image
                        ? <img
                            className="ox__hero-img"
                            src={heroSlides[heroIndex].image}
                            alt=""
                            loading="lazy"
                          />
                        : <div className="ox__hero-img ox__hero-ph">🍽️</div>
                    )}
                    {heroSlides.length > 1 && (
                      <>
                        <button
                          className="ox__hero-arrow ox__hero-arrow--left"
                          onClick={() => setHeroIndex(i => (i - 1 + heroSlides.length) % heroSlides.length)}
                          aria-label="Previous"
                        >‹</button>
                        <button
                          className="ox__hero-arrow ox__hero-arrow--right"
                          onClick={() => setHeroIndex(i => (i + 1) % heroSlides.length)}
                          aria-label="Next"
                        >›</button>
                      </>
                    )}
                  </div>
                </div>

                {/* ── Circular thumbnails ── */}
                {popularDishes.length > 0 && (
                  <div className="ox__thumbs">
                    {popularDishes.slice(0, 4).map((dish, i) => (
                      <div key={i} className="ox__thumb" onClick={handleOrder}>
                        {dish.image
                          ? <img src={dish.image} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, background: '#222' }}>🍽️</div>
                        }
                      </div>
                    ))}
                  </div>
                )}

                {/* ── Points card ── */}
                {homeData !== null && (
                  <div className="ox__points-row">
                    <div className="ox__pts-wrap">
                      <div className="ox__pts-circle">
                        <span className="ox__pts-num">{points.toFixed(2).split('.')[0]}</span>
                        <span className="ox__pts-lbl">Pts</span>
                      </div>
                      <div className="ox__pts-card">
                        <p className="ox__pts-card-text">Each Points For Each Orders</p>
                        <button className="ox__dark-btn" onClick={handleOrder}>Learn More</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Separator ── */}
                <div className="ox__sep" />

                {/* ── Recently Ordered ── */}
                {recentOrders.length > 0 && (
                  <>
                    <p className="ox__section-title">Recently Ordered</p>
                    <div className="ox__recent-card">
                      <img
                        className="ox__recent-img"
                        src={recentOrders[0].orderStatusUrl ?? popularDishes[0]?.image ?? banners[0]?.image ?? ''}
                        alt=""
                        loading="lazy"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                      <div className="ox__recent-info">
                        <p className="ox__recent-date">{safe(recentOrders[0].date)}</p>
                        <p className="ox__recent-items">{safe(recentOrders[0].items?.[0])}</p>
                        <p className="ox__recent-total">$ {Number(recentOrders[0].total).toFixed(2)}</p>
                        <button className="ox__dark-btn" onClick={handleOrder}>Order Again  |  🛒</button>
                      </div>
                    </div>
                  </>
                )}

                {/* ── Favourite Order ── */}
                {recentOrders.length > 0 && (
                  <>
                    <p className="ox__section-title">Favourite Order</p>
                    <div className="ox__fav-scroll">
                      {recentOrders.slice(0, 2).map((order, oi) => (
                        <div key={oi} className="ox__fav-card">
                          <div className="ox__fav-circles">
                            {[0, 1, 2, 3].map((j) => (
                              <div
                                key={j}
                                className="ox__fav-circle"
                                style={{ zIndex: j + 1, marginLeft: j === 0 ? 0 : -10 }}
                              >
                                {popularDishes[j]?.image
                                  ? <img src={popularDishes[j].image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="lazy" />
                                  : <span style={{ fontSize: 14 }}>🍽️</span>
                                }
                              </div>
                            ))}
                          </div>
                          <p className="ox__fav-items">
                            {order.items.slice(0, 3).join(', ')}{order.items.length > 3 ? '..' : ''}
                          </p>
                          <p className="ox__fav-price">$ {Number(order.total).toFixed(2)}</p>
                          <button className="ox__dark-btn" onClick={handleOrder}>Order Again  |  🛒</button>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* ── Separator ── */}
                <div className="ox__sep" />

                {/* ── Popular Dishes ── */}
                {popularDishes.length > 0 && (
                  <>
                    <p className="ox__section-title">Popular Dishes</p>
                    {popularDishes.map((dish, i) => (
                      <div key={i} className="ox__popular-card" onClick={handleOrder}>
                        {dish.image
                          ? <img className="ox__popular-img" src={dish.image} alt="" loading="lazy" />
                          : <div className="ox__popular-img ox__popular-ph">🍽️</div>
                        }
                        <div className="ox__popular-info">
                          <p className="ox__popular-name">{safe(dish.name) || 'Featured Dish'}</p>
                          {dish.description && (
                            <p className="ox__popular-desc">{dish.description}</p>
                          )}
                          <button
                            className="ox__dark-btn"
                            onClick={e => { e.stopPropagation(); handleOrder(); }}
                          >Order Now  |  🛒</button>
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {/* ── Gallery ── */}
                {galleryItems.length > 0 && (
                  <>
                    <p className="ox__section-title">Gallery</p>
                    <div className="ox__gallery" ref={galleryRef} onScroll={handleGalleryScroll}>
                      {galleryItems.map((item, i) => (
                        <img
                          key={i}
                          className={`ox__gallery-img${i === activeGalleryIndex ? ' active' : ''}`}
                          src={item.url}
                          alt=""
                          loading="lazy"
                          onClick={handleOrder}
                        />
                      ))}
                    </div>
                    {galleryItems.length > 1 && (
                      <div className="ox__dots-row">
                        {galleryItems.map((_, i) => (
                          <button
                            key={i}
                            className={`ox__dot${i === activeGalleryIndex ? ' active' : ''}`}
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
                  <>
                    <div className="ox__menu-header">
                      <button className="ox__back-btn" onClick={() => setSelectedCategory(null)}>‹</button>
                      <p className="ox__view-title" style={{ margin: 0 }}>
                        {safe(allCategories.find(c => c.id === selectedCategory)?.name)}
                      </p>
                    </div>
                    {menuItems.length === 0
                      ? <p className="ox__empty">No items</p>
                      : (
                        <div className="ox__item-list">
                          {menuItems.map((item, i) => (
                            <div key={item.id ?? i} className="ox__item-row" onClick={handleOrder}>
                              {item.image
                                ? <img className="ox__item-img" src={item.image} alt="" loading="lazy" />
                                : <div className="ox__item-img ox__item-ph">🍽️</div>
                              }
                              <div className="ox__item-info">
                                <p className="ox__item-name">{safe(item.name)}</p>
                                <p className="ox__item-price">${safe(String(item.price))}</p>
                              </div>
                              <button
                                className="ox__item-add"
                                onClick={e => { e.stopPropagation(); handleOrder(); }}
                              >+</button>
                            </div>
                          ))}
                        </div>
                      )
                    }
                  </>
                ) : (
                  <>
                    <p className="ox__view-title">Menu</p>
                    {allCategories.length === 0
                      ? <p className="ox__empty">{!menuData ? 'Loading…' : 'No categories'}</p>
                      : (
                        <div className="ox__cat-grid">
                          {allCategories.map(cat => {
                            const preview = cat.items?.[0]?.image;
                            return (
                              <div key={cat.id} className="ox__cat-tile" onClick={() => setSelectedCategory(cat.id)}>
                                {preview
                                  ? <img className="ox__cat-img" src={preview} alt="" loading="lazy" />
                                  : <div className="ox__cat-img ox__cat-ph">🍽️</div>
                                }
                                <div className="ox__cat-overlay">
                                  <p className="ox__cat-name">{safe(cat.name)}</p>
                                  <p className="ox__cat-count">{cat.items?.length ?? 0} items</p>
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
                <p className="ox__view-title">My Orders</p>
                {recentOrders.length > 0
                  ? recentOrders.map(o => (
                      <div key={o.id} className="ox__order-row">
                        <div className="ox__order-info">
                          <p className="ox__order-id">{safe(o.id)}</p>
                          <p className="ox__order-date">{safe(o.date)}</p>
                        </div>
                        <div className="ox__order-right">
                          <p className="ox__order-total">${safe(String(o.total))}</p>
                          <p className="ox__order-status" style={{ color: safe(o.color, '#4FCB53') }}>
                            {safe(o.status)}
                          </p>
                        </div>
                      </div>
                    ))
                  : <p className="ox__empty">No orders so far. Place your first order!</p>
                }
                <button className="ox__cta" onClick={handleOrder}>Place New Order</button>
                <div style={{ height: 20 }} />
              </>
            )}

            {/* ── ACCOUNT ── */}
            {view === 'account' && (
              <>
                <p className="ox__view-title">Account</p>
                {authUser ? (
                  <div className="ox__profile-card">
                    <div className="ox__avatar">
                      {safe(authUser.name?.[0], '?').toUpperCase()}
                    </div>
                    <p className="ox__profile-name">{safe(authUser.name)}</p>
                    <p className="ox__profile-email">{safe(authUser.email)}</p>
                    {points > 0 && (
                      <div className="ox__loyalty">
                        <span>⭐</span>
                        <span>{points.toLocaleString()} loyalty points</span>
                      </div>
                    )}
                    <button className="ox__signout" onClick={() => { clearAuth(); setAuthUser(null); }}>
                      Sign Out
                    </button>
                    <div style={{ margin: '12px 0 4px', borderTop: '1px solid rgba(79,203,83,0.3)' }} />
                    <button className="ox__signout" style={{ marginTop: 6 }} onClick={() => openWebView(clientUrl('edit-profile'), 'Edit Profile', template.colors.primary)}>
                      ✏️ Edit Profile
                    </button>
                    <button className="ox__signout" style={{ marginTop: 6 }} onClick={() => openWebView(clientUrl('favorites'), 'Favorites', template.colors.primary)}>
                      ❤️ Favorites
                    </button>
                    <button className="ox__signout" style={{ marginTop: 6 }} onClick={() => openWebView(clientUrl('points'), 'Points', template.colors.primary)}>
                      ⭐ Points
                    </button>
                    <button className="ox__signout" style={{ marginTop: 6 }} onClick={() => openWebView(clientUrl('address'), 'Saved Addresses', template.colors.primary)}>
                      🏠 Saved Addresses
                    </button>
                    <button className="ox__signout" style={{ marginTop: 6 }}>
                      📋 Terms &amp; Conditions
                    </button>
                    <button className="ox__signout" style={{ marginTop: 6, background: '#EF4444', color: '#fff' }} onClick={() => setShowDeleteConfirm(true)}>
                      🗑️ Delete Account
                    </button>
                  </div>
                ) : null}

                {/* ── Customize ── */}
                {showDevOptions && (
                <button className="ox__customize-btn" onClick={() => setShowCustomize(true)}>
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

                {/* ── Template Switcher ── */}
                {showDevOptions && (<>
                <p className="ox__tmpl-label">Switch Template</p>
                <div className="ox__tmpl-strip">
                  {TEMPLATES.map(t => (
                    <button
                      key={t.id}
                      className={`ox__tmpl-pill${t.id === template.id ? ' active' : ''}`}
                      style={{
                        background: t.colors.bg,
                        borderColor: t.id === template.id ? t.colors.primary : 'transparent',
                      }}
                      onClick={() => setTemplateId(t.id)}
                    >
                      <span className="ox__tmpl-emoji">{t.emoji}</span>
                      <span className="ox__tmpl-name" style={{ color: t.colors.text }}>{t.name}</span>
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

          {/* ── Full-screen auth overlay ── */}
          {!authUser && view === 'account' && (
            <div className="ox__auth">
              <svg className="ox__auth-blob ox__auth-blob--tr" viewBox="0 0 349 345" fill="none" aria-hidden="true">
                <path d="M272.385 38.9189C294.802 56.1067 366.372 92.571 345.095 131.075C320.658 175.297 365.139 256.033 294.443 261.787C248.364 264.578 225.549 323.305 196.439 338.21C166.802 353.228 108.184 345.164 113.051 295.471C117.825 246.733 -56.3113 195.138 18.8588 157.164C63.3352 134.697 14.9014 109.686 36.1603 72.0065C78.3537 -1.58443 182.405 -29.0653 272.385 38.9189Z" fill="#C2D9BA"/>
              </svg>
              <svg className="ox__auth-blob ox__auth-blob--bl" viewBox="0 0 349 345" fill="none" aria-hidden="true">
                <path d="M272.385 38.9189C294.802 56.1067 366.372 92.571 345.095 131.075C320.658 175.297 365.139 256.033 294.443 261.787C248.364 264.578 225.549 323.305 196.439 338.21C166.802 353.228 108.184 345.164 113.051 295.471C117.825 246.733 -56.3113 195.138 18.8588 157.164C63.3352 134.697 14.9014 109.686 36.1603 72.0065C78.3537 -1.58443 182.405 -29.0653 272.385 38.9189Z" fill="#C2D9BA"/>
              </svg>
              <div className="ox__auth-content">
                <div className="ox__auth-logo-ring">
                  <div className="ox__logo-circle" style={{ width: 78, height: 78, fontSize: 30 }}>
                    {logoUrl
                      ? <img src={logoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                      : '🍽️'
                    }
                  </div>
                </div>
                <p className="ox__auth-title">{authScreen === 'signin' ? 'Sign in' : 'Sign up'}</p>
                <p className="ox__auth-sub">Or with Email</p>
                {authScreen === 'signin' && loginError && <p className="ox__login-error">{loginError}</p>}
                {authScreen === 'signup' && regError && <p className="ox__login-error">{regError}</p>}
                {authScreen === 'signin' ? (
                  <form className="ox__auth-form" onSubmit={handleLogin}>
                    <div className="ox__auth-field">
                      <label className="ox__auth-label">Email</label>
                      <input className="ox__input" type="email" placeholder="your@email.com" value={loginEmail} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
                    </div>
                    <div className="ox__auth-field">
                      <label className="ox__auth-label">Password</label>
                      <div className="ox__auth-input-wrap">
                        <input className="ox__input" type={showLoginPass ? 'text' : 'password'} placeholder="••••••••" value={loginPassword} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" />
                        <span className="ox__auth-eye" onClick={() => setShowLoginPass(p => !p)}>{showLoginPass ? '🙈' : '👁️'}</span>
                      </div>
                    </div>
                    <button className="ox__submit" type="submit" disabled={loginLoading}>{loginLoading ? 'Signing in…' : 'Sign In'}</button>
                  </form>
                ) : (
                  <form className="ox__auth-form" onSubmit={handleRegister}>
                    {regSuccess && <p className="ox__auth-success">Registration successful! Redirecting to login…</p>}
                    <div className="ox__auth-field">
                      <label className="ox__auth-label">Full Name</label>
                      <input className="ox__input" type="text" placeholder="John Doe" value={regName} onChange={e => setRegName(e.target.value)} autoComplete="name" />
                    </div>
                    <div className="ox__auth-field">
                      <label className="ox__auth-label">Email</label>
                      <input className="ox__input" type="email" placeholder="your@email.com" value={regEmail} onChange={e => setRegEmail(e.target.value)} autoComplete="email" />
                    </div>
                    <div className="ox__auth-field">
                      <label className="ox__auth-label">Mobile Number</label>
                      <input className="ox__input" type="tel" placeholder="+1 000 000 0000" value={regMobile} onChange={e => setRegMobile(e.target.value)} autoComplete="tel" />
                    </div>
                    <div className="ox__auth-field">
                      <label className="ox__auth-label">Password</label>
                      <div className="ox__auth-input-wrap">
                        <input className="ox__input" type={showRegPass ? 'text' : 'password'} placeholder="Min. 6 characters" value={regPassword} onChange={e => setRegPassword(e.target.value)} autoComplete="new-password" />
                        <span className="ox__auth-eye" onClick={() => setShowRegPass(p => !p)}>{showRegPass ? '🙈' : '👁️'}</span>
                      </div>
                    </div>
                    <div className="ox__auth-field">
                      <label className="ox__auth-label">Confirm Password</label>
                      <div className="ox__auth-input-wrap">
                        <input className="ox__input" type={showRegConf ? 'text' : 'password'} placeholder="Repeat password" value={regConfirm} onChange={e => setRegConfirm(e.target.value)} autoComplete="new-password" />
                        <span className="ox__auth-eye" onClick={() => setShowRegConf(p => !p)}>{showRegConf ? '🙈' : '👁️'}</span>
                      </div>
                    </div>
                    <button className="ox__submit" type="submit" disabled={regLoading || regSuccess}>{regLoading ? 'Creating account…' : 'Create Account'}</button>
                  </form>
                )}
                <p className="ox__auth-footer">
                  {authScreen === 'signin'
                    ? <><span>New User? </span><button className="ox__auth-link" type="button" onClick={() => setAuthScreen('signup')}>Sign Up</button></>
                    : <><span>Already a Member? </span><button className="ox__auth-link" type="button" onClick={() => setAuthScreen('signin')}>Sign In</button></>
                  }
                </p>
              </div>
            </div>
          )}

          {showDeleteConfirm && (
            <div
              style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-end' }}
              onClick={() => setShowDeleteConfirm(false)}
            >
              <div
                style={{ width: '100%', background: '#1a1a1a', borderRadius: '16px 16px 0 0', padding: '20px 20px 32px', textAlign: 'center' }}
                onClick={e => e.stopPropagation()}
              >
                <div style={{ width: 40, height: 4, background: 'rgba(79,203,83,0.4)', borderRadius: 2, margin: '0 auto 16px' }} />
                <span style={{ fontSize: 32 }}>⚠️</span>
                <h3 style={{ margin: '8px 0 4px', fontSize: 18, fontWeight: 700, color: '#4FCB53' }}>Delete Account?</h3>
                <p style={{ margin: '0 0 16px', fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>
                  This will permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <button className="ox__cta" style={{ background: '#EF4444', marginBottom: 8 }} onClick={handleDeleteConfirmed}>
                  Yes, Delete My Account
                </button>
                <button className="ox__cta" style={{ background: 'rgba(255,255,255,0.15)' }} onClick={() => setShowDeleteConfirm(false)}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* ── Bottom Nav ── */}
          <nav className="ox__nav">
            {/* Orders */}
            <button
              className={`ox__nav-btn${view === 'orders' ? ' active' : ''}`}
              onClick={() => setView('orders')}
              aria-label="Orders"
            >
              <span className={`ox__nav-icon${view === 'orders' ? ' active' : ''}`}>📋</span>
              <span className="ox__nav-label">Orders</span>
            </button>

            {/* Menu */}
            <button
              className={`ox__nav-btn${view === 'menu' ? ' active' : ''}`}
              onClick={() => setView('menu')}
              aria-label="Menu"
            >
              <span className={`ox__nav-icon${view === 'menu' ? ' active' : ''}`}>🛍️</span>
              <span className="ox__nav-label">Menu</span>
            </button>

            {/* Home — center raised circle */}
            <button
              className="ox__nav-home"
              onClick={() => setView('home')}
              aria-label="Home"
            >
              <div className="ox__nav-home-circle">
                <span style={{ fontSize: 22 }}>🏠</span>
              </div>
            </button>

            {/* Account */}
            <button
              className={`ox__nav-btn${view === 'account' ? ' active' : ''}`}
              onClick={() => setView('account')}
              aria-label="Account"
            >
              <span className={`ox__nav-icon${view === 'account' ? ' active' : ''}`}>👤</span>
              <span className="ox__nav-label">Account</span>
            </button>

            {/* Location / Order */}
            <button
              className="ox__nav-btn"
              onClick={handleOrder}
              aria-label="Order"
            >
              <span className="ox__nav-icon">📍</span>
              <span className="ox__nav-label">Order</span>
            </button>
          </nav>
        </>
      )}

    </div>
  );
};

export default OnyxApp;
