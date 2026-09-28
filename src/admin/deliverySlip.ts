const CODE128_PATTERNS = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213',
  '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132',
  '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211',
  '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313',
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331',
  '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111',
  '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214',
  '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141',
  '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141',
  '114131', '311141', '411131', '211412', '211214', '211232', '2331112',
];

const START_B = 104;
const STOP = 106;

export type DeliverySlipOrder = {
  id: string;
  number?: string;
  orderId?: string;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress?: string;
  shipping?: {
    address?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  items?: Array<{ name: string; quantity: number; price: number }>;
  total: number;
  paymentMethod?: string;
  paymentStatus?: string;
  trackingId?: string;
  deliveryPartner?: string;
};

function code128Svg(text: string, height = 70): string {
  const values = [START_B];
  for (const char of text) {
    const code = char.charCodeAt(0);
    values.push(code >= 32 && code <= 127 ? code - 32 : 0);
  }
  const checksum = values.reduce((sum, value, index) => sum + value * (index === 0 ? 1 : index), 0) % 103;
  values.push(checksum, STOP);

  const module = 2;
  const quiet = 10 * module;
  let x = quiet;
  const rects: string[] = [];
  for (const value of values) {
    const widths = CODE128_PATTERNS[value];
    for (let i = 0; i < widths.length; i += 1) {
      const width = Number(widths[i]) * module;
      if (i % 2 === 0) rects.push(`<rect x="${x}" y="0" width="${width}" height="${height}"/>`);
      x += width;
    }
  }
  const total = x + quiet;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${height}" width="100%" height="${height}" preserveAspectRatio="none" fill="#000">${rects.join('')}</svg>`;
}

function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function inr(value: number) {
  return `₹${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function isCod(order: DeliverySlipOrder) {
  if (order.paymentMethod) return order.paymentMethod === 'cod';
  return order.paymentStatus !== 'paid';
}

export function deliverySlipHtml(order: DeliverySlipOrder): string {
  const orderId = order.orderId || order.number || order.id;
  const cod = isCod(order);
  const shipping = order.shipping || {};
  const addressLine = shipping.address || order.deliveryAddress || '—';
  const cityLine = [shipping.city, shipping.state].filter(Boolean).join(', ');
  const items = order.items || [];
  const itemCount = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

  const itemRows = items
    .map(
      (item) =>
        `<tr><td>${esc(item.name)}</td><td class="num">${esc(item.quantity)}</td><td class="num">${esc(inr(item.price))}</td></tr>`
    )
    .join('');

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Delivery Slip ${esc(orderId)}</title>
<style>
  @page { size: 100mm 150mm; margin: 0; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: #000; background: #fff; }
  .slip { width: 100mm; min-height: 150mm; padding: 4mm; display: flex; flex-direction: column; gap: 2.5mm; }
  .box { border: 1.5px solid #000; padding: 2.5mm; }
  .row { display: flex; justify-content: space-between; align-items: center; gap: 2mm; }
  .brand { font-family: Georgia, 'Times New Roman', serif; font-size: 20px; letter-spacing: 3px; font-weight: 700; }
  .muted { font-size: 9px; color: #333; }
  .pay { border: 2px solid #000; padding: 1.5mm 3mm; text-align: center; font-weight: 800; }
  .pay.cod { background: #000; color: #fff; }
  .pay .type { font-size: 15px; letter-spacing: 1px; }
  .pay .amt { font-size: 13px; }
  .label { font-size: 8px; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; margin-bottom: 1mm; }
  .name { font-size: 14px; font-weight: 800; }
  .addr { font-size: 11px; line-height: 1.35; }
  .pin { font-size: 18px; font-weight: 800; letter-spacing: 2px; }
  .barcode { text-align: center; }
  .barcode .id { font-family: 'Courier New', monospace; font-size: 13px; font-weight: 700; letter-spacing: 1.5px; margin-top: 1mm; }
  table { width: 100%; border-collapse: collapse; font-size: 9.5px; }
  th, td { border-bottom: 1px solid #999; padding: 1mm 0.5mm; text-align: left; vertical-align: top; }
  th { font-size: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
  .num { text-align: right; white-space: nowrap; }
  .foot { font-size: 8.5px; line-height: 1.35; }
  @media screen { body { background: #e5e5e5; padding: 16px; } .slip { background: #fff; margin: 0 auto; box-shadow: 0 2px 12px rgba(0,0,0,.2); } }
</style>
</head>
<body>
<div class="slip">
  <div class="row">
    <div>
      <div class="brand">ZAYRO</div>
      <div class="muted">${esc(order.deliveryPartner || 'ZAYRO Delivery')} · ${esc(new Date(order.createdAt).toLocaleDateString('en-IN'))}</div>
    </div>
    <div class="pay ${cod ? 'cod' : ''}">
      <div class="type">${cod ? 'COD' : 'PREPAID'}</div>
      <div class="amt">${cod ? `Collect ${esc(inr(order.total))}` : 'Do not collect'}</div>
    </div>
  </div>

  <div class="box barcode">
    ${code128Svg(orderId)}
    <div class="id">${esc(orderId)}</div>
    ${order.trackingId ? `<div class="muted">Tracking ID: ${esc(order.trackingId)}</div>` : ''}
  </div>

  <div class="box">
    <div class="label">Ship to</div>
    <div class="name">${esc(order.customerName)}</div>
    <div class="addr">${esc(addressLine)}${cityLine ? `<br/>${esc(cityLine)}` : ''}${shipping.country ? `<br/>${esc(shipping.country)}` : ''}</div>
    <div class="row" style="margin-top:1.5mm">
      <div class="addr"><b>Phone:</b> ${esc(order.customerPhone)}</div>
      ${shipping.postalCode ? `<div class="pin">${esc(shipping.postalCode)}</div>` : ''}
    </div>
  </div>

  <div class="box">
    <div class="row"><div class="label">Items (${itemCount})</div><div class="label">Total ${esc(inr(order.total))}</div></div>
    <table>
      <thead><tr><th>Product</th><th class="num">Qty</th><th class="num">Price</th></tr></thead>
      <tbody>${itemRows || '<tr><td colspan="3">—</td></tr>'}</tbody>
    </table>
  </div>

  <div class="foot">
    <b>Return to:</b> ZAYRO Store · +91 76819 87334<br/>
    If undelivered, please return to sender. Check the package before accepting.
  </div>
</div>
<script>window.onload = function () { setTimeout(function () { window.print(); }, 250); };</script>
</body>
</html>`;
}

export function printDeliverySlip(order: DeliverySlipOrder): boolean {
  const win = window.open('', '_blank', 'width=480,height=720');
  if (!win) return false;
  win.document.open();
  win.document.write(deliverySlipHtml(order));
  win.document.close();
  return true;
}
