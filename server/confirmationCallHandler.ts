import type { IncomingMessage, ServerResponse } from 'http';
import { applyTwilioCallStatus, applyTwilioWhatsAppStatus, initiateConfirmationCall, listOrdersWithLiveCallStatus } from './confirmationCall';

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

export function isOrderCallApi(urlPath: string) {
  return (
    urlPath === '/api/orders/confirmation-call' ||
    urlPath === '/api/orders' ||
    urlPath === '/api/twilio/voice-status' ||
    urlPath === '/api/twilio/message-status'
  );
}

export async function handleOrderCallApi(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
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

  if (url === '/api/orders' && method === 'GET') {
    json(res, 200, { orders: await listOrdersWithLiveCallStatus() });
    return;
  }

  if (url === '/api/orders/confirmation-call' && method === 'POST') {
    let payload: Record<string, unknown> = {};
    try {
      payload = JSON.parse((await readBody(req)) || '{}') as Record<string, unknown>;
    } catch {
      json(res, 400, { error: 'Invalid JSON body' });
      return;
    }

    const id = str(payload.id);
    const number = str(payload.number);
    const customerName = str(payload.customerName);
    const customerPhone = str(payload.customerPhone);
    const total = Number(payload.total);
    if (!id || !number || !customerPhone) {
      json(res, 400, { error: 'Order id, number, and customer phone are required.' });
      return;
    }

    const items = Array.isArray(payload.items)
      ? payload.items.map((item) => {
          const row = item as Record<string, unknown>;
          return {
            name: str(row.name) || 'Item',
            quantity: Number(row.quantity) || 1,
            price: Number(row.price) || 0,
          };
        })
      : [];
    const shipping = (payload.shippingAddress || {}) as Record<string, unknown>;
    const order = await initiateConfirmationCall({
      id,
      number,
      customerName,
      customerPhone,
      customerEmail: str(payload.customerEmail),
      total: Number.isFinite(total) ? total : 0,
      createdAt: str(payload.createdAt) || undefined,
      items,
      shippingAddress: {
        address: str(shipping.address),
        city: str(shipping.city),
        state: str(shipping.state),
        postalCode: str(shipping.postalCode),
        country: str(shipping.country),
      },
    });
    json(res, 200, { order });
    return;
  }

  if (url === '/api/twilio/voice-status' && method === 'POST') {
    const raw = await readBody(req);
    const params = new URLSearchParams(raw);
    const sid = params.get('CallSid') || '';
    const status = params.get('CallStatus') || '';
    if (!sid) {
      json(res, 400, { error: 'CallSid required' });
      return;
    }
    const order = await applyTwilioCallStatus(sid, status);
    json(res, 200, { ok: true, order });
    return;
  }

  if (url === '/api/twilio/message-status' && method === 'POST') {
    const raw = await readBody(req);
    const params = new URLSearchParams(raw);
    const sid = params.get('MessageSid') || '';
    const status = params.get('MessageStatus') || '';
    if (!sid) {
      json(res, 400, { error: 'MessageSid required' });
      return;
    }
    const order = await applyTwilioWhatsAppStatus(sid, status);
    json(res, 200, { ok: true, order });
    return;
  }

  json(res, 404, { error: 'Not found' });
}
