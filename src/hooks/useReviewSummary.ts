import { useEffect, useState } from 'react';
import {
  getReviewSummary,
  loadReviewSummaries,
  subscribeReviewSummaries,
  type ReviewSummary,
} from '../lib/reviewsApi';

export function useReviewSummary(productId: string): ReviewSummary | undefined {
  const [summary, setSummary] = useState(() => getReviewSummary(productId));

  useEffect(() => {
    const sync = () => setSummary(getReviewSummary(productId));
    const unsubscribe = subscribeReviewSummaries(sync);
    void loadReviewSummaries();
    sync();
    return unsubscribe;
  }, [productId]);

  return summary;
}
