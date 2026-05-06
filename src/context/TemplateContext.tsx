import React, { createContext, useContext, useState, useEffect } from 'react';

export type TemplateId = 'luxe' | 'fresh' | 'street' | 'zen' | 'fiesta';

export interface Template {
  id: TemplateId;
  name: string;
  tagline: string;
  emoji: string;
  colors: { bg: string; primary: string; accent: string; text: string };
}

export const TEMPLATES: Template[] = [
  {
    id: 'luxe',
    name: 'Luxe',
    tagline: 'Fine dining elegance',
    emoji: '✦',
    colors: { bg: '#0D0D0D', primary: '#C9A84C', accent: '#F5F0E8', text: '#F5F0E8' },
  },
  {
    id: 'fresh',
    name: 'Fresh',
    tagline: 'Modern & vibrant',
    emoji: '🌿',
    colors: { bg: '#F8FFF9', primary: '#00B87C', accent: '#FF6B35', text: '#1A1A1A' },
  },
  {
    id: 'street',
    name: 'Street',
    tagline: 'Urban street food',
    emoji: '⚡',
    colors: { bg: '#111111', primary: '#FFD600', accent: '#FF3B30', text: '#FFFFFF' },
  },
  {
    id: 'zen',
    name: 'Zen',
    tagline: 'Minimal & serene',
    emoji: '○',
    colors: { bg: '#FAF8F5', primary: '#5C3D2E', accent: '#8B6B4A', text: '#2D2D2D' },
  },
  {
    id: 'fiesta',
    name: 'Fiesta',
    tagline: 'Bold & festive',
    emoji: '🎉',
    colors: { bg: '#FFF9F0', primary: '#FF6B6B', accent: '#4ECDC4', text: '#292F36' },
  },
];

interface TemplateContextValue {
  template: Template;
  setTemplateId: (id: TemplateId) => void;
  hasSelected: boolean;
}

const TemplateContext = createContext<TemplateContextValue | null>(null);

export const TemplateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [templateId, setTemplateIdState] = useState<TemplateId | null>(
    () => (localStorage.getItem('zing_template') as TemplateId) || null
  );

  const setTemplateId = (id: TemplateId) => {
    localStorage.setItem('zing_template', id);
    setTemplateIdState(id);
  };

  const template = TEMPLATES.find(t => t.id === templateId) ?? TEMPLATES[0];

  useEffect(() => {
    document.documentElement.setAttribute('data-template', template.id);
  }, [template.id]);

  return (
    <TemplateContext.Provider value={{ template, setTemplateId, hasSelected: !!templateId }}>
      {children}
    </TemplateContext.Provider>
  );
};

export const useTemplate = () => {
  const ctx = useContext(TemplateContext);
  if (!ctx) throw new Error('useTemplate must be inside TemplateProvider');
  return ctx;
};
