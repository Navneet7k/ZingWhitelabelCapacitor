import { Capacitor } from '@capacitor/core';
import { InAppBrowser } from '@capgo/inappbrowser';

type OpenEvent = { url: string; title: string; onClose?: () => void };
type Listener = (event: OpenEvent | null) => void;

let _current: OpenEvent | null = null;
let _listener: Listener | null = null;
let _nativeOpen = false;

/** Subscribe to webview open/close events (web only). Returns unsubscribe fn. */
export function onWebViewChange(fn: Listener): () => void {
  _listener = fn;
  return () => { if (_listener === fn) _listener = null; };
}

/**
 * Open the in-app webview.
 * On native (Android/iOS) uses InAppBrowser so cookies work correctly.
 * On web falls back to the iframe modal.
 */
export async function openWebView(
  url: string,
  title: string,
  toolbarColor?: string,
  onClose?: () => void,
): Promise<void> {
  console.log(`[WebView] Opening — title: "${title}" | url: ${url}`);

  if (Capacitor.isNativePlatform()) {
    _nativeOpen = true;
    const handle = await InAppBrowser.addListener('closeEvent', () => {
      _nativeOpen = false;
      handle.remove();
      onClose?.();
    });
    await InAppBrowser.open({
      url,
      toolbarColor,
      showTitle: true,
      showArrow: true,
      disableShare: true,
      disableBookmark: true,
      disableDownload: true,
      urlBarHidingEnabled: true,
    });
  } else {
    _current = { url, title, onClose };
    _listener?.(_current);
  }
}

/** Close the currently open webview. */
export function closeWebView(): void {
  if (Capacitor.isNativePlatform()) {
    _nativeOpen = false;
    InAppBrowser.close();
  } else {
    const cb = _current?.onClose;
    _current = null;
    _listener?.(null);
    cb?.();
  }
}

/** True while the in-app webview is on screen. Used by OTA logic to defer updates. */
export function hasOpenBrowsers(): boolean {
  return Capacitor.isNativePlatform() ? _nativeOpen : _current !== null;
}
