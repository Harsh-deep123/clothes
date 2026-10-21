export type CopyRole = 'client' | 'admin';

export type CopyChange = {
  id: string;
  /** Text locked with a strikethrough. Client cannot edit or remove these. */
  strikes: string[];
  /** Current text. Empty means the client asked to remove it. */
  live: string;
  added?: boolean;
  afterId?: string;
  done?: boolean;
};

const SESSION_KEY = 'zayro_copy_session';
const STORE_KEY = 'zayro_copy_changes_v1';

const ACCOUNTS: Record<string, { password: string; role: CopyRole }> = {
  michael: { password: '123456', role: 'client' },
  admin: { password: '123456', role: 'admin' },
};

export function loginCopy(username: string, password: string): CopyRole | null {
  const account = ACCOUNTS[username.trim().toLowerCase()];
  if (!account || account.password !== password) return null;
  sessionStorage.setItem(SESSION_KEY, account.role);
  window.dispatchEvent(new Event('zayro-copy-auth'));
  return account.role;
}

export function logoutCopy() {
  sessionStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event('zayro-copy-auth'));
}

export function copyRole(): CopyRole | null {
  const value = sessionStorage.getItem(SESSION_KEY);
  return value === 'client' || value === 'admin' ? value : null;
}

export function loadChanges(): Record<string, CopyChange> {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, CopyChange>) : {};
  } catch {
    return {};
  }
}

export function saveChanges(next: Record<string, CopyChange>) {
  localStorage.setItem(STORE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event('zayro-copy-changes'));
}

export function upsertChange(change: CopyChange) {
  const all = loadChanges();
  all[change.id] = change;
  saveChanges(all);
}

export function pendingChanges() {
  return Object.values(loadChanges()).filter((change) => !change.done && (change.strikes.length > 0 || change.added));
}
