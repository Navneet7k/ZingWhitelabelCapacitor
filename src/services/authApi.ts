import { getSavedFcmToken } from './fcmService';

const BASE_URL = 'https://app.zingmyorder.com/api';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  mobile?: string;
  [key: string]: unknown;
}

// ── API calls ──────────────────────────────────────────────────────────────────

export async function login(
  email: string,
  password: string,
  restaurantId: string,
): Promise<{ token: string; user: AuthUser }> {
  const body = { email, password: '***', restaurant_id: restaurantId, is_app: '1', flag: 'app', fcm_token: getSavedFcmToken() };
  console.log('[Login] Request:', `${BASE_URL}/clientlogin`, body);
  const res = await fetch(`${BASE_URL}/clientlogin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, password }),
  });
  const data = await res.json();
  console.log('[Login] Response:', res.status, data);
  if (!data.status) throw new Error(data.message ?? 'Login failed');
  return { token: data.token, user: data.user };
}

export async function register(params: {
  name: string;
  email: string;
  mobile: string;
  password: string;
  passwordConfirmation: string;
  restaurantId: string;
}): Promise<void> {
  const logBody = { name: params.name, email: params.email, mobile: params.mobile, password: '***', password_confirmation: '***', restaurant_id: params.restaurantId, is_app: '1', fcm_token: getSavedFcmToken() };
  console.log('[Register] Request:', `${BASE_URL}/clientregister`, logBody);
  const res = await fetch(`${BASE_URL}/clientregister`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name:                  params.name,
      email:                 params.email,
      mobile:                params.mobile,
      password:              params.password,
      password_confirmation: params.passwordConfirmation,
      restaurant_id:         params.restaurantId,
      is_app:                '1',
      fcm_token:             getSavedFcmToken(),
    }),
  });
  const data = await res.json();
  console.log('[Register] Response:', res.status, data);
  if (!data.status) {
    const errors = data.errors as Record<string, string[]> | undefined;
    let message = data.message ?? 'Registration failed';
    if (errors) {
      const first = Object.values(errors)[0];
      if (Array.isArray(first) && first.length) message = first[0];
    }
    throw new Error(message);
  }
}

export async function updateFcmToken(fcmToken: string, apiToken: string): Promise<void> {
  try {
    const { CapacitorHttp } = await import('@capacitor/core');
    const res = await CapacitorHttp.post({
      url: `${BASE_URL}/client/update/fcm?api_token=${apiToken}`,
      headers: { 'Content-Type': 'application/json' },
      data: { fcm_token: fcmToken },
    });
    if (res.status >= 200 && res.status < 300) {
      console.log('[FCM] Token updated to backend successfully:', res.data);
    } else {
      console.warn('[FCM] Backend token update failed:', res.status, res.data);
    }
  } catch (err) {
    console.error('[FCM] Token update request error:', err);
  }
}

// ── Local storage ──────────────────────────────────────────────────────────────

const TOKEN_KEY = 'zing_auth_token';
const USER_KEY  = 'zing_auth_user';

export function saveAuth(token: string, user: AuthUser): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getSavedUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
