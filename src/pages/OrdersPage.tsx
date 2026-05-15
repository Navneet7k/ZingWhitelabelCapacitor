import React, { useEffect } from 'react';
import { IonContent, IonHeader, IonPage, IonToolbar, IonTitle } from '@ionic/react';
import { Browser } from '@capacitor/browser';
import { useTemplate } from '../context/TemplateContext';
import { getOrderUrl } from '../services/configApi';
import './OrdersPage.css';

const OrdersPage: React.FC = () => {
  const { template } = useTemplate();

  useEffect(() => {
    const url = getOrderUrl();
    if (url) Browser.open({ url, presentationStyle: 'fullscreen' });
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
