import React from 'react';
import { Product } from '../types';
import { formatINR } from '../lib/money';
import { discountPercentOff, priceForSize } from '../catalog';

interface ProductPriceProps {
  product: Product;
  className?: string;
  decimals?: boolean;
  size?: string;
}

/** Amazon-style: -77%  ₹229 */
export const AmazonSalePrice: React.FC<{
  listPrice: number;
  salePrice: number;
  className?: string;
  decimals?: boolean;
}> = ({ listPrice, salePrice, className = '', decimals }) => {
  const percent = discountPercentOff(listPrice, salePrice);
  if (!(percent > 0) || !(salePrice >= 0)) {
    return <span className={className}>{formatINR(salePrice, decimals)}</span>;
  }
  const amountText = decimals
    ? salePrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : Math.round(salePrice).toLocaleString('en-IN');

  return (
    <span className={`inline-flex items-baseline gap-2 ${className}`}>
      <span className="inline-flex items-baseline text-[#c2185b] font-semibold leading-none">
        <span className="text-[0.85em] font-medium mr-0.5">-</span>
        <span className="text-[1.35em] tracking-tight">{percent}</span>
        <span className="text-[0.8em] font-semibold ml-0.5">%</span>
      </span>
      <span className="inline-flex items-start text-black font-bold leading-none">
        <span className="text-[0.55em] font-semibold mt-[0.15em] mr-0.5">₹</span>
        <span className="text-[1.45em] tracking-tight">{amountText}</span>
      </span>
    </span>
  );
};

export const ProductPrice: React.FC<ProductPriceProps> = ({
  product,
  className = '',
  decimals,
  size,
}) => {
  const { price, originalPrice } = priceForSize(product, size);
  if (product.isSale && originalPrice && originalPrice > price) {
    return (
      <AmazonSalePrice
        listPrice={originalPrice}
        salePrice={price}
        className={className}
        decimals={decimals}
      />
    );
  }
  return <span className={className}>{formatINR(price, decimals)}</span>;
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
