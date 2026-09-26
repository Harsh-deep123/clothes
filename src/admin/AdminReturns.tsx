import React, { useEffect, useState } from 'react';
import { fetchReturnRequests, updateReturnRequestStatus } from '../lib/returnRequests';
import type { ReturnRequest, ReturnRequestStatus } from '../types/returnRequest';

const STATUS_OPTIONS: ReturnRequestStatus[] = ['pending', 'approved', 'rejected', 'completed'];

function statusClass(status: ReturnRequestStatus) {
  if (status === 'approved') return 'bg-emerald-50 text-emerald-800';
  if (status === 'rejected') return 'bg-rose-50 text-rose-800';
  if (status === 'completed') return 'bg-slate-200 text-slate-800';
  return 'bg-amber-50 text-amber-800';
}

function notifyLabel(sent: boolean, error?: string) {
  if (sent) return 'Sent';
  return error ? `Not sent · ${error}` : 'Not sent';
}

export const AdminReturns: React.FC<{ notify: (message: string, type: 'success' | 'error') => void }> = ({
  notify,
}) => {
  const [requests, setRequests] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setError(null);
      setRequests(await fetchReturnRequests());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const onStatus = async (id: string, status: ReturnRequestStatus) => {
    try {
      const updated = await updateReturnRequestStatus(id, status);
      setRequests((prev) => prev.map((item) => (item.id === id ? updated : item)));
      notify(`Request ${id} marked ${status}.`, 'success');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not update status.', 'error');
    }
  };

  if (loading) {
    return <p className="text-sm text-slate-500">Loading return and replace requests…</p>;
  }

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

  if (requests.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <p className="text-sm text-slate-500">No return or replace requests yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        Customer return and replace requests. Status: Pending, Approved, Rejected, Completed.
      </p>
      {requests.map((request) => (
        <article key={request.id} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400">{request.id}</p>
              <h3 className="text-lg font-semibold capitalize">
                {request.requestType} · {request.orderNumber}
              </h3>
              <p className="text-xs text-slate-500">{new Date(request.createdAt).toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold uppercase px-2 py-1 rounded-lg ${statusClass(request.status)}`}>
                {request.status}
              </span>
              <select
                className="border border-slate-200 rounded-lg text-sm px-2 py-1 bg-white"
                value={request.status}
                onChange={(e) => void onStatus(request.id, e.target.value as ReturnRequestStatus)}
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div>
              <dt className="text-slate-400">Customer</dt>
              <dd className="font-medium">{request.customerName}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Phone</dt>
              <dd>{request.customerPhone}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Email</dt>
              <dd>{request.customerEmail}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Order matched</dt>
              <dd>{request.orderMatched ? 'Yes' : 'No'}</dd>
            </div>
            <div className="md:col-span-2">
              <dt className="text-slate-400">Address</dt>
              <dd>{request.customerAddress || '—'}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Product</dt>
              <dd>{request.productName || '—'}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Product details</dt>
              <dd className="whitespace-pre-wrap">{request.productDetails || '—'}</dd>
            </div>
            <div className="md:col-span-2">
              <dt className="text-slate-400">Reason</dt>
              <dd className="whitespace-pre-wrap">{request.reason || '—'}</dd>
            </div>
            <div className="md:col-span-2">
              <dt className="text-slate-400">Additional message</dt>
              <dd className="whitespace-pre-wrap">{request.additionalMessage || '—'}</dd>
            </div>
          </dl>
          <div className="text-xs text-slate-500 border-t border-slate-100 pt-3 space-y-1">
            <p>Email: {notifyLabel(request.notifications.email.sent, request.notifications.email.error)}</p>
            <p>WhatsApp: {notifyLabel(request.notifications.whatsapp.sent, request.notifications.whatsapp.error)}</p>
            <p>SMS: {notifyLabel(request.notifications.sms.sent, request.notifications.sms.error)}</p>
          </div>
        </article>
      ))}
    </div>
  );
};
