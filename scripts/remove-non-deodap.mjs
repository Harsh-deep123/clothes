/**
 * Delete every Mongo product whose handle is not in the cached DeoDap catalog.
 * Keeps only products present on deodap.in (from tmp/deodap-pages).
 */
import { MongoClient } from 'mongodb';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';

config();

const uri = (process.env.MONGODB_URI || 'mongodb://localhost:27017').trim();
const dbName = (process.env.MONGODB_DB || 'clothes').trim() || 'clothes';
const CACHE_DIR = path.resolve('tmp/deodap-pages');

const handles = new Set();
for (const file of fs.readdirSync(CACHE_DIR).filter((f) => /^page-\d+\.json$/.test(f))) {
  const data = JSON.parse(fs.readFileSync(path.join(CACHE_DIR, file), 'utf8'));
  for (const product of data.products || []) {
    const handle = String(product.handle || '').trim();
    if (handle) handles.add(handle);
  }
}

const client = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 });
await client.connect();
const col = client.db(dbName).collection('products');
const all = await col
  .find({})
  .project({ id: 1, name: 1, importedFrom: 1, purchasedFrom: 1, deodapHandle: 1, price: 1 })
  .toArray();

const removeIds = [];
const removeSample = [];
for (const doc of all) {
  const handle = String(doc.deodapHandle || doc.id || '').trim();
  if (handles.has(handle)) continue;
  removeIds.push(doc.id);
  if (removeSample.length < 40) {
    removeSample.push({
      id: doc.id,
      name: doc.name,
      purchasedFrom: doc.purchasedFrom || '',
      importedFrom: doc.importedFrom || '',
      price: doc.price,
    });
  }
}

const toolkit = all.filter((d) => /27-pcs-home-repairing|tool kit with hammer/i.test(`${d.id} ${d.name}`));

if (!removeIds.length) {
  console.log(JSON.stringify({ cacheHandles: handles.size, mongoTotal: all.length, deleted: 0, toolkit }, null, 2));
  await client.close();
  process.exit(0);
}

const result = await col.deleteMany({ id: { $in: removeIds } });
const remaining = await col.countDocuments();
const remainingDeodap = await col.countDocuments({ importedFrom: 'deodap' });
const stillOff = await col.countDocuments({
  $expr: {
    $not: {
      $in: [{ $ifNull: ['$deodapHandle', '$id'] }, [...handles]],
    },
  },
});

console.log(
  JSON.stringify(
    {
      cacheHandles: handles.size,
      mongoBefore: all.length,
      deleted: result.deletedCount,
      remaining,
      remainingDeodap,
      removeSample,
      toolkit,
    },
    null,
    2,
  ),
);
await client.close();
