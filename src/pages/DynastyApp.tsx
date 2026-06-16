import React, { useState, useRef, useEffect } from 'react';
import { useTemplate, TEMPLATES } from '../context/TemplateContext';
import { useHomeData } from '../context/HomeDataContext';
import { useMenuData } from '../context/MenuDataContext';
import { getSavedUser, isLoggedIn, login, saveAuth, clearAuth, getToken } from '../services/authApi';
import type { AuthUser } from '../services/authApi';
import { getOrderUrl } from '../services/configApi';
import { getRestaurantId, getRestaurantName, isDebugTemplateMode, setDebugTemplateMode } from '../services/restaurantConfig';
import { openWebView } from '../services/webviewService';
import { getSavedFcmToken } from '../services/fcmService';
import { checkConfigColorsOnTabSwitch } from '../services/configColorsService';
import { getStatus, onStatusChange, applyIfReady, checkOnTabSwitch } from '../services/updater';
import type { UpdateStatus } from '../services/updater';
import CustomizePage from './CustomizePage';
import './DynastyApp.css';

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

function getInitialUser(): AuthUser | null {
  if (!isLoggedIn()) return null;
  return getSavedUser();
}

function timeGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return '早上好  ·  Good Morning';
  if (h < 17) return '下午好  ·  Good Afternoon';
  if (h < 21) return '晚上好  ·  Good Evening';
  return '夜深了  ·  Good Night';
}

const DynastyApp: React.FC = () => {
  const { template, setTemplateId } = useTemplate();
  const { data: homeData } = useHomeData();
  const { data: menuData } = useMenuData();

  const [sheetOpen, setSheetOpen]           = useState(false);
  const [sheetTab, setSheetTab]             = useState<'nav' | 'orders' | 'account'>('nav');
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [authUser, setAuthUser]             = useState<AuthUser | null>(getInitialUser);
  const [loginEmail, setLoginEmail]         = useState('');
  const [loginPassword, setLoginPassword]   = useState('');
  const [loginError, setLoginError]         = useState('');
  const [loginLoading, setLoginLoading]     = useState(false);
  const [showCustomize, setShowCustomize]   = useState(false);
  const [showDevOptions, setShowDevOptions] = useState(false);
  const [copiedFcm, setCopiedFcm]           = useState(false);
  const [debugMode, setDebugMode]           = useState(isDebugTemplateMode);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>(getStatus);
  useEffect(() => onStatusChange(setUpdateStatus), []);
  useEffect(() => {
    const handler = () => { setSheetTab('account'); setSheetOpen(true); };
    const forceLogout = () => { setAuthUser(null); setSheetTab('account'); setSheetOpen(true); };
    window.addEventListener('zing:auth-required', handler);
    window.addEventListener('zing:force-logout', forceLogout);
    return () => {
      window.removeEventListener('zing:auth-required', handler);
      window.removeEventListener('zing:force-logout', forceLogout);
    };
  }, []);

  const menuRef = useRef<HTMLElement>(null);

  const restaurantId   = getRestaurantId();
  const restaurantName = getRestaurantName();
  const greeting       = timeGreeting();

  const heroImage     = homeData?.banners[0]?.image || homeData?.popularDishes[0]?.image;
  const allCategories = menuData?.categories ?? [];

  const visibleItems = activeCategory
    ? (allCategories.find(c => c.id === activeCategory)?.items ?? [])
    : allCategories.flatMap(c => c.items);

  // Group items by category for "All" view so we get category headers
  const groupedSections = activeCategory
    ? [{ id: activeCategory, name: allCategories.find(c => c.id === activeCategory)?.name ?? '', items: visibleItems }]
    : allCategories.filter(c => c.items.length > 0);

  const didMountRef = useRef(false);
  useEffect(() => {
    if (!didMountRef.current) { didMountRef.current = true; return; }
    checkOnTabSwitch();
    applyIfReady();
    checkConfigColorsOnTabSwitch(restaurantId ?? '');
  }, [sheetTab]);

  const handleOrder = async () => {
    if (!authUser) {
      setSheetTab('account');
      setSheetOpen(true);
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

  const openSheet = (tab: 'nav' | 'orders' | 'account') => {
    setSheetTab(tab);
    setSheetOpen(true);
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
    <div className="dyn">

      {/* ── Top bar ─────────────────────────────── */}
      <header className="dyn__topbar">
        <button className="dyn__lantern-btn" onClick={() => openSheet('nav')} aria-label="Menu">
          <span className="dyn__lantern">🏮</span>
        </button>
        <h1 className="dyn__topbar-name">{restaurantName || 'Dynasty'}</h1>
        <button className="dyn__order-pill" onClick={handleOrder}>
          Order <span>→</span>
        </button>
      </header>

      {/* ── Hero ────────────────────────────────── */}
      <section
        className="dyn__hero"
        style={heroImage ? { backgroundImage: `url(${heroImage})` } : {}}
      >
        <div className="dyn__hero-veil">
          <div className="dyn__hero-glow" />
          <p className="dyn__greeting">{greeting}</p>
          <h2 className="dyn__hero-title">{restaurantName || 'Imperial Feast'}</h2>
          <p className="dyn__hero-sub">Authentic flavours, timeless traditions</p>
          <button className="dyn__hero-cta" onClick={handleOrder}>
            Begin Your Order
          </button>
        </div>
      </section>

      {/* ── Category tabs ───────────────────────── */}
      {allCategories.length > 0 && (
        <div className="dyn__cats-wrap">
          <div className="dyn__cats">
            <button
              className={`dyn__cat${activeCategory === null ? ' active' : ''}`}
              onClick={() => setActiveCategory(null)}
            >
              <span className="dyn__cat-name">All</span>
            </button>
            {allCategories.map(cat => (
              <button
                key={cat.id}
                className={`dyn__cat${activeCategory === cat.id ? ' active' : ''}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                <span className="dyn__cat-name">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Menu list ───────────────────────────── */}
      <section className="dyn__menu" ref={menuRef}>
        {groupedSections.length === 0 ? (
          <p className="dyn__empty">{!menuData ? 'Loading…' : 'No items found'}</p>
        ) : (
          groupedSections.map((section, si) => (
            <div key={section.id} className="dyn__section" style={{ animationDelay: `${si * 0.06}s` }}>
              <div className="dyn__section-header">
                <span className="dyn__section-ornament">✦</span>
                <span className="dyn__section-name">{section.name}</span>
                <span className="dyn__section-ornament">✦</span>
              </div>
              {section.items.map((item, idx) => (
                <div
                  key={item.id}
                  className="dyn__item"
                  style={{ animationDelay: `${si * 0.06 + idx * 0.04}s` }}
                  onClick={handleOrder}
                >
                  {item.image && (
                    <img className="dyn__item-img" src={item.image} alt={item.name} loading="lazy" />
                  )}
                  <div className="dyn__item-body">
                    <p className="dyn__item-name">{item.name}</p>
                    {item.description && (
                      <p className="dyn__item-desc">{item.description}</p>
                    )}
                  </div>
                  <div className="dyn__item-right">
                    <span className="dyn__item-price">${item.price}</span>
                    <button
                      className="dyn__item-add"
                      onClick={e => { e.stopPropagation(); handleOrder(); }}
                      aria-label={`Add ${item.name}`}
                    >+</button>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </section>

      <div className="dyn__bottom-pad" />

      {/* ── Fixed order bar ─────────────────────── */}
      <div className="dyn__order-bar">
        <button className="dyn__order-bar-btn" onClick={handleOrder}>
          <span>🛍️</span>
          <span>Place Order</span>
          <span className="dyn__order-bar-arrow">→</span>
        </button>
      </div>

      {/* ── Bottom Sheet ────────────────────────── */}
      {sheetOpen && (
        <div className="dyn__sheet-overlay" onClick={() => setSheetOpen(false)}>
          <div className="dyn__sheet" onClick={e => e.stopPropagation()}>
            <div className="dyn__sheet-handle" />

            {/* Profile row */}
            <div className="dyn__sheet-profile">
              <div className="dyn__sheet-avatar">
                {authUser ? (authUser.name?.[0]?.toUpperCase() ?? '?') : '🏮'}
              </div>
              <div className="dyn__sheet-profile-text">
                <p className="dyn__sheet-username">
                  {authUser ? authUser.name : 'Hello, Guest'}
                </p>
                <p
                  className="dyn__sheet-useremail"
                  style={!authUser ? { cursor: 'pointer' } : {}}
                  onClick={!authUser ? () => setSheetTab('account') : undefined}
                >
                  {authUser ? authUser.email : 'Sign in →'}
                </p>
              </div>
            </div>

            <div className="dyn__sheet-divider" />

            {/* Tab switcher */}
            <div className="dyn__sheet-tabs">
              <button
                className={`dyn__sheet-tab${sheetTab === 'nav' ? ' active' : ''}`}
                onClick={() => setSheetTab('nav')}
              >Menu</button>
              <button
                className={`dyn__sheet-tab${sheetTab === 'orders' ? ' active' : ''}`}
                onClick={() => setSheetTab('orders')}
              >Orders</button>
              <button
                className={`dyn__sheet-tab${sheetTab === 'account' ? ' active' : ''}`}
                onClick={() => setSheetTab('account')}
              >Account</button>
            </div>

            {/* Nav tab */}
            {sheetTab === 'nav' && (
              <nav className="dyn__sheet-nav">
                <button className="dyn__sheet-nav-item" onClick={() => { setSheetOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                  <span>🏠</span><span>Home</span>
                </button>
                <button className="dyn__sheet-nav-item" onClick={() => { setSheetOpen(false); setTimeout(() => menuRef.current?.scrollIntoView({ behavior: 'smooth' }), 80); }}>
                  <span>📋</span><span>View Menu</span>
                </button>
                <button className="dyn__sheet-nav-item" onClick={() => { setSheetOpen(false); handleOrder(); }}>
                  <span>🛍️</span><span>Place Order</span>
                </button>
                <button className="dyn__sheet-nav-item" onClick={() => setSheetTab('orders')}>
                  <span>📦</span><span>My Orders</span>
                </button>
              </nav>
            )}

            {/* Orders tab */}
            {sheetTab === 'orders' && (
              <div className="dyn__sheet-orders">
                {(homeData?.recentOrders?.length ?? 0) > 0 ? (
                  homeData!.recentOrders.slice(0, 5).map(order => (
                    <div key={order.id} className="dyn__sheet-order-row">
                      <div className="dyn__sheet-order-detail">
                        <p className="dyn__sheet-order-id">{order.id}</p>
                        <p className="dyn__sheet-order-date">{order.date}</p>
                      </div>
                      <div className="dyn__sheet-order-right">
                        <p className="dyn__sheet-order-total">${order.total}</p>
                        <p className="dyn__sheet-order-status" style={{ color: order.color }}>{order.status}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="dyn__sheet-empty">No orders so far. Place your first order!</p>
                )}
                <button className="dyn__sheet-cta" onClick={() => { setSheetOpen(false); handleOrder(); }}>
                  Place New Order
                </button>
              </div>
            )}

            {/* Account tab */}
            {sheetTab === 'account' && (
              <div className="dyn__sheet-account">
                {authUser ? (
                  <div className="dyn__sheet-profile-view">
                    <div className="dyn__sheet-big-avatar">
                      {authUser.name?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <p className="dyn__sheet-profile-name">{authUser.name}</p>
                    <p className="dyn__sheet-profile-email">{authUser.email}</p>
                    {(homeData?.points ?? 0) > 0 && (
                      <div className="dyn__sheet-loyalty">
                        <span>✨</span>
                        <span>{homeData!.points} loyalty points</span>
                      </div>
                    )}
                    <button className="dyn__sheet-signout" onClick={() => { clearAuth(); setAuthUser(null); setSheetOpen(false); }}>
                      Sign Out
                    </button>
                    <div className="dyn__sheet-divider" />
                    <button className="dyn__sheet-nav-item" onClick={() => { openWebView(clientUrl('edit-profile'), 'Edit Profile', template.colors.primary); }}>
                      <span>✏️</span><span>Edit Profile</span>
                    </button>
                    <button className="dyn__sheet-nav-item" onClick={() => { openWebView(clientUrl('favorites'), 'Favorites', template.colors.primary); }}>
                      <span>❤️</span><span>Favorites</span>
                    </button>
                    <button className="dyn__sheet-nav-item" onClick={() => { openWebView(clientUrl('points'), 'Points', template.colors.primary); }}>
                      <span>⭐</span><span>Points</span>
                    </button>
                    <button className="dyn__sheet-nav-item" onClick={() => { openWebView(clientUrl('address'), 'Saved Addresses', template.colors.primary); }}>
                      <span>🏠</span><span>Saved Addresses</span>
                    </button>
                    {showDevOptions && (
                    <button className="dyn__sheet-nav-item" onClick={() => { setSheetOpen(false); setShowCustomize(true); }}>
                      <span>🎨</span><span>Customize</span>
                    </button>
                    )}
                    <button className="dyn__sheet-nav-item">
                      <span>📋</span><span>Terms &amp; Conditions</span>
                    </button>
                    <button className="dyn__sheet-nav-item" onClick={() => setShowDeleteConfirm(true)}>
                      <span>🗑️</span><span>Delete Account</span>
                    </button>
                  </div>
                ) : (
                  <div className="dyn__sheet-login">
                    <p className="dyn__sheet-login-sub">Sign in to track orders &amp; earn rewards</p>
                    {loginError && <p className="dyn__sheet-error">{loginError}</p>}
                    <form onSubmit={handleLogin} className="dyn__sheet-form">
                      <input
                        className="dyn__sheet-input"
                        type="email"
                        placeholder="Email address"
                        value={loginEmail}
                        onChange={e => setLoginEmail(e.target.value)}
                        required
                        autoComplete="email"
                      />
                      <input
                        className="dyn__sheet-input"
                        type="password"
                        placeholder="Password"
                        value={loginPassword}
                        onChange={e => setLoginPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                      />
                      <button className="dyn__sheet-cta" type="submit" disabled={loginLoading}>
                        {loginLoading ? 'Signing in…' : 'Sign In'}
                      </button>
                    </form>
                  </div>
                )}
              </div>
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

            {/* Template switcher — always visible */}
            {showDevOptions && (<>
            <div className="dyn__sheet-divider" />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0 16px 12px', padding: '12px 14px', background: 'rgba(128,128,128,0.12)', borderRadius: 12 }}>
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--t-text)' }}>Set Debug Template</p>
                <p style={{ margin: '3px 0 0', fontSize: 11, color: 'var(--t-text-muted)', opacity: 0.8 }}>{debugMode ? 'Locked — backend won\'t override' : 'Backend controls on tab switch'}</p>
              </div>
              <div onClick={() => { const next = !debugMode; setDebugTemplateMode(next); setDebugMode(next); }} style={{ width: 44, height: 24, borderRadius: 12, background: debugMode ? template.colors.primary : '#666', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0, marginLeft: 12 }}>
                <span style={{ position: 'absolute', top: 2, left: debugMode ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', display: 'block' }} />
              </div>
            </div>
            <p className="dyn__sheet-section-label">Switch Template</p>
            <div className="dyn__template-strip">
              {TEMPLATES.map(t => (
                <button
                  key={t.id}
                  className={`dyn__template-pill${t.id === template.id ? ' active' : ''}`}
                  style={{
                    background: t.colors.bg,
                    borderColor: t.id === template.id ? t.colors.primary : 'transparent',
                  }}
                  onClick={() => { setTemplateId(t.id); setSheetOpen(false); }}
                >
                  <span className="dyn__template-pill-emoji">{t.emoji}</span>
                  <span className="dyn__template-pill-name" style={{ color: t.colors.text }}>{t.name}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => { const t = getSavedFcmToken(); if (!t) return; navigator.clipboard.writeText(t).then(() => { setCopiedFcm(true); setTimeout(() => setCopiedFcm(false), 2000); }); }}
              style={{ display: 'block', width: 'calc(100% - 32px)', margin: '8px 16px 0', padding: '12px', border: '1px solid rgba(128,128,128,0.25)', borderRadius: 12, background: 'rgba(128,128,128,0.1)', color: 'inherit', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
            >{copiedFcm ? '✅ Copied!' : getSavedFcmToken() ? '📋 Copy FCM Token' : 'Token not available'}</button>
            </>)}

          </div>
        </div>
      )}

      {showCustomize && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: '#fff' }}>
          <CustomizePage onBack={() => setShowCustomize(false)} />
        </div>
      )}

      {showDeleteConfirm && (
        <div className="dyn__sheet-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="dyn__sheet" onClick={e => e.stopPropagation()}>
            <div className="dyn__sheet-handle" />
            <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
              <span style={{ fontSize: 32 }}>⚠️</span>
              <h3 style={{ margin: '8px 0 4px', fontSize: 18, fontWeight: 700 }}>Delete Account?</h3>
              <p style={{ margin: '0 0 16px', fontSize: 14, color: '#888' }}>
                This will permanently delete your account and all associated data. This action cannot be undone.
              </p>
            </div>
            <button className="dyn__sheet-cta" style={{ background: '#EF4444', marginBottom: 8 }} onClick={handleDeleteConfirmed}>
              Yes, Delete My Account
            </button>
            <button className="dyn__sheet-cta" style={{ background: '#aaa' }} onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default DynastyApp;
