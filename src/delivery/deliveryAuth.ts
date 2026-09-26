const SESSION_KEY = 'zayro_delivery_session';
const TOKEN_KEY = 'zayro_delivery_token';

export type DeliverySession = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
};

export function getDeliveryToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY) || '';
  } catch {
    return '';
  }
}

export function isDeliveryLoggedIn() {
  return Boolean(getDeliveryToken() && sessionStorage.getItem(SESSION_KEY));
}

export function getDeliverySession(): DeliverySession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as DeliverySession) : null;
  } catch {
    return null;
  }
}

export async function loginDelivery(email: string, password: string): Promise<string | null> {
  try {
    const response = await fetch('/api/delivery/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ email: email.trim(), password }),
    });
    const data = (await response.json()) as {
      token?: string;
      user?: DeliverySession;
      error?: string;
    };
    if (!response.ok || !data.token || !data.user) {
      return data.error || 'Delivery sign in failed.';
    }
    sessionStorage.setItem(TOKEN_KEY, data.token);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(data.user));
    return null;
  } catch {
    return 'Delivery sign in failed.';
  }
}

export function logoutDelivery() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(SESSION_KEY);
}

export function deliveryAuthHeaders() {
  const token = getDeliveryToken();
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}
