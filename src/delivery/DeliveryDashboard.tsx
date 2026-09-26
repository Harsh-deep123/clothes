import React, { useEffect, useState } from 'react';
import { LogOut } from 'lucide-react';
import { DELIVERY_ALLOWED_STATUSES } from '../lib/orderTracking';
import { deliveryAuthHeaders, getDeliverySession, logoutDelivery } from './deliveryAuth';

type DeliveryOrder = {
  id: string;
  orderId?: string;
  number: string;
  createdAt: string;
  assignedAt?: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress?: string;
  items?: Array<{ name: string; quantity: number }>;
  products?: Array<{ name: string; quantity: number }>;
  total: number;
  status?: string;
  orderStatus?: string;
  latitude?: number;
  longitude?: number;
  deliveryLocation?: { latitude: number; longitude: number; address: string };
  shipping?: { address?: string; city?: string; state?: string; postalCode?: string; country?: string; latitude?: number; longitude?: number };
};

function mapsSearchUrl(order: DeliveryOrder) {
  const lat = order.latitude ?? order.deliveryLocation?.latitude ?? order.shipping?.latitude;
  const lng = order.longitude ?? order.deliveryLocation?.longitude ?? order.shipping?.longitude;
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}`)}`;
  }
  const address =
    order.deliveryLocation?.address ||
    order.deliveryAddress ||
    [order.shipping?.address, order.shipping?.city, order.shipping?.state, order.shipping?.postalCode, order.shipping?.country]
      .filter(Boolean)
      .join(', ');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address || '')}`;
}

function mapsDirectionsUrl(order: DeliveryOrder) {
  const lat = order.latitude ?? order.deliveryLocation?.latitude ?? order.shipping?.latitude;
  const lng = order.longitude ?? order.deliveryLocation?.longitude ?? order.shipping?.longitude;
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${lat},${lng}`)}`;
  }
  const address =
    order.deliveryLocation?.address ||
    order.deliveryAddress ||
    [order.shipping?.address, order.shipping?.city, order.shipping?.state, order.shipping?.postalCode, order.shipping?.country]
      .filter(Boolean)
      .join(', ');
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address || '')}`;
}

function productLabel(order: DeliveryOrder) {
  const rows = (order.products && order.products.length ? order.products : order.items) || [];
  return rows.map((item) => `${item.name} × ${item.quantity}`).join(', ') || '—';
}

export const DeliveryDashboard: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const session = getDeliverySession();
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [statusDraft, setStatusDraft] = useState<Record<string, string>>({});

  const load = async () => {
    try {
      const response = await fetch('/api/delivery/orders', { headers: deliveryAuthHeaders() });
      const data = (await response.json()) as { orders?: DeliveryOrder[]; error?: string };
      if (!response.ok) throw new Error(data.error || 'Could not load orders.');
      const list = data.orders || [];
      setOrders(list);
      setStatusDraft((prev) => {
        const next = { ...prev };
        list.forEach((order) => {
          if (!next[order.id]) next[order.id] = order.status || order.orderStatus || 'Shipped';
        });
        return next;
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 20000);
    return () => window.clearInterval(timer);
  }, []);

  const updateStatus = async (order: DeliveryOrder) => {
    setSavingId(order.id);
    try {
      const response = await fetch(`/api/delivery/orders/${encodeURIComponent(order.id)}/status`, {
        method: 'PATCH',
        headers: deliveryAuthHeaders(),
        body: JSON.stringify({ status: statusDraft[order.id] }),
      });
      const data = (await response.json()) as { order?: DeliveryOrder; error?: string };
      if (!response.ok || !data.order) throw new Error(data.error || 'Could not update status.');
      setOrders((prev) => prev.map((item) => (item.id === order.id ? { ...item, ...data.order } : item)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update status.');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="bg-white border-b border-slate-200 px-4 md:px-8 py-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-400">Zayro Store</p>
          <h1 className="text-lg md:text-xl font-semibold">Delivery Dashboard</h1>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-sm font-medium truncate max-w-[180px]">{session?.fullName || session?.email}</p>
          <button
            type="button"
            onClick={() => {
              logoutDelivery();
              onLogout();
            }}
            className="flex items-center gap-2 text-sm text-slate-500"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </header>
      <main className="p-4 md:p-8 space-y-4">
        {loading && <p className="text-sm text-slate-500">Loading assigned orders…</p>}
        {error && <p className="text-sm text-rose-600">{error}</p>}
        {!loading && orders.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <p className="text-sm text-slate-500">No orders are assigned to you yet.</p>
          </div>
        )}
        {orders.map((order) => (
          <article key={order.id} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
            <div className="flex flex-wrap justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400">{order.orderId || order.number}</p>
                <h2 className="text-lg font-semibold">{order.customerName}</h2>
              </div>
              <span className="text-xs font-semibold uppercase px-2 py-1 rounded-lg bg-slate-100">{order.status || order.orderStatus}</span>
            </div>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <div>
                <dt className="text-slate-400">Customer phone</dt>
                <dd>{order.customerPhone}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Order total</dt>
                <dd>₹{Number(order.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</dd>
              </div>
              <div className="md:col-span-2">
                <dt className="text-slate-400">Product</dt>
                <dd>{productLabel(order)}</dd>
              </div>
              <div className="md:col-span-2">
                <dt className="text-slate-400">Delivery address</dt>
                <dd>{order.deliveryAddress || '—'}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Order date</dt>
                <dd>{new Date(order.createdAt).toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Assigned</dt>
                <dd>{order.assignedAt ? new Date(order.assignedAt).toLocaleString() : '—'}</dd>
              </div>
            </dl>
            <div className="flex flex-wrap gap-2">
              <a href={`tel:${order.customerPhone}`} className="text-xs font-semibold uppercase px-3 py-1.5 rounded-lg bg-slate-900 text-white">
                Call Customer
              </a>
              <a href={mapsSearchUrl(order)} target="_blank" rel="noreferrer" className="text-xs font-semibold uppercase px-3 py-1.5 rounded-lg border border-slate-200">
                View Location
              </a>
              <a href={mapsDirectionsUrl(order)} target="_blank" rel="noreferrer" className="text-xs font-semibold uppercase px-3 py-1.5 rounded-lg border border-slate-200">
                Get Directions
              </a>
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <label className="text-xs text-slate-500 flex-1 min-w-[180px]">
                Update Status
                <select
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={statusDraft[order.id] || order.status || 'Shipped'}
                  onChange={(e) => setStatusDraft((prev) => ({ ...prev, [order.id]: e.target.value }))}
                >
                  {DELIVERY_ALLOWED_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                disabled={savingId === order.id}
                onClick={() => void updateStatus(order)}
                className="text-xs font-semibold uppercase px-3 py-1.5 rounded-lg bg-slate-900 text-white disabled:opacity-40"
              >
                {savingId === order.id ? 'Saving…' : 'Update Status'}
              </button>
            </div>
          </article>
        ))}
      </main>
    </div>
  );
};
