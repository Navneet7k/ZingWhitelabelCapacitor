import React, { useState, useEffect, useRef } from 'react';
import { useTemplate, TEMPLATES } from '../context/TemplateContext';
import { useHomeData } from '../context/HomeDataContext';
import { useMenuData } from '../context/MenuDataContext';
import { getSavedUser, isLoggedIn, login, saveAuth, clearAuth, getToken } from '../services/authApi';
import type { AuthUser } from '../services/authApi';
import { getOrderUrl } from '../services/configApi';
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

const PlImg: React.FC<{ src: string; cls: string }> = ({ src, cls }) => {
  const [loaded, setLoaded]   = React.useState(false);
  const [errored, setErrored] = React.useState(false);
  const imgRef = React.useRef<HTMLImageElement>(null);
  React.useEffect(() => { if (imgRef.current?.complete) setLoaded(true); }, []);
  if (!src || errored) return <div className={`${cls} pl__img-ph`} />;
  return (
    <div className={cls} style={{ position: 'relative', overflow: 'hidden' }}>
      <div className="pl__shimmer" style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', opacity: loaded ? 0 : 1, transition: 'opacity 0.4s ease', pointerEvents: 'none' }} />
      <img ref={imgRef} src={src} alt=""
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: loaded ? 1 : 0, transition: 'opacity 0.4s ease' }}
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

type PulseView = 'home' | 'menu' | 'orders' | 'account';

const NAV: { id: PulseView; icon: string; label: string }[] = [
  { id: 'home',    icon: '🏠', label: 'Home'    },
  { id: 'menu',    icon: '🍽️', label: 'Menu'    },
  { id: 'orders',  icon: '🛒', label: 'Order'   },
  { id: 'account', icon: '👤', label: 'Account' },
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
  const [loginEmail, setEmail]       = useState('');
  const [loginPassword, setPassword] = useState('');
  const [loginError, setLoginError]  = useState('');
  const [loginLoading, setLoading]   = useState(false);
  const [showCustomize, setShowCustomize]       = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>(getStatus);
  useEffect(() => onStatusChange(setUpdateStatus), []);

  const restaurantId   = getRestaurantId();
  const restaurantName = safe(getRestaurantName(), 'Nice Food');
  const allCategories  = menuData?.categories ?? [];
  const popularDishes  = homeData?.popularDishes ?? [];
  const banners        = homeData?.banners ?? [];
  const recentOrders   = homeData?.recentOrders ?? [];
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
            <p className="pl__view-title">Menu</p>
            {allCategories.length > 0 && (
              <div className="pl__cats">
                <button className={`pl__cat-pill${activeCategory === null ? ' active' : ''}`}
                  onClick={() => setCategory(null)}>All</button>
                {allCategories.map(cat => (
                  <button key={cat.id}
                    className={`pl__cat-pill${activeCategory === cat.id ? ' active' : ''}`}
                    onClick={() => setCategory(cat.id)}>{safe(cat.name)}</button>
                ))}
              </div>
            )}
            {filteredItems.length === 0
              ? <p className="pl__empty">{!menuData ? 'Loading…' : 'No items'}</p>
              : (
                <div className="pl__menu-grid">
                  {filteredItems.map(item => (
                    <div key={item.id} className="pl__menu-card" onClick={handleOrder}>
                      {item.image
                        ? <img className="pl__menu-img" src={item.image} alt="" loading="lazy" />
                        : <div className="pl__menu-img pl__menu-img--ph">🍽️</div>
                      }
                      <div className="pl__menu-info">
                        <p className="pl__menu-name">{safe(item.name)}</p>
                        {item.description && <p className="pl__menu-desc">{item.description}</p>}
                        <div className="pl__menu-footer">
                          <span className="pl__menu-price">${safe(String(item.price ?? 0))}</span>
                          <button className="pl__menu-add"
                            onClick={e => { e.stopPropagation(); handleOrder(); }}>+</button>
                        </div>
                      </div>
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
            <p className="pl__view-title">Account</p>
            {authUser ? (
              <div className="pl__profile-card">
                <div className="pl__avatar">
                  {safe(authUser.name?.[0], '?').toUpperCase()}
                </div>
                <p className="pl__profile-name">{safe(authUser.name)}</p>
                <p className="pl__profile-email">{safe(authUser.email)}</p>
                {points > 0 && (
                  <div className="pl__loyalty"><span>🌿</span><span>{points} loyalty points</span></div>
                )}
                <button className="pl__signout" onClick={() => { clearAuth(); setAuthUser(null); }}>Sign Out</button>
                <div style={{ margin: '12px 0 4px', borderTop: '1px solid var(--t-border, rgba(40,169,107,0.15))', width: '100%' }} />
                {[
                  { label: '✏️ Edit Profile',   path: 'edit-profile' },
                  { label: '❤️ Favorites',       path: 'favorites'   },
                  { label: '⭐ Points',           path: 'points'      },
                  { label: '🏠 Saved Addresses', path: 'address'     },
                ].map(item => (
                  <button key={item.path} className="pl__signout" style={{ marginTop: 6 }}
                    onClick={() => openWebView(clientUrl(item.path), item.label.slice(3), template.colors.primary)}>
                    {item.label}
                  </button>
                ))}
                <button className="pl__signout" style={{ marginTop: 6 }} onClick={() => setShowCustomize(true)}>
                  🎨 Customize
                </button>
                <button className="pl__signout" style={{ marginTop: 6, background: '#EF4444', color: '#fff' }}
                  onClick={() => setShowDeleteConfirm(true)}>
                  🗑️ Delete Account
                </button>
              </div>
            ) : (
              <div className="pl__login-card">
                <p className="pl__login-title">Sign In</p>
                <p className="pl__login-sub">Track orders &amp; earn rewards</p>
                {loginError && <p className="pl__login-error">{loginError}</p>}
                <form onSubmit={handleLogin}>
                  <input className="pl__input" type="email" placeholder="Email address"
                    value={loginEmail} onChange={e => setEmail(e.target.value)}
                    required autoComplete="email" />
                  <input className="pl__input" type="password" placeholder="Password"
                    value={loginPassword} onChange={e => setPassword(e.target.value)}
                    required autoComplete="current-password" />
                  <button className="pl__submit" type="submit" disabled={loginLoading}>
                    {loginLoading ? 'Signing in…' : 'Sign In'}
                  </button>
                </form>
              </div>
            )}

            <div className="pl__update-panel">
              <div className="pl__update-header">
                <span style={{ fontSize: 16 }}>
                  {updateStatus.state === 'checking' || updateStatus.state === 'downloading' ? '🔄'
                   : updateStatus.state === 'ready' ? '⬆️'
                   : updateStatus.state === 'error'  ? '❌' : '🔃'}
                </span>
                <span className="pl__update-title">App Updates</span>
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
