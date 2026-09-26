import nodemailer from 'nodemailer';
import type { StoredOrder, WhatsAppMessageStatus } from './orderStore';
import { formatInr, formatWhatsAppOrderMessage, OrderLineItem } from './orderMessage';
import { isValidE164, toE164 } from './phone';

export type OrderNotifyPayload = {
  id: string;
  number: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  total: number;
  createdAt?: string;
  items: OrderLineItem[];
  shippingAddress?: {
    address?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
};

function twilioAuth() {
  const sid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const token = process.env.TWILIO_AUTH_TOKEN?.trim();
  return { sid, token };
}

export function mapWhatsAppStatus(status: string): WhatsAppMessageStatus {
  const value = status.toLowerCase();
  if (value === 'delivered' || value === 'read') return 'delivered';
  if (value === 'failed' || value === 'undelivered') return 'failed';
  if (value === 'sent' || value === 'queued' || value === 'sending' || value === 'accepted') return 'sent';
  return 'sent';
}

export async function sendCustomerOrderEmail(order: StoredOrder): Promise<Partial<StoredOrder>> {
  if (order.emailSent || order.emailStatus === 'sent' || order.emailStatus === 'failed') {
    return {};
  }
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  if (!host || !user || !pass) {
    return {
      emailSent: false,
      emailStatus: 'failed',
      emailError: 'SMTP is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS.',
    };
  }
  if (!order.customerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(order.customerEmail)) {
    return {
      emailSent: false,
      emailStatus: 'failed',
      emailError: 'Customer email is missing or invalid.',
    };
  }

  const text = formatWhatsAppOrderMessage({
    customerName: order.customerName,
    number: order.number,
    items: order.items || [],
    total: order.total,
    address: order.deliveryAddress || '—',
  });
  const productRows = (order.items || [])
    .map(
      (item) =>
        `<tr><td style="padding:8px;border:1px solid #ddd">${item.name}</td><td style="padding:8px;border:1px solid #ddd">${item.quantity}</td><td style="padding:8px;border:1px solid #ddd">${formatInr(item.price)}</td></tr>`
    )
    .join('');

  const port = Number(process.env.SMTP_PORT || 587);
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
  await transporter.sendMail({
    from: process.env.SMTP_FROM?.trim() || user,
    to: order.customerEmail,
    subject: `ZAYRO Store order confirmed · ${order.number}`,
    text,
    html: `<p>Hello ${order.customerName || 'Customer'},</p><p>Thank you for shopping with <strong>ZAYRO Store</strong>. Your order has been successfully confirmed.</p><p><strong>Order Number:</strong> ${order.number}</p><table style="border-collapse:collapse;font-family:sans-serif;font-size:14px"><tr><th style="padding:8px;border:1px solid #ddd;text-align:left">Product</th><th style="padding:8px;border:1px solid #ddd">Qty</th><th style="padding:8px;border:1px solid #ddd">Price</th></tr>${productRows}</table><p><strong>Total:</strong> ${formatInr(order.total)}</p><p><strong>Delivery address:</strong> ${order.deliveryAddress || '—'}</p><p>We will process your order soon.<br/>— ZAYRO Store</p>`,
  });
  return {
    emailSent: true,
    emailStatus: 'sent',
    emailSentAt: new Date().toISOString(),
    emailError: undefined,
  };
}

async function sendMetaWhatsApp(toE164Phone: string, body: string): Promise<{ sid?: string; error?: string } | null> {
  const token = process.env.WHATSAPP_TOKEN?.trim();
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  if (!token || !phoneId) return null;
  const response = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: toE164Phone.replace(/^\+/, ''),
      type: 'text',
      text: { body },
    }),
  });
  const details = await response.text();
  if (!response.ok) {
    return { error: `WhatsApp Cloud API failed (${response.status}): ${details.slice(0, 280)}` };
  }
  try {
    const parsed = JSON.parse(details) as { messages?: Array<{ id?: string }> };
    return { sid: parsed.messages?.[0]?.id };
  } catch {
    return { sid: undefined };
  }
}

export async function sendCustomerOrderWhatsApp(order: StoredOrder): Promise<Partial<StoredOrder>> {
  if (
    order.whatsappMessageSent ||
    order.whatsappMessageStatus === 'sent' ||
    order.whatsappMessageStatus === 'delivered' ||
    order.whatsappMessageStatus === 'failed'
  ) {
    return {};
  }

  const e164 = order.customerPhoneE164 || toE164(order.customerPhone);
  if (!isValidE164(e164)) {
    return {
      whatsappMessageSent: false,
      whatsappMessageStatus: 'failed',
      whatsappError: 'Invalid customer phone number for WhatsApp.',
    };
  }

  const body = formatWhatsAppOrderMessage({
    customerName: order.customerName,
    number: order.number,
    items: order.items || [],
    total: order.total,
    address: order.deliveryAddress || '—',
  });

  const cloud = await sendMetaWhatsApp(e164, body);
  if (cloud) {
    if (cloud.error) {
      return {
        whatsappMessageSent: false,
        whatsappMessageStatus: 'failed',
        whatsappError: cloud.error,
      };
    }
    return {
      whatsappMessageSent: true,
      whatsappMessageStatus: 'sent',
      whatsappMessageId: cloud.sid,
      whatsappMessageSentAt: new Date().toISOString(),
      whatsappError: undefined,
    };
  }

  const { sid, token } = twilioAuth();
  const from = process.env.TWILIO_WHATSAPP_FROM?.trim();
  if (!sid || !token || !from) {
    return {
      whatsappMessageSent: false,
      whatsappMessageStatus: 'failed',
      whatsappError:
        'WhatsApp is not configured. Set TWILIO_WHATSAPP_FROM with Twilio credentials, or WHATSAPP_TOKEN and WHATSAPP_PHONE_NUMBER_ID.',
    };
  }

  const auth = Buffer.from(`${sid}:${token}`).toString('base64');
  const params = new URLSearchParams({
    To: `whatsapp:${e164}`,
    From: from.startsWith('whatsapp:') ? from : `whatsapp:${from}`,
    Body: body,
  });
  const appUrl = process.env.APP_URL?.trim();
  if (appUrl && /^https?:\/\//.test(appUrl) && !appUrl.includes('MY_APP_URL')) {
    params.set('StatusCallback', `${appUrl.replace(/\/$/, '')}/api/twilio/message-status`);
  }

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  });
  const details = await response.text();
  if (!response.ok) {
    return {
      whatsappMessageSent: false,
      whatsappMessageStatus: 'failed',
      whatsappError: `Twilio WhatsApp failed (${response.status}): ${details.slice(0, 280)}`,
    };
  }
  let messageSid: string | undefined;
  try {
    messageSid = (JSON.parse(details) as { sid?: string }).sid;
  } catch {
    messageSid = undefined;
  }
  return {
    whatsappMessageSent: true,
    whatsappMessageStatus: 'sent',
    whatsappMessageId: messageSid,
    whatsappMessageSentAt: new Date().toISOString(),
    whatsappError: undefined,
  };
}

export async function refreshWhatsAppFromTwilio(order: StoredOrder): Promise<Partial<StoredOrder>> {
  if (
    !order.whatsappMessageId ||
    order.whatsappMessageStatus === 'delivered' ||
    order.whatsappMessageStatus === 'failed'
  ) {
    return {};
  }
  const { sid, token } = twilioAuth();
  if (!sid || !token || !order.whatsappMessageId) return {};
  if (!/^SM|^MM/.test(order.whatsappMessageId)) return {};
  const auth = Buffer.from(`${sid}:${token}`).toString('base64');
  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages/${order.whatsappMessageId}.json`,
    { headers: { Authorization: `Basic ${auth}` } }
  );
  if (!response.ok) return {};
  const data = (await response.json()) as { status?: string };
  if (!data.status) return {};
  const status = mapWhatsAppStatus(data.status);
  if (status === order.whatsappMessageStatus) return {};
  return {
    whatsappMessageStatus: status,
    whatsappMessageSent: status !== 'failed',
    whatsappError: status === 'failed' ? `Twilio WhatsApp status: ${data.status}` : undefined,
  };
}
