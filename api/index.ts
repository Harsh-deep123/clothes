import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleAdminOrderApi, isAdminOrderApi } from '../server/adminOrderApi';
import { handleChatApi, isChatApi } from '../server/chatApi';
import { handleOrderCallApi, isOrderCallApi } from '../server/confirmationCallHandler';
import { handleIpinfoRequest } from '../server/ipinfoLookup';
import { handleMongoHealth, isMongoHealthApi } from '../server/mongoHealth';
import { handleReturnRequestApi, isReturnRequestApi } from '../server/returnRequestHandler';
import { handleReviewApi, isReviewApi } from '../server/reviewApi';
import { handleShopApi, isShopApi } from '../server/shopApi';
import { handleStripeApi, isStripeApi } from '../server/stripeHandler';

export const config = {
  api: {
    bodyParser: false,
  },
  maxDuration: 30,
};

function json(res: VercelResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

function resolveApiPath(req: VercelRequest): string {
  const fromQuery = req.query.__path;
  if (typeof fromQuery === 'string' && fromQuery.trim()) {
    return `/api/${fromQuery.replace(/^\/+/, '')}`;
  }
  if (Array.isArray(fromQuery) && fromQuery[0]) {
    return `/api/${String(fromQuery[0]).replace(/^\/+/, '')}`;
  }

  const raw = (req.url || '').split('?')[0] || '';
  if (raw.startsWith('/api/') && raw !== '/api' && raw !== '/api/index') {
    return raw;
  }

  return raw.startsWith('/api') ? raw : `/api${raw}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const urlPath = resolveApiPath(req);
  const search = (req.url || '').includes('?')
    ? (req.url || '').slice((req.url || '').indexOf('?'))
    : '';
  // Existing Node handlers read req.url / req.method.
  (req as { url?: string }).url = `${urlPath}${search.replace(/([?&])__path=[^&]*/g, '').replace(/\?&/, '?').replace(/\?$/, '')}`;

  try {
    if (urlPath === '/api/ipinfo') {
      await handleIpinfoRequest(req, res);
      return;
    }
    if (isStripeApi(urlPath)) {
      await handleStripeApi(req, res);
      return;
    }
    if (isAdminOrderApi(urlPath)) {
      await handleAdminOrderApi(req, res);
      return;
    }
    if (isReviewApi(urlPath)) {
      await handleReviewApi(req, res);
      return;
    }
    if (isShopApi(urlPath)) {
      await handleShopApi(req, res);
      return;
    }
    if (isReturnRequestApi(urlPath)) {
      await handleReturnRequestApi(req, res);
      return;
    }
    if (isOrderCallApi(urlPath)) {
      await handleOrderCallApi(req, res);
      return;
    }
    if (isMongoHealthApi(urlPath)) {
      await handleMongoHealth(req, res);
      return;
    }
    if (isChatApi(urlPath)) {
      await handleChatApi(req, res);
      return;
    }

    json(res, 404, { error: `API route not found: ${urlPath}` });
  } catch (error) {
    if (!res.headersSent) {
      json(res, 500, {
        error: error instanceof Error ? error.message : 'Server error',
      });
    }
  }
}
