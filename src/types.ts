export interface Product {
  id: string;
  name: string;
  subtitle?: string;
  price: number;
  originalPrice?: number;
  category: 'jackets' | 't-shirts' | 'shirts' | 'jeans' | 'cargos' | 'bottomwear' | 'accessories' | 'shoes';
  categoryLabel: string;
  breadcrumb: string;
  images: string[];
  colors: {
    name: string;
    hex: string;
    border?: string;
  }[];
  sizes: {
    size: string;
    available: boolean;
  }[];
  description: string;
  detailsAndCare: string[];
  shippingAndReturns: string;
  isNew?: boolean;
  isSale?: boolean;
  material?: string;
}

export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  selectedColor: string;
  selectedSize: string;
  quantity: number;
  price: number;
}

export type ViewScreen = 'home' | 'new-arrivals' | 'category' | 'product-detail';

export interface CategoryInfo {
  id: string;
  name: string;
  slug: string;
  image: string;
  description: string;
  gridSpan?: string;
}
