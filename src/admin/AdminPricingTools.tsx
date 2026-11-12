import React, { useEffect, useState } from 'react';
import type { DeliveryZoneRule } from '../data/deliveryZones';
import { hydrateCatalogFromServer } from '../catalog';
import {
  adminBulkMarkupPrices,
  adminGetDeliveryCharges,
  adminSaveDeliveryCharges,
} from '../lib/adminPricing';
import { setRuntimeDeliveryConfig, type DeliverySettings } from '../lib/delivery';

interface AdminPricingToolsProps {
  notify: (message: string, type: 'success' | 'error') => void;
}

export const AdminPricingTools: React.FC<AdminPricingToolsProps> = ({ notify }) => {
  const [settings, setSettings] = useState<DeliverySettings | null>(null);
  const [loadingDelivery, setLoadingDelivery] = useState(true);
  const [savingDelivery, setSavingDelivery] = useState(false);
  const [percent, setPercent] = useState('20');
  const [bumping, setBumping] = useState(false);

  useEffect(() => {
    setLoadingDelivery(true);
    adminGetDeliveryCharges()
      .then((next) => setSettings(next))
      .catch((err) => notify(err instanceof Error ? err.message : 'Could not load delivery charges.', 'error'))
      .finally(() => setLoadingDelivery(false));
  }, [notify]);

  const updateZone = (index: number, patch: Partial<DeliveryZoneRule>) => {
    setSettings((prev) => {
      if (!prev) return prev;
      const zones = prev.zones.map((zone, i) => (i === index ? { ...zone, ...patch } : zone));
      return { ...prev, zones };
    });
  };

  const saveDelivery = async () => {
    if (!settings) return;
    setSavingDelivery(true);
    try {
      const saved = await adminSaveDeliveryCharges(settings);
      setSettings(saved);
      setRuntimeDeliveryConfig(saved);
      notify('Delivery charges saved.', 'success');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not save delivery charges.', 'error');
    } finally {
      setSavingDelivery(false);
    }
  };

  const applyMarkup = async () => {
    const value = Number(percent);
    if (!Number.isFinite(value) || value === 0) {
      notify('Enter a non-zero percentage.', 'error');
      return;
    }
    const direction = value > 0 ? `+${value}%` : `${value}%`;
    if (!window.confirm(`Apply ${direction} to ALL product prices now?`)) return;
    setBumping(true);
    try {
      const result = await adminBulkMarkupPrices(value);
      await hydrateCatalogFromServer();
      notify(`Updated ${result.updated} products by ${direction}.`, 'success');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not update prices.', 'error');
    } finally {
      setBumping(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Delivery charges</h3>
          <p className="text-sm text-slate-500 mt-1">Edit delivery and handling charges for each zone. Checkout uses these values live.</p>
        </div>
        {loadingDelivery || !settings ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Zone</th>
                    <th className="px-3 py-2">Delivery (₹)</th>
                    <th className="px-3 py-2">Handling (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {settings.zones.map((zone, index) => (
                    <tr key={zone.id} className="border-t border-slate-100">
                      <td className="px-3 py-3">
                        <p className="font-medium">{zone.label}</p>
                        <p className="text-xs text-slate-400">{zone.id}</p>
                      </td>
                      <td className="px-3 py-3">
                        <input
                          type="number"
                          min={0}
                          step={1}
                          value={zone.charge}
                          onChange={(e) => updateZone(index, { charge: Number(e.target.value) || 0 })}
                          className="w-28 rounded-xl border border-slate-200 px-3 py-2"
                        />
                      </td>
                      <td className="px-3 py-3">
                        <input
                          type="number"
                          min={0}
                          step={1}
                          value={zone.handlingCharge}
                          onChange={(e) => updateZone(index, { handlingCharge: Number(e.target.value) || 0 })}
                          className="w-28 rounded-xl border border-slate-200 px-3 py-2"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              type="button"
              onClick={() => void saveDelivery()}
              disabled={savingDelivery}
              className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-medium disabled:opacity-60"
            >
              {savingDelivery ? 'Saving…' : 'Save delivery charges'}
            </button>
          </>
        )}
      </section>

      <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Bulk price increase</h3>
          <p className="text-sm text-slate-500 mt-1">
            Increase or decrease every product price in one click. Example: <span className="font-medium text-slate-700">20</span> = +20%,{' '}
            <span className="font-medium text-slate-700">-10</span> = −10%.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <label className="block">
            <span className="text-sm text-slate-600">Percentage</span>
            <input
              type="number"
              step={1}
              value={percent}
              onChange={(e) => setPercent(e.target.value)}
              className="mt-1.5 block w-40 rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <button
            type="button"
            onClick={() => void applyMarkup()}
            disabled={bumping}
            className="px-4 py-2.5 rounded-xl bg-sky-600 text-white text-sm font-medium disabled:opacity-60"
          >
            {bumping ? 'Updating…' : 'Apply to all products'}
          </button>
        </div>
      </section>
    </div>
  );
};
