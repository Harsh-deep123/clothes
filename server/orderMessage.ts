export type OrderLineItem = {
  name: string;
  quantity: number;
  price: number;
  designId?: string;
  designName?: string;
  selectedSize?: string;
  customName?: string;
};

export function selectedSizeLabel(size?: string | null) {
  const value = (size || '').trim();
  if (!value || /^one[\s-]?size$/i.test(value)) return '';
  return value;
}

function designLine(item: OrderLineItem) {
  if (!item.designName && !item.designId) return '';
  const name = item.designName || 'Selected design';
  return item.designId ? `\nDesign: ${name} (${item.designId})` : `\nDesign: ${name}`;
}

function sizeLine(item: OrderLineItem) {
  const size = selectedSizeLabel(item.selectedSize);
  return size ? `\nSize: ${size}` : '';
}

function nameLine(item: OrderLineItem) {
  const name = (item.customName || '').trim();
  return name ? `\nName: ${name}` : '';
}

export function formatInr(value: number) {
  return `₹${(Number(value) || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatAddress(address?: {
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}) {
  if (!address) return '—';
  return [address.address, address.city, address.state, address.postalCode, address.country]
    .filter(Boolean)
    .join(', ');
}

export function formatWhatsAppOrderMessage(input: {
  customerName: string;
  number: string;
  items: OrderLineItem[];
  total: number;
  address: string;
}) {
  const name = input.customerName.trim() || 'Customer';
  const products = (input.items.length ? input.items : [{ name: 'Your items', quantity: 1, price: input.total }])
    .map(
      (item) =>
        `Product Name: ${item.name}${designLine(item)}${sizeLine(item)}${nameLine(item)}\nQuantity: ${item.quantity}\nPrice: ${formatInr(item.price)}`
    )
    .join('\n\n');

  return `Hello ${name} 👋

Thank you for visiting and shopping with ZAYRO Store! 🛍️

✅ Your order has been successfully confirmed!

📦 Order Number: ${input.number}

🛒 Product Details:

${products}

💰 Total Order Amount: ${formatInr(input.total)}

📍 Delivery Address:
${input.address || '—'}

Thank you for choosing ZAYRO Store ❤️

We will process your order soon and keep you updated regarding delivery.

— ZAYRO Store`;
}

export function spokenOrderScript(input: {
  customerName: string;
  number: string;
  items: OrderLineItem[];
  total: number;
}) {
  const name = input.customerName.trim() || 'customer';
  const products = (input.items.length ? input.items : []).map((item) => {
    const line = (Number(item.price) || 0) * (Number(item.quantity) || 1);
    const design = item.designName ? `, design ${item.designName}` : '';
    const size = selectedSizeLabel(item.selectedSize);
    const sizeSpeech = size ? `, size ${size}` : '';
    const printed = (item.customName || '').trim();
    const nameSpeech = printed ? `, name ${printed}` : '';
    return `${item.name}${design}${sizeSpeech}${nameSpeech}, quantity ${item.quantity}, price ${line.toLocaleString('en-IN')} rupees`;
  });
  const productSpeech = products.length
    ? ` You ordered: ${products.join('. ')}.`
    : '';
  return `Hello ${name}, thank you for shopping with ZAYRO Store. Your order number ${input.number} has been successfully received.${productSpeech} Your order total is ${(Number(input.total) || 0).toLocaleString('en-IN')} rupees. We will process your order soon. Thank you for choosing ZAYRO Store.`;
}
