import React from 'react';
import { X, ArrowRight, Minus, Plus, ShoppingBag } from 'lucide-react';
import { CartItem } from '../types';

interface ShoppingBagDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onCheckout: () => void;
  onNavigateHome: () => void;
}

export const ShoppingBagDrawer: React.FC<ShoppingBagDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  onNavigateHome,
}) => {
  if (!isOpen) return null;

  const totalItemsCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <>
      {/* Drawer Overlay */}
      <div
        id="cart-overlay"
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] transition-opacity duration-300 animate-fade-in"
      />

      {/* Shopping Bag Drawer (Slide from Right) */}
      <aside
        id="cart-drawer"
        className="fixed top-0 right-0 h-full w-full sm:w-[480px] bg-white z-[70] shadow-2xl flex flex-col border-l border-[#cfc4c5]/30 transform translate-x-0 transition-transform duration-300 ease-out"
      >
        {/* Drawer Header */}
        <div className="flex justify-between items-center px-6 py-6 border-b border-[#cfc4c5]/20 bg-white sticky top-0 z-10">
          <h2 className="font-serif-luxury text-2xl md:text-3xl text-black font-normal tracking-tight">
            Shopping Bag ({totalItemsCount})
          </h2>
          <button
            id="close-cart-btn"
            onClick={onClose}
            aria-label="Close Shopping Bag"
            className="p-2 text-[#5d5f5f] hover:text-black transition-colors cursor-pointer active:scale-95 -mr-2"
          >
            <X className="w-5 h-5 stroke-[1.5]" />
          </button>
        </div>

        {/* Items List */}
        <div className="flex-grow overflow-y-auto px-6 py-6 space-y-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-[#f3f3f4] flex items-center justify-center mb-4">
                <ShoppingBag className="w-8 h-8 text-[#5d5f5f] stroke-[1.2]" />
              </div>
              <h3 className="font-serif-luxury text-xl text-black mb-2">Your Bag is Empty</h3>
              <p className="text-sm text-[#5d5f5f] max-w-xs mb-8">
                Explore our curated editorial collection and discover timeless tailoring.
              </p>
              <button
                id="cart-empty-shop-btn"
                onClick={() => {
                  onClose();
                  onNavigateHome();
                }}
                className="bg-black text-white px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.2em] hover:bg-neutral-800 transition-colors"
              >
                Shop New Arrivals
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                id={`cart-item-${item.id}`}
                className="flex gap-5 pb-6 border-b border-[#cfc4c5]/20 group"
              >
                {/* Product Thumbnail */}
                <div className="w-24 sm:w-28 h-32 sm:h-36 flex-shrink-0 bg-[#f3f3f4] relative overflow-hidden border border-[#cfc4c5]/20">
                  <img
                    src={item.product.images[0]}
                    alt={item.product.name}
                    className="w-full h-full object-cover mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
                  />
                </div>

                {/* Product Metadata & Stepper */}
                <div className="flex flex-col justify-between flex-grow">
                  <div>
                    <div className="flex justify-between items-start mb-1 gap-2">
                      <h3 className="text-base text-black font-medium leading-snug">
                        {item.product.name}
                      </h3>
                      <span className="text-base text-black font-semibold shrink-0">
                        ${item.price * item.quantity}
                      </span>
                    </div>
                    <p className="text-sm text-[#5d5f5f] mb-2.5">
                      {item.selectedColor}
                    </p>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="border border-[#cfc4c5] px-2 py-0.5 text-[11px] uppercase font-medium tracking-wider text-[#5d5f5f] bg-[#f9f9f9]">
                        Size: {item.selectedSize}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    {/* Stepper */}
                    <div className="flex items-center border border-[#cfc4c5]">
                      <button
                        id={`decrease-qty-${item.id}`}
                        onClick={() => onUpdateQuantity(item.id, -1)}
                        aria-label="Decrease quantity"
                        className="px-2.5 py-1 text-[#5d5f5f] hover:text-black hover:bg-[#f3f3f4] transition-colors active:scale-95 cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span
                        id={`qty-count-${item.id}`}
                        className="px-3.5 py-1 text-sm text-black border-x border-[#cfc4c5] font-medium min-w-[32px] text-center"
                      >
                        {item.quantity}
                      </span>
                      <button
                        id={`increase-qty-${item.id}`}
                        onClick={() => onUpdateQuantity(item.id, 1)}
                        aria-label="Increase quantity"
                        className="px-2.5 py-1 text-[#5d5f5f] hover:text-black hover:bg-[#f3f3f4] transition-colors active:scale-95 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Remove Action */}
                    <button
                      id={`remove-item-${item.id}`}
                      onClick={() => onRemoveItem(item.id)}
                      className="text-xs text-[#5d5f5f] hover:text-[#ba1a1a] transition-colors underline underline-offset-4 cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer Summary & Checkout */}
        {items.length > 0 && (
          <div className="border-t border-[#cfc4c5]/20 bg-white px-6 py-6 space-y-5">
            <div className="space-y-2.5">
              <div className="flex justify-between items-center text-sm text-[#5d5f5f]">
                <span>Subtotal</span>
                <span className="text-black font-medium">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm text-[#5d5f5f]">
                <span>Shipping</span>
                <span className="text-black font-medium">Complimentary</span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-[#cfc4c5]/20">
                <span className="font-serif-luxury text-2xl text-black font-normal">
                  Total
                </span>
                <span className="font-serif-luxury text-2xl text-black font-normal">
                  ${subtotal.toFixed(2)}
                </span>
              </div>
              <p className="text-[11px] text-[#5d5f5f] tracking-wide text-right">
                Taxes calculated at checkout
              </p>
            </div>

            <button
              id="proceed-checkout-btn"
              onClick={onCheckout}
              className="w-full bg-black text-white text-xs uppercase tracking-[0.2em] font-semibold py-4 flex items-center justify-center gap-2 hover:bg-neutral-800 transition-colors cursor-pointer active:scale-[0.99]"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </aside>
    </>
  );
};
