import React, { useState, useMemo } from 'react';
import { SlidersHorizontal, Heart, ChevronDown, Check, X } from 'lucide-react';
import { PRODUCTS } from '../data/products';
import { Product } from '../types';

interface NewArrivalsScreenProps {
  onSelectProduct: (product: Product) => void;
  onQuickView: (product: Product) => void;
  wishlist: string[];
  onToggleWishlist: (productId: string) => void;
  categoryFilter?: string | null;
}

export const NewArrivalsScreen: React.FC<NewArrivalsScreenProps> = ({
  onSelectProduct,
  onQuickView,
  wishlist,
  onToggleWishlist,
  categoryFilter,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryFilter || 'all');
  const [selectedSize, setSelectedSize] = useState<string>('all');
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc'>('newest');
  const [showFilterDrawer, setShowFilterDrawer] = useState<boolean>(false);
  const [visibleCount, setVisibleCount] = useState<number>(6);

  // Sync category filter if changed from prop
  React.useEffect(() => {
    if (categoryFilter) {
      setSelectedCategory(categoryFilter);
    }
  }, [categoryFilter]);

  const categories = [
    { label: 'All Categories', value: 'all' },
    { label: 'Jackets & Outerwear', value: 'jackets' },
    { label: 'T-Shirts', value: 't-shirts' },
    { label: 'Shirts', value: 'shirts' },
    { label: 'Jeans', value: 'jeans' },
    { label: 'Bottomwear', value: 'bottomwear' },
    { label: 'Footwear', value: 'shoes' },
    { label: 'Accessories', value: 'accessories' },
  ];

  const sizes = ['all', 'S', 'M', 'L', 'XL', '30', '32', '34', '15.5', '16.0'];

  const priceRanges = [
    { label: 'All Prices', value: 'all' },
    { label: 'Under $150', value: 'under-150' },
    { label: '$150 - $300', value: '150-300' },
    { label: 'Over $300', value: 'over-300' },
  ];

  const filteredProducts = useMemo(() => {
    let list = [...PRODUCTS];

    // Category filter
    if (selectedCategory && selectedCategory !== 'all') {
      if (selectedCategory === 'sale') {
        list = list.filter((p) => p.isSale || p.price <= 150);
      } else {
        list = list.filter((p) => p.category === selectedCategory);
      }
    }

    // Size filter
    if (selectedSize !== 'all') {
      list = list.filter((p) => p.sizes.some((s) => s.size === selectedSize && s.available));
    }

    // Price range filter
    if (selectedPriceRange === 'under-150') {
      list = list.filter((p) => p.price < 150);
    } else if (selectedPriceRange === '150-300') {
      list = list.filter((p) => p.price >= 150 && p.price <= 300);
    } else if (selectedPriceRange === 'over-300') {
      list = list.filter((p) => p.price > 300);
    }

    // Sorting
    if (sortBy === 'newest') {
      list.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
    } else if (sortBy === 'price-asc') {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      list.sort((a, b) => b.price - a.price);
    }

    return list;
  }, [selectedCategory, selectedSize, selectedPriceRange, sortBy]);

  const activeFilterCount =
    (selectedCategory !== 'all' ? 1 : 0) +
    (selectedSize !== 'all' ? 1 : 0) +
    (selectedPriceRange !== 'all' ? 1 : 0);

  const resetFilters = () => {
    setSelectedCategory('all');
    setSelectedSize('all');
    setSelectedPriceRange('all');
  };

  const displayedProducts = filteredProducts.slice(0, visibleCount);

  return (
    <main className="flex-grow pt-28 md:pt-36 px-5 md:px-16 max-w-[1440px] mx-auto w-full">
      {/* Page Header */}
      <div className="mb-10 md:mb-14 text-center md:text-left">
        <h1
          id="new-arrivals-heading"
          className="font-serif-luxury text-3xl sm:text-5xl md:text-6xl tracking-tight uppercase text-black font-normal"
        >
          {selectedCategory === 'all'
            ? 'New Arrivals'
            : categories.find((c) => c.value === selectedCategory)?.label || 'Collection'}
        </h1>
        <p className="text-base sm:text-lg text-[#5d5f5f] mt-3 md:mt-4 max-w-2xl font-light">
          Discover the latest additions to our collection. Minimalist design meets premium craftsmanship.
        </p>
      </div>

      {/* Utility Bar: Filters & Sorting */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center py-5 border-y border-[#cfc4c5]/30 mb-10 gap-4">
        {/* Left: Filter Trigger & Quick Pills */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button
            id="open-filter-btn"
            onClick={() => setShowFilterDrawer(true)}
            className="flex items-center gap-2 border border-black px-4 py-2 hover:bg-[#eeeeee] transition-colors text-xs font-semibold uppercase tracking-wider cursor-pointer active:scale-95"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filter</span>
            {activeFilterCount > 0 && (
              <span className="ml-1 bg-black text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Category Dropdown Pill */}
          <div className="hidden sm:flex items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border border-[#cfc4c5] px-3 py-1.5 text-xs text-[#1a1c1c] hover:border-black transition-colors bg-transparent cursor-pointer uppercase tracking-wider focus:outline-none"
            >
              {categories.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>

            <select
              value={selectedSize}
              onChange={(e) => setSelectedSize(e.target.value)}
              className="border border-[#cfc4c5] px-3 py-1.5 text-xs text-[#1a1c1c] hover:border-black transition-colors bg-transparent cursor-pointer uppercase tracking-wider focus:outline-none"
            >
              <option value="all">Size: All</option>
              {sizes.filter((s) => s !== 'all').map((s) => (
                <option key={s} value={s}>
                  Size: {s}
                </option>
              ))}
            </select>

            <select
              value={selectedPriceRange}
              onChange={(e) => setSelectedPriceRange(e.target.value)}
              className="border border-[#cfc4c5] px-3 py-1.5 text-xs text-[#1a1c1c] hover:border-black transition-colors bg-transparent cursor-pointer uppercase tracking-wider focus:outline-none"
            >
              {priceRanges.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {activeFilterCount > 0 && (
            <button
              onClick={resetFilters}
              className="text-xs text-[#5d5f5f] hover:text-black underline underline-offset-4 cursor-pointer ml-2"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Right: Sorting */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <label htmlFor="sort-select" className="text-xs uppercase tracking-wider text-[#5d5f5f] hidden md:block">
            Sort by:
          </label>
          <div className="relative w-full md:w-48">
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full appearance-none border-b border-[#cfc4c5] bg-transparent py-1.5 pl-2 pr-7 text-xs uppercase tracking-wider text-black focus:border-black focus:outline-none cursor-pointer"
            >
              <option value="newest">Newest Arrivals</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none text-[#5d5f5f]" />
          </div>
        </div>
      </div>

      {/* Product Grid (2-column layout matching Image 8 with staggered margins) */}
      {displayedProducts.length === 0 ? (
        <div className="py-24 text-center">
          <h3 className="font-serif-luxury text-2xl text-black mb-3">No Products Found</h3>
          <p className="text-sm text-[#5d5f5f] mb-6">
            Try adjusting your active filters to view more items.
          </p>
          <button
            onClick={resetFilters}
            className="bg-black text-white px-6 py-3 text-xs uppercase tracking-[0.2em] font-semibold"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-14 mb-20">
          {displayedProducts.map((product, idx) => {
            const isWishlisted = wishlist.includes(product.id);
            // Replicating the exact design layout: odd columns on desktop get mt-12 staggering
            const isStaggered = idx % 2 === 1;

            return (
              <div
                key={product.id}
                id={`product-card-${product.id}`}
                onClick={() => onSelectProduct(product)}
                className={`group block relative cursor-pointer ${
                  isStaggered ? 'md:mt-12' : ''
                }`}
              >
                {/* Image Container */}
                <div className="relative aspect-[3/4] overflow-hidden bg-[#eeeeee] mb-5 border border-[#cfc4c5]/20">
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700 ease-out"
                  />

                  {/* Badges */}
                  {product.isNew && (
                    <div className="absolute top-4 left-4 bg-black text-white px-2.5 py-1 text-[10px] uppercase tracking-widest font-bold">
                      New
                    </div>
                  )}

                  {/* Wishlist Button */}
                  <button
                    id={`wishlist-btn-${product.id}`}
                    aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleWishlist(product.id);
                    }}
                    className={`absolute top-4 right-4 p-2 rounded-full backdrop-blur-md transition-all active:scale-90 ${
                      isWishlisted
                        ? 'bg-black text-white'
                        : 'bg-white/70 text-black hover:bg-white'
                    }`}
                  >
                    <Heart
                      className="w-4 h-4"
                      fill={isWishlisted ? '#ffffff' : 'transparent'}
                    />
                  </button>

                  {/* Quick View Strip */}
                  <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/40 via-transparent to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onQuickView(product);
                      }}
                      className="w-full bg-white/95 text-black text-[11px] py-2 font-semibold tracking-widest uppercase hover:bg-black hover:text-white transition-colors"
                    >
                      Quick View
                    </button>
                  </div>
                </div>

                {/* Metadata */}
                <div className="flex justify-between items-start pt-1">
                  <div>
                    <h3 className="font-serif-luxury text-xl md:text-2xl text-black font-normal group-hover:underline underline-offset-4">
                      {product.name}
                    </h3>
                    <p className="text-xs text-[#5d5f5f] mt-1 font-light">
                      {product.subtitle || product.material}
                    </p>
                  </div>
                  <p className="text-lg md:text-xl font-medium text-black">
                    ${product.price}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Load More Button */}
      {visibleCount < filteredProducts.length && (
        <div className="flex justify-center mb-24">
          <button
            id="load-more-btn"
            onClick={() => setVisibleCount((prev) => prev + 4)}
            className="text-xs font-semibold uppercase tracking-[0.2em] bg-black text-white px-12 py-4 hover:bg-white hover:text-black border border-black transition-colors duration-150 cursor-pointer active:scale-95"
          >
            Load More
          </button>
        </div>
      )}

      {/* Filter Drawer / Modal */}
      {showFilterDrawer && (
        <>
          <div
            onClick={() => setShowFilterDrawer(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
          />
          <aside className="fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-white z-[70] p-6 flex flex-col shadow-2xl overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-[#cfc4c5]/30 mb-6">
              <h2 className="font-serif-luxury text-2xl text-black">Filter Collection</h2>
              <button
                onClick={() => setShowFilterDrawer(false)}
                className="p-1 text-black hover:opacity-60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6 flex-grow">
              {/* Category */}
              <div>
                <h4 className="text-xs uppercase tracking-widest font-semibold text-black mb-3">
                  Categories
                </h4>
                <div className="space-y-2">
                  {categories.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setSelectedCategory(c.value)}
                      className={`flex items-center justify-between w-full text-left py-1 text-xs uppercase tracking-wider ${
                        selectedCategory === c.value
                          ? 'font-bold text-black'
                          : 'text-[#5d5f5f] hover:text-black'
                      }`}
                    >
                      <span>{c.label}</span>
                      {selectedCategory === c.value && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="pt-4 border-t border-[#cfc4c5]/20">
                <h4 className="text-xs uppercase tracking-widest font-semibold text-black mb-3">
                  Price
                </h4>
                <div className="space-y-2">
                  {priceRanges.map((p) => (
                    <button
                      key={p.value}
                      onClick={() => setSelectedPriceRange(p.value)}
                      className={`flex items-center justify-between w-full text-left py-1 text-xs uppercase tracking-wider ${
                        selectedPriceRange === p.value
                          ? 'font-bold text-black'
                          : 'text-[#5d5f5f] hover:text-black'
                      }`}
                    >
                      <span>{p.label}</span>
                      {selectedPriceRange === p.value && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Size */}
              <div className="pt-4 border-t border-[#cfc4c5]/20">
                <h4 className="text-xs uppercase tracking-widest font-semibold text-black mb-3">
                  Sizes
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  {sizes.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSelectedSize(s)}
                      className={`py-2 text-xs uppercase tracking-wider border text-center transition-colors ${
                        selectedSize === s
                          ? 'bg-black text-white border-black font-semibold'
                          : 'border-[#cfc4c5] text-[#1a1c1c] hover:border-black'
                      }`}
                    >
                      {s === 'all' ? 'All' : s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-[#cfc4c5]/30 flex gap-3">
              <button
                onClick={resetFilters}
                className="flex-1 py-3 text-xs uppercase tracking-widest font-semibold border border-[#cfc4c5] hover:border-black"
              >
                Reset
              </button>
              <button
                onClick={() => setShowFilterDrawer(false)}
                className="flex-1 py-3 text-xs uppercase tracking-widest font-semibold bg-black text-white hover:bg-neutral-800"
              >
                Apply
              </button>
            </div>
          </aside>
        </>
      )}
    </main>
  );
};
