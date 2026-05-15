import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

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
        localStorage.setItem(FCM_TOKEN_KEY, value);
        resolve(value);
      });
      PushNotifications.addListener('registrationError', () => resolve(null));
    });
  } catch {
    return null;
  }
}
