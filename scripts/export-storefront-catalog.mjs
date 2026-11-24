/**
 * Export a mobile-safe lite catalog from local Mongo for Vercel fallback.
 * Writes server/data/catalog-lite.json (+ category chunks under server/data/catalog/).
 */
import 'dotenv/config';
import { mkdirSync, writeFileSync } from 'fs';
import path from 'path';
import { MongoClient } from 'mongodb';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'server', 'data');
const catDir = path.join(outDir, 'catalog');
mkdirSync(catDir, { recursive: true });

const uri = (process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017').trim();
const dbName = (process.env.MONGODB_DB || 'clothes').trim() || 'clothes';
const client = new MongoClient(uri);
await client.connect();
const col = client.db(dbName).collection('products');

const projection = {
  _id: 0,
  id: 1,
  sku: 1,
  name: 1,
  subtitle: 1,
  price: 1,
  listPrice: 1,
  originalPrice: 1,
  category: 1,
  categoryLabel: 1,
  breadcrumb: 1,
  images: 1,
  colors: 1,
  sizes: 1,
  isNew: 1,
  isSale: 1,
  stock: 1,
  active: 1,
  hasSizes: 1,
  hasColors: 1,
  discountEnabled: 1,
  discountType: 1,
  discountValue: 1,
  saleEnabled: 1,
  saleStart: 1,
  saleEnd: 1,
};

function toLite(doc) {
  return {
    id: doc.id,
    sku: doc.sku,
    name: doc.name,
    subtitle: doc.subtitle,
    price: doc.price,
    listPrice: doc.listPrice,
    originalPrice: doc.originalPrice,
    category: doc.category,
    categoryLabel: doc.categoryLabel,
    breadcrumb: doc.breadcrumb,
    images: Array.isArray(doc.images) ? doc.images.filter(Boolean).slice(0, 2) : [],
    colors: Array.isArray(doc.colors)
      ? doc.colors.slice(0, 8).map((c) => ({
          name: c?.name,
          value: c?.value,
          images: Array.isArray(c?.images) ? c.images.filter(Boolean).slice(0, 1) : [],
        }))
      : [],
    sizes: doc.sizes,
    isNew: doc.isNew,
    isSale: doc.isSale,
    stock: doc.stock,
    active: doc.active !== false,
    hasSizes: doc.hasSizes,
    hasColors: doc.hasColors,
    discountEnabled: doc.discountEnabled,
    discountType: doc.discountType,
    discountValue: doc.discountValue,
    saleEnabled: doc.saleEnabled,
    saleStart: doc.saleStart,
    saleEnd: doc.saleEnd,
  };
}

const docs = await col.find({ active: { $ne: false } }, { projection }).toArray();
const products = docs.filter((d) => typeof d.id === 'string' && d.id.trim()).map(toLite);

const byCategory = new Map();
for (const p of products) {
  const key = typeof p.category === 'string' && p.category.trim() ? p.category.trim() : 'uncategorized';
  if (!byCategory.has(key)) byCategory.set(key, []);
  byCategory.get(key).push(p);
}

const meta = {
  exportedAt: new Date().toISOString(),
  total: products.length,
  categories: Object.fromEntries([...byCategory.entries()].map(([k, v]) => [k, v.length])),
};

writeFileSync(path.join(outDir, 'catalog-meta.json'), JSON.stringify(meta));
writeFileSync(path.join(outDir, 'catalog-lite.json'), JSON.stringify({ total: products.length, products }));

for (const [category, rows] of byCategory) {
  const safe = category.replace(/[^a-zA-Z0-9._-]+/g, '_');
  writeFileSync(path.join(catDir, `${safe}.json`), JSON.stringify({ category, total: rows.length, products: rows }));
}

// Convenience aggregates used by storefront filters
const women = products.filter((p) => typeof p.category === 'string' && /^women($|-)/i.test(p.category));
const beauty = products.filter((p) => typeof p.category === 'string' && /^(health-beauty|beauty-)/i.test(p.category));
writeFileSync(path.join(catDir, '_women.json'), JSON.stringify({ category: 'women', total: women.length, products: women }));
writeFileSync(
  path.join(catDir, '_health-beauty.json'),
  JSON.stringify({ category: 'health-beauty', total: beauty.length, products: beauty }),
);

const bytes = Buffer.byteLength(JSON.stringify({ total: products.length, products }));
console.log(`Exported ${products.length} products (${(bytes / 1e6).toFixed(2)} MB)`);
console.log(`Categories: ${byCategory.size}`);
console.log(`Wrote ${path.join(outDir, 'catalog-lite.json')}`);

await client.close();
