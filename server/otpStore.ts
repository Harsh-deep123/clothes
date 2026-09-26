import { randomInt, randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import { getDb } from './mongo';
import { maskIndianMobile, normalizeIndianMobile } from './indianPhone';
import { sendTwilioSms, twilioSmsConfigured } from './twilioSms';
import { createUserFromVerifiedSignup, findUserByEmail, findUserByPhone, type PublicUser } from './userStore';

const OTP_TTL_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 60 * 1000;

type OtpChallenge = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  passwordHash: string;
  otpHash: string;
  expiresAt: string;
  expireAt: Date;
  attempts: number;
  lastSentAt: string;
};

function generateOtp(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0');
}

async function challenges() {
  const db = await getDb();
  return db?.collection<OtpChallenge>('otp_challenges') || null;
}

export async function sendRegistrationOtp(input: {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}): Promise<
  | { maskedPhone: string; resendAfterSeconds: number }
  | { error: string; status: number }
> {
  const collection = await challenges();
  if (!collection) return { error: 'Database is unavailable.', status: 503 };
  if (!twilioSmsConfigured()) {
    return {
      error: 'SMS is not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER.',
      status: 503,
    };
  }

  const fullName = input.fullName.trim();
  const email = input.email.trim().toLowerCase();
  const phone = normalizeIndianMobile(input.phone);
  if (fullName.length < 2) return { error: 'Enter your full name.', status: 400 };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'Enter a valid email address.', status: 400 };
  if (!phone) return { error: 'Enter a valid 10-digit Indian mobile number.', status: 400 };
  if (input.password.length < 8) return { error: 'Password must be at least 8 characters.', status: 400 };

  const existingEmail = await findUserByEmail(email);
  if (existingEmail) return { error: 'An account already exists for this email.', status: 409 };
  const existingPhone = await findUserByPhone(phone);
  if (existingPhone) return { error: 'An account already exists for this phone number.', status: 409 };

  const now = Date.now();
  const current = await collection.findOne({ email, phone });
  if (current?.lastSentAt) {
    const elapsed = now - new Date(current.lastSentAt).getTime();
    if (elapsed < RESEND_COOLDOWN_MS) {
      return {
        error: `Please wait ${Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000)} seconds before requesting another OTP.`,
        status: 429,
      };
    }
  }

  const otp = generateOtp();
  const otpHash = await bcrypt.hash(otp, 10);
  const passwordHash = await bcrypt.hash(input.password, 10);
  const expiresAt = new Date(now + OTP_TTL_MS);
  const id = current?.id || randomUUID();

  const sms = await sendTwilioSms(phone, `Your ZAYRO Store verification code is ${otp}. It expires in 5 minutes.`);
  if (sms.ok === false) return { error: sms.error, status: 502 };

  const doc: OtpChallenge = {
    id,
    fullName,
    email,
    phone,
    passwordHash,
    otpHash,
    expiresAt: expiresAt.toISOString(),
    expireAt: expiresAt,
    attempts: 0,
    lastSentAt: new Date(now).toISOString(),
  };

  await collection.updateOne({ email, phone }, { $set: doc }, { upsert: true });

  return { maskedPhone: maskIndianMobile(phone), resendAfterSeconds: 60 };
}

export async function verifyRegistrationOtp(input: {
  email: string;
  phone: string;
  otp: string;
}): Promise<{ user: PublicUser } | { error: string; status: number }> {
  const collection = await challenges();
  if (!collection) return { error: 'Database is unavailable.', status: 503 };

  const email = input.email.trim().toLowerCase();
  const phone = normalizeIndianMobile(input.phone);
  const otp = input.otp.replace(/\D/g, '');
  if (!phone) return { error: 'Enter a valid 10-digit Indian mobile number.', status: 400 };
  if (!/^\d{6}$/.test(otp)) return { error: 'Invalid OTP. Please try again.', status: 400 };

  const challenge = await collection.findOne({ email, phone });
  if (!challenge) return { error: 'OTP expired. Please request a new OTP.', status: 400 };

  if (Date.now() > new Date(challenge.expiresAt).getTime()) {
    await collection.deleteOne({ id: challenge.id });
    return { error: 'OTP expired. Please request a new OTP.', status: 400 };
  }

  if (challenge.attempts >= MAX_ATTEMPTS) {
    await collection.deleteOne({ id: challenge.id });
    return { error: 'Too many incorrect attempts. Please request a new OTP.', status: 429 };
  }

  const ok = await bcrypt.compare(otp, challenge.otpHash);
  if (!ok) {
    const attempts = challenge.attempts + 1;
    if (attempts >= MAX_ATTEMPTS) {
      await collection.deleteOne({ id: challenge.id });
      return { error: 'Too many incorrect attempts. Please request a new OTP.', status: 429 };
    }
    await collection.updateOne({ id: challenge.id }, { $set: { attempts } });
    return { error: 'Invalid OTP. Please try again.', status: 400 };
  }

  const created = await createUserFromVerifiedSignup({
    fullName: challenge.fullName,
    email: challenge.email,
    phone: challenge.phone,
    passwordHash: challenge.passwordHash,
  });
  if ('error' in created) return created;

  await collection.deleteOne({ id: challenge.id });
  return { user: created.user };
}
