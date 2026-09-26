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
  ShoppingBag,
  Truck
} from 'lucide-react';
import { ViewScreen } from '../types';
import { useI18n } from '../i18n/LanguageContext';
import { MessageKey } from '../i18n/languages';
import { LanguageSelector } from './LanguageSelector';
import { ThemeToggle } from './ThemeToggle';

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentScreen: ViewScreen;
  activeCategory: string | null;
  onNavigate: (screen: ViewScreen, category?: string) => void;
  wishlistCount: number;
  cartCount: number;
  onOpenCart: () => void;
  onAccountClick: () => void;
  onTrackOrder: () => void;
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
  onAccountClick,
  onTrackOrder,
}) => {
  const { t } = useI18n();
  if (!isOpen) return null;

  const links = [
    {
      key: 'nav.home' as MessageKey,
      id: 'home',
      icon: Home,
      screen: 'home' as ViewScreen,
      category: undefined,
    },
    {
      key: 'nav.newArrivals' as MessageKey,
      id: 'new-arrivals',
      icon: Sparkles,
      screen: 'new-arrivals' as ViewScreen,
      category: undefined,
    },
    {
      key: 'nav.men' as MessageKey,
      id: 'men',
      icon: User,
      screen: 'new-arrivals' as ViewScreen,
      category: 'all',
    },
    {
      key: 'nav.tshirts' as MessageKey,
      id: 't-shirts',
      icon: Shirt,
      screen: 'category' as ViewScreen,
      category: 't-shirts',
    },
    {
      key: 'nav.shirts' as MessageKey,
      id: 'shirts',
      icon: Scissors,
      screen: 'category' as ViewScreen,
      category: 'shirts',
    },
    {
      key: 'nav.jeans' as MessageKey,
      id: 'jeans',
      icon: Layers,
      screen: 'category' as ViewScreen,
      category: 'jeans',
    },
    {
      key: 'nav.bottomwear' as MessageKey,
      id: 'bottomwear',
      icon: Maximize2,
      screen: 'category' as ViewScreen,
      category: 'bottomwear',
    },
    {
      key: 'nav.sale' as MessageKey,
      id: 'sale',
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
            aria-label={t('drawer.close')}
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
                key={link.id}
                id={`drawer-link-${link.id}`}
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
                <span>{t(link.key)}</span>
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
              {t('drawer.bag')}
            </span>
            <span className="bg-white/20 text-white px-2 py-0.5 text-[11px]">
              {cartCount}
            </span>
          </button>

          <button
            id="drawer-wishlist"
            onClick={() => {
              onNavigate('wishlist');
              onClose();
            }}
            className="flex items-center justify-between w-full px-4 py-3 border border-black text-black text-xs uppercase tracking-[0.15em] font-medium hover:bg-[#eeeeee] transition-colors"
          >
            <span className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              {t('drawer.saved')}
            </span>
            <span>{wishlistCount}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onTrackOrder();
              onClose();
            }}
            className="flex items-center w-full px-4 py-3 border border-[#cfc4c5] text-black text-xs uppercase tracking-[0.15em] font-medium hover:bg-[#eeeeee] transition-colors"
          >
            <span className="flex items-center gap-2">
              <Truck className="w-4 h-4" />
              {t('drawer.trackOrder')}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              onAccountClick();
              onClose();
            }}
            className="flex items-center w-full px-4 py-3 border border-[#cfc4c5] text-black text-xs uppercase tracking-[0.15em] font-medium hover:bg-[#eeeeee] transition-colors"
          >
            <span className="flex items-center gap-2">
              <User className="w-4 h-4" />
              {t('drawer.account')}
            </span>
          </button>

          <div className="px-2 py-2 border border-[#cfc4c5]/40 bg-white flex items-center justify-between gap-2">
            <LanguageSelector />
            <ThemeToggle />
          </div>

          <div className="pt-4 text-[11px] text-[#5d5f5f] tracking-wide">
            <p>{t('drawer.care')}</p>
            <p className="mt-1 font-medium text-black">concierge@zayro.com</p>
          </div>
        </div>
      </aside>
    </>
  );
};
