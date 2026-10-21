import React, { useEffect, useMemo, useState } from 'react';
import { Heart, ChevronDown, Ruler } from 'lucide-react';
import { Product, ProductDesign } from '../types';
import { getStorefrontProducts, imagesForColor, priceForSize, productDesigns, productHasColors, productHasSizes, returnPolicyNote } from '../catalog';
import { formatINR } from '../lib/money';
import { ProductPrice } from './ProductPrice';
import { ProductRatingSummary } from './ProductRatingSummary';
import { ProductReviewsSection } from './reviews/ProductReviewsSection';
import { AmazonLensZoom } from './ImageLightbox';

interface ProductDetailScreenProps {
  product: Product;
  onAddToCart: (product: Product, selectedColor: string, selectedSize: string, design?: ProductDesign) => void;
  onBuyNow: (product: Product, selectedColor: string, selectedSize: string, design?: ProductDesign) => void;
  onSelectProduct: (product: Product) => void;
  isWishlisted: boolean;
  onToggleWishlist: (productId: string) => void;
  onOpenSizeGuide: () => void;
  onRequestSignIn?: () => void;
}

export const ProductDetailScreen: React.FC<ProductDetailScreenProps> = ({
  product,
  onAddToCart,
  onBuyNow,
  onSelectProduct,
  isWishlisted,
  onToggleWishlist,
  onOpenSizeGuide,
  onRequestSignIn,
}) => {
  const [selectedColor, setSelectedColor] = useState<string>(product.colors[0]?.name || 'Standard');
  const [selectedSize, setSelectedSize] = useState<string>(
    product.sizes.find((s) => s.available)?.size || product.sizes[0]?.size || 'M'
  );
  const designOptions = useMemo(() => productDesigns(product), [product]);
  const [selectedDesignId, setSelectedDesignId] = useState<string>(designOptions[0]?.id || '');
  const selectedDesign = designOptions.find((design) => design.id === selectedDesignId) || designOptions[0];
  const designColors = useMemo(() => {
    const seen = new Set<string>();
    return designOptions.flatMap((design) => {
      const name = design.color?.trim();
      if (!name || seen.has(name.toLowerCase())) return [];
      seen.add(name.toLowerCase());
      const match = product.colors.find((color) => color.name.trim().toLowerCase() === name.toLowerCase());
      return [{ name, hex: match?.hex || '#d4d4d8', designId: design.id }];
    });
  }, [designOptions, product.colors]);
  const purchaseColor = selectedDesign?.color?.trim() || selectedColor;
  const [openAccordion, setOpenAccordion] = useState<{ [key: string]: boolean }>({
    description: true,
    details: true,
    shipping: false,
  });

  const toggleAccordion = (section: string) => {
    setOpenAccordion((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Cross-sell items for "Complete The Look"
  const completeTheLookProducts = getStorefrontProducts().filter(
    (p) =>
      p.id === 'poplin-structured-shirt' ||
      p.id === 'wide-leg-tailored-trousers' ||
      p.id === 'square-toe-chelsea-boots' ||
      p.id === 'linear-silver-cuff'
  );

  const zoomGallery = useMemo(() => {
    const photos = Array.from(new Set(imagesForColor(product, selectedColor).filter(Boolean)));
    if (!selectedDesign?.image) return photos;
    return [selectedDesign.image, ...photos.filter((src) => src !== selectedDesign.image)];
  }, [product, selectedColor, selectedDesign]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const outOfStock = product.sizes.every((s) => !s.available);
  const activeImage = zoomGallery[Math.min(activeImageIndex, Math.max(zoomGallery.length - 1, 0))] || zoomGallery[0];
  const selectedPrice = priceForSize(product, selectedSize);
  const sameMrp = selectedPrice.originalPrice && selectedPrice.originalPrice > selectedPrice.price
    ? selectedPrice.originalPrice
    : selectedPrice.price;

  useEffect(() => {
    setSelectedDesignId(productDesigns(product)[0]?.id || '');
  }, [product.id]);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [selectedColor, selectedDesignId, product.id]);

  return (
    <main className="pt-24 md:pt-32 pb-24 max-w-[1440px] mx-auto px-5 md:px-16 w-full">
      {/* Product Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-14 mt-4 md:mt-8">
        {/* Left Column: Image Gallery (Amazon-style lens zoom) */}
        <div className="md:col-span-5 relative z-20">
          {activeImage && (
            <AmazonLensZoom
              images={zoomGallery}
              alt={`${product.name} view`}
              activeIndex={activeImageIndex}
              onSelect={setActiveImageIndex}
            />
          )}

          {designOptions.length > 0 && selectedDesign && (
            <div className="mt-6 max-w-[440px]">
              <p className="text-xs uppercase tracking-[0.18em] font-semibold text-black mb-1">Designs</p>
              <p className="text-xs text-[#5d5f5f] mb-3">Same style, more looks. Pick one before you order.</p>
              <div className="grid grid-cols-3 gap-3">
                {designOptions.map((design) => {
                  const isSelected = selectedDesign.id === design.id;
                  return (
                    <button
                      key={design.id}
                      type="button"
                      onClick={() => {
                        setSelectedDesignId(design.id);
                        if (design.color?.trim()) setSelectedColor(design.color.trim());
                      }}
                      aria-label={design.name}
                      aria-pressed={isSelected}
                      className={`text-left bg-white overflow-hidden cursor-pointer transition-all ${
                        isSelected ? 'ring-2 ring-black' : 'ring-1 ring-[#e4e4e7] hover:ring-black'
                      }`}
                    >
                      <img src={design.image} alt="" className="w-full aspect-[3/4] object-cover bg-[#f3f3f4]" />
                      <span className="block px-2 pt-2 text-[11px] leading-tight text-black truncate">{design.color?.trim() || design.name}</span>
                      <span className="block px-2 text-[10px] font-mono text-[#5d5f5f] truncate">{design.id}</span>
                      <span className="block px-2 pb-2 text-[10px] text-[#5d5f5f]">
                        M.R.P. <span className={sameMrp > selectedPrice.price ? 'line-through' : ''}>{formatINR(sameMrp)}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Sticky Product Purchase Form */}
        <div className="md:col-span-7 md:pl-6 flex flex-col pt-4 md:pt-0 sticky top-32 h-fit">
          {/* Breadcrumb */}
          <div className="text-xs uppercase tracking-[0.15em] text-[#5d5f5f] mb-3 font-medium">
            {product.breadcrumb}
          </div>

          {/* Title & Price */}
          <h1 className="font-serif-luxury text-3xl sm:text-4xl md:text-5xl text-black mb-2 font-normal leading-tight">
            {product.name}
          </h1>
          {product.isSale && (
            <span className="self-start w-fit mb-3 bg-[#ba1a1a] text-white text-[10px] uppercase font-bold tracking-widest px-2 py-0.5">
              Sale
            </span>
          )}
          <div className="mb-3">
            <ProductPrice product={product} size={selectedSize} className="text-xl md:text-2xl" />
          </div>
          <ProductRatingSummary productId={product.id} showEmpty linkToReviews className="mb-8" />

          {/* Color Selector */}
          {designColors.length > 0 && (
          <div className="mb-8">
            <p className="text-xs uppercase tracking-[0.15em] font-semibold text-black mb-3">
              Color: <span className="font-normal text-[#5d5f5f]">{purchaseColor}</span>
            </p>
            <div className="flex gap-3 items-center">
              {designColors.map((color) => {
                const isSelected = purchaseColor.toLowerCase() === color.name.toLowerCase();
                return (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => {
                      setSelectedColor(color.name);
                      setSelectedDesignId(color.designId);
                    }}
                    aria-label={color.name}
                    title={color.name}
                    className={`w-8 h-8 rounded-full transition-all cursor-pointer ${
                      isSelected
                        ? 'ring-2 ring-offset-2 ring-black scale-105'
                        : 'hover:scale-105 border border-[#cfc4c5]'
                    }`}
                    style={{ backgroundColor: color.hex }}
                  />
                );
              })}
            </div>
          </div>
          )}
          {designColors.length === 0 && productHasColors(product) && (
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
          )}

          {/* Size Selector */}
          {productHasSizes(product) && (
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

            <div className="flex flex-wrap gap-3">
              {product.sizes.map((s) => {
                const isSelected = selectedSize === s.size;
                const isAvailable = s.available;
                const sizePrice = priceForSize(product, s.size).price;

                return (
                  <button
                    key={s.size}
                    id={`size-btn-${s.size}`}
                    disabled={!isAvailable}
                    onClick={() => setSelectedSize(s.size)}
                    className={`min-w-[4.25rem] px-3 py-2.5 text-center transition-all duration-150 cursor-pointer ${
                      !isAvailable
                        ? 'border border-[#cfc4c5]/40 text-[#cfc4c5] bg-[#f9f9f9] cursor-not-allowed opacity-50 line-through'
                        : isSelected
                        ? 'border border-black bg-black text-white'
                        : 'border border-[#cfc4c5] text-black hover:border-black bg-white'
                    }`}
                  >
                    <span className="block text-xs font-semibold uppercase tracking-wider">{s.size}</span>
                    <span className={`block text-[10px] mt-1 ${isSelected && isAvailable ? 'text-white/80' : 'text-[#5d5f5f]'}`}>
                      {formatINR(sizePrice)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          )}

          {/* Actions: Add to Bag & Buy Now */}
          <div className="flex flex-col gap-3 mb-10">
            {selectedDesign && (
              <p className="text-xs text-[#5d5f5f]">
                Color: <span className="text-black">{purchaseColor}</span>
                <span className="font-mono"> · {selectedDesign.id}</span>
                <span> · M.R.P. {formatINR(sameMrp)}</span>
              </p>
            )}
            {outOfStock && (
              <p className="text-xs uppercase tracking-[0.15em] text-[#ba1a1a] font-semibold">Out of stock</p>
            )}
            <button
              id="add-to-bag-btn"
              disabled={outOfStock}
              onClick={() => onAddToCart(product, purchaseColor, selectedSize, selectedDesign)}
              className="w-full py-4 bg-black text-white text-xs uppercase tracking-[0.2em] font-semibold hover:bg-neutral-800 transition-colors cursor-pointer active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Add to Bag
            </button>
            <div className="flex gap-3">
              <button
                id="buy-now-btn"
                disabled={outOfStock}
                onClick={() => onBuyNow(product, purchaseColor, selectedSize, selectedDesign)}
                className="flex-1 py-4 border border-black text-black bg-transparent text-xs uppercase tracking-[0.2em] font-semibold hover:bg-[#eeeeee] transition-colors cursor-pointer active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed"
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
                  {returnPolicyNote(product.returnPolicy) && (
                    <p className="mb-2 font-medium text-[#ba1a1a]">{returnPolicyNote(product.returnPolicy)}</p>
                  )}
                  {product.shippingAndReturns}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ProductReviewsSection
        productId={product.id}
        productName={product.name}
        productImage={product.images[0]}
        onRequestSignIn={onRequestSignIn}
      />

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
              <p className="text-sm text-[#5d5f5f]">
                <ProductPrice product={item} decimals />
              </p>
            </div>
          ))}
        </div>
      </section>

    </main>
  );
};
