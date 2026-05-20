const BASE_URL               = 'https://app.zingmyorder.com/api';
const CONFIG_COLORS_KEY      = 'zing_config_colors';
const CONFIG_COLORS_ENABLED  = 'zing_config_colors_enabled';

// ── Toggle state ────────────────────────────────────────────────────────────
export function isConfigColorsEnabled(): boolean {
  return localStorage.getItem(CONFIG_COLORS_ENABLED) === 'true';
}
export function persistConfigColorsEnabled(enabled: boolean): void {
  if (enabled) localStorage.setItem(CONFIG_COLORS_ENABLED, 'true');
  else localStorage.removeItem(CONFIG_COLORS_ENABLED);
}

// ── Stored colors ────────────────────────────────────────────────────────────
export function getStoredConfigColors(): Record<string, string> | null {
  try {
    const raw = localStorage.getItem(CONFIG_COLORS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
export function storeConfigColors(colors: Record<string, string>): boolean {
  const next = JSON.stringify(colors);
  const prev = localStorage.getItem(CONFIG_COLORS_KEY);
  if (next === prev) return false;
  localStorage.setItem(CONFIG_COLORS_KEY, next);
  return true;
}

// ── CSS application ──────────────────────────────────────────────────────────
let _styleTag: HTMLStyleElement | null = null;
function getStyleTag(): HTMLStyleElement {
  if (!_styleTag) {
    _styleTag = document.createElement('style');
    _styleTag.id = 'zing-config-colors';
    // Insert AFTER zing-theme-overrides so brand colors win over manual swatch picks
    const overrides = document.getElementById('zing-theme-overrides');
    if (overrides) overrides.insertAdjacentElement('afterend', _styleTag);
    else document.head.appendChild(_styleTag);
  }
  return _styleTag;
}

function buildCSSProps(colors: Record<string, string>): string {
  const p: string[] = [];
  const primary = colors['primary-color'] || colors['button-primary'];
  if (primary)                      p.push(`--t-primary:${primary};`);
  if (colors['secondary-color'])    p.push(`--t-accent:${colors['secondary-color']};`);
  if (colors['body-color'])         p.push(`--t-bg:${colors['body-color']};`);
  if (colors['card-color'])         p.push(`--t-surface:${colors['card-color']};`);
  if (colors['heading-color'])      p.push(`--t-text:${colors['heading-color']};`);
  if (colors['card-text-muted'])    p.push(`--t-text-muted:${colors['card-text-muted']};`);
  if (colors['primary-text-color']) p.push(`--t-primary-text:${colors['primary-text-color']};`);
  return p.join('');
}

export function applyConfigColors(colors: Record<string, string> | null, _retry = false): void {
  const tag  = getStyleTag();
  if (!colors) { tag.textContent = ''; return; }
  const tmpl = document.documentElement.getAttribute('data-template') ?? '';
  if (!tmpl) {
    // data-template not set yet (startup race — TemplateProvider effect fires after child effects).
    // Retry once in the next animation frame, by which time it will be set.
    if (!_retry) requestAnimationFrame(() => applyConfigColors(colors, true));
    return;
  }
  const props = buildCSSProps(colors);
  tag.textContent = props ? `[data-template="${tmpl}"]{${props}}` : '';
}

export function clearConfigColors(): void {
  if (_styleTag) _styleTag.textContent = '';
}

// ── Fetch & store ────────────────────────────────────────────────────────────
export async function fetchAndStoreConfigColors(restaurantId: string): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/config/${restaurantId}`, { cache: 'no-store' });
    if (!res.ok) return false;
    const data = await res.json() as { app?: { colors?: Record<string, string> } };
    const colors = data?.app?.colors;
    if (!colors || typeof colors !== 'object') return false;
    return storeConfigColors(colors);
  } catch { return false; }
}

// ── Called on every tab switch ────────────────────────────────────────────────
export function checkConfigColorsOnTabSwitch(restaurantId: string): void {
  if (!isConfigColorsEnabled() || !restaurantId) return;
  // Apply whatever is currently stored (instant — no network wait).
  // The fetch below updates localStorage silently; next tab switch picks up new values.
  applyConfigColors(getStoredConfigColors());
  fetchAndStoreConfigColors(restaurantId);
}
