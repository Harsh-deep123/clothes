import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './lib/stripeClient';
import App from './App.tsx';
import AdminApp from './admin/AdminApp.tsx';
import { LanguageProvider } from './i18n/LanguageContext.tsx';
import { ThemeProvider } from './theme/ThemeContext.tsx';
import './index.css';

function isAdminPath() {
  return window.location.pathname.startsWith('/admin');
}

function Root() {
  const [admin, setAdmin] = useState(isAdminPath);

  useEffect(() => {
    const sync = () => setAdmin(isAdminPath());
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);

  return (
    <ThemeProvider>
      {admin ? (
        <AdminApp />
      ) : (
        <LanguageProvider>
          <App />
        </LanguageProvider>
      )}
    </ThemeProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>
);
