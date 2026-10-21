import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Star, X } from 'lucide-react';
import { submitProductReview } from '../../lib/reviewsApi';
import { getAuthToken } from '../../lib/shopApi';

const inputClass =
  'w-full border border-[#cfc4c5] bg-white px-4 py-3 text-sm focus:border-black focus:outline-none';
const labelClass = 'text-xs uppercase tracking-[0.15em] font-semibold text-black mb-2 block';
const btnClass =
  'w-full bg-black text-white text-xs font-semibold uppercase py-4 tracking-[0.2em] hover:bg-neutral-800 transition-colors cursor-pointer active:scale-[0.99] disabled:opacity-40';

interface WriteReviewModalProps {
  productId: string;
  productName: string;
  onClose: () => void;
  onSubmitted: (message: string) => void;
  onRequestSignIn?: () => void;
}

export const WriteReviewModal: React.FC<WriteReviewModalProps> = ({
  productId,
  productName,
  onClose,
  onSubmitted,
  onRequestSignIn,
}) => {
  const [isLoggedIn, setIsLoggedIn] = useState(() => Boolean(getAuthToken()));
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setIsLoggedIn(Boolean(getAuthToken()));
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!getAuthToken()) {
      setIsLoggedIn(false);
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

  const modal = (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="write-review-title"
        className="relative bg-white w-full max-w-md max-h-[92vh] overflow-y-auto shadow-2xl border border-[#cfc4c5]/30 z-10 p-6 sm:p-10 my-auto"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-black hover:opacity-60 transition-opacity cursor-pointer"
          aria-label="Close review form"
        >
          <X className="w-5 h-5" />
        </button>
        <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#5d5f5f] block mb-3">
          Review
        </span>
        <h2 id="write-review-title" className="font-serif-luxury text-2xl tracking-tight text-black font-normal mb-2">
          Write a Review
        </h2>
        <p className="text-sm text-[#5d5f5f] font-light mb-8">{productName}</p>
        {!isLoggedIn ? (
          <div className="space-y-5">
            <p className="text-sm text-[#5d5f5f] font-light leading-relaxed">
              Sign in with the account you used to buy this product. Only confirmed purchases can leave a review.
            </p>
            {error && <p className="text-sm text-[#ba1a1a]">{error}</p>}
            <button
              type="button"
              className={btnClass}
              onClick={() => {
                sessionStorage.setItem('zayro_open_review', productId);
                onRequestSignIn?.();
                onClose();
              }}
            >
              Sign In to Review
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-5">
            <p className="text-xs text-[#5d5f5f] font-light">
              Reviews are for customers who purchased this product.
            </p>
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

  if (typeof document === 'undefined') return null;
  return createPortal(modal, document.body);
};
