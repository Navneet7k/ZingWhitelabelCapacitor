import React, { useEffect, useRef } from 'react';
import { IonContent, IonHeader, IonPage, IonToolbar, IonTitle, useIonViewDidEnter } from '@ionic/react';
import { InAppBrowser } from '@capgo/inappbrowser';
import type { PluginListenerHandle } from '@capacitor/core';
import { useTemplate } from '../context/TemplateContext';
import { getOrderUrl } from '../services/configApi';
import './OrdersPage.css';

const OrdersPage: React.FC = () => {
  const { template } = useTemplate();
  const listenerRef = useRef<PluginListenerHandle | null>(null);

  useIonViewDidEnter(() => {
    const url = getOrderUrl();
    if (!url) return;

    listenerRef.current?.remove();

    InAppBrowser.openWebView({
      url,
      title: 'Place Order',
      visibleTitle: false,
      showArrow: true,
      toolbarColor: template.colors.primary,
      toolbarTextColor: '#ffffff',
    });

    InAppBrowser.addListener('closeEvent', () => {
      setTimeout(() => {
        const homeTab = document.querySelector('ion-tab-button[tab="home"]') as HTMLElement;
        homeTab?.click();
      }, 100);
    }).then(handle => { listenerRef.current = handle; });
  });

  useEffect(() => {
    return () => { listenerRef.current?.remove(); };
  }, []);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Orders</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div className="orders__placeholder">
          <span className="orders__placeholder-icon" style={{ color: template.colors.primary }}>🛍️</span>
          <p className="orders__placeholder-text">Opening your orders…</p>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default OrdersPage;
