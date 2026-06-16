import React, { useState, useRef, useEffect } from 'react';
import { useTemplate, TEMPLATES } from '../context/TemplateContext';
import { useHomeData } from '../context/HomeDataContext';
import { useMenuData } from '../context/MenuDataContext';
import { getSavedUser, isLoggedIn, login, saveAuth, clearAuth, getToken } from '../services/authApi';
import type { AuthUser } from '../services/authApi';
import { getOrderUrl } from '../services/configApi';
import { getRestaurantId, getRestaurantName } from '../services/restaurantConfig';
import { openWebView } from '../services/webviewService';
import { getSavedFcmToken } from '../services/fcmService';
import { checkConfigColorsOnTabSwitch } from '../services/configColorsService';
import { getStatus, onStatusChange, applyIfReady, checkOnTabSwitch } from '../services/updater';
import type { UpdateStatus } from '../services/updater';
import CustomizePage from './CustomizePage';
import './ReelApp.css';

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

type Sheet = 'none' | 'menu' | 'account';

const ITEM_GRADIENTS = [
  'linear-gradient(145deg, #1a0020, #3d0050)',
  'linear-gradient(145deg, #001a30, #003d60)',
  'linear-gradient(145deg, #1a0008, #3d0018)',
  'linear-gradient(145deg, #0a1a00, #1a3d00)',
  'linear-gradient(145deg, #1a0a00, #3d2000)',
  'linear-gradient(145deg, #00101a, #00253d)',
];

function getInitialUser(): AuthUser | null {
  return isLoggedIn() ? getSavedUser() : null;
}

const ReelApp: React.FC = () => {
  const { template, setTemplateId } = useTemplate();
  const { data: homeData }          = useHomeData();
  const { data: menuData }          = useMenuData();

  const [activeCategory, setCategory] = useState<number | null>(null);
  const [sheet, setSheet]             = useState<Sheet>('none');
  const [authUser, setAuthUser]       = useState<AuthUser | null>(getInitialUser);
  const [loginEmail, setEmail]        = useState('');
  const [loginPassword, setPassword]  = useState('');
  const [loginError, setLoginError]   = useState('');
  const [loginLoading, setLoading]    = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [showDevOptions, setShowDevOptions] = useState(false);
  const [copiedFcm, setCopiedFcm]           = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>(getStatus);
  useEffect(() => onStatusChange(setUpdateStatus), []);
  useEffect(() => {
    const handler = () => setSheet('account');
    const forceLogout = () => { setAuthUser(null); setSheet('account'); };
    window.addEventListener('zing:auth-required', handler);
    window.addEventListener('zing:force-logout', forceLogout);
    return () => {
      window.removeEventListener('zing:auth-required', handler);
      window.removeEventListener('zing:force-logout', forceLogout);
    };
  }, []);

  const feedRef        = useRef<HTMLDivElement>(null);
  const restaurantId   = getRestaurantId();
  const restaurantName = getRestaurantName();
  const allCategories  = menuData?.categories ?? [];

  const filteredItems = activeCategory
    ? (allCategories.find(c => c.id === activeCategory)?.items ?? [])
    : allCategories.flatMap(c => c.items);

  useEffect(() => {
    const el = feedRef.current;
    if (!el) return;
    const onScroll = () => { if (!hasScrolled && el.scrollTop > 20) setHasScrolled(true); };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [hasScrolled]);

  const didMountRef = useRef(false);
  useEffect(() => {
    if (!didMountRef.current) { didMountRef.current = true; return; }
    checkOnTabSwitch();
    applyIfReady();
    checkConfigColorsOnTabSwitch(restaurantId ?? '');
  }, [sheet]);

  const handleOrder = async () => {
    if (!authUser) { setSheet('account'); return; }
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

  const closeSheet = () => setSheet('none');

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
    <div className="rl">

      {/* ── Snap-scroll feed ── */}
      <div className="rl__feed" ref={feedRef}>
        {filteredItems.length === 0 ? (
          <div className="rl__empty">
            <span className="rl__empty-icon">🎬</span>
            <span>{!menuData ? 'Loading…' : 'No dishes yet'}</span>
          </div>
        ) : (
          filteredItems.map((item, i) => (
            <div key={item.id} className="rl__card">
              <div
                className="rl__card-bg"
                style={
                  item.image
                    ? { backgroundImage: `url(${item.image})` }
                    : { background: ITEM_GRADIENTS[i % ITEM_GRADIENTS.length] }
                }
              />
              <div className="rl__card-overlay" />
              <div className="rl__card-overlay-top" />

              <div className="rl__card-content">
                <h2 className="rl__card-name">{item.name}</h2>
                {item.description && (
                  <p className="rl__card-desc">{item.description}</p>
                )}
                <div className="rl__card-footer">
                  <span className="rl__card-price">${item.price}</span>
                  <button className="rl__order-btn" onClick={handleOrder}>
                    Order Now
                  </button>
                </div>
              </div>

              <div className="rl__actions">
                <button className="rl__action-btn" onClick={handleOrder}>
                  <span className="rl__action-icon">🛍️</span>
                  <span className="rl__action-label">Order</span>
                </button>
                <button className="rl__action-btn" onClick={() => setSheet('menu')}>
                  <span className="rl__action-icon">📋</span>
                  <span className="rl__action-label">Menu</span>
                </button>
                <button className="rl__action-btn" onClick={() => setSheet('account')}>
                  <span className="rl__action-icon">👤</span>
                  <span className="rl__action-label">Account</span>
                </button>
              </div>

              {i === 0 && !hasScrolled && filteredItems.length > 1 && (
                <div className="rl__scroll-hint">
                  <span className="rl__scroll-hint-text">Swipe up</span>
                  <span className="rl__scroll-hint-arrow">↓</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* ── Fixed header ── */}
      <header className="rl__header">
        <p className="rl__header-name">{restaurantName || 'Today\'s Reels'}</p>
        <button className="rl__header-btn" onClick={() => setSheet('account')}>
          👤
        </button>
      </header>

      {/* ── Category strip ── */}
      {allCategories.length > 0 && (
        <div className="rl__cats">
          <button
            className={`rl__cat-pill${activeCategory === null ? ' active' : ''}`}
            onClick={() => setCategory(null)}
          >All</button>
          {allCategories.map(cat => (
            <button
              key={cat.id}
              className={`rl__cat-pill${activeCategory === cat.id ? ' active' : ''}`}
              onClick={() => setCategory(cat.id)}
            >{cat.name}</button>
          ))}
        </div>
      )}

      {/* ── Bottom sheets ── */}
      {sheet !== 'none' && (
        <>
          <div className="rl__sheet-backdrop" onClick={closeSheet} />
          <div className="rl__sheet">
            <div className="rl__sheet-handle" />

            {sheet === 'menu' && (
              <>
                <div className="rl__sheet-head">
                  <h2 className="rl__sheet-title">Full Menu</h2>
                  <button className="rl__sheet-close" onClick={closeSheet}>✕</button>
                </div>
                <div className="rl__sheet-body">
                  {allCategories.map(cat => (
                    <div key={cat.id}>
                      <p className="rl__menu-cat-heading">{cat.name}</p>
                      {cat.items.map((item, j) => (
                        <div key={item.id} className="rl__menu-item-row" onClick={handleOrder}>
                          {item.image
                            ? <img className="rl__menu-item-thumb" src={item.image} alt={item.name} loading="lazy" />
                            : <div
                                className="rl__menu-item-no-img"
                                style={{ background: ITEM_GRADIENTS[j % ITEM_GRADIENTS.length] }}
                              >🍽️</div>
                          }
                          <div className="rl__menu-item-info">
                            <p className="rl__menu-item-name">{item.name}</p>
                            {item.description && (
                              <p className="rl__menu-item-desc">{item.description}</p>
                            )}
                          </div>
                          <span className="rl__menu-item-price">${item.price}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </>
            )}

            {sheet === 'account' && (
              <>
                <div className="rl__sheet-head">
                  <h2 className="rl__sheet-title">Account</h2>
                  <button className="rl__sheet-close" onClick={closeSheet}>✕</button>
                </div>
                <div className="rl__sheet-body">
                  <div className="rl__account-inner">
                    {authUser ? (
                      <>
                        <div className="rl__avatar">
                          {authUser.name?.[0]?.toUpperCase() ?? '?'}
                        </div>
                        <p className="rl__profile-name">{authUser.name}</p>
                        <p className="rl__profile-email">{authUser.email}</p>
                        {(homeData?.points ?? 0) > 0 && (
                          <div className="rl__loyalty-badge">
                            <span>✨</span>
                            <span>{homeData!.points} loyalty points</span>
                          </div>
                        )}
                        <button
                          className="rl__sign-out-btn"
                          onClick={() => { clearAuth(); setAuthUser(null); }}
                        >Sign Out</button>
                        <div style={{ margin: '12px 0 4px', borderTop: '1px solid rgba(255,255,255,0.15)' }} />
                        <button className="rl__sign-out-btn" style={{ marginTop: 6 }} onClick={() => openWebView(clientUrl('edit-profile'), 'Edit Profile', template.colors.primary)}>
                          ✏️ Edit Profile
                        </button>
                        <button className="rl__sign-out-btn" style={{ marginTop: 6 }} onClick={() => openWebView(clientUrl('favorites'), 'Favorites', template.colors.primary)}>
                          ❤️ Favorites
                        </button>
                        <button className="rl__sign-out-btn" style={{ marginTop: 6 }} onClick={() => openWebView(clientUrl('points'), 'Points', template.colors.primary)}>
                          ⭐ Points
                        </button>
                        <button className="rl__sign-out-btn" style={{ marginTop: 6 }} onClick={() => openWebView(clientUrl('address'), 'Saved Addresses', template.colors.primary)}>
                          🏠 Saved Addresses
                        </button>
                        {showDevOptions && (
                        <button className="rl__sign-out-btn" style={{ marginTop: 6 }} onClick={() => { closeSheet(); setShowCustomize(true); }}>
                          🎨 Customize
                        </button>
                        )}
                        <button className="rl__sign-out-btn" style={{ marginTop: 6 }}>
                          📋 Terms &amp; Conditions
                        </button>
                        <button className="rl__sign-out-btn" style={{ marginTop: 6, background: '#EF4444' }} onClick={() => setShowDeleteConfirm(true)}>
                          🗑️ Delete Account
                        </button>
                      </>
                    ) : (
                      <>
                        <p className="rl__login-heading">Sign In</p>
                        <p className="rl__login-sub">Track orders &amp; earn rewards</p>
                        {loginError && <p className="rl__login-error">{loginError}</p>}
                        <form onSubmit={handleLogin}>
                          <input
                            className="rl__input"
                            type="email"
                            placeholder="Email address"
                            value={loginEmail}
                            onChange={e => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                          />
                          <input
                            className="rl__input"
                            type="password"
                            placeholder="Password"
                            value={loginPassword}
                            onChange={e => setPassword(e.target.value)}
                            required
                            autoComplete="current-password"
                          />
                          <button className="rl__submit-btn" type="submit" disabled={loginLoading}>
                            {loginLoading ? 'Signing in…' : 'Sign In'}
                          </button>
                        </form>
                      </>
                    )}

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

                    {showDevOptions && (<>
                    <p className="rl__tmpl-label">Switch Template</p>
                    <div className="rl__tmpl-strip">
                      {TEMPLATES.map(t => (
                        <button
                          key={t.id}
                          className={`rl__tmpl-pill${t.id === template.id ? ' active' : ''}`}
                          style={{
                            background: t.colors.bg,
                            borderColor: t.id === template.id ? t.colors.primary : 'transparent',
                          }}
                          onClick={() => { setTemplateId(t.id); closeSheet(); }}
                        >
                          <span className="rl__tmpl-emoji">{t.emoji}</span>
                          <span className="rl__tmpl-name" style={{ color: t.colors.text }}>{t.name}</span>
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
              </>
            )}
          </div>
        </>
      )}
      {showCustomize && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: '#0a0a0a' }}>
          <CustomizePage onBack={() => setShowCustomize(false)} />
        </div>
      )}

      {showDeleteConfirm && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-end' }}
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            style={{ width: '100%', background: '#111', borderRadius: '16px 16px 0 0', padding: '20px 20px 32px', textAlign: 'center' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ width: 40, height: 4, background: 'rgba(255,255,255,0.3)', borderRadius: 2, margin: '0 auto 16px' }} />
            <span style={{ fontSize: 32 }}>⚠️</span>
            <h3 style={{ margin: '8px 0 4px', fontSize: 18, fontWeight: 700, color: '#fff' }}>Delete Account?</h3>
            <p style={{ margin: '0 0 16px', fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>
              This will permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <button className="rl__submit-btn" style={{ background: '#EF4444', marginBottom: 8, width: '100%' }} onClick={handleDeleteConfirmed}>
              Yes, Delete My Account
            </button>
            <button className="rl__submit-btn" style={{ background: 'rgba(255,255,255,0.15)', width: '100%' }} onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default ReelApp;
