import React, { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import type { Stripe } from '@stripe/stripe-js';
import { formatINR } from '../lib/money';
import { loadStripeForKey } from '../lib/stripeClient';
import { createStripePaymentIntent, fetchStripeConfig } from '../lib/stripeCheckout';

export type CheckoutPaymentChoice = 'stripe' | 'cod';

type PaymentMethodModalProps = {
  isOpen: boolean;
  amount: number;
  email: string;
  onClose: () => void;
  onStripePaid: (paymentIntentId: string) => void | Promise<void>;
  onChooseCod: () => void;
};

const StripePayForm: React.FC<{
  amount: number;
  paymentIntentId: string;
  onPaid: (paymentIntentId: string) => void | Promise<void>;
}> = ({ amount, paymentIntentId, onPaid }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!stripe || !elements) {
      setError('Stripe is still loading. Try again in a moment.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout`,
        },
        redirect: 'if_required',
      });
      if (result.error) {
        setError(result.error.message || 'Payment failed. Try another card.');
        return;
      }
      const status = result.paymentIntent?.status;
      if (status === 'succeeded') {
        await onPaid(result.paymentIntent.id || paymentIntentId);
        return;
      }
      if (status === 'processing') {
        setError('Payment is processing. Wait a moment, then try again if the order does not appear.');
        return;
      }
      setError('Payment was not completed. Try again.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handlePay} className="space-y-4">
      <PaymentElement />
      {error && <p className="text-sm text-[#ba1a1a]">{error}</p>}
      <button
        type="submit"
        disabled={!stripe || !elements || busy}
        className="w-full bg-black text-white text-xs font-semibold uppercase py-4 tracking-[0.2em] hover:bg-neutral-800 disabled:opacity-40"
      >
        {busy ? 'Please wait…' : `Pay ${formatINR(amount, true)}`}
      </button>
    </form>
  );
};

export const PaymentMethodModal: React.FC<PaymentMethodModalProps> = ({
  isOpen,
  amount,
  email,
  onClose,
  onStripePaid,
  onChooseCod,
}) => {
  const [option, setOption] = useState<CheckoutPaymentChoice | ''>('');
  const [stripe, setStripe] = useState<Stripe | null>(null);
  const [clientSecret, setClientSecret] = useState('');
  const [paymentIntentId, setPaymentIntentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setOption('');
      setClientSecret('');
      setPaymentIntentId('');
      setError(null);
      return;
    }
    let cancelled = false;
    void fetchStripeConfig()
      .then(async (config) => {
        if (!config.configured || !config.publishableKey) {
          throw new Error('Stripe is not configured.');
        }
        const instance = await loadStripeForKey(config.publishableKey);
        if (cancelled) return;
        if (!instance) throw new Error('Stripe.js did not load. Refresh the page.');
        setStripe(instance);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load Stripe.');
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || option !== 'stripe' || !stripe) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    void createStripePaymentIntent(amount, email)
      .then((intent) => {
        if (cancelled) return;
        setClientSecret(intent.clientSecret);
        setPaymentIntentId(intent.paymentIntentId);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not start payment.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, option, amount, email, stripe]);

  const elementsOptions = useMemo(
    () =>
      clientSecret
        ? {
            clientSecret,
            appearance: { theme: 'stripe' as const, variables: { colorPrimary: '#000000' } },
            loader: 'auto' as const,
          }
        : null,
    [clientSecret]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md max-h-[92vh] overflow-y-auto shadow-2xl border border-[#cfc4c5]/30 z-10 p-6 sm:p-8 my-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-black hover:opacity-60"
          aria-label="Close payment"
        >
          <X className="w-5 h-5" />
        </button>
        <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#5d5f5f] block mb-2">
          Payment
        </span>
        <h2 className="font-serif-luxury text-2xl text-black mb-6">Choose how to pay</h2>

        <label className="text-xs uppercase tracking-[0.15em] font-semibold text-black mb-2 block">
          Payment option
        </label>
        <select
          className="w-full border border-[#cfc4c5] bg-white px-4 py-3 text-sm focus:border-black focus:outline-none mb-5"
          value={option}
          onChange={(e) => setOption(e.target.value as CheckoutPaymentChoice | '')}
        >
          <option value="">Select payment option</option>
          <option value="stripe">Stripe (Card)</option>
          <option value="cod">Cash on Delivery</option>
        </select>

        {option === 'cod' && (
          <div className="space-y-4">
            <p className="text-sm text-[#5d5f5f] font-light leading-relaxed">
              Pay in cash when your order is delivered. Close this window, then click Place Order.
            </p>
            <button
              type="button"
              onClick={onChooseCod}
              className="w-full bg-black text-white text-xs font-semibold uppercase py-4 tracking-[0.2em] hover:bg-neutral-800"
            >
              Use Cash on Delivery
            </button>
          </div>
        )}

        {option === 'stripe' && (
          <div className="space-y-4">
            {loading && <p className="text-sm text-[#5d5f5f]">Loading card payment…</p>}
            {error && <p className="text-sm text-[#ba1a1a]">{error}</p>}
            {stripe && elementsOptions && paymentIntentId && (
              <Elements key={clientSecret} stripe={stripe} options={elementsOptions}>
                <StripePayForm amount={amount} paymentIntentId={paymentIntentId} onPaid={onStripePaid} />
              </Elements>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
