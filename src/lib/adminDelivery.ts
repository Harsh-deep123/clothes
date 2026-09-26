import { getAdminToken } from '../adminAuth';

export type AdminDeliveryPerson = {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  status: 'Active' | 'Inactive';
  role: 'DELIVERY_PERSON';
  assigned?: number;
  delivered?: number;
  pending?: number;
  active?: number;
};

function headers() {
  const token = getAdminToken();
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function adminListDeliveryPersons() {
  const response = await fetch('/api/admin/delivery-persons', { headers: headers() });
  const data = (await response.json()) as { deliveryPersons?: AdminDeliveryPerson[]; error?: string };
  if (!response.ok) throw new Error(data.error || 'Could not load delivery persons.');
  return data.deliveryPersons || [];
}

export async function adminCreateDeliveryPerson(input: {
  fullName: string;
  phone: string;
  email: string;
  password: string;
  status: 'Active' | 'Inactive';
}) {
  const response = await fetch('/api/admin/delivery-persons', {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(input),
  });
  const data = (await response.json()) as { deliveryPerson?: AdminDeliveryPerson; error?: string };
  if (!response.ok || !data.deliveryPerson) throw new Error(data.error || 'Could not create delivery person.');
  return data.deliveryPerson;
}

export async function adminUpdateDeliveryPerson(
  id: string,
  input: Partial<{ fullName: string; phone: string; email: string; password: string; status: 'Active' | 'Inactive' }>
) {
  const response = await fetch(`/api/admin/delivery-persons/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify(input),
  });
  const data = (await response.json()) as { deliveryPerson?: AdminDeliveryPerson; error?: string };
  if (!response.ok || !data.deliveryPerson) throw new Error(data.error || 'Could not update delivery person.');
  return data.deliveryPerson;
}

export async function adminDeleteDeliveryPerson(id: string) {
  const response = await fetch(`/api/admin/delivery-persons/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: headers(),
  });
  const data = (await response.json()) as { ok?: boolean; error?: string };
  if (!response.ok) throw new Error(data.error || 'Could not delete delivery person.');
}

export async function adminListPersonOrders(id: string) {
  const response = await fetch(`/api/admin/delivery-persons/${encodeURIComponent(id)}/orders`, { headers: headers() });
  const data = (await response.json()) as { orders?: Array<{ id: string; orderId?: string; number: string; status?: string; orderStatus?: string }>; error?: string };
  if (!response.ok) throw new Error(data.error || 'Could not load assigned orders.');
  return data.orders || [];
}

export async function adminAssignOrder(orderId: string, deliveryPersonId: string | null) {
  const response = await fetch(`/api/admin/orders/${encodeURIComponent(orderId)}/assign`, {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify({ deliveryPersonId: deliveryPersonId || '' }),
  });
  const data = (await response.json()) as { order?: Record<string, unknown>; error?: string };
  if (!response.ok || !data.order) throw new Error(data.error || 'Could not assign order.');
  return data.order;
}
