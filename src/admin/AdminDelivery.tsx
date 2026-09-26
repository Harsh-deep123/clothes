import React, { useEffect, useState } from 'react';
import {
  adminCreateDeliveryPerson,
  adminDeleteDeliveryPerson,
  adminListDeliveryPersons,
  adminListPersonOrders,
  adminUpdateDeliveryPerson,
  type AdminDeliveryPerson,
} from '../lib/adminDelivery';

const inputClass = 'mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm';
const btnClass = 'text-xs font-semibold uppercase px-3 py-1.5 rounded-lg bg-slate-900 text-white disabled:opacity-40';

export const AdminDelivery: React.FC<{ notify?: (message: string, type: 'success' | 'error') => void }> = ({
  notify,
}) => {
  const [people, setPeople] = useState<AdminDeliveryPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [assigned, setAssigned] = useState<Array<{ id: string; number: string; status?: string; orderStatus?: string }>>([]);
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    password: '',
    status: 'Active' as 'Active' | 'Inactive',
  });

  const load = async () => {
    try {
      setError(null);
      setPeople(await adminListDeliveryPersons());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load delivery persons.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setForm({ fullName: '', phone: '', email: '', password: '', status: 'Active' });
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await adminUpdateDeliveryPerson(editingId, {
          fullName: form.fullName,
          phone: form.phone,
          email: form.email,
          status: form.status,
          ...(form.password ? { password: form.password } : {}),
        });
        notify?.('Delivery person updated.', 'success');
      } else {
        await adminCreateDeliveryPerson(form);
        notify?.('Delivery person created.', 'success');
      }
      resetForm();
      await load();
    } catch (err) {
      notify?.(err instanceof Error ? err.message : 'Could not save delivery person.', 'error');
    }
  };

  if (loading) return <p className="text-sm text-slate-500">Loading delivery persons…</p>;
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

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">Create and manage delivery persons. Passwords are stored securely and never displayed.</p>
      <form onSubmit={save} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
        <p className="text-xs uppercase tracking-wider text-slate-400">{editingId ? 'Edit Delivery Person' : 'Add Delivery Person'}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="text-xs text-slate-500">
            Full Name
            <input className={inputClass} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
          </label>
          <label className="text-xs text-slate-500">
            Phone Number
            <input className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
          </label>
          <label className="text-xs text-slate-500">
            Email
            <input type="email" className={inputClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </label>
          <label className="text-xs text-slate-500">
            Password {editingId ? '(leave blank to keep)' : ''}
            <input type="password" className={inputClass} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!editingId} autoComplete="new-password" />
          </label>
          <label className="text-xs text-slate-500">
            Status
            <select className={inputClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as 'Active' | 'Inactive' })}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </label>
        </div>
        <div className="flex gap-2">
          <button type="submit" className={btnClass}>{editingId ? 'Save Changes' : 'Add Delivery Person'}</button>
          {editingId && (
            <button type="button" onClick={resetForm} className="text-xs font-semibold uppercase px-3 py-1.5 rounded-lg border border-slate-200">
              Cancel
            </button>
          )}
        </div>
      </form>

      {people.map((person) => (
        <article key={person.id} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">{person.fullName}</h3>
              <p className="text-sm text-slate-500">{person.email}</p>
              <p className="text-sm text-slate-500">{person.phone}</p>
            </div>
            <span className="text-xs font-semibold uppercase px-2 py-1 rounded-lg bg-slate-100 text-slate-800">{person.status}</span>
          </div>
          <dl className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <dt className="text-slate-400">Assigned</dt>
              <dd className="font-medium">{person.assigned ?? 0}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Pending</dt>
              <dd>{person.pending ?? 0}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Delivered</dt>
              <dd>{person.delivered ?? 0}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Role</dt>
              <dd>DELIVERY_PERSON</dd>
            </div>
          </dl>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="text-xs font-semibold uppercase px-3 py-1.5 rounded-lg border border-slate-200"
              onClick={() => {
                setEditingId(person.id);
                setForm({ fullName: person.fullName, phone: person.phone, email: person.email, password: '', status: person.status });
              }}
            >
              Edit
            </button>
            <button
              type="button"
              className="text-xs font-semibold uppercase px-3 py-1.5 rounded-lg border border-slate-200"
              onClick={async () => {
                try {
                  await adminUpdateDeliveryPerson(person.id, { status: person.status === 'Active' ? 'Inactive' : 'Active' });
                  await load();
                } catch (err) {
                  notify?.(err instanceof Error ? err.message : 'Could not update status.', 'error');
                }
              }}
            >
              {person.status === 'Active' ? 'Deactivate' : 'Activate'}
            </button>
            <button
              type="button"
              className="text-xs font-semibold uppercase px-3 py-1.5 rounded-lg border border-slate-200"
              onClick={async () => {
                try {
                  const orders = await adminListPersonOrders(person.id);
                  setViewingId(person.id);
                  setAssigned(orders);
                } catch (err) {
                  notify?.(err instanceof Error ? err.message : 'Could not load orders.', 'error');
                }
              }}
            >
              View assigned orders
            </button>
            <button
              type="button"
              className="text-xs font-semibold uppercase px-3 py-1.5 rounded-lg border border-rose-200 text-rose-700"
              onClick={async () => {
                try {
                  await adminDeleteDeliveryPerson(person.id);
                  notify?.('Delivery person deleted.', 'success');
                  await load();
                } catch (err) {
                  notify?.(err instanceof Error ? err.message : 'Could not delete.', 'error');
                }
              }}
            >
              Delete
            </button>
          </div>
          {viewingId === person.id && (
            <div className="text-sm text-slate-600 border-t border-slate-100 pt-3">
              {assigned.length === 0 ? (
                <p>No assigned orders.</p>
              ) : (
                <ul className="space-y-1">
                  {assigned.map((order) => (
                    <li key={order.id}>
                      {order.number} · {order.status || order.orderStatus || 'Order Confirmed'}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </article>
      ))}
    </div>
  );
};
