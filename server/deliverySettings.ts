import { getDb } from './mongo';
import { DELIVERY_CONFIG, type DeliveryZoneRule } from '../src/data/deliveryZones';

const SETTINGS_ID = 'deliveryCharges';

export type DeliverySettings = {
  unavailableMessage: string;
  zones: DeliveryZoneRule[];
};

export function defaultDeliverySettings(): DeliverySettings {
  return {
    unavailableMessage: DELIVERY_CONFIG.unavailableMessage,
    zones: DELIVERY_CONFIG.zones.map((zone) => ({ ...zone })),
  };
}

function normalizeZones(raw: unknown): DeliveryZoneRule[] {
  if (!Array.isArray(raw) || !raw.length) return defaultDeliverySettings().zones;
  return raw
    .map((row, index) => {
      if (!row || typeof row !== 'object') return null;
      const zone = row as Record<string, unknown>;
      const id = typeof zone.id === 'string' && zone.id.trim() ? zone.id.trim() : `zone-${index + 1}`;
      const label = typeof zone.label === 'string' && zone.label.trim() ? zone.label.trim() : id;
      const charge = Math.max(0, Number(zone.charge) || 0);
      const handlingCharge = Math.max(0, Number(zone.handlingCharge) || 0);
      return {
        id,
        label,
        charge,
        handlingCharge,
        ...(Array.isArray(zone.cities) ? { cities: zone.cities.map(String) } : {}),
        ...(Array.isArray(zone.states) ? { states: zone.states.map(String) } : {}),
        ...(Array.isArray(zone.countryCodes) ? { countryCodes: zone.countryCodes.map(String) } : {}),
        ...(Array.isArray(zone.countryNames) ? { countryNames: zone.countryNames.map(String) } : {}),
      } as DeliveryZoneRule;
    })
    .filter((zone): zone is DeliveryZoneRule => Boolean(zone));
}

export async function getDeliverySettings(): Promise<DeliverySettings> {
  const db = await getDb();
  if (!db) return defaultDeliverySettings();
  const doc = await db.collection('settings').findOne({ _id: SETTINGS_ID as never });
  if (!doc) return defaultDeliverySettings();
  return {
    unavailableMessage:
      typeof doc.unavailableMessage === 'string' && doc.unavailableMessage.trim()
        ? doc.unavailableMessage.trim()
        : DELIVERY_CONFIG.unavailableMessage,
    zones: normalizeZones(doc.zones),
  };
}

export async function saveDeliverySettings(input: {
  unavailableMessage?: string;
  zones?: unknown;
}): Promise<DeliverySettings> {
  const db = await getDb();
  if (!db) throw new Error('Database is unavailable.');
  const next: DeliverySettings = {
    unavailableMessage:
      typeof input.unavailableMessage === 'string' && input.unavailableMessage.trim()
        ? input.unavailableMessage.trim()
        : DELIVERY_CONFIG.unavailableMessage,
    zones: normalizeZones(input.zones),
  };
  await db.collection('settings').updateOne(
    { _id: SETTINGS_ID as never },
    {
      $set: {
        ...next,
        updatedAt: new Date().toISOString(),
      },
    },
    { upsert: true },
  );
  return next;
}

function bump(n: unknown, factor: number) {
  const value = Number(n);
  if (!(value > 0)) return value;
  return Math.max(1, Math.round(value * factor));
}

export async function bulkMarkupProductPrices(percent: number) {
  const db = await getDb();
  if (!db) throw new Error('Database is unavailable.');
  const value = Number(percent);
  if (!Number.isFinite(value) || value === 0) {
    throw new Error('Enter a non-zero percentage.');
  }
  if (value < -90 || value > 500) {
    throw new Error('Percentage must be between -90 and 500.');
  }
  const factor = 1 + value / 100;
  const col = db.collection('products');
  const docs = await col.find({}).toArray();
  let updated = 0;

  for (const doc of docs) {
    const listPrice = bump(doc.listPrice || doc.originalPrice || doc.price, factor);
    const price = bump(doc.price, factor);
    const sizes = Array.isArray(doc.sizes)
      ? doc.sizes.map((s: Record<string, unknown>) => ({
          ...s,
          ...(s.price != null && Number(s.price) > 0 ? { price: bump(s.price, factor) } : {}),
        }))
      : doc.sizes;

    await col.updateOne(
      { _id: doc._id },
      {
        $set: {
          listPrice,
          price,
          sizes,
          updatedAt: new Date().toISOString(),
          priceMarkupPercent: value,
          priceCutMark: `admin-bulk-${Date.now()}`,
        },
      },
    );
    updated += 1;
  }

  return { updated, percent: value, factor };
}
