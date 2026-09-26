import React, { useState } from 'react';
import { ClipboardList, LayoutDashboard, Package, Tags, LogOut, ExternalLink, Menu, X, Undo2, Star } from 'lucide-react';
import { logoutAdmin } from '../adminAuth';

export type AdminNav = 'dashboard' | 'products' | 'categories' | 'returns' | 'orders' | 'reviews';

interface AdminLayoutProps {
  page: AdminNav;
  title: string;
  email: string;
  onNavigate: (page: AdminNav) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

const NAV = [
  { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
  { id: 'products' as const, label: 'Products', icon: Package },
  { id: 'categories' as const, label: 'Categories', icon: Tags },
  { id: 'returns' as const, label: 'Returns', icon: Undo2 },
  { id: 'orders' as const, label: 'Orders', icon: ClipboardList },
  { id: 'reviews' as const, label: 'Product Reviews', icon: Star },
];

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  page,
  title,
  email,
  onNavigate,
  onLogout,
  children,
}) => {
  const [open, setOpen] = useState(false);

  const logout = () => {
    logoutAdmin();
    onLogout();
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex">
      {open && (
        <button
          type="button"
          className="fixed inset-0 bg-slate-950/40 z-30 lg:hidden"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
        />
      )}
      <aside
        className={`fixed lg:static z-40 inset-y-0 left-0 w-64 bg-slate-950 text-slate-100 flex flex-col transform transition-transform ${
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="px-5 py-6 border-b border-slate-800">
          <p className="text-[10px] uppercase tracking-[0.28em] text-slate-400">Zayro</p>
          <h1 className="text-lg font-semibold mt-1">Admin Panel</h1>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = page === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onNavigate(item.id);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${
                  active ? 'bg-sky-500 text-slate-950 font-semibold' : 'hover:bg-slate-800 text-slate-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="p-3 border-t border-slate-800 space-y-1">
          <a
            href="/"
            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-white"
          >
            <ExternalLink className="w-4 h-4" />
            View storefront
          </a>
          <button
            type="button"
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-white"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="bg-white border-b border-slate-200 px-4 md:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="lg:hidden p-2 rounded-lg border border-slate-200"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
            >
              {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
            <h2 className="text-lg md:text-xl font-semibold">{title}</h2>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wider text-slate-400">Signed in</p>
            <p className="text-sm font-medium truncate max-w-[200px]">{email}</p>
          </div>
        </header>
        <main className="p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
};
