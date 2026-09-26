import React, { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, X } from 'lucide-react';
import { LocalAccount, ViewScreen } from '../../types';
import { isValidIndianMobile } from '../../lib/indianPhone';
import { apiSendOtp, apiVerifyOtp, toLocalAccount } from '../../lib/shopApi';

const inputClass =
  'w-full border border-[#cfc4c5] bg-white px-4 py-3 text-sm focus:border-black focus:outline-none';
const labelClass = 'text-xs uppercase tracking-[0.15em] font-semibold text-black mb-2 block';
const btnClass =
  'w-full bg-black text-white text-xs font-semibold uppercase py-4 tracking-[0.2em] hover:bg-neutral-800 transition-colors cursor-pointer active:scale-[0.99]';

interface AuthShared {
  onNavigate: (screen: ViewScreen, category?: string) => void;
}

interface LoginPageProps extends AuthShared {
  onLogin: (email: string, password: string) => string | null | Promise<string | null>;
  embedded?: boolean;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate, onLogin, embedded = false }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Enter a valid email address.');
      return;
    }
    if (!password) {
      setError('Enter your password.');
      return;
    }
    setSubmitting(true);
    try {
      const result = await onLogin(email.trim(), password);
      setError(result);
    } finally {
      setSubmitting(false);
    }
  };

  const body = (
      <div className="max-w-md mx-auto">
        <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#5d5f5f] block mb-3">
          Account
        </span>
        <h1 className="font-serif-luxury text-3xl sm:text-5xl tracking-tight uppercase text-black font-normal mb-3">
          WELCOME BACK
        </h1>
        <p className="text-sm text-[#5d5f5f] font-light mb-8 leading-relaxed">
          Sign in to the account saved on this device. This is a local profile only — no remote login service is
          connected.
        </p>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="login-email" className={labelClass}>
              Email Address
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              autoComplete="email"
            />
          </div>
          <div>
            <label htmlFor="login-password" className={labelClass}>
              Password
            </label>
            <div className="relative">
              <input
                id="login-password"
                type={show ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${inputClass} pr-12`}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5d5f5f] hover:text-black cursor-pointer"
                aria-label={show ? 'Hide password' : 'Show password'}
              >
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          {error && <p className="text-sm text-[#ba1a1a]">{error}</p>}
          <button type="submit" disabled={submitting} className={btnClass}>
            {submitting ? 'Please wait…' : 'Login'}
          </button>
        </form>
        <div className="mt-6 flex flex-col gap-3 text-xs uppercase tracking-[0.15em]">
          <button
            type="button"
            onClick={() => onNavigate('forgot-password')}
            className="text-[#5d5f5f] hover:text-black hover:underline text-left cursor-pointer"
          >
            Forgot Password
          </button>
          <button
            type="button"
            onClick={() => onNavigate('register')}
            className="text-black hover:underline text-left cursor-pointer font-medium"
          >
            Create Account
          </button>
        </div>
      </div>
  );

  if (embedded) return body;

  return (
    <main className="flex-grow pt-28 md:pt-36 px-5 md:px-16 max-w-[1440px] mx-auto w-full pb-20">
      {body}
    </main>
  );
};

interface RegisterPageProps extends AuthShared {
  onRegister: (account: LocalAccount) => string | null | Promise<string | null>;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigate, onRegister }) => {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirm: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [otpOpen, setOtpOpen] = useState(false);
  const [maskedPhone, setMaskedPhone] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (!otpOpen) return;
    const timer = window.setInterval(() => {
      setResendIn((seconds) => Math.max(0, seconds - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [otpOpen]);

  const accountFromForm = (): LocalAccount => ({
    fullName: form.fullName.trim(),
    email: form.email.trim().toLowerCase(),
    phone: form.phone.trim(),
    password: form.password,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.fullName.trim().length < 2) {
      setError('Enter your full name.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError('Enter a valid email address.');
      return;
    }
    if (!isValidIndianMobile(form.phone)) {
      setError('Enter a valid 10-digit Indian mobile number.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const masked = await apiSendOtp(accountFromForm());
      setMaskedPhone(masked);
      setOtpDigits(['', '', '', '', '', '']);
      setOtpError(null);
      setResendIn(60);
      setOtpOpen(true);
      window.setTimeout(() => otpRefs.current[0]?.focus(), 50);
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Could not send OTP.');
    } finally {
      setSubmitting(false);
    }
  };

  const applyOtpValue = (next: string[]) => {
    setOtpDigits(next);
    setOtpError(null);
  };

  const handleOtpChange = (index: number, value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length > 1) {
      const next = ['', '', '', '', '', ''];
      digits.slice(0, 6).split('').forEach((digit, i) => {
        next[i] = digit;
      });
      applyOtpValue(next);
      otpRefs.current[Math.min(digits.length, 6) - 1]?.focus();
      return;
    }
    const digit = digits.slice(-1);
    const next = [...otpDigits];
    next[index] = digit;
    applyOtpValue(next);
    if (digit && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      e.preventDefault();
      const next = [...otpDigits];
      next[index - 1] = '';
      applyOtpValue(next);
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length !== 6) return;
    e.preventDefault();
    applyOtpValue(pasted.split(''));
    otpRefs.current[5]?.focus();
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const otp = otpDigits.join('');
    if (otp.length !== 6) {
      setOtpError('Invalid OTP. Please try again.');
      return;
    }
    setVerifying(true);
    setOtpError(null);
    try {
      const user = await apiVerifyOtp(accountFromForm(), otp);
      setOtpOpen(false);
      const result = await onRegister(toLocalAccount(user));
      setError(result);
    } catch (verifyError) {
      setOtpError(verifyError instanceof Error ? verifyError.message : 'Invalid OTP. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (resendIn > 0) return;
    setOtpError(null);
    try {
      const masked = await apiSendOtp(accountFromForm());
      setMaskedPhone(masked);
      setOtpDigits(['', '', '', '', '', '']);
      setResendIn(60);
      otpRefs.current[0]?.focus();
    } catch (sendError) {
      setOtpError(sendError instanceof Error ? sendError.message : 'Could not send OTP.');
    }
  };

  return (
    <main className="flex-grow pt-28 md:pt-36 px-5 md:px-16 max-w-[1440px] mx-auto w-full pb-20">
      <div className="max-w-md mx-auto">
        <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#5d5f5f] block mb-3">
          Account
        </span>
        <h1 className="font-serif-luxury text-3xl sm:text-5xl tracking-tight uppercase text-black font-normal mb-3">
          CREATE YOUR ACCOUNT
        </h1>
        <p className="text-sm text-[#5d5f5f] font-light mb-8 leading-relaxed">
          Your profile is saved only in this browser. It is not a secure cloud login.
        </p>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className={labelClass} htmlFor="reg-name">
              Full Name
            </label>
            <input
              id="reg-name"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="reg-email">
              Email Address
            </label>
            <input
              id="reg-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="reg-phone">
              Phone Number
            </label>
            <input
              id="reg-phone"
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="reg-pass">
              Password
            </label>
            <input
              id="reg-pass"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="reg-confirm">
              Confirm Password
            </label>
            <input
              id="reg-confirm"
              type="password"
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              className={inputClass}
            />
          </div>
          {error && <p className="text-sm text-[#ba1a1a]">{error}</p>}
          <button type="submit" disabled={submitting} className={btnClass}>
            {submitting ? 'Please wait…' : 'Create Account'}
          </button>
        </form>
        <button
          type="button"
          onClick={() => onNavigate('login')}
          className="mt-6 text-xs uppercase tracking-[0.15em] text-[#5d5f5f] hover:text-black hover:underline cursor-pointer"
        >
          Already have an account? Login
        </button>
      </div>
      {otpOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative bg-white w-full max-w-md max-h-[92vh] overflow-y-auto shadow-2xl border border-[#cfc4c5]/30 z-10 p-6 sm:p-10 my-auto">
            <button
              type="button"
              onClick={() => setOtpOpen(false)}
              className="absolute top-6 right-6 p-2 text-black hover:opacity-60 transition-opacity"
              aria-label="Close verification"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="font-serif-luxury text-2xl tracking-tight text-black font-normal mb-3">
              Verify your phone number
            </h2>
            <p className="text-sm text-[#5d5f5f] font-light mb-8 leading-relaxed">
              We sent a 6-digit OTP to {maskedPhone}
            </p>
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="flex justify-between gap-2">
                {otpDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      otpRefs.current[index] = el;
                    }}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    onPaste={handleOtpPaste}
                    inputMode="numeric"
                    autoComplete={index === 0 ? 'one-time-code' : 'off'}
                    maxLength={1}
                    className="w-10 h-12 sm:w-12 sm:h-14 border border-[#cfc4c5] bg-white text-center text-lg focus:border-black focus:outline-none"
                    aria-label={`OTP digit ${index + 1}`}
                  />
                ))}
              </div>
              {otpError && <p className="text-sm text-[#ba1a1a]">{otpError}</p>}
              <button type="submit" disabled={verifying} className={btnClass}>
                {verifying ? 'Please wait…' : 'Verify OTP'}
              </button>
            </form>
            <button
              type="button"
              disabled={resendIn > 0}
              onClick={handleResend}
              className="mt-6 text-xs uppercase tracking-[0.15em] text-[#5d5f5f] hover:text-black hover:underline cursor-pointer disabled:no-underline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resendIn > 0 ? `Resend OTP in ${resendIn}s` : 'Resend OTP'}
            </button>
          </div>
        </div>
      )}
    </main>
  );
};

export const ForgotPasswordPage: React.FC<AuthShared> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  return (
    <main className="flex-grow pt-28 md:pt-36 px-5 md:px-16 max-w-[1440px] mx-auto w-full pb-20">
      <div className="max-w-md mx-auto">
        <h1 className="font-serif-luxury text-3xl sm:text-5xl tracking-tight uppercase text-black font-normal mb-4">
          Reset Password
        </h1>
        <p className="text-sm text-[#5d5f5f] font-light mb-8 leading-relaxed">
          Password reset email is not connected. Contact concierge and we will help you recover access to your local
          profile, or create a new account on this device.
        </p>
        {!sent ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
              setSent(true);
            }}
            className="space-y-5"
          >
            <div>
              <label className={labelClass} htmlFor="fp-email">
                Email Address
              </label>
              <input
                id="fp-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                required
              />
            </div>
            <button type="submit" className={btnClass}>
              Continue
            </button>
          </form>
        ) : (
          <p className="text-sm text-[#5d5f5f] font-light mb-6">
            We cannot send reset mail from this demo. Please contact support or create a new local account.
          </p>
        )}
        <div className="mt-6 flex flex-col gap-3 text-xs uppercase tracking-[0.15em]">
          <button
            type="button"
            onClick={() => onNavigate('contact')}
            className="text-black hover:underline text-left cursor-pointer"
          >
            Contact Support
          </button>
          <button
            type="button"
            onClick={() => onNavigate('login')}
            className="text-[#5d5f5f] hover:text-black hover:underline text-left cursor-pointer"
          >
            Back to Login
          </button>
        </div>
      </div>
    </main>
  );
};
