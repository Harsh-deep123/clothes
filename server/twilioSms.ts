import twilio from 'twilio';

function twilioFromNumber() {
  return (process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_FROM_NUMBER || '').trim();
}

export function twilioSmsConfigured() {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID?.trim() &&
      process.env.TWILIO_AUTH_TOKEN?.trim() &&
      twilioFromNumber()
  );
}

export async function sendTwilioSms(toE164: string, body: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const sid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const token = process.env.TWILIO_AUTH_TOKEN?.trim();
  const from = twilioFromNumber();
  if (!sid || !token || !from) {
    return {
      ok: false,
      error: 'SMS is not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER.',
    };
  }

  try {
    const client = twilio(sid, token);
    await client.messages.create({ to: toE164, from, body });
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not send SMS.';
    const safe = /unverified|trial/i.test(message)
      ? 'Could not send SMS to this number. If you are using a Twilio trial account, verify the number in Twilio first.'
      : 'Could not send the OTP SMS. Please try again.';
    return { ok: false, error: safe };
  }
}
