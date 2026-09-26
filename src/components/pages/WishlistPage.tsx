import React from 'react';
import { Heart } from 'lucide-react';
import { Product, ViewScreen } from '../../types';
import { ProductPrice } from '../ProductPrice';
import { ProductRatingSummary } from '../ProductRatingSummary';

interface WishlistPageProps {
  wishlistIds: string[];
  products: Product[];
  onToggleWishlist: (productId: string) => void;
  onAddToBag: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
  onNavigate: (screen: ViewScreen, category?: string) => void;
}

export const WishlistPage: React.FC<WishlistPageProps> = ({
  wishlistIds,
  products,
  onToggleWishlist,
  onAddToBag,
  onSelectProduct,
  onNavigate,
}) => {
  const saved = products.filter((p) => wishlistIds.includes(p.id));

  return (
    <main className="flex-grow pt-28 md:pt-36 px-5 md:px-16 max-w-[1440px] mx-auto w-full pb-20 md:pb-28">
      <div className="mb-10 md:mb-14">
        <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#5d5f5f] block mb-3">
          Account
        </span>
        <h1 className="font-serif-luxury text-3xl sm:text-5xl md:text-6xl tracking-tight uppercase text-black font-normal">
          Wishlist
        </h1>
        <p className="text-base sm:text-lg text-[#5d5f5f] mt-4 max-w-2xl font-light">
          Pieces you have saved for later.
        </p>
      </div>

      {saved.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border border-[#cfc4c5]/30 bg-white">
          <div className="w-16 h-16 bg-[#f3f3f4] flex items-center justify-center mb-4">
            <Heart className="w-8 h-8 text-[#5d5f5f] stroke-[1.2]" />
          </div>
          <h2 className="font-serif-luxury text-2xl sm:text-3xl text-black mb-3 uppercase tracking-tight">
            YOUR WISHLIST IS EMPTY
          </h2>
          <p className="text-sm text-[#5d5f5f] font-light max-w-sm mb-8">
            Save editorial pieces as you browse. They will appear here on this device.
          </p>
          <button
            type="button"
            onClick={() => onNavigate('new-arrivals')}
            className="bg-black text-white text-xs font-semibold uppercase px-8 py-4 tracking-[0.2em] hover:bg-neutral-800 transition-colors cursor-pointer active:scale-95"
          >
            Continue Shopping
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          {saved.map((product) => (
            <article key={product.id} className="border border-[#cfc4c5]/30 bg-white p-4 sm:p-5">
              <button
                type="button"
                onClick={() => onSelectProduct(product)}
                className="block w-full text-left cursor-pointer"
              >
                <div className="relative aspect-[3/4] overflow-hidden bg-[#eeeeee] mb-4 border border-[#cfc4c5]/20">
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="object-cover w-full h-full"
                  />
                </div>
                <h2 className="font-serif-luxury text-xl text-black">{product.name}</h2>
                <ProductRatingSummary productId={product.id} showEmpty className="mt-1" />
                <p className="text-base font-medium text-black mt-1">
                  <ProductPrice product={product} className="text-base font-medium text-black" />
                </p>
              </button>
              <div className="flex gap-2 mt-3 mb-5">
                {product.colors.map((color) => (
                  <span
                    key={color.name}
                    title={color.name}
                    className="w-5 h-5 border border-[#cfc4c5]"
                    style={{ backgroundColor: color.hex }}
                  />
                ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => onAddToBag(product)}
                  className="flex-1 bg-black text-white text-xs font-semibold uppercase py-3.5 tracking-[0.2em] hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  Add to Bag
                </button>
                <button
                  type="button"
                  onClick={() => onToggleWishlist(product.id)}
                  className="flex-1 border border-black text-black text-xs font-semibold uppercase py-3.5 tracking-[0.2em] hover:bg-[#eeeeee] transition-colors cursor-pointer"
                >
                  Remove
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
};
