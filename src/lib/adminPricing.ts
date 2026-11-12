import { getAdminToken } from '../adminAuth';
import type { DeliverySettings } from './delivery';

function headers() {
  const token = getAdminToken();
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function adminGetDeliveryCharges(): Promise<DeliverySettings> {
  const response = await fetch('/api/admin/delivery-charges', { headers: headers() });
  const data = (await response.json().catch(() => ({}))) as { settings?: DeliverySettings; error?: string };
  if (!response.ok || !data.settings) throw new Error(data.error || 'Could not load delivery charges.');
  return data.settings;
}

export async function adminSaveDeliveryCharges(settings: DeliverySettings): Promise<DeliverySettings> {
  const response = await fetch('/api/admin/delivery-charges', {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify(settings),
  });
  const data = (await response.json().catch(() => ({}))) as { settings?: DeliverySettings; error?: string };
  if (!response.ok || !data.settings) throw new Error(data.error || 'Could not save delivery charges.');
  return data.settings;
}

export async function adminBulkMarkupPrices(percent: number): Promise<{ updated: number; percent: number }> {
  const response = await fetch('/api/admin/prices/bulk-markup', {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ percent }),
  });
  const data = (await response.json().catch(() => ({}))) as {
    updated?: number;
    percent?: number;
    error?: string;
  };
  if (!response.ok || typeof data.updated !== 'number') {
    throw new Error(data.error || 'Could not update product prices.');
  }
  return { updated: data.updated, percent: Number(data.percent) || percent };
}
