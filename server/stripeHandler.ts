import type { IncomingMessage, ServerResponse } from 'http';
import Stripe from 'stripe';

function json(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function cleanKey(value: string) {
  return value.trim().replace(/^['"]|['"]$/g, '');
}

function isSecretKey(value: string) {
  return /^(sk_test_|sk_live_|rk_test_|rk_live_)/.test(value);
}

function isPublishableKey(value: string) {
  return /^(pk_test_|pk_live_)/.test(value);
}

function publicStripeError(error: unknown) {
  const message = error instanceof Error ? error.message : 'Stripe error';
  if (/invalid api key/i.test(message) || /no api key/i.test(message)) {
    return 'Stripe keys are invalid. In Stripe → Developers → API keys, click Reveal on the Secret key and copy the full sk_test_ value. Copy the Publishable key that starts with pk_test_. Put both in .env and restart the server.';
  }
  return message
    .replace(/sk_(test|live)_[A-Za-z0-9]+/g, 'sk_***')
    .replace(/pk_(test|live)_[A-Za-z0-9]+/g, 'pk_***');
}

function stripeClient() {
  const secret = cleanKey(process.env.STRIPE_SECRET_KEY || '');
  if (!secret || !isSecretKey(secret)) return null;
  return new Stripe(secret, { apiVersion: '2026-08-26.dahlia' });
}

export function amountToPaise(rupees: number) {
  return Math.round((Number(rupees) || 0) * 100);
}

export function isStripeApi(urlPath: string) {
  return urlPath.startsWith('/api/stripe');
}

export async function verifyPaidIntent(paymentIntentId: string, expectedRupees: number) {
  const stripe = stripeClient();
  if (!stripe) throw new Error('Stripe is not configured.');
  const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
  if (intent.status !== 'succeeded') throw new Error('Stripe payment is not complete.');
  const expected = amountToPaise(expectedRupees);
  if (intent.amount !== expected || intent.currency !== 'inr') {
    throw new Error('Paid amount does not match this order.');
  }
  return intent;
}

export async function handleStripeApi(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const url = (req.url || '').split('?')[0];
    const method = (req.method || 'GET').toUpperCase();
    const publishable = cleanKey(process.env.STRIPE_PUBLISHABLE_KEY || '');
    const secret = cleanKey(process.env.STRIPE_SECRET_KEY || '');

    if (url === '/api/stripe/config' && method === 'GET') {
      json(res, 200, {
        publishableKey: isPublishableKey(publishable) ? publishable : '',
        configured: Boolean(stripeClient() && isPublishableKey(publishable)),
      });
      return;
    }

    if (url === '/api/stripe/create-payment-intent' && method === 'POST') {
      const stripe = stripeClient();
      if (secret && !isSecretKey(secret)) {
        json(res, 400, {
          error:
            'STRIPE_SECRET_KEY must start with sk_test_. The mk_… value is a dashboard ID. Click Reveal and copy the full secret key.',
        });
        return;
      }
      if (publishable && !isPublishableKey(publishable)) {
        json(res, 400, {
          error:
            'STRIPE_PUBLISHABLE_KEY must start with pk_test_. Copy the Publishable key, not the mk_… ID.',
        });
        return;
      }
      if (!stripe || !isPublishableKey(publishable)) {
        json(res, 503, {
          error:
            'Stripe is not configured. Add STRIPE_SECRET_KEY (sk_test_…) and STRIPE_PUBLISHABLE_KEY (pk_test_…) to .env and restart npm run dev.',
        });
        return;
      }
      const payload = JSON.parse((await readBody(req)) || '{}') as Record<string, unknown>;
      const amount = amountToPaise(Number(payload.amount) || 0);
      if (amount < 50) {
        json(res, 400, { error: 'Order total is too small for card payment.' });
        return;
      }
      const intent = await stripe.paymentIntents.create({
        amount,
        currency: 'inr',
        automatic_payment_methods: { enabled: true },
        metadata: {
          customerEmail: typeof payload.email === 'string' ? payload.email : '',
        },
      });
      json(res, 200, { clientSecret: intent.client_secret, paymentIntentId: intent.id });
      return;
    }

    json(res, 404, { error: 'Not found' });
  } catch (error) {
    json(res, 500, { error: publicStripeError(error) });
  }
}
