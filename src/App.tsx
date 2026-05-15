import React, { useState, useEffect } from 'react';
import { initUpdater } from './services/updater';
import {
  IonApp, IonIcon, IonLabel, IonRouterOutlet,
  IonTabBar, IonTabButton, IonTabs, setupIonicReact,
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Redirect, Route } from 'react-router-dom';
import { homeOutline, fastFoodOutline, listOutline, personOutline } from 'ionicons/icons';

import { TemplateProvider, useTemplate } from './context/TemplateContext';
import { isLoggedIn, updateFcmToken, getToken } from './services/authApi';
import { initFcm } from './services/fcmService';
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

const AccountGate: React.FC = () => {
  const [view, setView] = useState<AuthView>(() => isLoggedIn() ? 'profile' : 'login');
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
    initFcm().then(token => {
      if (token) {
        const apiToken = getToken();
        if (apiToken) updateFcmToken(token, apiToken);
      }
    });
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
        <IonTabBar slot="bottom">
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
