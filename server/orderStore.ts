import fs from 'fs/promises';
import path from 'path';
import { migrateJsonIntoMongo, ordersCollection, withoutMongoId } from './mongoCollections';

export type ConfirmationCallStatus = 'pending' | 'initiated' | 'completed' | 'failed';
export type WhatsAppMessageStatus = 'pending' | 'sent' | 'delivered' | 'failed';
export type EmailMessageStatus = 'pending' | 'sent' | 'failed';

export type StoredOrderItem = {
  name: string;
  quantity: number;
  price: number;
};

export type StoredOrder = {
  id: string;
  number: string;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  customerPhoneE164: string;
  customerEmail: string;
  deliveryAddress: string;
  items: StoredOrderItem[];
  total: number;
  subtotal?: number;
  deliveryCharge?: number;
  handlingCharge?: number;
  confirmationCallSent: boolean;
  confirmationCallStatus: ConfirmationCallStatus;
  confirmationCallSid?: string;
  confirmationCallError?: string;
  confirmationCallAt?: string;
  whatsappMessageSent: boolean;
  whatsappMessageStatus: WhatsAppMessageStatus;
  whatsappMessageSentAt?: string;
  whatsappMessageId?: string;
  whatsappError?: string;
  emailSent: boolean;
  emailStatus: EmailMessageStatus;
  emailSentAt?: string;
  emailError?: string;
  orderId?: string;
  userId?: string | null;
  paymentMethod?: string;
  paymentStatus?: string;
  stripePaymentIntentId?: string;
  orderStatus?: string;
  status?: string;
  trackingId?: string;
  deliveryPartner?: string;
  expectedDeliveryDate?: string;
  statusHistory?: Array<{ status: string; timestamp: string }>;
  products?: Array<{
    productId: string;
    name: string;
    image?: string;
    selectedSize?: string;
    selectedColor?: string;
    quantity: number;
    price: number;
  }>;
  shipping?: {
    address: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    latitude?: number;
    longitude?: number;
  };
  deliveryLocation?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  deliveryPersonId?: string;
  assignedAt?: string;
};

const STORE_PATH = path.resolve(process.cwd(), 'data', 'orders.json');
let migrated = false;

async function ensureMigrated() {
  if (migrated) return;
  await migrateJsonIntoMongo();
  migrated = true;
}

async function ensureFileStore() {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
  try {
    await fs.access(STORE_PATH);
  } catch {
    await fs.writeFile(STORE_PATH, '[]', 'utf8');
  }
}

async function listFromFile(): Promise<StoredOrder[]> {
  await ensureFileStore();
  const raw = await fs.readFile(STORE_PATH, 'utf8');
  try {
    const parsed = JSON.parse(raw) as StoredOrder[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveToFile(orders: StoredOrder[]) {
  await ensureFileStore();
  await fs.writeFile(STORE_PATH, JSON.stringify(orders, null, 2), 'utf8');
}

export async function listStoredOrders(): Promise<StoredOrder[]> {
  await ensureMigrated();
  const collection = await ordersCollection();
  if (collection) {
    const docs = await collection.find({}).sort({ createdAt: -1 }).toArray();
    return docs.map((doc) => withoutMongoId(doc) as StoredOrder);
  }
  return listFromFile();
}

export async function upsertStoredOrder(next: StoredOrder): Promise<StoredOrder> {
  await ensureMigrated();
  const collection = await ordersCollection();
  if (collection) {
    await collection.updateOne({ $or: [{ id: next.id }, { number: next.number }] }, { $set: next }, { upsert: true });
    return next;
  }
  const list = await listFromFile();
  const index = list.findIndex((item) => item.id === next.id || item.number === next.number);
  if (index >= 0) list[index] = next;
  else list.unshift(next);
  await saveToFile(list);
  return next;
}

export async function findStoredOrder(idOrNumber: string): Promise<StoredOrder | null> {
  await ensureMigrated();
  const collection = await ordersCollection();
  if (collection) {
    const doc = await collection.findOne({
      $or: [{ id: idOrNumber }, { number: idOrNumber }, { orderId: idOrNumber }],
    });
    return withoutMongoId(doc) as StoredOrder | null;
  }
  const list = await listFromFile();
  return list.find((item) => item.id === idOrNumber || item.number === idOrNumber || item.orderId === idOrNumber) || null;
}

export async function updateStoredOrder(
  id: string,
  patch: Partial<StoredOrder>
): Promise<StoredOrder | null> {
  await ensureMigrated();
  const collection = await ordersCollection();
  if (collection) {
    const current = await collection.findOne({ $or: [{ id }, { number: id }, { orderId: id }] });
    if (!current) return null;
    const next = { ...(withoutMongoId(current) as StoredOrder), ...patch };
    await collection.updateOne({ id: current.id }, { $set: next });
    return next;
  }
  const list = await listFromFile();
  const index = list.findIndex((item) => item.id === id || item.number === id || item.orderId === id);
  if (index < 0) return null;
  list[index] = { ...list[index], ...patch };
  await saveToFile(list);
  return list[index];
}

export async function updateOrderTracking(
  id: string,
  patch: {
    status?: string;
    trackingId?: string;
    deliveryPartner?: string;
    expectedDeliveryDate?: string;
    updatedBy?: string;
  }
): Promise<StoredOrder | null> {
  const current = await findStoredOrder(id);
  if (!current) return null;

  const next: StoredOrder = { ...current };
  if (typeof patch.trackingId === 'string') next.trackingId = patch.trackingId.trim();
  if (typeof patch.deliveryPartner === 'string') next.deliveryPartner = patch.deliveryPartner.trim();
  if (typeof patch.expectedDeliveryDate === 'string') next.expectedDeliveryDate = patch.expectedDeliveryDate.trim();

  if (patch.status) {
    const status = patch.status;
    next.status = status;
    next.orderStatus = status;
    const history = [...(current.statusHistory || [])];
    const last = history[history.length - 1];
    if (!last || last.status !== status) {
      history.push({ status, timestamp: new Date().toISOString() });
    }
    next.statusHistory = history;
  }

  return updateStoredOrder(current.id, {
    status: next.status,
    orderStatus: next.orderStatus,
    trackingId: next.trackingId,
    deliveryPartner: next.deliveryPartner,
    expectedDeliveryDate: next.expectedDeliveryDate,
    statusHistory: next.statusHistory,
  });
}

export async function listOrdersForDeliveryPerson(deliveryPersonId: string): Promise<StoredOrder[]> {
  const list = await listStoredOrders();
  return list.filter((order) => order.deliveryPersonId === deliveryPersonId);
}

export async function deliveryPersonStats(deliveryPersonId: string) {
  const assignedOrders = await listOrdersForDeliveryPerson(deliveryPersonId);
  const delivered = assignedOrders.filter((order) => {
    const status = (order.status || order.orderStatus || '').trim().toLowerCase();
    return status === 'delivered';
  }).length;
  return {
    assigned: assignedOrders.length,
    delivered,
    pending: assignedOrders.length - delivered,
  };
}

export async function assignOrderDeliveryPerson(
  orderId: string,
  deliveryPersonId: string
): Promise<StoredOrder | null> {
  const current = await findStoredOrder(orderId);
  if (!current) return null;
  return updateStoredOrder(current.id, {
    deliveryPersonId,
    assignedAt: new Date().toISOString(),
  });
}
