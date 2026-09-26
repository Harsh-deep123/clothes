export const TRACKING_STEPS = [
  'Order Confirmed',
  'Order Processing',
  'Order Packed',
  'Shipped',
  'In Transit',
  'Out for Delivery',
  'Delivered',
] as const;

export type TrackingStep = (typeof TRACKING_STEPS)[number];
export type TrackingStatus = TrackingStep | 'Cancelled';

export type StatusHistoryEntry = {
  status: string;
  timestamp: string;
};

export const TRACKING_STATUSES: TrackingStatus[] = [...TRACKING_STEPS, 'Cancelled'];

export const DELIVERY_ALLOWED_STATUSES = ['Shipped', 'In Transit', 'Out for Delivery', 'Delivered'] as const;

export const TRACKING_MESSAGES: Record<TrackingStatus, string> = {
  'Order Confirmed': 'Your order has been confirmed.',
  'Order Processing': 'Your order is being processed.',
  'Order Packed': 'Your order has been packed and is ready for shipping.',
  Shipped: 'Your order has been shipped.',
  'In Transit': 'Your order is on the way.',
  'Out for Delivery': 'Your order is out for delivery.',
  Delivered: 'Your order has been delivered successfully.',
  Cancelled: 'Your order has been cancelled.',
};

export function isTrackingStatus(value: string): value is TrackingStatus {
  return (TRACKING_STATUSES as string[]).includes(value);
}

export function normalizeTrackingStatus(value?: string | null): TrackingStatus {
  if (value && isTrackingStatus(value)) return value;
  const slug = (value || '').trim().toLowerCase().replace(/_/g, ' ');
  if (slug === 'confirmed' || slug === 'order confirmed') return 'Order Confirmed';
  if (slug === 'cancelled' || slug === 'canceled') return 'Cancelled';
  return 'Order Confirmed';
}

export function historyTimestamp(history: StatusHistoryEntry[] | undefined, status: string) {
  const match = [...(history || [])].reverse().find((entry) => entry.status === status);
  return match?.timestamp || '';
}
