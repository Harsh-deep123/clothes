import React from 'react';
import { Product } from '../types';
import { formatINR } from '../lib/money';

interface ProductPriceProps {
  product: Product;
  className?: string;
  decimals?: boolean;
}

export const ProductPrice: React.FC<ProductPriceProps> = ({
  product,
  className = '',
  decimals,
}) => {
  if (product.isSale && product.originalPrice && product.originalPrice > product.price) {
    return (
      <span className={`inline-flex items-baseline gap-2 ${className}`}>
        <span className="line-through text-[#5d5f5f] font-normal">
          {formatINR(product.originalPrice, decimals)}
        </span>
        <span className="text-[#ba1a1a]">{formatINR(product.price, decimals)}</span>
      </span>
    );
  }
  return <span className={className}>{formatINR(product.price, decimals)}</span>;
};

export const ProductBadges: React.FC<{ product: Product; className?: string }> = ({
  product,
  className = 'absolute top-3 left-3 flex flex-col gap-1 items-start',
}) => {
  if (!product.isNew && !product.isSale) return null;
  return (
    <div className={className}>
      {product.isSale && (
        <span className="bg-[#ba1a1a] text-white text-[10px] uppercase font-bold tracking-widest px-2 py-0.5">
          Sale
        </span>
      )}
      {product.isNew && (
        <span className="bg-black text-white text-[10px] uppercase font-bold tracking-widest px-2 py-0.5">
          New
        </span>
      )}
    </div>
  );
};
