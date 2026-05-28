import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { log, error } from './logger';

const FCM_TOKEN_KEY = 'zing_fcm_token';

export function getSavedFcmToken(): string {
  return localStorage.getItem(FCM_TOKEN_KEY) ?? '';
}

/**
 * Requests push permission, registers with FCM, and saves the token.
 * Only runs on native (Android/iOS). Returns the token or null.
 */
export async function initFcm(): Promise<string | null> {
  if (!Capacitor.isNativePlatform()) return null;

  try {
    const permission = await PushNotifications.requestPermissions();
    if (permission.receive !== 'granted') return null;

    await PushNotifications.register();

    return new Promise((resolve) => {
      PushNotifications.addListener('registration', ({ value }) => {
        // On iOS, the registration event fires twice: first with the raw APNS device
        // token (64-char uppercase hex), then with the real FCM token. Skip the first.
        if (Capacitor.getPlatform() === 'ios' && /^[0-9A-F]{64}$/.test(value)) {
          log('[FCM] iOS APNS token received, waiting for FCM token...');
          return;
        }
        localStorage.setItem(FCM_TOKEN_KEY, value);
        log('[FCM] Token generated:', value);
        resolve(value);
      });
      PushNotifications.addListener('registrationError', (err) => {
        error('[FCM] Registration error:', err);
        resolve(null);
      });
    });
  } catch (err) {
    error('[FCM] Init error:', err);
    return null;
  }
}
