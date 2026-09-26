import { getCatalogProduct, toStorefrontProduct } from './catalog';
import { INITIAL_CART } from './data/products';
import { CartItem, LocalAccount, PlacedOrder, SavedAddress } from './types';

const KEYS = {
  wishlist: 'zayro_wishlist',
  cart: 'zayro_cart',
  account: 'zayro_account',
  session: 'zayro_session_email',
  orders: 'zayro_orders',
};

const SHARED_ADDRESS_KEYS = [
  'zayro_addresses',
  'shippingAddress',
  'checkoutAddress',
  'address',
];

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function addressesKey(email: string): string {
  return `zayro_addresses_${normalizeEmail(email)}`;
}

export function clearSharedAddressKeys() {
  SHARED_ADDRESS_KEYS.forEach((key) => localStorage.removeItem(key));
}

clearSharedAddressKeys();

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function loadWishlist(): string[] {
  const ids = readJson<string[]>(KEYS.wishlist, ['structural-oversized-tee']);
  return ids.filter((id) => Boolean(getCatalogProduct(id)));
}

export function saveWishlist(ids: string[]) {
  localStorage.setItem(KEYS.wishlist, JSON.stringify(ids));
}

export function loadCart(): CartItem[] {
  const items = readJson<CartItem[] | null>(KEYS.cart, null);
  if (!items) return INITIAL_CART;
  return items
    .map((item) => {
      const admin = getCatalogProduct(item.productId);
      if (!admin) return null;
      const product = toStorefrontProduct(admin);
      return { ...item, product, price: product.price };
    })
    .filter(Boolean) as CartItem[];
}

export function saveCart(items: CartItem[]) {
  const slim = items.map(({ product, ...rest }) => ({
    ...rest,
    productId: product.id,
  }));
  localStorage.setItem(KEYS.cart, JSON.stringify(slim));
}

export function loadAccount(): LocalAccount | null {
  return readJson<LocalAccount | null>(KEYS.account, null);
}

export function saveAccount(account: LocalAccount | null) {
  if (!account) {
    localStorage.removeItem(KEYS.account);
    return;
  }
  localStorage.setItem(KEYS.account, JSON.stringify(account));
}

export function loadSessionEmail(): string | null {
  return localStorage.getItem(KEYS.session);
}

export function saveSessionEmail(email: string | null) {
  if (!email) {
    localStorage.removeItem(KEYS.session);
    return;
  }
  localStorage.setItem(KEYS.session, email);
}

export function loadOrders(): PlacedOrder[] {
  const orders = readJson<PlacedOrder[]>(KEYS.orders, []);
  return orders.map((order) => ({
    ...order,
    items: order.items.map((item) => {
      const admin = getCatalogProduct(item.productId);
      const product = admin ? toStorefrontProduct(admin) : item.product;
      return { ...item, product };
    }),
  }));
}

export function saveOrders(orders: PlacedOrder[]) {
  localStorage.setItem(KEYS.orders, JSON.stringify(orders));
}

export function loadAddresses(userEmail?: string | null): SavedAddress[] {
  if (!userEmail) return [];
  const list = readJson<SavedAddress[]>(addressesKey(userEmail), []);
  const email = normalizeEmail(userEmail);
  return list.filter((addr) => !addr.userEmail || normalizeEmail(addr.userEmail) === email);
}

export function saveAddresses(userEmail: string | null | undefined, addresses: SavedAddress[]) {
  if (!userEmail) return;
  const email = normalizeEmail(userEmail);
  const owned = addresses.map((addr) => ({ ...addr, userEmail: email }));
  localStorage.setItem(addressesKey(userEmail), JSON.stringify(owned));
}
