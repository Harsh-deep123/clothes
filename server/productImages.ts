import { randomUUID } from 'crypto';
import { Binary } from 'mongodb';
import { getDb } from './mongo';

const MAX_BYTES = 4 * 1024 * 1024;

export function storedProductImageUrl(id: string) {
  return `/api/admin/media/${id}`;
}

export function isStoredProductImageUrl(value: string) {
  return /^\/api\/admin\/media\/[0-9a-f-]{36}$/i.test(value.trim());
}

function sniffMime(buffer: Buffer): string | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  if (buffer.length >= 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return 'image/png';
  }
  if (buffer.length >= 12 && buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WEBP') {
    return 'image/webp';
  }
  if (buffer.subarray(0, 6).toString() === 'GIF87a' || buffer.subarray(0, 6).toString() === 'GIF89a') return 'image/gif';
  if (buffer.length >= 12 && buffer.subarray(4, 8).toString() === 'ftyp') {
    const brand = buffer.subarray(8, 12).toString();
    if (brand.startsWith('avif') || brand === 'avis') return 'image/avif';
  }
  return null;
}

function isPublicHttpUrl(raw: string) {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
  const host = url.hostname.toLowerCase();
  if (host === 'localhost' || host.endsWith('.local') || host === '0.0.0.0' || host === '::1') return false;
  if (/^(127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(host)) return false;
  return true;
}

async function readLimited(response: Response) {
  const declared = Number(response.headers.get('content-length') || 0);
  if (declared > MAX_BYTES) return null;
  const reader = response.body?.getReader();
  if (!reader) return Buffer.from(await response.arrayBuffer());
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_BYTES) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)));
}

export async function saveProductImageBuffer(buffer: Buffer, mime: string) {
  const db = await getDb();
  if (!db) return { error: 'Database is unavailable.', status: 503 as const };
  if (!buffer.length) return { error: 'Image file is empty.', status: 400 as const };
  if (buffer.length > MAX_BYTES) return { error: 'Each photo must be under 4MB.', status: 400 as const };
  const id = randomUUID();
  await db.collection('product_images').insertOne({
    id,
    mime,
    bytes: buffer.length,
    data: new Binary(buffer),
    createdAt: new Date().toISOString(),
  });
  return { url: storedProductImageUrl(id) };
}

export async function saveProductImageSource(source: string) {
  const value = source.trim();
  if (!value) return { error: 'Image is required.', status: 400 as const };
  if (isStoredProductImageUrl(value)) return { url: value };

  const dataUrl = value.match(/^data:(image\/(?:jpeg|jpg|png|webp|gif|avif));base64,([A-Za-z0-9+/=\s]+)$/i);
  if (dataUrl) {
    const buffer = Buffer.from(dataUrl[2].replace(/\s/g, ''), 'base64');
    const sniffed = sniffMime(buffer);
    const mime = sniffed || dataUrl[1].toLowerCase().replace('image/jpg', 'image/jpeg');
    if (!sniffed && !mime.startsWith('image/')) return { error: 'Upload a JPEG, PNG, WebP, GIF, or AVIF photo.', status: 400 as const };
    return saveProductImageBuffer(buffer, sniffed || mime);
  }

  if (!isPublicHttpUrl(value)) return { error: 'Paste a public image URL or upload a photo.', status: 400 as const };
  let response: Response;
  try {
    response = await fetch(value, {
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
      headers: {
        Accept: 'image/avif,image/webp,image/png,image/jpeg,image/*,*/*',
        'User-Agent': 'ZayroCollection/1.0',
      },
    });
  } catch {
    return { error: 'Could not download that image.', status: 400 as const };
  }
  if (!response.ok) return { error: 'Could not download that image.', status: 400 as const };
  const buffer = await readLimited(response);
  if (!buffer) return { error: 'Each photo must be under 4MB.', status: 400 as const };
  const sniffed = sniffMime(buffer);
  const headerMime = (response.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  const mime = sniffed || (headerMime.startsWith('image/') ? headerMime : '');
  if (!mime) return { error: 'That link is not an image file.', status: 400 as const };
  return saveProductImageBuffer(buffer, mime);
}

function bytesFromStored(data: unknown): Buffer | null {
  if (!data) return null;
  if (Buffer.isBuffer(data)) return data;
  if (data instanceof Binary) return Buffer.from(data.value());
  if (data instanceof Uint8Array) return Buffer.from(data);
  return null;
}

export async function readProductImage(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const db = await getDb();
  if (!db) return null;
  const doc = await db.collection('product_images').findOne({ id });
  if (!doc) return null;
  const data = bytesFromStored(doc.data);
  if (!data) return null;
  const mime = typeof doc.mime === 'string' && doc.mime.startsWith('image/') ? doc.mime : 'image/jpeg';
  return { data, mime };
}

async function keepImage(value: unknown) {
  const source = typeof value === 'string' ? value.trim() : '';
  if (!source) return '';
  if (isStoredProductImageUrl(source)) return source;
  if (source.startsWith('data:') || /^https?:\/\//i.test(source)) {
    const saved = await saveProductImageSource(source);
    if ('error' in saved) throw new Error(saved.error);
    return saved.url;
  }
  return source;
}

export type ListCatalogOptions = {
  activeOnly?: boolean;
  category?: string;
  page?: number;
  limit?: number;
  lite?: boolean;
};

function buildCategoryFilter(category?: string): Record<string, unknown> {
  const slug = (category || '').trim();
  if (!slug || slug === 'all') return {};
  if (slug === 'sale') {
    return {
      $or: [{ isSale: true }, { saleEnabled: true }, { price: { $lte: 12499 } }],
    };
  }
  if (slug === 'women') {
    return { category: { $regex: /^women($|-)/i } };
  }
  if (slug === 'health-beauty') {
    return { category: { $regex: /^(health-beauty|beauty-)/i } };
  }
  return { category: slug };
}

function toLiteProduct(row: Record<string, unknown>) {
  const images = Array.isArray(row.images)
    ? row.images.filter((url): url is string => typeof url === 'string' && Boolean(url)).slice(0, 2)
    : [];
  const colors = Array.isArray(row.colors)
    ? row.colors.slice(0, 8).map((color) => {
        if (!color || typeof color !== 'object') return color;
        const entry = color as Record<string, unknown>;
        const colorImages = Array.isArray(entry.images)
          ? entry.images.filter((url): url is string => typeof url === 'string' && Boolean(url)).slice(0, 1)
          : [];
        return {
          name: entry.name,
          value: entry.value,
          images: colorImages,
        };
      })
    : row.colors;
  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    subtitle: row.subtitle,
    price: row.price,
    listPrice: row.listPrice,
    originalPrice: row.originalPrice,
    category: row.category,
    categoryLabel: row.categoryLabel,
    breadcrumb: row.breadcrumb,
    images,
    colors,
    sizes: row.sizes,
    designs: Array.isArray(row.designs) ? row.designs.slice(0, 4) : row.designs,
    description: typeof row.description === 'string' ? row.description.slice(0, 280) : row.description,
    detailsAndCare: Array.isArray(row.detailsAndCare) ? row.detailsAndCare.slice(0, 4) : [],
    shippingAndReturns: typeof row.shippingAndReturns === 'string' ? row.shippingAndReturns.slice(0, 160) : '',
    isNew: row.isNew,
    isSale: row.isSale,
    stock: row.stock,
    active: row.active,
    hasSizes: row.hasSizes,
    hasColors: row.hasColors,
    discountEnabled: row.discountEnabled,
    discountType: row.discountType,
    discountValue: row.discountValue,
    saleEnabled: row.saleEnabled,
    saleStart: row.saleStart,
    saleEnd: row.saleEnd,
  };
}

export async function listCatalogProducts(options?: ListCatalogOptions) {
  const db = await getDb();
  if (!db) {
    const err = new Error('Database is unavailable.');
    (err as Error & { status?: number }).status = 503;
    throw err;
  }
  const filter: Record<string, unknown> = {
    ...(options?.activeOnly ? { active: { $ne: false } } : {}),
    ...buildCategoryFilter(options?.category),
  };
  const page = Math.max(1, Number(options?.page) || 1);
  const rawLimit = Number(options?.limit);
  const unlimited = !Number.isFinite(rawLimit) || rawLimit <= 0;
  const limit = unlimited ? 0 : Math.min(200, Math.max(1, Math.floor(rawLimit)));
  const collection = db.collection('products');
  const total = await collection.countDocuments(filter);
  let cursor = collection.find(filter).project({
    _id: 0,
    averageRating: 0,
    totalReviews: 0,
    purchasedFrom: 0,
  });
  if (!unlimited) {
    cursor = cursor.skip((page - 1) * limit).limit(limit);
  }
  const docs = await cursor.toArray();
  const products = docs
    .filter((row) => typeof row.id === 'string' && Boolean(row.id.trim()))
    .map((row) => (options?.lite ? toLiteProduct(row as Record<string, unknown>) : row));
  return { products, total, page, limit: unlimited ? total : limit };
}

export async function getCatalogProductById(id: string) {
  const db = await getDb();
  if (!db) return null;
  const productId = id.trim();
  if (!productId) return null;
  const doc = await db.collection('products').findOne(
    { id: productId },
    { projection: { _id: 0, averageRating: 0, totalReviews: 0, purchasedFrom: 0 } },
  );
  if (!doc || typeof doc.id !== 'string') return null;
  return doc;
}

export async function deleteCatalogProduct(id: string) {
  const db = await getDb();
  if (!db) return { error: 'Database is unavailable.', status: 503 as const };
  const productId = id.trim();
  if (!productId) return { error: 'Product id is required.', status: 400 as const };
  await db.collection('products').deleteOne({ id: productId });
  return { ok: true as const };
}

export async function saveCatalogProduct(raw: Record<string, unknown>) {
  const db = await getDb();
  if (!db) return { error: 'Database is unavailable.', status: 503 as const };
  const id = typeof raw.id === 'string' ? raw.id.trim() : '';
  if (!id) return { error: 'Product id is required.', status: 400 as const };

  const images = Array.isArray(raw.images) ? await Promise.all(raw.images.map((item) => keepImage(item))) : [];
  const colors = Array.isArray(raw.colors)
    ? await Promise.all(
        raw.colors.map(async (color) => {
          if (!color || typeof color !== 'object') return color;
          const row = color as Record<string, unknown>;
          if (!Array.isArray(row.images)) return row;
          return { ...row, images: (await Promise.all(row.images.map((item) => keepImage(item)))).filter(Boolean) };
        })
      )
    : raw.colors;
  const designs = Array.isArray(raw.designs)
    ? await Promise.all(
        raw.designs.map(async (design) => {
          if (!design || typeof design !== 'object') return design;
          const row = design as Record<string, unknown>;
          return { ...row, image: await keepImage(row.image) };
        })
      )
    : raw.designs;

  const existing = await db.collection('products').findOne({ id }, { projection: { sku: 1 } });
  const { ensureProductSku } = await import('./productSku');
  const sku = await ensureProductSku(db, {
    sku: typeof raw.sku === 'string' && raw.sku.trim() ? raw.sku : existing?.sku,
  });

  const product = {
    ...raw,
    id,
    sku,
    images: images.filter(Boolean),
    colors,
    designs,
    updatedAt: new Date().toISOString(),
  };
  await db.collection('products').updateOne({ id }, { $set: product }, { upsert: true });
  return { product };
}
