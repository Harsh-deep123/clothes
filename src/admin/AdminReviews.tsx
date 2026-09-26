import React, { useEffect, useMemo, useState } from 'react';
import { Star } from 'lucide-react';
import { adminListReviews, adminModerateReview, type ProductReview } from '../lib/reviewsApi';

function statusClass(status?: string) {
  if (status === 'approved') return 'bg-emerald-50 text-emerald-800';
  if (status === 'rejected') return 'bg-rose-50 text-rose-800';
  return 'bg-amber-50 text-amber-800';
}

function AdminStars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} stars`}>
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          key={value}
          className="w-4 h-4"
          color="#D4AF37"
          fill={value <= rating ? '#D4AF37' : 'transparent'}
          strokeWidth={1.5}
        />
      ))}
    </span>
  );
}

export const AdminReviews: React.FC<{ notify?: (message: string, type: 'success' | 'error') => void }> = ({
  notify,
}) => {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [productFilter, setProductFilter] = useState('all');

  const load = async (silent = false) => {
    try {
      if (!silent) setError(null);
      setReviews(await adminListReviews());
    } catch (err) {
      if (!silent) setError(err instanceof Error ? err.message : 'Could not load reviews.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(true), 5000);
    return () => window.clearInterval(timer);
  }, []);

  const products = useMemo(() => {
    const map = new Map<string, string>();
    reviews.forEach((review) => {
      map.set(review.productId, review.productName || review.productId);
    });
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [reviews]);

  const visible = productFilter === 'all' ? reviews : reviews.filter((review) => review.productId === productFilter);

  if (loading) return <p className="text-sm text-slate-500">Loading reviews…</p>;
  if (error) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <p className="text-sm text-rose-600">{error}</p>
        <button type="button" className="mt-3 text-sm underline" onClick={() => void load()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="text-sm text-slate-500">Ratings saved in MongoDB. New ratings appear here automatically.</p>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className="text-sm underline text-slate-600" onClick={() => void load()}>
            Refresh
          </button>
          {products.length > 0 && (
            <label className="text-sm text-slate-600">
              Product
              <select
                className="ml-2 border border-slate-200 rounded-lg text-sm px-2 py-1 bg-white"
                value={productFilter}
                onChange={(e) => setProductFilter(e.target.value)}
              >
                <option value="all">All products</option>
                {products.map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      </div>
      {visible.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <p className="text-sm text-slate-500">No product reviews yet.</p>
        </div>
      ) : (
        visible.map((review) => (
          <article key={review.id} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
            <div className="flex gap-4">
              {review.productImage ? (
                <img
                  src={review.productImage}
                  alt=""
                  className="w-16 h-20 object-cover rounded-lg bg-slate-100 border border-slate-200 shrink-0"
                />
              ) : (
                <div className="w-16 h-20 rounded-lg bg-slate-100 border border-slate-200 shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-400">{review.orderId || 'No order ID'}</p>
                    <h3 className="text-lg font-semibold">{review.productName || review.productId}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <AdminStars rating={review.rating} />
                      <span className="text-sm font-medium text-slate-700">{review.rating}/5</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {review.userName} · {new Date(review.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold uppercase px-2 py-1 rounded-lg ${statusClass(review.status)}`}>
                    {review.status || 'approved'}
                  </span>
                </div>
              </div>
            </div>
            {review.reviewText ? <p className="text-sm text-slate-700">{review.reviewText}</p> : null}
            {review.isVerifiedPurchase && <p className="text-xs text-slate-500">Verified purchase</p>}
            <select
              className="border border-slate-200 rounded-lg text-sm px-2 py-1 bg-white"
              value={review.status || 'pending'}
              onChange={async (e) => {
                const status = e.target.value as 'pending' | 'approved' | 'rejected';
                try {
                  const updated = await adminModerateReview(review.id, status);
                  setReviews((prev) => prev.map((item) => (item.id === review.id ? { ...item, ...updated } : item)));
                  notify?.(`Review ${status}.`, 'success');
                } catch (err) {
                  notify?.(err instanceof Error ? err.message : 'Could not update review.', 'error');
                }
              }}
            >
              <option value="pending">pending</option>
              <option value="approved">approved</option>
              <option value="rejected">rejected</option>
            </select>
          </article>
        ))
      )}
    </div>
  );
};
