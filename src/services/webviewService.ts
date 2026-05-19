import { InAppBrowser } from '@capgo/inappbrowser';
import type { PluginListenerHandle } from '@capacitor/core';

const _openIds  = new Set<string>();
let _isOpening  = false;
let _isLoading  = false;
let _cleanupRef: (() => void) | null = null;

// ── Loading state listeners ───────────────────────────────────────────────────
type LoadingListener = (loading: boolean) => void;
const _loadingListeners = new Set<LoadingListener>();

function setLoading(v: boolean) {
  if (_isLoading === v) return;
  _isLoading = v;
  _loadingListeners.forEach(fn => fn(v));
}

/** Subscribe to webview loading state changes. Returns unsubscribe fn. */
export function onLoadingChange(fn: LoadingListener): () => void {
  _loadingListeners.add(fn);
  return () => _loadingListeners.delete(fn);
}

/** Current loading state — use to initialise React state synchronously. */
export function isWebViewLoading(): boolean { return _isLoading; }

/** True while any managed webview is on screen or being opened. */
export function hasOpenBrowsers(): boolean {
  return _openIds.size > 0 || _isOpening;
}

/**
 * Cancel an in-progress webview open. Safe to call when nothing is loading.
 * Immediately clears loading state for instant UI feedback, then closes the
 * native webview (if already opened) which fires closeEvent → cleanup.
 */
export function cancelWebView(): void {
  setLoading(false);
  InAppBrowser.close().catch(() => {});
  if (_cleanupRef) {
    _cleanupRef();
    _cleanupRef = null;
  }
}

/**
 * Open a single managed webview.
 *
 * Safety guarantees:
 * - Duplicate/stacked opens are blocked.
 * - closeEvent listener is registered BEFORE openWebView() so no close event
 *   can be missed.
 * - isPresentAfterPageLoad: true — native holds the webview hidden until the
 *   page finishes loading, then slides it in. Eliminates the white-screen flash.
 *   A React loading overlay is shown (via setLoading) from tap until the native
 *   webview is ready to appear.
 * - applyIfReady() is NOT called here — see comment in original code.
 */
export async function openWebView(
  url: string,
  title: string,
  toolbarColor: string,
  onClose?: () => void,
): Promise<void> {
  if (_isOpening || _openIds.size > 0) return;
  _isOpening = true;
  setLoading(true);

  // Safety: clear loading after 15 s in case the promise never resolves.
  const safetyTimer = setTimeout(() => setLoading(false), 15_000);

  let webviewId: string | null = null;
  let handle: PluginListenerHandle | null = null;

  const cleanup = () => {
    _cleanupRef = null;
    handle?.remove();
    handle = null;
    if (webviewId) _openIds.delete(webviewId);
    webviewId = null;
    _isOpening = false;
    setLoading(false);
    clearTimeout(safetyTimer);
  };
  _cleanupRef = cleanup;

  try {
    // Register BEFORE opening — prevents missing a close that fires before
    // we reach the addListener() call below.
    handle = await InAppBrowser.addListener('closeEvent', (event) => {
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
      // Hold webview hidden until page loads — eliminates white flash.
      // Android: promise resolves after first page load (overlay covers full wait).
      // iOS: promise resolves immediately after native view creation; iOS natively
      //      defers presentation until loaded so user still sees no white flash.
      isPresentAfterPageLoad: true,
    });

    webviewId = id;
    _openIds.add(id);
    _isOpening = false;
    setLoading(false);
    clearTimeout(safetyTimer);
  } catch {
    cleanup();
  }
}
