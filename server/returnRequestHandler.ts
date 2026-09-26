import type { IncomingMessage, ServerResponse } from 'http';
import type { ReturnRequest, ReturnRequestStatus, ReturnRequestType } from '../src/types/returnRequest';
import { notifyAdmin } from './notifyAdmin';
import { addReturnRequest, listReturnRequests, updateReturnRequestStatus } from './returnRequestStore';

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

function asType(value: unknown): ReturnRequestType {
  return value === 'replace' ? 'replace' : 'return';
}

function asStatus(value: unknown): ReturnRequestStatus | null {
  if (value === 'pending' || value === 'approved' || value === 'rejected' || value === 'completed') {
    return value;
  }
  return null;
}

function str(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

export async function handleReturnRequestApi(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    await handleReturnRequestApiInner(req, res);
  } catch (error) {
    if (!res.headersSent) {
      json(res, 500, { error: error instanceof Error ? error.message : 'Server error' });
    }
  }
}

async function handleReturnRequestApiInner(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = (req.url || '').split('?')[0];
  const method = (req.method || 'GET').toUpperCase();

  if (url === '/api/return-requests' && method === 'GET') {
    json(res, 200, { requests: await listReturnRequests() });
    return;
  }

  if (url === '/api/return-requests' && method === 'POST') {
    let payload: Record<string, unknown> = {};
    try {
      payload = JSON.parse((await readBody(req)) || '{}') as Record<string, unknown>;
    } catch {
      json(res, 400, { error: 'Invalid JSON body' });
      return;
    }

    const customerName = str(payload.customerName);
    const customerPhone = str(payload.customerPhone);
    const customerEmail = str(payload.customerEmail);
    const orderNumber = str(payload.orderNumber);
    if (!customerName || !customerPhone || !customerEmail || !orderNumber) {
      json(res, 400, { error: 'Order number, name, phone, and email are required.' });
      return;
    }

    const draft: ReturnRequest = {
      id: `RR-${Date.now().toString(36).toUpperCase()}`,
      createdAt: new Date().toISOString(),
      status: 'pending',
      requestType: asType(payload.requestType),
      orderNumber,
      customerName,
      customerPhone,
      customerEmail,
      customerAddress: str(payload.customerAddress),
      productName: str(payload.productName),
      productDetails: str(payload.productDetails),
      reason: str(payload.reason),
      additionalMessage: str(payload.additionalMessage),
      orderMatched: Boolean(payload.orderMatched),
      notifications: {
        email: { sent: false },
        whatsapp: { sent: false },
        sms: { sent: false },
      },
    };

    draft.notifications = await notifyAdmin(draft);
    const saved = await addReturnRequest(draft);
    json(res, 201, { request: saved });
    return;
  }

  const statusMatch = url.match(/^\/api\/return-requests\/([^/]+)\/status$/);
  if (statusMatch && method === 'PATCH') {
    let payload: Record<string, unknown> = {};
    try {
      payload = JSON.parse((await readBody(req)) || '{}') as Record<string, unknown>;
    } catch {
      json(res, 400, { error: 'Invalid JSON body' });
      return;
    }
    const status = asStatus(payload.status);
    if (!status) {
      json(res, 400, { error: 'Status must be pending, approved, rejected, or completed.' });
      return;
    }
    const updated = await updateReturnRequestStatus(decodeURIComponent(statusMatch[1]), status);
    if (!updated) {
      json(res, 404, { error: 'Request not found' });
      return;
    }
    json(res, 200, { request: updated });
    return;
  }

  json(res, 404, { error: 'Not found' });
}

export function isReturnRequestApi(urlPath: string) {
  return urlPath === '/api/return-requests' || urlPath.startsWith('/api/return-requests/');
}
