const promptKey = (orderId: string) => `zayro_review_prompt_${orderId}`;

export function getDismissedReviewPrompts(orderId: string): string[] {
  try {
    const raw = sessionStorage.getItem(promptKey(orderId));
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

export function dismissReviewPrompt(orderId: string, productId: string) {
  const next = new Set(getDismissedReviewPrompts(orderId));
  next.add(productId);
  try {
    sessionStorage.setItem(promptKey(orderId), JSON.stringify([...next]));
  } catch {
    /* ignore quota */
  }
}

export function dismissRemainingReviewPrompts(orderId: string, productIds: string[]) {
  productIds.forEach((productId) => dismissReviewPrompt(orderId, productId));
}
