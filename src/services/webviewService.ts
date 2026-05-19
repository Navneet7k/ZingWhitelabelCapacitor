import { InAppBrowser } from '@capgo/inappbrowser';
import type { PluginListenerHandle } from '@capacitor/core';
import { clearAuth } from './authApi';

let _isOpen = false;
let _closeHandle: PluginListenerHandle | null = null;
let _urlHandle: PluginListenerHandle | null = null;

/** True while the in-app webview is on screen. Used by OTA logic to defer updates. */
export function hasOpenBrowsers(): boolean {
  return _isOpen;
}

function cleanup() {
  _closeHandle?.remove();
  _urlHandle?.remove();
  _closeHandle = null;
  _urlHandle = null;
  _isOpen = false;
}

/**
 * Open a native in-app webview.
 * Automatically detects unauthorize/user redirects — clears auth and closes.
 * toolbarColor is forwarded to the native toolbar.
 */
export async function openWebView(
  url: string,
  title: string,
  toolbarColor = '#1A1A1A',
  onClose?: () => void,
): Promise<void> {
  if (_isOpen) return;
  _isOpen = true;

  _closeHandle = await InAppBrowser.addListener('closeEvent', () => {
    cleanup();
    onClose?.();
  });

  _urlHandle = await InAppBrowser.addListener('urlChangeEvent', (event: { url?: string }) => {
    if ((event.url ?? '').includes('unauthorize/user')) {
      clearAuth();
      cleanup();
      InAppBrowser.close().catch(() => {});
    }
  });

  try {
    await InAppBrowser.openWebView({
      url,
      title,
      visibleTitle: true,
      showArrow: true,
      toolbarColor,
      toolbarTextColor: '#ffffff',
    });
  } catch {
    cleanup();
  }
}

/** Close the currently open webview programmatically. */
export function closeWebView(): void {
  InAppBrowser.close().catch(() => {});
}
