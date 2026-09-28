import { AccountTab, ViewScreen } from './types';

export interface AppRoute {
  screen: ViewScreen;
  category?: string;
  productId?: string;
  query?: string;
  accountTab?: AccountTab;
}

const CONTENT_PATHS: Record<string, ViewScreen> = {
  '/contact': 'contact',
  '/shipping': 'shipping',
  '/returns': 'returns',
  '/size-guide': 'size-guide',
  '/about': 'about',
  '/story': 'story',
  '/privacy': 'privacy',
  '/faq': 'faq',
  '/terms': 'terms',
  '/wishlist': 'wishlist',
  '/login': 'login',
  '/register': 'register',
  '/forgot-password': 'forgot-password',
  '/bag': 'bag',
  '/checkout': 'checkout',
  '/confirmation': 'confirmation',
  '/search': 'search',
};

const ACCOUNT_TABS: Record<string, AccountTab> = {
  '/account': 'profile',
  '/account/profile': 'profile',
  '/account/orders': 'orders',
  '/account/wishlist': 'wishlist',
  '/account/addresses': 'addresses',
  '/account/settings': 'settings',
};

export function normalizePath(pathname: string): string {
  if (!pathname || pathname === '/') return '/';
  const trimmed = pathname.replace(/\/+$/, '');
  return trimmed || '/';
}

export function pathForRoute(route: AppRoute): string {
  switch (route.screen) {
    case 'home':
      return '/';
    case 'new-arrivals':
      if (route.category === 'sale') return '/sale';
      if (route.category === 'all') return '/men';
      if (route.category) return `/shop/${route.category}`;
      return '/new-arrivals';
    case 'category':
      if (route.category) return `/shop/${route.category}`;
      return '/new-arrivals';
    case 'product-detail':
      return route.productId ? `/product/${route.productId}` : '/new-arrivals';
    case 'search': {
      const q = route.query?.trim();
      return q ? `/search?q=${encodeURIComponent(q)}` : '/search';
    }
    case 'account': {
      const tab = route.accountTab || 'profile';
      return tab === 'profile' ? '/account' : `/account/${tab}`;
    }
    case 'contact':
    case 'shipping':
    case 'returns':
    case 'size-guide':
    case 'about':
    case 'story':
    case 'privacy':
    case 'faq':
    case 'terms':
    case 'wishlist':
    case 'login':
    case 'register':
    case 'forgot-password':
    case 'bag':
    case 'checkout':
    case 'confirmation':
      return `/${route.screen === 'forgot-password' ? 'forgot-password' : route.screen}`;
    default:
      return '/';
  }
}

export function parseLocation(pathname: string, search = ''): AppRoute {
  const path = normalizePath(pathname);
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);

  if (path === '/') return { screen: 'home' };
  if (path === '/new-arrivals') return { screen: 'new-arrivals' };
  if (path === '/sale') return { screen: 'new-arrivals', category: 'sale' };
  if (path === '/men') return { screen: 'new-arrivals', category: 'all' };

  if (path.startsWith('/shop/')) {
    const category = path.slice('/shop/'.length);
    return { screen: 'new-arrivals', category: category || undefined };
  }

  if (path.startsWith('/product/')) {
    const productId = path.slice('/product/'.length);
    return { screen: 'product-detail', productId: productId || undefined };
  }

  if (path === '/search') {
    return { screen: 'search', query: params.get('q') || '' };
  }

  const accountTab = ACCOUNT_TABS[path];
  if (accountTab) return { screen: 'account', accountTab };

  const contentScreen = CONTENT_PATHS[path];
  if (contentScreen) return { screen: contentScreen };

  return { screen: 'home' };
}

export function parsePath(pathname: string): AppRoute {
  return parseLocation(pathname, typeof window !== 'undefined' ? window.location.search : '');
}

export function pushAppUrl(route: AppRoute) {
  const next = pathForRoute(route);
  const current = `${normalizePath(window.location.pathname)}${window.location.search}`;
  if (current === next) return;
  window.history.pushState(route, '', next);
}
