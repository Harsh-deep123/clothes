import { PRODUCTS } from '../src/data/products';
import { randomUUID } from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { getDb } from './mongo';
import { withoutMongoId } from './mongoCollections';
import { findStoredOrder, listStoredOrders } from './orderStore';
import { findUserById } from './userStore';

export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export type ReviewMedia = {
  url: string;
  kind: 'image' | 'video';
  mime: string;
};

export type StoredReview = {
  id: string;
  productId: string;
  productName?: string;
  productImage?: string;
  userId: string;
  userName: string;
  rating: number;
  title: string;
  reviewText: string;
  orderId: string;
  isVerifiedPurchase: boolean;
  status: ReviewStatus;
  media: ReviewMedia[];
  helpfulCount: number;
  helpfulVoterIds: string[];
  createdAt: string;
};

export type ReviewSummary = {
  productId: string;
  averageRating: number;
  totalReviews: number;
  breakdown: Record<1 | 2 | 3 | 4 | 5, number>;
};

const MEDIA_DIR = path.resolve(process.cwd(), 'data', 'review-media');
const MAX_IMAGES = 4;
const MAX_VIDEOS = 1;
const MAX_IMAGE_BYTES = 1_500_000;
const MAX_VIDEO_BYTES = 6_000_000;

function emptyBreakdown(): ReviewSummary['breakdown'] {
  return { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
}

async function reviews() {
  const db = await getDb();
  return db?.collection<StoredReview>('reviews') || null;
}

function publicReview(doc: StoredReview, voterId?: string) {
  const { helpfulVoterIds, ...rest } = doc;
  return {
    ...rest,
    helpfulCount: doc.helpfulCount || 0,
    helpfulByMe: Boolean(voterId && (helpfulVoterIds || []).includes(voterId)),
  };
}

function isApproved(doc: StoredReview) {
  return !doc.status || doc.status === 'approved';
}

function orderHasProduct(
  order: {
    products?: Array<{ productId?: string; name?: string }>;
    items?: Array<{ productId?: string; name?: string; quantity?: number; price?: number }>;
  },
  productId: string
) {
  const id = productId.trim();
  if (!id) return false;
  if ((order.products || []).some((item) => (item.productId || '').trim() === id)) return true;
  if ((order.items || []).some((item) => (item.productId || '').trim() === id)) return true;
  const catalog = PRODUCTS.find((item) => item.id === id);
  const name = (catalog?.name || '').trim().toLowerCase();
  if (name) {
    if ((order.products || []).some((item) => (item.name || '').trim().toLowerCase() === name)) return true;
    if ((order.items || []).some((item) => (item.name || '').trim().toLowerCase() === name)) return true;
  }
  return false;
}

function isOrderConfirmed(order: { orderStatus?: string; status?: string }) {
  const status = `${order.orderStatus || ''} ${order.status || ''}`.toLowerCase();
  if (status.includes('cancel')) return false;
  return true;
}

function customerOwnsOrder(
  order: { userId?: string | null; customerEmail: string },
  userId?: string,
  email?: string
) {
  if (userId && order.userId && order.userId === userId) return true;
  if (email && order.customerEmail && order.customerEmail.toLowerCase() === email.toLowerCase()) return true;
  return false;
}

function uniqueOrderProducts(order: {
  products?: Array<{ productId?: string; name?: string; image?: string }>;
  items?: Array<{ productId?: string; name?: string }>;
}) {
  const seen = new Set<string>();
  const rows: Array<{ productId: string; name: string; image: string }> = [];
  const source =
    order.products && order.products.length
      ? order.products
      : (order.items || []).map((item) => ({ productId: item.productId, name: item.name, image: '' }));
  for (const item of source) {
    const productId = (item.productId || '').trim();
    if (!productId || seen.has(productId)) continue;
    seen.add(productId);
    rows.push({
      productId,
      name: (item.name || 'Purchased item').trim(),
      image: ('image' in item && typeof item.image === 'string' ? item.image : '') || '',
    });
  }
  return rows;
}

function productMetaFromOrder(
  order: {
    products?: Array<{ productId?: string; name?: string; image?: string }>;
    items?: Array<{ productId?: string; name?: string }>;
  },
  productId: string
) {
  const fromProducts = (order.products || []).find((item) => item.productId === productId);
  const fromItems = (order.items || []).find((item) => item.productId === productId);
  const catalog = PRODUCTS.find((item) => item.id === productId);
  return {
    productName: (fromProducts?.name || fromItems?.name || catalog?.name || '').trim(),
    productImage: (fromProducts?.image || catalog?.images?.[0] || '').trim(),
  };
}

export async function savePurchaseRating(input: {
  productId: string;
  orderId: string;
  rating: number;
  sessionUserId?: string;
  sessionEmail?: string;
}): Promise<{ review: StoredReview } | { error: string; status: number }> {
  const productId = input.productId.trim();
  const orderId = input.orderId.trim();
  if (!productId || !orderId) return { error: 'Product and order are required.', status: 400 };
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
    return { error: 'Rating must be between 1 and 5.', status: 400 };
  }

  const order = await findStoredOrder(orderId);
  const catalog = PRODUCTS.find((item) => item.id === productId);
  // Confirmation page sends orderId + productId. Admin-created products are not in
  // the seed catalog, and local-only orders may not be in Mongo yet — still allow rating.
  const productInOrder = order
    ? orderHasProduct(order, productId)
    : Boolean(productId && orderId);
  if (!productInOrder) {
    return { error: 'This rating must match a confirmed order.', status: 403 };
  }
  if (order && !isOrderConfirmed(order)) {
    return { error: 'You can rate products after the order is confirmed.', status: 403 };
  }

  const savedOrderId = order?.orderId || order?.id || orderId;
  const collection = await reviews();
  if (!collection) return { error: 'Database is unavailable.', status: 503 };
  const existing = await collection.findOne({ productId, orderId: savedOrderId });
  if (existing) {
    await collection.updateOne(
      { id: existing.id },
      {
        $set: {
          rating: input.rating,
          productName: existing.productName || catalog?.name || '',
          productImage: existing.productImage || catalog?.images?.[0] || '',
        },
      }
    );
    const updated = await collection.findOne({ id: existing.id });
    if (updated?.status === 'approved' || !updated?.status) {
      await writeProductStats(await summarizeProduct(productId));
    }
    return { review: withoutMongoId(updated as StoredReview & Record<string, unknown>) as StoredReview };
  }

  let userId = (order?.userId || '').trim() || input.sessionUserId || `order:${savedOrderId}`;
  let userName = (order?.customerName || '').trim() || 'Customer';
  if (input.sessionUserId) {
    const author = await resolveReviewAuthor(input.sessionUserId);
    if (!('error' in author)) {
      userId = author.userId;
      userName = author.userName.trim() || userName;
    }
  }
  const meta = order
    ? productMetaFromOrder(order, productId)
    : { productName: catalog?.name || '', productImage: catalog?.images?.[0] || '' };

  return createReview({
    productId,
    productName: meta.productName,
    productImage: meta.productImage,
    userId,
    userName,
    rating: input.rating,
    title: '',
    reviewText: '',
    orderId: savedOrderId,
    isVerifiedPurchase: Boolean(order),
    media: [],
  });
}

export async function productWasPurchased(input: {
  productId: string;
  userId?: string;
  email?: string;
  orderId?: string;
}): Promise<{ purchased: boolean; orderId: string; alreadyReviewed: boolean }> {
  const eligible = await findEligiblePurchase(input);
  return eligible;
}

export async function findEligiblePurchase(input: {
  productId: string;
  userId?: string;
  email?: string;
  orderId?: string;
}): Promise<{ purchased: boolean; orderId: string; alreadyReviewed: boolean }> {
  const collection = await reviews();
  const productId = input.productId.trim();
  const userId = input.userId?.trim() || '';

  const already = async (orderId: string) => {
    if (!collection || !userId || !orderId) return false;
    return Boolean(await collection.findOne({ productId, userId, orderId }));
  };

  if (input.orderId) {
    const order = await findStoredOrder(input.orderId);
    if (order && orderHasProduct(order, productId) && customerOwnsOrder(order, input.userId, input.email)) {
      const orderId = order.orderId || order.id;
      return { purchased: true, orderId, alreadyReviewed: await already(orderId) };
    }
    return { purchased: false, orderId: '', alreadyReviewed: false };
  }

  const list = await listStoredOrders();
  const matches = list.filter((order) => {
    if (!orderHasProduct(order, productId)) return false;
    return customerOwnsOrder(order, input.userId, input.email);
  });
  for (const order of matches) {
    const orderId = order.orderId || order.id;
    if (!(await already(orderId))) return { purchased: true, orderId, alreadyReviewed: false };
  }
  if (matches.length) {
    const orderId = matches[0].orderId || matches[0].id;
    return { purchased: true, orderId, alreadyReviewed: true };
  }
  return { purchased: false, orderId: '', alreadyReviewed: false };
}

export async function listPendingReviewsForOrder(input: {
  orderId: string;
  userId: string;
  email?: string;
}): Promise<
  | { error: string; status: number }
  | {
      orderId: string;
      paymentConfirmed: boolean;
      items: Array<{ productId: string; name: string; image: string }>;
    }
> {
  const order = await findStoredOrder(input.orderId);
  if (!order || !customerOwnsOrder(order, input.userId, input.email)) {
    return { error: 'Order not found.', status: 404 };
  }
  const orderId = order.orderId || order.id;
  const paymentConfirmed = order.paymentStatus === 'paid';
  if (!isOrderConfirmed(order)) {
    return { orderId, paymentConfirmed, items: [] };
  }
  const collection = await reviews();
  const items: Array<{ productId: string; name: string; image: string }> = [];
  for (const product of uniqueOrderProducts(order)) {
    const existing =
      collection && input.userId
        ? await collection.findOne({ productId: product.productId, userId: input.userId, orderId })
        : null;
    if (!existing) items.push(product);
  }
  return { orderId, paymentConfirmed, items };
}

export async function summarizeProduct(productId: string): Promise<ReviewSummary> {
  const collection = await reviews();
  const breakdown = emptyBreakdown();
  if (!collection) return { productId, averageRating: 0, totalReviews: 0, breakdown };
  const docs = (await collection.find({ productId }).toArray()).filter(isApproved);
  docs.forEach((doc) => {
    const rating = doc.rating as 1 | 2 | 3 | 4 | 5;
    if (breakdown[rating] !== undefined) breakdown[rating] += 1;
  });
  const totalReviews = docs.length;
  const averageRating =
    totalReviews === 0 ? 0 : Math.round((docs.reduce((sum, doc) => sum + doc.rating, 0) / totalReviews) * 10) / 10;
  return { productId, averageRating, totalReviews, breakdown };
}

async function writeProductStats(summary: ReviewSummary) {
  const db = await getDb();
  if (!db) return;
  await db.collection('products').updateOne(
    { id: summary.productId },
    { $set: { averageRating: summary.averageRating, totalReviews: summary.totalReviews } }
  );
}

export async function listReviewSummaries(): Promise<ReviewSummary[]> {
  const collection = await reviews();
  if (!collection) return [];
  const productIds = await collection.distinct('productId');
  return Promise.all(productIds.map((productId) => summarizeProduct(String(productId))));
}

export async function listReviewsForProduct(productId: string, page = 1, limit = 5, voterId?: string) {
  const collection = await reviews();
  const summary = await summarizeProduct(productId);
  if (!collection) return { reviews: [], total: 0, page, limit, summary };
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(20, Math.max(1, limit));
  const docs = await collection.find({ productId }).sort({ createdAt: -1 }).toArray();
  const approved = docs
    .map((doc) => withoutMongoId(doc as StoredReview & Record<string, unknown>) as StoredReview)
    .filter(isApproved);
  const total = approved.length;
  const pageDocs = approved.slice((safePage - 1) * safeLimit, safePage * safeLimit);
  return {
    reviews: pageDocs.map((doc) => publicReview(doc, voterId)),
    total,
    page: safePage,
    limit: safeLimit,
    summary,
  };
}

export async function listAllReviewsForAdmin() {
  const collection = await reviews();
  if (!collection) return [];
  const docs = await collection.find({}).sort({ createdAt: -1 }).toArray();
  return docs.map((doc) => withoutMongoId(doc as StoredReview & Record<string, unknown>) as StoredReview);
}

function extForMime(mime: string) {
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  if (mime === 'image/gif') return 'gif';
  if (mime === 'video/webm') return 'webm';
  if (mime === 'video/mp4') return 'mp4';
  return 'jpg';
}

export async function saveReviewMedia(raw: unknown[]): Promise<ReviewMedia[] | { error: string; status: number }> {
  const items = Array.isArray(raw) ? raw : [];
  if (items.length > MAX_IMAGES + MAX_VIDEOS) {
    return { error: `You can attach up to ${MAX_IMAGES} photos and ${MAX_VIDEOS} video.`, status: 400 };
  }
  await fs.mkdir(MEDIA_DIR, { recursive: true });
  const saved: ReviewMedia[] = [];
  let videos = 0;
  let images = 0;
  for (const item of items) {
    const row = item as Record<string, unknown>;
    const dataUrl = typeof row.dataUrl === 'string' ? row.dataUrl : '';
    const match = dataUrl.match(/^data:(image\/(?:jpeg|jpg|png|webp|gif)|video\/(?:mp4|webm));base64,([A-Za-z0-9+/=\s]+)$/i);
    if (!match) return { error: 'Please upload JPEG, PNG, WebP, GIF, MP4, or WebM files only.', status: 400 };
    const mime = match[1].toLowerCase().replace('image/jpg', 'image/jpeg');
    const kind: ReviewMedia['kind'] = mime.startsWith('video/') ? 'video' : 'image';
    if (kind === 'video') videos += 1;
    else images += 1;
    if (images > MAX_IMAGES) return { error: `You can attach up to ${MAX_IMAGES} photos.`, status: 400 };
    if (videos > MAX_VIDEOS) return { error: `You can attach up to ${MAX_VIDEOS} video.`, status: 400 };
    const buffer = Buffer.from(match[2].replace(/\s/g, ''), 'base64');
    const max = kind === 'video' ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
    if (buffer.length > max) {
      return { error: kind === 'video' ? 'Video must be under 6MB.' : 'Each photo must be under 1.5MB.', status: 400 };
    }
    const filename = `${randomUUID()}.${extForMime(mime)}`;
    await fs.writeFile(path.join(MEDIA_DIR, filename), buffer);
    saved.push({ url: `/api/reviews/media/${filename}`, kind, mime });
  }
  return saved;
}

export async function readReviewMediaFile(filename: string) {
  if (!/^[a-f0-9-]+\.(jpg|jpeg|png|webp|gif|mp4|webm)$/i.test(filename)) return null;
  const filePath = path.join(MEDIA_DIR, filename);
  try {
    const data = await fs.readFile(filePath);
    const ext = path.extname(filename).toLowerCase();
    const mime =
      ext === '.png'
        ? 'image/png'
        : ext === '.webp'
          ? 'image/webp'
          : ext === '.gif'
            ? 'image/gif'
            : ext === '.mp4'
              ? 'video/mp4'
              : ext === '.webm'
                ? 'video/webm'
                : 'image/jpeg';
    return { data, mime };
  } catch {
    return null;
  }
}

export async function createReview(input: {
  productId: string;
  productName?: string;
  productImage?: string;
  userId: string;
  userName: string;
  rating: number;
  title: string;
  reviewText: string;
  orderId?: string;
  isVerifiedPurchase: boolean;
  media: ReviewMedia[];
}): Promise<{ review: StoredReview } | { error: string; status: number }> {
  const collection = await reviews();
  if (!collection) return { error: 'Database is unavailable.', status: 503 };
  const productId = input.productId.trim();
  const userId = input.userId.trim();
  const userName = input.userName.trim();
  const title = input.title.trim();
  const reviewText = input.reviewText.trim();
  if (!productId) return { error: 'Product is required.', status: 400 };
  if (!userId || !userName) return { error: 'Sign in to write a review.', status: 401 };
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
    return { error: 'Rating must be between 1 and 5.', status: 400 };
  }
  if (title && title.length < 3) return { error: 'Title must be at least 3 characters.', status: 400 };
  if (title.length > 120) return { error: 'Title is too long.', status: 400 };
  if (reviewText && reviewText.length < 8) return { error: 'Please write a short review (at least 8 characters).', status: 400 };
  if (reviewText.length > 2000) return { error: 'Review is too long.', status: 400 };

  const orderId = input.orderId?.trim() || '';
  if (orderId) {
    const existing = await collection.findOne({ productId, userId, orderId });
    if (existing) return { error: 'You have already reviewed this product for this order.', status: 409 };
  }

  const review: StoredReview = {
    id: randomUUID(),
    productId,
    productName: (input.productName || '').trim(),
    productImage: (input.productImage || '').trim(),
    userId,
    userName,
    rating: input.rating,
    title,
    reviewText,
    orderId,
    isVerifiedPurchase: input.isVerifiedPurchase,
    status: input.isVerifiedPurchase ? 'approved' : 'pending',
    media: input.media,
    helpfulCount: 0,
    helpfulVoterIds: [],
    createdAt: new Date().toISOString(),
  };

  try {
    await collection.insertOne({ ...review });
  } catch (error) {
    const code = (error as { code?: number }).code;
    if (code === 11000) return { error: 'You have already reviewed this product for this order.', status: 409 };
    throw error;
  }

  if (review.status === 'approved') {
    await writeProductStats(await summarizeProduct(productId));
  }

  return { review };
}

export async function markReviewHelpful(reviewId: string, userId: string) {
  const collection = await reviews();
  if (!collection) return { error: 'Database is unavailable.', status: 503 as const };
  const current = await collection.findOne({ id: reviewId });
  if (!current || !isApproved(current)) return { error: 'Review not found.', status: 404 as const };
  const voters = current.helpfulVoterIds || [];
  if (voters.includes(userId)) return { error: 'You already marked this review as helpful.', status: 409 as const };
  const helpfulCount = (current.helpfulCount || 0) + 1;
  await collection.updateOne(
    { id: reviewId },
    { $set: { helpfulCount, helpfulVoterIds: [...voters, userId] } }
  );
  return { helpfulCount, helpfulByMe: true };
}

export async function moderateReview(id: string, status: ReviewStatus) {
  const collection = await reviews();
  if (!collection) return { error: 'Database is unavailable.', status: 503 as const };
  if (status !== 'approved' && status !== 'rejected' && status !== 'pending') {
    return { error: 'Invalid status.', status: 400 as const };
  }
  const current = await collection.findOne({ id });
  if (!current) return { error: 'Review not found.', status: 404 as const };
  await collection.updateOne({ id }, { $set: { status } });
  await writeProductStats(await summarizeProduct(current.productId));
  const next = await collection.findOne({ id });
  return { review: withoutMongoId(next as StoredReview & Record<string, unknown>) as StoredReview };
}

export async function resolveReviewAuthor(sessionUserId?: string) {
  if (!sessionUserId) return { error: 'Sign in to write a review.', status: 401 as const };
  const user = await findUserById(sessionUserId);
  if (!user) return { error: 'Sign in to write a review.', status: 401 as const };
  return { userId: user.id, userName: user.fullName, email: user.email };
}
