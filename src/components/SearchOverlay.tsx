import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { getStorefrontProducts } from '../catalog';
import { Product } from '../types';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (query: string) => void;
  onSelectProduct: (product: Product) => void;
}

export function searchProducts(query: string): Product[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return getStorefrontProducts().filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.categoryLabel.toLowerCase().includes(q) ||
      (p.subtitle || '').toLowerCase().includes(q) ||
      (p.material || '').toLowerCase().includes(q)
  );
}

export const SearchOverlay: React.FC<SearchOverlayProps> = ({
  isOpen,
  onClose,
  onSearch,
  onSelectProduct,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestions = useMemo(() => searchProducts(query).slice(0, 6), [query]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80]">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#f9f9f9] border-b border-[#cfc4c5]/30 px-5 md:px-16 py-6 max-w-[1440px] mx-auto mt-0 md:mt-20">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSearch(query);
          }}
          className="flex items-center gap-3 border-b border-black pb-3"
        >
          <Search className="w-5 h-5 stroke-[1.5] shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products and categories"
            className="flex-grow bg-transparent text-sm focus:outline-none"
          />
          <button type="button" onClick={onClose} aria-label="Close search" className="p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </form>

        {query.trim() && (
          <div className="mt-4">
            {suggestions.length === 0 ? (
              <p className="text-sm text-[#5d5f5f] py-4">No products found</p>
            ) : (
              <ul>
                {suggestions.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => onSelectProduct(p)}
                      className="w-full flex items-center gap-4 py-3 text-left hover:bg-[#eeeeee] px-2 cursor-pointer"
                    >
                      <img src={p.images[0]} alt="" className="w-12 h-16 object-cover bg-[#eeeeee]" />
                      <span>
                        <span className="block text-sm text-black">{p.name}</span>
                        <span className="block text-xs text-[#5d5f5f]">{p.categoryLabel}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button
              type="button"
              onClick={() => onSearch(query)}
              className="mt-3 text-xs uppercase tracking-[0.15em] font-medium hover:underline cursor-pointer"
            >
              View all results
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
