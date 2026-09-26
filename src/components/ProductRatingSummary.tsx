import React from 'react';
import { Star } from 'lucide-react';
import { useReviewSummary } from '../hooks/useReviewSummary';

export const StarRow: React.FC<{ rating: number; size?: string }> = ({ rating, size = 'w-3.5 h-3.5' }) => (
  <span className="inline-flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
    {[1, 2, 3, 4, 5].map((value) => (
      <Star
        key={value}
        className={size}
        fill={value <= Math.round(rating) ? '#1a1c1c' : 'transparent'}
        color="#1a1c1c"
        strokeWidth={1.5}
      />
    ))}
  </span>
);

export const ProductRatingSummary: React.FC<{
  productId: string;
  className?: string;
  showEmpty?: boolean;
  linkToReviews?: boolean;
}> = ({ productId, className = 'mt-2', showEmpty = false, linkToReviews = false }) => {
  const summary = useReviewSummary(productId);
  const total = summary?.totalReviews || 0;
  if (total <= 0 && !showEmpty) return null;
  const content = (
    <>
      <StarRow rating={summary?.averageRating || 0} />
      {total > 0 ? (
        <>
          <span className="text-black font-medium">{(summary?.averageRating || 0).toFixed(1)}</span>
          <span>
            ({total} review{total === 1 ? '' : 's'})
          </span>
        </>
      ) : (
        <span>No reviews yet</span>
      )}
    </>
  );
  const shared = `flex items-center gap-1.5 text-[11px] text-[#5d5f5f] ${className}`;
  if (linkToReviews) {
    return (
      <a href="#customer-reviews" className={`${shared} hover:text-black`}>
        {content}
      </a>
    );
  }
  return <p className={shared}>{content}</p>;
};
