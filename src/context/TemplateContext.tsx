import React, { createContext, useContext, useState, useEffect } from 'react';

export type TemplateId = 'luxe' | 'fresh' | 'street' | 'zen' | 'fiesta' | 'neon' | 'rustic' | 'ocean' | 'blossom' | 'ember' | 'cosmic' | 'retro' | 'tropical' | 'royal' | 'brew' | 'dynasty' | 'float' | 'reel' | 'grove' | 'vapour' | 'noir' | 'dusk' | 'piazza' | 'dine' | 'onyx' | 'spice' | 'spice2';

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
  {
    id: 'grove',
    name: 'Grove',
    tagline: 'Farm-to-table botanical',
    emoji: '🌿',
    colors: { bg: '#F4F7F2', primary: '#2C5F2E', accent: '#E8A838', text: '#1A2E1A' },
  },
  {
    id: 'vapour',
    name: 'Vapour',
    tagline: 'Neon retro-futuristic',
    emoji: '⚡',
    colors: { bg: '#100020', primary: '#E040FB', accent: '#40C4FF', text: '#F3F0FF' },
  },
  {
    id: 'noir',
    name: 'Noir',
    tagline: 'Film noir editorial',
    emoji: '🎭',
    colors: { bg: '#0C0C0C', primary: '#E8C87A', accent: '#F0F0F0', text: '#F0F0F0' },
  },
  {
    id: 'dusk',
    name: 'Dusk',
    tagline: 'Golden hour dining',
    emoji: '🌅',
    colors: { bg: '#18063A', primary: '#FF6B35', accent: '#FFB347', text: '#FFF8F0' },
  },
  {
    id: 'piazza',
    name: 'Piazza',
    tagline: 'Organic artisan warmth',
    emoji: '🌿',
    colors: { bg: '#FAF6EE', primary: '#8FBF9F', accent: '#B8D8C4', text: '#1A1A1A' },
  },
  {
    id: 'dine',
    name: 'Dine',
    tagline: 'Warm & earthy food discovery',
    emoji: '🍃',
    colors: { bg: '#FFF5E0', primary: '#84BD93', accent: '#FFE2CD', text: '#3F2D20' },
  },
  {
    id: 'onyx',
    name: 'Onyx',
    tagline: 'Dark & moody food discovery',
    emoji: '🖤',
    colors: { bg: '#111111', primary: '#4FCB53', accent: '#292A2A', text: '#FFFFFF' },
  },
  {
    id: 'spice',
    name: 'Spice',
    tagline: 'Rich & aromatic',
    emoji: '🌶️',
    colors: { bg: '#2C5F3E', primary: '#1B4D2E', accent: '#a8d5b5', text: '#FFFFFF' },
  },
  {
    id: 'spice2',
    name: 'Spice 2',
    tagline: 'Rich & aromatic',
    emoji: '🌶️',
    colors: { bg: '#2C5F3E', primary: '#1B4D2E', accent: '#a8d5b5', text: '#FFFFFF' },
  },
];

interface TemplateContextValue {
  template: Template;
  setTemplateId: (id: TemplateId) => void;
  setTemplateIdMemoryOnly: (id: TemplateId) => void;
  hasSelected: boolean;
  isTemplateKnown: boolean;
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

  // Updates in-memory state only — does NOT write localStorage.
  // Used by crash recovery so the user's stored choice survives a template crash.
  const setTemplateIdMemoryOnly = (id: TemplateId) => {
    setTemplateIdState(id);
  };

  const knownTemplate = TEMPLATES.find(t => t.id === templateId);
  // Visual fallback when stored template isn't in this bundle (e.g. after OTA rollback).
  // Deliberately does NOT call setTemplateId so localStorage is preserved.
  const template = knownTemplate
    ?? TEMPLATES.find(t => t.id === 'fiesta')
    ?? TEMPLATES[0];

  useEffect(() => {
    document.documentElement.setAttribute('data-template', template.id);
  }, [template.id]);

  return (
    <TemplateContext.Provider value={{
      template,
      setTemplateId,
      setTemplateIdMemoryOnly,
      hasSelected: !!templateId,
      isTemplateKnown: !!knownTemplate,
    }}>
      {children}
    </TemplateContext.Provider>
  );
};

export const useTemplate = () => {
  const ctx = useContext(TemplateContext);
  if (!ctx) throw new Error('useTemplate must be inside TemplateProvider');
  return ctx;
};
