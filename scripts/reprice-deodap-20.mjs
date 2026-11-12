/**
 * Reset every DeoDap product price from cached deodap.in pages,
 * then apply a clean +20% markup (×1.2). Rounds to whole rupees.
 */
import { MongoClient } from 'mongodb';
import { config } from 'dotenv';
import fs from 'fs/promises';
import path from 'path';

config();

// Exact DeoDap wholesale (no extra markup) so storefront matches deodap.in
const MARKUP = 1;
const MARK = 'deodap-exact-v1';
const uri = (process.env.MONGODB_URI || 'mongodb://localhost:27017').trim();
const dbName = (process.env.MONGODB_DB || 'clothes').trim() || 'clothes';
const CACHE_DIR = path.resolve('tmp/deodap-pages');

function money(n) {
  const value = Number(n);
  if (!(value > 0)) return 0;
  return Math.max(1, Math.round(value * MARKUP));
}

function pricesFromRaw(raw) {
  const variants = Array.isArray(raw.variants) ? raw.variants : [];
  const prices = variants.map((v) => Number(v.price) || 0).filter((n) => n > 0);
  const compares = variants.map((v) => Number(v.compare_at_price) || 0).filter((n) => n > 0);
  const sale = prices.length ? Math.min(...prices) : 0;
  const compare = compares.length ? Math.max(...compares) : 0;
  const list = compare > sale ? compare : sale;
  const discountValue =
    list > 0 && sale > 0 && list > sale ? Math.max(1, Math.round(((list - sale) / list) * 100)) : 0;
  const saleEnabled = discountValue > 0;
  return {
    rawSale: sale,
    rawList: list,
    price: money(saleEnabled ? sale : list),
    listPrice: money(list),
    discountValue,
    saleEnabled,
  };
}

const byHandle = new Map();
const files = (await fs.readdir(CACHE_DIR)).filter((f) => /^page-\d+\.json$/.test(f));
for (const file of files) {
  const data = JSON.parse(await fs.readFile(path.join(CACHE_DIR, file), 'utf8'));
  for (const raw of data.products || []) {
    const handle = String(raw.handle || '').trim();
    if (!handle) continue;
    byHandle.set(handle, pricesFromRaw(raw));
  }
}

const client = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 });
await client.connect();
const col = client.db(dbName).collection('products');
const docs = await col.find({ importedFrom: 'deodap' }).toArray();

let updated = 0;
let missing = 0;
const missingSample = [];

for (const doc of docs) {
  const handle = String(doc.deodapHandle || doc.id || '').trim();
  const priced = byHandle.get(handle);
  if (!priced || !(priced.listPrice > 0)) {
    missing += 1;
    if (missingSample.length < 8) missingSample.push(handle);
    continue;
  }

  const sizes = Array.isArray(doc.sizes)
    ? doc.sizes.map((s) => ({
        ...s,
        ...(s.price != null && Number(s.price) > 0 ? { price: priced.listPrice } : {}),
      }))
    : doc.sizes;

  await col.updateOne(
    { _id: doc._id },
    {
      $set: {
        price: priced.price,
        listPrice: priced.listPrice,
        sizes,
        isSale: priced.saleEnabled,
        discountEnabled: priced.saleEnabled,
        discountType: 'percent',
        discountValue: priced.discountValue,
        saleEnabled: priced.saleEnabled,
        priceMarkupPercent: 0,
        priceCutMark: MARK,
        deodapRawPrice: priced.rawSale,
        deodapRawListPrice: priced.rawList,
        updatedAt: new Date().toISOString(),
      },
    },
  );
  updated += 1;
}

const sample = await col
  .find({ importedFrom: 'deodap', priceCutMark: MARK })
  .project({ name: 1, price: 1, listPrice: 1, sku: 1, deodapRawPrice: 1, deodapRawListPrice: 1 })
  .limit(5)
  .toArray();

console.log(
  JSON.stringify(
    {
      cacheProducts: byHandle.size,
      deodapDocs: docs.length,
      updated,
      missing,
      missingSample,
      markup: MARKUP,
      sample,
    },
    null,
    2,
  ),
);
await client.close();
