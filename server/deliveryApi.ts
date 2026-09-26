import type { IncomingMessage, ServerResponse } from 'http';
import { bearerToken, signAuthToken, verifyDeliveryToken } from './jwt';
import { findStoredOrder, listOrdersForDeliveryPerson, updateOrderTracking, type StoredOrder } from './orderStore';
import { isDeliveryAllowedStatus } from './roles';
import { findUserById, verifyUser } from './userStore';

function json(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function str(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

export function isDeliveryApi(urlPath: string) {
  return urlPath.startsWith('/api/delivery');
}

function requireDelivery(req: IncomingMessage) {
  return verifyDeliveryToken(bearerToken(req.headers.authorization));
}

function toDeliveryOrder(order: StoredOrder) {
  const lat = order.deliveryLocation?.latitude ?? order.shipping?.latitude;
  const lng = order.deliveryLocation?.longitude ?? order.shipping?.longitude;
  return {
    id: order.id,
    orderId: order.orderId || order.number,
    number: order.number,
    createdAt: order.createdAt,
    assignedAt: order.assignedAt || '',
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    deliveryAddress: order.deliveryAddress,
    shipping: order.shipping,
    deliveryLocation: order.deliveryLocation,
    latitude: Number.isFinite(lat) ? lat : undefined,
    longitude: Number.isFinite(lng) ? lng : undefined,
    items: order.items,
    products: order.products,
    total: order.total,
    status: order.status || order.orderStatus,
    orderStatus: order.orderStatus || order.status,
    statusHistory: order.statusHistory,
  };
}

export async function handleDeliveryApi(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const url = (req.url || '').split('?')[0];
    const method = (req.method || 'GET').toUpperCase();

    if (url === '/api/delivery/login' && method === 'POST') {
      const payload = JSON.parse((await readBody(req)) || '{}') as Record<string, unknown>;
      const result = await verifyUser(str(payload.email), typeof payload.password === 'string' ? payload.password : '');
      if ('error' in result) {
        json(res, result.status, { error: result.error });
        return;
      }
      if (result.user.role !== 'DELIVERY_PERSON') {
        json(res, 403, { error: 'This login is only for delivery persons.' });
        return;
      }
      if (result.user.status === 'Inactive') {
        json(res, 403, { error: 'This delivery account is inactive.' });
        return;
      }
      json(res, 200, {
        user: result.user,
        token: signAuthToken({
          userId: result.user.id,
          email: result.user.email,
          role: 'DELIVERY_PERSON',
        }),
      });
      return;
    }

    if (url === '/api/delivery/orders' && method === 'GET') {
      const session = requireDelivery(req);
      if (!session) {
        json(res, 401, { error: 'Delivery sign in required.' });
        return;
      }
      const person = await findUserById(session.userId);
      if (!person || person.role !== 'DELIVERY_PERSON' || person.status === 'Inactive') {
        json(res, 403, { error: 'Delivery account is not available.' });
        return;
      }
      const orders = await listOrdersForDeliveryPerson(session.userId);
      json(res, 200, { orders: orders.map(toDeliveryOrder) });
      return;
    }

    const statusPatch = url.match(/^\/api\/delivery\/orders\/([^/]+)\/status$/);
    if (statusPatch && method === 'PATCH') {
      const session = requireDelivery(req);
      if (!session) {
        json(res, 401, { error: 'Delivery sign in required.' });
        return;
      }
      const person = await findUserById(session.userId);
      if (!person || person.role !== 'DELIVERY_PERSON' || person.status === 'Inactive') {
        json(res, 403, { error: 'Delivery account is not available.' });
        return;
      }
      const orderId = decodeURIComponent(statusPatch[1]);
      const existing = await findStoredOrder(orderId);
      if (!existing || existing.deliveryPersonId !== session.userId) {
        json(res, 404, { error: 'Order not found.' });
        return;
      }
      const payload = JSON.parse((await readBody(req)) || '{}') as Record<string, unknown>;
      const status = str(payload.status);
      if (!isDeliveryAllowedStatus(status)) {
        json(res, 403, { error: 'Delivery persons can only update delivery statuses.' });
        return;
      }
      const updated = await updateOrderTracking(existing.id, { status, updatedBy: 'delivery_person' });
      json(res, 200, { order: updated ? toDeliveryOrder(updated) : existing });
      return;
    }

    json(res, 404, { error: 'Not found' });
  } catch (error) {
    json(res, 500, { error: error instanceof Error ? error.message : 'Server error' });
  }
}
