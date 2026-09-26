import React, { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import { getAdminSessionEmail, isAdminLoggedIn } from '../adminAuth';
import { AdminLogin } from './AdminLogin';
import { AdminLayout, AdminNav } from './AdminLayout';
import { AdminDashboard } from './AdminDashboard';
import { AdminProducts } from './AdminProducts';
import { AdminProductForm } from './AdminProductForm';
import { AdminCategories } from './AdminCategories';
import { AdminReturns } from './AdminReturns';
import { AdminOrders } from './AdminOrders';
import { AdminReviews } from './AdminReviews';

type AdminRoute = {
  page: 'login' | 'dashboard' | 'products' | 'product-form' | 'categories' | 'returns' | 'orders' | 'reviews';
  productId?: string | null;
};

function parseAdminPath(pathname: string): AdminRoute {
  const path = pathname.replace(/\/+$/, '') || '/admin';
  if (path === '/admin/login') return { page: 'login' };
  if (path === '/admin' || path === '/admin/dashboard') return { page: 'dashboard' };
  if (path === '/admin/products') return { page: 'products' };
  if (path === '/admin/products/new') return { page: 'product-form', productId: null };
  if (path.startsWith('/admin/products/')) {
    return { page: 'product-form', productId: decodeURIComponent(path.slice('/admin/products/'.length)) };
  }
  if (path === '/admin/categories') return { page: 'categories' };
  if (path === '/admin/returns') return { page: 'returns' };
  if (path === '/admin/orders') return { page: 'orders' };
  if (path === '/admin/reviews') return { page: 'reviews' };
  return { page: 'dashboard' };
}

function pathFor(route: AdminRoute) {
  if (route.page === 'login') return '/admin/login';
  if (route.page === 'products') return '/admin/products';
  if (route.page === 'product-form') {
    return route.productId ? `/admin/products/${encodeURIComponent(route.productId)}` : '/admin/products/new';
  }
  if (route.page === 'categories') return '/admin/categories';
  if (route.page === 'returns') return '/admin/returns';
  if (route.page === 'orders') return '/admin/orders';
  if (route.page === 'reviews') return '/admin/reviews';
  return '/admin/dashboard';
}

export default function AdminApp() {
  const [authed, setAuthed] = useState(() => isAdminLoggedIn());
  const [route, setRoute] = useState<AdminRoute>(() => parseAdminPath(window.location.pathname));
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const go = (next: AdminRoute) => {
    setRoute(next);
    const url = pathFor(next);
    if (`${window.location.pathname}` !== url) {
      window.history.pushState(next, '', url);
    }
  };

  useEffect(() => {
    if (!authed) {
      go({ page: 'login' });
      return;
    }
    if (route.page === 'login') go({ page: 'dashboard' });
  }, [authed]);

  useEffect(() => {
    const onPop = () => {
      const next = parseAdminPath(window.location.pathname);
      if (!isAdminLoggedIn() && next.page !== 'login') {
        setAuthed(false);
        setRoute({ page: 'login' });
        return;
      }
      setRoute(next);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  const notify = (message: string, type: 'success' | 'error') => setToast({ message, type });

  if (!authed || route.page === 'login') {
    return (
      <AdminLogin
        onSuccess={() => {
          setAuthed(true);
          go({ page: 'dashboard' });
        }}
      />
    );
  }

  const navPage: AdminNav =
    route.page === 'categories'
      ? 'categories'
      : route.page === 'returns'
        ? 'returns'
        : route.page === 'orders'
          ? 'orders'
          : route.page === 'reviews'
            ? 'reviews'
          : route.page === 'dashboard'
            ? 'dashboard'
            : 'products';
  const title =
    route.page === 'dashboard'
      ? 'Dashboard'
      : route.page === 'categories'
        ? 'Categories'
        : route.page === 'returns'
          ? 'Returns & Replacements'
          : route.page === 'orders'
            ? 'Orders'
            : route.page === 'reviews'
              ? 'Product Reviews'
            : route.page === 'product-form'
              ? route.productId
                ? 'Edit product'
                : 'Add product'
              : 'Products';

  return (
    <>
      <AdminLayout
        page={navPage}
        title={title}
        email={getAdminSessionEmail() || ''}
        onNavigate={(page) => go({ page })}
        onLogout={() => {
          setAuthed(false);
          go({ page: 'login' });
        }}
      >
        {route.page === 'dashboard' && (
          <AdminDashboard
            onOpenProducts={() => go({ page: 'products' })}
            onOpenReturns={() => go({ page: 'returns' })}
          />
        )}
        {route.page === 'products' && (
          <AdminProducts
            onCreate={() => go({ page: 'product-form', productId: null })}
            onEdit={(id) => go({ page: 'product-form', productId: id })}
            notify={notify}
          />
        )}
        {route.page === 'product-form' && (
          <AdminProductForm
            productId={route.productId}
            onCancel={() => go({ page: 'products' })}
            onSaved={() => go({ page: 'products' })}
            notify={notify}
          />
        )}
        {route.page === 'categories' && <AdminCategories notify={notify} />}
        {route.page === 'returns' && <AdminReturns notify={notify} />}
        {route.page === 'orders' && <AdminOrders notify={notify} />}
        {route.page === 'reviews' && <AdminReviews notify={notify} />}
      </AdminLayout>

      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-[100] px-4 py-3 rounded-xl text-sm shadow-lg flex items-center gap-2 ${
            toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
          }`}
        >
          {toast.type === 'success' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
          {toast.message}
        </div>
      )}
    </>
  );
}
