import { Capacitor } from '@capacitor/core';

const MANIFEST_URL =
  'https://Navneet7k.github.io/ZingWhitelabelCapacitor/manifest.json';

const VERSION_KEY = 'zing_bundle_version';
const UPDATE_STATUS_KEY = 'zing_update_status';

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
  | { state: 'ready'; version: string }   // downloaded, will apply on next launch
  | { state: 'error'; reason: string };

type StatusListener = (s: UpdateStatus) => void;
const listeners = new Set<StatusListener>();

function setStatus(s: UpdateStatus) {
  localStorage.setItem(UPDATE_STATUS_KEY, JSON.stringify(s));
  listeners.forEach(fn => fn(s));
}

export function getStatus(): UpdateStatus {
  try {
    const raw = localStorage.getItem(UPDATE_STATUS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { state: 'idle' };
}

export function onStatusChange(fn: StatusListener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export async function initUpdater(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    // In browser: show a fake status so the debug panel is visible
    setStatus({ state: 'up_to_date', version: 'browser-dev' });
    return;
  }

  try {
    const { CapacitorUpdater } = await import('@capgo/capacitor-updater');
    CapacitorUpdater.notifyAppReady();
    await checkAndDownload(CapacitorUpdater);
  } catch (e: any) {
    const reason = e?.message ?? String(e);
    setStatus({ state: 'error', reason });
    console.warn('[Updater] init failed', e);
  }
}

async function checkAndDownload(updater: any): Promise<void> {
  setStatus({ state: 'checking' });

  let manifest: Manifest;
  try {
    const res = await fetch(MANIFEST_URL, { cache: 'no-store' });
    if (!res.ok) {
      setStatus({ state: 'error', reason: `manifest HTTP ${res.status}` });
      return;
    }
    manifest = await res.json();
  } catch (e: any) {
    setStatus({ state: 'error', reason: `fetch failed: ${e?.message}` });
    return;
  }

  const installedVersion = localStorage.getItem(VERSION_KEY) ?? '1.0.0';

  if (manifest.version === installedVersion) {
    setStatus({ state: 'up_to_date', version: installedVersion });
    return;
  }

  setStatus({ state: 'downloading', from: installedVersion, to: manifest.version });

  try {
    const bundle = await updater.download({
      url: manifest.url,
      version: manifest.version,
    });

    await updater.next(bundle);
    localStorage.setItem(VERSION_KEY, manifest.version);
    setStatus({ state: 'ready', version: manifest.version });
    console.log(`[Updater] v${manifest.version} queued — close & reopen app to apply`);
  } catch (e: any) {
    setStatus({ state: 'error', reason: `download failed: ${e?.message}` });
    console.warn('[Updater] download failed', e);
  }
}
