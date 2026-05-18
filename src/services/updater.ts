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
let _lastCheckAt      = 0;
let _lastTabCheckAt   = 0;
const RECHECK_COOLDOWN_MS = 5 * 60 * 1000;
const TAB_DEBOUNCE_MS     = 5_000;

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
 * Call once at cold start. Reads the ACTUALLY RUNNING bundle version from
 * Capgo's native layer (not localStorage) so rollbacks are detected and
 * self-healed on the next background cycle.
 */
export async function initUpdater(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    setStatus({ state: 'up_to_date', version: 'browser-dev' });
    return;
  }
  // Eager display of last-known version to avoid flicker before async completes
  const stored = localStorage.getItem(VERSION_KEY);
  if (stored) setStatus({ state: 'up_to_date', version: stored });

  try {
    const { CapacitorUpdater } = await import('@capgo/capacitor-updater');

    // ── Ground-truth version sync ──────────────────────────────────────────
    // CapacitorUpdater.current() returns what Capgo is ACTUALLY running,
    // not what localStorage says was downloaded. If a rollback happened,
    // localStorage would still show the old downloaded version while the
    // native layer is running an older bundle. Reading current() here corrects
    // that mismatch so _checkAndDownload re-downloads the latest bundle
    // automatically — this is the self-healing mechanism.
    try {
      const { bundle } = await CapacitorUpdater.current();
      const isBuiltin = !bundle.version || bundle.version === '0.0.0' || bundle.id === 'builtin';
      if (isBuiltin) {
        // Running built-in APK bundle — clear stored version so
        // _checkAndDownload treats it as unversioned and downloads latest.
        localStorage.removeItem(VERSION_KEY);
      } else if (bundle.version !== localStorage.getItem(VERSION_KEY)) {
        // Rollback detected: Capgo is running an older version than what
        // localStorage claims was installed. Correct the record.
        localStorage.setItem(VERSION_KEY, bundle.version);
        setStatus({ state: 'up_to_date', version: bundle.version });
      }
    } catch {
      // current() unavailable on this device/version — use stored as fallback
    }

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
 * Download-only check triggered on every tab-bar tap.
 * Never calls applyIfReady — apply happens via the button, background, or idle timer.
 */
export async function checkOnTabSwitch(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  if (_isChecking || _status.state === 'downloading' || _status.state === 'ready') return;
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
    const res = await fetch(MANIFEST_URL, { cache: 'no-store' });
    if (!res.ok) {
      setStatus({ state: 'error', reason: `manifest HTTP ${res.status}` });
      return;
    }
    const manifest: Manifest = await res.json();
    // Use '0.0.0' default so a missing key (built-in bundle, cleared above)
    // always triggers a download rather than a false "up to date".
    const installed = localStorage.getItem(VERSION_KEY) ?? '0.0.0';

    if (manifest.version === installed) {
      setStatus({ state: 'up_to_date', version: installed });
      return;
    }

    setStatus({ state: 'downloading', from: installed, to: manifest.version });

    const bundle = await updater.download({
      url: manifest.url,
      version: manifest.version,
    });

    // Store downloaded version. initUpdater() will overwrite this with the
    // REAL running version on the next cold start, so any rollback after
    // apply will be caught immediately.
    localStorage.setItem(VERSION_KEY, manifest.version);
    _pendingBundle = bundle;
    setStatus({ state: 'ready', version: manifest.version });
  } catch (e: any) {
    setStatus({ state: 'error', reason: `download failed: ${e?.message}` });
    console.warn('[Updater] download failed', e);
  } finally {
    _isChecking = false;
  }
}
