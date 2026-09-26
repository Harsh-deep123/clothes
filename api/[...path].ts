import type { IncomingMessage, ServerResponse } from 'http';
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

function json(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const url = (req.url || '').split('?')[0] || '';

  try {
    if (url === '/api/ipinfo') {
      await handleIpinfoRequest(req, res);
      return;
    }
    if (isStripeApi(url)) {
      await handleStripeApi(req, res);
      return;
    }
    if (isAdminOrderApi(url)) {
      await handleAdminOrderApi(req, res);
      return;
    }
    if (isReviewApi(url)) {
      await handleReviewApi(req, res);
      return;
    }
    if (isShopApi(url)) {
      await handleShopApi(req, res);
      return;
    }
    if (isReturnRequestApi(url)) {
      await handleReturnRequestApi(req, res);
      return;
    }
    if (isOrderCallApi(url)) {
      await handleOrderCallApi(req, res);
      return;
    }
    if (isMongoHealthApi(url)) {
      await handleMongoHealth(req, res);
      return;
    }
    if (isChatApi(url)) {
      await handleChatApi(req, res);
      return;
    }

    json(res, 404, { error: 'Not found' });
  } catch (error) {
    if (!res.headersSent) {
      json(res, 500, {
        error: error instanceof Error ? error.message : 'Server error',
      });
    }
  }
}
