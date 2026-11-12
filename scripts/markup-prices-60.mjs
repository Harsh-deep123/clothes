/**
 * Raise every product price by 60% (×1.6) in MongoDB.
 * Idempotent: skips docs that already have priceMarkupPercent === 60.
 * Rounds to whole rupees.
 */
import { MongoClient } from 'mongodb';
import { config } from 'dotenv';

config();

const FACTOR = 1.6;
const MARK = 60;
const uri = (process.env.MONGODB_URI || 'mongodb://localhost:27017').trim();
const dbName = (process.env.MONGODB_DB || 'clothes').trim() || 'clothes';

function bump(n) {
  const value = Number(n);
  if (!(value > 0)) return value;
  return Math.round(value * FACTOR);
}

function roundRupee(n) {
  const value = Number(n);
  if (!(value > 0)) return value;
  return Math.round(value);
}

const client = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 });
await client.connect();
const col = client.db(dbName).collection('products');
const docs = await col.find({}).toArray();
let updated = 0;
let rounded = 0;
let skipped = 0;

for (const doc of docs) {
  const already = Number(doc.priceMarkupPercent) === MARK;

  if (already) {
    const listPrice = roundRupee(doc.listPrice || doc.originalPrice || doc.price);
    const price = roundRupee(doc.price);
    const sizes = Array.isArray(doc.sizes)
      ? doc.sizes.map((s) => ({
          ...s,
          ...(s.price != null && Number(s.price) > 0 ? { price: roundRupee(s.price) } : {}),
        }))
      : doc.sizes;
    const needsRound =
      listPrice !== doc.listPrice ||
      price !== doc.price ||
      JSON.stringify(sizes) !== JSON.stringify(doc.sizes);
    if (!needsRound) {
      skipped += 1;
      continue;
    }
    await col.updateOne(
      { _id: doc._id },
      { $set: { listPrice, price, sizes, updatedAt: new Date().toISOString() } },
    );
    rounded += 1;
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
        priceMarkupPercent: MARK,
      },
    },
  );
  updated += 1;
}

console.log(JSON.stringify({ total: docs.length, updated, rounded, skipped, factor: FACTOR }, null, 2));
const sample = await col.find({}).project({ id: 1, name: 1, price: 1, listPrice: 1, priceMarkupPercent: 1 }).limit(5).toArray();
console.log(sample);
await client.close();
