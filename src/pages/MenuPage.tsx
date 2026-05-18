import React, { useState, useMemo } from 'react';
import { IonContent, IonHeader, IonPage, IonToolbar, IonTitle } from '@ionic/react';
import { MENU_ITEMS, MENU_CATEGORIES } from '../config/mockData';
import { useTemplate } from '../context/TemplateContext';
import { useMenuData } from '../context/MenuDataContext';
import type { MenuItem, MenuCategory } from '../services/menuApi';
import './MenuPage.css';

// ── Mock fallback ──────────────────────────────────────────────────────────────
const MOCK_CATEGORIES: MenuCategory[] = MENU_CATEGORIES
  .filter(c => c !== 'All')
  .map((name, i) => ({
    id: i + 1,
    name,
    items: MENU_ITEMS
      .filter(m => m.category === name)
      .map(m => ({
        id: m.id,
        name: m.name,
        description: m.desc,
        price: m.price,
        categoryId: i + 1,
        image: m.image,
      })),
  }));

const MenuPage: React.FC = () => {
  const { template } = useTemplate();
  const { data }     = useMenuData();
  const primary      = template.colors.primary;

  const categories  = data?.categories.length ? data.categories : MOCK_CATEGORIES;
  const groups      = data?.groups ?? [];
  const isGroupMode = data?.isGroupMode ?? false;

  const [activeGroupId,    setActiveGroupId]    = useState<number | null>(null);
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);

  const visibleCategories = useMemo(() => {
    if (!isGroupMode || activeGroupId === null) return categories;
    const group = groups.find(g => g.id === activeGroupId);
    if (!group) return categories;
    return categories.filter(c => group.categoryIds.includes(c.id));
  }, [isGroupMode, activeGroupId, groups, categories]);

  const resolvedCategoryId = activeCategoryId !== null &&
    visibleCategories.some(c => c.id === activeCategoryId)
    ? activeCategoryId
    : null;

  const items: MenuItem[] = useMemo(() => {
    return resolvedCategoryId === null
      ? visibleCategories.flatMap(c => c.items)
      : (visibleCategories.find(c => c.id === resolvedCategoryId)?.items ?? []);
  }, [visibleCategories, resolvedCategoryId]);

  const handleGroupSelect = (id: number) => {
    setActiveGroupId(prev => prev === id ? null : id);
    setActiveCategoryId(null);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar style={{ '--background': primary, '--color': '#fff', '--border-width': '0' } as any}>
          <IonTitle>Menu</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>

        {/* Group pills — only in group mode */}
        {isGroupMode && groups.length > 0 && (
          <div className="menu__cats menu__groups">
            {groups.map(g => (
              <button
                key={g.id}
                className={`menu__cat-btn ${g.id === activeGroupId ? 'active' : ''}`}
                style={g.id === activeGroupId
                  ? { background: primary, color: '#fff', borderColor: primary }
                  : {}}
                onClick={() => handleGroupSelect(g.id)}
              >
                {g.name}
              </button>
            ))}
          </div>
        )}

        {/* Category pills */}
        <div className="menu__cats">
          <button
            className={`menu__cat-btn ${resolvedCategoryId === null ? 'active' : ''}`}
            style={resolvedCategoryId === null
              ? { background: primary, color: '#fff', borderColor: primary }
              : {}}
            onClick={() => setActiveCategoryId(null)}
          >
            All
          </button>
          {visibleCategories.map(cat => (
            <button
              key={cat.id}
              className={`menu__cat-btn ${cat.id === resolvedCategoryId ? 'active' : ''}`}
              style={cat.id === resolvedCategoryId
                ? { background: primary, color: '#fff', borderColor: primary }
                : {}}
              onClick={() => setActiveCategoryId(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Items */}
        <div className={`menu__list menu__list--${template.id}`}>
          {items.map((item, i) => (
            <div key={item.id} className="menu__item" style={{ animationDelay: `${i * 0.06}s` }}>
              {item.image
                ? <img src={item.image} alt={item.name} className="menu__item-img" />
                : <div className="menu__item-img menu__item-img--placeholder" />
              }
              <div className="menu__item-body">
                <span className="menu__item-cat">
                  {categories.find(c => c.id === item.categoryId)?.name ?? ''}
                </span>
                <h3 className="menu__item-name">{item.name}</h3>
                {item.description
                  ? <p className="menu__item-desc">{item.description}</p>
                  : null
                }
                <div className="menu__item-row">
                  <span className="menu__item-price" style={{ color: primary }}>
                    ${item.price.toFixed(2)}
                  </span>
                  <button className="menu__item-add" style={{ background: primary }}>
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
