import React from 'react';
import { IonContent, IonHeader, IonPage, IonToolbar, IonTitle, useIonViewDidEnter } from '@ionic/react';
import { useTemplate } from '../context/TemplateContext';
import { getOrderUrl } from '../services/configApi';
import { openWebView } from '../services/webviewService';
import './OrdersPage.css';

const OrdersPage: React.FC = () => {
  const { template } = useTemplate();

  useIonViewDidEnter(() => {
    const url = getOrderUrl();
    if (!url) return;
    openWebView(url, 'Place Order', template.colors.primary, () => {
      setTimeout(() => {
        const homeTab = document.querySelector('ion-tab-button[tab="home"]') as HTMLElement;
        homeTab?.click();
      }, 100);
    });
  });

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar style={{ '--background': template.colors.primary, '--color': '#fff', '--border-width': '0' } as any}>
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
