import React, { useState } from 'react';
import { DEFAULT_ADMIN_EMAIL, loginAdminWithApi } from '../adminAuth';

interface AdminLoginProps {
  onSuccess: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState(DEFAULT_ADMIN_EMAIL);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Email and password are required.');
      return;
    }
    const result = await loginAdminWithApi(email, password);
    if (result) {
      setError(result);
      return;
    }
    onSuccess();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <p className="text-xs uppercase tracking-[0.28em] text-slate-400 mb-3">Zayro Store</p>
        <h1 className="text-3xl font-semibold tracking-tight mb-2">Admin Panel</h1>
        <p className="text-sm text-slate-400 mb-8">Sign in with an authorized administrator account.</p>
        <form onSubmit={submit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-200 text-sm px-3 py-2 rounded-lg">
              {error}
            </div>
          )}
          <label className="block">
            <span className="text-xs uppercase tracking-wider text-slate-400">Admin email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2.5 text-sm focus:outline-none focus:border-sky-400"
              autoComplete="username"
            />
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-wider text-slate-400">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2.5 text-sm focus:outline-none focus:border-sky-400"
              autoComplete="current-password"
            />
          </label>
          <button
            type="submit"
            className="w-full bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold py-2.5 rounded-lg text-sm transition-colors"
          >
            Sign in to Dashboard
          </button>
        </form>
      </div>
    </div>
  );
};
