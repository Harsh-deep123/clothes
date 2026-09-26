import fs from 'fs/promises';
import path from 'path';
import type { ReturnRequest } from '../src/types/returnRequest';
import { migrateJsonIntoMongo, returnRequestsCollection, withoutMongoId } from './mongoCollections';

const STORE_PATH = path.resolve(process.cwd(), 'data', 'return-requests.json');
let migrated = false;

async function ensureMigrated() {
  if (migrated) return;
  await migrateJsonIntoMongo();
  migrated = true;
}

async function ensureFileStore() {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
  try {
    await fs.access(STORE_PATH);
  } catch {
    await fs.writeFile(STORE_PATH, '[]', 'utf8');
  }
}

async function listFromFile(): Promise<ReturnRequest[]> {
  await ensureFileStore();
  const raw = await fs.readFile(STORE_PATH, 'utf8');
  try {
    const parsed = JSON.parse(raw) as ReturnRequest[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveToFile(requests: ReturnRequest[]) {
  await ensureFileStore();
  await fs.writeFile(STORE_PATH, JSON.stringify(requests, null, 2), 'utf8');
}

export async function listReturnRequests(): Promise<ReturnRequest[]> {
  await ensureMigrated();
  const collection = await returnRequestsCollection();
  if (collection) {
    const docs = await collection.find({}).sort({ createdAt: -1 }).toArray();
    return docs.map((doc) => withoutMongoId(doc) as ReturnRequest);
  }
  return listFromFile();
}

export async function addReturnRequest(request: ReturnRequest): Promise<ReturnRequest> {
  await ensureMigrated();
  const collection = await returnRequestsCollection();
  if (collection) {
    await collection.insertOne({ ...request });
    return request;
  }
  const list = await listFromFile();
  list.unshift(request);
  await saveToFile(list);
  return request;
}

export async function updateReturnRequestStatus(
  id: string,
  status: ReturnRequest['status']
): Promise<ReturnRequest | null> {
  await ensureMigrated();
  const collection = await returnRequestsCollection();
  if (collection) {
    const current = await collection.findOne({ id });
    if (!current) return null;
    const next = { ...(withoutMongoId(current) as ReturnRequest), status };
    await collection.updateOne({ id }, { $set: { status } });
    return next;
  }
  const list = await listFromFile();
  const index = list.findIndex((item) => item.id === id);
  if (index < 0) return null;
  list[index] = { ...list[index], status };
  await saveToFile(list);
  return list[index];
}
