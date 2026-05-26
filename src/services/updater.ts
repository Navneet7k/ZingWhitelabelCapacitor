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

  console.log('[OTA] initUpdater() — start');

  // Eager display of last-known version to avoid flicker before async completes
  const stored = localStorage.getItem(VERSION_KEY);
  console.log(`[OTA] initUpdater() — localStorage version: ${stored ?? '(none)'}`);
  if (stored) setStatus({ state: 'up_to_date', version: stored });

  try {
    const { CapacitorUpdater } = await import('@capgo/capacitor-updater');

    // ── Second notifyAppReady confirmation ────────────────────────────────
    console.log('[OTA] initUpdater() — calling notifyAppReady() (awaited)');
    await CapacitorUpdater.notifyAppReady().catch((e: any) => {
      console.error('[OTA] initUpdater() — notifyAppReady() FAILED:', e?.message ?? e);
    });
    console.log('[OTA] initUpdater() — notifyAppReady() confirmed by native layer');

    // ── Ground-truth version sync ──────────────────────────────────────────
    try {
      const { bundle } = await CapacitorUpdater.current();
      const isBuiltin = !bundle.version || bundle.version === '0.0.0' || bundle.id === 'builtin';
      console.log(`[OTA] initUpdater() — current bundle: id=${bundle.id} version=${bundle.version} isBuiltin=${isBuiltin}`);

      if (isBuiltin) {
        console.log('[OTA] initUpdater() — running built-in APK bundle, clearing stored version');
        localStorage.removeItem(VERSION_KEY);
        _lastCheckAt = 0;
      } else if (bundle.version !== localStorage.getItem(VERSION_KEY)) {
        console.warn(`[OTA] initUpdater() — ROLLBACK DETECTED: Capgo running v${bundle.version} but localStorage says v${localStorage.getItem(VERSION_KEY)}. Correcting.`);
        localStorage.setItem(VERSION_KEY, bundle.version);
        setStatus({ state: 'up_to_date', version: bundle.version });
        _lastCheckAt = 0;
      } else {
        console.log(`[OTA] initUpdater() — version match confirmed: v${bundle.version}`);
      }
    } catch (e: any) {
      console.warn('[OTA] initUpdater() — current() unavailable, using localStorage as fallback:', e?.message ?? e);
    }

    await _checkAndDownload(CapacitorUpdater);
  } catch (e: any) {
    setStatus({ state: 'error', reason: e?.message ?? String(e) });
    console.error('[OTA] initUpdater() — FAILED:', e?.message ?? e);
  }
}

/**
 * Lightweight re-check triggered on app foreground / tab switch.
 * Respects a 5-minute cooldown so the manifest endpoint isn't hammered.
 */
export async function recheckForUpdate(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  if (_isChecking) { console.log('[OTA] recheckForUpdate() — skipped (already checking)'); return; }
  if (_status.state === 'ready') { console.log('[OTA] recheckForUpdate() — skipped (bundle already ready)'); return; }
  if (Date.now() - _lastCheckAt < RECHECK_COOLDOWN_MS) {
    console.log(`[OTA] recheckForUpdate() — skipped (cooldown, next check in ${Math.round((RECHECK_COOLDOWN_MS - (Date.now() - _lastCheckAt)) / 1000)}s)`);
    return;
  }
  console.log('[OTA] recheckForUpdate() — checking...');
  try {
    const { CapacitorUpdater } = await import('@capgo/capacitor-updater');
    await _checkAndDownload(CapacitorUpdater);
  } catch (e: any) {
    console.warn('[OTA] recheckForUpdate() — failed:', e?.message ?? e);
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
  if (!_pendingBundle) { console.log('[OTA] applyIfReady() — no pending bundle, skipping'); return; }
  if (!Capacitor.isNativePlatform()) return;
  const bundle = _pendingBundle;
  _pendingBundle = null;
  console.log(`[OTA] applyIfReady() — calling set() to apply bundle v${bundle.version ?? '?'}. App will reload.`);
  try {
    const { CapacitorUpdater } = await import('@capgo/capacitor-updater');
    await CapacitorUpdater.set(bundle);
    console.log('[OTA] applyIfReady() — set() resolved (reload in progress)');
  } catch (e: any) {
    console.error('[OTA] applyIfReady() — set() FAILED, restoring bundle for retry:', e?.message ?? e);
    _pendingBundle = bundle;
  }
}

// ── Internal ──────────────────────────────────────────────────────────────────

async function _checkAndDownload(updater: any): Promise<void> {
  if (_isChecking) return;
  _isChecking = true;
  _lastCheckAt = Date.now();
  setStatus({ state: 'checking' });
  console.log('[OTA] _checkAndDownload() — fetching manifest...');

  try {
    const res = await fetch(MANIFEST_URL, { cache: 'no-store' });
    if (!res.ok) {
      console.error(`[OTA] _checkAndDownload() — manifest fetch failed: HTTP ${res.status}`);
      setStatus({ state: 'error', reason: `manifest HTTP ${res.status}` });
      return;
    }
    const manifest: Manifest = await res.json();
    const installed = localStorage.getItem(VERSION_KEY) ?? '0.0.0';
    console.log(`[OTA] _checkAndDownload() — manifest v${manifest.version} | installed v${installed}`);

    if (manifest.version === installed) {
      console.log('[OTA] _checkAndDownload() — already up to date');
      setStatus({ state: 'up_to_date', version: installed });
      return;
    }

    console.log(`[OTA] _checkAndDownload() — NEW VERSION AVAILABLE: v${installed} → v${manifest.version}. Downloading...`);
    setStatus({ state: 'downloading', from: installed, to: manifest.version });

    const bundle = await updater.download({
      url: manifest.url,
      version: manifest.version,
    });

    console.log(`[OTA] _checkAndDownload() — download complete. Bundle ready: v${manifest.version}`);
    localStorage.setItem(VERSION_KEY, manifest.version);
    _pendingBundle = bundle;
    setStatus({ state: 'ready', version: manifest.version });
  } catch (e: any) {
    console.error('[OTA] _checkAndDownload() — FAILED:', e?.message ?? e);
    setStatus({ state: 'error', reason: `download failed: ${e?.message}` });
  } finally {
    _isChecking = false;
  }
}
