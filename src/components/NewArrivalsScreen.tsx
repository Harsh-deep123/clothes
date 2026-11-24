import React, { useEffect, useMemo, useState } from 'react';
import { SlidersHorizontal, Heart, ChevronDown, Check, X } from 'lucide-react';
import { Product } from '../types';
import { ProductBadges, ProductPrice } from './ProductPrice';
import { ProductRatingSummary } from './ProductRatingSummary';
import { useAdminCategories } from '../hooks/useCatalog';
import { FilterSelect } from './FilterSelect';
import {
  HEALTH_BEAUTY_SUBCATEGORIES,
  STORE_SECTION_CATEGORIES,
  WOMEN_SUBCATEGORIES,
  isAddedStoreCategory,
} from '../data/products';
import { fetchStorefrontCatalogPage, toStorefrontProduct } from '../catalog';

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
  const adminCategories = useAdminCategories();
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryFilter || 'all');
  const [selectedSize, setSelectedSize] = useState<string>('all');
  const [selectedColor, setSelectedColor] = useState<string>('all');
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc' | 'popular'>('newest');
  const [showFilterDrawer, setShowFilterDrawer] = useState<boolean>(false);
  const [page, setPage] = useState(1);
  const [pageProducts, setPageProducts] = useState<Product[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const PAGE_SIZE = 16;

  // Sync category filter if changed from prop
  useEffect(() => {
    setSelectedCategory(categoryFilter || 'all');
    setPage(1);
  }, [categoryFilter]);

  const isMenPage = categoryFilter === 'all';
  const lockedCategory = categoryFilter && categoryFilter !== 'all' ? categoryFilter : null;
  const activeCategory = lockedCategory || selectedCategory;

  const categories = [
    { label: 'All Categories', value: 'all' },
    { label: 'Jackets & Outerwear', value: 'jackets' },
    { label: 'T-Shirts', value: 't-shirts' },
    { label: 'Shirts', value: 'shirts' },
    { label: 'Jeans', value: 'jeans' },
    { label: 'Bottomwear', value: 'bottomwear' },
    { label: 'Cargos', value: 'cargos' },
    { label: 'Footwear', value: 'shoes' },
    { label: 'Accessories', value: 'accessories' },
    { label: 'Jewellery & Accessories', value: 'jewellery' },
    { label: 'Kitchen', value: 'kitchen' },
    { label: "Women's Clothing", value: 'women' },
    ...WOMEN_SUBCATEGORIES.map((sub) => ({ label: sub.name, value: sub.slug })),
    ...STORE_SECTION_CATEGORIES.filter((section) => section.slug !== 'accessories').map((section) => ({
      label: section.name,
      value: section.slug,
    })),
    { label: 'Health & Beauty', value: 'health-beauty' },
    ...HEALTH_BEAUTY_SUBCATEGORIES.map((sub) => ({ label: sub.name, value: sub.slug })),
    ...adminCategories
      .filter(
        (c) =>
          !['jackets', 't-shirts', 'shirts', 'jeans', 'bottomwear', 'cargos', 'shoes', 'accessories', 'jewellery', 'kitchen'].includes(c.slug) &&
          !isAddedStoreCategory(c.slug),
      )
      .map((c) => ({ label: c.name, value: c.slug })),
  ];

  const sizes = ['all', 'S', 'M', 'L', 'XL', '30', '32', '34', '15.5', '16.0'];

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    void fetchStorefrontCatalogPage({
      category: activeCategory === 'all' ? null : activeCategory,
      page,
      limit: PAGE_SIZE,
    })
      .then((result) => {
        if (cancelled) return;
        let list = result.products.map(toStorefrontProduct);
        if (selectedSize !== 'all') {
          list = list.filter((p) => p.sizes.some((s) => s.size === selectedSize && s.available));
        }
        if (selectedColor !== 'all') {
          list = list.filter((p) => p.colors.some((c) => c.name === selectedColor));
        }
        if (selectedPriceRange === 'under-150') {
          list = list.filter((p) => p.price < 12499);
        } else if (selectedPriceRange === '150-300') {
          list = list.filter((p) => p.price >= 12499 && p.price <= 24999);
        } else if (selectedPriceRange === 'over-300') {
          list = list.filter((p) => p.price > 24999);
        }
        if (sortBy === 'newest') {
          list.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
        } else if (sortBy === 'price-asc') {
          list.sort((a, b) => a.price - b.price);
        } else if (sortBy === 'price-desc') {
          list.sort((a, b) => b.price - a.price);
        } else if (sortBy === 'popular') {
          list.sort((a, b) => {
            const score = (p: Product) => (p.isNew ? 2 : 0) + (p.isSale ? 1 : 0);
            return score(b) - score(a);
          });
        }
        setPageProducts(list);
        setTotalCount(result.total);
      })
      .catch((err) => {
        if (cancelled) return;
        setPageProducts([]);
        setTotalCount(0);
        setLoadError(err instanceof Error ? err.message : 'Could not load products.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeCategory, page, selectedSize, selectedColor, selectedPriceRange, sortBy, reloadToken]);

  const colors = useMemo(() => {
    const names = new Set<string>();
    pageProducts.forEach((p) => p.colors.forEach((c) => names.add(c.name)));
    return Array.from(names);
  }, [pageProducts]);

  const priceRanges = [
    { label: 'All Prices', value: 'all' },
    { label: 'Under ₹12,499', value: 'under-150' },
    { label: '₹12,499 - ₹24,999', value: '150-300' },
    { label: 'Over ₹24,999', value: 'over-300' },
  ];

  const activeFilterCount =
    (!lockedCategory && selectedCategory !== 'all' ? 1 : 0) +
    (selectedSize !== 'all' ? 1 : 0) +
    (selectedColor !== 'all' ? 1 : 0) +
    (selectedPriceRange !== 'all' ? 1 : 0);

  const resetFilters = () => {
    setSelectedCategory(
      categoryFilter === 'jewellery' ? 'jewellery' : categoryFilter === 'kitchen' ? 'kitchen' : 'all',
    );
    setSelectedSize('all');
    setSelectedColor('all');
    setSelectedPriceRange('all');
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const displayedProducts = pageProducts;

  useEffect(() => {
    setPage(1);
  }, [selectedCategory, selectedSize, selectedColor, selectedPriceRange, sortBy]);
  const pillClass =
    'border border-[#cfc4c5] px-3 py-1.5 text-xs text-[#1a1c1c] hover:border-black transition-colors bg-transparent cursor-pointer uppercase tracking-wider';

  return (
    <main className="flex-grow pt-28 md:pt-36 px-5 md:px-16 max-w-[1440px] mx-auto w-full">
      {/* Page Header */}
      <div className="mb-10 md:mb-14 text-center md:text-left">
        <h1
          id="new-arrivals-heading"
          className="font-serif-luxury text-3xl sm:text-5xl md:text-6xl tracking-tight uppercase text-black font-normal"
        >
          {(categoryFilter && categoryFilter !== 'all'
            ? categories.find((c) => c.value === categoryFilter)?.label
            : selectedCategory === 'all'
              ? isMenPage
                ? 'Men'
                : 'New Arrivals'
              : categories.find((c) => c.value === selectedCategory)?.label) || 'Collection'}
        </h1>
        <p className="text-base sm:text-lg text-[#5d5f5f] mt-3 md:mt-4 max-w-2xl font-light">
          {categoryFilter === 'jewellery'
            ? 'Rings, necklaces, earrings and other jewellery.'
            : categoryFilter === 'kitchen'
              ? 'Cookware, utensils and kitchen essentials.'
              : categoryFilter === 'home-decor'
                ? 'Home accents, organisers and decor for every room.'
                : categoryFilter === 'auto-electrical'
                  ? 'Car, bike and electrical accessories.'
                  : categoryFilter === 'accessories'
                    ? 'Everyday accessories, gadgets and useful finds.'
                    : categoryFilter === 'stationery-office'
                      ? 'Stationery, desk and office essentials.'
                      : categoryFilter === 'health-beauty'
                        ? 'Wellness, grooming, skincare and personal care.'
                        : isMenPage && selectedCategory === 'all'
                          ? 'Explore the complete ZAYRO collection — clothing, jewellery, kitchen and more.'
                          : 'Discover the latest additions to our collection. Minimalist design meets premium craftsmanship.'}
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
            <FilterSelect
              ariaLabel="Category"
              value={selectedCategory}
              onChange={setSelectedCategory}
              options={categories}
              buttonClassName={`${pillClass} min-w-[10rem]`}
            />

            <FilterSelect
              ariaLabel="Size"
              value={selectedSize}
              onChange={setSelectedSize}
              options={[
                { value: 'all', label: 'Size: All' },
                ...sizes.filter((s) => s !== 'all').map((s) => ({ value: s, label: `Size: ${s}` })),
              ]}
              buttonClassName={pillClass}
            />

            <FilterSelect
              ariaLabel="Color"
              value={selectedColor}
              onChange={setSelectedColor}
              options={[{ value: 'all', label: 'Color: All' }, ...colors.map((c) => ({ value: c, label: c }))]}
              buttonClassName={`${pillClass} min-w-[8rem]`}
            />

            <FilterSelect
              ariaLabel="Price"
              value={selectedPriceRange}
              onChange={setSelectedPriceRange}
              options={priceRanges}
              buttonClassName={`${pillClass} min-w-[8rem]`}
            />
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
          <div className="w-full md:w-48">
            <FilterSelect
              id="sort-select"
              ariaLabel="Sort by"
              align="right"
              value={sortBy}
              onChange={(value) => setSortBy(value as typeof sortBy)}
              options={[
                { value: 'newest', label: 'Newest Arrivals' },
                { value: 'popular', label: 'Most Popular' },
                { value: 'price-asc', label: 'Price: Low to High' },
                { value: 'price-desc', label: 'Price: High to Low' },
              ]}
              buttonClassName="w-full border-b border-[#cfc4c5] bg-transparent py-1.5 pl-2 pr-1 text-xs uppercase tracking-wider text-black hover:border-black cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Product Grid (2-column layout matching Image 8 with staggered margins) */}
      {loading ? (
        <div className="py-24 text-center">
          <h3 className="font-serif-luxury text-2xl text-black mb-3">Loading products…</h3>
          <p className="text-sm text-[#5d5f5f]">Fetching the latest items for this view.</p>
        </div>
      ) : loadError ? (
        <div className="py-24 text-center">
          <h3 className="font-serif-luxury text-2xl text-black mb-3">Could not load products</h3>
          <p className="text-sm text-[#5d5f5f] mb-6">{loadError}</p>
          <button
            onClick={() => setReloadToken((n) => n + 1)}
            className="bg-black text-white px-6 py-3 text-xs uppercase tracking-[0.2em] font-semibold"
          >
            Try Again
          </button>
        </div>
      ) : displayedProducts.length === 0 ? (
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5 mb-20">
          {displayedProducts.map((product) => {
            const isWishlisted = wishlist.includes(product.id);

            return (
              <div
                key={product.id}
                id={`product-card-${product.id}`}
                onClick={() => onSelectProduct(product)}
                className="group block relative cursor-pointer"
              >
                {/* Image Container */}
                <div className="relative aspect-square overflow-hidden bg-[#eeeeee] mb-3 border border-[#cfc4c5]/20">
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700 ease-out"
                  />

                  {/* Badges */}
                  <ProductBadges product={product} className="absolute top-2 left-2 flex flex-col gap-1 items-start" />

                  {/* Wishlist Button */}
                  <button
                    id={`wishlist-btn-${product.id}`}
                    aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleWishlist(product.id);
                    }}
                    className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-md transition-all active:scale-90 ${
                      isWishlisted
                        ? 'bg-black text-white'
                        : 'bg-white/70 text-black hover:bg-white'
                    }`}
                  >
                    <Heart
                      className="w-3.5 h-3.5"
                      fill={isWishlisted ? '#ffffff' : 'transparent'}
                    />
                  </button>

                  {/* Quick View Strip */}
                  <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/40 via-transparent to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onQuickView(product);
                      }}
                      className="w-full bg-white/95 text-black text-[10px] py-1.5 font-semibold tracking-widest uppercase hover:bg-black hover:text-white transition-colors"
                    >
                      Quick View
                    </button>
                  </div>
                </div>

                {/* Metadata */}
                <div className="flex flex-col gap-0.5 pt-0.5">
                  <h3 className="font-serif-luxury text-sm md:text-base text-black font-normal group-hover:underline underline-offset-4 line-clamp-2">
                    {product.name}
                  </h3>
                  <ProductRatingSummary productId={product.id} showEmpty className="mt-0.5" />
                  <p className="text-[11px] text-[#5d5f5f] font-light line-clamp-1">
                    {product.subtitle || product.material}
                  </p>
                  <ProductPrice product={product} className="text-sm md:text-base font-medium text-black mt-1" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {totalCount > PAGE_SIZE && (
        <div className="flex flex-wrap items-center justify-center gap-2 mb-24">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => {
              setPage((p) => Math.max(1, p - 1));
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="text-xs font-semibold uppercase tracking-[0.15em] border border-black px-5 py-3 hover:bg-[#eeeeee] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((n) => n === 1 || n === totalPages || Math.abs(n - currentPage) <= 1)
            .reduce<number[]>((acc, n, idx, arr) => {
              if (idx > 0 && n - arr[idx - 1] > 1) acc.push(-arr[idx - 1]);
              acc.push(n);
              return acc;
            }, [])
            .map((n) =>
              n < 0 ? (
                <span key={`e${n}`} className="px-1 text-[#5d5f5f] text-xs">
                  …
                </span>
              ) : (
                <button
                  key={n}
                  type="button"
                  onClick={() => {
                    setPage(n);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`min-w-10 text-xs font-semibold uppercase tracking-[0.15em] border border-black px-3 py-3 transition-colors ${
                    n === currentPage ? 'bg-black text-white' : 'bg-white text-black hover:bg-[#eeeeee]'
                  }`}
                >
                  {n}
                </button>
              ),
            )}
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => {
              setPage((p) => Math.min(totalPages, p + 1));
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="text-xs font-semibold uppercase tracking-[0.15em] border border-black px-5 py-3 hover:bg-[#eeeeee] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Next
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

              {/* Color */}
              <div className="pt-4 border-t border-[#cfc4c5]/20">
                <h4 className="text-xs uppercase tracking-widest font-semibold text-black mb-3">
                  Color
                </h4>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setSelectedColor('all')}
                    className={`flex items-center justify-between w-full text-left py-1 text-xs uppercase tracking-wider ${
                      selectedColor === 'all' ? 'font-bold text-black' : 'text-[#5d5f5f] hover:text-black'
                    }`}
                  >
                    <span>All Colors</span>
                    {selectedColor === 'all' && <Check className="w-3.5 h-3.5" />}
                  </button>
                  {colors.map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setSelectedColor(c)}
                      className={`flex items-center justify-between w-full text-left py-1 text-xs uppercase tracking-wider ${
                        selectedColor === c ? 'font-bold text-black' : 'text-[#5d5f5f] hover:text-black'
                      }`}
                    >
                      <span>{c}</span>
                      {selectedColor === c && <Check className="w-3.5 h-3.5" />}
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
