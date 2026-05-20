import React from 'react';
import { useTemplate } from '../context/TemplateContext';
import { useThemeCustom, type ThemeOverrides } from '../context/ThemeCustomContext';
import './CustomizePage.css';

interface Props {
  onBack: () => void;
}

interface Swatch {
  label: string;
  value: string;
}

const ACCENT_SWATCHES: Swatch[] = [
  { label: 'Coral',    value: '#FF3B30' },
  { label: 'Flame',    value: '#FF6B35' },
  { label: 'Amber',    value: '#FFD60A' },
  { label: 'Emerald',  value: '#34D399' },
  { label: 'Forest',   value: '#2C5F2E' },
  { label: 'Blue',     value: '#007AFF' },
  { label: 'Indigo',   value: '#7C3AED' },
  { label: 'Rose',     value: '#FF006E' },
  { label: 'Gold',     value: '#E8C87A' },
  { label: 'Cyan',     value: '#00E5FF' },
  { label: 'Teal',     value: '#00BDA5' },
  { label: 'Bronze',   value: '#C9923A' },
];

const BG_SWATCHES: Swatch[] = [
  { label: 'White',       value: '#FFFFFF' },
  { label: 'Warm White',  value: '#FFF9F0' },
  { label: 'Cool White',  value: '#F0F9FF' },
  { label: 'Soft Gray',   value: '#F5F5F5' },
  { label: 'Cream',       value: '#FFF8E7' },
  { label: 'Charcoal',    value: '#1A1A1A' },
  { label: 'Near Black',  value: '#0D0D0D' },
  { label: 'Midnight',    value: '#0A0A14' },
  { label: 'Navy',        value: '#050A18' },
  { label: 'Deep Plum',   value: '#18063A' },
  { label: 'Dark Maroon', value: '#110000' },
  { label: 'Dark Forest', value: '#0A1A0A' },
];

const SURFACE_SWATCHES: Swatch[] = [
  { label: 'White',       value: '#FFFFFF' },
  { label: 'Off-White',   value: '#F8F8F8' },
  { label: 'Warm',        value: '#FFF8F0' },
  { label: 'Cool Gray',   value: '#F0F0F5' },
  { label: 'Graphite',    value: '#1C1C1E' },
  { label: 'Slate',       value: '#222222' },
  { label: 'Dark',        value: '#161616' },
  { label: 'Deep Navy',   value: '#0D1530' },
  { label: 'Dark Maroon', value: '#1E0505' },
  { label: 'Dark Plum',   value: '#1A0030' },
];

const TEXT_SWATCHES: Swatch[] = [
  { label: 'White',      value: '#FFFFFF' },
  { label: 'Ivory',      value: '#F5F0E8' },
  { label: 'Warm White', value: '#FFF8F0' },
  { label: 'Cool White', value: '#E8F4FF' },
  { label: 'Light Gray', value: '#D0D0D0' },
  { label: 'Dark',       value: '#1A1A1A' },
  { label: 'Near Black', value: '#111111' },
  { label: 'Warm Dark',  value: '#2D1B0E' },
];

type FontSize = 'sm' | 'md' | 'lg';
const FONT_OPTIONS: { label: string; size: FontSize; sampleSizes: [number, number, number] }[] = [
  { label: 'S', size: 'sm', sampleSizes: [12, 14, 14] },
  { label: 'M', size: 'md', sampleSizes: [14, 18, 18] },
  { label: 'L', size: 'lg', sampleSizes: [17, 22, 22] },
];

interface FontSizeRowProps {
  title: string;
  currentValue?: string;
  overrideKey: keyof ThemeOverrides;
  onSelect: (key: keyof ThemeOverrides, value: string) => void;
}
const FontSizeRow: React.FC<FontSizeRowProps> = ({ title, currentValue, overrideKey, onSelect }) => (
  <div className="cp__section">
    <div className="cp__section-header">
      <span className="cp__section-title">{title}</span>
      {currentValue && (
        <button className="cp__reset-inline" onClick={() => onSelect(overrideKey, '')}>Reset</button>
      )}
    </div>
    <div className="cp__font-row">
      {FONT_OPTIONS.map((opt, i) => {
        const active = currentValue === opt.size || (!currentValue && opt.size === 'md');
        return (
          <button
            key={opt.size}
            className={`cp__font-btn ${active ? 'cp__font-btn--active' : ''}`}
            onClick={() => onSelect(overrideKey, opt.size)}
          >
            <span className="cp__font-sample" style={{ fontSize: opt.sampleSizes[i] }}>Aa</span>
            <span className="cp__font-label">{opt.label}</span>
          </button>
        );
      })}
    </div>
  </div>
);

interface SwatchRowProps {
  title: string;
  swatches: Swatch[];
  defaultColor: string;
  currentValue?: string;
  overrideKey: keyof ThemeOverrides;
  onSelect: (key: keyof ThemeOverrides, value: string) => void;
}

const SwatchRow: React.FC<SwatchRowProps> = ({
  title, swatches, defaultColor, currentValue, overrideKey, onSelect,
}) => (
  <div className="cp__section">
    <div className="cp__section-header">
      <span className="cp__section-title">{title}</span>
      {currentValue && (
        <button
          className="cp__reset-inline"
          onClick={() => onSelect(overrideKey, '')}
        >
          Reset
        </button>
      )}
    </div>
    <div className="cp__swatches">
      {/* Default swatch always first */}
      <button
        className={`cp__swatch cp__swatch--default ${!currentValue ? 'cp__swatch--active' : ''}`}
        style={{ background: defaultColor }}
        onClick={() => onSelect(overrideKey, '')}
        title="Default"
      >
        {!currentValue && <span className="cp__check">✓</span>}
      </button>
      {swatches.map(s => {
        const active = currentValue === s.value;
        return (
          <button
            key={s.value}
            className={`cp__swatch ${active ? 'cp__swatch--active' : ''}`}
            style={{ background: s.value }}
            onClick={() => onSelect(overrideKey, s.value)}
            title={s.label}
          >
            {active && <span className="cp__check">✓</span>}
          </button>
        );
      })}
    </div>
  </div>
);

const CustomizePage: React.FC<Props> = ({ onBack }) => {
  const { template } = useTemplate();
  const { overrides, setOverride, resetOverrides, configColorsEnabled, setConfigColorsEnabled } = useThemeCustom();

  const hasAnyOverride = Object.keys(overrides).length > 0;

  return (
    <div className="cp__root">
      {/* Header */}
      <div className="cp__header">
        <button className="cp__back" onClick={onBack}>‹</button>
        <span className="cp__header-title">Customize</span>
        {hasAnyOverride ? (
          <button className="cp__reset-all" onClick={resetOverrides}>Reset All</button>
        ) : (
          <span className="cp__reset-all cp__reset-all--hidden">Reset All</span>
        )}
      </div>

      {/* Subtitle */}
      <p className="cp__subtitle">
        Customizing <strong>{template.name}</strong> template
      </p>

      {/* Brand Colors Toggle */}
      <div className="cp__section cp__section--toggle">
        <div className="cp__toggle-row">
          <div className="cp__toggle-info">
            <span className="cp__section-title">Use Brand Colors</span>
            <p className="cp__toggle-desc">Fetch colors from your restaurant config</p>
          </div>
          <button
            className={`cp__toggle-btn${configColorsEnabled ? ' cp__toggle-btn--on' : ''}`}
            onClick={() => setConfigColorsEnabled(!configColorsEnabled)}
            aria-label="Toggle brand colors"
          >
            <span className="cp__toggle-knob" />
          </button>
        </div>
        {configColorsEnabled && (
          <p className="cp__toggle-hint">Brand colors are active. Manual swatches below override them.</p>
        )}
      </div>

      {/* Accent Color */}
      <SwatchRow
        title="Accent Color"
        swatches={ACCENT_SWATCHES}
        defaultColor={template.colors.primary}
        currentValue={overrides.primary}
        overrideKey="primary"
        onSelect={setOverride}
      />

      {/* Background */}
      <SwatchRow
        title="Background"
        swatches={BG_SWATCHES}
        defaultColor={template.colors.bg}
        currentValue={overrides.bg}
        overrideKey="bg"
        onSelect={setOverride}
      />

      {/* Card Color */}
      <SwatchRow
        title="Card Color"
        swatches={SURFACE_SWATCHES}
        defaultColor={template.colors.bg}
        currentValue={overrides.surface}
        overrideKey="surface"
        onSelect={setOverride}
      />

      {/* Text Color */}
      <SwatchRow
        title="Text Color"
        swatches={TEXT_SWATCHES}
        defaultColor={template.colors.text}
        currentValue={overrides.text}
        overrideKey="text"
        onSelect={setOverride}
      />

      <FontSizeRow
        title="Section Titles"
        currentValue={overrides.sectionTitleSize}
        overrideKey="sectionTitleSize"
        onSelect={setOverride}
      />
      <FontSizeRow
        title="Item Names"
        currentValue={overrides.itemNameSize}
        overrideKey="itemNameSize"
        onSelect={setOverride}
      />
      <FontSizeRow
        title="Descriptions"
        currentValue={overrides.descSize}
        overrideKey="descSize"
        onSelect={setOverride}
      />
      <FontSizeRow
        title="Tab Labels"
        currentValue={overrides.tabSize}
        overrideKey="tabSize"
        onSelect={setOverride}
      />

      <div className="cp__bottom-space" />
    </div>
  );
};

export default CustomizePage;
