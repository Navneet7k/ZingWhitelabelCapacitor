import { InAppBrowser } from '@capgo/inappbrowser';
import type { PluginListenerHandle } from '@capacitor/core';

const _openIds = new Set<string>();
let _isOpening = false;

/** True while any managed webview is on screen or being opened. */
export function hasOpenBrowsers(): boolean {
  return _openIds.size > 0 || _isOpening;
}

/**
 * Open a single managed webview.
 *
 * Safety guarantees:
 * - Duplicate/stacked opens are blocked — extra taps while a browser is visible
 *   are no-ops, preventing the "backstack" bug.
 * - closeEvent listener is registered BEFORE openWebView() so no close event can
 *   be missed in the window between resolving the promise and adding the listener.
 * - applyIfReady() is NOT called here. The InAppBrowser close triggers a
 *   visibilitychange:visible event BEFORE the native browser finishes closing, so
 *   calling CapacitorUpdater.set() here races with native cleanup and crashes.
 *   Updates are applied only on visibilitychange:hidden (app backgrounded).
 */
export async function openWebView(
  url: string,
  title: string,
  toolbarColor: string,
  onClose?: () => void,
): Promise<void> {
  if (_isOpening || _openIds.size > 0) return;
  _isOpening = true;

  let webviewId: string | null = null;
  let handle: PluginListenerHandle | null = null;

  const cleanup = () => {
    handle?.remove();
    handle = null;
    if (webviewId) _openIds.delete(webviewId);
    webviewId = null;
    _isOpening = false;
  };

  try {
    // Register BEFORE opening — prevents missing a close that fires before
    // we reach the addListener() call below.
    handle = await InAppBrowser.addListener('closeEvent', (event) => {
      // Ignore events for other webviews when we already know our id.
      if (webviewId !== null && event.id && event.id !== webviewId) return;
      cleanup();
      onClose?.();
    });

    const { id } = await InAppBrowser.openWebView({
      url,
      title,
      visibleTitle: false,
      showArrow: true,
      toolbarColor,
      toolbarTextColor: '#ffffff',
    });

    webviewId = id;
    _openIds.add(id);
    _isOpening = false;
  } catch {
    cleanup();
  }
}
