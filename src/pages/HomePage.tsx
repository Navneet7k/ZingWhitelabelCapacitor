import React, { useState } from 'react';
import {
  IonContent, IonHeader, IonPage, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon,
} from '@ionic/react';
import { cartOutline, searchOutline, reorderThreeOutline } from 'ionicons/icons';
import { useTemplate, TEMPLATES } from '../context/TemplateContext';
import { getRestaurantLogo } from '../services/configApi';
import { getRestaurantName } from '../services/restaurantConfig';
import BannerSection from '../components/home/BannerSection';
import LoyaltySection from '../components/home/LoyaltySection';
import PopularDishesSection from '../components/home/PopularDishesSection';
import RecentOrdersSection from '../components/home/RecentOrdersSection';
import GallerySection from '../components/home/GallerySection';
import './HomePage.css';

const HomePage: React.FC = () => {
  const { template, setTemplateId } = useTemplate();
  const [showPicker, setShowPicker] = useState(false);
  const logoUrl = getRestaurantLogo();
  const appName = getRestaurantName() ?? 'Zing';

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>
            {logoUrl
              ? <img src={logoUrl} alt={appName} className="home__toolbar-logo" />
              : <>{template.emoji} {appName}</>
            }
          </IonTitle>
          <IonButtons slot="start">
            <IonButton onClick={() => setShowPicker(s => !s)}>
              <IonIcon icon={reorderThreeOutline} />
            </IonButton>
          </IonButtons>
          <IonButtons slot="end">
            <IonButton><IonIcon icon={searchOutline} /></IonButton>
            <IonButton><IonIcon icon={cartOutline} /></IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      {showPicker && (
        <div className="home-template-picker">
          {TEMPLATES.map(t => (
            <button
              key={t.id}
              className={`home-tp-btn ${t.id === template.id ? 'active' : ''}`}
              style={{
                borderColor: t.id === template.id ? t.colors.primary : 'transparent',
                background: t.colors.bg,
              }}
              onClick={() => { setTemplateId(t.id); setShowPicker(false); }}
            >
              <span style={{ fontSize: 18 }}>{t.emoji}</span>
              <span style={{ fontSize: 10, color: t.colors.text, fontFamily: 'sans-serif' }}>{t.name}</span>
            </button>
          ))}
        </div>
      )}

      <IonContent>
        <BannerSection />
        <LoyaltySection />
        <PopularDishesSection />
        <RecentOrdersSection />
        <GallerySection />
        <div style={{ height: 32 }} />
      </IonContent>
    </IonPage>
  );
};

export default HomePage;
