import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTemplate, type TemplateId } from './TemplateContext';

export interface ThemeOverrides {
  primary?: string;
  bg?: string;
  surface?: string;
  text?: string;
  sectionTitleSize?: 'sm' | 'md' | 'lg';
  itemNameSize?: 'sm' | 'md' | 'lg';
  descSize?: 'sm' | 'md' | 'lg';
  tabSize?: 'sm' | 'md' | 'lg';
}

const SECTION_TITLE_SIZE_MAP: Record<string, string> = { sm: '15px', md: '20px', lg: '26px' };
const ITEM_NAME_SIZE_MAP:     Record<string, string> = { sm: '13px', md: '16px', lg: '20px' };
const DESC_SIZE_MAP:          Record<string, string> = { sm: '10px', md: '12px', lg: '14px' };
const TAB_SIZE_MAP:           Record<string, string> = { sm: '9px',  md: '11px', lg: '13px' };

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
  if (o.primary)          props.push(`--t-primary:${o.primary};--t-tab-active:${o.primary};`);
  if (o.bg)               props.push(`--t-bg:${o.bg};`);
  if (o.surface)          props.push(`--t-surface:${o.surface};`);
  if (o.text)             props.push(`--t-text:${o.text};`);
  if (o.sectionTitleSize) props.push(`--t-section-title-size:${SECTION_TITLE_SIZE_MAP[o.sectionTitleSize]};`);
  if (o.itemNameSize)     props.push(`--t-item-name-size:${ITEM_NAME_SIZE_MAP[o.itemNameSize]};`);
  if (o.descSize)         props.push(`--t-desc-size:${DESC_SIZE_MAP[o.descSize]};`);
  if (o.tabSize)          props.push(`--t-tab-size:${TAB_SIZE_MAP[o.tabSize]};`);
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
