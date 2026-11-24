import { existsSync, readFileSync } from 'fs';
import path from 'path';

type LiteCatalogFile = {
  total?: number;
  products?: Record<string, unknown>[];
  category?: string;
};

let cachedAll: Record<string, unknown>[] | null = null;
const cachedCategory = new Map<string, Record<string, unknown>[]>();

function dataDirs() {
  const cwd = process.cwd();
  const dirs = [
    path.join(cwd, 'api', 'data'),
    path.join(cwd, 'server', 'data'),
    path.join(cwd, 'data'),
  ];
  // __dirname is rewritten by the CJS Vercel bundle to the api/ folder.
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dirname = typeof __dirname !== 'undefined' ? __dirname : '';
    if (dirname) {
      dirs.unshift(path.join(dirname, 'data'));
      dirs.push(path.join(dirname, 'server', 'data'));
      dirs.push(path.join(dirname, '..', 'server', 'data'));
    }
  } catch {
    /* ignore */
  }
  return dirs;
}

function resolveDataFile(...parts: string[]) {
  for (const dir of dataDirs()) {
    const full = path.join(dir, ...parts);
    if (existsSync(full)) return full;
  }
  return null;
}

function readJsonFile<T>(filePath: string | null): T | null {
  if (!filePath) return null;
  try {
    return JSON.parse(readFileSync(filePath, 'utf8')) as T;
  } catch {
    return null;
  }
}

function loadAllProducts(): Record<string, unknown>[] {
  if (cachedAll) return cachedAll;
  const file = readJsonFile<LiteCatalogFile>(resolveDataFile('catalog-lite.json'));
  cachedAll = Array.isArray(file?.products) ? file!.products!.filter((p) => typeof p?.id === 'string') : [];
  return cachedAll;
}

function matchesCategory(product: Record<string, unknown>, category?: string) {
  const slug = (category || '').trim();
  if (!slug || slug === 'all') return true;
  const value = typeof product.category === 'string' ? product.category : '';
  if (slug === 'sale') {
    return Boolean(product.isSale) || Boolean(product.saleEnabled) || Number(product.price) <= 12499;
  }
  if (slug === 'women') return /^women($|-)/i.test(value);
  if (slug === 'health-beauty') return /^(health-beauty|beauty-)/i.test(value);
  return value === slug;
}

function loadCategoryProducts(category?: string): Record<string, unknown>[] {
  const slug = (category || '').trim();
  if (!slug || slug === 'all') return loadAllProducts();
  if (cachedCategory.has(slug)) return cachedCategory.get(slug)!;

  const fileName =
    slug === 'women'
      ? '_women.json'
      : slug === 'health-beauty'
        ? '_health-beauty.json'
        : `${slug.replace(/[^a-zA-Z0-9._-]+/g, '_')}.json`;

  const file = readJsonFile<LiteCatalogFile>(resolveDataFile('catalog', fileName));
  let rows = Array.isArray(file?.products) ? file!.products!.filter((p) => typeof p?.id === 'string') : null;
  if (!rows) {
    rows = loadAllProducts().filter((p) => matchesCategory(p, slug));
  }
  cachedCategory.set(slug, rows);
  return rows;
}

export function fallbackCatalogAvailable() {
  return Boolean(resolveDataFile('catalog-lite.json') || resolveDataFile('catalog', 'kitchen.json'));
}

export function listFallbackCatalogProducts(options?: {
  category?: string;
  page?: number;
  limit?: number;
  lite?: boolean;
}) {
  const page = Math.max(1, Number(options?.page) || 1);
  const rawLimit = Number(options?.limit);
  const unlimited = !Number.isFinite(rawLimit) || rawLimit <= 0;
  const limit = unlimited ? 0 : Math.min(200, Math.max(1, Math.floor(rawLimit)));
  const all = loadCategoryProducts(options?.category);
  const total = all.length;
  const slice = unlimited ? all : all.slice((page - 1) * limit, page * limit);
  return {
    products: slice,
    total,
    page,
    limit: unlimited ? total : limit,
    source: 'fallback' as const,
  };
}

export function getFallbackCatalogProductById(id: string) {
  const productId = id.trim();
  if (!productId) return null;
  return loadAllProducts().find((p) => p.id === productId) || null;
}
