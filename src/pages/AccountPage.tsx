import React, { useState, useEffect } from 'react';
import { IonContent, IonHeader, IonPage, IonToolbar, IonTitle } from '@ionic/react';
import { useTemplate, TEMPLATES } from '../context/TemplateContext';
import { LOYALTY, RECENT_ORDERS } from '../config/mockData';
import { getStatus, onStatusChange, UpdateStatus } from '../services/updater';
import { isRestaurantMode, getRestaurantName } from '../services/restaurantConfig';
import { clearAuth } from '../services/authApi';
import { useHomeData } from '../context/HomeDataContext';
import './AccountPage.css';

const STATUS_ICONS: Record<string, string> = {
  Delivered: '✅', 'In Progress': '🔥', Pending: '⏳',
};

const MENU_ITEMS_ACC = [
  { icon: '✏️', label: 'Edit Profile' },
  { icon: '🛍️', label: 'My Orders' },
  { icon: '❤️', label: 'Favorites' },
  { icon: '⭐', label: 'Points' },
  { icon: '🏠', label: 'Saved Addresses' },
  { icon: '📋', label: 'Terms & Conditions' },
  { icon: '🗑️', label: 'Delete Account' },
  { icon: '🚪', label: 'Sign Out' },
];

function updateStatusLabel(s: UpdateStatus): { text: string; color: string } {
  switch (s.state) {
    case 'idle':        return { text: 'Idle', color: '#888' };
    case 'checking':    return { text: 'Checking for updates…', color: '#F5A623' };
    case 'up_to_date':  return { text: `Up to date (${s.version})`, color: '#4CAF50' };
    case 'downloading': return { text: `Downloading update ${s.from} → ${s.to}…`, color: '#2196F3' };
    case 'ready':       return { text: `Update ready (v${s.version}) — restart app to apply`, color: '#9C27B0' };
    case 'error':       return { text: `Update error: ${s.reason}`, color: '#F44336' };
  }
}

const AccountPage: React.FC<{ onSignOut?: () => void }> = ({ onSignOut }) => {
  const { template, setTemplateId } = useTemplate();
  const { data } = useHomeData();
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>(getStatus);
  const [showHistory, setShowHistory]   = useState(false);

  useEffect(() => { return onStatusChange(setUpdateStatus); }, []);

  const orders = data?.recentOrders?.length ? data.recentOrders : RECENT_ORDERS;

  const handleMenuItem = (label: string) => {
    if (label === 'Sign Out')   { clearAuth(); onSignOut?.(); }
    if (label === 'My Orders')  { setShowHistory(true); }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          {showHistory && (
            <button className="acc__back-btn" onClick={() => setShowHistory(false)}>‹ Back</button>
          )}
          <IonTitle>{showHistory ? 'My Orders' : 'Account'}</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent key={showHistory ? 'history' : 'profile'}>
        {showHistory ? (
          <>
            <div className="acc__orders">
              {orders.map((order, i) => (
                <div key={order.id} className="acc__order-card" style={{ animationDelay: `${i * 0.06}s` }}>
                  <div className="acc__order-header">
                    <span className="acc__order-id">{order.id}</span>
                    <span className="acc__order-status" style={{ color: order.color }}>
                      {STATUS_ICONS[order.status] ?? ''} {order.status}
                    </span>
                  </div>
                  <div className="acc__order-items">
                    {order.items.map((item, j) => <span key={j} className="acc__order-item">{item}</span>)}
                  </div>
                  <div className="acc__order-footer">
                    <span className="acc__order-date">{order.date}</span>
                    <span className="acc__order-total" style={{ color: template.colors.primary }}>${order.total.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ height: 32 }} />
          </>
        ) : (
          <>
            <div className="acc__profile" style={{ background: template.colors.primary }}>
              <div className="acc__avatar">JD</div>
              <h2 className="acc__name">John Doe</h2>
              <p className="acc__email">john.doe@email.com</p>
              <div className="acc__badges">
                <span className="acc__badge">{LOYALTY.tier} Member</span>
                <span className="acc__badge">{LOYALTY.points.toLocaleString()} pts</span>
              </div>
            </div>

            <div className={`acc__menu acc__menu--${template.id}`}>
              {MENU_ITEMS_ACC.map((item, i) => (
                <button
                  key={i}
                  className="acc__menu-item"
                  style={{ animationDelay: `${i * 0.04}s` }}
                  onClick={() => handleMenuItem(item.label)}
                >
                  <span className="acc__menu-icon">{item.icon}</span>
                  <span className="acc__menu-label">{item.label}</span>
                  <span className="acc__menu-arrow">›</span>
                </button>
              ))}
            </div>

            {!isRestaurantMode() && (
              <div className="acc__template-section">
                <h3 className="acc__template-title">App Template</h3>
                <div className="acc__template-grid">
                  {TEMPLATES.map(t => (
                    <button
                      key={t.id}
                      className={`acc__template-btn ${t.id === template.id ? 'active' : ''}`}
                      style={{
                        background: t.colors.bg,
                        borderColor: t.id === template.id ? t.colors.primary : 'transparent',
                      }}
                      onClick={() => setTemplateId(t.id)}
                    >
                      <span className="acc__template-emoji">{t.emoji}</span>
                      <span className="acc__template-name" style={{ color: t.colors.text }}>{t.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {isRestaurantMode() && (
              <div className="acc__restaurant-panel">
                <span className="acc__restaurant-icon">🍕</span>
                <div>
                  <p className="acc__restaurant-name">{getRestaurantName() ?? 'Restaurant App'}</p>
                  <p className="acc__restaurant-powered">Powered by Zing</p>
                </div>
              </div>
            )}

            <div className="acc__update-panel">
              <div className="acc__update-header">
                <span className="acc__update-icon">
                  {updateStatus.state === 'checking' || updateStatus.state === 'downloading' ? '🔄' :
                   updateStatus.state === 'ready' ? '✅' :
                   updateStatus.state === 'error' ? '❌' : '🔃'}
                </span>
                <span className="acc__update-title">App Updates</span>
              </div>
              <p className="acc__update-text" style={{ color: updateStatusLabel(updateStatus).color }}>
                {updateStatusLabel(updateStatus).text}
              </p>
            </div>

            <div style={{ height: 32 }} />
          </>
        )}
      </IonContent>
    </IonPage>
  );
};

export default AccountPage;
