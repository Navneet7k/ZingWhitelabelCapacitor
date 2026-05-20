import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { initUpdater, recheckForUpdate, applyIfReady, onStatusChange, getStatus, checkOnTabSwitch } from './services/updater';
import type { UpdateStatus } from './services/updater';
import { onWebViewChange, closeWebView, hasOpenBrowsers } from './services/webviewService';

import {
  IonApp, IonIcon, IonLabel, IonRouterOutlet,
  IonTabBar, IonTabButton, IonTabs, setupIonicReact,
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Redirect, Route } from 'react-router-dom';
import { homeOutline, fastFoodOutline, listOutline, personOutline } from 'ionicons/icons';

import { TemplateProvider, useTemplate } from './context/TemplateContext';
import { ThemeCustomProvider } from './context/ThemeCustomContext';
import WebViewModal from './components/WebViewModal';
import { isLoggedIn, updateFcmToken, getToken, getSavedUser } from './services/authApi';
import { initFcm } from './services/fcmService';
import { fetchRestaurantConfig } from './services/configApi';
import { getRestaurantId } from './services/restaurantConfig';
import { HomeDataProvider } from './context/HomeDataContext';
import { MenuDataProvider } from './context/MenuDataContext';
import TemplateSelectPage from './pages/TemplateSelectPage';
import CafeApp from './pages/CafeApp';
import DynastyApp from './pages/DynastyApp';
import FloatApp from './pages/FloatApp';
import ReelApp from './pages/ReelApp';
import GroveApp from './pages/GroveApp';
import VapourApp from './pages/VapourApp';
import NoirApp from './pages/NoirApp';
import DuskApp from './pages/DuskApp';
import PiazzaApp from './pages/PiazzaApp';
import DineApp from './pages/DineApp';
import OnyxApp from './pages/OnyxApp';
import SpiceApp from './pages/SpiceApp';
import { isRestaurantMode } from './services/restaurantConfig';
import { checkConfigColorsOnTabSwitch } from './services/configColorsService';
import HomePage from './pages/HomePage';
import MenuPage from './pages/MenuPage';
import OrdersPage from './pages/OrdersPage';
import AccountPage from './pages/AccountPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import './theme/variables.css';
import './theme/templates.css';
import './theme/animations.css';
import './theme/global.css';

setupIonicReact();

class TemplateErrorBoundary extends React.Component<
  { children: React.ReactNode; onCrash: () => void },
  { crashed: boolean }
> {
  state = { crashed: false };
  static getDerivedStateFromError(): { crashed: boolean } { return { crashed: true }; }
  componentDidCatch(err: Error) { console.warn('[TemplateErrorBoundary]', err); this.props.onCrash(); }
  render() { return this.state.crashed ? null : this.props.children as React.ReactElement; }
}

const WebViewHost: React.FC = () => {
  const [webview, setWebview] = useState<{ url: string; title: string } | null>(null);
  useEffect(() => onWebViewChange(setWebview), []);
  return (
    <WebViewModal
      isOpen={!!webview}
      url={webview?.url ?? ''}
      title={webview?.title ?? ''}
      onClose={closeWebView}
    />
  );
};

// Tracks how many times we've tried to apply an update and it rolled back.
// Persists across reloads (localStorage) so the loop counter survives app restarts.
const RECOVERY_KEY = 'zing_recovery_attempts';
const MAX_RECOVERY = 3;

// Shown when the stored template isn't in the current bundle (OTA rollback scenario).
// Applies the update immediately — but only up to MAX_RECOVERY times. If every
// attempt rolls back, we stop looping and show a reset screen instead.
const PendingTemplateScreen: React.FC = () => {
  const attempts = parseInt(localStorage.getItem(RECOVERY_KEY) ?? '0', 10);
  const giveUp   = attempts >= MAX_RECOVERY;

  const [status, setStatus] = useState<UpdateStatus>(getStatus);

  useEffect(() => {
    if (giveUp) return; // too many failed attempts — don't trigger another apply
    if (getStatus().state === 'ready') {
      localStorage.setItem(RECOVERY_KEY, String(attempts + 1));
      applyIfReady();
      return;
    }
    recheckForUpdate();
    const unsub = onStatusChange(s => {
      setStatus(s);
      if (s.state === 'ready') {
        localStorage.setItem(RECOVERY_KEY, String(attempts + 1));
        applyIfReady();
      }
    });
    return unsub;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleReset = () => {
    localStorage.removeItem('zing_template');
    localStorage.removeItem(RECOVERY_KEY);
    window.location.reload();
  };

  // After MAX_RECOVERY failed attempts, let the user escape rather than loop forever
  if (giveUp) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: '100vh',
        background: '#FFF5E0', color: '#3F2D20', gap: 16,
        fontFamily: 'system-ui, sans-serif', textAlign: 'center', padding: '0 32px',
      }}>
        <p style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Update couldn't be applied</p>
        <p style={{ margin: 0, fontSize: 14, opacity: 0.6, lineHeight: 1.6 }}>
          The template update failed to install after several attempts.
        </p>
        <button
          onClick={handleReset}
          style={{
            marginTop: 8, padding: '12px 28px', borderRadius: 12,
            background: '#84BD93', color: '#fff', border: 'none',
            fontSize: 15, fontWeight: 700, cursor: 'pointer',
          }}
        >
          Reset &amp; Choose Template
        </button>
      </div>
    );
  }

  const msg = status.state === 'downloading' ? 'Downloading update…'
    : status.state === 'ready'               ? 'Applying…'
    : status.state === 'error'               ? 'Update failed — please restart the app.'
    : 'Loading your template…';

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100vh',
      background: '#FFF5E0', color: '#3F2D20', gap: 12,
      fontFamily: 'system-ui, sans-serif', textAlign: 'center', padding: '0 24px',
    }}>
      <p style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{msg}</p>
      {status.state !== 'error' && (
        <p style={{ margin: 0, fontSize: 13, opacity: 0.5 }}>
          Your selected template is on its way
        </p>
      )}
    </div>
  );
};

type AuthView = 'login' | 'register' | 'profile';

function hasValidSession(): boolean {
  if (!isLoggedIn()) return false;
  const user = getSavedUser();
  return !!(user?.id && user?.email);
}

// Module-level cache — survives Ionic remounting AccountGate on tab navigation
// but resets to null on a full app restart (WebView reload after OTA).
// This prevents clearAuth() from being called on every remount, which was
// destroying the token whenever hasValidSession() returned false transiently.
let _authView: AuthView | null = null;

const AccountGate: React.FC = () => {
  const [view, setView] = useState<AuthView>(() => {
    if (_authView !== null) return _authView;
    _authView = hasValidSession() ? 'profile' : 'login';
    return _authView;
  });

  const updateView = (v: AuthView) => { _authView = v; setView(v); };

  if (view === 'login')    return <LoginPage    onLogin={() => updateView('profile')} onRegister={() => updateView('register')} />;
  if (view === 'register') return <RegisterPage onRegister={() => updateView('profile')} onBack={() => updateView('login')} />;
  return <AccountPage onSignOut={() => updateView('login')} />;
};

const AppInner: React.FC = () => {
  const { hasSelected, template, setTemplateId, setTemplateIdMemoryOnly, isTemplateKnown } = useTemplate();
  // In restaurant mode the template is pre-set — skip the picker entirely
  const [selected, setSelected] = useState(hasSelected || isRestaurantMode());

  // Clear the recovery counter whenever the app is running normally (template known).
  // This ensures the counter resets after a successful update so future rollbacks
  // get their full MAX_RECOVERY attempts.
  useEffect(() => {
    if (isTemplateKnown) localStorage.removeItem(RECOVERY_KEY);
  }, [isTemplateKnown]);

  useEffect(() => {
    initUpdater();
    const rid = getRestaurantId();
    if (rid) fetchRestaurantConfig(rid);
    initFcm().then(token => {
      if (token) {
        const apiToken = getToken();
        if (apiToken) updateFcmToken(token, apiToken);
      }
    });

    // ── OTA auto-update lifecycle ─────────────────────────────────────────
    const IDLE_MS     = 15 * 60 * 1000; // apply after 15 min of no interaction
    const POLL_MS     = 10 * 60 * 1000; // re-check manifest every 10 min regardless
    let idleTimer: ReturnType<typeof setTimeout> | null = null;
    let lastActivity = Date.now();

    const resetActivity = () => { lastActivity = Date.now(); };

    function scheduleIdleApply() {
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        if (Date.now() - lastActivity >= IDLE_MS) {
          if (!hasOpenBrowsers()) applyIfReady();
          else scheduleIdleApply(); // browser is open — wait another cycle
        } else {
          scheduleIdleApply(); // user was active — reschedule
        }
      }, IDLE_MS);
    }

    // When a bundle finishes downloading, start the idle countdown
    const unsubStatus = onStatusChange(s => {
      if (s.state === 'ready') scheduleIdleApply();
    });

    // Periodic poll — catches releases while app stays open without any
    // tab switching or backgrounding (the previously missing trigger)
    const pollInterval = setInterval(() => recheckForUpdate(), POLL_MS);

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        // Safe to apply only when the app is genuinely backgrounded.
        // InAppBrowser opening ALSO fires hidden — guard against that case
        // because set() racing with a native browser launch causes a crash
        // identical to the close-race we fixed in v2.2.2.
        if (!hasOpenBrowsers()) applyIfReady();
      } else {
        recheckForUpdate();
      }
    };

    document.addEventListener('visibilitychange', onVisibility);
    document.addEventListener('touchstart',  resetActivity, { passive: true });
    document.addEventListener('pointermove', resetActivity, { passive: true });

    return () => {
      clearInterval(pollInterval);
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('touchstart',  resetActivity);
      document.removeEventListener('pointermove', resetActivity);
      unsubStatus();
      if (idleTimer) clearTimeout(idleTimer);
    };
  }, []);

  if (!selected) {
    return <TemplateSelectPage onSelect={() => setSelected(true)} />;
  }

  // Template was stored from a newer bundle that isn't running right now (OTA rollback).
  // Show a self-healing screen that auto-applies the update when it downloads.
  // Only triggered on native — in browser-dev the template list is always current.
  if (!isTemplateKnown && Capacitor.isNativePlatform()) {
    return <PendingTemplateScreen />;
  }

  // onCrash uses setTemplateIdMemoryOnly so a crash does NOT overwrite the user's
  // stored template choice in localStorage — it only changes the in-session state.
  if (template.id === 'brew') return <TemplateErrorBoundary onCrash={() => setTemplateIdMemoryOnly('fiesta')}><CafeApp /></TemplateErrorBoundary>;
  if (template.id === 'dynasty') return <TemplateErrorBoundary onCrash={() => setTemplateIdMemoryOnly('fiesta')}><DynastyApp /></TemplateErrorBoundary>;
  if (template.id === 'float') return <TemplateErrorBoundary onCrash={() => setTemplateIdMemoryOnly('fiesta')}><FloatApp /></TemplateErrorBoundary>;
  if (template.id === 'reel') return <TemplateErrorBoundary onCrash={() => setTemplateIdMemoryOnly('fiesta')}><ReelApp /></TemplateErrorBoundary>;
  if (template.id === 'grove') return <TemplateErrorBoundary onCrash={() => setTemplateIdMemoryOnly('fiesta')}><GroveApp /></TemplateErrorBoundary>;
  if (template.id === 'vapour') return <TemplateErrorBoundary onCrash={() => setTemplateIdMemoryOnly('fiesta')}><VapourApp /></TemplateErrorBoundary>;
  if (template.id === 'noir') return <TemplateErrorBoundary onCrash={() => setTemplateIdMemoryOnly('fiesta')}><NoirApp /></TemplateErrorBoundary>;
  if (template.id === 'dusk') return <TemplateErrorBoundary onCrash={() => setTemplateIdMemoryOnly('fiesta')}><DuskApp /></TemplateErrorBoundary>;
  if (template.id === 'piazza') return <TemplateErrorBoundary onCrash={() => setTemplateIdMemoryOnly('fiesta')}><PiazzaApp /></TemplateErrorBoundary>;
  if (template.id === 'dine')   return <TemplateErrorBoundary onCrash={() => setTemplateIdMemoryOnly('fiesta')}><DineApp /></TemplateErrorBoundary>;
  if (template.id === 'onyx')   return <TemplateErrorBoundary onCrash={() => setTemplateIdMemoryOnly('fiesta')}><OnyxApp /></TemplateErrorBoundary>;
  if (template.id === 'spice')  return <TemplateErrorBoundary onCrash={() => setTemplateIdMemoryOnly('fiesta')}><SpiceApp /></TemplateErrorBoundary>;

  return (
    <IonReactRouter>
      <IonTabs>
        <IonRouterOutlet>
          <Route exact path="/home" component={HomePage} />
          <Route exact path="/menu" component={MenuPage} />
          <Route exact path="/orders" component={OrdersPage} />
          <Route exact path="/account" component={AccountGate} />
          <Route exact path="/" render={() => <Redirect to="/home" />} />
        </IonRouterOutlet>
        <IonTabBar slot="bottom" onClick={() => { checkOnTabSwitch(); const rid = getRestaurantId(); if (rid) checkConfigColorsOnTabSwitch(rid); }}>
          <IonTabButton tab="home" href="/home">
            <IonIcon icon={homeOutline} />
            <IonLabel>Home</IonLabel>
          </IonTabButton>
          <IonTabButton tab="menu" href="/menu">
            <IonIcon icon={fastFoodOutline} />
            <IonLabel>Menu</IonLabel>
          </IonTabButton>
          <IonTabButton tab="orders" href="/orders">
            <IonIcon icon={listOutline} />
            <IonLabel>Orders</IonLabel>
          </IonTabButton>
          <IonTabButton tab="account" href="/account">
            <IonIcon icon={personOutline} />
            <IonLabel>Account</IonLabel>
          </IonTabButton>
        </IonTabBar>
      </IonTabs>
    </IonReactRouter>
  );
};

const App: React.FC = () => (
  <IonApp>
    <TemplateProvider>
      <ThemeCustomProvider>
        <HomeDataProvider>
          <MenuDataProvider>
            <AppInner />
            <WebViewHost />
          </MenuDataProvider>
        </HomeDataProvider>
      </ThemeCustomProvider>
    </TemplateProvider>
  </IonApp>
);

export default App;
