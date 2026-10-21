export type StripeCheckoutItem = {
  name: string;
  quantity: number;
  price: number;
};

export async function fetchStripeConfig() {
  const response = await fetch('/api/stripe/config', { headers: { Accept: 'application/json' } });
  const data = (await response.json()) as { publishableKey?: string; configured?: boolean; error?: string };
  if (!response.ok) throw new Error(data.error || 'Could not load Stripe.');
  return data;
}

export async function createStripePaymentIntent(
  amount: number,
  email: string,
  options?: {
    method?: 'card' | 'upi';
    preferredApp?: string;
    items?: StripeCheckoutItem[];
  },
) {
  const response = await fetch('/api/stripe/create-payment-intent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      amount,
      email,
      method: options?.method || 'card',
      preferredApp: options?.preferredApp || '',
      items: options?.items || [],
    }),
  });
  const data = (await response.json()) as { clientSecret?: string; paymentIntentId?: string; error?: string };
  if (!response.ok || !data.clientSecret || !data.paymentIntentId) {
    throw new Error(data.error || 'Could not start payment.');
  }
  return data;
}

export async function verifyStripePayment(paymentIntentId: string, amount: number) {
  const response = await fetch('/api/stripe/verify-payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ paymentIntentId, amount }),
  });
  const data = (await response.json()) as { paid?: boolean; status?: string; error?: string };
  if (!response.ok) throw new Error(data.error || 'Could not verify payment.');
  return { paid: Boolean(data.paid), status: data.status || 'unknown' };
}
