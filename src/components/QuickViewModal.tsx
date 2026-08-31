import React, { useState } from 'react';
import { X, ArrowRight, Heart, Check } from 'lucide-react';
import { Product } from '../types';

interface QuickViewModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, selectedColor: string, selectedSize: string) => void;
  onViewFullDetails: (product: Product) => void;
  isWishlisted: boolean;
  onToggleWishlist: (productId: string) => void;
}

export const QuickViewModal: React.FC<QuickViewModalProps> = ({
  product,
  onClose,
  onAddToCart,
  onViewFullDetails,
  isWishlisted,
  onToggleWishlist,
}) => {
  if (!product) return null;

  const [selectedColor, setSelectedColor] = useState<string>(product.colors[0]?.name || 'Standard');
  const [selectedSize, setSelectedSize] = useState<string>(
    product.sizes.find((s) => s.available)?.size || product.sizes[0]?.size || 'M'
  );

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        id="quickview-backdrop"
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
      />

      {/* Modal Dialog */}
      <div
        id="quickview-modal"
        className="relative bg-white w-full max-w-3xl overflow-hidden shadow-2xl border border-[#cfc4c5]/30 z-10 max-h-[90vh] flex flex-col md:flex-row animate-scale-in"
      >
        <button
          id="close-quickview-btn"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 z-20 bg-white/80 p-2 rounded-full text-black hover:bg-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Left: Product Image */}
        <div className="w-full md:w-1/2 aspect-[3/4] md:aspect-auto bg-[#eeeeee] relative overflow-hidden">
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Right: Info & Purchase Controls */}
        <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="text-[11px] uppercase tracking-[0.2em] text-[#5d5f5f] mb-1 font-semibold">
              {product.categoryLabel}
            </div>
            <h2 className="font-serif-luxury text-2xl md:text-3xl text-black font-normal mb-2">
              {product.name}
            </h2>
            <p className="text-lg font-semibold text-black mb-4">
              ${product.price.toFixed(2)}
            </p>
            <p className="text-xs text-[#5d5f5f] leading-relaxed mb-6 font-light line-clamp-3">
              {product.description}
            </p>

            {/* Colors */}
            <div className="mb-5">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-black block mb-2">
                Color: {selectedColor}
              </span>
              <div className="flex gap-2">
                {product.colors.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => setSelectedColor(c.name)}
                    className={`w-7 h-7 rounded-full border transition-all ${
                      selectedColor === c.name
                        ? 'ring-2 ring-black ring-offset-2 scale-105'
                        : 'border-[#cfc4c5]'
                    }`}
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
              </div>
            </div>

            {/* Sizes */}
            <div className="mb-6">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-black block mb-2">
                Size
              </span>
              <div className="grid grid-cols-4 gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s.size}
                    disabled={!s.available}
                    onClick={() => setSelectedSize(s.size)}
                    className={`py-2 text-xs uppercase tracking-wider border text-center transition-colors ${
                      !s.available
                        ? 'opacity-40 border-[#cfc4c5]/40 cursor-not-allowed'
                        : selectedSize === s.size
                        ? 'bg-black text-white border-black font-semibold'
                        : 'border-[#cfc4c5] hover:border-black'
                    }`}
                  >
                    {s.size}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-[#cfc4c5]/20">
            <button
              onClick={() => {
                onAddToCart(product, selectedColor, selectedSize);
                onClose();
              }}
              className="w-full py-3.5 bg-black text-white text-xs uppercase tracking-[0.2em] font-semibold hover:bg-neutral-800 transition-colors"
            >
              Add to Bag • ${product.price}
            </button>
            <button
              onClick={() => {
                onClose();
                onViewFullDetails(product);
              }}
              className="w-full py-3 border border-black text-black text-xs uppercase tracking-[0.15em] font-semibold hover:bg-[#eeeeee] transition-colors flex items-center justify-center gap-2"
            >
              <span>View Full Editorial</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
