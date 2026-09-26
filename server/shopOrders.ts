import { PRODUCTS } from '../src/data/products';
import { generateOrderId } from './orderId';
import { getDb } from './mongo';
import { findStoredOrder, type StoredOrder } from './orderStore';
import { withoutMongoId } from './mongoCollections';
import { verifyPaidIntent } from './stripeHandler';

export type CreateShopOrderInput = {
  userId?: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: {
    address: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
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
  paymentMethod?: string;
  paymentStatus?: string;
  stripePaymentIntentId?: string;
  deliveryLocation?: {
    latitude: number;
    longitude: number;
    address: string;
  };
};

export function normalizeDeliveryLocation(
  raw: unknown,
  fallbackAddress: string
): CreateShopOrderInput['deliveryLocation'] | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const row = raw as Record<string, unknown>;
  const latitude = Number(row.latitude);
  const longitude = Number(row.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return undefined;
  const address =
    (typeof row.address === 'string' && row.address.trim()) || fallbackAddress.trim();
  return { latitude, longitude, address };
}

function addressLine(address: CreateShopOrderInput['shippingAddress']) {
  return [address.address, address.city, address.state, address.postalCode, address.country]
    .filter(Boolean)
    .join(', ');
}

export async function seedProductsCollection() {
  const db = await getDb();
  if (!db) return;
  const collection = db.collection('products');
  if ((await collection.countDocuments()) > 0) return;
  const docs = PRODUCTS.map((product) => ({
    id: product.id,
    name: product.name,
    price: product.price,
    category: product.category,
    images: product.images,
    colors: product.colors,
    sizes: product.sizes,
    description: product.description,
    active: true,
  }));
  if (docs.length) await collection.insertMany(docs);
}

export async function createShopOrder(input: CreateShopOrderInput): Promise<StoredOrder> {
  const db = await getDb();
  if (!db) throw new Error('Database is unavailable.');
  if (!input.customerName.trim() || !input.customerEmail.trim() || !input.customerPhone.trim()) {
    throw new Error('Customer name, email, and phone are required.');
  }
  if (!input.shippingAddress.address.trim() || !input.shippingAddress.city.trim()) {
    throw new Error('Complete shipping address is required.');
  }
  if (!input.items.length) throw new Error('Order must include at least one product.');

  let stripePaymentIntentId = input.stripePaymentIntentId || '';
  let paymentMethod = input.paymentMethod || 'Cash on Delivery';
  let paymentStatus = input.paymentStatus || 'unpaid';
  if (paymentMethod === 'stripe' || stripePaymentIntentId) {
    if (!stripePaymentIntentId) throw new Error('Stripe payment is required.');
    await verifyPaidIntent(stripePaymentIntentId, input.total);
    const existingPaid = await db.collection<StoredOrder>('orders').findOne({ stripePaymentIntentId });
    if (existingPaid) throw new Error('This payment was already used.');
    paymentMethod = 'stripe';
    paymentStatus = 'paid';
  } else {
    paymentMethod = 'cod';
    paymentStatus = 'unpaid';
  }

  const collection = db.collection<StoredOrder>('orders');
  const createdAt = new Date().toISOString();
  let lastError: unknown;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const orderId = generateOrderId();
    const order: StoredOrder = {
      id: orderId,
      number: orderId,
      orderId,
      userId: input.userId || null,
      createdAt,
      customerName: input.customerName.trim(),
      customerPhone: input.customerPhone.trim(),
      customerPhoneE164: '',
      customerEmail: input.customerEmail.trim().toLowerCase(),
      deliveryAddress: addressLine(input.shippingAddress),
      shipping: input.shippingAddress,
      items: input.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
      products: input.items,
      subtotal: input.subtotal,
      total: input.total,
      deliveryCharge: input.deliveryCharge,
      handlingCharge: input.handlingCharge || 0,
      paymentMethod,
      paymentStatus,
      stripePaymentIntentId: stripePaymentIntentId || undefined,
      orderStatus: 'Order Confirmed',
      status: 'Order Confirmed',
      trackingId: '',
      deliveryPartner: '',
      expectedDeliveryDate: '',
      statusHistory: [{ status: 'Order Confirmed', timestamp: createdAt }],
      confirmationCallSent: false,
      confirmationCallStatus: 'pending',
      whatsappMessageSent: false,
      whatsappMessageStatus: 'pending',
      emailSent: false,
      emailStatus: 'pending',
      ...(input.deliveryLocation
        ? {
            deliveryLocation: {
              latitude: input.deliveryLocation.latitude,
              longitude: input.deliveryLocation.longitude,
              address: input.deliveryLocation.address || addressLine(input.shippingAddress),
            },
          }
        : {}),
    };

    try {
      await collection.insertOne({ ...order });
      return order;
    } catch (error) {
      lastError = error;
      const code = (error as { code?: number }).code;
      if (code === 11000) continue;
      throw error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Could not generate a unique order ID.');
}

export async function listOrdersForUser(userId: string): Promise<StoredOrder[]> {
  const db = await getDb();
  if (!db) return [];
  const docs = await db
    .collection<StoredOrder>('orders')
    .find({ userId })
    .sort({ createdAt: -1 })
    .toArray();
  return docs.map((doc) => withoutMongoId(doc as StoredOrder & Record<string, unknown>) as StoredOrder);
}

export async function getOrderByOrderId(orderId: string, userId?: string, email?: string) {
  const order = (await findStoredOrder(orderId)) || (await findStoredOrder(orderId.replace(/^ZAYRO-/, '')));
  if (!order) return null;
  if (order.userId) {
    if (!userId || order.userId !== userId) return null;
    return order;
  }
  if (email && order.customerEmail.toLowerCase() === email.toLowerCase()) return order;
  return null;
}

export { addressLine };
