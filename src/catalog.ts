import { CATEGORIES, PRODUCTS, isAddedStoreCategory } from './data/products';
import { CategoryInfo, Product, ReturnPolicy } from './types';

export const LOW_STOCK_THRESHOLD = 5;
export const CATALOG_KEY = 'zayro_admin_catalog_inr_v1';
export const CATEGORIES_KEY = 'zayro_admin_categories';

export type DiscountType = 'percent' | 'amount';

export interface AdminProduct extends Product {
  listPrice: number;
  stock: number;
  active: boolean;
  discountEnabled: boolean;
  discountType: DiscountType;
  discountValue: number;
  saleEnabled: boolean;
  saleStart: string;
  saleEnd: string;
}

type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((fn) => fn());
}

export function subscribeCatalog(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function seedAdminProduct(product: Product, index: number): AdminProduct {
  const stock = index === 4 ? 4 : 18;
  return {
    ...product,
    listPrice: product.originalPrice || product.price,
    stock,
    active: true,
    discountEnabled: Boolean(product.isSale),
    discountType: 'percent',
    discountValue: product.isSale ? 20 : 0,
    saleEnabled: Boolean(product.isSale),
    saleStart: '',
    saleEnd: '',
  };
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function loadRawCatalog(): AdminProduct[] {
  const stored = readJson<AdminProduct[] | null>(CATALOG_KEY, null);
  if (stored && stored.length) {
    return stored.map((p) => ({
      ...seedAdminProduct(p, 0),
      ...p,
      listPrice: p.listPrice || p.originalPrice || p.price,
      stock: typeof p.stock === 'number' ? p.stock : 12,
      active: p.active !== false,
      discountEnabled: Boolean(p.discountEnabled),
      discountType: p.discountType === 'amount' ? 'amount' : 'percent',
      discountValue: Number(p.discountValue) || 0,
      saleEnabled: Boolean(p.saleEnabled || p.isSale),
      saleStart: p.saleStart || '',
      saleEnd: p.saleEnd || '',
    }));
  }
  return PRODUCTS.map((p, i) => seedAdminProduct(p, i));
}

function imagesForStorage(images: string[], stripDataUrls: boolean) {
  return images.filter((url) => {
    if (!url) return false;
    if (stripDataUrls && url.startsWith('data:')) return false;
    return true;
  });
}

function catalogForStorage(items: AdminProduct[], stripDataUrls = false): AdminProduct[] {
  return items.map((item) => ({
    ...item,
    images: imagesForStorage(item.images, stripDataUrls),
  }));
}

function writeLocalStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    try {
      localStorage.removeItem(key);
      localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  }
}

function persist() {
  const categoriesJson = JSON.stringify(categoryList);
  writeLocalStorage(CATEGORIES_KEY, categoriesJson);

  const full = JSON.stringify(catalogForStorage(catalog, false));
  if (writeLocalStorage(CATALOG_KEY, full)) {
    notify();
    return;
  }

  const slim = JSON.stringify(catalogForStorage(catalog, true));
  if (!writeLocalStorage(CATALOG_KEY, slim)) {
    throw new Error('Browser storage is full. Remove unused uploaded images and try again.');
  }
  notify();
}

let catalog: AdminProduct[] = loadRawCatalog();
let categoryList: CategoryInfo[] = readJson<CategoryInfo[] | null>(CATEGORIES_KEY, null) || [...CATEGORIES];
const missingAddedCategories = CATEGORIES.filter(
  (c) => isAddedStoreCategory(c.slug) && !categoryList.some((existing) => existing.slug === c.slug),
);
if (missingAddedCategories.length) {
  categoryList = [...categoryList, ...missingAddedCategories];
}
categoryList = categoryList.map((c) => {
  const builtIn = isAddedStoreCategory(c.slug) ? CATEGORIES.find((d) => d.slug === c.slug) : undefined;
  return builtIn && builtIn.name !== c.name ? { ...c, name: builtIn.name } : c;
});

if (!localStorage.getItem(CATALOG_KEY)) {
  persist();
}

export function isSaleLive(product: AdminProduct, now = new Date()): boolean {
  if (!product.saleEnabled || !product.discountEnabled || !product.discountValue) return false;
  if (product.saleStart && now < new Date(product.saleStart)) return false;
  if (product.saleEnd && now > new Date(`${product.saleEnd}T23:59:59`)) return false;
  return true;
}

export function calculateSalePrice(product: AdminProduct): number {
  const base = product.listPrice || product.price;
  if (!isSaleLive(product)) return base;
  if (product.discountType === 'amount') {
    return Math.max(0, Number((base - product.discountValue).toFixed(2)));
  }
  return Math.max(0, Number((base * (1 - product.discountValue / 100)).toFixed(2)));
}

export function toStorefrontProduct(product: AdminProduct): Product {
  const live = isSaleLive(product);
  const listPrice = product.listPrice || product.price;
  const price = live ? calculateSalePrice(product) : listPrice;
  const outOfStock = product.stock <= 0;
  return {
    ...product,
    price,
    originalPrice: live ? listPrice : undefined,
    isSale: live,
    sizes: product.sizes.map((s) => ({ ...s, available: outOfStock ? false : s.available })),
  };
}

export function getCatalog(): AdminProduct[] {
  return catalog.map((p) => ({ ...p }));
}

export function getStorefrontProducts(): Product[] {
  return catalog.filter((p) => p.active !== false).map(toStorefrontProduct);
}

export function getCatalogProduct(id: string): AdminProduct | undefined {
  return catalog.find((p) => p.id === id);
}

export function priceForSize(product: Product, size?: string): { price: number; originalPrice?: number } {
  const sizeList = product.sizes.find((s) => s.size === size)?.price;
  if (!sizeList || !(sizeList > 0)) {
    return { price: product.price, originalPrice: product.originalPrice };
  }
  if (!product.isSale) return { price: sizeList };
  const discount = product.discountValue || 0;
  const sale =
    product.discountType === 'amount' ? sizeList - discount : sizeList * (1 - discount / 100);
  return { price: Math.max(0, Number(sale.toFixed(2))), originalPrice: sizeList };
}

export const RETURN_POLICY_OPTIONS: Array<{ value: ReturnPolicy; label: string }> = [
  { value: 'return_and_replace', label: 'Return & Replacement allowed' },
  { value: 'replace_only', label: 'Replacement only (no return)' },
  { value: 'return_only', label: 'Return only (no replacement)' },
  { value: 'none', label: 'No return / No replacement' },
];

export function productReturnPolicy(productId: string): ReturnPolicy {
  return getCatalogProduct(productId)?.returnPolicy || 'return_and_replace';
}

export function policyAllows(policy: ReturnPolicy, requestType: 'return' | 'replace'): boolean {
  if (policy === 'none') return false;
  if (policy === 'replace_only') return requestType === 'replace';
  if (policy === 'return_only') return requestType === 'return';
  return true;
}

export function returnPolicyNote(policy: ReturnPolicy | undefined): string | null {
  if (policy === 'none') return 'This item is not eligible for return or replacement.';
  if (policy === 'replace_only') return 'This item can be replaced, but not returned.';
  if (policy === 'return_only') return 'This item can be returned, but not replaced.';
  return null;
}

export function getStorefrontProduct(id: string): Product | undefined {
  const item = catalog.find((p) => p.id === id && p.active !== false);
  return item ? toStorefrontProduct(item) : undefined;
}

export function saveCatalog(next: AdminProduct[]) {
  catalog = next.map((p) => ({ ...p }));
  persist();
}

export function upsertProduct(product: AdminProduct) {
  const index = catalog.findIndex((p) => p.id === product.id);
  if (index >= 0) catalog[index] = { ...product };
  else catalog = [{ ...product }, ...catalog];
  persist();
}

export function deleteProduct(id: string) {
  catalog = catalog.filter((p) => p.id !== id);
  persist();
}

export function getAdminCategories(): CategoryInfo[] {
  return categoryList.map((c) => ({ ...c }));
}

export function saveAdminCategories(next: CategoryInfo[]) {
  categoryList = next.map((c) => ({ ...c }));
  persist();
}

export function catalogStats() {
  const items = getCatalog();
  return {
    total: items.length,
    active: items.filter((p) => p.active).length,
    onSale: items.filter((p) => isSaleLive(p)).length,
    outOfStock: items.filter((p) => p.stock <= 0).length,
    lowStock: items.filter((p) => p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD).length,
  };
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || `product-${Date.now()}`;
}
