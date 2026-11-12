/**
 * Assign unique ZY-000001 style IDs to every product.
 * Keeps existing valid unique skus; fills gaps for missing/duplicate ones.
 */
import { MongoClient } from 'mongodb';
import { config } from 'dotenv';

config();

const uri = (process.env.MONGODB_URI || 'mongodb://localhost:27017').trim();
const dbName = (process.env.MONGODB_DB || 'clothes').trim() || 'clothes';

function formatSku(seq) {
  return `ZY-${String(seq).padStart(6, '0')}`;
}

function parseSku(sku) {
  const match = /^ZY-(\d+)$/i.exec(String(sku || '').trim());
  return match ? Number(match[1]) : null;
}

const client = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 });
await client.connect();
const db = client.db(dbName);
const col = db.collection('products');
const docs = await col.find({}).sort({ _id: 1 }).project({ _id: 1, id: 1, sku: 1, name: 1 }).toArray();

const skuOwners = new Map(); // seq -> first _id
for (const doc of docs) {
  const n = parseSku(doc.sku);
  if (!n) continue;
  if (!skuOwners.has(n)) skuOwners.set(n, String(doc._id));
}

let maxSeq = 0;
for (const n of skuOwners.keys()) {
  if (n > maxSeq) maxSeq = n;
}

let next = maxSeq;
let assigned = 0;
let kept = 0;

for (const doc of docs) {
  const n = parseSku(doc.sku);
  const owner = n ? skuOwners.get(n) : null;
  const isUniqueOwner = Boolean(n && owner === String(doc._id));
  if (isUniqueOwner) {
    const normalized = formatSku(n);
    if (String(doc.sku).trim().toUpperCase() !== normalized) {
      await col.updateOne({ _id: doc._id }, { $set: { sku: normalized } });
    }
    kept += 1;
    continue;
  }

  do {
    next += 1;
  } while (skuOwners.has(next));
  skuOwners.set(next, String(doc._id));
  const sku = formatSku(next);
  await col.updateOne({ _id: doc._id }, { $set: { sku, updatedAt: new Date().toISOString() } });
  assigned += 1;
  if (next > maxSeq) maxSeq = next;
}

await db.collection('counters').updateOne(
  { _id: 'productSku' },
  { $set: { seq: maxSeq } },
  { upsert: true },
);

try {
  await col.createIndex({ sku: 1 }, { unique: true, sparse: true });
  await col.createIndex({ id: 1 }, { unique: true });
} catch (err) {
  console.warn('[sku] index warning:', err.message || err);
}

const sample = await col.find({}).project({ id: 1, name: 1, sku: 1 }).limit(5).toArray();
console.log(JSON.stringify({ total: docs.length, assigned, kept, maxSeq, sample }, null, 2));
await client.close();
