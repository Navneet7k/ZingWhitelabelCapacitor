import { Capacitor } from '@capacitor/core';

type OpenEvent = { url: string; title: string; onClose?: () => void };
type Listener = (event: OpenEvent | null) => void;

let _current: OpenEvent | null = null;
let _listener: Listener | null = null;
let _nativeBrowserOpen = false;

export function onWebViewChange(fn: Listener): () => void {
  _listener = fn;
  return () => { if (_listener === fn) _listener = null; };
}

// ── Loading overlay ────────────────────────────────────────────────────────────
// Injected directly into the DOM so no template changes are needed.

function ensureStyles() {
  if (document.getElementById('wv-loading-styles')) return;
  const s = document.createElement('style');
  s.id = 'wv-loading-styles';
  s.textContent = `
    @keyframes wv-spin {
      to { transform: rotate(360deg); }
    }
    @keyframes wv-fade-in {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes wv-fade-out {
      from { opacity: 1; }
      to   { opacity: 0; }
    }
    .wv-overlay {
      position: fixed; inset: 0; z-index: 99999;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center; gap: 18px;
      background: rgba(0, 0, 0, 0.45);
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
      animation: wv-fade-in 0.2s ease forwards;
    }
    .wv-overlay.hiding {
      animation: wv-fade-out 0.2s ease forwards;
    }
    .wv-spinner {
      width: 44px; height: 44px;
      border-radius: 50%;
      border: 3px solid rgba(255, 255, 255, 0.25);
      border-top-color: #ffffff;
      animation: wv-spin 0.75s linear infinite;
    }
    .wv-label {
      color: #ffffff;
      font-size: 14px;
      font-weight: 500;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      letter-spacing: 0.2px;
      opacity: 0.9;
      margin: 0;
    }
  `;
  document.head.appendChild(s);
}

function showOverlay(title: string): HTMLElement {
  ensureStyles();
  const overlay = document.createElement('div');
  overlay.className = 'wv-overlay';

  const spinner = document.createElement('div');
  spinner.className = 'wv-spinner';

  const label = document.createElement('p');
  label.className = 'wv-label';
  label.textContent = `Loading ${title}…`;

  overlay.appendChild(spinner);
  overlay.appendChild(label);
  document.body.appendChild(overlay);
  return overlay;
}

function hideOverlay(overlay: HTMLElement) {
  overlay.classList.add('hiding');
  setTimeout(() => overlay.remove(), 220);
}

// ── Main API ───────────────────────────────────────────────────────────────────

/**
 * Open the in-app browser.
 * Native: InAppBrowser with COMPACT toolbar (back arrow + title only).
 *   Loads the page in the background, shows a smooth overlay while loading,
 *   then presents the webview once the page is ready — no white flash.
 * Web/dev: iframe modal fallback.
 */
export function openWebView(
  url: string,
  title: string,
  toolbarColor?: string,
  onClose?: () => void,
): void {
  console.log(`[WebView] Opening — title: "${title}" | url: ${url}`);

  if (Capacitor.isNativePlatform()) {
    _nativeBrowserOpen = true;
    const overlay = showOverlay(title);

    import('@capgo/inappbrowser').then(async ({ InAppBrowser, ToolBarType }) => {
      const handle = await InAppBrowser.addListener('closeEvent', () => {
        _nativeBrowserOpen = false;
        handle.remove();
        onClose?.();
      });

      await InAppBrowser.addListener('urlChangeEvent', (event: any) => {
        console.log('[WebView] URL changed →', event?.url ?? event);
      });

      // isPresentAfterPageLoad: true — webview stays hidden until fully loaded,
      // then slides in. The overlay covers the wait so the user sees no white flash.
      await InAppBrowser.openWebView({
        url,
        title,
        toolbarColor:          toolbarColor ?? '#ffffff',
        toolbarType:           ToolBarType.COMPACT,
        showArrow:             true,
        isPresentAfterPageLoad: true,
      });

      // Page has loaded — dismiss overlay and let InAppBrowser animate in.
      hideOverlay(overlay);
    }).catch(e => {
      console.error('[WebView] InAppBrowser failed, falling back to iframe:', e);
      hideOverlay(overlay);
      _nativeBrowserOpen = false;
      _current = { url, title, onClose };
      _listener?.(_current);
    });
    return;
  }

  // Browser / dev — iframe modal
  _current = { url, title, onClose };
  _listener?.(_current);
}

export function closeWebView(): void {
  if (Capacitor.isNativePlatform()) {
    import('@capgo/inappbrowser').then(({ InAppBrowser }) => {
      InAppBrowser.close({}).catch(() => {});
    });
    _nativeBrowserOpen = false;
    return;
  }
  const cb = _current?.onClose;
  _current = null;
  _listener?.(null);
  cb?.();
}

export function hasOpenBrowsers(): boolean {
  return _nativeBrowserOpen || _current !== null;
}
