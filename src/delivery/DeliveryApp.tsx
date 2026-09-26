import React, { useEffect, useState } from 'react';
import { DeliveryLogin } from './DeliveryLogin';
import { DeliveryDashboard } from './DeliveryDashboard';
import { isDeliveryLoggedIn } from './deliveryAuth';
import { isAdminLoggedIn } from '../adminAuth';

function parseDeliveryPath(pathname: string) {
  const path = pathname.replace(/\/+$/, '') || '/delivery/login';
  if (path === '/delivery' || path === '/delivery/login') return 'login' as const;
  return 'dashboard' as const;
}

export default function DeliveryApp() {
  const [authed, setAuthed] = useState(() => isDeliveryLoggedIn());
  const [page, setPage] = useState(() => parseDeliveryPath(window.location.pathname));

  const go = (next: 'login' | 'dashboard') => {
    setPage(next);
    const url = next === 'login' ? '/delivery/login' : '/delivery/dashboard';
    if (window.location.pathname !== url) window.history.pushState({ page: next }, '', url);
  };

  useEffect(() => {
    if (isAdminLoggedIn() && !isDeliveryLoggedIn()) {
      window.location.replace('/admin/dashboard');
    }
  }, []);

  useEffect(() => {
    if (!authed) go('login');
    else if (page === 'login') go('dashboard');
  }, [authed]);

  useEffect(() => {
    const onPop = () => {
      const next = parseDeliveryPath(window.location.pathname);
      if (!isDeliveryLoggedIn() && next !== 'login') {
        setAuthed(false);
        setPage('login');
        return;
      }
      setPage(next);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  if (!authed || page === 'login') {
    return (
      <DeliveryLogin
        onSuccess={() => {
          setAuthed(true);
          go('dashboard');
        }}
      />
    );
  }

  return (
    <DeliveryDashboard
      onLogout={() => {
        setAuthed(false);
        go('login');
      }}
    />
  );
}
