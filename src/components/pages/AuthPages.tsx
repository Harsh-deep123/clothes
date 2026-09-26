import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { LocalAccount, ViewScreen } from '../../types';
import { isValidIndianMobile } from '../../lib/indianPhone';
import { apiRegister, toLocalAccount } from '../../lib/shopApi';

const inputClass =
  'w-full border border-[#cfc4c5] bg-white px-4 py-3 text-sm focus:border-black focus:outline-none';
const labelClass = 'text-xs uppercase tracking-[0.15em] font-semibold text-black mb-2 block';
const btnClass =
  'w-full bg-black text-white text-xs font-semibold uppercase py-4 tracking-[0.2em] hover:bg-neutral-800 transition-colors cursor-pointer active:scale-[0.99]';

function asErrorText(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

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
    setError(null);
    try {
      const result = await onLogin(email.trim(), password);
      setError(typeof result === 'string' ? result : null);
    } catch (loginError) {
      setError(asErrorText(loginError instanceof Error ? loginError.message : null, 'Could not sign in.'));
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
          Sign in with your ZAYRO account. Your profile is stored securely in our database.
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
      const user = await apiRegister({
        fullName: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        password: form.password,
      });
      const result = await onRegister(toLocalAccount(user));
      setError(typeof result === 'string' ? result : null);
    } catch (registerError) {
      setError(
        asErrorText(registerError instanceof Error ? registerError.message : null, 'Could not create account.')
      );
    } finally {
      setSubmitting(false);
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
          Create your ZAYRO account. It is saved in our secure database so you can sign in on any device.
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
          Password reset email is not connected yet. Contact support and we will help you recover access, or create a
          new account.
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
            We cannot send reset mail from this site yet. Please contact support or create a new account.
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
