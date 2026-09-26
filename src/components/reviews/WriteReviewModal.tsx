import React, { useState } from 'react';
import { Star, X } from 'lucide-react';
import { submitProductReview } from '../../lib/reviewsApi';

const inputClass =
  'w-full border border-[#cfc4c5] bg-white px-4 py-3 text-sm focus:border-black focus:outline-none';
const labelClass = 'text-xs uppercase tracking-[0.15em] font-semibold text-black mb-2 block';
const btnClass =
  'w-full bg-black text-white text-xs font-semibold uppercase py-4 tracking-[0.2em] hover:bg-neutral-800 transition-colors cursor-pointer active:scale-[0.99]';

interface WriteReviewModalProps {
  productId: string;
  productName: string;
  isLoggedIn: boolean;
  onClose: () => void;
  onSubmitted: (message: string) => void;
}

export const WriteReviewModal: React.FC<WriteReviewModalProps> = ({
  productId,
  productName,
  isLoggedIn,
  onClose,
  onSubmitted,
}) => {
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      setError('Sign in to write a review.');
      return;
    }
    if (rating < 1 || rating > 5) {
      setError('Please select a star rating.');
      return;
    }
    if (reviewText.trim().length < 8) {
      setError('Please write a short review (at least 8 characters).');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const result = await submitProductReview({
        productId,
        rating,
        title: '',
        reviewText: reviewText.trim(),
      });
      onSubmitted(result.message || 'Thank you. Your review will appear after it is approved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative bg-white w-full max-w-md max-h-[92vh] overflow-y-auto shadow-2xl border border-[#cfc4c5]/30 z-10 p-6 sm:p-10 my-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-black hover:opacity-60 transition-opacity"
          aria-label="Close review form"
        >
          <X className="w-5 h-5" />
        </button>
        <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#5d5f5f] block mb-3">
          Review
        </span>
        <h2 className="font-serif-luxury text-2xl tracking-tight text-black font-normal mb-2">Write a Review</h2>
        <p className="text-sm text-[#5d5f5f] font-light mb-8">{productName}</p>
        {!isLoggedIn ? (
          <p className="text-sm text-[#5d5f5f] font-light">Sign in to write a product review.</p>
        ) : (
          <form onSubmit={submit} className="space-y-5">
            <div>
              <p className={labelClass}>Rating</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating(value)}
                    className="cursor-pointer"
                    aria-label={`${value} stars`}
                  >
                    <Star
                      className="w-6 h-6"
                      color="#1a1c1c"
                      strokeWidth={1.5}
                      fill={value <= rating ? '#1a1c1c' : 'transparent'}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={labelClass} htmlFor="review-text">
                Your Review
              </label>
              <textarea
                id="review-text"
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                className={`${inputClass} min-h-28`}
                required
              />
            </div>
            {error && <p className="text-sm text-[#ba1a1a]">{error}</p>}
            <button type="submit" disabled={submitting} className={btnClass}>
              {submitting ? 'Please wait…' : 'Submit Review'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
