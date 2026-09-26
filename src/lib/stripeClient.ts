import '@stripe/stripe-js';
import { loadStripe, type Stripe } from '@stripe/stripe-js';

const stripeByKey = new Map<string, Promise<Stripe | null>>();

export function loadStripeForKey(publishableKey: string) {
  const key = publishableKey.trim();
  if (!key.startsWith('pk_test_') && !key.startsWith('pk_live_')) {
    return Promise.resolve(null);
  }
  let pending = stripeByKey.get(key);
  if (!pending) {
    pending = loadStripe(key);
    stripeByKey.set(key, pending);
  }
  return pending;
}
