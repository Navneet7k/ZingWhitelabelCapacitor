import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTemplate, type TemplateId } from './TemplateContext';

export interface ThemeOverrides {
  primary?: string;
  bg?: string;
  surface?: string;
  text?: string;
  fontSize?: 'sm' | 'md' | 'lg';
}

const FONT_SIZE_MAP: Record<string, string> = {
  sm: '13px',
  md: '15px',
  lg: '17px',
};

function storageKey(id: TemplateId) {
  return `zing_theme_${id}`;
}

function loadOverrides(id: TemplateId): ThemeOverrides {
  try {
    const raw = localStorage.getItem(storageKey(id));
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

let _styleTag: HTMLStyleElement | null = null;
function getStyleTag(): HTMLStyleElement {
  if (!_styleTag) {
    _styleTag = document.createElement('style');
    _styleTag.id = 'zing-theme-overrides';
    document.head.appendChild(_styleTag);
  }
  return _styleTag;
}

function applyCSS(id: TemplateId, o: ThemeOverrides) {
  const props: string[] = [];
  if (o.primary)  props.push(`--t-primary:${o.primary};--t-tab-active:${o.primary};`);
  if (o.bg)       props.push(`--t-bg:${o.bg};`);
  if (o.surface)  props.push(`--t-surface:${o.surface};`);
  if (o.text)     props.push(`--t-text:${o.text};`);
  if (o.fontSize) props.push(`--t-font-size:${FONT_SIZE_MAP[o.fontSize]};`);
  getStyleTag().textContent = props.length
    ? `[data-template="${id}"]{${props.join('')}}`
    : '';
}

interface ThemeCustomCtxValue {
  overrides: ThemeOverrides;
  setOverride: (key: keyof ThemeOverrides, value: string) => void;
  resetOverrides: () => void;
}

const ThemeCustomCtx = createContext<ThemeCustomCtxValue | null>(null);

export const ThemeCustomProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { template } = useTemplate();
  const [overrides, setOverrides] = useState<ThemeOverrides>(() => loadOverrides(template.id));

  // When template changes, load that template's saved overrides
  useEffect(() => {
    const o = loadOverrides(template.id);
    setOverrides(o);
    applyCSS(template.id, o);
  }, [template.id]);

  // Re-apply whenever overrides change
  useEffect(() => {
    applyCSS(template.id, overrides);
  }, [template.id, overrides]);

  const setOverride = (key: keyof ThemeOverrides, value: string) => {
    setOverrides(prev => {
      const next = { ...prev };
      if (value) {
        (next as Record<string, string>)[key] = value;
      } else {
        delete next[key];
      }
      localStorage.setItem(storageKey(template.id), JSON.stringify(next));
      return next;
    });
  };

  const resetOverrides = () => {
    setOverrides({});
    localStorage.removeItem(storageKey(template.id));
  };

  return (
    <ThemeCustomCtx.Provider value={{ overrides, setOverride, resetOverrides }}>
      {children}
    </ThemeCustomCtx.Provider>
  );
};

export const useThemeCustom = () => {
  const ctx = useContext(ThemeCustomCtx);
  if (!ctx) throw new Error('useThemeCustom must be inside ThemeCustomProvider');
  return ctx;
};
