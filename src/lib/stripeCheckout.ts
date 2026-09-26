export async function fetchStripeConfig() {
  const response = await fetch('/api/stripe/config', { headers: { Accept: 'application/json' } });
  const data = (await response.json()) as { publishableKey?: string; configured?: boolean; error?: string };
  if (!response.ok) throw new Error(data.error || 'Could not load Stripe.');
  return data;
}

export async function createStripePaymentIntent(amount: number, email: string) {
  const response = await fetch('/api/stripe/create-payment-intent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ amount, email }),
  });
  const data = (await response.json()) as { clientSecret?: string; paymentIntentId?: string; error?: string };
  if (!response.ok || !data.clientSecret || !data.paymentIntentId) {
    throw new Error(data.error || 'Could not start card payment.');
  }
  return data;
}
