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
  const res = await fetch(`${BASE_URL}/clientlogin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      restaurant_id: restaurantId,
      is_app: '1',
      flag: 'app',
      fcm_token: '',
    }),
  });
  const data = await res.json();
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
      fcm_token:             '',
    }),
  });
  const data = await res.json();
  if (!data.status) {
    // Extract first field-level error if present
    const errors = data.errors as Record<string, string[]> | undefined;
    let message = data.message ?? 'Registration failed';
    if (errors) {
      const first = Object.values(errors)[0];
      if (Array.isArray(first) && first.length) message = first[0];
    }
    throw new Error(message);
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
