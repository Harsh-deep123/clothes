/**
 * Raise every product price by 20% (×1.2). Idempotent via priceCutMark === bump20-v5.
 */
import { MongoClient } from 'mongodb';
import { config } from 'dotenv';

config();

const FACTOR = 1.2;
const MARK = 'bump20-v5';
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
  if (doc.priceCutMark === MARK) {
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
        // net vs DeoDap: 1.3*0.7*0.7*1.3*1.2 ≈ 0.994
        priceMarkupPercent: -1,
        priceCutMark: MARK,
      },
    },
  );
  updated += 1;
}

console.log(JSON.stringify({ total: docs.length, updated, skipped, factor: FACTOR }, null, 2));
const sample = await col
  .find({})
  .project({ name: 1, price: 1, listPrice: 1, sku: 1 })
  .limit(5)
  .toArray();
console.log(sample);
await client.close();
