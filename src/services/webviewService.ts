type OpenEvent = { url: string; title: string; onClose?: () => void };
type Listener = (event: OpenEvent | null) => void;

let _current: OpenEvent | null = null;
let _listener: Listener | null = null;

/** Subscribe to webview open/close events. Returns unsubscribe fn. */
export function onWebViewChange(fn: Listener): () => void {
  _listener = fn;
  return () => { if (_listener === fn) _listener = null; };
}

/**
 * Open the in-app webview modal.
 * toolbarColor param is kept for call-site compatibility but is unused.
 */
export function openWebView(
  url: string,
  title: string,
  _toolbarColor?: string,
  onClose?: () => void,
): void {
  _current = { url, title, onClose };
  _listener?.(_current);
}

/** Close the currently open webview. Safe to call when nothing is open. */
export function closeWebView(): void {
  const cb = _current?.onClose;
  _current = null;
  _listener?.(null);
  cb?.();
}

/** True while the in-app webview is on screen. Used by OTA logic to defer updates. */
export function hasOpenBrowsers(): boolean {
  return _current !== null;
}
