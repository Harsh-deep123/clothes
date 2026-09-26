import { getAuthToken } from './shopApi';
import { getAdminToken } from '../adminAuth';

export type ReviewSummary = {
  productId: string;
  averageRating: number;
  totalReviews: number;
  breakdown: Record<1 | 2 | 3 | 4 | 5, number>;
};

export type ReviewMedia = {
  url: string;
  kind: 'image' | 'video';
  mime: string;
};

export type ProductReview = {
  id: string;
  productId: string;
  productName?: string;
  productImage?: string;
  userId?: string;
  userName: string;
  rating: number;
  title?: string;
  reviewText: string;
  orderId?: string;
  isVerifiedPurchase: boolean;
  status?: 'pending' | 'approved' | 'rejected';
  media?: ReviewMedia[];
  helpfulCount?: number;
  helpfulByMe?: boolean;
  createdAt: string;
};

type Listener = () => void;
const listeners = new Set<Listener>();
let summaries: Record<string, ReviewSummary> = {};
let loaded = false;
let loading: Promise<void> | null = null;

function notify() {
  listeners.forEach((fn) => fn());
}

function authHeaders() {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export function subscribeReviewSummaries(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getReviewSummary(productId: string): ReviewSummary | undefined {
  return summaries[productId];
}

export async function loadReviewSummaries(force = false) {
  if (loaded && !force) return;
  if (loading) return loading;
  loading = (async () => {
    try {
      const response = await fetch('/api/reviews/summaries', { headers: { Accept: 'application/json' } });
      const data = (await response.json()) as { summaries?: ReviewSummary[] };
      const next: Record<string, ReviewSummary> = {};
      (data.summaries || []).forEach((item) => {
        next[item.productId] = item;
      });
      summaries = next;
      loaded = true;
      notify();
    } catch {
      /* keep previous cache */
    } finally {
      loading = null;
    }
  })();
  return loading;
}

export async function fetchProductReviews(productId: string, page = 1, limit = 5) {
  const response = await fetch(
    `/api/reviews/${encodeURIComponent(productId)}?page=${page}&limit=${limit}`,
    { headers: authHeaders() }
  );
  const data = (await response.json()) as {
    reviews?: ProductReview[];
    total?: number;
    page?: number;
    limit?: number;
    summary?: ReviewSummary;
    error?: string;
  };
  if (!response.ok) throw new Error(data.error || 'Could not load reviews.');
  if (data.summary) {
    summaries = { ...summaries, [productId]: data.summary };
    notify();
  }
  return {
    reviews: data.reviews || [],
    total: data.total || 0,
    page: data.page || page,
    limit: data.limit || limit,
    summary: data.summary,
  };
}

export async function submitProductReview(input: {
  productId: string;
  rating: number;
  title: string;
  reviewText: string;
  orderId?: string;
  media?: Array<{ dataUrl: string }>;
}) {
  const response = await fetch('/api/reviews', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
  const data = (await response.json()) as { review?: ProductReview; message?: string; error?: string };
  if (!response.ok || !data.review) throw new Error(data.error || 'Could not submit review.');
  return data;
}

export type PendingReviewItem = {
  productId: string;
  name: string;
  image: string;
};

export async function fetchPendingReviews(orderId: string) {
  const response = await fetch(`/api/reviews/pending?orderId=${encodeURIComponent(orderId)}`, {
    headers: authHeaders(),
  });
  const data = (await response.json()) as {
    orderId?: string;
    paymentConfirmed?: boolean;
    items?: PendingReviewItem[];
    error?: string;
  };
  if (!response.ok) throw new Error(data.error || 'Could not load review prompts.');
  return {
    orderId: data.orderId || orderId,
    paymentConfirmed: Boolean(data.paymentConfirmed),
    items: data.items || [],
  };
}

export async function markReviewHelpful(reviewId: string) {
  const response = await fetch(`/api/reviews/${encodeURIComponent(reviewId)}/helpful`, {
    method: 'POST',
    headers: authHeaders(),
  });
  const data = (await response.json()) as { helpfulCount?: number; helpfulByMe?: boolean; error?: string };
  if (!response.ok) throw new Error(data.error || 'Could not mark as helpful.');
  return data;
}

export async function adminListReviews() {
  const token = getAdminToken();
  const response = await fetch('/api/admin/reviews', {
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const data = (await response.json()) as { reviews?: ProductReview[]; error?: string };
  if (!response.ok) throw new Error(data.error || 'Could not load reviews.');
  return data.reviews || [];
}

export async function adminModerateReview(id: string, status: 'pending' | 'approved' | 'rejected') {
  const token = getAdminToken();
  const response = await fetch(`/api/admin/reviews/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ status }),
  });
  const data = (await response.json()) as { review?: ProductReview; error?: string };
  if (!response.ok || !data.review) throw new Error(data.error || 'Could not update review.');
  return data.review;
}
