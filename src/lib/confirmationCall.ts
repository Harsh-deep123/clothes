import type { PlacedOrder } from '../types';

export async function requestOrderConfirmationCall(order: PlacedOrder): Promise<Partial<PlacedOrder>> {
  const response = await fetch('/api/orders/confirmation-call', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      id: order.id,
      number: order.number,
      customerName: order.customer.fullName,
      customerPhone: order.customer.phone,
      customerEmail: order.customer.email,
      total: order.total,
      createdAt: order.createdAt,
      shippingAddress: order.shippingAddress,
      items: order.items.map((item) => ({
        name: item.product.name,
        quantity: item.quantity,
        price: item.price,
      })),
    }),
  });
  const data = (await response.json()) as { order?: Partial<PlacedOrder> & Record<string, unknown>; error?: string };
  if (!response.ok || !data.order) {
    return {
      confirmationCallSent: false,
      confirmationCallStatus: 'failed',
      confirmationCallError: data.error || 'Could not start confirmation notifications.',
      whatsappMessageSent: false,
      whatsappMessageStatus: 'failed',
      whatsappError: data.error || 'Could not start WhatsApp confirmation.',
      emailSent: false,
      emailStatus: 'failed',
      emailError: data.error || 'Could not start email confirmation.',
    };
  }
  return {
    confirmationCallSent: Boolean(data.order.confirmationCallSent),
    confirmationCallStatus: data.order.confirmationCallStatus as PlacedOrder['confirmationCallStatus'],
    confirmationCallSid: data.order.confirmationCallSid as string | undefined,
    confirmationCallError: data.order.confirmationCallError as string | undefined,
    whatsappMessageSent: Boolean(data.order.whatsappMessageSent),
    whatsappMessageStatus: data.order.whatsappMessageStatus as PlacedOrder['whatsappMessageStatus'],
    whatsappMessageSentAt: data.order.whatsappMessageSentAt as string | undefined,
    whatsappMessageId: data.order.whatsappMessageId as string | undefined,
    whatsappError: data.order.whatsappError as string | undefined,
    emailSent: Boolean(data.order.emailSent),
    emailStatus: data.order.emailStatus as PlacedOrder['emailStatus'],
    emailError: data.order.emailError as string | undefined,
  };
}

export function shouldStartConfirmationCall(order: PlacedOrder | null): boolean {
  if (!order) return false;
  const callPending = !order.confirmationCallSent && (!order.confirmationCallStatus || order.confirmationCallStatus === 'pending');
  const whatsappPending =
    !order.whatsappMessageSent &&
    (!order.whatsappMessageStatus || order.whatsappMessageStatus === 'pending');
  const emailPending = !order.emailSent && (!order.emailStatus || order.emailStatus === 'pending');
  return callPending || whatsappPending || emailPending;
}
