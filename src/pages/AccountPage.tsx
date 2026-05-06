import React from 'react';
import { IonContent, IonHeader, IonPage, IonToolbar, IonTitle } from '@ionic/react';
import { useTemplate, TEMPLATES } from '../context/TemplateContext';
import { LOYALTY } from '../config/mockData';
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

const AccountPage: React.FC = () => {
  const { template, setTemplateId } = useTemplate();

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

        <div style={{ height: 32 }} />
      </IonContent>
    </IonPage>
  );
};

export default AccountPage;
