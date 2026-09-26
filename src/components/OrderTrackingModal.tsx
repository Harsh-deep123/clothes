import React from 'react';
import { X } from 'lucide-react';
import type { PlacedOrder } from '../types';
import { formatINR } from '../lib/money';
import {
  TRACKING_MESSAGES,
  TRACKING_STEPS,
  historyTimestamp,
  normalizeTrackingStatus,
} from '../lib/orderTracking';

type OrderTrackingModalProps = {
  order: PlacedOrder | null;
  onClose: () => void;
  loading?: boolean;
  error?: string | null;
};

function formatWhen(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({ order, onClose, loading, error }) => {
  if (!order) return null;
  const status = normalizeTrackingStatus(order.status);
  const cancelled = status === 'Cancelled';
  const currentIndex = TRACKING_STEPS.indexOf(status as (typeof TRACKING_STEPS)[number]);
  const addr = order.shippingAddress;
  const message = TRACKING_MESSAGES[status];

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl border border-[#cfc4c5]/30 z-10 p-6 sm:p-8 my-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-black hover:opacity-60"
          aria-label="Close tracking"
        >
          <X className="w-5 h-5" />
        </button>
        <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#5d5f5f] block mb-2">
          Track Order
        </span>
        <h2 className="font-serif-luxury text-2xl text-black mb-2">{order.number}</h2>
        {loading && <p className="text-sm text-[#5d5f5f] mb-4">Loading latest status…</p>}
        {error && <p className="text-sm text-[#ba1a1a] mb-4">{error}</p>}
        <p className="text-sm text-[#5d5f5f] font-light mb-6">{message}</p>

        {cancelled && (
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-[#ba1a1a] mb-6">Order Cancelled</p>
        )}

        {!cancelled && (
          <ol className="space-y-0 mb-8">
            {TRACKING_STEPS.map((step, index) => {
              const done = currentIndex >= 0 && (status === 'Delivered' ? index <= currentIndex : index < currentIndex);
              const current = status !== 'Delivered' && index === currentIndex;
              const stamp = historyTimestamp(order.statusHistory, step) || (current || done ? undefined : '');
              return (
                <li key={step} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span
                      className={`w-6 h-6 rounded-full border flex items-center justify-center text-[11px] ${
                        done || current ? 'bg-black text-white border-black' : 'border-[#cfc4c5] text-[#cfc4c5]'
                      }`}
                    >
                      {done ? '✓' : current ? '●' : ''}
                    </span>
                    {index < TRACKING_STEPS.length - 1 && <span className="w-px flex-1 min-h-[18px] bg-[#cfc4c5]" />}
                  </div>
                  <div className="pb-4">
                    <p className={`text-sm ${current || done ? 'text-black font-medium' : 'text-[#5d5f5f]'}`}>{step}</p>
                    {stamp ? <p className="text-xs text-[#5d5f5f] mt-0.5">{formatWhen(stamp)}</p> : null}
                  </div>
                </li>
              );
            })}
          </ol>
        )}

        {cancelled && (
          <ol className="space-y-0 mb-8">
            {TRACKING_STEPS.map((step, index) => {
              const stamp = historyTimestamp(order.statusHistory, step);
              const happened = Boolean(stamp);
              return (
                <li key={step} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span
                      className={`w-6 h-6 rounded-full border flex items-center justify-center text-[11px] ${
                        happened ? 'bg-black text-white border-black' : 'border-[#cfc4c5] text-[#cfc4c5]'
                      }`}
                    >
                      {happened ? '✓' : ''}
                    </span>
                    {index < TRACKING_STEPS.length - 1 && <span className="w-px flex-1 min-h-[18px] bg-[#cfc4c5]" />}
                  </div>
                  <div className="pb-4">
                    <p className={`text-sm ${happened ? 'text-black font-medium' : 'text-[#5d5f5f]'}`}>{step}</p>
                    {stamp ? <p className="text-xs text-[#5d5f5f] mt-0.5">{formatWhen(stamp)}</p> : null}
                  </div>
                </li>
              );
            })}
          </ol>
        )}

        <div className="space-y-4 text-sm">
          {order.items.map((item) => (
            <div key={item.id} className="flex gap-3">
              {item.product.images[0] ? (
                <img src={item.product.images[0]} alt="" className="w-12 h-16 object-cover bg-white border border-[#cfc4c5]/20" />
              ) : (
                <div className="w-12 h-16 bg-[#f9f9f9] border border-[#cfc4c5]/20" />
              )}
              <div className="flex-grow">
                <p className="font-medium text-black">{item.product.name}</p>
                <p className="text-[#5d5f5f]">Qty {item.quantity}</p>
              </div>
              <p className="font-semibold">{formatINR(item.price * item.quantity)}</p>
            </div>
          ))}
          <p className="flex justify-between font-semibold border-t border-[#cfc4c5]/30 pt-3">
            <span>Total</span>
            <span>{formatINR(order.total, true)}</span>
          </p>
          <p className="text-[#5d5f5f]">
            {addr.address}
            {addr.city ? `, ${addr.city}` : ''}
            {addr.state ? `, ${addr.state}` : ''} {addr.postalCode} {addr.country}
          </p>
          <p className="text-[#5d5f5f]">
            Tracking ID: {order.trackingId || '—'}
            <br />
            Delivery Partner: {order.deliveryPartner || '—'}
            <br />
            Expected delivery: {order.expectedDeliveryDate ? formatWhen(order.expectedDeliveryDate) : '—'}
            <br />
            Current status: {status}
          </p>
        </div>
      </div>
    </div>
  );
};
