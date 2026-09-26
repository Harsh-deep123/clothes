import fs from 'fs/promises';
import path from 'path';
import type { StoredOrder } from './orderStore';
import type { ReturnRequest } from '../src/types/returnRequest';
import { getDb } from './mongo';

export function withoutMongoId<T extends Record<string, unknown>>(doc: T | null): Omit<T, '_id'> | null {
  if (!doc) return null;
  const copy = { ...doc };
  delete (copy as { _id?: unknown })._id;
  return copy;
}

async function readJsonFile<T>(filePath: string): Promise<T[]> {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw) as T[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function migrateJsonIntoMongo() {
  const database = await getDb();
  if (!database) return;

  const orders = database.collection<StoredOrder>('orders');
  if ((await orders.countDocuments()) === 0) {
    const fromFile = await readJsonFile<StoredOrder>(path.resolve(process.cwd(), 'data', 'orders.json'));
    if (fromFile.length) {
      await orders.insertMany(fromFile);
    }
  }

  const returns = database.collection<ReturnRequest>('return_requests');
  if ((await returns.countDocuments()) === 0) {
    const fromFile = await readJsonFile<ReturnRequest>(
      path.resolve(process.cwd(), 'data', 'return-requests.json')
    );
    if (fromFile.length) {
      await returns.insertMany(fromFile);
    }
  }

  await import('./shopOrders').then((mod) => mod.seedProductsCollection()).catch(() => undefined);
}

export async function ordersCollection() {
  const database = await getDb();
  return database?.collection<StoredOrder>('orders') || null;
}

export async function returnRequestsCollection() {
  const database = await getDb();
  return database?.collection<ReturnRequest>('return_requests') || null;
}
