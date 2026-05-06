import React, { useState, useEffect } from 'react';
import { IonContent, IonHeader, IonPage, IonToolbar, IonTitle } from '@ionic/react';
import { useTemplate, TEMPLATES } from '../context/TemplateContext';
import { LOYALTY } from '../config/mockData';
import { getStatus, onStatusChange, UpdateStatus } from '../services/updater';
import './AccountPage.css';

const MENU_ITEMS_ACC = [
  { icon: '🏠', label: 'Saved Addresses' },
  { icon: '💳', label: 'Payment Methods' },
  { icon: '🔔', label: 'Notifications' },
  { icon: '🎁', label: 'Offers & Coupons' },
  { icon: '⭐', label: 'Rate the App' },
  { icon: '🔒', label: 'Privacy & Security' },
  { icon: '📞', label: 'Contact Support' },
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

const AccountPage: React.FC = () => {
  const { template, setTemplateId } = useTemplate();
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>(getStatus);

  useEffect(() => {
    return onStatusChange(setUpdateStatus);
  }, []);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Account</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {/* Avatar section */}
        <div className="acc__profile" style={{ background: template.colors.primary }}>
          <div className="acc__avatar">JD</div>
          <h2 className="acc__name">John Doe</h2>
          <p className="acc__email">john.doe@email.com</p>
          <div className="acc__badges">
            <span className="acc__badge">{LOYALTY.tier} Member</span>
            <span className="acc__badge">{LOYALTY.points.toLocaleString()} pts</span>
          </div>
        </div>

        {/* Menu list */}
        <div className={`acc__menu acc__menu--${template.id}`}>
          {MENU_ITEMS_ACC.map((item, i) => (
            <button key={i} className="acc__menu-item" style={{ animationDelay: `${i * 0.04}s` }}>
              <span className="acc__menu-icon">{item.icon}</span>
              <span className="acc__menu-label">{item.label}</span>
              <span className="acc__menu-arrow">›</span>
            </button>
          ))}
        </div>

        {/* Template switcher */}
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

        {/* Update status */}
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
      </IonContent>
    </IonPage>
  );
};

export default AccountPage;
