import { getAdminToken } from '../adminAuth';
import type { TrackingStatus } from './orderTracking';

export async function adminUpdateOrderTracking(
  orderId: string,
  patch: {
    status?: TrackingStatus;
    trackingId?: string;
    deliveryPartner?: string;
    expectedDeliveryDate?: string;
  }
) {
  const token = getAdminToken();
  const response = await fetch(`/api/admin/orders/${encodeURIComponent(orderId)}/tracking`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(patch),
  });
  const data = (await response.json()) as { order?: Record<string, unknown>; error?: string };
  if (!response.ok || !data.order) throw new Error(data.error || 'Could not update tracking.');
  return data.order;
}
