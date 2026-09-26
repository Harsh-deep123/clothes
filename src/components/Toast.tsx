import React from 'react';
import { ShoppingBag, Heart, Check } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'cart' | 'wishlist' | 'info';
  onClose: () => void;
  onOpenCart?: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'cart',
  onClose,
  onOpenCart,
}) => {
  return (
    <div
      id="luxury-toast"
      className="fixed bottom-6 right-6 z-[100] bg-black text-white px-5 py-3.5 shadow-2xl border border-white/20 flex items-center gap-3.5 animate-slide-up text-xs font-medium uppercase tracking-wider"
    >
      {type === 'cart' ? (
        <ShoppingBag className="w-4 h-4 text-white" />
      ) : type === 'wishlist' ? (
        <Heart className="w-4 h-4 text-white" fill="white" />
      ) : (
        <Check className="w-4 h-4 text-white" />
      )}

      <span>{message}</span>

      {onOpenCart && type === 'cart' && (
        <button
          onClick={onOpenCart}
          className="ml-2 underline underline-offset-4 hover:opacity-80 font-bold"
        >
          View Bag
        </button>
      )}

      <button
        onClick={onClose}
        className="ml-2 text-white/60 hover:text-white"
      >
        ✕
      </button>
    </div>
  );
};
