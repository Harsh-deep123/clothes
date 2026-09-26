import type { LocalAccount, PlacedOrder, SavedAddress } from '../types';

const TOKEN_KEY = 'zayro_auth_token';

export type PublicUser = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  phoneVerified?: boolean;
  shippingAddress: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  createdAt: string;
};

export function getAuthToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || '';
  } catch {
    return '';
  }
}

export function setAuthToken(token: string | null) {
  try {
    if (!token) localStorage.removeItem(TOKEN_KEY);
    else localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* ignore */
  }
}

function authHeaders() {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export function toLocalAccount(user: PublicUser): LocalAccount {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    password: '',
  };
}

export async function apiSendOtp(account: LocalAccount) {
  const response = await fetch('/api/auth/send-otp', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      fullName: account.fullName,
      email: account.email,
      phone: account.phone,
      password: account.password,
    }),
  });
  const data = (await response.json()) as { maskedPhone?: string; error?: string };
  if (!response.ok || !data.maskedPhone) throw new Error(data.error || 'Could not send OTP.');
  return data.maskedPhone;
}

export async function apiVerifyOtp(account: Pick<LocalAccount, 'email' | 'phone'>, otp: string) {
  const response = await fetch('/api/auth/verify-otp', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      email: account.email,
      phone: account.phone,
      otp,
    }),
  });
  const data = (await response.json()) as { user?: PublicUser; token?: string; error?: string };
  if (!response.ok || !data.user || !data.token) throw new Error(data.error || 'Could not verify OTP.');
  setAuthToken(data.token);
  return data.user;
}

export async function apiMe() {
  const response = await fetch('/api/auth/me', { headers: authHeaders() });
  const data = (await response.json()) as { user?: PublicUser; error?: string };
  if (!response.ok || !data.user) throw new Error(data.error || 'Sign in required.');
  return data.user;
}

export async function apiLogin(email: string, password: string) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ email, password }),
  });
  const data = (await response.json()) as { user?: PublicUser; token?: string; error?: string };
  if (!response.ok || !data.user || !data.token) {
    throw new Error(data.error || 'Could not sign in.');
  }
  setAuthToken(data.token);
  return data.user;
}

export async function apiUpdateProfile(patch: {
  fullName?: string;
  phone?: string;
  shippingAddress?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}) {
  const response = await fetch('/api/auth/profile', {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(patch),
  });
  const data = (await response.json()) as { user?: PublicUser; error?: string };
  if (!response.ok || !data.user) throw new Error(data.error || 'Could not update profile.');
  return data.user;
}

export async function apiCreateOrder(payload: {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: SavedAddress | PlacedOrder['shippingAddress'];
  items: Array<{
    productId: string;
    name: string;
    image?: string;
    selectedSize?: string;
    selectedColor?: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  deliveryCharge: number;
  handlingCharge?: number;
  discount?: number;
  total: number;
  paymentMethod?: 'stripe' | 'cod';
  paymentStatus?: string;
  stripePaymentIntentId?: string;
  deliveryLocation?: {
    latitude: number;
    longitude: number;
    address: string;
  };
}) {
  const response = await fetch('/api/shop/orders', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = (await response.json()) as { order?: { id: string; number: string; orderId?: string; createdAt: string }; error?: string };
  if (!response.ok || !data.order) throw new Error(data.error || 'Could not save order.');
  return data.order;
}

export function fallbackOrderId() {
  const now = new Date();
  const ymd = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('');
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase().padEnd(4, 'X');
  return `ZAYRO-${ymd}-${rand}`;
}

export function mapStoredToPlaced(order: Record<string, unknown>): PlacedOrder {
  const orderId = String(order.orderId || order.number || order.id || '');
  const shipping = (order.shipping || {}) as PlacedOrder['shippingAddress'];
  const products = Array.isArray(order.products) ? order.products : [];
  const fallbackItems = Array.isArray(order.items) ? order.items : [];
  const source = products.length ? products : fallbackItems;
  const items = source.map((raw, index) => {
    const row = raw as Record<string, unknown>;
    const name = String(row.name || 'Item');
    const productId = String(row.productId || `item-${index}`);
    return {
      id: `${orderId}-${productId}-${index}`,
      productId,
      product: {
        id: productId,
        name,
        price: Number(row.price) || 0,
        category: '',
        categoryLabel: '',
        breadcrumb: '',
        images: [String(row.image || '')],
        colors: [],
        sizes: [],
        description: '',
        detailsAndCare: [],
        shippingAndReturns: '',
      },
      selectedColor: String(row.selectedColor || ''),
      selectedSize: String(row.selectedSize || ''),
      quantity: Number(row.quantity) || 1,
      price: Number(row.price) || 0,
    };
  });
  return {
    id: orderId,
    number: orderId,
    createdAt: String(order.createdAt || ''),
    items,
    subtotal: Number(order.subtotal) || 0,
    shippingLabel: '',
    discount: Number(order.discount) || 0,
    total: Number(order.total) || 0,
    customer: {
      fullName: String(order.customerName || ''),
      email: String(order.customerEmail || ''),
      phone: String(order.customerPhone || ''),
    },
    shippingAddress: {
      address: shipping.address || String(order.deliveryAddress || ''),
      city: shipping.city || '',
      state: shipping.state || '',
      postalCode: shipping.postalCode || '',
      country: shipping.country || '',
    },
    estimatedDelivery: String(order.expectedDeliveryDate || ''),
    deliveryCharge: Number(order.deliveryCharge) || 0,
    handlingCharge: Number(order.handlingCharge) || 0,
    status: String(order.status || order.orderStatus || ''),
    trackingId: String(order.trackingId || ''),
    deliveryPartner: String(order.deliveryPartner || ''),
    expectedDeliveryDate: String(order.expectedDeliveryDate || ''),
    statusHistory: Array.isArray(order.statusHistory)
      ? (order.statusHistory as Array<{ status: string; timestamp: string }>)
      : [],
    confirmationCallSent: Boolean(order.confirmationCallSent),
    confirmationCallStatus: (order.confirmationCallStatus as PlacedOrder['confirmationCallStatus']) || 'pending',
    whatsappMessageSent: Boolean(order.whatsappMessageSent),
    whatsappMessageStatus: (order.whatsappMessageStatus as PlacedOrder['whatsappMessageStatus']) || 'pending',
    emailSent: Boolean(order.emailSent),
    emailStatus: (order.emailStatus as PlacedOrder['emailStatus']) || 'pending',
  };
}

export async function apiMyOrders(): Promise<PlacedOrder[]> {
  const response = await fetch('/api/shop/orders', { headers: authHeaders() });
  const data = (await response.json()) as { orders?: Record<string, unknown>[]; error?: string };
  if (!response.ok) throw new Error(data.error || 'Could not load orders.');
  return (data.orders || []).map((order) => mapStoredToPlaced(order));
}

export async function apiGetOrderTracking(orderId: string) {
  const response = await fetch(`/api/shop/orders/${encodeURIComponent(orderId)}/tracking`, { headers: authHeaders() });
  const data = (await response.json()) as { order?: Record<string, unknown>; error?: string };
  if (!response.ok || !data.order) throw new Error(data.error || 'Order not found.');
  return mapStoredToPlaced(data.order);
}
