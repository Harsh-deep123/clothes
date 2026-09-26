import React from 'react';
import { formatINR } from '../lib/money';
import type { DeliveryQuote } from '../lib/delivery';
import { cartGrandTotal } from '../lib/delivery';

interface CartBillDetailsProps {
  itemsTotal: number;
  quote: DeliveryQuote;
  discount?: number;
  showDiscount?: boolean;
  size?: 'drawer' | 'summary' | 'checkout';
}

export const CartBillDetails: React.FC<CartBillDetailsProps> = ({
  itemsTotal,
  quote,
  discount = 0,
  showDiscount = false,
  size = 'summary',
}) => {
  const grandTotal = cartGrandTotal(itemsTotal, quote, discount);
  const row =
    size === 'drawer'
      ? 'flex justify-between items-center text-sm text-[#5d5f5f]'
      : size === 'checkout'
        ? 'flex justify-between'
        : 'flex justify-between';
  const valueClass = 'text-black font-medium';

  return (
    <div
      className={
        size === 'drawer'
          ? 'space-y-2.5'
          : size === 'checkout'
            ? 'space-y-2 text-xs text-[#5d5f5f]'
            : 'space-y-3 text-sm text-[#5d5f5f]'
      }
    >
      <div className={row}>
        <span>Items Total</span>
        <span className={valueClass}>{formatINR(itemsTotal, true)}</span>
      </div>
      <div className={row}>
        <span>Delivery Charge</span>
        <span className={quote.available ? valueClass : 'text-[#ba1a1a] font-medium'}>
          {quote.available ? formatINR(quote.deliveryCharge, true) : quote.message}
        </span>
      </div>
      <div className={row}>
        <span>Handling Charge</span>
        <span className={valueClass}>{formatINR(quote.handlingCharge, true)}</span>
      </div>
      {showDiscount && (
        <div className={row}>
          <span>Discount</span>
          <span className={valueClass}>{formatINR(discount, true)}</span>
        </div>
      )}
      {size === 'drawer' ? (
        <div className="flex justify-between items-center pt-3 border-t border-[#cfc4c5]/20">
          <span className="font-serif-luxury text-2xl text-black font-normal">Grand Total</span>
          <span className="font-serif-luxury text-2xl text-black font-normal">
            {formatINR(grandTotal, true)}
          </span>
        </div>
      ) : size === 'checkout' ? (
        <div className="flex justify-between font-semibold text-black text-sm pt-3 border-t border-[#cfc4c5]/30">
          <span>Grand Total</span>
          <span>{formatINR(grandTotal, true)}</span>
        </div>
      ) : (
        <div className="flex justify-between text-base font-semibold text-black pt-4 border-t border-[#cfc4c5]/30">
          <span>Grand Total</span>
          <span>{formatINR(grandTotal, true)}</span>
        </div>
      )}
    </div>
  );
};
