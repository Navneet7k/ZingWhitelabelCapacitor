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
// Bundle reference kept in memory — can't be serialised to localStorage
let _pendingBundle: any = null;
let _isChecking = false;
let _lastCheckAt = 0;
const RECHECK_COOLDOWN_MS = 5 * 60 * 1000; // 5 min between rechecks

function setStatus(s: UpdateStatus) {
  _status = s;
  listeners.forEach(fn => fn(s));
}

export function getStatus(): UpdateStatus { return _status; }

export function onStatusChange(fn: StatusListener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Cold-start init — also calls notifyAppReady so Capgo doesn't roll back. */
export async function initUpdater(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    setStatus({ state: 'up_to_date', version: 'browser-dev' });
    return;
  }
  try {
    const { CapacitorUpdater } = await import('@capgo/capacitor-updater');
    CapacitorUpdater.notifyAppReady();
    await _checkAndDownload(CapacitorUpdater);
  } catch (e: any) {
    setStatus({ state: 'error', reason: e?.message ?? String(e) });
    console.warn('[Updater] init failed', e);
  }
}

/**
 * Call this on app resume (visibilitychange) and tab switches.
 * Respects a 5-minute cooldown so it doesn't hammer the manifest endpoint.
 */
export async function recheckForUpdate(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  if (_isChecking) return;
  if (Date.now() - _lastCheckAt < RECHECK_COOLDOWN_MS) return;
  // Don't interrupt an update the user has already been shown
  if (_status.state === 'ready') return;
  try {
    const { CapacitorUpdater } = await import('@capgo/capacitor-updater');
    await _checkAndDownload(CapacitorUpdater);
  } catch (e) {
    console.warn('[Updater] recheck failed', e);
  }
}

/** Apply update immediately — causes app to reload in ~1 s. */
export async function applyNow(): Promise<void> {
  if (!_pendingBundle) return;
  const bundle = _pendingBundle;
  _pendingBundle = null;
  const { CapacitorUpdater } = await import('@capgo/capacitor-updater');
  await CapacitorUpdater.set(bundle); // triggers immediate reload
}

/** Queue update for next cold start (user chose "Later"). */
export async function applyLater(): Promise<void> {
  if (!_pendingBundle) return;
  const bundle = _pendingBundle;
  _pendingBundle = null;
  setStatus({ state: 'up_to_date', version: bundle.version ?? 'unknown' });
  const { CapacitorUpdater } = await import('@capgo/capacitor-updater');
  await CapacitorUpdater.next(bundle);
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
    // Do NOT call next() here — let the user decide via UpdatePrompt
    setStatus({ state: 'ready', version: manifest.version });
  } catch (e: any) {
    setStatus({ state: 'error', reason: `download failed: ${e?.message}` });
    console.warn('[Updater] download failed', e);
  } finally {
    _isChecking = false;
  }
}
