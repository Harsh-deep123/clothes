/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { NavigationDrawer } from './components/NavigationDrawer';
import { ShoppingBagDrawer } from './components/ShoppingBagDrawer';
import { HomeScreen } from './components/HomeScreen';
import { NewArrivalsScreen } from './components/NewArrivalsScreen';
import { ProductDetailScreen } from './components/ProductDetailScreen';
import { Footer } from './components/Footer';
import { QuickViewModal } from './components/QuickViewModal';
import { SizeGuideModal } from './components/SizeGuideModal';
import { CheckoutModal } from './components/CheckoutModal';
import { Toast } from './components/Toast';
import { PRODUCTS, INITIAL_CART } from './data/products';
import { Product, CartItem, ViewScreen } from './types';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ViewScreen>('home');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product>(PRODUCTS[0]);
  const [cartItems, setCartItems] = useState<CartItem[]>(INITIAL_CART);
  const [wishlist, setWishlist] = useState<string[]>(['structural-oversized-tee']);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState<boolean>(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [toast, setToast] = useState<{ message: string; type: 'cart' | 'wishlist' | 'info' } | null>(null);

  // Scroll to top upon screen or product change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentScreen, selectedProduct]);

  // Toast auto-dismiss
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message: string, type: 'cart' | 'wishlist' | 'info' = 'cart') => {
    setToast({ message, type });
  };

  const handleNavigate = (screen: ViewScreen, category?: string) => {
    if (category) {
      setActiveCategory(category);
      if (screen === 'category' || category !== 'sale') {
        setCurrentScreen('new-arrivals');
      } else {
        setCurrentScreen(screen);
      }
    } else {
      setActiveCategory(null);
      setCurrentScreen(screen);
    }
    setIsDrawerOpen(false);
  };

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setCurrentScreen('product-detail');
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
      } else {
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
      }
    });

    showToast(`Added ${product.name} to Shopping Bag`, 'cart');
  };

  const handleBuyNow夹 = (product: Product, selectedColor: string, selectedSize: string) => {
    handleAddToCart(product, selectedColor, selectedSize);
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const handleUpdateQuantity = (id: string, delta: number) => {
    setCartItems((prev) =>
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
      showToast(
        isSaved ? 'Item removed from Saved' : 'Item saved to your Wishlist',
        'wishlist'
      );
      return updated;
    });
  };

  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="min-h-screen bg-[#f9f9f9] text-[#1a1c1c] flex flex-col selection:bg-black selection:text-white">
      {/* Top Header */}
      <Header
        currentScreen={currentScreen}
        activeCategory={activeCategory}
        onNavigate={handleNavigate}
        onOpenDrawer={() => setIsDrawerOpen(true)}
        onOpenCart={() => setIsCartOpen(true)}
        cartCount={totalCartCount}
      />

      {/* Navigation Drawer */}
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
      />

      {/* Shopping Bag Drawer (Slide-over) */}
      <ShoppingBagDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
        onNavigateHome={() => handleNavigate('new-arrivals')}
      />

      {/* Main View Router */}
      <div className="flex-grow flex flex-col">
        {currentScreen === 'home' && (
          <HomeScreen
            onNavigate={handleNavigate}
            onSelectProduct={handleSelectProduct}
            onQuickView={(p) => setQuickViewProduct(p)}
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
              setIsCheckoutOpen(true);
            }}
            onSelectProduct={handleSelectProduct}
            isWishlisted={wishlist.includes(selectedProduct.id)}
            onToggleWishlist={handleToggleWishlist}
            onOpenSizeGuide={() => setIsSizeGuideOpen(true)}
          />
        )}
      </div>

      {/* Shared Footer */}
      <Footer onNavigate={handleNavigate} />

      {/* Quick View Modal */}
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

      {/* Size Guide Modal */}
      <SizeGuideModal
        isOpen={isSizeGuideOpen}
        onClose={() => setIsSizeGuideOpen(false)}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={cartItems}
        onOrderSuccess={() => {
          setCartItems([]);
          showToast('Order placed successfully. Confirmation sent to email.', 'info');
        }}
      />

      {/* Toast */}
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
