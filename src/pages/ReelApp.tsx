import React, { useState, useRef, useEffect } from 'react';
import { useTemplate, TEMPLATES } from '../context/TemplateContext';
import { useHomeData } from '../context/HomeDataContext';
import { useMenuData } from '../context/MenuDataContext';
import { getSavedUser, isLoggedIn, login, saveAuth, clearAuth } from '../services/authApi';
import type { AuthUser } from '../services/authApi';
import { getOrderUrl } from '../services/configApi';
import { getRestaurantId, getRestaurantName } from '../services/restaurantConfig';
import { openWebView } from '../services/webviewService';
import './ReelApp.css';

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
                  <span className="rl__card-price">₹{item.price}</span>
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
                          <span className="rl__menu-item-price">₹{item.price}</span>
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
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ReelApp;
