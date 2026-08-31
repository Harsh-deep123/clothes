import React, { useState } from 'react';
import { Heart, ChevronDown, Check, Ruler } from 'lucide-react';
import { Product } from '../types';
import { PRODUCTS } from '../data/products';

interface ProductDetailScreenProps {
  product: Product;
  onAddToCart: (product: Product, selectedColor: string, selectedSize: string) => void;
  onBuyNow: (product: Product, selectedColor: string, selectedSize: string) => void;
  onSelectProduct: (product: Product) => void;
  isWishlisted: boolean;
  onToggleWishlist: (productId: string) => void;
  onOpenSizeGuide: () => void;
}

export const ProductDetailScreen: React.FC<ProductDetailScreenProps> = ({
  product,
  onAddToCart,
  onBuyNow,
  onSelectProduct,
  isWishlisted,
  onToggleWishlist,
  onOpenSizeGuide,
}) => {
  const [selectedColor, setSelectedColor] = useState<string>(product.colors[0]?.name || 'Standard');
  const [selectedSize, setSelectedSize] = useState<string>(
    product.sizes.find((s) => s.available)?.size || product.sizes[0]?.size || 'M'
  );
  const [openAccordion, setOpenAccordion] = useState<{ [key: string]: boolean }>({
    description: true,
    details: true,
    shipping: false,
  });

  const toggleAccordion = (section: string) => {
    setOpenAccordion((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Cross-sell items for "Complete The Look"
  const completeTheLookProducts = PRODUCTS.filter(
    (p) =>
      p.id === 'poplin-structured-shirt' ||
      p.id === 'wide-leg-tailored-trousers' ||
      p.id === 'square-toe-chelsea-boots' ||
      p.id === 'linear-silver-cuff'
  );

  const imagesToDisplay = product.images.length >= 3 ? product.images : [
    product.images[0],
    product.images[1] || product.images[0],
    product.images[0]
  ];

  return (
    <main className="pt-24 md:pt-32 pb-24 max-w-[1440px] mx-auto px-5 md:px-16 w-full">
      {/* Product Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-14 mt-4 md:mt-8">
        {/* Left Column: Image Gallery (md:col-span-7) */}
        <div className="md:col-span-7 flex flex-col gap-4">
          {/* Main 3:4 Image */}
          <div className="w-full aspect-[3/4] bg-[#eeeeee] overflow-hidden border border-[#cfc4c5]/20">
            <img
              src={imagesToDisplay[0]}
              alt={`${product.name} Main View`}
              className="w-full h-full object-cover object-center"
            />
          </div>

          {/* 2 Detail Sub-images */}
          <div className="grid grid-cols-2 gap-4">
            <div className="w-full aspect-[3/4] bg-[#eeeeee] overflow-hidden border border-[#cfc4c5]/20">
              <img
                src={imagesToDisplay[1]}
                alt={`${product.name} Detail 1`}
                className="w-full h-full object-cover object-center"
              />
            </div>
            <div className="w-full aspect-[3/4] bg-[#eeeeee] overflow-hidden border border-[#cfc4c5]/20">
              <img
                src={imagesToDisplay[2]}
                alt={`${product.name} Detail 2`}
                className="w-full h-full object-cover object-center"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Sticky Product Purchase Form (md:col-span-5) */}
        <div className="md:col-span-5 md:pl-6 flex flex-col pt-4 md:pt-0 sticky top-32 h-fit">
          {/* Breadcrumb */}
          <div className="text-xs uppercase tracking-[0.15em] text-[#5d5f5f] mb-3 font-medium">
            {product.breadcrumb}
          </div>

          {/* Title & Price */}
          <h1 className="font-serif-luxury text-3xl sm:text-4xl md:text-5xl text-black mb-2 font-normal leading-tight">
            {product.name}
          </h1>
          <p className="text-xl md:text-2xl text-[#1a1c1c] font-medium mb-8">
            ${product.price.toFixed(2)}
          </p>

          {/* Color Selector */}
          <div className="mb-8">
            <p className="text-xs uppercase tracking-[0.15em] font-semibold text-black mb-3">
              Color: <span className="font-normal text-[#5d5f5f]">{selectedColor}</span>
            </p>
            <div className="flex gap-3 items-center">
              {product.colors.map((color) => {
                const isSelected = selectedColor === color.name;
                return (
                  <button
                    key={color.name}
                    id={`color-swatch-${color.name.toLowerCase().replace(/\s+/g, '-')}`}
                    onClick={() => setSelectedColor(color.name)}
                    aria-label={color.name}
                    className={`w-8 h-8 rounded-full transition-all cursor-pointer relative ${
                      isSelected
                        ? 'ring-2 ring-offset-2 ring-black scale-105'
                        : 'hover:scale-105 border border-[#cfc4c5]'
                    }`}
                    style={{ backgroundColor: color.hex }}
                  >
                    {isSelected && (
                      <span className="sr-only">Selected</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Size Selector */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-3">
              <p className="text-xs uppercase tracking-[0.15em] font-semibold text-black">
                Size
              </p>
              <button
                id="size-guide-btn"
                onClick={onOpenSizeGuide}
                className="text-xs uppercase tracking-[0.15em] text-[#5d5f5f] hover:text-black underline transition-colors cursor-pointer flex items-center gap-1"
              >
                <Ruler className="w-3.5 h-3.5" />
                <span>Size Guide</span>
              </button>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {product.sizes.map((s) => {
                const isSelected = selectedSize === s.size;
                const isAvailable = s.available;

                return (
                  <button
                    key={s.size}
                    id={`size-btn-${s.size}`}
                    disabled={!isAvailable}
                    onClick={() => setSelectedSize(s.size)}
                    className={`py-3.5 text-xs font-semibold uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                      !isAvailable
                        ? 'border border-[#cfc4c5]/40 text-[#cfc4c5] bg-[#f9f9f9] cursor-not-allowed opacity-50'
                        : isSelected
                        ? 'border border-black bg-black text-white'
                        : 'border border-[#cfc4c5] text-black hover:border-black bg-white'
                    }`}
                  >
                    {s.size}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions: Add to Bag & Buy Now */}
          <div className="flex flex-col gap-3 mb-10">
            <button
              id="add-to-bag-btn"
              onClick={() => onAddToCart(product, selectedColor, selectedSize)}
              className="w-full py-4 bg-black text-white text-xs uppercase tracking-[0.2em] font-semibold hover:bg-neutral-800 transition-colors cursor-pointer active:scale-[0.99]"
            >
              Add to Bag
            </button>
            <div className="flex gap-3">
              <button
                id="buy-now-btn"
                onClick={() => onBuyNow(product, selectedColor, selectedSize)}
                className="flex-1 py-4 border border-black text-black bg-transparent text-xs uppercase tracking-[0.2em] font-semibold hover:bg-[#eeeeee] transition-colors cursor-pointer active:scale-[0.99]"
              >
                Buy Now
              </button>
              <button
                id="detail-wishlist-btn"
                aria-label={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                onClick={() => onToggleWishlist(product.id)}
                className={`w-14 border border-[#cfc4c5] flex items-center justify-center transition-colors cursor-pointer active:scale-95 ${
                  isWishlisted ? 'bg-black text-white border-black' : 'text-black hover:border-black'
                }`}
              >
                <Heart
                  className="w-5 h-5"
                  fill={isWishlisted ? '#ffffff' : 'transparent'}
                />
              </button>
            </div>
          </div>

          {/* Accordions */}
          <div className="border-t border-[#cfc4c5]/30 divide-y divide-[#cfc4c5]/30">
            {/* Description */}
            <div className="py-4">
              <button
                onClick={() => toggleAccordion('description')}
                className="flex justify-between items-center w-full text-left text-xs uppercase tracking-[0.15em] font-semibold text-black cursor-pointer"
              >
                <span>Description</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    openAccordion.description ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openAccordion.description && (
                <div className="pt-3 text-sm text-[#5d5f5f] leading-relaxed font-light">
                  {product.description}
                </div>
              )}
            </div>

            {/* Details & Care */}
            <div className="py-4">
              <button
                onClick={() => toggleAccordion('details')}
                className="flex justify-between items-center w-full text-left text-xs uppercase tracking-[0.15em] font-semibold text-black cursor-pointer"
              >
                <span>Details & Care</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    openAccordion.details ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openAccordion.details && (
                <div className="pt-3 text-sm text-[#5d5f5f] leading-relaxed">
                  <ul className="list-disc pl-5 space-y-1.5 font-light">
                    {product.detailsAndCare.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Shipping & Returns */}
            <div className="py-4">
              <button
                onClick={() => toggleAccordion('shipping')}
                className="flex justify-between items-center w-full text-left text-xs uppercase tracking-[0.15em] font-semibold text-black cursor-pointer"
              >
                <span>Shipping & Returns</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    openAccordion.shipping ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openAccordion.shipping && (
                <div className="pt-3 text-sm text-[#5d5f5f] leading-relaxed font-light">
                  {product.shippingAndReturns}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Complete The Look Section */}
      <section className="mt-24 md:mt-32 pt-16 border-t border-[#cfc4c5]/30">
        <h2 className="font-serif-luxury text-3xl md:text-4xl text-black mb-12 text-center md:text-left font-normal">
          Complete The Look
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {completeTheLookProducts.map((item) => (
            <div
              key={item.id}
              id={`complete-look-${item.id}`}
              onClick={() => onSelectProduct(item)}
              className="group cursor-pointer flex flex-col"
            >
              <div className="w-full aspect-[3/4] bg-[#eeeeee] mb-4 overflow-hidden border border-[#cfc4c5]/20">
                <img
                  src={item.images[0]}
                  alt={item.name}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-in-out"
                />
              </div>
              <h3 className="text-sm font-medium text-black mb-1 group-hover:underline underline-offset-4">
                {item.name}
              </h3>
              <p className="text-sm text-[#5d5f5f]">${item.price.toFixed(2)}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
};
