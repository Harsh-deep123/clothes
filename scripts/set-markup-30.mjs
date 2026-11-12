/**
 * Convert catalog from current (+60% then −30% ≈ ×1.12) to clean +30% (×1.3 vs original).
 * Formula: price *= 1.3 / 1.12
 * Idempotent when priceMarkupPercent === 30 and priceMarkdownPercent is unset.
 */
import { MongoClient } from 'mongodb';
import { config } from 'dotenv';

config();

const FROM = 1.6 * 0.7; // current net vs original
const TO = 1.3; // desired net vs original
const FACTOR = TO / FROM;
const uri = (process.env.MONGODB_URI || 'mongodb://localhost:27017').trim();
const dbName = (process.env.MONGODB_DB || 'clothes').trim() || 'clothes';

function bump(n) {
  const value = Number(n);
  if (!(value > 0)) return value;
  return Math.max(1, Math.round(value * FACTOR));
}

const client = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 });
await client.connect();
const col = client.db(dbName).collection('products');
const docs = await col.find({}).toArray();
let updated = 0;
let skipped = 0;

for (const doc of docs) {
  if (Number(doc.priceMarkupPercent) === 30 && doc.priceMarkdownPercent == null) {
    skipped += 1;
    continue;
  }

  const listPrice = bump(doc.listPrice || doc.originalPrice || doc.price);
  const price = bump(doc.price);
  const sizes = Array.isArray(doc.sizes)
    ? doc.sizes.map((s) => ({
        ...s,
        ...(s.price != null && Number(s.price) > 0 ? { price: bump(s.price) } : {}),
      }))
    : doc.sizes;

  await col.updateOne(
    { _id: doc._id },
    {
      $set: {
        listPrice,
        price,
        sizes,
        updatedAt: new Date().toISOString(),
        priceMarkupPercent: 30,
      },
      $unset: { priceMarkdownPercent: '' },
    },
  );
  updated += 1;
}

console.log(JSON.stringify({ total: docs.length, updated, skipped, factor: FACTOR, targetMarkup: '30%' }, null, 2));
const sample = await col
  .find({})
  .project({ name: 1, price: 1, listPrice: 1, sku: 1, priceMarkupPercent: 1, priceMarkdownPercent: 1 })
  .limit(5)
  .toArray();
console.log(sample);
await client.close();
