import { InAppBrowser } from '@capgo/inappbrowser';
import type { PluginListenerHandle } from '@capacitor/core';
import { applyIfReady } from './updater';

// Tracks webview ids that are currently open.
const _openIds = new Set<string>();
// Prevents duplicate opens during the async openWebView() call.
let _isOpening = false;

/** True while any managed webview is on screen. */
export function hasOpenBrowsers(): boolean {
  return _openIds.size > 0 || _isOpening;
}

/**
 * Open a single managed webview.
 * - Blocks duplicate/stacked opens — extra taps while a browser is visible are no-ops.
 * - Listens for closeEvent and applies any pending OTA bundle only after the last
 *   browser is fully dismissed, so notifyAppReady() can fire on an active WebView.
 * - Calls optional onClose() callback when the browser is dismissed.
 */
export async function openWebView(
  url: string,
  title: string,
  toolbarColor: string,
  onClose?: () => void,
): Promise<void> {
  if (_isOpening || _openIds.size > 0) return;
  _isOpening = true;

  let handle: PluginListenerHandle | null = null;

  try {
    const { id } = await InAppBrowser.openWebView({
      url,
      title,
      visibleTitle: false,
      showArrow: true,
      toolbarColor,
      toolbarTextColor: '#ffffff',
    });

    _openIds.add(id);
    _isOpening = false;

    handle = await InAppBrowser.addListener('closeEvent', (event) => {
      // event.id may be absent on older plugin builds — treat as match when missing
      if (event.id && event.id !== id) return;
      handle?.remove();
      _openIds.delete(id);
      onClose?.();
      // Apply OTA only when ALL browsers are closed. Calling CapacitorUpdater.set()
      // while Chrome Custom Tabs is still visible suspends the WebView so
      // notifyAppReady() never fires and Capgo rolls back to the previous bundle.
      if (_openIds.size === 0) {
        applyIfReady();
      }
    });
  } catch {
    _isOpening = false;
  }
}
