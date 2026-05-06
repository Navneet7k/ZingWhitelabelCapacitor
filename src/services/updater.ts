import { Capacitor } from '@capacitor/core';

// ─────────────────────────────────────────────────────────────────────────────
// REPLACE these two values after you create your GitHub repo and enable Pages:
//   YOUR_GITHUB_USERNAME  →  your GitHub username
//   YOUR_REPO_NAME        →  ZingWhitelabelCapacitor (or whatever you named it)
// ─────────────────────────────────────────────────────────────────────────────
const MANIFEST_URL =
  'https://Navneet7k.github.io/ZingWhitelabelCapacitor/manifest.json';

const VERSION_KEY = 'zing_bundle_version';

interface Manifest {
  version: string;
  url: string;
  notes?: string;
}

export async function initUpdater(): Promise<void> {
  // Only run on a real native device — skip in browser/dev
  if (!Capacitor.isNativePlatform()) return;

  try {
    const { CapacitorUpdater } = await import('@capgo/capacitor-updater');

    // Must call this first — tells the plugin the current bundle is stable.
    // If we crash before this call, the plugin auto-rolls back to the previous
    // working bundle on next launch.
    CapacitorUpdater.notifyAppReady();

    await checkAndDownload(CapacitorUpdater);
  } catch (e) {
    // Never crash the app over an update check failure
    console.warn('[Updater] init failed', e);
  }
}

async function checkAndDownload(updater: any): Promise<void> {
  let manifest: Manifest;
  try {
    const res = await fetch(MANIFEST_URL, { cache: 'no-store' });
    if (!res.ok) return;
    manifest = await res.json();
  } catch {
    return; // No internet or server down — continue with current bundle
  }

  const installedVersion = localStorage.getItem(VERSION_KEY) ?? '1.0.0';

  if (manifest.version === installedVersion) return; // Already up to date

  console.log(`[Updater] New version available: ${manifest.version}`);

  try {
    // Download the new bundle zip in the background
    const bundle = await updater.download({
      url: manifest.url,
      version: manifest.version,
    });

    // Queue it for the NEXT app launch — doesn't interrupt current session
    await updater.next(bundle);

    // Remember which version we queued
    localStorage.setItem(VERSION_KEY, manifest.version);

    console.log(`[Updater] Version ${manifest.version} queued — loads on next launch`);
  } catch (e) {
    console.warn('[Updater] Download failed', e);
  }
}
