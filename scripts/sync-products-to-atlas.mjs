/**
 * Copy products from local MongoDB to a target MongoDB (Vercel/Atlas).
 *
 * Usage:
 *   node scripts/sync-products-to-atlas.mjs
 *
 * Requires in .env (or env):
 *   MONGODB_URI / MONGODB_DB = source (usually local)
 *   TARGET_MONGODB_URI / TARGET_MONGODB_DB = destination Atlas
 */
import 'dotenv/config';
import { MongoClient } from 'mongodb';

const sourceUri = (process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017').trim();
const sourceDbName = (process.env.MONGODB_DB || 'clothes').trim() || 'clothes';
const targetUri = (process.env.TARGET_MONGODB_URI || '').trim();
const targetDbName = (process.env.TARGET_MONGODB_DB || process.env.MONGODB_DB || 'clothes').trim() || 'clothes';

if (!targetUri) {
  console.error('Set TARGET_MONGODB_URI to your Atlas / Vercel Mongo connection string.');
  process.exit(1);
}

const BATCH = 200;
const source = new MongoClient(sourceUri);
const target = new MongoClient(targetUri);

await source.connect();
await target.connect();
const from = source.db(sourceDbName).collection('products');
const to = target.db(targetDbName).collection('products');

const total = await from.countDocuments();
console.log(`Syncing ${total} products -> ${targetDbName}`);

let skipped = 0;
let written = 0;
const cursor = from.find({});
let batch = [];

async function flush() {
  if (!batch.length) return;
  const ops = batch.map((doc) => {
    const { _id, ...rest } = doc;
    return {
      updateOne: {
        filter: { id: rest.id },
        update: { $set: rest },
        upsert: true,
      },
    };
  });
  const result = await to.bulkWrite(ops, { ordered: false });
  written += (result.upsertedCount || 0) + (result.modifiedCount || 0);
  batch = [];
}

for await (const doc of cursor) {
  if (!doc?.id) {
    skipped += 1;
    continue;
  }
  batch.push(doc);
  if (batch.length >= BATCH) {
    await flush();
    process.stdout.write(`\rSynced ~${written}/${total}`);
  }
}
await flush();
console.log(`\nDone. wrote/updated≈${written}, skipped=${skipped}, sourceTotal=${total}`);
console.log(`Target now has ${await to.countDocuments()} products.`);

await source.close();
await target.close();
