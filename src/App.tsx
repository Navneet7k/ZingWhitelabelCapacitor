import React, { useState, useEffect } from 'react';
import { initUpdater, recheckForUpdate, applyIfReady, onStatusChange, checkOnTabSwitch } from './services/updater';
import { hasOpenBrowsers } from './services/webviewService';
import {
  IonApp, IonIcon, IonLabel, IonRouterOutlet,
  IonTabBar, IonTabButton, IonTabs, setupIonicReact,
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Redirect, Route } from 'react-router-dom';
import { homeOutline, fastFoodOutline, listOutline, personOutline } from 'ionicons/icons';

import { TemplateProvider, useTemplate } from './context/TemplateContext';
import { isLoggedIn, updateFcmToken, getToken, getSavedUser, clearAuth } from './services/authApi';
import { initFcm } from './services/fcmService';
import { fetchRestaurantConfig } from './services/configApi';
import { getRestaurantId } from './services/restaurantConfig';
import { HomeDataProvider } from './context/HomeDataContext';
import { MenuDataProvider } from './context/MenuDataContext';
import TemplateSelectPage from './pages/TemplateSelectPage';
import { isRestaurantMode } from './services/restaurantConfig';
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

type AuthView = 'login' | 'register' | 'profile';

function hasValidSession(): boolean {
  if (!isLoggedIn()) return false;
  const user = getSavedUser();
  // Require a real server-issued user object (id + email) — guards against
  // partially-restored Android Auto Backup state or stale localStorage.
  return !!(user?.id && user?.email);
}

const AccountGate: React.FC = () => {
  const [view, setView] = useState<AuthView>(() => {
    if (hasValidSession()) return 'profile';
    clearAuth(); // wipe any partial/stale auth data before showing login
    return 'login';
  });
  if (view === 'login')    return <LoginPage    onLogin={() => setView('profile')} onRegister={() => setView('register')} />;
  if (view === 'register') return <RegisterPage onRegister={() => setView('profile')} onBack={() => setView('login')} />;
  return <AccountPage onSignOut={() => setView('login')} />;
};

const AppInner: React.FC = () => {
  const { hasSelected } = useTemplate();
  // In restaurant mode the template is pre-set — skip the picker entirely
  const [selected, setSelected] = useState(hasSelected || isRestaurantMode());

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
          applyIfReady();
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
      if (document.visibilityState === 'visible') {
        // webviewService handles applyIfReady() via closeEvent when a managed browser
        // closes. Only call it here for true app-foreground events (lock screen unlock,
        // app switcher return) where no InAppBrowser is involved.
        if (!hasOpenBrowsers()) applyIfReady();
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
        <IonTabBar slot="bottom" onClick={() => checkOnTabSwitch()}>
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
      <HomeDataProvider>
        <MenuDataProvider>
          <AppInner />
        </MenuDataProvider>
      </HomeDataProvider>
    </TemplateProvider>
  </IonApp>
);

export default App;
