import React, { useEffect, useState } from 'react';
import type { PlacedOrder } from '../types';
import { adminAssignOrder, adminListDeliveryPersons, type AdminDeliveryPerson } from '../lib/adminDelivery';
import { adminUpdateOrderTracking } from '../lib/adminOrderTracking';
import { TRACKING_STATUSES, normalizeTrackingStatus, type TrackingStatus } from '../lib/orderTracking';
import { AdminDeliveryLocationModal } from './AdminDeliveryLocationModal';

type AdminOrderCall = {
  id: string;
  number: string;
  orderId?: string;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  customerPhoneE164: string;
  customerEmail?: string;
  deliveryAddress?: string;
  items?: Array<{ name: string; quantity: number; price: number }>;
  total: number;
  confirmationCallSent: boolean;
  confirmationCallStatus: NonNullable<PlacedOrder['confirmationCallStatus']>;
  confirmationCallSid?: string;
  confirmationCallError?: string;
  whatsappMessageSent?: boolean;
  whatsappMessageStatus?: NonNullable<PlacedOrder['whatsappMessageStatus']>;
  whatsappMessageId?: string;
  whatsappError?: string;
  emailSent?: boolean;
  emailStatus?: NonNullable<PlacedOrder['emailStatus']>;
  emailError?: string;
  status?: string;
  orderStatus?: string;
  trackingId?: string;
  deliveryPartner?: string;
  expectedDeliveryDate?: string;
  statusHistory?: Array<{ status: string; timestamp: string }>;
  deliveryLocation?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  shipping?: {
    address?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  deliveryPersonId?: string;
  assignedAt?: string;
};

const CALL_LABELS: Record<NonNullable<PlacedOrder['confirmationCallStatus']>, string> = {
  pending: 'Call Pending',
  initiated: 'Call Initiated',
  completed: 'Call Completed',
  failed: 'Call Failed',
};

const WA_LABELS: Record<NonNullable<PlacedOrder['whatsappMessageStatus']>, string> = {
  pending: 'WhatsApp Pending',
  sent: 'WhatsApp Sent',
  delivered: 'WhatsApp Delivered',
  failed: 'WhatsApp Failed',
};

const EMAIL_LABELS: Record<NonNullable<PlacedOrder['emailStatus']>, string> = {
  pending: 'Email Pending',
  sent: 'Email Sent',
  failed: 'Email Failed',
};

function statusClass(status: string) {
  if (status === 'completed' || status === 'delivered' || status === 'sent') return 'bg-emerald-50 text-emerald-800';
  if (status === 'failed') return 'bg-rose-50 text-rose-800';
  if (status === 'initiated') return 'bg-sky-50 text-sky-800';
  return 'bg-amber-50 text-amber-800';
}

type TrackingDraft = {
  status: TrackingStatus;
  trackingId: string;
  deliveryPartner: string;
  expectedDeliveryDate: string;
};

function mapsSearchUrl(order: AdminOrderCall) {
  const lat = order.deliveryLocation?.latitude;
  const lng = order.deliveryLocation?.longitude;
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }
  const address =
    order.deliveryLocation?.address ||
    order.deliveryAddress ||
    [order.shipping?.address, order.shipping?.city, order.shipping?.state, order.shipping?.postalCode, order.shipping?.country]
      .filter(Boolean)
      .join(', ');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address || '')}`;
}

function draftFrom(order: AdminOrderCall): TrackingDraft {
  return {
    status: normalizeTrackingStatus(order.status || order.orderStatus),
    trackingId: order.trackingId || '',
    deliveryPartner: order.deliveryPartner || '',
    expectedDeliveryDate: (order.expectedDeliveryDate || '').slice(0, 10),
  };
}

export const AdminOrders: React.FC<{ notify?: (message: string, type: 'success' | 'error') => void }> = ({
  notify,
}) => {
  const [orders, setOrders] = useState<AdminOrderCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, TrackingDraft>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [locationOrder, setLocationOrder] = useState<AdminOrderCall | null>(null);
  const [people, setPeople] = useState<AdminDeliveryPerson[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<Record<string, string>>({});

  const load = async () => {
    try {
      setError(null);
      const response = await fetch('/api/orders', { headers: { Accept: 'application/json' } });
      const data = (await response.json()) as { orders?: AdminOrderCall[]; error?: string };
      if (!response.ok) throw new Error(data.error || 'Could not load orders.');
      const list = data.orders || [];
      setOrders(list);
      setDrafts(Object.fromEntries(list.map((order) => [order.id, draftFrom(order)])));
      setSelectedPerson(Object.fromEntries(list.map((order) => [order.id, order.deliveryPersonId || ''])));
      try {
        setPeople(await adminListDeliveryPersons());
      } catch {
        setPeople([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  if (loading) return <p className="text-sm text-slate-500">Loading orders…</p>;
  if (error) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <p className="text-sm text-rose-600">{error}</p>
        <button type="button" className="mt-3 text-sm underline" onClick={() => void load()}>
          Retry
        </button>
      </div>
    );
  }
  if (orders.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <p className="text-sm text-slate-500">No storefront orders have triggered a confirmation call yet.</p>
      </div>
    );
  }

  return (
    <>
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        Order confirmation notifications. Each order gets one email, one call, and one WhatsApp message.
      </p>
      {orders.map((order) => (
        <article key={order.id} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400">{order.id}</p>
              <h3 className="text-lg font-semibold">{order.number}</h3>
              <p className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleString()}</p>
            </div>
            <div className="flex flex-wrap gap-2 justify-end">
              <span className={`text-xs font-semibold uppercase px-2 py-1 rounded-lg ${statusClass(order.emailStatus || 'pending')}`}>
                {EMAIL_LABELS[order.emailStatus || 'pending']}
              </span>
              <span className={`text-xs font-semibold uppercase px-2 py-1 rounded-lg ${statusClass(order.confirmationCallStatus)}`}>
                {CALL_LABELS[order.confirmationCallStatus]}
              </span>
              <span className={`text-xs font-semibold uppercase px-2 py-1 rounded-lg ${statusClass(order.whatsappMessageStatus || 'pending')}`}>
                {WA_LABELS[order.whatsappMessageStatus || 'pending']}
              </span>
              <span className="text-xs font-semibold uppercase px-2 py-1 rounded-lg bg-slate-100 text-slate-800">
                {normalizeTrackingStatus(order.status || order.orderStatus)}
              </span>
            </div>
          </div>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div>
              <dt className="text-slate-400">Customer</dt>
              <dd className="font-medium">{order.customerName}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Email</dt>
              <dd>{order.customerEmail || '—'}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Phone (checkout)</dt>
              <dd>{order.customerPhone}</dd>
            </div>
            <div>
              <dt className="text-slate-400">WhatsApp / Call number</dt>
              <dd>{order.customerPhoneE164}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Total</dt>
              <dd>₹{Number(order.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</dd>
            </div>
            <div className="md:col-span-2">
              <dt className="text-slate-400">Delivery address</dt>
              <dd>{order.deliveryAddress || '—'}</dd>
              {order.deliveryLocation &&
                Number.isFinite(order.deliveryLocation.latitude) &&
                Number.isFinite(order.deliveryLocation.longitude) && (
                  <button
                    type="button"
                    onClick={() => setLocationOrder(order)}
                    className="mt-2 text-xs font-semibold uppercase px-3 py-1.5 rounded-lg border border-slate-200 text-slate-800"
                  >
                    View Delivery Location
                  </button>
                )}
            </div>
            <div className="md:col-span-2">
              <dt className="text-slate-400">Products</dt>
              <dd className="whitespace-pre-wrap">
                {(order.items || [])
                  .map((item) => `${item.name} × ${item.quantity} · ₹${Number(item.price).toLocaleString('en-IN')}`)
                  .join('\n') || '—'}
              </dd>
            </div>
            <div>
              <dt className="text-slate-400">Call SID</dt>
              <dd className="break-all">{order.confirmationCallSid || '—'}</dd>
            </div>
            <div>
              <dt className="text-slate-400">WhatsApp ID</dt>
              <dd className="break-all">{order.whatsappMessageId || '—'}</dd>
            </div>
            {order.emailError && (
              <div className="md:col-span-2">
                <dt className="text-slate-400">Email error</dt>
                <dd className="text-rose-700">{order.emailError}</dd>
              </div>
            )}
            {order.confirmationCallError && (
              <div className="md:col-span-2">
                <dt className="text-slate-400">Call error</dt>
                <dd className="text-rose-700">{order.confirmationCallError}</dd>
              </div>
            )}
            {order.whatsappError && (
              <div className="md:col-span-2">
                <dt className="text-slate-400">WhatsApp error</dt>
                <dd className="text-rose-700">{order.whatsappError}</dd>
              </div>
            )}
          </dl>
          {(() => {
            const assigned = people.find((person) => person.id === order.deliveryPersonId);
            const activePeople = people.filter((person) => person.status === 'Active');
            const lat = order.deliveryLocation?.latitude;
            const lng = order.deliveryLocation?.longitude;
            return (
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <p className="text-xs uppercase tracking-wider text-slate-400">
                  {order.deliveryPersonId ? 'Change Delivery Person' : 'Assign Delivery Person'}
                </p>
                {assigned && (
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    <div>
                      <dt className="text-slate-400">Delivery Person</dt>
                      <dd className="font-medium">{assigned.fullName}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Phone</dt>
                      <dd>{assigned.phone}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Email</dt>
                      <dd>{assigned.email}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Active / Inactive</dt>
                      <dd>{assigned.status}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Number of Assigned Orders</dt>
                      <dd>{assigned.assigned ?? 0}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Delivered Orders</dt>
                      <dd>{assigned.delivered ?? 0}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Pending Orders</dt>
                      <dd>{assigned.pending ?? 0}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Order ID</dt>
                      <dd>{order.orderId || order.number || order.id}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Customer Name</dt>
                      <dd>{order.customerName}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Customer Phone</dt>
                      <dd>{order.customerPhone}</dd>
                    </div>
                    <div className="md:col-span-2">
                      <dt className="text-slate-400">Delivery Address</dt>
                      <dd>{order.deliveryAddress || order.shipping?.address || '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">City</dt>
                      <dd>{order.shipping?.city || '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">State</dt>
                      <dd>{order.shipping?.state || '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Postal Code</dt>
                      <dd>{order.shipping?.postalCode || '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Country</dt>
                      <dd>{order.shipping?.country || '—'}</dd>
                    </div>
                    {Number.isFinite(lat) && Number.isFinite(lng) && (
                      <>
                        <div>
                          <dt className="text-slate-400">Latitude</dt>
                          <dd>{lat}</dd>
                        </div>
                        <div>
                          <dt className="text-slate-400">Longitude</dt>
                          <dd>{lng}</dd>
                        </div>
                      </>
                    )}
                  </dl>
                )}
                <label className="text-xs text-slate-500 block">
                  Select Delivery Person
                  <select
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    value={selectedPerson[order.id] || ''}
                    onChange={(e) =>
                      setSelectedPerson((prev) => ({ ...prev, [order.id]: e.target.value }))
                    }
                  >
                    <option value="">Select Delivery Person</option>
                    {activePeople.map((person) => (
                      <option key={person.id} value={person.id}>
                        {person.fullName}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={assigningId === order.id || !selectedPerson[order.id]}
                    className="text-xs font-semibold uppercase px-3 py-1.5 rounded-lg bg-slate-900 text-white disabled:opacity-40"
                    onClick={async () => {
                      const deliveryPersonId = selectedPerson[order.id];
                      if (!deliveryPersonId) return;
                      setAssigningId(order.id);
                      try {
                        const updated = (await adminAssignOrder(order.id, deliveryPersonId)) as AdminOrderCall;
                        setOrders((prev) =>
                          prev.map((item) => (item.id === order.id ? { ...item, ...updated } : item))
                        );
                        setPeople(await adminListDeliveryPersons());
                        notify?.(order.deliveryPersonId ? 'Delivery person changed.' : 'Delivery person assigned.', 'success');
                      } catch (err) {
                        notify?.(err instanceof Error ? err.message : 'Could not assign delivery person.', 'error');
                      } finally {
                        setAssigningId(null);
                      }
                    }}
                  >
                    {assigningId === order.id ? 'Saving…' : 'Assign'}
                  </button>
                  <a
                    href={mapsSearchUrl(order)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold uppercase px-3 py-1.5 rounded-lg border border-slate-200 text-slate-800"
                  >
                    View Location
                  </a>
                </div>
              </div>
            );
          })()}
          <form
            className="border-t border-slate-100 pt-4 space-y-3"
            onSubmit={async (e) => {
              e.preventDefault();
              const draft = drafts[order.id] || draftFrom(order);
              setSavingId(order.id);
              try {
                const updated = (await adminUpdateOrderTracking(order.id, draft)) as AdminOrderCall;
                setOrders((prev) => prev.map((item) => (item.id === order.id ? { ...item, ...updated } : item)));
                setDrafts((prev) => ({ ...prev, [order.id]: draftFrom({ ...order, ...updated }) }));
                notify?.('Status → Updated', 'success');
              } catch (err) {
                notify?.(err instanceof Error ? err.message : 'Could not update tracking.', 'error');
              } finally {
                setSavingId(null);
              }
            }}
          >
            <p className="text-xs uppercase tracking-wider text-slate-400">Update Order Status</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="text-xs text-slate-500">
                Status
                <select
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={(drafts[order.id] || draftFrom(order)).status}
                  onChange={(e) =>
                    setDrafts((prev) => ({
                      ...prev,
                      [order.id]: { ...(prev[order.id] || draftFrom(order)), status: e.target.value as TrackingStatus },
                    }))
                  }
                >
                  {TRACKING_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-slate-500">
                Tracking ID
                <input
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={(drafts[order.id] || draftFrom(order)).trackingId}
                  onChange={(e) =>
                    setDrafts((prev) => ({
                      ...prev,
                      [order.id]: { ...(prev[order.id] || draftFrom(order)), trackingId: e.target.value },
                    }))
                  }
                />
              </label>
              <label className="text-xs text-slate-500">
                Delivery Partner
                <input
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={(drafts[order.id] || draftFrom(order)).deliveryPartner}
                  onChange={(e) =>
                    setDrafts((prev) => ({
                      ...prev,
                      [order.id]: { ...(prev[order.id] || draftFrom(order)), deliveryPartner: e.target.value },
                    }))
                  }
                />
              </label>
              <label className="text-xs text-slate-500">
                Expected Delivery Date
                <input
                  type="date"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={(drafts[order.id] || draftFrom(order)).expectedDeliveryDate}
                  onChange={(e) =>
                    setDrafts((prev) => ({
                      ...prev,
                      [order.id]: { ...(prev[order.id] || draftFrom(order)), expectedDeliveryDate: e.target.value },
                    }))
                  }
                />
              </label>
            </div>
            <button
              type="submit"
              disabled={savingId === order.id}
              className="text-xs font-semibold uppercase px-3 py-1.5 rounded-lg bg-slate-900 text-white disabled:opacity-40"
            >
              {savingId === order.id ? 'Saving…' : 'Update Order Status'}
            </button>
          </form>
        </article>
      ))}
    </div>
    {locationOrder?.deliveryLocation && (
      <AdminDeliveryLocationModal
        location={{
          customerName: locationOrder.customerName,
          customerPhone: locationOrder.customerPhone,
          deliveryAddress: locationOrder.deliveryLocation.address || locationOrder.deliveryAddress || '—',
          latitude: locationOrder.deliveryLocation.latitude,
          longitude: locationOrder.deliveryLocation.longitude,
        }}
        onClose={() => setLocationOrder(null)}
      />
    )}
    </>
  );
};
