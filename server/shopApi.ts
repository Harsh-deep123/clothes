import type { IncomingMessage, ServerResponse } from 'http';
import { bearerToken, signAuthToken, verifyAuthToken } from './jwt';
import { seedProductsCollection, createShopOrder, getOrderByOrderId, listOrdersForUser, normalizeDeliveryLocation } from './shopOrders';
import { sendRegistrationOtp, verifyRegistrationOtp } from './otpStore';
import { findUserById, updateUserProfile, verifyUser } from './userStore';

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

function authUser(req: IncomingMessage) {
  const token = bearerToken(req.headers.authorization);
  if (!token) return null;
  return verifyAuthToken(token);
}

function withoutDeliveryAssignment<T extends { deliveryPersonId?: string; assignedAt?: string }>(order: T) {
  const { deliveryPersonId: _id, assignedAt: _assigned, ...rest } = order;
  return rest;
}

export function isShopApi(urlPath: string) {
  return urlPath.startsWith('/api/auth') || urlPath.startsWith('/api/shop');
}

export async function handleShopApi(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    await seedProductsCollection();
    await handleInner(req, res);
  } catch (error) {
    if (!res.headersSent) {
      json(res, 500, { error: error instanceof Error ? error.message : 'Server error' });
    }
  }
}

async function handleInner(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = (req.url || '').split('?')[0];
  const method = (req.method || 'GET').toUpperCase();

  if (url === '/api/auth/send-otp' && method === 'POST') {
    const payload = JSON.parse((await readBody(req)) || '{}') as Record<string, unknown>;
    const result = await sendRegistrationOtp({
      fullName: str(payload.fullName),
      email: str(payload.email),
      phone: str(payload.phone),
      password: typeof payload.password === 'string' ? payload.password : '',
    });
    if ('error' in result) {
      json(res, result.status, { error: result.error });
      return;
    }
    json(res, 200, result);
    return;
  }

  if (url === '/api/auth/verify-otp' && method === 'POST') {
    const payload = JSON.parse((await readBody(req)) || '{}') as Record<string, unknown>;
    const result = await verifyRegistrationOtp({
      email: str(payload.email),
      phone: str(payload.phone),
      otp: str(payload.otp),
    });
    if ('error' in result) {
      json(res, result.status, { error: result.error });
      return;
    }
    json(res, 201, {
      user: result.user,
      token: signAuthToken({ userId: result.user.id, email: result.user.email }),
    });
    return;
  }

  if (url === '/api/auth/register' && method === 'POST') {
    json(res, 403, {
      error: 'Phone verification is required. Request an OTP, then verify it to create your account.',
    });
    return;
  }

  if (url === '/api/auth/login' && method === 'POST') {
    const payload = JSON.parse((await readBody(req)) || '{}') as Record<string, unknown>;
    const result = await verifyUser(str(payload.email), typeof payload.password === 'string' ? payload.password : '');
    if ('error' in result) {
      json(res, result.status, { error: result.error });
      return;
    }
    json(res, 200, { user: result.user, token: signAuthToken({ userId: result.user.id, email: result.user.email }) });
    return;
  }

  if (url === '/api/auth/me' && method === 'GET') {
    const session = authUser(req);
    if (!session) {
      json(res, 401, { error: 'Sign in required.' });
      return;
    }
    const user = await findUserById(session.userId);
    if (!user) {
      json(res, 401, { error: 'Account not found.' });
      return;
    }
    const { passwordHash: _pw, ...safe } = user;
    json(res, 200, { user: safe });
    return;
  }

  if (url === '/api/auth/profile' && method === 'PATCH') {
    const session = authUser(req);
    if (!session) {
      json(res, 401, { error: 'Sign in required.' });
      return;
    }
    const payload = JSON.parse((await readBody(req)) || '{}') as Record<string, unknown>;
    const user = await updateUserProfile(session.userId, {
      fullName: str(payload.fullName) || undefined,
      phone: str(payload.phone) || undefined,
      shippingAddress: str(payload.shippingAddress),
      city: str(payload.city),
      state: str(payload.state),
      country: str(payload.country),
      postalCode: str(payload.postalCode),
    });
    if (!user) {
      json(res, 404, { error: 'Account not found.' });
      return;
    }
    json(res, 200, { user });
    return;
  }

  if (url === '/api/shop/orders' && method === 'POST') {
    const payload = JSON.parse((await readBody(req)) || '{}') as Record<string, unknown>;
    const session = authUser(req);
    const shipping = (payload.shippingAddress || {}) as Record<string, unknown>;
    const items = Array.isArray(payload.items) ? payload.items : [];
    const shippingAddress = {
      address: str(shipping.address),
      city: str(shipping.city),
      state: str(shipping.state),
      postalCode: str(shipping.postalCode),
      country: str(shipping.country),
    };
    const deliveryAddressLine = [shippingAddress.address, shippingAddress.city, shippingAddress.state, shippingAddress.postalCode, shippingAddress.country]
      .filter(Boolean)
      .join(', ');
    const order = await createShopOrder({
      userId: session?.userId || str(payload.userId) || null,
      customerName: str(payload.customerName),
      customerEmail: str(payload.customerEmail),
      customerPhone: str(payload.customerPhone),
      shippingAddress,
      items: items.map((item) => {
        const row = item as Record<string, unknown>;
        return {
          productId: str(row.productId),
          name: str(row.name) || 'Item',
          image: str(row.image) || undefined,
          selectedSize: str(row.selectedSize) || undefined,
          selectedColor: str(row.selectedColor) || undefined,
          quantity: Number(row.quantity) || 1,
          price: Number(row.price) || 0,
        };
      }),
      subtotal: Number(payload.subtotal) || 0,
      deliveryCharge: Number(payload.deliveryCharge) || 0,
      handlingCharge: Number(payload.handlingCharge) || 0,
      discount: Number(payload.discount) || 0,
      total: Number(payload.total) || 0,
      paymentMethod: str(payload.paymentMethod) || 'cod',
      paymentStatus: str(payload.paymentStatus) || 'unpaid',
      stripePaymentIntentId: str(payload.stripePaymentIntentId) || undefined,
      deliveryLocation: normalizeDeliveryLocation(payload.deliveryLocation, deliveryAddressLine),
    });
    json(res, 201, { order });
    return;
  }

  if (url === '/api/shop/orders' && method === 'GET') {
    const session = authUser(req);
    if (!session || session.role === 'admin') {
      json(res, 401, { error: 'Sign in required.' });
      return;
    }
    json(res, 200, { orders: (await listOrdersForUser(session.userId)).map(withoutDeliveryAssignment) });
    return;
  }

  const tracking = url.match(/^\/api\/shop\/orders\/([^/]+)\/tracking$/);
  if (tracking && method === 'GET') {
    const session = authUser(req);
    if (!session || session.role === 'admin') {
      json(res, 401, { error: 'Sign in required.' });
      return;
    }
    const order = await getOrderByOrderId(decodeURIComponent(tracking[1]), session.userId, session.email);
    if (!order) {
      json(res, 404, { error: 'Order not found.' });
      return;
    }
    json(res, 200, { order: withoutDeliveryAssignment(order) });
    return;
  }

  const byId = url.match(/^\/api\/shop\/orders\/([^/]+)$/);
  if (byId && method === 'GET') {
    const session = authUser(req);
    if (!session || session.role === 'admin') {
      json(res, 401, { error: 'Sign in required.' });
      return;
    }
    const order = await getOrderByOrderId(decodeURIComponent(byId[1]), session.userId, session.email);
    if (!order) {
      json(res, 404, { error: 'Order not found.' });
      return;
    }
    json(res, 200, { order: withoutDeliveryAssignment(order) });
    return;
  }

  json(res, 404, { error: 'Not found' });
}
