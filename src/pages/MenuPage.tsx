import React, { useState } from 'react';
import { IonContent, IonHeader, IonPage, IonToolbar, IonTitle } from '@ionic/react';
import { MENU_ITEMS, MENU_CATEGORIES } from '../config/mockData';
import { useTemplate } from '../context/TemplateContext';
import './MenuPage.css';

const MenuPage: React.FC = () => {
  const { template } = useTemplate();
  const [activeCategory, setActiveCategory] = useState('All');
  const filtered = activeCategory === 'All' ? MENU_ITEMS : MENU_ITEMS.filter(i => i.category === activeCategory);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Menu</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {/* Category filter */}
        <div className="menu__cats">
          {MENU_CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`menu__cat-btn ${cat === activeCategory ? 'active' : ''}`}
              style={cat === activeCategory ? { background: template.colors.primary, color: '#fff', borderColor: template.colors.primary } : {}}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Items */}
        <div className={`menu__list menu__list--${template.id}`}>
          {filtered.map((item, i) => (
            <div key={item.id} className="menu__item" style={{ animationDelay: `${i * 0.06}s` }}>
              <img src={item.image} alt={item.name} className="menu__item-img" />
              <div className="menu__item-body">
                <span className="menu__item-cat">{item.category}</span>
                <h3 className="menu__item-name">{item.name}</h3>
                <p className="menu__item-desc">{item.desc}</p>
                <div className="menu__item-row">
                  <span className="menu__item-price" style={{ color: template.colors.primary }}>
                    ${item.price.toFixed(2)}
                  </span>
                  <button className="menu__item-add" style={{ background: template.colors.primary }}>
                    Add +
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ height: 24 }} />
      </IonContent>
    </IonPage>
  );
};

export default MenuPage;
