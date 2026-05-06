import React from 'react';
import { IonContent, IonHeader, IonPage, IonToolbar, IonTitle } from '@ionic/react';
import { RECENT_ORDERS } from '../config/mockData';
import { useTemplate } from '../context/TemplateContext';
import './OrdersPage.css';

const STATUS_ICONS: Record<string, string> = {
  Delivered: '✅',
  'In Progress': '🔥',
  Pending: '⏳',
};

const OrdersPage: React.FC = () => {
  const { template } = useTemplate();

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Orders</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div className="orders__hero" style={{ background: template.colors.primary }}>
          <span className="orders__hero-icon">🛍️</span>
          <h2 className="orders__hero-title">Your Orders</h2>
          <p className="orders__hero-sub">{RECENT_ORDERS.length} orders placed</p>
        </div>

        <div className={`orders__list orders__list--${template.id}`}>
          {RECENT_ORDERS.map((order, i) => (
            <div key={order.id} className="orders__card" style={{ animationDelay: `${i * 0.07}s` }}>
              <div className="orders__card-header">
                <span className="orders__card-id">{order.id}</span>
                <span className="orders__card-status" style={{ color: order.color }}>
                  {STATUS_ICONS[order.status]} {order.status}
                </span>
              </div>
              <div className="orders__card-items">
                {order.items.map((item, j) => (
                  <span key={j} className="orders__card-item">{item}</span>
                ))}
              </div>
              <div className="orders__card-footer">
                <span className="orders__card-date">{order.date}</span>
                <span className="orders__card-total" style={{ color: template.colors.primary }}>
                  ${order.total.toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
        <div style={{ height: 24 }} />
      </IonContent>
    </IonPage>
  );
};

export default OrdersPage;
