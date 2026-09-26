import nodemailer from 'nodemailer';
import type { ReturnRequest } from '../src/types/returnRequest';
import { toE164 } from './phone';

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'harshdhiman613@gmail.com').trim();
const ADMIN_PHONE = (process.env.ADMIN_WHATSAPP || process.env.ADMIN_PHONE || '917681987334').replace(
  /\D/g,
  ''
);

function requestHeadline(request: ReturnRequest) {
  const kind = request.requestType === 'replace' ? 'Replace' : 'Return';
  return `🚨 New ${kind} Request`;
}

export function formatAdminText(request: ReturnRequest): string {
  const kind = request.requestType === 'replace' ? 'Replace' : 'Return';
  return [
    requestHeadline(request),
    `Request Type: ${kind}`,
    `Order Number: ${request.orderNumber || '—'}`,
    `Customer Name: ${request.customerName}`,
    `Customer Phone Number: ${request.customerPhone}`,
    `Customer Email: ${request.customerEmail}`,
    `Customer Complete Address: ${request.customerAddress || '—'}`,
    `Product Name: ${request.productName || '—'}`,
    `Product Details: ${request.productDetails || '—'}`,
    `Reason for Return/Replacement: ${request.reason || '—'}`,
    `Additional customer message: ${request.additionalMessage || '—'}`,
    `Order matched: ${request.orderMatched ? 'Yes' : 'No'}`,
    `Request ID: ${request.id}`,
  ].join('\n');
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatAdminHtml(request: ReturnRequest): string {
  const rows: Array<[string, string]> = [
    ['Request Type', request.requestType === 'replace' ? 'Replace' : 'Return'],
    ['Order Number', request.orderNumber || '—'],
    ['Customer Name', request.customerName],
    ['Customer Phone Number', request.customerPhone],
    ['Customer Email', request.customerEmail],
    ['Customer Complete Address', request.customerAddress || '—'],
    ['Product Name', request.productName || '—'],
    ['Product Details', request.productDetails || '—'],
    ['Reason for Return/Replacement', request.reason || '—'],
    ['Additional customer message', request.additionalMessage || '—'],
    ['Order matched', request.orderMatched ? 'Yes' : 'No'],
    ['Request ID', request.id],
  ];
  const table = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:8px;border:1px solid #ddd;font-weight:600">${escapeHtml(label)}</td><td style="padding:8px;border:1px solid #ddd">${escapeHtml(value).replace(/\n/g, '<br/>')}</td></tr>`
    )
    .join('');
  return `<h2>${escapeHtml(requestHeadline(request))}</h2><table style="border-collapse:collapse;font-family:sans-serif;font-size:14px">${table}</table>`;
}

async function sendAdminEmail(request: ReturnRequest): Promise<{ sent: boolean; error?: string }> {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  if (!host || !user || !pass) {
    return {
      sent: false,
      error: 'SMTP is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS.',
    };
  }

  const port = Number(process.env.SMTP_PORT || 587);
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM?.trim() || user,
    to: ADMIN_EMAIL,
    replyTo: request.customerEmail,
    subject: `${requestHeadline(request)} · ${request.orderNumber || request.id}`,
    text: formatAdminText(request),
    html: formatAdminHtml(request),
  });
  return { sent: true };
}

async function sendTwilioMessage(
  to: string,
  from: string,
  body: string
): Promise<{ sent: boolean; error?: string }> {
  const sid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const token = process.env.TWILIO_AUTH_TOKEN?.trim();
  if (!sid || !token) {
    return { sent: false, error: 'Twilio is not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.' };
  }

  const auth = Buffer.from(`${sid}:${token}`).toString('base64');
  const params = new URLSearchParams({ To: to, From: from, Body: body });
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  });
  if (!response.ok) {
    const details = await response.text();
    return { sent: false, error: `Twilio request failed (${response.status}): ${details.slice(0, 280)}` };
  }
  return { sent: true };
}

async function sendWhatsAppCloud(body: string): Promise<{ sent: boolean; error?: string } | null> {
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
      to: ADMIN_PHONE,
      type: 'text',
      text: { body },
    }),
  });
  if (!response.ok) {
    const details = await response.text();
    return { sent: false, error: `WhatsApp Cloud API failed (${response.status}): ${details.slice(0, 280)}` };
  }
  return { sent: true };
}

export async function notifyAdmin(request: ReturnRequest): Promise<ReturnRequest['notifications']> {
  const text = formatAdminText(request);
  const notifications: ReturnRequest['notifications'] = {
    email: { sent: false },
    whatsapp: { sent: false },
    sms: { sent: false },
  };

  try {
    notifications.email = await sendAdminEmail(request);
  } catch (error) {
    notifications.email = { sent: false, error: error instanceof Error ? error.message : 'Email send failed' };
  }

  try {
    const cloud = await sendWhatsAppCloud(text);
    if (cloud) {
      notifications.whatsapp = cloud;
    } else {
      const from = process.env.TWILIO_WHATSAPP_FROM?.trim();
      if (from) {
        notifications.whatsapp = await sendTwilioMessage(`whatsapp:${toE164(ADMIN_PHONE)}`, from, text);
      } else {
        notifications.whatsapp = {
          sent: false,
          error:
            'WhatsApp is not configured. Set WHATSAPP_TOKEN + WHATSAPP_PHONE_NUMBER_ID, or TWILIO_WHATSAPP_FROM with Twilio credentials.',
        };
      }
    }
  } catch (error) {
    notifications.whatsapp = {
      sent: false,
      error: error instanceof Error ? error.message : 'WhatsApp send failed',
    };
  }

  try {
    const smsFrom = process.env.TWILIO_FROM_NUMBER?.trim();
    if (smsFrom) {
      notifications.sms = await sendTwilioMessage(toE164(ADMIN_PHONE), smsFrom, text);
    } else if (!notifications.whatsapp.sent) {
      notifications.sms = {
        sent: false,
        error: 'SMS is not configured. Set TWILIO_FROM_NUMBER with Twilio credentials as a fallback.',
      };
    }
  } catch (error) {
    notifications.sms = { sent: false, error: error instanceof Error ? error.message : 'SMS send failed' };
  }

  return notifications;
}
