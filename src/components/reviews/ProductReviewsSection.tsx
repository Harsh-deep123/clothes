import React, { useEffect, useState } from 'react';
import { StarRow } from '../ProductRatingSummary';
import {
  fetchProductReviews,
  loadReviewSummaries,
  markReviewHelpful,
  type ProductReview,
  type ReviewSummary,
} from '../../lib/reviewsApi';
import { getAuthToken } from '../../lib/shopApi';
import { WriteReviewModal } from './WriteReviewModal';

const emptyBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

interface ProductReviewsSectionProps {
  productId: string;
  productName: string;
  productImage?: string;
}

export const ProductReviewsSection: React.FC<ProductReviewsSectionProps> = ({
  productId,
  productName,
  productImage,
}) => {
  const [page, setPage] = useState(1);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(5);
  const [summary, setSummary] = useState<ReviewSummary | undefined>();
  const [loading, setLoading] = useState(true);
  const [writeOpen, setWriteOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [voteError, setVoteError] = useState<string | null>(null);

  const load = async (nextPage = 1, append = false) => {
    setLoading(true);
    try {
      const data = await fetchProductReviews(productId, nextPage, 5);
      setReviews((prev) => (append ? [...prev, ...data.reviews] : data.reviews));
      setTotal(data.total);
      setLimit(data.limit);
      setPage(data.page);
      setSummary(data.summary);
    } catch {
      if (!append) setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setNotice(null);
    void load(1, false);
  }, [productId]);

  const breakdown = summary?.breakdown || emptyBreakdown;
  const totalReviews = summary?.totalReviews || 0;
  const loggedIn = Boolean(getAuthToken());

  return (
    <section id="customer-reviews" className="mt-24 md:mt-32 pt-16 border-t border-[#cfc4c5]/30">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
        <h2 className="font-serif-luxury text-3xl md:text-4xl text-black font-normal">Customer Reviews</h2>
        <button
          type="button"
          onClick={() => setWriteOpen(true)}
          className="text-xs font-semibold uppercase tracking-[0.2em] bg-black text-white px-8 py-4 hover:bg-neutral-800 cursor-pointer"
        >
          Write a Review
        </button>
      </div>

      {notice && <p className="text-sm text-[#5d5f5f] mb-6">{notice}</p>}

      {totalReviews === 0 ? (
        <p className="text-sm text-[#5d5f5f] font-light mb-8">No reviews yet</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 mb-12">
          <div className="md:col-span-4">
            <p className="text-4xl font-medium text-black mb-2">{summary?.averageRating.toFixed(1)}</p>
            <p className="text-sm text-[#5d5f5f] mb-2">out of 5</p>
            <StarRow rating={summary?.averageRating || 0} size="w-4 h-4" />
            <p className="text-xs text-[#5d5f5f] mt-2 uppercase tracking-[0.15em]">
              {totalReviews} rating{totalReviews === 1 ? '' : 's'}
            </p>
          </div>
          <div className="md:col-span-8 space-y-2">
            {([5, 4, 3, 2, 1] as const).map((star) => {
              const count = breakdown[star] || 0;
              const width = totalReviews ? Math.round((count / totalReviews) * 100) : 0;
              return (
                <div key={star} className="flex items-center gap-3 text-xs text-[#5d5f5f]">
                  <span className="w-12">{star} star</span>
                  <div className="flex-1 h-1.5 bg-[#eeeeee]">
                    <div className="h-full bg-black" style={{ width: `${width}%` }} />
                  </div>
                  <span className="w-10 text-right">{width}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {loading && reviews.length === 0 ? (
        <p className="text-sm text-[#5d5f5f]">Loading reviews…</p>
      ) : (
        <div className="space-y-8">
          {reviews.map((review) => (
            <article key={review.id} className="border-b border-[#cfc4c5]/30 pb-8">
              <div className="flex gap-4">
                {productImage ? (
                  <img
                    src={productImage}
                    alt=""
                    className="w-20 h-24 object-cover bg-[#eeeeee] border border-[#cfc4c5]/30 shrink-0"
                  />
                ) : null}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <p className="text-sm font-medium text-black">{review.userName}</p>
                    <p className="text-xs text-[#5d5f5f] uppercase tracking-[0.15em]">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <StarRow rating={review.rating} />
                  {review.title ? <h3 className="text-sm font-medium text-black mt-3">{review.title}</h3> : null}
                  {review.isVerifiedPurchase && (
                    <p className="text-[11px] uppercase tracking-[0.15em] text-[#5d5f5f] mt-2">Verified Purchase</p>
                  )}
                  {review.reviewText ? (
                    <p className="text-sm text-[#5d5f5f] font-light mt-3 leading-relaxed">{review.reviewText}</p>
                  ) : null}
              {review.media && review.media.length > 0 && (
                <div className="flex flex-wrap gap-3 mt-4">
                  {review.media.map((item) =>
                    item.kind === 'video' ? (
                      <video
                        key={item.url}
                        src={item.url}
                        controls
                        className="w-40 h-28 object-cover bg-[#eeeeee] border border-[#cfc4c5]/30"
                      />
                    ) : (
                      <img
                        key={item.url}
                        src={item.url}
                        alt=""
                        className="w-24 h-24 object-cover bg-[#eeeeee] border border-[#cfc4c5]/30"
                      />
                    )
                  )}
                </div>
              )}
              <button
                type="button"
                className="mt-4 text-xs uppercase tracking-[0.15em] text-[#5d5f5f] hover:text-black cursor-pointer disabled:opacity-40"
                disabled={review.helpfulByMe}
                onClick={async () => {
                  setVoteError(null);
                  try {
                    const result = await markReviewHelpful(review.id);
                    setReviews((prev) =>
                      prev.map((item) =>
                        item.id === review.id
                          ? { ...item, helpfulCount: result.helpfulCount, helpfulByMe: true }
                          : item
                      )
                    );
                  } catch (err) {
                    setVoteError(err instanceof Error ? err.message : 'Could not mark as helpful.');
                  }
                }}
              >
                Helpful{typeof review.helpfulCount === 'number' && review.helpfulCount > 0 ? ` (${review.helpfulCount})` : ''}
              </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {voteError && <p className="text-sm text-[#ba1a1a] mt-4">{voteError}</p>}

      {reviews.length < total && (
        <button
          type="button"
          disabled={loading}
          onClick={() => void load(page + 1, true)}
          className="mt-10 text-xs font-semibold uppercase tracking-[0.2em] border border-black text-black px-8 py-4 hover:bg-[#eeeeee] cursor-pointer disabled:opacity-40"
        >
          {loading ? 'Loading…' : 'Load More'}
        </button>
      )}

      {writeOpen && (
        <WriteReviewModal
          productId={productId}
          productName={productName}
          isLoggedIn={loggedIn}
          onClose={() => setWriteOpen(false)}
          onSubmitted={(message) => {
            setWriteOpen(false);
            setNotice(message);
            void loadReviewSummaries(true);
            void load(1, false);
          }}
        />
      )}
    </section>
  );
};
