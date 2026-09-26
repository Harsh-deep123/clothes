import jwt from 'jsonwebtoken';

import { isSuperAdminRole } from './roles';

const SECRET = (process.env.JWT_SECRET || 'zayro-dev-jwt-secret-change-me').trim();

export type AuthTokenPayload = {
  userId: string;
  email: string;
  role?: 'admin' | 'SUPER_ADMIN' | 'DELIVERY_PERSON' | 'customer' | 'CUSTOMER';
};

export function signAuthToken(payload: AuthTokenPayload) {
  return jwt.sign(payload, SECRET, { expiresIn: '30d' });
}

export function verifyAuthToken(token: string): AuthTokenPayload | null {
  try {
    const decoded = jwt.verify(token, SECRET) as AuthTokenPayload;
    if (!decoded?.userId || !decoded?.email) return null;
    return { userId: decoded.userId, email: decoded.email, role: decoded.role };
  } catch {
    return null;
  }
}

export function verifyAdminToken(token: string) {
  const payload = verifyAuthToken(token);
  if (!payload || !isSuperAdminRole(payload.role)) return null;
  return payload;
}

export function verifyDeliveryToken(token: string) {
  const payload = verifyAuthToken(token);
  if (!payload || payload.role !== 'DELIVERY_PERSON') return null;
  return payload;
}

export function bearerToken(header?: string | string[]) {
  const value = Array.isArray(header) ? header[0] : header;
  if (!value) return '';
  const match = value.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || '';
}
