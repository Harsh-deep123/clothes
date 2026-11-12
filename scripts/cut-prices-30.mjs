/**
 * Cut every product price by 30% (×0.7). Idempotent via priceCut30At marker.
 */
import { MongoClient } from 'mongodb';
import { config } from 'dotenv';

config();

const FACTOR = 0.7;
const MARK = 'cut30-v2';
const uri = (process.env.MONGODB_URI || 'mongodb://localhost:27017').trim();
const dbName = (process.env.MONGODB_DB || 'clothes').trim() || 'clothes';

function cut(n) {
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

  const listPrice = cut(doc.listPrice || doc.originalPrice || doc.price);
  const price = cut(doc.price);
  const sizes = Array.isArray(doc.sizes)
    ? doc.sizes.map((s) => ({
        ...s,
        ...(s.price != null && Number(s.price) > 0 ? { price: cut(s.price) } : {}),
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
        priceMarkupPercent: -9, // net vs DeoDap after +30% then −30%
        priceCutMark: MARK,
      },
    },
  );
  updated += 1;
}

console.log(JSON.stringify({ total: docs.length, updated, skipped, factor: FACTOR }, null, 2));
const sample = await col
  .find({})
  .project({ name: 1, price: 1, listPrice: 1, sku: 1, priceMarkupPercent: 1 })
  .limit(5)
  .toArray();
console.log(sample);
await client.close();
