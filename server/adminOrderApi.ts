import type { IncomingMessage, ServerResponse } from 'http';
import { bearerToken, signAuthToken, verifyAdminToken } from './jwt';
import { assignOrderDeliveryPerson, deliveryPersonStats, findStoredOrder, listOrdersForDeliveryPerson, updateOrderTracking } from './orderStore';
import { isTrackingStatus } from '../src/lib/orderTracking';
import { listAllReviewsForAdmin, moderateReview } from './reviewStore';
import {
  createDeliveryPerson,
  deleteDeliveryPerson,
  findUserById,
  isDeliveryPersonActive,
  listDeliveryPersons,
  updateDeliveryPerson,
  type DbUser,
} from './userStore';

function json(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function str(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

const ADMIN_EMAIL = (process.env.ADMIN_LOGIN_EMAIL || 'admin@zayrocollection.com').trim().toLowerCase();
const ADMIN_PASSWORD = (process.env.ADMIN_LOGIN_PASSWORD || 'ZayroAdmin#2026').trim();

export function isAdminOrderApi(urlPath: string) {
  return urlPath.startsWith('/api/admin');
}

function requireAdmin(req: IncomingMessage) {
  return verifyAdminToken(bearerToken(req.headers.authorization));
}

async function personWithStats(person: DbUser) {
  const stats = await deliveryPersonStats(person.id);
  return {
    id: person.id,
    fullName: person.fullName,
    phone: person.phone,
    email: person.email,
    status: isDeliveryPersonActive(person.status) ? 'Active' : 'Inactive',
    role: 'DELIVERY_PERSON' as const,
    assigned: stats.assigned,
    delivered: stats.delivered,
    pending: stats.pending,
  };
}

export async function handleAdminOrderApi(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const url = (req.url || '').split('?')[0];
    const method = (req.method || 'GET').toUpperCase();

    if (url === '/api/admin/login' && method === 'POST') {
      const payload = JSON.parse((await readBody(req)) || '{}') as Record<string, unknown>;
      const email = str(payload.email).toLowerCase();
      const password = typeof payload.password === 'string' ? payload.password : '';
      if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
        json(res, 401, { error: 'Invalid admin credentials.' });
        return;
      }
      json(res, 200, { token: signAuthToken({ userId: 'admin', email, role: 'admin' }) });
      return;
    }

    if (url === '/api/admin/reviews' && method === 'GET') {
      if (!requireAdmin(req)) {
        json(res, 401, { error: 'Admin sign in required.' });
        return;
      }
      json(res, 200, { reviews: await listAllReviewsForAdmin() });
      return;
    }

    const reviewMod = url.match(/^\/api\/admin\/reviews\/([^/]+)$/);
    if (reviewMod && method === 'PATCH') {
      if (!requireAdmin(req)) {
        json(res, 401, { error: 'Admin sign in required.' });
        return;
      }
      const payload = JSON.parse((await readBody(req)) || '{}') as Record<string, unknown>;
      const status = str(payload.status);
      if (status !== 'approved' && status !== 'rejected' && status !== 'pending') {
        json(res, 400, { error: 'Invalid review status.' });
        return;
      }
      const updated = await moderateReview(decodeURIComponent(reviewMod[1]), status);
      if ('error' in updated) {
        json(res, updated.status, { error: updated.error });
        return;
      }
      json(res, 200, { review: updated.review });
      return;
    }

    if (url === '/api/admin/delivery-persons' && method === 'GET') {
      if (!requireAdmin(req)) {
        json(res, 401, { error: 'Admin sign in required.' });
        return;
      }
      const people = await listDeliveryPersons();
      json(res, 200, { deliveryPersons: await Promise.all(people.map(personWithStats)) });
      return;
    }

    if (url === '/api/admin/delivery-persons' && method === 'POST') {
      if (!requireAdmin(req)) {
        json(res, 401, { error: 'Admin sign in required.' });
        return;
      }
      const payload = JSON.parse((await readBody(req)) || '{}') as Record<string, unknown>;
      const created = await createDeliveryPerson({
        fullName: str(payload.fullName),
        phone: str(payload.phone),
        email: str(payload.email),
        password: typeof payload.password === 'string' ? payload.password : '',
        status: str(payload.status) === 'Inactive' ? 'Inactive' : 'Active',
      });
      if ('error' in created) {
        json(res, created.status, { error: created.error });
        return;
      }
      const person = await findUserById(created.user.id);
      json(res, 201, { deliveryPerson: person ? await personWithStats(person) : created.user });
      return;
    }

    const personOrders = url.match(/^\/api\/admin\/delivery-persons\/([^/]+)\/orders$/);
    if (personOrders && method === 'GET') {
      if (!requireAdmin(req)) {
        json(res, 401, { error: 'Admin sign in required.' });
        return;
      }
      const person = await findUserById(decodeURIComponent(personOrders[1]));
      if (!person || person.role !== 'DELIVERY_PERSON') {
        json(res, 404, { error: 'Delivery person not found.' });
        return;
      }
      json(res, 200, { orders: await listOrdersForDeliveryPerson(person.id) });
      return;
    }

    const personPatch = url.match(/^\/api\/admin\/delivery-persons\/([^/]+)$/);
    if (personPatch && method === 'PATCH') {
      if (!requireAdmin(req)) {
        json(res, 401, { error: 'Admin sign in required.' });
        return;
      }
      const payload = JSON.parse((await readBody(req)) || '{}') as Record<string, unknown>;
      const updated = await updateDeliveryPerson(decodeURIComponent(personPatch[1]), {
        fullName: str(payload.fullName) || undefined,
        phone: str(payload.phone) || undefined,
        email: str(payload.email) || undefined,
        password: typeof payload.password === 'string' && payload.password ? payload.password : undefined,
        status: str(payload.status) === 'Inactive' ? 'Inactive' : str(payload.status) === 'Active' ? 'Active' : undefined,
      });
      if ('error' in updated) {
        json(res, updated.status, { error: updated.error });
        return;
      }
      const person = await findUserById(updated.id);
      json(res, 200, { deliveryPerson: person ? await personWithStats(person) : updated });
      return;
    }

    if (personPatch && method === 'DELETE') {
      if (!requireAdmin(req)) {
        json(res, 401, { error: 'Admin sign in required.' });
        return;
      }
      const deleted = await deleteDeliveryPerson(decodeURIComponent(personPatch[1]));
      if ('error' in deleted) {
        json(res, deleted.status, { error: deleted.error });
        return;
      }
      json(res, 200, { ok: true });
      return;
    }

    const assign = url.match(/^\/api\/admin\/orders\/([^/]+)\/assign$/);
    if (assign && method === 'PATCH') {
      if (!requireAdmin(req)) {
        json(res, 401, { error: 'Admin sign in required.' });
        return;
      }
      const orderId = decodeURIComponent(assign[1]);
      const existing = await findStoredOrder(orderId);
      if (!existing) {
        json(res, 404, { error: 'Order not found.' });
        return;
      }
      const payload = JSON.parse((await readBody(req)) || '{}') as Record<string, unknown>;
      const deliveryPersonId = str(payload.deliveryPersonId);
      const person = await findUserById(deliveryPersonId);
      if (!person || person.role !== 'DELIVERY_PERSON') {
        json(res, 400, { error: 'Select an active delivery person.' });
        return;
      }
      if (!isDeliveryPersonActive(person.status)) {
        json(res, 400, { error: 'Select an active delivery person.' });
        return;
      }
      const updated = await assignOrderDeliveryPerson(existing.id, person.id);
      json(res, 200, { order: updated, deliveryPerson: await personWithStats(person) });
      return;
    }

    const patch = url.match(/^\/api\/admin\/orders\/([^/]+)\/tracking$/);
    if (patch && method === 'PATCH') {
      if (!requireAdmin(req)) {
        json(res, 401, { error: 'Admin sign in required.' });
        return;
      }
      const orderId = decodeURIComponent(patch[1]);
      const existing = await findStoredOrder(orderId);
      if (!existing) {
        json(res, 404, { error: 'Order not found.' });
        return;
      }
      const payload = JSON.parse((await readBody(req)) || '{}') as Record<string, unknown>;
      const status = str(payload.status);
      if (status && !isTrackingStatus(status)) {
        json(res, 400, { error: 'Invalid order status.' });
        return;
      }
      const updated = await updateOrderTracking(existing.id, {
        status: status || undefined,
        trackingId: typeof payload.trackingId === 'string' ? str(payload.trackingId) : undefined,
        deliveryPartner: typeof payload.deliveryPartner === 'string' ? str(payload.deliveryPartner) : undefined,
        expectedDeliveryDate: typeof payload.expectedDeliveryDate === 'string' ? str(payload.expectedDeliveryDate) : undefined,
      });
      json(res, 200, { order: updated });
      return;
    }

    json(res, 404, { error: 'Not found' });
  } catch (error) {
    json(res, 500, { error: error instanceof Error ? error.message : 'Server error' });
  }
}
