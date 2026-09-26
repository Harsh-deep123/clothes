export type UserRole = 'SUPER_ADMIN' | 'DELIVERY_PERSON' | 'CUSTOMER';
export type DeliveryPersonStatus = 'Active' | 'Inactive';

export const DELIVERY_ALLOWED_STATUSES = ['Shipped', 'In Transit', 'Out for Delivery', 'Delivered'] as const;

export function isSuperAdminRole(role?: string) {
  return role === 'admin' || role === 'SUPER_ADMIN';
}

export function isDeliveryPersonRole(role?: string) {
  return role === 'DELIVERY_PERSON';
}

export function isCustomerRole(role?: string) {
  return !role || role === 'CUSTOMER' || role === 'customer';
}

export function isDeliveryAllowedStatus(value: string) {
  return (DELIVERY_ALLOWED_STATUSES as readonly string[]).includes(value);
}
