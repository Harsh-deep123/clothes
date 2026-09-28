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

/** Seller details printed in "Shipped By". Empty fields are hidden on the slip. */
export const SLIP_SELLER = {
  name: 'ZAYRO Store',
  addressLines: [] as string[],
  gstin: '',
  phone: '7681987334',
  alternatePhone: '',
  jurisdiction: 'Punjab',
  defaultHsn: '6109',
  igstPercent: 0,
  defaultDimensionsCm: '30.00x25.00x5.00',
  defaultWeightKg: '0.50',
};

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
  products?: Array<{
    productId?: string;
    name?: string;
    quantity?: number;
    price?: number;
    selectedSize?: string;
    selectedColor?: string;
  }>;
  total: number;
  paymentMethod?: string;
  paymentStatus?: string;
  trackingId?: string;
  deliveryPartner?: string;
};

function code128Svg(text: string, height = 60): string {
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

function money(value: number) {
  return Number(value || 0).toFixed(2);
}

function isCod(order: DeliverySlipOrder) {
  if (order.paymentMethod) return order.paymentMethod === 'cod';
  return order.paymentStatus !== 'paid';
}

function routingCode(state?: string, city?: string) {
  const part = (value?: string, length = 3) =>
    (value || '')
      .replace(/[^A-Za-z]/g, '')
      .slice(0, length)
      .toUpperCase();
  const s = part(state, 2);
  const c = part(city, 3);
  return s || c ? [s, c].filter(Boolean).join('/') : '';
}

function invoiceNumber(orderId: string) {
  const tail = orderId.replace(/^ZAYRO-/, '').replace(/-/g, '');
  return `ZAY-INV-${tail}`;
}

type SlipLine = { name: string; sku: string; qty: number; unit: number };

function slipLines(order: DeliverySlipOrder): SlipLine[] {
  if (order.products?.length) {
    return order.products.map((product) => {
      const skuParts = [product.productId, product.selectedSize, product.selectedColor].filter(Boolean);
      return {
        name: product.name || 'Item',
        sku: skuParts.join('-').toUpperCase(),
        qty: Number(product.quantity) || 1,
        unit: Number(product.price) || 0,
      };
    });
  }
  return (order.items || []).map((item) => ({
    name: item.name,
    sku: '',
    qty: Number(item.quantity) || 1,
    unit: Number(item.price) || 0,
  }));
}

export function deliverySlipHtml(order: DeliverySlipOrder): string {
  const orderId = order.orderId || order.number || order.id;
  const awb = (order.trackingId || '').trim() || orderId;
  const cod = isCod(order);
  const shipping = order.shipping || {};
  const addressLine = shipping.address || order.deliveryAddress || '';
  const cityState = [shipping.city, shipping.state, shipping.country || 'India'].filter(Boolean).join(', ');
  const route = routingCode(shipping.state, shipping.city);
  const created = new Date(order.createdAt);
  const invoiceDate = Number.isNaN(created.getTime()) ? '' : created.toISOString().slice(0, 10);
  const seller = SLIP_SELLER;
  const lines = slipLines(order);

  const productRows = lines
    .map((line) => {
      const taxable = line.unit * line.qty;
      const igst = (taxable * seller.igstPercent) / 100;
      return `<tr>
        <td class="pname">${esc(line.name)}${line.sku ? `<div class="sku">SKU: ${esc(line.sku)}</div>` : ''}</td>
        <td class="c">${esc(seller.defaultHsn)}</td>
        <td class="c">${line.qty}</td>
        <td class="r">${money(line.unit)}</td>
        <td class="r">${money(taxable)}</td>
        <td class="r">${money(igst)}</td>
        <td class="r">${money(taxable + igst)}</td>
      </tr>`;
    })
    .join('');

  const sellerLines = [
    ...seller.addressLines.map((line) => esc(line)),
    seller.gstin ? `GSTIN: ${esc(seller.gstin)}` : '',
    seller.phone ? `Phone No.: ${esc(seller.phone)}` : '',
    seller.alternatePhone ? `Alternate No.: ${esc(seller.alternatePhone)}` : '',
  ]
    .filter(Boolean)
    .join('<br/>');

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Shipping Label ${esc(orderId)}</title>
<style>
  @page { size: 101.6mm 152.4mm; margin: 0; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: #000; background: #fff; }
  .label { width: 101.6mm; min-height: 152.4mm; padding: 2mm; }
  .frame { border: 2px solid #000; }
  .sec { border-bottom: 2px solid #000; padding: 2mm 2.5mm; }
  .sec:last-child { border-bottom: 0; }
  .split { display: flex; gap: 2mm; }
  .split > div { flex: 1; min-width: 0; }
  h4 { margin: 0 0 1mm; font-size: 11px; }
  h4 small { font-weight: 400; font-size: 9px; }
  .ital { font-style: italic; font-size: 10.5px; line-height: 1.35; }
  .brand { display: flex; align-items: center; justify-content: center; }
  .brand span { font-family: Georgia, 'Times New Roman', serif; font-size: 26px; font-weight: 700; letter-spacing: 4px; }
  .brand small { display: block; text-align: center; font-size: 8px; letter-spacing: 2px; }
  .meta { font-family: 'Times New Roman', serif; font-size: 10px; border-collapse: collapse; }
  .meta td { padding: 0.6mm 1.5mm 0.6mm 0; vertical-align: top; }
  .bc { text-align: center; font-family: 'Times New Roman', serif; }
  .bc .top { font-size: 12px; margin-bottom: 1mm; }
  .bc .num { font-size: 10px; margin-top: 0.6mm; }
  .bc .sub { font-size: 10px; margin-top: 0.8mm; }
  .cod { display: inline-block; background: #000; color: #fff; padding: 0 1.5mm; font-weight: 700; }
  table.items { width: 100%; border-collapse: collapse; font-family: 'Times New Roman', serif; font-size: 8.5px; }
  table.items th, table.items td { border: 1px solid #000; padding: 0.8mm; vertical-align: top; }
  table.items th { font-size: 8.5px; }
  .pname { width: 40%; }
  .sku { margin-top: 0.8mm; }
  .c { text-align: center; }
  .r { text-align: right; white-space: nowrap; }
  .items-wrap { padding: 1mm; }
  .fine { font-size: 9.5px; line-height: 1.35; }
  .foot { display: flex; justify-content: space-between; align-items: flex-end; font-size: 7.5px; }
  .foot b { font-size: 11px; letter-spacing: 1px; }
  @media screen { body { background: #e5e5e5; padding: 16px; } .label { background: #fff; margin: 0 auto; box-shadow: 0 2px 12px rgba(0,0,0,.2); } }
</style>
</head>
<body>
<div class="label"><div class="frame">

  <div class="sec split">
    <div>
      <h4>Ship To</h4>
      <div class="ital">
        ${esc(order.customerName).toUpperCase()}<br/>
        ${addressLine ? `${esc(addressLine)}<br/>` : ''}
        ${cityState ? `${esc(cityState)}<br/>` : ''}
        ${shipping.postalCode ? `${esc(shipping.postalCode)}<br/>` : ''}
        Phone No.: ${esc(order.customerPhone)}
      </div>
    </div>
    <div class="brand" style="flex:0 0 32%"><div><span>ZAYRO</span><small>COLLECTION</small></div></div>
  </div>

  <div class="sec split">
    <div>
      <table class="meta">
        <tr><td>Dimensions:</td><td>${esc(seller.defaultDimensionsCm)}</td></tr>
        <tr><td>Payment:</td><td><b>${cod ? '<span class="cod">COD</span>' : 'PREPAID'}</b></td></tr>
        <tr><td>ORDER TOTAL:</td><td>${money(order.total)} INR</td></tr>
        ${cod ? `<tr><td><b>COLLECT:</b></td><td><b>${money(order.total)} INR</b></td></tr>` : ''}
        <tr><td>Weight:</td><td>${esc(seller.defaultWeightKg)} KG</td></tr>
        <tr><td>eWaybill No.:</td><td>N/A</td></tr>
      </table>
    </div>
    <div class="bc">
      <div class="top">${esc(order.deliveryPartner || 'ZAYRO Express')}</div>
      ${code128Svg(awb, 52)}
      <div class="num">${esc(awb)}</div>
      ${route ? `<div class="sub">Routing Code: ${esc(route)}</div>` : ''}
    </div>
  </div>

  <div class="sec split">
    <div>
      <h4>Shipped By<small>(If undelivered, return to)</small></h4>
      <div class="ital">
        ${esc(seller.name)}${sellerLines ? `<br/>${sellerLines}` : ''}
      </div>
    </div>
    <div class="bc" style="font-family: Arial, sans-serif">
      <div class="top" style="font-size:10px;white-space:nowrap">Order #: ${esc(orderId)}</div>
      ${code128Svg(orderId, 44)}
      <div class="sub" style="text-align:left">Invoice No.: ${esc(invoiceNumber(orderId))}</div>
      ${invoiceDate ? `<div class="sub" style="text-align:left">Invoice Date: ${esc(invoiceDate)}</div>` : ''}
    </div>
  </div>

  <div class="sec items-wrap">
    <table class="items">
      <thead>
        <tr>
          <th>Product Name &amp; SKU</th><th>HSN</th><th>Qty</th><th>Unit Price</th><th>Taxable Value</th><th>IGST</th><th>Total</th>
        </tr>
      </thead>
      <tbody>${productRows || '<tr><td colspan="7">—</td></tr>'}</tbody>
    </table>
  </div>

  <div class="sec fine">
    All disputes are subject to ${esc(seller.jurisdiction)} jurisdiction only. Goods once sold will only be taken back or
    exchanged as per the store's exchange/return policy.
  </div>

  <div class="sec foot">
    <span>THIS IS AN AUTO-GENERATED LABEL AND DOES NOT NEED SIGNATURE.</span>
    <span style="text-align:right">Powered By:<br/><b>ZAYRO</b></span>
  </div>

</div></div>
<script>window.onload = function () { setTimeout(function () { window.print(); }, 250); };</script>
</body>
</html>`;
}

export function printDeliverySlip(order: DeliverySlipOrder): boolean {
  const win = window.open('', '_blank', 'width=480,height=760');
  if (!win) return false;
  win.document.open();
  win.document.write(deliverySlipHtml(order));
  win.document.close();
  return true;
}
