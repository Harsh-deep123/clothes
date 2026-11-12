import type { Db } from 'mongodb';

const COUNTER_ID = 'productSku';
const PREFIX = 'ZY-';

export function formatProductSku(seq: number) {
  const n = Math.max(1, Math.floor(Number(seq) || 1));
  return `${PREFIX}${String(n).padStart(6, '0')}`;
}

export function parseProductSku(sku: unknown): number | null {
  const raw = String(sku || '')
    .trim()
    .toUpperCase();
  const match = /^ZY-(\d+)$/.exec(raw);
  if (!match) return null;
  const n = Number(match[1]);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export async function allocateNextProductSku(db: Db): Promise<string> {
  const counters = db.collection<{ _id: string; seq: number }>('counters');
  const result = await counters.findOneAndUpdate(
    { _id: COUNTER_ID },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: 'after' },
  );
  const seq = Number(result?.seq) || 1;
  return formatProductSku(seq);
}

export async function ensureProductSku(
  db: Db,
  product: Record<string, unknown>,
): Promise<string> {
  const existing = parseProductSku(product.sku);
  if (existing) return formatProductSku(existing);
  return allocateNextProductSku(db);
}

export async function syncProductSkuCounter(db: Db, maxSeq: number) {
  const counters = db.collection<{ _id: string; seq: number }>('counters');
  const current = await counters.findOne({ _id: COUNTER_ID });
  const seq = Math.max(Number(current?.seq) || 0, Math.max(0, Math.floor(maxSeq)));
  await counters.updateOne({ _id: COUNTER_ID }, { $set: { seq } }, { upsert: true });
}
