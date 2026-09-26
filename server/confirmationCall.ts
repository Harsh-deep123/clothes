import { findStoredOrder, listStoredOrders, StoredOrder, updateStoredOrder, upsertStoredOrder } from './orderStore';
import { formatAddress, spokenOrderScript } from './orderMessage';
import {
  mapWhatsAppStatus,
  refreshWhatsAppFromTwilio,
  sendCustomerOrderEmail,
  sendCustomerOrderWhatsApp,
  type OrderNotifyPayload,
} from './orderNotify';
import { isValidE164, toE164 } from './phone';

export type ConfirmationCallInput = OrderNotifyPayload;

const inFlight = new Set<string>();

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function twimlFor(input: ConfirmationCallInput): string {
  return `<Response><Say voice="alice" language="en-IN">${escapeXml(spokenOrderScript(input))}</Say></Response>`;
}

function callAlreadyAttempted(order: StoredOrder) {
  return (
    order.confirmationCallSent ||
    order.confirmationCallStatus === 'initiated' ||
    order.confirmationCallStatus === 'completed' ||
    order.confirmationCallStatus === 'failed'
  );
}

function twilioAuth() {
  const sid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const token = process.env.TWILIO_AUTH_TOKEN?.trim();
  const from = process.env.TWILIO_FROM_NUMBER?.trim();
  return { sid, token, from };
}

function mapTwilioStatus(status: string): StoredOrder['confirmationCallStatus'] {
  const value = status.toLowerCase();
  if (value === 'completed') return 'completed';
  if (['busy', 'failed', 'no-answer', 'canceled', 'cancelled'].includes(value)) return 'failed';
  return 'initiated';
}

function baseRecord(input: ConfirmationCallInput, existing?: StoredOrder | null): StoredOrder {
  const e164 = toE164(input.customerPhone);
  return {
    id: existing?.id || input.id,
    number: existing?.orderId || existing?.number || input.number,
    orderId: existing?.orderId || existing?.number || input.number,
    userId: existing?.userId,
    paymentMethod: existing?.paymentMethod,
    paymentStatus: existing?.paymentStatus,
    orderStatus: existing?.orderStatus,
    status: existing?.status,
    trackingId: existing?.trackingId,
    deliveryPartner: existing?.deliveryPartner,
    expectedDeliveryDate: existing?.expectedDeliveryDate,
    statusHistory: existing?.statusHistory,
    products: existing?.products,
    shipping: existing?.shipping,
    createdAt: existing?.createdAt || input.createdAt || new Date().toISOString(),
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    customerPhoneE164: e164,
    customerEmail: input.customerEmail || existing?.customerEmail || '',
    deliveryAddress: formatAddress(input.shippingAddress) || existing?.deliveryAddress || '',
    items: input.items?.length ? input.items : existing?.items || [],
    total: input.total,
    confirmationCallSent: existing?.confirmationCallSent || false,
    confirmationCallStatus: existing?.confirmationCallStatus || 'pending',
    confirmationCallSid: existing?.confirmationCallSid,
    confirmationCallError: existing?.confirmationCallError,
    confirmationCallAt: existing?.confirmationCallAt,
    whatsappMessageSent: existing?.whatsappMessageSent || false,
    whatsappMessageStatus: existing?.whatsappMessageStatus || 'pending',
    whatsappMessageSentAt: existing?.whatsappMessageSentAt,
    whatsappMessageId: existing?.whatsappMessageId,
    whatsappError: existing?.whatsappError,
    emailSent: existing?.emailSent || false,
    emailStatus: existing?.emailStatus || 'pending',
    emailSentAt: existing?.emailSentAt,
    emailError: existing?.emailError,
  };
}

export async function refreshCallFromTwilio(order: StoredOrder): Promise<StoredOrder> {
  if (!order.confirmationCallSid || order.confirmationCallStatus === 'completed' || order.confirmationCallStatus === 'failed') {
    return order;
  }
  const { sid, token } = twilioAuth();
  if (!sid || !token) return order;

  const auth = Buffer.from(`${sid}:${token}`).toString('base64');
  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Calls/${order.confirmationCallSid}.json`,
    { headers: { Authorization: `Basic ${auth}` } }
  );
  if (!response.ok) return order;
  const data = (await response.json()) as { status?: string };
  if (!data.status) return order;
  const nextStatus = mapTwilioStatus(data.status);
  if (nextStatus === order.confirmationCallStatus) return order;
  return (
    (await updateStoredOrder(order.id, {
      confirmationCallStatus: nextStatus,
      confirmationCallSent: nextStatus !== 'failed',
      confirmationCallError: nextStatus === 'failed' ? `Twilio call status: ${data.status}` : undefined,
    })) || order
  );
}

export async function listOrdersWithLiveCallStatus(): Promise<StoredOrder[]> {
  const orders = await listStoredOrders();
  const updated: StoredOrder[] = [];
  for (const order of orders) {
    try {
      const withCall = await refreshCallFromTwilio(order);
      const wa = await refreshWhatsAppFromTwilio(withCall);
      if (Object.keys(wa).length) {
        updated.push((await updateStoredOrder(withCall.id, wa)) || withCall);
      } else {
        updated.push(withCall);
      }
    } catch {
      updated.push(order);
    }
  }
  return updated;
}

export async function applyTwilioWhatsAppStatus(
  messageSid: string,
  twilioStatus: string
): Promise<StoredOrder | null> {
  const orders = await listStoredOrders();
  const match = orders.find((item) => item.whatsappMessageId === messageSid);
  if (!match) return null;
  const nextStatus = mapWhatsAppStatus(twilioStatus);
  return updateStoredOrder(match.id, {
    whatsappMessageStatus: nextStatus,
    whatsappMessageSent: nextStatus !== 'failed',
    whatsappError: nextStatus === 'failed' ? `Twilio WhatsApp status: ${twilioStatus}` : undefined,
  });
}

export async function applyTwilioCallStatus(callSid: string, twilioStatus: string): Promise<StoredOrder | null> {
  const orders = await listStoredOrders();
  const match = orders.find((item) => item.confirmationCallSid === callSid);
  if (!match) return null;
  const nextStatus = mapTwilioStatus(twilioStatus);
  return updateStoredOrder(match.id, {
    confirmationCallStatus: nextStatus,
    confirmationCallSent: nextStatus !== 'failed',
    confirmationCallError: nextStatus === 'failed' ? `Twilio call status: ${twilioStatus}` : undefined,
  });
}

async function placeVoiceCall(order: StoredOrder, input: ConfirmationCallInput): Promise<Partial<StoredOrder>> {
  if (callAlreadyAttempted(order)) return {};
  if (!isValidE164(order.customerPhoneE164)) {
    return {
      confirmationCallStatus: 'failed',
      confirmationCallSent: false,
      confirmationCallError: 'Invalid customer phone number for calling.',
    };
  }
  const { sid, token, from } = twilioAuth();
  if (!sid || !token || !from) {
    return {
      confirmationCallStatus: 'failed',
      confirmationCallSent: false,
      confirmationCallError:
        'Twilio Voice is not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_NUMBER.',
    };
  }

  const auth = Buffer.from(`${sid}:${token}`).toString('base64');
  const params = new URLSearchParams({
    To: order.customerPhoneE164,
    From: from,
    Twiml: twimlFor(input),
  });
  const appUrl = process.env.APP_URL?.trim();
  if (appUrl && /^https?:\/\//.test(appUrl) && !appUrl.includes('MY_APP_URL')) {
    params.set('StatusCallback', `${appUrl.replace(/\/$/, '')}/api/twilio/voice-status`);
    params.set('StatusCallbackEvent', 'completed failed busy no-answer canceled');
  }

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Calls.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  });

  if (!response.ok) {
    const details = await response.text();
    return {
      confirmationCallStatus: 'failed',
      confirmationCallSent: false,
      confirmationCallError: `Twilio Voice failed (${response.status}): ${details.slice(0, 280)}`,
    };
  }

  const data = (await response.json()) as { sid?: string };
  return {
    confirmationCallSent: true,
    confirmationCallStatus: 'initiated',
    confirmationCallSid: data.sid,
    confirmationCallAt: new Date().toISOString(),
    confirmationCallError: undefined,
  };
}

export async function initiateConfirmationCall(input: ConfirmationCallInput): Promise<StoredOrder> {
  const lockKey = input.id || input.number;
  while (inFlight.has(lockKey)) {
    await new Promise((resolve) => setTimeout(resolve, 40));
  }
  inFlight.add(lockKey);

  try {
    const existing = (await findStoredOrder(input.id)) || (await findStoredOrder(input.number));
    let order = await upsertStoredOrder(baseRecord(input, existing));

    try {
      order = (await updateStoredOrder(order.id, await sendCustomerOrderEmail(order))) || order;
    } catch (error) {
      order =
        (await updateStoredOrder(order.id, {
          emailSent: false,
          emailStatus: 'failed',
          emailError: error instanceof Error ? error.message : 'Email send failed',
        })) || order;
    }

    try {
      order = (await updateStoredOrder(order.id, await placeVoiceCall(order, input))) || order;
    } catch (error) {
      order =
        (await updateStoredOrder(order.id, {
          confirmationCallSent: false,
          confirmationCallStatus: 'failed',
          confirmationCallError: error instanceof Error ? error.message : 'Call failed',
        })) || order;
    }

    try {
      order = (await updateStoredOrder(order.id, await sendCustomerOrderWhatsApp(order))) || order;
    } catch (error) {
      order =
        (await updateStoredOrder(order.id, {
          whatsappMessageSent: false,
          whatsappMessageStatus: 'failed',
          whatsappError: error instanceof Error ? error.message : 'WhatsApp send failed',
        })) || order;
    }

    return (await findStoredOrder(order.id)) || order;
  } finally {
    inFlight.delete(lockKey);
  }
}
