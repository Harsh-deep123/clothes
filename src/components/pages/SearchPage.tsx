import React from 'react';
import { Heart } from 'lucide-react';
import { Product, ViewScreen } from '../../types';
import { ProductBadges, ProductPrice } from '../ProductPrice';
import { ProductRatingSummary } from '../ProductRatingSummary';

interface SearchPageProps {
  query: string;
  results: Product[];
  wishlist: string[];
  onQueryChange: (q: string) => void;
  onSelectProduct: (product: Product) => void;
  onToggleWishlist: (id: string) => void;
  onNavigate: (screen: ViewScreen, category?: string) => void;
}

export const SearchPage: React.FC<SearchPageProps> = ({
  query,
  results,
  wishlist,
  onQueryChange,
  onSelectProduct,
  onToggleWishlist,
  onNavigate,
}) => {
  return (
    <main className="flex-grow pt-28 md:pt-36 px-5 md:px-16 max-w-[1440px] mx-auto w-full pb-20">
      <h1 className="font-serif-luxury text-3xl sm:text-5xl tracking-tight uppercase text-black font-normal mb-8">
        Search
      </h1>
      <input
        type="search"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="Search by name or category"
        className="w-full max-w-xl border border-[#cfc4c5] px-4 py-3 text-sm focus:border-black focus:outline-none mb-10"
      />

      {!query.trim() ? (
        <p className="text-sm text-[#5d5f5f] font-light">Start typing to search the collection.</p>
      ) : results.length === 0 ? (
        <div className="py-16 text-center">
          <h2 className="font-serif-luxury text-2xl mb-3">No products found</h2>
          <p className="text-sm text-[#5d5f5f] mb-6">Try another name or category.</p>
          <button
            type="button"
            onClick={() => onNavigate('new-arrivals')}
            className="bg-black text-white text-xs uppercase tracking-[0.2em] font-semibold px-8 py-4"
          >
            Browse Collection
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {results.map((product) => (
            <div
              key={product.id}
              onClick={() => onSelectProduct(product)}
              className="text-left cursor-pointer group"
            >
              <div className="relative aspect-[3/4] bg-[#eeeeee] mb-4 overflow-hidden border border-[#cfc4c5]/20">
                <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                <ProductBadges product={product} />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleWishlist(product.id);
                  }}
                  className={`absolute top-3 right-3 p-2 ${
                    wishlist.includes(product.id) ? 'bg-black text-white' : 'bg-white/80 text-black'
                  }`}
                  aria-label="Toggle wishlist"
                >
                  <Heart className="w-4 h-4" fill={wishlist.includes(product.id) ? '#ffffff' : 'transparent'} />
                </button>
              </div>
              <p className="font-serif-luxury text-xl group-hover:underline">{product.name}</p>
              <ProductRatingSummary productId={product.id} showEmpty className="mt-1" />
              <p className="text-sm text-[#5d5f5f]">{product.categoryLabel}</p>
              <ProductPrice product={product} className="font-medium" />
            </div>
          ))}
        </div>
      )}
    </main>
  );
};
