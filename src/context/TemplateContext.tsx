import React, { createContext, useContext, useState, useEffect } from 'react';

export type TemplateId = 'luxe' | 'fresh' | 'street' | 'zen' | 'fiesta' | 'neon' | 'rustic' | 'ocean' | 'blossom' | 'ember' | 'cosmic' | 'retro' | 'tropical' | 'royal' | 'brew' | 'dynasty' | 'float' | 'reel';

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
  {
    id: 'neon',
    name: 'Neon',
    tagline: 'Cyberpunk future',
    emoji: '⚡',
    colors: { bg: '#0A0010', primary: '#FF006E', accent: '#00F5FF', text: '#FFFFFF' },
  },
  {
    id: 'rustic',
    name: 'Rustic',
    tagline: 'Farmhouse & warm',
    emoji: '🌾',
    colors: { bg: '#FDF6EC', primary: '#C1440E', accent: '#8B4513', text: '#3E1F00' },
  },
  {
    id: 'ocean',
    name: 'Ocean',
    tagline: 'Coastal & fresh',
    emoji: '🌊',
    colors: { bg: '#F0F9FF', primary: '#1B4F72', accent: '#48C9B0', text: '#1A2F3E' },
  },
  {
    id: 'blossom',
    name: 'Blossom',
    tagline: 'Soft & romantic',
    emoji: '🌸',
    colors: { bg: '#FFF5F7', primary: '#FF6B95', accent: '#FFB3C6', text: '#2D1B2D' },
  },
  {
    id: 'cosmic',
    name: 'Cosmic',
    tagline: 'Space & galaxy vibes',
    emoji: '🚀',
    colors: { bg: '#050A18', primary: '#00E5FF', accent: '#AA44FF', text: '#E8F4FF' },
  },
  {
    id: 'retro',
    name: 'Retro',
    tagline: '70s diner nostalgia',
    emoji: '🎵',
    colors: { bg: '#FFF8E7', primary: '#E8A500', accent: '#D62828', text: '#1A0A00' },
  },
  {
    id: 'tropical',
    name: 'Tropical',
    tagline: 'Island vibes & fresh flavors',
    emoji: '🌴',
    colors: { bg: '#FFFDF5', primary: '#FF7043', accent: '#00BDA5', text: '#2D1F0E' },
  },
  {
    id: 'royal',
    name: 'Royal',
    tagline: 'British pub/bistro elegance',
    emoji: '👑',
    colors: { bg: '#150810', primary: '#C9923A', accent: '#8C1A2E', text: '#F5ECD7' },
  },
  {
    id: 'brew',
    name: 'Brew',
    tagline: 'Artisan café experience',
    emoji: '☕',
    colors: { bg: '#F7F3EE', primary: '#2C1810', accent: '#C8A882', text: '#1A0E0A' },
  },
  {
    id: 'dynasty',
    name: 'Dynasty',
    tagline: 'Imperial Chinese dining',
    emoji: '🏮',
    colors: { bg: '#110000', primary: '#C8102E', accent: '#D4AF37', text: '#F5ECD7' },
  },
  {
    id: 'float',
    name: 'Float',
    tagline: 'Frosted glass premium dining',
    emoji: '🔮',
    colors: { bg: '#0F0C29', primary: '#7C3AED', accent: '#A78BFA', text: '#FFFFFF' },
  },
  {
    id: 'reel',
    name: 'Reel',
    tagline: 'Full-screen food cinema',
    emoji: '🎬',
    colors: { bg: '#080808', primary: '#FF3B30', accent: '#FFD60A', text: '#FFFFFF' },
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
