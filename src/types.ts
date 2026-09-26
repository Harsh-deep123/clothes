export interface Product {
  id: string;
  name: string;
  subtitle?: string;
  price: number;
  originalPrice?: number;
  category: string;
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
  listPrice?: number;
  stock?: number;
  active?: boolean;
  discountEnabled?: boolean;
  discountType?: 'percent' | 'amount';
  discountValue?: number;
  saleEnabled?: boolean;
  saleStart?: string;
  saleEnd?: string;
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

export type ViewScreen =
  | 'home'
  | 'new-arrivals'
  | 'category'
  | 'product-detail'
  | 'contact'
  | 'shipping'
  | 'returns'
  | 'size-guide'
  | 'about'
  | 'story'
  | 'privacy'
  | 'faq'
  | 'terms'
  | 'wishlist'
  | 'login'
  | 'register'
  | 'forgot-password'
  | 'bag'
  | 'checkout'
  | 'confirmation'
  | 'account'
  | 'search';

export type AccountTab = 'profile' | 'orders' | 'wishlist' | 'addresses' | 'settings';

export interface LocalAccount {
  id?: string;
  fullName: string;
  email: string;
  phone: string;
  password: string;
}

export interface SavedAddress {
  id: string;
  label: string;
  fullName: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  userEmail?: string;
}

export interface OrderCustomer {
  fullName: string;
  email: string;
  phone: string;
}

export interface OrderAddress {
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface PlacedOrder {
  id: string;
  number: string;
  createdAt: string;
  items: CartItem[];
  subtotal: number;
  shippingLabel: string;
  discount: number;
  total: number;
  customer: OrderCustomer;
  shippingAddress: OrderAddress;
  estimatedDelivery: string;
  deliveryCharge?: number;
  handlingCharge?: number;
  paymentMethod?: 'stripe' | 'cod';
  paymentStatus?: 'paid' | 'unpaid';
  stripePaymentIntentId?: string;
  status?: string;
  trackingId?: string;
  deliveryPartner?: string;
  expectedDeliveryDate?: string;
  statusHistory?: Array<{ status: string; timestamp: string }>;
  confirmationCallSent?: boolean;
  confirmationCallStatus?: 'pending' | 'initiated' | 'completed' | 'failed';
  confirmationCallSid?: string;
  confirmationCallError?: string;
  whatsappMessageSent?: boolean;
  whatsappMessageStatus?: 'pending' | 'sent' | 'delivered' | 'failed';
  whatsappMessageSentAt?: string;
  whatsappMessageId?: string;
  whatsappError?: string;
  emailSent?: boolean;
  emailStatus?: 'pending' | 'sent' | 'failed';
  emailError?: string;
  deliveryLocation?: {
    latitude: number;
    longitude: number;
    address: string;
  };
}

export interface CategoryInfo {
  id: string;
  name: string;
  slug: string;
  image: string;
  description: string;
  gridSpan?: string;
}
