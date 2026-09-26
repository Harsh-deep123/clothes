import React, { useEffect, useState } from 'react';
import { Star, X } from 'lucide-react';
import { loadReviewSummaries, submitProductReview, type PendingReviewItem } from '../../lib/reviewsApi';
import { useReviewSummary } from '../../hooks/useReviewSummary';

const GOLD = '#D4AF37';

interface PostPurchaseReviewPopupProps {
  orderId: string;
  items: PendingReviewItem[];
  onSkipProduct: (productId: string) => void;
  onCloseRemaining: (remainingProductIds: string[]) => void;
}

export const PostPurchaseReviewPopup: React.FC<PostPurchaseReviewPopupProps> = ({
  orderId,
  items,
  onSkipProduct,
  onCloseRemaining,
}) => {
  const [queue, setQueue] = useState(items);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const current = queue[0];
  const summary = useReviewSummary(current?.productId || '');
  const displayRating = hoverRating || rating;
  const average = summary?.averageRating || 0;
  const total = summary?.totalReviews || 0;

  useEffect(() => {
    setQueue(items);
  }, [items]);

  const finishOrNext = (nextQueue: PendingReviewItem[]) => {
    if (nextQueue.length === 0) {
      onCloseRemaining([]);
      return;
    }
    setRating(0);
    setHoverRating(0);
    setError(null);
    setQueue(nextQueue);
  };

  const closeAll = () => {
    onCloseRemaining(queue.map((item) => item.productId));
  };

  const submitRating = async (value = rating) => {
    if (!current || submitting) return;
    if (value < 1 || value > 5) {
      setError('Please select a star rating.');
      return;
    }
    setRating(value);
    setSubmitting(true);
    setError(null);
    try {
      await submitProductReview({
        productId: current.productId,
        rating: value,
        title: '',
        reviewText: '',
        orderId,
      });
      await loadReviewSummaries(true);
      onSkipProduct(current.productId);
      finishOrNext(queue.slice(1));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit rating.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!current) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div
        onClick={closeAll}
        className="fixed inset-0 bg-[#111827]/50 backdrop-blur-md transition-opacity cursor-pointer"
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Rate ${current.name}`}
        className="relative z-10 my-auto w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white shadow-[0_25px_50px_-12px_rgba(17,24,39,0.28)] cursor-default"
      >
        <button
          type="button"
          onClick={closeAll}
          className="absolute top-4 right-4 z-20 p-2 text-[#111827] cursor-pointer hover:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111827] transition-opacity"
          aria-label="Close rating popup"
          title="Close"
        >
          <X className="w-5 h-5 pointer-events-none" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          <div className="flex flex-col items-center justify-center bg-[#F5F5F4] p-6 sm:p-8 rounded-t-2xl md:rounded-l-2xl md:rounded-tr-none">
            {current.image ? (
              <img
                src={current.image}
                alt={current.name}
                className="w-full max-w-[240px] aspect-[3/4] object-cover bg-[#eeeeee] cursor-default select-none"
                draggable={false}
              />
            ) : (
              <div className="w-full max-w-[240px] aspect-[3/4] bg-[#eeeeee] cursor-default" />
            )}
            <h3 className="mt-5 font-serif-luxury text-lg sm:text-xl text-[#111827] text-center font-normal tracking-tight">
              {current.name}
            </h3>
          </div>

          <div className="flex flex-col justify-center p-6 sm:p-10">
            <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#6B7280] mb-3">
              Average rating:{' '}
              {total > 0 ? (
                <span className="text-[#111827]">
                  {average.toFixed(1)}/5 (from {total} review{total === 1 ? '' : 's'})
                </span>
              ) : (
                <span className="text-[#111827]">No reviews yet</span>
              )}
            </p>

            <div
              className="flex gap-1.5 mb-8"
              role="radiogroup"
              aria-label="Star rating"
              onMouseLeave={() => setHoverRating(0)}
            >
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={rating === value}
                  disabled={submitting}
                  onClick={() => void submitRating(value)}
                  onMouseEnter={() => setHoverRating(value)}
                  onFocus={() => setHoverRating(value)}
                  className="p-1 cursor-pointer hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111827] disabled:cursor-wait disabled:opacity-40 disabled:hover:scale-100 transition-transform"
                  aria-label={`Rate ${value} star${value === 1 ? '' : 's'}`}
                  title={`${value} star${value === 1 ? '' : 's'}`}
                >
                  <Star
                    className="w-8 h-8 pointer-events-none transition-colors"
                    color={GOLD}
                    strokeWidth={1.5}
                    fill={value <= displayRating ? GOLD : 'transparent'}
                  />
                </button>
              ))}
            </div>

            {error && <p className="text-sm text-[#ba1a1a] mb-4">{error}</p>}

            <button
              type="button"
              disabled={submitting}
              onClick={() => void submitRating()}
              className="w-full bg-[#111827] text-white text-xs font-semibold uppercase tracking-[0.2em] py-4 hover:bg-black transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-wait"
            >
              {submitting ? 'Saving…' : 'Rate Your Purchase'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
