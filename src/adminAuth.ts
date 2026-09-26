const ADMIN_ACCOUNT_KEY = 'zayro_admin_account';
const ADMIN_SESSION_KEY = 'zayro_admin_session';
const ADMIN_TOKEN_KEY = 'zayro_admin_token';

export const DEFAULT_ADMIN_EMAIL = 'admin@zayrocollection.com';
const DEFAULT_ADMIN_PASSWORD = 'ZayroAdmin#2026';

interface AdminAccount {
  email: string;
  password: string;
}

function seedAdmin() {
  if (!localStorage.getItem(ADMIN_ACCOUNT_KEY)) {
    const account: AdminAccount = {
      email: DEFAULT_ADMIN_EMAIL,
      password: DEFAULT_ADMIN_PASSWORD,
    };
    localStorage.setItem(ADMIN_ACCOUNT_KEY, JSON.stringify(account));
  }
}

seedAdmin();

export function getAdminAccount(): AdminAccount | null {
  try {
    const raw = localStorage.getItem(ADMIN_ACCOUNT_KEY);
    return raw ? (JSON.parse(raw) as AdminAccount) : null;
  } catch {
    return null;
  }
}

export function isAdminLoggedIn(): boolean {
  const session = sessionStorage.getItem(ADMIN_SESSION_KEY);
  const account = getAdminAccount();
  return Boolean(session && account && session.toLowerCase() === account.email.toLowerCase());
}

export function getAdminSessionEmail(): string | null {
  return isAdminLoggedIn() ? sessionStorage.getItem(ADMIN_SESSION_KEY) : null;
}

export function loginAdmin(email: string, password: string): string | null {
  const account = getAdminAccount();
  if (!account || account.email.toLowerCase() !== email.trim().toLowerCase()) {
    return 'Invalid admin credentials.';
  }
  if (account.password !== password) {
    return 'Invalid admin credentials.';
  }
  sessionStorage.setItem(ADMIN_SESSION_KEY, account.email);
  return null;
}

export function getAdminToken() {
  try {
    return sessionStorage.getItem(ADMIN_TOKEN_KEY) || '';
  } catch {
    return '';
  }
}

export async function loginAdminWithApi(email: string, password: string): Promise<string | null> {
  const localError = loginAdmin(email, password);
  if (localError) return localError;
  try {
    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ email: email.trim(), password }),
    });
    const data = (await response.json()) as { token?: string; error?: string };
    if (!response.ok || !data.token) {
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
      return data.error || 'Admin sign in failed.';
    }
    sessionStorage.setItem(ADMIN_TOKEN_KEY, data.token);
    return null;
  } catch {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    return 'Admin sign in failed.';
  }
}

export function logoutAdmin() {
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
  sessionStorage.removeItem(ADMIN_TOKEN_KEY);
}
