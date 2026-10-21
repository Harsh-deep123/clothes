import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CartItem, LocalAccount, PlacedOrder, SavedAddress, ViewScreen } from '../../types';
import { CheckoutLocationMap } from '../checkout/CheckoutLocationMap';
import { formatINR } from '../../lib/money';
import { ONE_SIZE, itemPreviewImage } from '../../catalog';
import { cartGrandTotal, getDeliveryQuote } from '../../lib/delivery';
import type { IpinfoLite } from '../../lib/ipinfo';
import type { SavedDeliveryLocation } from '../LocationWelcomeModal';
import { CartBillDetails } from '../CartBillDetails';
import { PaymentMethodModal, type CheckoutPaymentChoice } from '../PaymentMethodModal';
import { upiMethodLabel } from '../../lib/upi';
import { fetchStripeConfig, verifyStripePayment } from '../../lib/stripeCheckout';
import { loadStripeForKey } from '../../lib/stripeClient';
import { apiCreateOrder } from '../../lib/shopApi';

const PAY_RETURN_KEY = 'zayro_pending_payment';

interface CheckoutPageProps {
  items: CartItem[];
  account: LocalAccount | null;
  savedAddresses: SavedAddress[];
  onPlaceOrder: (order: Omit<PlacedOrder, 'id' | 'number' | 'createdAt' | 'items' | 'subtotal' | 'total'> & {
    customer: PlacedOrder['customer'];
    shippingAddress: PlacedOrder['shippingAddress'];
  }) => void | Promise<void>;
  onNavigate: (screen: ViewScreen, category?: string) => void;
  deliveryLocation: SavedDeliveryLocation | null;
  ipinfo: IpinfoLite | null;
}

const inputClass =
  'w-full border border-[#cfc4c5] bg-white px-4 py-3 text-sm focus:border-black focus:outline-none';
const labelClass = 'text-xs uppercase tracking-[0.15em] font-semibold text-black mb-2 block';

const emptyCheckoutForm = (account: LocalAccount | null, savedAddresses: SavedAddress[]) => {
  const saved = savedAddresses[0];
  return {
    fullName: account?.fullName || '',
    email: account?.email || '',
    phone: account?.phone || '',
    address: saved?.address || '',
    city: saved?.city || '',
    state: saved?.state || '',
    postalCode: saved?.postalCode || '',
    country: saved?.country || '',
    countryCode: undefined as string | undefined,
  };
};

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  items,
  account,
  savedAddresses,
  onPlaceOrder,
  onNavigate,
  deliveryLocation,
  ipinfo,
}) => {
  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const discount = 0;

  const [form, setForm] = useState(() => emptyCheckoutForm(account, savedAddresses));
  const [error, setError] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [paymentChoice, setPaymentChoice] = useState<CheckoutPaymentChoice | null>(null);
  const [stripePaymentIntentId, setStripePaymentIntentId] = useState('');
  const [selectedCoords, setSelectedCoords] = useState<{ latitude: number; longitude: number } | null>(() =>
    deliveryLocation && Number.isFinite(deliveryLocation.lat) && Number.isFinite(deliveryLocation.lon)
      ? { latitude: deliveryLocation.lat, longitude: deliveryLocation.lon }
      : null
  );

  const quote = useMemo(
    () =>
      getDeliveryQuote(
        {
          city: form.city || deliveryLocation?.city,
          state: form.state || deliveryLocation?.state,
          country: form.country || deliveryLocation?.country,
          countryCode: form.countryCode || deliveryLocation?.countryCode,
          label: deliveryLocation?.label,
        },
        ipinfo
      ),
    [form.city, form.state, form.country, form.countryCode, deliveryLocation, ipinfo]
  );
  const total = cartGrandTotal(subtotal, quote, discount);
  const checkoutItems = useMemo(
    () =>
      items.map((item) => ({
        productId: item.productId,
        name: item.product.name,
        image: itemPreviewImage(item),
        selectedSize: item.selectedSize,
        selectedColor: item.selectedColor,
        designId: item.selectedDesignId || '',
        designName: item.selectedDesignName || '',
        quantity: item.quantity,
        price: item.price,
      })),
    [items],
  );
  const stripeItems = useMemo(
    () => checkoutItems.map((item) => ({ name: item.name, quantity: item.quantity, price: item.price })),
    [checkoutItems],
  );

  useEffect(() => {
    setForm(emptyCheckoutForm(account, savedAddresses));
  }, [account?.email, savedAddresses]);

  useEffect(() => {
    let cancelled = false;
    void fetchStripeConfig()
      .then((config) => {
        if (cancelled || !config.publishableKey) return;
        return loadStripeForKey(config.publishableKey);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const orderPayload = useCallback(
    (choice: CheckoutPaymentChoice, intentId?: string, status: 'paid' | 'unpaid' | 'pending' = choice === 'cod' ? 'unpaid' : 'paid') => {
      const shippingAddress = {
        address: form.address.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        postalCode: form.postalCode.trim(),
        country: form.country.trim(),
      };
      const addressLine = [shippingAddress.address, shippingAddress.city, shippingAddress.state, shippingAddress.postalCode, shippingAddress.country]
        .filter(Boolean)
        .join(', ');
      return {
        customer: {
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
        },
        shippingAddress,
        shippingLabel: quote.zoneLabel || formatINR(quote.deliveryCharge, true),
        discount,
        estimatedDelivery: '3–6 business days after dispatch',
        deliveryCharge: quote.deliveryCharge,
        handlingCharge: quote.handlingCharge,
        paymentMethod: choice,
        paymentStatus: status,
        stripePaymentIntentId: intentId,
        deliveryLocation:
          selectedCoords && Number.isFinite(selectedCoords.latitude) && Number.isFinite(selectedCoords.longitude)
            ? {
                latitude: selectedCoords.latitude,
                longitude: selectedCoords.longitude,
                address: addressLine,
              }
            : undefined,
      };
    },
    [form, quote, discount, selectedCoords],
  );

  const startPendingOrder = useCallback(
    async (intentId: string, choice: CheckoutPaymentChoice) => {
      try {
        sessionStorage.setItem(
          PAY_RETURN_KEY,
          JSON.stringify({ choice, intentId, form, selectedCoords, total }),
        );
      } catch {
        /* ignore */
      }
      const payload = orderPayload(choice, intentId, 'pending');
      await apiCreateOrder({
        customerName: payload.customer.fullName,
        customerEmail: payload.customer.email,
        customerPhone: payload.customer.phone,
        shippingAddress: payload.shippingAddress,
        items: checkoutItems,
        subtotal,
        deliveryCharge: payload.deliveryCharge,
        handlingCharge: payload.handlingCharge,
        discount: payload.discount,
        total,
        paymentMethod: choice === 'cod' ? 'cod' : choice,
        paymentStatus: 'pending',
        pendingPayment: true,
        stripePaymentIntentId: intentId,
        deliveryLocation: payload.deliveryLocation,
      });
    },
    [checkoutItems, form, orderPayload, selectedCoords, subtotal, total],
  );

  const handleIntentCreated = useCallback(
    async (intentId: string, method: CheckoutPaymentChoice) => {
      setStripePaymentIntentId(intentId);
      setPaymentChoice(method);
      await startPendingOrder(intentId, method);
    },
    [startPendingOrder],
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('pay_return') !== '1' && !params.get('payment_intent')) return;
    const intentId = params.get('payment_intent') || '';
    const clientSecret = params.get('payment_intent_client_secret') || '';
    let cancelled = false;
    void (async () => {
      if (!items.length) return;
      setPayOpen(true);
      setPlacing(true);
      setError(null);
      try {
        let storedChoice: CheckoutPaymentChoice = 'gpay';
        try {
          const raw = sessionStorage.getItem(PAY_RETURN_KEY);
          const stored = raw
            ? (JSON.parse(raw) as {
                choice?: CheckoutPaymentChoice;
                form?: typeof form;
                selectedCoords?: typeof selectedCoords;
              })
            : null;
          if (stored?.choice) storedChoice = stored.choice;
          if (stored?.form) setForm(stored.form);
          if (stored?.selectedCoords) setSelectedCoords(stored.selectedCoords);
        } catch {
          /* ignore */
        }
        const id = intentId || '';
        if (!id) throw new Error('Payment details are missing. You can retry.');
        if (clientSecret) {
          const config = await fetchStripeConfig();
          if (config.publishableKey) {
            const stripeJs = await loadStripeForKey(config.publishableKey);
            const retrieved = await stripeJs?.retrievePaymentIntent(clientSecret);
            const status = retrieved?.paymentIntent?.status;
            if (status && status !== 'succeeded' && status !== 'processing') {
              throw new Error('Payment was cancelled or failed. You can retry.');
            }
          }
        }
        const verified = await verifyStripePayment(id, total);
        if (!verified.paid) {
          setPaymentChoice(storedChoice);
          throw new Error('Payment is still pending. Finish it in your UPI app, then retry.');
        }
        if (cancelled) return;
        setPaymentChoice(storedChoice);
        const verifiedAgain = await verifyStripePayment(id, total);
        if (!verifiedAgain.paid) throw new Error('Payment is still pending or failed. You can retry.');
        await onPlaceOrder(orderPayload(storedChoice, id, 'paid'));
        try {
          sessionStorage.removeItem(PAY_RETURN_KEY);
        } catch {
          /* ignore */
        }
        window.history.replaceState({}, '', '/checkout');
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Payment was not completed.');
        window.history.replaceState({}, '', '/checkout');
      } finally {
        if (!cancelled) setPlacing(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // Return-from-UPI runs once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (items.length === 0) {
    return (
      <main className="flex-grow pt-28 md:pt-36 px-5 md:px-16 max-w-[1440px] mx-auto w-full pb-20">
        <h1 className="font-serif-luxury text-4xl uppercase mb-4">Checkout</h1>
        <p className="text-sm text-[#5d5f5f] mb-8">Your bag is empty.</p>
        <button
          type="button"
          onClick={() => onNavigate('new-arrivals')}
          className="bg-black text-white text-xs uppercase tracking-[0.2em] font-semibold px-8 py-4"
        >
          Continue Shopping
        </button>
      </main>
    );
  }

  const formReady = () => {
    if (!form.fullName.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) || form.phone.trim().length < 8) {
      setError('Complete customer information.');
      return false;
    }
    if (!form.address.trim() || !form.city.trim() || !form.state.trim() || !form.postalCode.trim() || !form.country.trim()) {
      setError('Complete the shipping address.');
      return false;
    }
    if (!quote.available) {
      setError(quote.message || 'Delivery not available');
      return false;
    }
    setError(null);
    return true;
  };

  const placeOrder = async (choice: CheckoutPaymentChoice, intentId?: string) => {
    if (choice !== 'cod' && choice !== 'gpay') {
      if (!intentId) throw new Error('Payment is not complete.');
      const verified = await verifyStripePayment(intentId, total);
      if (!verified.paid) throw new Error('Payment is still pending or failed. You can retry.');
    }
    setPlacing(true);
    try {
      await onPlaceOrder(
        orderPayload(choice, intentId, choice === 'cod' || choice === 'gpay' ? 'unpaid' : 'paid'),
      );
      try {
        sessionStorage.removeItem(PAY_RETURN_KEY);
      } catch {
        /* ignore */
      }
    } finally {
      setPlacing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formReady()) return;
    if (paymentChoice !== 'cod') {
      setError('Choose a payment option. Online orders are confirmed only after Stripe verifies payment.');
      return;
    }
    await placeOrder('cod');
  };

  return (
    <main className="flex-grow pt-28 md:pt-36 px-5 md:px-16 max-w-[1440px] mx-auto w-full pb-20 md:pb-28">
      <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#5d5f5f] block mb-3">
        Checkout
      </span>
      <h1 className="font-serif-luxury text-3xl sm:text-5xl tracking-tight uppercase text-black font-normal mb-10">
        Complete Your Order
      </h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
        <div className="lg:col-span-7 space-y-10">
          <section>
            <h2 className="text-xs uppercase tracking-[0.15em] font-semibold text-black mb-4">
              Customer Information
            </h2>
            <div className="space-y-3">
              <div>
                <label className={labelClass}>Full Name</label>
                <input
                  className={inputClass}
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Email</label>
                  <input
                    type="email"
                    className={inputClass}
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className={labelClass}>Phone Number</label>
                  <input
                    type="tel"
                    className={inputClass}
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xs uppercase tracking-[0.15em] font-semibold text-black mb-4">
              Shipping Address
            </h2>
            <div className="space-y-3">
              <CheckoutLocationMap
                onAddressChange={(next) => setForm((prev) => ({ ...prev, ...next }))}
                onCoordinatesChange={(lat, lon) => setSelectedCoords({ latitude: lat, longitude: lon })}
              />
              <div>
                <label className={labelClass}>Address</label>
                <input
                  className={inputClass}
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>City</label>
                  <input
                    className={inputClass}
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className={labelClass}>State</label>
                  <input
                    className={inputClass}
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Postal Code</label>
                  <input
                    className={inputClass}
                    value={form.postalCode}
                    onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className={labelClass}>Country</label>
                  <input
                    className={inputClass}
                    value={form.country}
                    onChange={(e) => setForm({ ...form, country: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xs uppercase tracking-[0.15em] font-semibold text-black mb-4">
              Payment
            </h2>
            <div className="border border-[#cfc4c5] p-5 space-y-4 bg-white">
              <label className="flex items-start gap-3 text-sm text-black cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 accent-black"
                  checked={payOpen || Boolean(paymentChoice)}
                  onChange={(e) => {
                    if (!e.target.checked) {
                      setPayOpen(false);
                      setPaymentChoice(null);
                      setStripePaymentIntentId('');
                      return;
                    }
                    if (!formReady()) return;
                    setPayOpen(true);
                  }}
                />
                <span>Open payment options: Google Pay, PhonePe, Paytm, card, or Cash on Delivery.</span>
              </label>
              {paymentChoice === 'cod' && (
                <p className="text-sm text-[#5d5f5f]">Cash on Delivery selected. Click Place Order to confirm.</p>
              )}
              {paymentChoice === 'gpay' && (
                <p className="text-sm text-[#5d5f5f]">
                  Google Pay selected. Pay 7681987334 with shopping payment filled, then return here to confirm the order.
                </p>
              )}
              {(paymentChoice === 'phonepe' || paymentChoice === 'paytm') && (
                <p className="text-sm text-[#5d5f5f]">
                  {upiMethodLabel(paymentChoice)} selected. Complete payment in the popup. The order is confirmed only after Stripe verifies it.
                </p>
              )}
              {paymentChoice === 'stripe' && (
                <p className="text-sm text-[#5d5f5f]">Card payment verified.</p>
              )}
              {placing && paymentChoice !== 'cod' && paymentChoice !== 'gpay' && (
                <p className="text-sm text-[#5d5f5f]">Payment pending. Waiting for Stripe to confirm…</p>
              )}
              {placing && paymentChoice === 'gpay' && (
                <p className="text-sm text-[#5d5f5f]">Confirming your Google Pay order…</p>
              )}
            </div>
          </section>

          {error && <p className="text-sm text-[#ba1a1a]">{error}</p>}

          <button
            type="submit"
            className="w-full bg-black text-white text-xs font-semibold uppercase py-4 tracking-[0.2em] hover:bg-neutral-800 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            disabled={!quote.available || placing || paymentChoice !== 'cod'}
          >
            {placing ? 'Please wait…' : `Place Order • ${formatINR(total, true)}`}
          </button>
        </div>

        <aside className="lg:col-span-5">
          <div className="bg-[#f9f9f9] border border-[#cfc4c5]/30 p-6">
            <h2 className="font-serif-luxury text-xl text-black mb-4 pb-3 border-b border-[#cfc4c5]/30">
              Order Summary
            </h2>
            <div className="space-y-4 mb-6">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3 text-xs">
                  <img
                    src={itemPreviewImage(item)}
                    alt=""
                    className="w-12 h-16 object-cover bg-white border border-[#cfc4c5]/20"
                  />
                  <div className="flex-grow">
                    <p className="font-medium text-black">{item.product.name}</p>
                    <p className="text-[#5d5f5f]">
                      {item.selectedDesignName
                        ? `Design: ${item.selectedDesignName}${item.selectedDesignId ? ` · ${item.selectedDesignId}` : ''} • `
                        : ''}
                      {item.selectedColor}
                      {item.selectedSize !== ONE_SIZE && ` • Size ${item.selectedSize}`}
                    </p>
                    <p className="text-[#5d5f5f]">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-semibold">{formatINR(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>
            <div className="space-y-2 text-xs text-[#5d5f5f] border-t border-[#cfc4c5]/30 pt-4">
              <CartBillDetails itemsTotal={subtotal} quote={quote} discount={discount} size="checkout" />
            </div>
          </div>
        </aside>
      </form>
      <PaymentMethodModal
        isOpen={payOpen}
        amount={total}
        subtotal={subtotal}
        deliveryCharge={quote.deliveryCharge}
        handlingCharge={quote.handlingCharge}
        discount={discount}
        email={form.email}
        items={stripeItems}
        onClose={() => setPayOpen(false)}
        onIntentCreated={handleIntentCreated}
        onStripePaid={async (intentId, method) => {
          setStripePaymentIntentId(intentId);
          setPaymentChoice(method);
          await placeOrder(method, intentId);
          setPayOpen(false);
        }}
        onChooseCod={() => {
          setPaymentChoice('cod');
          setPayOpen(false);
        }}
        onGpayPaid={async () => {
          setPaymentChoice('gpay');
          await placeOrder('gpay');
          setPayOpen(false);
        }}
      />
    </main>
  );
};
