import type { PlacedOrder } from '../types';
import type { ReturnRequest, ReturnRequestStatus, ReturnRequestType } from '../types/returnRequest';

export type ReturnRequestPayload = {
  requestType: ReturnRequestType;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  productName: string;
  productDetails: string;
  reason: string;
  additionalMessage: string;
  orderMatched: boolean;
};

export function formatOrderAddress(order?: PlacedOrder | null): string {
  if (!order) return '';
  const a = order.shippingAddress;
  return [a.address, a.city, a.state, a.postalCode, a.country].filter(Boolean).join(', ');
}

export function findOrderByNumber(orders: PlacedOrder[], orderNumber: string): PlacedOrder | undefined {
  const needle = orderNumber.trim().toLowerCase();
  if (!needle) return undefined;
  return orders.find((order) => order.number.toLowerCase() === needle);
}

export function orderProductSummary(order?: PlacedOrder | null): { name: string; details: string } {
  if (!order?.items.length) return { name: '', details: '' };
  return {
    name: order.items.map((item) => item.product.name).join(', '),
    details: order.items
      .map(
        (item) =>
          `${item.product.name} · ${item.selectedColor} · Size ${item.selectedSize} · Qty ${item.quantity}`
      )
      .join('\n'),
  };
}

export async function submitReturnRequest(payload: ReturnRequestPayload): Promise<ReturnRequest> {
  const response = await fetch('/api/return-requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = (await response.json()) as { request?: ReturnRequest; error?: string };
  if (!response.ok || !data.request) {
    throw new Error(data.error || 'Could not submit the return request.');
  }
  return data.request;
}

export async function fetchReturnRequests(): Promise<ReturnRequest[]> {
  const response = await fetch('/api/return-requests', { headers: { Accept: 'application/json' } });
  const data = (await response.json()) as { requests?: ReturnRequest[]; error?: string };
  if (!response.ok) throw new Error(data.error || 'Could not load return requests.');
  return data.requests || [];
}

export async function updateReturnRequestStatus(
  id: string,
  status: ReturnRequestStatus
): Promise<ReturnRequest> {
  const response = await fetch(`/api/return-requests/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ status }),
  });
  const data = (await response.json()) as { request?: ReturnRequest; error?: string };
  if (!response.ok || !data.request) {
    throw new Error(data.error || 'Could not update request status.');
  }
  return data.request;
}
