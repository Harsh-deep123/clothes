import React from 'react';
import {
  X,
  Home,
  Sparkles,
  User,
  Shirt,
  Scissors,
  Layers,
  Maximize2,
  Tag,
  Heart,
  ShoppingBag
} from 'lucide-react';
import { ViewScreen } from '../types';

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentScreen: ViewScreen;
  activeCategory: string | null;
  onNavigate: (screen: ViewScreen, category?: string) => void;
  wishlistCount: number;
  cartCount: number;
  onOpenCart: () => void;
}

export const NavigationDrawer: React.FC<NavigationDrawerProps> = ({
  isOpen,
  onClose,
  currentScreen,
  activeCategory,
  onNavigate,
  wishlistCount,
  cartCount,
  onOpenCart,
}) => {
  if (!isOpen) return null;

  const links = [
    {
      label: 'Home',
      icon: Home,
      screen: 'home' as ViewScreen,
      category: undefined,
    },
    {
      label: 'New Arrivals',
      icon: Sparkles,
      screen: 'new-arrivals' as ViewScreen,
      category: undefined,
    },
    {
      label: 'Men',
      icon: User,
      screen: 'new-arrivals' as ViewScreen,
      category: 'all',
    },
    {
      label: 'T-Shirts',
      icon: Shirt,
      screen: 'category' as ViewScreen,
      category: 't-shirts',
    },
    {
      label: 'Shirts',
      icon: Scissors,
      screen: 'category' as ViewScreen,
      category: 'shirts',
    },
    {
      label: 'Jeans',
      icon: Layers,
      screen: 'category' as ViewScreen,
      category: 'jeans',
    },
    {
      label: 'Bottomwear',
      icon: Maximize2,
      screen: 'category' as ViewScreen,
      category: 'bottomwear',
    },
    {
      label: 'Sale',
      icon: Tag,
      screen: 'new-arrivals' as ViewScreen,
      category: 'sale',
      isSale: true,
    },
  ];

  return (
    <>
      {/* Drawer Overlay */}
      <div
        id="drawer-overlay"
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[55] transition-opacity duration-300 animate-fade-in"
      />

      {/* Slide-in Drawer */}
      <aside
        id="nav-drawer"
        className="fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-[#f9f9f9] border-r border-[#cfc4c5]/30 z-[60] flex flex-col py-8 px-6 overflow-y-auto shadow-2xl transition-transform duration-300 ease-in-out transform translate-x-0"
      >
        {/* Drawer Header */}
        <div className="flex justify-between items-center mb-8 pb-4 border-b border-[#cfc4c5]/20">
          <span className="font-serif-luxury text-2xl tracking-tighter text-black font-normal">
            ZAYRO
          </span>
          <button
            id="close-menu-btn"
            onClick={onClose}
            aria-label="Close menu"
            className="text-black hover:opacity-60 transition-opacity p-2 -mr-2 cursor-pointer active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-col gap-1.5">
          {links.map((link) => {
            const Icon = link.icon;
            const isSelected =
              (link.screen === 'home' && currentScreen === 'home') ||
              (link.screen === 'new-arrivals' && currentScreen === 'new-arrivals' && !activeCategory && !link.category) ||
              (activeCategory === link.category && (currentScreen === 'category' || currentScreen === 'new-arrivals'));

            return (
              <button
                key={link.label}
                id={`drawer-link-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => {
                  onNavigate(link.screen, link.category);
                  onClose();
                }}
                className={`flex items-center gap-4 px-4 py-3.5 text-xs font-semibold uppercase tracking-[0.15em] transition-colors duration-150 text-left cursor-pointer ${
                  isSelected
                    ? 'bg-[#eeeeee] text-black font-bold'
                    : link.isSale
                    ? 'text-[#ba1a1a] hover:bg-[#eeeeee]/60'
                    : 'text-[#5d5f5f] hover:bg-[#eeeeee]/60 hover:text-black'
                }`}
              >
                <Icon className="w-4 h-4 stroke-[1.8]" />
                <span>{link.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Quick Drawer Utilities */}
        <div className="mt-auto pt-8 border-t border-[#cfc4c5]/30 space-y-3">
          <button
            id="drawer-open-bag"
            onClick={() => {
              onClose();
              onOpenCart();
            }}
            className="flex items-center justify-between w-full px-4 py-3 bg-black text-white text-xs uppercase tracking-[0.15em] font-medium hover:bg-neutral-800 transition-colors"
          >
            <span className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              Shopping Bag
            </span>
            <span className="bg-white/20 text-white px-2 py-0.5 text-[11px]">
              {cartCount}
            </span>
          </button>

          <button
            id="drawer-wishlist"
            onClick={() => {
              onNavigate('new-arrivals');
              onClose();
            }}
            className="flex items-center justify-between w-full px-4 py-3 border border-black text-black text-xs uppercase tracking-[0.15em] font-medium hover:bg-[#eeeeee] transition-colors"
          >
            <span className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Saved Items
            </span>
            <span>{wishlistCount}</span>
          </button>

          <div className="pt-4 text-[11px] text-[#5d5f5f] tracking-wide">
            <p>Customer Care: Mon-Fri 9AM-6PM</p>
            <p className="mt-1 font-medium text-black">concierge@zayro.com</p>
          </div>
        </div>
      </aside>
    </>
  );
};
