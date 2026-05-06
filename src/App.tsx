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
import TemplateSelectPage from './pages/TemplateSelectPage';
import HomePage from './pages/HomePage';
import MenuPage from './pages/MenuPage';
import OrdersPage from './pages/OrdersPage';
import AccountPage from './pages/AccountPage';

import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import './theme/variables.css';
import './theme/templates.css';
import './theme/animations.css';
import './theme/global.css';

setupIonicReact();

const AppInner: React.FC = () => {
  const { hasSelected } = useTemplate();
  const [selected, setSelected] = useState(hasSelected);

  // Check for OTA updates once on launch — runs silently in background
  useEffect(() => { initUpdater(); }, []);

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
          <Route exact path="/account" component={AccountPage} />
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
      <AppInner />
    </TemplateProvider>
  </IonApp>
);

export default App;
