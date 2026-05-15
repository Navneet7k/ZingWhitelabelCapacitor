import React, { useEffect } from 'react';
import { IonContent, IonHeader, IonPage, IonToolbar, IonTitle, useIonRouter } from '@ionic/react';
import { InAppBrowser } from '@capgo/inappbrowser';
import { useTemplate } from '../context/TemplateContext';
import { getOrderUrl } from '../services/configApi';
import './OrdersPage.css';

const OrdersPage: React.FC = () => {
  const { template } = useTemplate();
  const router = useIonRouter();

  useEffect(() => {
    const url = getOrderUrl();
    if (!url) return;

    InAppBrowser.openWebView({
      url,
      title: 'Place Order',
      visibleTitle: false,
      showArrow: true,
      toolbarColor: template.colors.primary,
      toolbarTextColor: '#ffffff',
    });

    const listenerPromise = InAppBrowser.addListener('closeEvent', () => {
      router.push('/home', 'back', 'replace');
    });

    return () => {
      listenerPromise.then(handle => handle.remove());
    };
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
