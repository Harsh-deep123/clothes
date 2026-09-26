import type { IncomingMessage, ServerResponse } from 'http';
import { bearerToken, verifyAuthToken } from './jwt';
import {
  createReview,
  findEligiblePurchase,
  listPendingReviewsForOrder,
  listReviewsForProduct,
  listReviewSummaries,
  markReviewHelpful,
  readReviewMediaFile,
  resolveReviewAuthor,
  savePurchaseRating,
  saveReviewMedia,
} from './reviewStore';

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

export function isReviewApi(urlPath: string) {
  return urlPath.startsWith('/api/reviews');
}

export async function handleReviewApi(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const urlPath = (req.url || '').split('?')[0];
    const query = new URL(req.url || '', 'http://localhost').searchParams;
    const method = (req.method || 'GET').toUpperCase();
    const session = verifyAuthToken(bearerToken(req.headers.authorization));

    if (urlPath === '/api/reviews/summaries' && method === 'GET') {
      json(res, 200, { summaries: await listReviewSummaries() });
      return;
    }

    if (urlPath === '/api/reviews/pending' && method === 'GET') {
      if (!session) {
        json(res, 401, { error: 'Sign in to review your purchase.' });
        return;
      }
      const orderId = (query.get('orderId') || '').trim();
      if (!orderId) {
        json(res, 400, { error: 'Order is required.' });
        return;
      }
      const author = await resolveReviewAuthor(session.userId);
      if ('error' in author) {
        json(res, author.status, { error: author.error });
        return;
      }
      const pending = await listPendingReviewsForOrder({
        orderId,
        userId: session.userId,
        email: author.email || session.email,
      });
      if ('error' in pending) {
        json(res, pending.status, { error: pending.error });
        return;
      }
      json(res, 200, pending);
      return;
    }

    const media = urlPath.match(/^\/api\/reviews\/media\/([^/]+)$/);
    if (media && method === 'GET') {
      const file = await readReviewMediaFile(decodeURIComponent(media[1]));
      if (!file) {
        json(res, 404, { error: 'Media not found.' });
        return;
      }
      res.statusCode = 200;
      res.setHeader('Content-Type', file.mime);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.end(file.data);
      return;
    }

    if (urlPath === '/api/reviews' && method === 'POST') {
      const payload = JSON.parse((await readBody(req)) || '{}') as Record<string, unknown>;
      const productId = str(payload.productId);
      const orderId = str(payload.orderId);
      const rating = Math.round(Number(payload.rating));

      if (orderId) {
        const created = await savePurchaseRating({
          productId,
          orderId,
          rating,
          sessionUserId: session?.userId,
          sessionEmail: session?.email,
        });
        if ('error' in created) {
          json(res, created.status, { error: created.error });
          return;
        }
        json(res, 201, {
          review: created.review,
          message: 'Thank you for your feedback!',
        });
        return;
      }

      if (!session) {
        json(res, 401, { error: 'Sign in to write a review.' });
        return;
      }
      const author = await resolveReviewAuthor(session.userId);
      if ('error' in author) {
        json(res, author.status, { error: author.error });
        return;
      }
      const mediaResult = await saveReviewMedia(Array.isArray(payload.media) ? payload.media : []);
      if ('error' in mediaResult) {
        json(res, mediaResult.status, { error: mediaResult.error });
        return;
      }
      const purchase = await findEligiblePurchase({
        productId,
        userId: session.userId,
        email: author.email || session.email,
        orderId,
      });
      if (!purchase.purchased) {
        json(res, 403, { error: 'You can only review products you have purchased.' });
        return;
      }
      if (purchase.alreadyReviewed) {
        json(res, 409, { error: 'You have already reviewed this product for this order.' });
        return;
      }
      const created = await createReview({
        productId,
        userId: author.userId,
        userName: author.userName,
        rating,
        title: str(payload.title),
        reviewText: str(payload.reviewText),
        orderId: purchase.orderId,
        isVerifiedPurchase: true,
        media: mediaResult,
      });
      if ('error' in created) {
        json(res, created.status, { error: created.error });
        return;
      }
      json(res, 201, {
        review: created.review,
        message: 'Thank you for your feedback!',
      });
      return;
    }

    const helpful = urlPath.match(/^\/api\/reviews\/([^/]+)\/helpful$/);
    if (helpful && method === 'POST') {
      if (!session) {
        json(res, 401, { error: 'Sign in to mark a review as helpful.' });
        return;
      }
      const result = await markReviewHelpful(decodeURIComponent(helpful[1]), session.userId);
      if ('error' in result) {
        json(res, result.status, { error: result.error });
        return;
      }
      json(res, 200, result);
      return;
    }

    const byProduct = urlPath.match(/^\/api\/reviews\/([^/]+)$/);
    if (byProduct && method === 'GET') {
      const productId = decodeURIComponent(byProduct[1]);
      if (productId === 'summaries' || productId === 'media' || productId === 'pending') {
        json(res, 404, { error: 'Not found' });
        return;
      }
      const page = Number(query.get('page') || 1) || 1;
      const limit = Number(query.get('limit') || 5) || 5;
      json(res, 200, await listReviewsForProduct(productId, page, limit, session?.userId));
      return;
    }

    json(res, 404, { error: 'Not found' });
  } catch (error) {
    json(res, 500, { error: error instanceof Error ? error.message : 'Server error' });
  }
}
