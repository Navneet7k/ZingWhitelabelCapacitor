import { Capacitor } from '@capacitor/core';

type OpenEvent = { url: string; title: string; onClose?: () => void };
type Listener = (event: OpenEvent | null) => void;

let _current: OpenEvent | null = null;
let _listener: Listener | null = null;

// Tracks whether a native InAppBrowser window is open (used by OTA guard).
let _nativeBrowserOpen = false;

/** Subscribe to iframe-modal open/close events (web/dev only). Returns unsubscribe fn. */
export function onWebViewChange(fn: Listener): () => void {
  _listener = fn;
  return () => { if (_listener === fn) _listener = null; };
}

/**
 * Open the in-app browser.
 * Native: uses @capgo/inappbrowser with COMPACT toolbar (close button only — no URL bar,
 *   no share icon). Its own WebView context avoids Android cross-origin cookie restrictions.
 * Web/dev: falls back to the iframe modal.
 *
 * To revert to iframe-only: git checkout HEAD~1 -- src/services/webviewService.ts
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
    import('@capgo/inappbrowser').then(async ({ InAppBrowser, ToolBarType }) => {
      const handle = await InAppBrowser.addListener('closeEvent', () => {
        _nativeBrowserOpen = false;
        handle.remove();
        onClose?.();
      });
      await InAppBrowser.openWebView({
        url,
        title,
        toolbarColor: toolbarColor ?? '#ffffff',
        toolbarType: ToolBarType.COMPACT,
        showArrow: true,
      });
    }).catch(e => {
      console.error('[WebView] InAppBrowser failed, falling back to iframe:', e);
      _nativeBrowserOpen = false;
      _current = { url, title, onClose };
      _listener?.(_current);
    });
    return;
  }

  // Browser / dev fallback — iframe modal
  _current = { url, title, onClose };
  _listener?.(_current);
}

/** Close the currently open browser. Works for both native and iframe. */
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

/** True while any browser (native or iframe) is on screen. Used by OTA logic to defer updates. */
export function hasOpenBrowsers(): boolean {
  return _nativeBrowserOpen || _current !== null;
}
