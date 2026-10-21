import React, { useEffect, useMemo, useState } from 'react';
import { Check, ChevronLeft, X } from 'lucide-react';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import type { Stripe } from '@stripe/stripe-js';
import { formatINR } from '../lib/money';
import { loadStripeForKey } from '../lib/stripeClient';
import {
  createStripePaymentIntent,
  fetchStripeConfig,
  verifyStripePayment,
  type StripeCheckoutItem,
} from '../lib/stripeCheckout';
import {
  GPAY_NUMBER,
  gpayLaunchUrl,
  gpayQrImage,
  isUpiPayment,
  launchGooglePay,
  upiMethodLabel,
  type UpiPaymentChoice,
} from '../lib/upi';

export type CheckoutPaymentChoice = 'stripe' | 'cod' | UpiPaymentChoice;

type PaymentMethodModalProps = {
  isOpen: boolean;
  amount: number;
  subtotal: number;
  deliveryCharge: number;
  handlingCharge: number;
  discount: number;
  email: string;
  items: StripeCheckoutItem[];
  onClose: () => void;
  onStripePaid: (paymentIntentId: string, method: CheckoutPaymentChoice) => void | Promise<void>;
  onChooseCod: () => void;
  onGpayPaid: () => void | Promise<void>;
  onIntentCreated?: (paymentIntentId: string, method: CheckoutPaymentChoice) => void | Promise<void>;
};

const OPTIONS: {
  id: CheckoutPaymentChoice;
  name: string;
  hint: string;
  color: string;
}[] = [
  { id: 'gpay', name: 'Google Pay', hint: 'Pay 7681987334', color: '#1A73E8' },
  { id: 'phonepe', name: 'PhonePe', hint: 'UPI via PhonePe', color: '#5F259F' },
  { id: 'paytm', name: 'Paytm', hint: 'UPI via Paytm', color: '#00BAF2' },
  { id: 'stripe', name: 'Card', hint: 'Debit or credit card', color: '#111111' },
  { id: 'cod', name: 'Cash on Delivery', hint: 'Pay when the order arrives', color: '#5d5f5f' },
];

const GooglePayPanel: React.FC<{
  amount: number;
  onPaid: () => void | Promise<void>;
}> = ({ amount, onPaid }) => {
  const [opened, setOpened] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const confirming = React.useRef(false);
  const leftForGpay = React.useRef(false);
  const launchedAt = React.useRef(0);
  const onPaidRef = React.useRef(onPaid);
  onPaidRef.current = onPaid;

  const confirmOrder = async () => {
    if (confirming.current) return;
    confirming.current = true;
    setBusy(true);
    setError(null);
    try {
      await onPaidRef.current();
    } catch (err) {
      confirming.current = false;
      setError(err instanceof Error ? err.message : 'Could not confirm the order.');
      setBusy(false);
    }
  };

  const markOpened = () => {
    leftForGpay.current = false;
    launchedAt.current = Date.now();
    setOpened(true);
  };

  useEffect(() => {
    if (!opened) return;
    const onReturn = () => {
      if (document.visibilityState === 'hidden') {
        if (Date.now() - launchedAt.current > 250) leftForGpay.current = true;
        return;
      }
      if (!leftForGpay.current) return;
      if (Date.now() - launchedAt.current < 1200) return;
      void confirmOrder();
    };
    document.addEventListener('visibilitychange', onReturn);
    window.addEventListener('pageshow', onReturn);
    return () => {
      document.removeEventListener('visibilitychange', onReturn);
      window.removeEventListener('pageshow', onReturn);
    };
  }, [opened]);

  return (
    <div className="space-y-4">
      <p className="text-xs text-[#5d5f5f]">
        Google Pay opens for <span className="font-semibold text-black">{GPAY_NUMBER}</span> with shopping payment{' '}
        <span className="font-semibold text-black">{formatINR(amount, true)}</span> already filled. Pay there, then
        return to this page to confirm the order.
      </p>
      <div className="bg-[#f7f7f8] border border-[#cfc4c5]/40 px-5 py-5 flex flex-col items-center text-center">
        <img src={gpayQrImage(amount)} alt="Google Pay QR" className="w-[200px] h-[200px] object-contain bg-white" />
        <p className="text-[11px] text-[#5d5f5f] mt-3">On desktop, scan this QR with Google Pay</p>
      </div>
      {error && <p className="text-sm text-[#ba1a1a]">{error}</p>}
      <a
        href={gpayLaunchUrl(amount)}
        onClick={markOpened}
        className={`block w-full bg-black text-white text-xs font-semibold uppercase py-4 tracking-[0.2em] hover:bg-neutral-800 text-center ${
          busy ? 'pointer-events-none opacity-40' : ''
        }`}
      >
        Open Google Pay
      </a>
      <button
        type="button"
        onClick={() => void confirmOrder()}
        disabled={busy}
        className="w-full border border-black text-black text-xs font-semibold uppercase py-4 tracking-[0.2em] hover:bg-[#eeeeee] disabled:opacity-40"
      >
        {busy ? 'Confirming order…' : 'I have paid — confirm order'}
      </button>
    </div>
  );
};

const StripePayForm: React.FC<{
  amount: number;
  method: CheckoutPaymentChoice;
  paymentIntentId: string;
  onPaid: (paymentIntentId: string, method: CheckoutPaymentChoice) => void | Promise<void>;
}> = ({ amount, method, paymentIntentId, onPaid }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const waitForPaid = async () => {
    for (let attempt = 0; attempt < 12; attempt += 1) {
      const result = await verifyStripePayment(paymentIntentId, amount);
      if (result.paid) return true;
      if (result.status === 'canceled' || result.status === 'requires_payment_method') return false;
      await new Promise((resolve) => window.setTimeout(resolve, 1500));
    }
    const last = await verifyStripePayment(paymentIntentId, amount);
    return last.paid;
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!stripe || !elements) {
      setError('Payment is still loading. Try again in a moment.');
      return;
    }
    setBusy(true);
    setPending(true);
    setError(null);
    try {
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout?pay_return=1`,
        },
        redirect: 'if_required',
      });
      if (result.error) {
        setPending(false);
        setError(result.error.message || 'Payment failed or was cancelled. You can retry.');
        return;
      }
      const status = result.paymentIntent?.status;
      if (status === 'succeeded' || (await waitForPaid())) {
        await onPaid(result.paymentIntent?.id || paymentIntentId, method);
        return;
      }
      if (status === 'processing') {
        setError('Payment is still pending. Finish it in your UPI app, then tap Pay again.');
        return;
      }
      setPending(false);
      setError('Payment was not completed. You can retry.');
    } catch (err) {
      setPending(false);
      setError(err instanceof Error ? err.message : 'Payment failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handlePay} className="space-y-4">
      <p className="text-xs text-[#5d5f5f]">
        {isUpiPayment(method)
          ? `Pay ${formatINR(amount, true)} with ${upiMethodLabel(method)}. On mobile this opens your UPI app; on desktop scan the Stripe UPI QR. The order stays pending until Stripe confirms payment.`
          : `Pay ${formatINR(amount, true)} by card. The order stays pending until Stripe confirms payment.`}
      </p>
      <PaymentElement />
      {pending && (
        <p className="text-sm text-[#5d5f5f]">Payment pending. Do not close this window until it succeeds or fails.</p>
      )}
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
  subtotal,
  deliveryCharge,
  handlingCharge,
  discount,
  email,
  items,
  onClose,
  onStripePaid,
  onChooseCod,
  onGpayPaid,
  onIntentCreated,
}) => {
  const [option, setOption] = useState<CheckoutPaymentChoice | ''>('');
  const [step, setStep] = useState<'select' | 'pay'>('select');
  const [stripe, setStripe] = useState<Stripe | null>(null);
  const [clientSecret, setClientSecret] = useState('');
  const [paymentIntentId, setPaymentIntentId] = useState('');
  const [intentKind, setIntentKind] = useState<'card' | 'upi' | ''>('');
  const [intentAmount, setIntentAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const online = option === 'stripe' || option === 'phonepe' || option === 'paytm';
  const kind: 'card' | 'upi' | '' = option === 'stripe' ? 'card' : option === 'phonepe' || option === 'paytm' ? 'upi' : '';
  const paying = isOpen && step === 'pay' && online;

  useEffect(() => {
    if (!isOpen) {
      setOption('');
      setStep('select');
      setClientSecret('');
      setPaymentIntentId('');
      setIntentKind('');
      setIntentAmount(0);
      setError(null);
      setLoading(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!paying) return;
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
  }, [paying]);

  useEffect(() => {
    if (!paying || !stripe || !kind || !option) return;
    if (paymentIntentId && intentKind === kind && intentAmount === amount) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    void createStripePaymentIntent(amount, email, {
      method: kind,
      preferredApp: isUpiPayment(option) ? option : '',
      items,
    })
      .then(async (intent) => {
        if (cancelled) return;
        setClientSecret(intent.clientSecret);
        setPaymentIntentId(intent.paymentIntentId);
        setIntentKind(kind);
        setIntentAmount(amount);
        await onIntentCreated?.(intent.paymentIntentId, option);
      })
      .catch((err) => {
        if (cancelled) return;
        setClientSecret('');
        setPaymentIntentId('');
        setIntentKind('');
        const message = err instanceof Error ? err.message : 'Could not start payment.';
        setError(
          kind === 'upi'
            ? `${message} Google Pay, PhonePe and Paytm need UPI enabled on this Stripe India account. Enable UPI in Stripe Dashboard → Settings → Payment methods.`
            : message,
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [paying, stripe, kind, amount, email, items, option, paymentIntentId, intentKind, intentAmount, onIntentCreated]);

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

  const continuePayment = () => {
    if (!option) return;
    if (option === 'cod') {
      onChooseCod();
      return;
    }
    setError(null);
    setStep('pay');
    if (option === 'gpay') launchGooglePay(amount);
  };

  return (
    <div className="fixed inset-0 z-[90] overflow-y-auto">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative min-h-full flex items-start justify-center p-4 sm:p-6">
      <div className="relative bg-white w-full max-w-lg shadow-2xl border border-[#cfc4c5]/30 z-10 p-6 sm:p-8 my-8">
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
        <h2 className="font-serif-luxury text-2xl text-black mb-6">
          {step === 'select' ? 'Choose how to pay' : `Pay ${formatINR(amount, true)}`}
        </h2>

        {step === 'select' && (
          <div>
            <div className="space-y-2 mb-6">
              {OPTIONS.map((item) => {
                const selected = option === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setOption(item.id)}
                    className={`w-full text-left border px-4 py-3.5 transition-colors cursor-pointer ${
                      selected ? 'border-black bg-[#f3f3f4]' : 'border-[#cfc4c5] bg-white hover:border-black'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: item.color }} />
                      <span className="flex-1">
                        <span className="block text-sm font-semibold text-black">{item.name}</span>
                        <span className="block text-xs text-[#5d5f5f] mt-0.5">{item.hint}</span>
                      </span>
                      {selected && <Check className="w-4 h-4 text-black shrink-0" />}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-[#5d5f5f] mb-4">
              Amount due: <span className="font-semibold text-black">{formatINR(amount, true)}</span>
            </p>
            <button
              type="button"
              disabled={!option}
              onClick={continuePayment}
              className="w-full bg-black text-white text-xs font-semibold uppercase py-4 tracking-[0.2em] hover:bg-neutral-800 disabled:opacity-40"
            >
              Continue to Payment
            </button>
          </div>
        )}

        {step === 'pay' && option && option !== 'cod' && (
          <div className="space-y-5">
            <button
              type="button"
              onClick={() => {
                setStep('select');
                setError(null);
              }}
              className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.15em] font-semibold text-[#5d5f5f] hover:text-black"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Change method
            </button>

            <div className="border border-[#cfc4c5]/40 p-4 space-y-3">
              <p className="text-xs uppercase tracking-[0.15em] font-semibold text-black">Order details</p>
              <div className="space-y-2">
                {items.map((item, index) => (
                  <div key={`${item.name}-${index}`} className="flex justify-between gap-3 text-xs text-[#5d5f5f]">
                    <span>
                      {item.name} × {item.quantity}
                    </span>
                    <span className="text-black font-medium">{formatINR(item.price * item.quantity, true)}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-2 text-xs text-[#5d5f5f] border-t border-[#cfc4c5]/30 pt-3">
                <div className="flex justify-between">
                  <span>Items subtotal</span>
                  <span className="text-black font-medium">{formatINR(subtotal, true)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between">
                    <span>Discount</span>
                    <span className="text-black font-medium">−{formatINR(discount, true)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Delivery charges</span>
                  <span className="text-black font-medium">{formatINR(deliveryCharge, true)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Handling charges</span>
                  <span className="text-black font-medium">{formatINR(handlingCharge, true)}</span>
                </div>
                <div className="flex justify-between font-semibold text-black text-sm pt-3 border-t border-[#cfc4c5]/30">
                  <span>Grand Total</span>
                  <span>{formatINR(amount, true)}</span>
                </div>
              </div>
            </div>

            {option === 'gpay' && <GooglePayPanel amount={amount} onPaid={onGpayPaid} />}
            {online && loading && (
              <p className="text-sm text-[#5d5f5f]">Starting secure {upiMethodLabel(option)} payment…</p>
            )}
            {online && error && <p className="text-sm text-[#ba1a1a]">{error}</p>}
            {online && stripe && elementsOptions && paymentIntentId && (
              <Elements key={clientSecret} stripe={stripe} options={elementsOptions}>
                <StripePayForm
                  amount={amount}
                  method={option}
                  paymentIntentId={paymentIntentId}
                  onPaid={onStripePaid}
                />
              </Elements>
            )}
          </div>
        )}
      </div>
      </div>
    </div>
  );
};
