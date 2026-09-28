import React from 'react';
import { Minus, Plus, ShoppingBag } from 'lucide-react';
import { CartItem, ViewScreen } from '../../types';
import { formatINR } from '../../lib/money';
import { ONE_SIZE, imagesForColor } from '../../catalog';
import type { DeliveryQuote } from '../../lib/delivery';
import { CartBillDetails } from '../CartBillDetails';

interface BagPageProps {
  items: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onCheckout: () => void;
  onNavigate: (screen: ViewScreen, category?: string) => void;
  quote: DeliveryQuote;
}

export const BagPage: React.FC<BagPageProps> = ({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  onNavigate,
  quote,
}) => {
  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const discountAmount = 0;

  return (
    <main className="flex-grow pt-28 md:pt-36 px-5 md:px-16 max-w-[1440px] mx-auto w-full pb-20 md:pb-28">
      <h1 className="font-serif-luxury text-3xl sm:text-5xl md:text-6xl tracking-tight uppercase text-black font-normal mb-10 md:mb-14">
        YOUR BAG
      </h1>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border border-[#cfc4c5]/30 bg-white">
          <div className="w-16 h-16 bg-[#f3f3f4] flex items-center justify-center mb-4">
            <ShoppingBag className="w-8 h-8 text-[#5d5f5f] stroke-[1.2]" />
          </div>
          <h2 className="font-serif-luxury text-2xl text-black mb-3">Your Bag is Empty</h2>
          <p className="text-sm text-[#5d5f5f] max-w-xs mb-8 font-light">
            Explore the collection and add pieces when you are ready.
          </p>
          <button
            type="button"
            onClick={() => onNavigate('new-arrivals')}
            className="bg-black text-white px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.2em] hover:bg-neutral-800"
          >
            Continue Shopping
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
          <div className="lg:col-span-7 space-y-6">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex gap-5 pb-6 border-b border-[#cfc4c5]/20"
              >
                <div className="w-24 sm:w-28 h-32 sm:h-36 flex-shrink-0 bg-[#f3f3f4] overflow-hidden border border-[#cfc4c5]/20">
                  <img
                    src={imagesForColor(item.product, item.selectedColor)[0]}
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex flex-col justify-between flex-grow min-w-0">
                  <div>
                    <div className="flex justify-between gap-3">
                      <h2 className="text-base text-black font-medium">{item.product.name}</h2>
                      <span className="font-semibold shrink-0">{formatINR(item.price * item.quantity)}</span>
                    </div>
                    <p className="text-sm text-[#5d5f5f] mt-1">Color: {item.selectedColor}</p>
                    {item.selectedSize !== ONE_SIZE && (
                      <p className="text-sm text-[#5d5f5f]">Size: {item.selectedSize}</p>
                    )}
                  </div>
                  <div className="flex justify-between items-center pt-3">
                    <div className="flex items-center border border-[#cfc4c5]">
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.id, -1)}
                        className="p-2 hover:bg-[#f9f9f9] cursor-pointer"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-3 text-sm">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.id, 1)}
                        className="p-2 hover:bg-[#f9f9f9] cursor-pointer"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.id)}
                      className="text-xs uppercase tracking-wider text-[#5d5f5f] hover:text-black cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <aside className="lg:col-span-5">
            <div className="bg-white border border-[#cfc4c5]/30 p-6 md:p-8">
              <h2 className="font-serif-luxury text-2xl text-black mb-6">Order Summary</h2>
              <div className="space-y-3 text-sm text-[#5d5f5f]">
                <CartBillDetails
                  itemsTotal={subtotal}
                  quote={quote}
                  discount={discountAmount}
                  showDiscount
                  size="summary"
                />
              </div>
              <button
                type="button"
                onClick={onCheckout}
                disabled={!quote.available}
                className="mt-8 w-full bg-black text-white text-xs font-semibold uppercase py-4 tracking-[0.2em] hover:bg-neutral-800 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Proceed to Checkout
              </button>
              <button
                type="button"
                onClick={() => onNavigate('new-arrivals')}
                className="mt-4 w-full text-xs uppercase tracking-[0.15em] text-[#5d5f5f] hover:text-black cursor-pointer"
              >
                Continue Shopping
              </button>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
};
