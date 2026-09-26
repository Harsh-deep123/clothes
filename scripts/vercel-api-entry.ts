import type { IncomingMessage, ServerResponse } from 'http';
import { handleAdminOrderApi } from '../server/adminOrderApi';
import { handleChatApi } from '../server/chatApi';
import { handleOrderCallApi } from '../server/confirmationCallHandler';
import { handleIpinfoRequest } from '../server/ipinfoLookup';
import { handleMongoHealth } from '../server/mongoHealth';
import { handleReturnRequestApi } from '../server/returnRequestHandler';
import { handleReviewApi } from '../server/reviewApi';
import { handleShopApi } from '../server/shopApi';
import { handleStripeApi } from '../server/stripeHandler';

export const config = {
  api: {
    bodyParser: false,
  },
};

type ApiReq = IncomingMessage & {
  query?: Record<string, string | string[] | undefined>;
  url?: string;
  body?: unknown;
};
type ApiRes = ServerResponse;

function json(res: ApiRes, status: number, body: unknown) {
  if (res.headersSent) return;
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

function resolveApiPath(req: ApiReq): string {
  const fromQuery = req.query?.__path;
  if (typeof fromQuery === 'string' && fromQuery.trim()) {
    return `/api/${fromQuery.replace(/^\/+/, '')}`;
  }
  if (Array.isArray(fromQuery) && fromQuery[0]) {
    return `/api/${String(fromQuery[0]).replace(/^\/+/, '')}`;
  }

  const raw = (req.url || '').split('?')[0] || '';
  if (raw.startsWith('/api/') && raw !== '/api' && !raw.endsWith('/index')) {
    return raw;
  }
  return raw.startsWith('/api') ? raw : `/api${raw}`;
}

export default async function handler(req: ApiReq, res: ApiRes) {
  try {
    const urlPath = resolveApiPath(req);
    const rawUrl = req.url || '';
    const search = rawUrl.includes('?') ? rawUrl.slice(rawUrl.indexOf('?')) : '';
    const cleanedSearch = search
      .replace(/[?&]__path=[^&]*/g, '')
      .replace(/^\?&/, '?')
      .replace(/^\?$/, '');
    req.url = `${urlPath}${cleanedSearch}`;

    if (urlPath === '/api/health') {
      json(res, 200, { ok: true, path: urlPath });
      return;
    }

    if (urlPath === '/api/ipinfo') {
      await handleIpinfoRequest(req, res);
      return;
    }
    if (urlPath.startsWith('/api/stripe')) {
      await handleStripeApi(req, res);
      return;
    }
    if (urlPath.startsWith('/api/admin')) {
      await handleAdminOrderApi(req, res);
      return;
    }
    if (urlPath.startsWith('/api/reviews')) {
      await handleReviewApi(req, res);
      return;
    }
    if (urlPath.startsWith('/api/auth') || urlPath.startsWith('/api/shop')) {
      await handleShopApi(req, res);
      return;
    }
    if (urlPath.startsWith('/api/returns')) {
      await handleReturnRequestApi(req, res);
      return;
    }
    if (urlPath.startsWith('/api/order-call') || urlPath.includes('confirmation')) {
      await handleOrderCallApi(req, res);
      return;
    }
    if (urlPath.startsWith('/api/mongo')) {
      await handleMongoHealth(req, res);
      return;
    }
    if (urlPath.startsWith('/api/chat')) {
      await handleChatApi(req, res);
      return;
    }

    json(res, 404, { error: `API route not found: ${urlPath}` });
  } catch (error) {
    json(res, 500, {
      error: error instanceof Error ? error.message : 'Server error',
    });
  }
}
