import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = {
  api: {
    bodyParser: false,
  },
  maxDuration: 30,
};

function json(res: VercelResponse, status: number, body: unknown) {
  if (res.headersSent) return;
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
  if (raw.startsWith('/api/') && raw !== '/api' && !raw.endsWith('/index')) {
    return raw;
  }
  return raw.startsWith('/api') ? raw : `/api${raw}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const urlPath = resolveApiPath(req);
    const rawUrl = req.url || '';
    const search = rawUrl.includes('?') ? rawUrl.slice(rawUrl.indexOf('?')) : '';
    const cleanedSearch = search
      .replace(/[?&]__path=[^&]*/g, '')
      .replace(/^\?&/, '?')
      .replace(/^\?$/, '');
    (req as { url?: string }).url = `${urlPath}${cleanedSearch}`;

    if (urlPath === '/api/health') {
      json(res, 200, { ok: true, path: urlPath });
      return;
    }

    if (urlPath === '/api/ipinfo') {
      const { handleIpinfoRequest } = await import('../server/ipinfoLookup');
      await handleIpinfoRequest(req, res);
      return;
    }

    if (urlPath.startsWith('/api/stripe')) {
      const { handleStripeApi } = await import('../server/stripeHandler');
      await handleStripeApi(req, res);
      return;
    }

    if (urlPath.startsWith('/api/admin')) {
      const { handleAdminOrderApi } = await import('../server/adminOrderApi');
      await handleAdminOrderApi(req, res);
      return;
    }

    if (urlPath.startsWith('/api/reviews')) {
      const { handleReviewApi } = await import('../server/reviewApi');
      await handleReviewApi(req, res);
      return;
    }

    if (urlPath.startsWith('/api/auth') || urlPath.startsWith('/api/shop')) {
      const { handleShopApi } = await import('../server/shopApi');
      await handleShopApi(req, res);
      return;
    }

    if (urlPath.startsWith('/api/returns')) {
      const { handleReturnRequestApi } = await import('../server/returnRequestHandler');
      await handleReturnRequestApi(req, res);
      return;
    }

    if (urlPath.startsWith('/api/order-call') || urlPath.includes('confirmation')) {
      const { handleOrderCallApi } = await import('../server/confirmationCallHandler');
      await handleOrderCallApi(req, res);
      return;
    }

    if (urlPath.startsWith('/api/mongo')) {
      const { handleMongoHealth } = await import('../server/mongoHealth');
      await handleMongoHealth(req, res);
      return;
    }

    if (urlPath.startsWith('/api/chat')) {
      const { handleChatApi } = await import('../server/chatApi');
      await handleChatApi(req, res);
      return;
    }

    json(res, 404, { error: `API route not found: ${urlPath}` });
  } catch (error) {
    json(res, 500, {
      error: error instanceof Error ? error.message : 'Server error',
      stack: error instanceof Error ? error.stack?.split('\n').slice(0, 6) : undefined,
    });
  }
}
