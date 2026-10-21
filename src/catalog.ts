import { CATEGORIES, PRODUCTS, isAddedStoreCategory } from './data/products';
import { CategoryInfo, Product, ProductDesign, ReturnPolicy } from './types';

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
  /** Admin-only note: website where this product was purchased. Never shown on storefront. */
  purchasedFrom?: string;
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

function normalizeAdminProduct(p: Partial<AdminProduct>, index = 0): AdminProduct {
  const asProduct = {
    id: typeof p.id === 'string' && p.id.trim() ? p.id.trim() : `product-${index}`,
    name: typeof p.name === 'string' && p.name.trim() ? p.name : 'Product',
    subtitle: p.subtitle,
    price: Number(p.price) || 0,
    originalPrice: p.originalPrice,
    category: typeof p.category === 'string' ? p.category : 'new-arrivals',
    categoryLabel: typeof p.categoryLabel === 'string' && p.categoryLabel ? p.categoryLabel : String(p.category || 'Store'),
    breadcrumb: typeof p.breadcrumb === 'string' ? p.breadcrumb : '',
    images: Array.isArray(p.images) ? p.images.filter((url): url is string => typeof url === 'string' && Boolean(url)) : [],
    colors: Array.isArray(p.colors) ? (p.colors as Product['colors']) : [],
    sizes: Array.isArray(p.sizes) && p.sizes.length ? (p.sizes as Product['sizes']) : [{ size: 'One Size', available: true }],
    description: typeof p.description === 'string' ? p.description : '',
    detailsAndCare: Array.isArray(p.detailsAndCare) ? p.detailsAndCare.filter((item): item is string => typeof item === 'string') : [],
    shippingAndReturns: typeof p.shippingAndReturns === 'string' ? p.shippingAndReturns : '',
    isNew: Boolean(p.isNew),
    isSale: Boolean(p.isSale),
    material: p.material,
    hasSizes: p.hasSizes,
    hasColors: p.hasColors,
    designs: p.designs,
    returnPolicy: p.returnPolicy,
  } as Product;
  return {
    ...seedAdminProduct(asProduct, index),
    ...p,
    ...asProduct,
    listPrice: Number(p.listPrice) || Number(p.originalPrice) || Number(p.price) || asProduct.price,
    stock: typeof p.stock === 'number' ? p.stock : 12,
    active: p.active !== false,
    discountEnabled: Boolean(p.discountEnabled),
    discountType: p.discountType === 'amount' ? 'amount' : 'percent',
    discountValue: Number(p.discountValue) || 0,
    saleEnabled: Boolean(p.saleEnabled || p.isSale),
    saleStart: typeof p.saleStart === 'string' ? p.saleStart : '',
    saleEnd: typeof p.saleEnd === 'string' ? p.saleEnd : '',
    purchasedFrom: typeof p.purchasedFrom === 'string' ? p.purchasedFrom : '',
  };
}

function loadRawCatalog(): AdminProduct[] {
  const stored = readJson<AdminProduct[] | null>(CATALOG_KEY, null);
  if (stored && stored.length) {
    return stored.map((p, i) => normalizeAdminProduct(p, i));
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
    colors: item.colors.map((color) =>
      color.images?.length ? { ...color, images: imagesForStorage(color.images, stripDataUrls) } : color,
    ),
    designs: (item.designs || [])
      .map((design) => ({
        ...design,
        image: imagesForStorage([design.image], stripDataUrls)[0] || '',
      }))
      .filter((design) => design.id && design.name && design.image),
  }));
}

export function newDesignId(existing: string[] = []) {
  const taken = new Set(existing);
  let id = '';
  do {
    id = `DSN-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  } while (taken.has(id));
  return id;
}

export function productDesigns(product: Pick<Product, 'designs'>): ProductDesign[] {
  return (product.designs || []).filter((design) => design.id && design.name.trim() && design.image);
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

export function applyDiscount(
  base: number,
  discountType: DiscountType,
  discountValue: number,
): number {
  const list = Number(base) || 0;
  const value = Number(discountValue) || 0;
  if (!(list > 0) || !(value > 0)) return list;
  if (discountType === 'amount') {
    return Math.max(0, Number((list - value).toFixed(2)));
  }
  return Math.max(0, Number((list * (1 - Math.min(value, 100) / 100)).toFixed(2)));
}

/** Sale price from list + discount fields (ignores Sale ON / dates — for admin preview). */
export function calculateSalePrice(product: AdminProduct): number {
  const base = product.listPrice || product.price;
  return applyDiscount(base, product.discountType, product.discountValue);
}

export function discountPercentOff(listPrice: number, salePrice: number): number {
  if (!(listPrice > 0) || salePrice >= listPrice) return 0;
  return Math.max(1, Math.round(((listPrice - salePrice) / listPrice) * 100));
}

export const ONE_SIZE = 'One Size';

export function imagesForColor(product: Pick<Product, 'images' | 'colors'>, colorName?: string): string[] {
  const colorImages = product.colors.find((c) => c.name === colorName)?.images?.filter(Boolean);
  return colorImages?.length ? colorImages : product.images;
}

export function itemPreviewImage(item: {
  product: Pick<Product, 'images' | 'colors' | 'designs'>;
  selectedColor?: string;
  selectedDesignId?: string;
}): string {
  const design = productDesigns(item.product).find((entry) => entry.id === item.selectedDesignId);
  if (design?.image) return design.image;
  return imagesForColor(item.product, item.selectedColor)[0] || '';
}

export function productHasSizes(product: Pick<Product, 'hasSizes'>): boolean {
  return product.hasSizes !== false;
}

export function productHasColors(product: Pick<Product, 'hasColors'>): boolean {
  return product.hasColors !== false;
}

export function toStorefrontProduct(product: AdminProduct): Product {
  const live = isSaleLive(product);
  const listPrice = product.listPrice || product.price;
  const price = live ? calculateSalePrice(product) : listPrice;
  const outOfStock = product.stock <= 0;
  const { purchasedFrom: _adminOnly, ...storefront } = product;
  return {
    ...storefront,
    price,
    originalPrice: live ? listPrice : undefined,
    isSale: live,
    sizes: productHasSizes(product)
      ? product.sizes.map((s) => ({ ...s, available: outOfStock ? false : s.available }))
      : [{ size: ONE_SIZE, available: !outOfStock }],
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

let hydrateInFlight: Promise<AdminProduct[]> | null = null;

export async function hydrateCatalogFromServer(): Promise<AdminProduct[]> {
  if (hydrateInFlight) return hydrateInFlight;
  hydrateInFlight = (async () => {
    const response = await fetch('/api/shop/products', { headers: { Accept: 'application/json' } });
    const data = (await response.json().catch(() => ({}))) as { products?: unknown; error?: string };
    if (!response.ok) throw new Error(data.error || 'Could not load products.');
    const remote = Array.isArray(data.products)
      ? data.products
          .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
          .map((item, index) => normalizeAdminProduct(item as Partial<AdminProduct>, index))
          .filter((item) => item.id)
      : [];
    if (!remote.length) return [];
    const remoteIds = new Set(remote.map((item) => item.id));
    const seedIds = new Set(PRODUCTS.map((item) => item.id));
    const extras = catalog.filter((item) => item.id && !remoteIds.has(item.id) && !seedIds.has(item.id));
    catalog = [...extras, ...remote];
    persist();
    return extras;
  })().finally(() => {
    hydrateInFlight = null;
  });
  return hydrateInFlight;
}

if (typeof window !== 'undefined') {
  void hydrateCatalogFromServer().then((extras) => {
    if (!extras.length) return;
    void import('./lib/productMedia').then(({ saveProductRecord }) => {
      extras.forEach((product) => {
        void saveProductRecord(product).catch(() => undefined);
      });
    });
  }).catch(() => undefined);
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
