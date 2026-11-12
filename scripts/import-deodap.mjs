/**
 * Import all DeoDap Shopify products into MongoDB `products`.
 * Resumable: caches pages under tmp/deodap-pages/ and upserts after each page.
 *
 * Usage: node scripts/import-deodap.mjs
 */
import { MongoClient } from 'mongodb';
import { config } from 'dotenv';
import fs from 'fs/promises';
import path from 'path';

config();

const BASE = 'https://deodap.in';
const uri = (process.env.MONGODB_URI || 'mongodb://localhost:27017').trim();
const dbName = (process.env.MONGODB_DB || 'clothes').trim() || 'clothes';
const PAGE_SIZE = 250;
const PAGE_DELAY_MS = 60000;
const CACHE_DIR = path.resolve('tmp/deodap-pages');
const MAX_RETRIES = 30;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function stripHtml(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function slugify(value) {
  return (
    String(value || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || `product-${Date.now()}`
  );
}

function mapCategory(product) {
  const blob = `${product.product_type || ''} ${(product.tags || []).join(' ')} ${product.title || ''}`.toLowerCase();
  if (/kitchen|cookware|casserole|tiffin|lunch|bottle|tumbler|flask|sipper|utensil|peeler|peeling|orange|cutlery|spoon|fork|knife|hotpot/.test(blob)) {
    return { slug: 'kitchen', label: 'Kitchen', breadcrumb: 'Kitchen' };
  }
  if (/stationer|pencil|pen\b|notebook|office|eraser|marker|stapler|lead|craft kit|stamper/.test(blob)) {
    return { slug: 'stationery-office', label: 'Stationery & Office', breadcrumb: 'Stationery & Office' };
  }
  if (/jewell?ery|earring|necklace|bracelet|pendant|anklet|jhumka|gold plated|silver plated|temple jewellery/.test(blob)) {
    return { slug: 'jewellery', label: 'Jewellery & Accessories', breadcrumb: 'Jewellery & Accessories' };
  }
  if (/beauty|groom|skincare|hair|shave|trimmer|massag|perfume|wellness|health|nail|makeup|ice roller|face ice/.test(blob)) {
    return { slug: 'health-beauty', label: 'Health & Beauty', breadcrumb: 'Health & Beauty' };
  }
  if (/auto|car\b|bike|vehicle|automotive/.test(blob)) {
    return { slug: 'auto-electrical', label: 'Auto & Electrical Parts', breadcrumb: 'Auto & Electrical Parts' };
  }
  if (/decor|home|plant|hook|organiser|organizer|candle|lamp/.test(blob)) {
    return { slug: 'home-decor', label: 'Home & Decor', breadcrumb: 'Home & Decor' };
  }
  return { slug: 'accessories', label: 'Accessories', breadcrumb: 'Accessories' };
}

function toAdminProduct(raw) {
  const handle = String(raw.handle || '').trim() || slugify(raw.title);
  const variants = Array.isArray(raw.variants) ? raw.variants : [];
  const available = variants.some((v) => v.available);
  const prices = variants.map((v) => Number(v.price) || 0).filter((n) => n > 0);
  const compares = variants.map((v) => Number(v.compare_at_price) || 0).filter((n) => n > 0);
  const MARKUP = 1.2; // DeoDap wholesale + 20%
  const rawPrice = prices.length ? Math.min(...prices) : 0;
  const rawCompare = compares.length ? Math.max(...compares) : 0;
  const price = rawPrice > 0 ? Math.max(1, Math.round(rawPrice * MARKUP)) : 0;
  const compare = rawCompare > 0 ? Math.max(1, Math.round(rawCompare * MARKUP)) : 0;
  const listPrice = compare > price ? compare : price;
  const discountValue =
    listPrice > 0 && price > 0 && listPrice > price
      ? Math.max(1, Math.round(((listPrice - price) / listPrice) * 100))
      : 0;
  const saleEnabled = discountValue > 0;
  const images = (raw.images || [])
    .map((img) => (typeof img === 'string' ? img : img?.src || ''))
    .filter(Boolean)
    .slice(0, 6);
  const cat = mapCategory(raw);
  const tags = Array.isArray(raw.tags) ? raw.tags.map((t) => String(t).toLowerCase()) : [];
  const namingEnabled =
    tags.some((t) => t.includes('personal')) || /personaliz|custom name|name print/i.test(raw.title || '');
  const description =
    stripHtml(raw.body_html) || `${raw.title}. Wholesale product sourced from DeoDap.`;
  const colorOption = (raw.options || []).find((o) => /color|colour/i.test(o?.name || ''));
  const colors =
    colorOption && Array.isArray(colorOption.values) && colorOption.values.length > 1
      ? colorOption.values.slice(0, 12).map((name) => ({ name: String(name), hex: '#000000' }))
      : [{ name: 'Standard', hex: '#000000' }];
  const sizeOption = (raw.options || []).find((o) => /size/i.test(o?.name || ''));
  const hasSizes = Boolean(sizeOption && (sizeOption.values || []).length > 1);
  const sizes = hasSizes
    ? (sizeOption.values || []).slice(0, 20).map((size) => ({
        size: String(size),
        available,
        price: listPrice || undefined,
      }))
    : [{ size: 'One Size', available }];

  return {
    id: handle,
    name: String(raw.title || handle).trim(),
    subtitle: String(raw.product_type || raw.vendor || '').trim(),
    price: saleEnabled ? price : listPrice,
    listPrice,
    category: cat.slug,
    categoryLabel: cat.label,
    breadcrumb: cat.breadcrumb,
    images,
    colors,
    sizes,
    description,
    detailsAndCare: [],
    shippingAndReturns:
      'Complimentary express shipping on all orders. Returns accepted within 14 days of delivery in original condition.',
    isNew: true,
    isSale: saleEnabled,
    material: '',
    stock: available ? 10 : 5,
    active: images.length > 0 && listPrice > 0,
    discountEnabled: saleEnabled,
    discountType: 'percent',
    discountValue,
    saleEnabled,
    saleStart: '',
    saleEnd: '',
    returnPolicy: 'return_and_replace',
    hasSizes,
    hasColors: Boolean(colorOption && (colorOption.values || []).length > 1),
    namingEnabled,
    purchasedFrom: 'DeoDap',
    designs: [],
    deodapId: raw.id,
    deodapHandle: handle,
    deodapVendor: raw.vendor || '',
    deodapProductType: raw.product_type || '',
    priceMarkupPercent: 20,
    priceCutMark: 'current-plus-20',
    deodapRawPrice: rawPrice,
    deodapRawListPrice: rawCompare > rawPrice ? rawCompare : rawPrice,
    updatedAt: new Date().toISOString(),
    importedFrom: 'deodap',
    importedAt: new Date().toISOString(),
  };
}

async function loadCachedPage(page) {
  try {
    const file = path.join(CACHE_DIR, `page-${page}.json`);
    const raw = await fs.readFile(file, 'utf8');
    const data = JSON.parse(raw);
    if (Array.isArray(data.products) && data.products.length) return data;
  } catch {
    /* miss */
  }
  return null;
}

async function saveCachedPage(page, data) {
  await fs.mkdir(CACHE_DIR, { recursive: true });
  await fs.writeFile(path.join(CACHE_DIR, `page-${page}.json`), JSON.stringify(data));
}

async function fetchPage(page) {
  const cached = await loadCachedPage(page);
  if (cached) {
    console.log(`[deodap] page ${page}: cache hit (${cached.products.length})`);
    return cached;
  }

  const url = `${BASE}/collections/all/products.json?limit=${PAGE_SIZE}&page=${page}`;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const res = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-IN,en;q=0.9',
        },
      });
      if (res.ok) {
        const data = await res.json();
        await saveCachedPage(page, data);
        return data;
      }
      const text = await res.text().catch(() => '');
      const wait = res.status === 429 ? Math.min(300000, 30000 * attempt) : 5000 * attempt;
      console.log(
        `[deodap] page ${page} status ${res.status} ${text.slice(0, 24).replace(/\s+/g, ' ')}; retry ${attempt}/${MAX_RETRIES} in ${Math.round(wait / 1000)}s`,
      );
      await sleep(wait);
    } catch (err) {
      const wait = Math.min(300000, 20000 * attempt);
      console.log(
        `[deodap] page ${page} network error: ${err?.cause?.code || err?.message || err}; retry ${attempt}/${MAX_RETRIES} in ${Math.round(wait / 1000)}s`,
      );
      await sleep(wait);
    }
  }
  throw new Error(`DeoDap fetch failed page ${page} after retries`);
}

function formatSku(seq) {
  return `ZY-${String(seq).padStart(6, '0')}`;
}

async function nextSkuSeq(db) {
  const result = await db.collection('counters').findOneAndUpdate(
    { _id: 'productSku' },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: 'after' },
  );
  return Number(result?.seq) || 1;
}

async function upsertDocs(db, collection, docs) {
  if (!docs.length) return;
  const ids = docs.map((p) => p.id);
  const existing = await collection
    .find({ id: { $in: ids } })
    .project({ id: 1, sku: 1 })
    .toArray();
  const skuById = new Map(existing.map((row) => [row.id, row.sku]));
  for (const product of docs) {
    const current = skuById.get(product.id);
    if (current) product.sku = current;
    else product.sku = formatSku(await nextSkuSeq(db));
  }
  const ops = docs.map((product) => ({
    updateOne: {
      filter: { id: product.id },
      update: { $set: product },
      upsert: true,
    },
  }));
  await collection.bulkWrite(ops, { ordered: false });
}

async function main() {
  console.log(`[deodap] connecting ${uri} / ${dbName}`);
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 });
  await client.connect();
  const db = client.db(dbName);
  const collection = db.collection('products');
  await collection.createIndex({ id: 1 }, { unique: true });
  await collection.createIndex({ purchasedFrom: 1 });
  await collection.createIndex({ importedFrom: 1 });

  let page = 1;
  let totalUnique = 0;
  const seen = new Set();

  for (;;) {
    const data = await fetchPage(page);
    const batch = Array.isArray(data.products) ? data.products : [];
    const fresh = [];
    for (const item of batch) {
      const key = String(item.id || item.handle || '');
      if (!key || seen.has(key)) continue;
      seen.add(key);
      fresh.push(item);
    }
    const docs = fresh.map(toAdminProduct).filter((p) => p.id && p.name && p.images.length);
    await upsertDocs(db, collection, docs);
    totalUnique += docs.length;
    console.log(`[deodap] page ${page}: upserted ${docs.length} (running ${totalUnique})`);

    if (batch.length < PAGE_SIZE) break;
    page += 1;
    if (page > 200) break;
    const nextCached = await loadCachedPage(page);
    if (!nextCached) await sleep(PAGE_DELAY_MS);
  }

  const total = await collection.countDocuments({});
  const deodap = await collection.countDocuments({ importedFrom: 'deodap' });
  const active = await collection.countDocuments({ active: true, importedFrom: 'deodap' });
  console.log(`[deodap] done. catalog=${total} deodap=${deodap} activeDeodap=${active}`);
  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
