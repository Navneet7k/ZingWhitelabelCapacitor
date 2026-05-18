import { Capacitor } from '@capacitor/core';

const MANIFEST_URL =
  'https://Navneet7k.github.io/ZingWhitelabelCapacitor/manifest.json';

const VERSION_KEY = 'zing_bundle_version';

interface Manifest {
  version: string;
  url: string;
  notes?: string;
}

export type UpdateStatus =
  | { state: 'idle' }
  | { state: 'checking' }
  | { state: 'up_to_date'; version: string }
  | { state: 'downloading'; from: string; to: string }
  | { state: 'ready'; version: string }
  | { state: 'error'; reason: string };

type StatusListener = (s: UpdateStatus) => void;
const listeners = new Set<StatusListener>();

let _status: UpdateStatus = { state: 'idle' };
let _pendingBundle: any = null;   // in-memory only — can't serialise a bundle ref
let _isChecking       = false;
let _lastCheckAt      = 0;  // used by recheckForUpdate (foreground / poll)
let _lastTabCheckAt   = 0;  // used by checkOnTabSwitch — separate so the two don't block each other
const RECHECK_COOLDOWN_MS = 5 * 60 * 1000;
const TAB_DEBOUNCE_MS     = 5_000; // just prevents double-fire from rapid taps

function setStatus(s: UpdateStatus) {
  _status = s;
  listeners.forEach(fn => fn(s));
}

export function getStatus(): UpdateStatus { return _status; }

export function onStatusChange(fn: StatusListener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/**
 * Call once at cold start. Runs notifyAppReady so Capgo never rolls back,
 * then checks for a newer bundle and downloads it in the background.
 */
export async function initUpdater(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    setStatus({ state: 'up_to_date', version: 'browser-dev' });
    return;
  }
  // Show the last-known installed version immediately so the panel never
  // flashes "idle → checking" after an OTA reload — user sees "Up to date"
  // first, then a brief "Checking…", then "Up to date" again.
  const stored = localStorage.getItem(VERSION_KEY);
  if (stored) setStatus({ state: 'up_to_date', version: stored });
  try {
    const { CapacitorUpdater } = await import('@capgo/capacitor-updater');
    // notifyAppReady() is called in main.tsx at the earliest possible moment
    await _checkAndDownload(CapacitorUpdater);
  } catch (e: any) {
    setStatus({ state: 'error', reason: e?.message ?? String(e) });
    console.warn('[Updater] init failed', e);
  }
}

/**
 * Lightweight re-check triggered on app foreground / tab switch.
 * Respects a 5-minute cooldown so the manifest endpoint isn't hammered.
 */
export async function recheckForUpdate(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  if (_isChecking) return;
  if (_status.state === 'ready') return;           // already have a bundle waiting
  if (Date.now() - _lastCheckAt < RECHECK_COOLDOWN_MS) return;
  try {
    const { CapacitorUpdater } = await import('@capgo/capacitor-updater');
    await _checkAndDownload(CapacitorUpdater);
  } catch (e) {
    console.warn('[Updater] recheck failed', e);
  }
}

/**
 * Called on every tab-bar tap — download-only trigger.
 * Apply is intentionally NOT called here. App.tsx schedules a 600 ms delayed
 * apply (with hasOpenBrowsers guard) so there is time for useIonViewDidEnter
 * on the Orders tab to open InAppBrowser before set() is called.  Calling
 * set() while InAppBrowser is in mid-launch causes a native crash → rollback.
 */
export async function checkOnTabSwitch(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  if (_isChecking || _status.state === 'downloading' || _status.state === 'ready') return;

  // Debounce — only prevents double-fire from a single rapid tap
  if (Date.now() - _lastTabCheckAt < TAB_DEBOUNCE_MS) return;
  _lastTabCheckAt = Date.now();

  try {
    const { CapacitorUpdater } = await import('@capgo/capacitor-updater');
    await _checkAndDownload(CapacitorUpdater);
  } catch (e) {
    console.warn('[Updater] tab check failed', e);
  }
}

/**
 * Apply the downloaded bundle immediately — causes the app to reload in ~1 s.
 * Safe to call when the app is backgrounded (user won't notice the reload).
 * Also called by the 15-minute idle fallback.
 * No-op if no bundle is pending.
 */
export async function applyIfReady(): Promise<void> {
  if (!_pendingBundle) return;
  if (!Capacitor.isNativePlatform()) return;
  const bundle = _pendingBundle;
  _pendingBundle = null;
  try {
    const { CapacitorUpdater } = await import('@capgo/capacitor-updater');
    await CapacitorUpdater.set(bundle); // triggers immediate reload
  } catch (e) {
    console.warn('[Updater] apply failed', e);
    _pendingBundle = bundle; // restore so it can be retried
  }
}

// ── Internal ──────────────────────────────────────────────────────────────────

async function _checkAndDownload(updater: any): Promise<void> {
  if (_isChecking) return;
  _isChecking = true;
  _lastCheckAt = Date.now();
  setStatus({ state: 'checking' });

  try {
    // Detect whether Capgo is running the APK's built-in bundle (no OTA active).
    // After an uninstall+reinstall, Android Auto Backup can restore localStorage
    // with an old zing_bundle_version that matches the manifest — making us think
    // we're "up to date" while actually running the stale built-in. Clearing the
    // key forces a real download whenever no OTA bundle is active.
    const { bundle: currentBundle } = await updater.current();
    if (currentBundle.id === 'builtin') {
      localStorage.removeItem(VERSION_KEY);
    }

    const res = await fetch(MANIFEST_URL, { cache: 'no-store' });
    if (!res.ok) {
      setStatus({ state: 'error', reason: `manifest HTTP ${res.status}` });
      return;
    }
    const manifest: Manifest = await res.json();
    const installed = localStorage.getItem(VERSION_KEY) ?? '1.0.0';

    if (manifest.version === installed) {
      setStatus({ state: 'up_to_date', version: installed });
      return;
    }

    setStatus({ state: 'downloading', from: installed, to: manifest.version });

    const bundle = await updater.download({
      url: manifest.url,
      version: manifest.version,
    });

    localStorage.setItem(VERSION_KEY, manifest.version);
    _pendingBundle = bundle;
    // Don't call next() — App.tsx decides when to apply (background or idle)
    setStatus({ state: 'ready', version: manifest.version });
  } catch (e: any) {
    setStatus({ state: 'error', reason: `download failed: ${e?.message}` });
    console.warn('[Updater] download failed', e);
  } finally {
    _isChecking = false;
  }
}
