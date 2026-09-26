export type OrderLineItem = {
  name: string;
  quantity: number;
  price: number;
};

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
        `Product Name: ${item.name}\nQuantity: ${item.quantity}\nPrice: ${formatInr(item.price)}`
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
    return `${item.name}, quantity ${item.quantity}, price ${line.toLocaleString('en-IN')} rupees`;
  });
  const productSpeech = products.length
    ? ` You ordered: ${products.join('. ')}.`
    : '';
  return `Hello ${name}, thank you for shopping with ZAYRO Store. Your order number ${input.number} has been successfully received.${productSpeech} Your order total is ${(Number(input.total) || 0).toLocaleString('en-IN')} rupees. We will process your order soon. Thank you for choosing ZAYRO Store.`;
}
