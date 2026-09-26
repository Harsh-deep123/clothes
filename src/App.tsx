/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Header } from './components/Header';
import { NavigationDrawer } from './components/NavigationDrawer';
import { ShoppingBagDrawer } from './components/ShoppingBagDrawer';
import { HomeScreen } from './components/HomeScreen';
import { NewArrivalsScreen } from './components/NewArrivalsScreen';
import { ProductDetailScreen } from './components/ProductDetailScreen';
import { Footer } from './components/Footer';
import { QuickViewModal } from './components/QuickViewModal';
import { SizeGuideModal } from './components/SizeGuideModal';
import { Toast } from './components/Toast';
import { SearchOverlay, searchProducts } from './components/SearchOverlay';
import { LoginModal } from './components/LoginModal';
import { LocationWelcomeModal, DELIVERY_LOCATION_KEY, deliveryCityLabel, readSavedDeliveryLocation, SavedDeliveryLocation } from './components/LocationWelcomeModal';
import { deliveryLocationFromIpinfo, fetchIpinfoLite, mergeLocationWithIpinfo, type IpinfoLite } from './lib/ipinfo';
import { getDeliveryQuote } from './lib/delivery';
import { loadReviewSummaries } from './lib/reviewsApi';
import { useScrollReveal } from './hooks/useScrollReveal';
import {
  apiCreateOrder,
  apiLogin,
  apiMe,
  apiMyOrders,
  apiUpdateProfile,
  fallbackOrderId,
  getAuthToken,
  setAuthToken,
  toLocalAccount,
} from './lib/shopApi';
import { getStorefrontProduct, getStorefrontProducts } from './catalog';
import { useCatalogTick } from './hooks/useCatalog';
import {
  AccountTab,
  CartItem,
  LocalAccount,
  PlacedOrder,
  Product,
  SavedAddress,
  ViewScreen,
} from './types';
import { parseLocation, pushAppUrl } from './routing';
import {
  loadAccount,
  loadAddresses,
  loadCart,
  loadOrders,
  loadSessionEmail,
  loadWishlist,
  saveAccount,
  saveAddresses,
  saveCart,
  saveOrders,
  saveSessionEmail,
  saveWishlist,
} from './storage';
import { ContactPage } from './components/pages/ContactPage';
import { ShippingPage } from './components/pages/ShippingPage';
import { ReturnsPage } from './components/pages/ReturnsPage';
import { SizeGuidePage } from './components/pages/SizeGuidePage';
import { AboutPage } from './components/pages/AboutPage';
import { StoryPage } from './components/pages/StoryPage';
import { PrivacyPage } from './components/pages/PrivacyPage';
import { FaqPage } from './components/pages/FaqPage';
import { TermsPage } from './components/pages/TermsPage';
import { WishlistPage } from './components/pages/WishlistPage';
import { ForgotPasswordPage, LoginPage, RegisterPage } from './components/pages/AuthPages';
import { BagPage } from './components/pages/BagPage';
import { CheckoutPage } from './components/pages/CheckoutPage';
import { ConfirmationPage } from './components/pages/ConfirmationPage';
import { AccountPage } from './components/pages/AccountPage';
import { SearchPage } from './components/pages/SearchPage';
import { SupportChatWidget } from './components/SupportChatWidget';

const AFTER_LOGIN_KEY = 'zayro_after_login';
const initialRoute = parseLocation(
  typeof window !== 'undefined' ? window.location.pathname : '/',
  typeof window !== 'undefined' ? window.location.search : ''
);
const initialProduct =
  getStorefrontProduct(initialRoute.productId || '') || getStorefrontProducts()[0];

function loadLastOrder(): PlacedOrder | null {
  try {
    const raw = sessionStorage.getItem('zayro_last_order');
    return raw ? (JSON.parse(raw) as PlacedOrder) : null;
  } catch {
    return null;
  }
}

export default function App() {
  const catalogTick = useCatalogTick();
  useScrollReveal();
  const [currentScreen, setCurrentScreen] = useState<ViewScreen>(initialRoute.screen);
  const [activeCategory, setActiveCategory] = useState<string | null>(
    initialRoute.category || null
  );
  const [searchQuery, setSearchQuery] = useState(initialRoute.query || '');
  const [accountTab, setAccountTab] = useState<AccountTab>(initialRoute.accountTab || 'profile');
  const [selectedProduct, setSelectedProduct] = useState<Product>(initialProduct);
  const [cartItems, setCartItems] = useState<CartItem[]>(() => loadCart());
  const [wishlist, setWishlist] = useState<string[]>(() => loadWishlist());
  const [account, setAccount] = useState<LocalAccount | null>(() => loadAccount());
  const [sessionEmail, setSessionEmail] = useState<string | null>(() => loadSessionEmail());
  const [orders, setOrders] = useState<PlacedOrder[]>(() => loadOrders());
  const [addresses, setAddresses] = useState<SavedAddress[]>(() =>
    loadAddresses(loadSessionEmail())
  );
  const [lastOrder, setLastOrder] = useState<PlacedOrder | null>(() => loadLastOrder());
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showLocationWelcome, setShowLocationWelcome] = useState(true);
  const [deliveryLocation, setDeliveryLocation] = useState<SavedDeliveryLocation | null>(() =>
    readSavedDeliveryLocation()
  );
  const [ipinfo, setIpinfo] = useState<IpinfoLite | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'cart' | 'wishlist' | 'info' } | null>(
    null
  );

  const signedIn = Boolean(sessionEmail && account && account.email === sessionEmail);
  const deliveryQuote = useMemo(
    () => getDeliveryQuote(deliveryLocation, ipinfo),
    [deliveryLocation, ipinfo]
  );

  useEffect(() => {
    void loadReviewSummaries();
  }, []);

  useEffect(() => {
    setSelectedProduct((prev) => getStorefrontProduct(prev.id) || prev);
  }, [catalogTick]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentScreen, selectedProduct, searchQuery, accountTab]);

  useEffect(() => {
    let cancelled = false;
    fetchIpinfoLite().then((data) => {
      if (!cancelled) setIpinfo(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ipinfo?.country_code && !ipinfo?.country) return;
    setDeliveryLocation((prev) => {
      const next = prev
        ? mergeLocationWithIpinfo(prev, ipinfo)
        : deliveryLocationFromIpinfo(ipinfo);
      if (
        prev &&
        next.ip === prev.ip &&
        next.countryCode === prev.countryCode &&
        next.country === prev.country
      ) {
        return prev;
      }
      try {
        localStorage.setItem(DELIVERY_LOCATION_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, [ipinfo]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    saveWishlist(wishlist);
  }, [wishlist]);

  useEffect(() => {
    saveCart(cartItems);
  }, [cartItems]);

  useEffect(() => {
    saveOrders(orders);
  }, [orders]);

  useEffect(() => {
    setAddresses(sessionEmail ? loadAddresses(sessionEmail) : []);
  }, [sessionEmail]);

  const showToast = (message: string, type: 'cart' | 'wishlist' | 'info' = 'cart') => {
    setToast({ message, type });
  };

  const applyRoute = (route: ReturnType<typeof parseLocation>) => {
    setCurrentScreen(route.screen);
    setActiveCategory(route.category || null);
    if (route.query !== undefined) setSearchQuery(route.query);
    if (route.accountTab) setAccountTab(route.accountTab);
    if (route.productId) {
      const product = getStorefrontProduct(route.productId);
      if (product) setSelectedProduct(product);
    }
  };

  useEffect(() => {
    const onPopState = () => {
      applyRoute(parseLocation(window.location.pathname, window.location.search));
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    if (!getAuthToken()) return;
    let cancelled = false;
    void apiMe()
      .then(async (user) => {
        if (cancelled) return;
        const local = toLocalAccount(user);
        setAccount(local);
        setSessionEmail(user.email);
        saveAccount(local);
        saveSessionEmail(user.email);
        try {
          const remote = await apiMyOrders();
          if (!cancelled && remote.length) {
            setOrders((prev) => {
              const numbers = new Set(remote.map((item) => item.number));
              return [...remote, ...prev.filter((item) => !numbers.has(item.number))];
            });
          }
        } catch {
          /* keep local orders */
        }
      })
      .catch(() => {
        if (!cancelled) setAuthToken(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleNavigate = (screen: ViewScreen, category?: string) => {
    let nextScreen = screen;
    let nextCategory: string | null = null;
    let nextQuery = searchQuery;
    let nextTab = accountTab;

    if (screen === 'search') {
      nextQuery = category ?? searchQuery;
      nextCategory = null;
    } else if (screen === 'account') {
      nextTab = (category as AccountTab) || 'profile';
      nextCategory = null;
    } else if (category && (screen === 'category' || screen === 'new-arrivals')) {
      nextCategory = category;
      nextScreen = 'new-arrivals';
    } else if (category && screen === 'category') {
      nextCategory = category;
      nextScreen = 'new-arrivals';
    } else {
      nextCategory = null;
    }

    setActiveCategory(nextCategory);
    setCurrentScreen(nextScreen);
    setSearchQuery(nextQuery);
    setAccountTab(nextTab);
    setIsDrawerOpen(false);
    setIsSearchOpen(false);
    pushAppUrl({
      screen: nextScreen,
      category: nextCategory || undefined,
      query: nextQuery,
      accountTab: nextTab,
      productId: nextScreen === 'product-detail' ? selectedProduct.id : undefined,
    });
  };

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setCurrentScreen('product-detail');
    setIsSearchOpen(false);
    pushAppUrl({ screen: 'product-detail', productId: product.id });
  };

  const handleAddToCart = (product: Product, selectedColor: string, selectedSize: string) => {
    setCartItems((prev) => {
      const existing = prev.find(
        (item) =>
          item.productId === product.id &&
          item.selectedColor === selectedColor &&
          item.selectedSize === selectedSize
      );
      if (existing) {
        return prev.map((item) =>
          item === existing ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
        const newItem: CartItem = {
          id: `cart-${Date.now()}`,
          productId: product.id,
          product,
          selectedColor,
          selectedSize,
          quantity: 1,
          price: product.price,
        };
        return [...prev, newItem];
    });
    showToast(`Added ${product.name} to Shopping Bag`, 'cart');
  };

  const handleUpdateQuantity = (id: string, delta: number) => {
    setCartItems(
      (prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveItem = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
    showToast('Item removed from Shopping Bag', 'info');
  };

  const handleToggleWishlist = (productId: string) => {
    setWishlist((prev) => {
      const isSaved = prev.includes(productId);
      const updated = isSaved ? prev.filter((id) => id !== productId) : [...prev, productId];
      showToast(isSaved ? 'Item removed from Saved' : 'Item saved to your Wishlist', 'wishlist');
      return updated;
    });
  };

  const openLoginModal = (destination: ViewScreen) => {
    sessionStorage.setItem(AFTER_LOGIN_KEY, destination === 'checkout' ? '/checkout' : '/account');
    setIsLoginModalOpen(true);
  };

  const closeLoginModal = () => {
    setIsLoginModalOpen(false);
    sessionStorage.removeItem(AFTER_LOGIN_KEY);
  };

  const goAfterLogin = () => {
    const dest = sessionStorage.getItem(AFTER_LOGIN_KEY);
    sessionStorage.removeItem(AFTER_LOGIN_KEY);
    if (dest === '/checkout') handleNavigate('checkout');
    else if (dest === '/account/orders') handleNavigate('account', 'orders');
    else if (accountTab === 'orders') handleNavigate('account', 'orders');
    else handleNavigate('account');
  };

  const requestCheckout = () => {
    if (!deliveryQuote.available) {
      showToast(deliveryQuote.message || 'Delivery not available', 'info');
      return;
    }
    setIsCartOpen(false);
    if (signedIn) {
      handleNavigate('checkout');
      return;
    }
    openLoginModal('checkout');
  };

  const handleAccountClick = () => {
    if (signedIn) {
      handleNavigate('account');
      return;
    }
    openLoginModal('account');
  };

  const handleTrackOrder = () => {
    if (signedIn) {
      handleNavigate('account', 'orders');
      return;
    }
    sessionStorage.setItem(AFTER_LOGIN_KEY, '/account/orders');
    setIsLoginModalOpen(true);
  };

  const handleLogin = async (email: string, password: string): Promise<string | null> => {
    try {
      const user = await apiLogin(email, password);
      const local = toLocalAccount(user);
      setAccount(local);
      setSessionEmail(user.email);
      saveAccount(local);
      saveSessionEmail(user.email);
      setAddresses(loadAddresses(user.email));
      try {
        const remote = await apiMyOrders();
        if (remote.length) {
          setOrders((prev) => {
            const numbers = new Set(remote.map((item) => item.number));
            return [...remote, ...prev.filter((item) => !numbers.has(item.number))];
          });
        }
      } catch {
        /* keep local orders */
      }
      showToast('Signed in.', 'info');
      setIsLoginModalOpen(false);
      goAfterLogin();
      return null;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not sign in.';
      const stored = loadAccount();
      const allowLocal =
        /unavailable|no account found/i.test(message) &&
        stored &&
        stored.email.toLowerCase() === email.toLowerCase() &&
        Boolean(stored.password) &&
        stored.password === password;
      if (!allowLocal || !stored) return message;
      setAccount(stored);
      setSessionEmail(stored.email);
      saveSessionEmail(stored.email);
      setAddresses(loadAddresses(stored.email));
      showToast('Signed in on this device.', 'info');
      setIsLoginModalOpen(false);
      goAfterLogin();
      return null;
    }
  };

  const handleRegister = async (next: LocalAccount): Promise<string | null> => {
    if (!next.id) return 'Phone verification is required before creating an account.';
    const local = { ...next, password: '' };
    setAccount(local);
    setSessionEmail(next.email);
    saveAccount(local);
    saveSessionEmail(next.email);
    setAddresses(loadAddresses(next.email));
    showToast('Account created.', 'info');
    setIsLoginModalOpen(false);
    goAfterLogin();
    return null;
  };

  const handlePlaceOrder = async (
    details: Omit<PlacedOrder, 'id' | 'number' | 'createdAt' | 'items' | 'subtotal' | 'total'>
  ) => {
    const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const deliveryCharge = details.deliveryCharge ?? 0;
    const handlingCharge = details.handlingCharge ?? 0;
    const total = subtotal - details.discount + deliveryCharge + handlingCharge;
    let orderId = fallbackOrderId();
    let createdAt = new Date().toISOString();
    try {
      const saved = await apiCreateOrder({
        customerName: details.customer.fullName,
        customerEmail: details.customer.email,
        customerPhone: details.customer.phone,
        shippingAddress: details.shippingAddress,
        items: cartItems.map((item) => ({
          productId: item.productId,
          name: item.product.name,
          image: item.product.images[0],
          selectedSize: item.selectedSize,
          selectedColor: item.selectedColor,
          quantity: item.quantity,
          price: item.price,
        })),
        subtotal,
        deliveryCharge,
        handlingCharge,
        discount: details.discount,
        total,
        paymentMethod: details.paymentMethod || 'cod',
        paymentStatus: details.paymentStatus || (details.paymentMethod === 'stripe' ? 'paid' : 'unpaid'),
        stripePaymentIntentId: details.stripePaymentIntentId,
        deliveryLocation: details.deliveryLocation,
      });
      orderId = saved.orderId || saved.number || saved.id;
      createdAt = saved.createdAt || createdAt;
      if (account?.id) {
        void apiUpdateProfile({
          fullName: details.customer.fullName,
          phone: details.customer.phone,
          shippingAddress: details.shippingAddress.address,
          city: details.shippingAddress.city,
          state: details.shippingAddress.state,
          country: details.shippingAddress.country,
          postalCode: details.shippingAddress.postalCode,
        });
      }
    } catch {
      /* order still completes locally so checkout is not blocked */
    }
    const order: PlacedOrder = {
      ...details,
      id: orderId,
      number: orderId,
      createdAt,
      items: cartItems,
      subtotal,
      deliveryCharge,
      handlingCharge,
      total,
      confirmationCallSent: false,
      confirmationCallStatus: 'pending',
      whatsappMessageSent: false,
      whatsappMessageStatus: 'pending',
      emailSent: false,
      emailStatus: 'pending',
    };
    setOrders((prev) => [order, ...prev]);
    setLastOrder(order);
    sessionStorage.setItem('zayro_last_order', JSON.stringify(order));
    if (signedIn && account?.email) {
      const email = account.email;
      setAddresses((prev) => {
        const shipping: SavedAddress = {
          id: prev[0]?.id || `addr-${Date.now()}`,
          label: prev[0]?.label || 'Shipping',
          fullName: details.customer.fullName,
          address: details.shippingAddress.address,
          city: details.shippingAddress.city,
          state: details.shippingAddress.state,
          postalCode: details.shippingAddress.postalCode,
          country: details.shippingAddress.country,
          userEmail: email,
        };
        const next = [shipping, ...prev.filter((a) => a.id !== shipping.id)];
        saveAddresses(email, next);
        return next;
      });
    }
    setCartItems([]);
    showToast('Order placed.', 'info');
    setCurrentScreen('confirmation');
    pushAppUrl({ screen: 'confirmation' });
  };

  const applyConfirmationCallUpdate = (orderId: string, patch: Partial<PlacedOrder>) => {
    const merge = (order: PlacedOrder) => (order.id === orderId ? { ...order, ...patch } : order);
    setLastOrder((prev) => {
      if (!prev || prev.id !== orderId) return prev;
      const next = { ...prev, ...patch };
      try {
        sessionStorage.setItem('zayro_last_order', JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
    setOrders((prev) => prev.map(merge));
  };

  const searchResults = useMemo(() => searchProducts(searchQuery), [searchQuery, catalogTick]);
  const storefrontProducts = useMemo(() => getStorefrontProducts(), [catalogTick]);
  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="min-h-screen bg-[#f9f9f9] text-[#1a1c1c] flex flex-col selection:bg-black selection:text-white">
      <LocationWelcomeModal
        isOpen={showLocationWelcome}
        onComplete={(location) => {
          setDeliveryLocation(location);
          setShowLocationWelcome(false);
          handleNavigate('home');
        }}
      />

      <Header
        currentScreen={currentScreen}
        activeCategory={activeCategory}
        onNavigate={handleNavigate}
        onOpenDrawer={() => setIsDrawerOpen(true)}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onAccountClick={handleAccountClick}
        cartCount={totalCartCount}
        deliveryCity={deliveryCityLabel(deliveryLocation)}
      />

      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        currentScreen={currentScreen}
        activeCategory={activeCategory}
        onNavigate={handleNavigate}
        wishlistCount={wishlist.length}
        cartCount={totalCartCount}
        onOpenCart={() => {
          setIsDrawerOpen(false);
          setIsCartOpen(true);
        }}
        onAccountClick={handleAccountClick}
        onTrackOrder={handleTrackOrder}
      />

      <ShoppingBagDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onCheckout={requestCheckout}
        onNavigateHome={() => handleNavigate('new-arrivals')}
        onViewBag={() => handleNavigate('bag')}
        quote={deliveryQuote}
      />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={closeLoginModal}
        onLogin={handleLogin}
        onNavigate={(screen, category) => {
          setIsLoginModalOpen(false);
          handleNavigate(screen, category);
        }}
      />

      <SearchOverlay
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSearch={(q) => handleNavigate('search', q)}
        onSelectProduct={handleSelectProduct}
      />

      <div key={currentScreen} className="zayro-page flex-grow flex flex-col">
        {currentScreen === 'home' && (
          <HomeScreen
            onNavigate={handleNavigate}
            onSelectProduct={handleSelectProduct}
            onQuickView={(p) => setQuickViewProduct(p)}
            wishlist={wishlist}
            onToggleWishlist={handleToggleWishlist}
          />
        )}

        {(currentScreen === 'new-arrivals' || currentScreen === 'category') && (
          <NewArrivalsScreen
            onSelectProduct={handleSelectProduct}
            onQuickView={(p) => setQuickViewProduct(p)}
            wishlist={wishlist}
            onToggleWishlist={handleToggleWishlist}
            categoryFilter={activeCategory}
          />
        )}

        {currentScreen === 'product-detail' && (
          <ProductDetailScreen
            product={selectedProduct}
            onAddToCart={handleAddToCart}
            onBuyNow={(p, c, s) => {
              handleAddToCart(p, c, s);
              requestCheckout();
            }}
            onSelectProduct={handleSelectProduct}
            isWishlisted={wishlist.includes(selectedProduct.id)}
            onToggleWishlist={handleToggleWishlist}
            onOpenSizeGuide={() => setIsSizeGuideOpen(true)}
          />
        )}

        {currentScreen === 'contact' && (
          <ContactPage
            onNavigate={handleNavigate}
            account={signedIn ? account : null}
            orders={orders}
            onMessageSent={(name) =>
              showToast(
                name ? `Thank you, ${name}. Your message has been sent.` : 'Your message has been sent.',
                'info'
              )
            }
          />
        )}
        {currentScreen === 'shipping' && <ShippingPage onNavigate={handleNavigate} />}
        {currentScreen === 'returns' && <ReturnsPage onNavigate={handleNavigate} />}
        {currentScreen === 'size-guide' && <SizeGuidePage onNavigate={handleNavigate} />}
        {currentScreen === 'about' && <AboutPage onNavigate={handleNavigate} />}
        {currentScreen === 'story' && <StoryPage onNavigate={handleNavigate} />}
        {currentScreen === 'privacy' && <PrivacyPage onNavigate={handleNavigate} />}
        {currentScreen === 'faq' && <FaqPage onNavigate={handleNavigate} />}
        {currentScreen === 'terms' && <TermsPage onNavigate={handleNavigate} />}
        {currentScreen === 'wishlist' && (
          <WishlistPage
            wishlistIds={wishlist}
            products={storefrontProducts}
            onToggleWishlist={handleToggleWishlist}
            onAddToBag={(product) => {
              const size = product.sizes.find((s) => s.available)?.size || product.sizes[0]?.size || 'M';
              handleAddToCart(product, product.colors[0]?.name || 'Standard', size);
            }}
            onSelectProduct={handleSelectProduct}
            onNavigate={handleNavigate}
          />
        )}
        {currentScreen === 'login' && (
          <LoginPage onNavigate={handleNavigate} onLogin={handleLogin} />
        )}
        {currentScreen === 'register' && (
          <RegisterPage onNavigate={handleNavigate} onRegister={handleRegister} />
        )}
        {currentScreen === 'forgot-password' && <ForgotPasswordPage onNavigate={handleNavigate} />}
        {currentScreen === 'bag' && (
          <BagPage
            items={cartItems}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onCheckout={requestCheckout}
            onNavigate={handleNavigate}
            quote={deliveryQuote}
          />
        )}
        {currentScreen === 'checkout' && (
          <CheckoutPage
            key={signedIn && account ? account.email.toLowerCase() : 'guest'}
            items={cartItems}
            account={signedIn ? account : null}
            savedAddresses={signedIn ? addresses : []}
            onPlaceOrder={handlePlaceOrder}
            onNavigate={handleNavigate}
            deliveryLocation={deliveryLocation}
            ipinfo={ipinfo}
          />
        )}
        {currentScreen === 'confirmation' && (
          <ConfirmationPage
            order={lastOrder}
            onConfirmationCallUpdate={applyConfirmationCallUpdate}
            onNavigate={(screen) => {
              if (screen === 'account') handleNavigate('account', 'orders');
              else handleNavigate(screen);
            }}
          />
        )}
        {currentScreen === 'account' && signedIn && account && (
          <AccountPage
            account={account}
            orders={orders}
            addresses={addresses}
            wishlistCount={wishlist.length}
            tab={accountTab}
            onTabChange={(tab) => handleNavigate('account', tab)}
            onNavigate={handleNavigate}
            onSaveProfile={(next) => {
              const local = { ...next, password: '' };
              setAccount(local);
              saveAccount(local);
              void apiUpdateProfile({ fullName: next.fullName, phone: next.phone })
                .then(() => showToast('Profile saved.', 'info'))
                .catch(() => showToast('Profile saved on this device.', 'info'));
            }}
            onSaveAddress={(addr) => {
              setAddresses((prev) => {
                const next = [...prev, { ...addr, userEmail: sessionEmail || undefined }];
                saveAddresses(sessionEmail, next);
                return next;
              });
            }}
            onRemoveAddress={(id) => {
              setAddresses((prev) => {
                const next = prev.filter((a) => a.id !== id);
                saveAddresses(sessionEmail, next);
                return next;
              });
            }}
            onLogout={() => {
              setAuthToken(null);
              setAddresses([]);
              setSessionEmail(null);
              saveSessionEmail(null);
              handleNavigate('home');
              showToast('Signed out.', 'info');
            }}
          />
        )}
        {currentScreen === 'account' && !signedIn && (
          <LoginPage onNavigate={handleNavigate} onLogin={handleLogin} />
        )}
        {currentScreen === 'search' && (
          <SearchPage
            query={searchQuery}
            results={searchResults}
            wishlist={wishlist}
            onQueryChange={(q) => {
              setSearchQuery(q);
              pushAppUrl({ screen: 'search', query: q });
            }}
            onSelectProduct={handleSelectProduct}
            onToggleWishlist={handleToggleWishlist}
            onNavigate={handleNavigate}
          />
        )}
      </div>

      <Footer onNavigate={handleNavigate} />

      <QuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onAddToCart={handleAddToCart}
        onViewFullDetails={(p) => {
          setQuickViewProduct(null);
          handleSelectProduct(p);
        }}
        isWishlisted={quickViewProduct ? wishlist.includes(quickViewProduct.id) : false}
        onToggleWishlist={handleToggleWishlist}
      />

      <SizeGuideModal isOpen={isSizeGuideOpen} onClose={() => setIsSizeGuideOpen(false)} />

      <SupportChatWidget
        onTrackOrder={handleTrackOrder}
        onOpenCart={() => setIsCartOpen(true)}
        onNavigateContact={() => handleNavigate('contact')}
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
          onOpenCart={() => {
            setToast(null);
            setIsCartOpen(true);
          }}
        />
      )}
    </div>
  );
}
