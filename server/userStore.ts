import bcrypt from 'bcryptjs';
import { getDb } from './mongo';
import { withoutMongoId } from './mongoCollections';

import { indianMobileTenDigits, normalizeIndianMobile } from './indianPhone';

export type DbUser = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  phoneVerified?: boolean;
  passwordHash: string;
  shippingAddress: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  createdAt: string;
  updatedAt: string;
  role?: 'CUSTOMER' | 'DELIVERY_PERSON' | 'SUPER_ADMIN';
  status?: 'Active' | 'Inactive' | 'ACTIVE' | 'INACTIVE';
};

export type PublicUser = Omit<DbUser, 'passwordHash'>;

function publicUser(user: DbUser): PublicUser {
  const { passwordHash: _pw, ...rest } = user;
  return rest;
}

async function users() {
  const db = await getDb();
  return db?.collection<DbUser>('users') || null;
}

export async function findUserByEmail(email: string): Promise<DbUser | null> {
  const collection = await users();
  if (!collection) return null;
  const doc = await collection.findOne({ email: email.trim().toLowerCase() });
  return withoutMongoId(doc as (DbUser & Record<string, unknown>) | null) as DbUser | null;
}

export async function findUserById(id: string): Promise<DbUser | null> {
  const collection = await users();
  if (!collection) return null;
  const doc = await collection.findOne({ id });
  return withoutMongoId(doc as (DbUser & Record<string, unknown>) | null) as DbUser | null;
}

export async function findUserByPhone(phone: string): Promise<DbUser | null> {
  const collection = await users();
  if (!collection) return null;
  const e164 = normalizeIndianMobile(phone);
  if (!e164) return null;
  const ten = indianMobileTenDigits(e164);
  const doc = await collection.findOne({
    $or: [{ phone: e164 }, { phone: ten }, { phone: `91${ten}` }, { phone: `+91 ${ten}` }],
  });
  return withoutMongoId(doc as (DbUser & Record<string, unknown>) | null) as DbUser | null;
}

export async function createUser(input: {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  shippingAddress?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}): Promise<{ user: PublicUser } | { error: string; status: number }> {
  const collection = await users();
  if (!collection) return { error: 'Database is unavailable.', status: 503 };

  const email = input.email.trim().toLowerCase();
  if (!input.fullName.trim() || input.fullName.trim().length < 2) {
    return { error: 'Enter your full name.', status: 400 };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: 'Enter a valid email address.', status: 400 };
  }
  if (input.phone.trim().length < 8) {
    return { error: 'Enter a valid phone number.', status: 400 };
  }
  if (input.password.length < 8) {
    return { error: 'Password must be at least 8 characters.', status: 400 };
  }

  const phone = normalizeIndianMobile(input.phone) || input.phone.trim();
  const existing = await collection.findOne({ email });
  if (existing) return { error: 'An account already exists for this email.', status: 409 };
  if (normalizeIndianMobile(input.phone)) {
    const byPhone = await findUserByPhone(phone);
    if (byPhone) return { error: 'An account already exists for this phone number.', status: 409 };
  }

  const now = new Date().toISOString();
  const user: DbUser = {
    id: `user-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    fullName: input.fullName.trim(),
    email,
    phone,
    phoneVerified: false,
    passwordHash: await bcrypt.hash(input.password, 10),
    shippingAddress: input.shippingAddress?.trim() || '',
    city: input.city?.trim() || '',
    state: input.state?.trim() || '',
    country: input.country?.trim() || '',
    postalCode: input.postalCode?.trim() || '',
    createdAt: now,
    updatedAt: now,
  };

  try {
    await collection.insertOne({ ...user });
  } catch (error) {
    const code = (error as { code?: number }).code;
    if (code === 11000) return { error: 'An account already exists for this email or phone number.', status: 409 };
    throw error;
  }

  return { user: publicUser(user) };
}

export async function createUserFromVerifiedSignup(input: {
  fullName: string;
  email: string;
  phone: string;
  passwordHash: string;
}): Promise<{ user: PublicUser } | { error: string; status: number }> {
  const collection = await users();
  if (!collection) return { error: 'Database is unavailable.', status: 503 };

  const email = input.email.trim().toLowerCase();
  const phone = normalizeIndianMobile(input.phone);
  if (!phone) return { error: 'Enter a valid 10-digit Indian mobile number.', status: 400 };

  const existingEmail = await collection.findOne({ email });
  if (existingEmail) return { error: 'An account already exists for this email.', status: 409 };
  const existingPhone = await findUserByPhone(phone);
  if (existingPhone) return { error: 'An account already exists for this phone number.', status: 409 };

  const now = new Date().toISOString();
  const user: DbUser = {
    id: `user-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    fullName: input.fullName.trim(),
    email,
    phone,
    phoneVerified: true,
    passwordHash: input.passwordHash,
    shippingAddress: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    createdAt: now,
    updatedAt: now,
  };

  try {
    await collection.insertOne({ ...user });
  } catch (error) {
    const code = (error as { code?: number }).code;
    if (code === 11000) return { error: 'An account already exists for this email or phone number.', status: 409 };
    throw error;
  }

  return { user: publicUser(user) };
}

export async function verifyUser(email: string, password: string) {
  const collection = await users();
  if (!collection) return { error: 'Database is unavailable.', status: 503 as const };
  const user = await findUserByEmail(email);
  if (!user) return { error: 'No account found for this email.', status: 401 as const };
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return { error: 'Password does not match.', status: 401 as const };
  return { user: publicUser(user) };
}

export async function updateUserProfile(
  userId: string,
  patch: Partial<Pick<DbUser, 'fullName' | 'phone' | 'shippingAddress' | 'city' | 'state' | 'country' | 'postalCode'>>
): Promise<PublicUser | null> {
  const collection = await users();
  if (!collection) return null;
  const current = await findUserById(userId);
  if (!current) return null;
  const next: DbUser = {
    ...current,
    fullName: patch.fullName?.trim() || current.fullName,
    phone: patch.phone?.trim() || current.phone,
    shippingAddress: patch.shippingAddress ?? current.shippingAddress,
    city: patch.city ?? current.city,
    state: patch.state ?? current.state,
    country: patch.country ?? current.country,
    postalCode: patch.postalCode ?? current.postalCode,
    updatedAt: new Date().toISOString(),
  };
  await collection.updateOne({ id: userId }, { $set: next });
  return publicUser(next);
}

export function isDeliveryPersonActive(status?: string) {
  return (status || 'Active').toUpperCase() === 'ACTIVE';
}

export type DeliveryPersonPublic = PublicUser & {
  role: 'DELIVERY_PERSON';
  status: 'Active' | 'Inactive';
  assigned: number;
  delivered: number;
  pending: number;
};

function asDeliveryStatus(status?: string): 'Active' | 'Inactive' {
  return isDeliveryPersonActive(status) ? 'Active' : 'Inactive';
}

export async function listDeliveryPersons(): Promise<DbUser[]> {
  const collection = await users();
  if (!collection) return [];
  const docs = await collection.find({ role: 'DELIVERY_PERSON' }).sort({ fullName: 1 }).toArray();
  return docs.map((doc) => withoutMongoId(doc as DbUser & Record<string, unknown>) as DbUser);
}

export async function createDeliveryPerson(input: {
  fullName: string;
  phone: string;
  email: string;
  password: string;
  status?: 'Active' | 'Inactive';
}): Promise<{ user: PublicUser } | { error: string; status: number }> {
  const created = await createUser({
    fullName: input.fullName,
    email: input.email,
    phone: input.phone,
    password: input.password,
  });
  if ('error' in created) return created;
  const collection = await users();
  if (!collection) return { error: 'Database is unavailable.', status: 503 };
  const status = input.status === 'Inactive' ? 'Inactive' : 'Active';
  await collection.updateOne(
    { id: created.user.id },
    { $set: { role: 'DELIVERY_PERSON', status, updatedAt: new Date().toISOString() } }
  );
  const next = await findUserById(created.user.id);
  if (!next) return { error: 'Could not create delivery person.', status: 500 };
  return { user: publicUser(next) };
}

export async function updateDeliveryPerson(
  id: string,
  patch: Partial<{ fullName: string; phone: string; email: string; password: string; status: 'Active' | 'Inactive' }>
): Promise<PublicUser | { error: string; status: number }> {
  const collection = await users();
  if (!collection) return { error: 'Database is unavailable.', status: 503 };
  const current = await findUserById(id);
  if (!current || current.role !== 'DELIVERY_PERSON') return { error: 'Delivery person not found.', status: 404 };
  const email = patch.email?.trim().toLowerCase();
  if (email && email !== current.email) {
    const taken = await findUserByEmail(email);
    if (taken) return { error: 'An account already exists for this email.', status: 409 };
  }
  const next: DbUser = {
    ...current,
    fullName: patch.fullName?.trim() || current.fullName,
    phone: patch.phone?.trim() || current.phone,
    email: email || current.email,
    status: patch.status || asDeliveryStatus(current.status),
    role: 'DELIVERY_PERSON',
    updatedAt: new Date().toISOString(),
    passwordHash: patch.password ? await bcrypt.hash(patch.password, 10) : current.passwordHash,
  };
  await collection.updateOne({ id }, { $set: next });
  return publicUser(next);
}

export async function deleteDeliveryPerson(id: string): Promise<{ ok: true } | { error: string; status: number }> {
  const collection = await users();
  if (!collection) return { error: 'Database is unavailable.', status: 503 };
  const current = await findUserById(id);
  if (!current || current.role !== 'DELIVERY_PERSON') return { error: 'Delivery person not found.', status: 404 };
  await collection.deleteOne({ id });
  return { ok: true };
}
