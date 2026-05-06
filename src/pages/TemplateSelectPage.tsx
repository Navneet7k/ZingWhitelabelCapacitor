import React from 'react';
import { IonContent, IonPage } from '@ionic/react';
import { useTemplate, TEMPLATES, TemplateId } from '../context/TemplateContext';
import './TemplateSelectPage.css';

const TemplateSelectPage: React.FC<{ onSelect: () => void }> = ({ onSelect }) => {
  const { setTemplateId } = useTemplate();

  const pick = (id: TemplateId) => {
    setTemplateId(id);
    onSelect();
  };

  return (
    <IonPage>
      <IonContent>
        <div className="tsp">
          <div className="tsp__hero">
            <h1 className="tsp__title">Choose Your Style</h1>
            <p className="tsp__sub">Select a template for your restaurant experience</p>
          </div>
          <div className="tsp__grid">
            {TEMPLATES.map((t, i) => (
              <button
                key={t.id}
                className="tsp__card"
                style={{ animationDelay: `${i * 0.08}s` }}
                onClick={() => pick(t.id)}
              >
                <div className="tsp__preview" style={{ background: t.colors.bg }}>
                  {/* Mini UI preview */}
                  <div className="tsp__preview-bar" style={{ background: t.colors.primary }} />
                  <div className="tsp__preview-img" style={{ background: `${t.colors.primary}22` }} />
                  <div className="tsp__preview-lines">
                    <div className="tsp__preview-line" style={{ background: t.colors.text, opacity: 0.7, width: '70%' }} />
                    <div className="tsp__preview-line" style={{ background: t.colors.text, opacity: 0.4, width: '50%' }} />
                    <div className="tsp__preview-pill" style={{ background: t.colors.primary }} />
                  </div>
                </div>
                <div className="tsp__card-body">
                  <div className="tsp__card-top">
                    <span className="tsp__emoji">{t.emoji}</span>
                    <span className="tsp__name">{t.name}</span>
                  </div>
                  <p className="tsp__tagline">{t.tagline}</p>
                  <div className="tsp__swatches">
                    {[t.colors.bg, t.colors.primary, t.colors.accent].map((c, j) => (
                      <span key={j} className="tsp__swatch" style={{ background: c, border: c === '#FAF8F5' || c === '#F8FFF9' || c === '#FFF9F0' ? '1px solid #ddd' : 'none' }} />
                    ))}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default TemplateSelectPage;
