import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { PlacedOrder, ViewScreen } from '../../types';
import { formatINR } from '../../lib/money';
import { requestOrderConfirmationCall, shouldStartConfirmationCall } from '../../lib/confirmationCall';
import { fetchPendingReviews, type PendingReviewItem } from '../../lib/reviewsApi';
import { getAuthToken } from '../../lib/shopApi';
import {
  dismissRemainingReviewPrompts,
  dismissReviewPrompt,
  getDismissedReviewPrompts,
} from '../../lib/reviewPrompt';
import { PostPurchaseReviewPopup } from '../reviews/PostPurchaseReviewPopup';

interface ConfirmationPageProps {
  order: PlacedOrder | null;
  onNavigate: (screen: ViewScreen, category?: string) => void;
  onConfirmationCallUpdate?: (orderId: string, patch: Partial<PlacedOrder>) => void;
}

function itemsFromOrder(order: PlacedOrder): PendingReviewItem[] {
  const seen = new Set<string>();
  const items: PendingReviewItem[] = [];
  for (const item of order.items) {
    const productId = item.productId || item.product?.id;
    if (!productId || seen.has(productId)) continue;
    seen.add(productId);
    items.push({
      productId,
      name: item.product?.name || 'Purchased item',
      image: item.product?.images?.[0] || '',
    });
  }
  return items;
}

export const ConfirmationPage: React.FC<ConfirmationPageProps> = ({
  order,
  onNavigate,
  onConfirmationCallUpdate,
}) => {
  const callStartedFor = useRef<string | null>(null);
  const reviewLoadedFor = useRef<string | null>(null);
  const [reviewItems, setReviewItems] = useState<PendingReviewItem[]>([]);

  useEffect(() => {
    if (!order || !shouldStartConfirmationCall(order)) return;
    if (callStartedFor.current === order.id) return;
    callStartedFor.current = order.id;
    void requestOrderConfirmationCall(order).then((patch) => {
      onConfirmationCallUpdate?.(order.id, patch);
    });
  }, [order, onConfirmationCallUpdate]);

  useEffect(() => {
    if (!order) return;
    if (reviewLoadedFor.current === order.id) return;
    reviewLoadedFor.current = order.id;
    const dismissed = new Set(getDismissedReviewPrompts(order.id));
    const local = itemsFromOrder(order).filter((item) => !dismissed.has(item.productId));
    if (local.length) setReviewItems(local);

    if (!getAuthToken()) return;

    void fetchPendingReviews(order.id)
      .then((pending) => {
        const skip = new Set(getDismissedReviewPrompts(pending.orderId || order.id));
        setReviewItems(
          pending.items.filter((item) => !dismissed.has(item.productId) && !skip.has(item.productId))
        );
      })
      .catch(() => {
        /* keep confirmation items from the order */
      });
  }, [order]);

  if (!order) {
    return (
      <main className="flex-grow pt-28 md:pt-36 px-5 md:px-16 max-w-[1440px] mx-auto w-full pb-20 text-center">
        <h1 className="font-serif-luxury text-3xl mb-4">No order to show</h1>
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="bg-black text-white text-xs uppercase tracking-[0.2em] font-semibold px-8 py-4"
        >
          Continue Shopping
        </button>
      </main>
    );
  }

  const addr = order.shippingAddress;

  return (
    <main className="flex-grow pt-28 md:pt-36 px-5 md:px-16 max-w-[800px] mx-auto w-full pb-20 md:pb-28">
      <div className="text-center mb-12">
        <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8" />
        </div>
        <h1 className="font-serif-luxury text-3xl sm:text-5xl tracking-tight uppercase text-black font-normal mb-4">
          ORDER CONFIRMED
        </h1>
        <p className="text-sm sm:text-base text-[#5d5f5f] font-light leading-relaxed">
          Thank you for choosing ZAYRO Store. Your order has been successfully received.
        </p>
      </div>

      <div className="border border-[#cfc4c5]/30 bg-white p-6 md:p-8 space-y-6 text-sm">
        <p>
          <span className="text-xs uppercase tracking-[0.15em] font-semibold text-[#5d5f5f] block mb-1">
            Order Number
          </span>
          <span className="font-medium text-black">{order.number}</span>
        </p>
        <div>
          <span className="text-xs uppercase tracking-[0.15em] font-semibold text-[#5d5f5f] block mb-3">
            Order Summary
          </span>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between gap-4 text-[#5d5f5f]">
                <span>
                  {item.product.name} × {item.quantity}
                </span>
                <span className="text-black">{formatINR(item.price * item.quantity)}</span>
              </div>
            ))}
            <div className="flex justify-between font-semibold text-black pt-3 border-t border-[#cfc4c5]/30">
              <span>Total</span>
              <span>{formatINR(order.total, true)}</span>
            </div>
          </div>
        </div>
        <p>
          <span className="text-xs uppercase tracking-[0.15em] font-semibold text-[#5d5f5f] block mb-1">
            Shipping Address
          </span>
          {addr.address}, {addr.city}, {addr.state} {addr.postalCode}, {addr.country}
        </p>
        <p>
          <span className="text-xs uppercase tracking-[0.15em] font-semibold text-[#5d5f5f] block mb-1">
            Estimated Delivery
          </span>
          {order.estimatedDelivery}
        </p>
        <p className="text-xs text-[#5d5f5f] font-light">
          This confirmation is stored on this device. Live payment was not taken.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mt-10 justify-center">
        <button
          type="button"
          onClick={() => onNavigate('new-arrivals')}
          className="bg-black text-white text-xs font-semibold uppercase px-8 py-4 tracking-[0.2em] hover:bg-neutral-800 cursor-pointer"
        >
          Continue Shopping
        </button>
        <button
          type="button"
          onClick={() => onNavigate('account')}
          className="border border-black text-black text-xs font-semibold uppercase px-8 py-4 tracking-[0.2em] hover:bg-[#eeeeee] cursor-pointer"
        >
          View My Orders
        </button>
      </div>
      {reviewItems.length > 0 && (
        <PostPurchaseReviewPopup
          orderId={order.id}
          items={reviewItems}
          onSkipProduct={(productId) => dismissReviewPrompt(order.id, productId)}
          onCloseRemaining={(remaining) => {
            dismissRemainingReviewPrompts(order.id, remaining);
            setReviewItems([]);
          }}
        />
      )}
    </main>
  );
};
