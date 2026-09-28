import React, { useEffect, useRef, useState } from 'react';
import { Menu, Search, ShoppingBag, User, MapPin, ChevronDown } from 'lucide-react';
import { ViewScreen } from '../types';
import { WOMEN_SUBCATEGORIES, isWomenCategory } from '../data/products';
import { LanguageSelector } from './LanguageSelector';
import { ThemeToggle } from './ThemeToggle';
import { useI18n } from '../i18n/LanguageContext';
import { MessageKey } from '../i18n/languages';

interface HeaderProps {
  currentScreen: ViewScreen;
  activeCategory: string | null;
  onNavigate: (screen: ViewScreen, category?: string) => void;
  onOpenDrawer: () => void;
  onOpenCart: () => void;
  onOpenSearch: () => void;
  onAccountClick: () => void;
  cartCount: number;
  deliveryCity?: string | null;
}

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  activeCategory,
  onNavigate,
  onOpenDrawer,
  onOpenCart,
  onOpenSearch,
  onAccountClick,
  cartCount,
  deliveryCity,
}) => {
  const { t } = useI18n();
  const [scrolled, setScrolled] = useState(false);
  const [womenMenuOpen, setWomenMenuOpen] = useState(false);
  const womenMenuRef = useRef<HTMLDivElement>(null);
  const navItems = [
    { key: 'nav.home' as MessageKey, id: 'home', screen: 'home' as ViewScreen, category: undefined },
    { key: 'nav.newArrivals' as MessageKey, id: 'new-arrivals', screen: 'new-arrivals' as ViewScreen, category: undefined },
    { key: 'nav.men' as MessageKey, id: 'men', screen: 'new-arrivals' as ViewScreen, category: 'all' },
    { key: 'nav.women' as MessageKey, id: 'women', screen: 'category' as ViewScreen, category: 'women' },
    { key: 'nav.tshirts' as MessageKey, id: 't-shirts', screen: 'category' as ViewScreen, category: 't-shirts' },
    { key: 'nav.shirts' as MessageKey, id: 'shirts', screen: 'category' as ViewScreen, category: 'shirts' },
    { key: 'nav.jeans' as MessageKey, id: 'jeans', screen: 'category' as ViewScreen, category: 'jeans' },
    { key: 'nav.bottomwear' as MessageKey, id: 'bottomwear', screen: 'category' as ViewScreen, category: 'bottomwear' },
    { key: 'nav.homeDecor' as MessageKey, id: 'home-decor', screen: 'category' as ViewScreen, category: 'home-decor' },
    { key: 'nav.autoParts' as MessageKey, id: 'auto-electrical', screen: 'category' as ViewScreen, category: 'auto-electrical' },
    { key: 'nav.accessories' as MessageKey, id: 'accessories', screen: 'category' as ViewScreen, category: 'accessories' },
    { key: 'nav.sale' as MessageKey, id: 'sale', screen: 'new-arrivals' as ViewScreen, category: 'sale', isSale: true },
  ];

  useEffect(() => {
    if (!womenMenuOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (womenMenuRef.current && !womenMenuRef.current.contains(event.target as Node)) {
        setWomenMenuOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setWomenMenuOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [womenMenuOpen]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`zayro-header fixed top-0 w-full z-50 bg-[#f9f9f9]/95 backdrop-blur-md border-b border-[#cfc4c5]/30 ${
        scrolled ? 'zayro-header-scrolled' : ''
      }`}
    >
      <div className="relative flex justify-between items-center px-4 sm:px-5 md:px-16 h-20 w-full max-w-[1440px] mx-auto">
        <div className="relative z-20 flex items-center -ml-1 sm:-ml-2 min-w-[40px] md:min-w-[120px]">
          <button
            id="menu-btn"
            aria-label={t('nav.menu')}
            onClick={onOpenDrawer}
            className="zayro-icon-btn text-[#1a1c1c] hover:opacity-70 p-2 cursor-pointer flex items-center justify-center"
          >
            <Menu className="w-6 h-6 stroke-[1.5]" />
          </button>
        </div>

        <button
          id="brand-logo-btn"
          onClick={() => onNavigate('home')}
          className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 font-serif-luxury text-2xl md:text-3xl font-normal tracking-tight text-[#1a1c1c] hover:opacity-80 transition-opacity duration-300 cursor-pointer text-center whitespace-nowrap pointer-events-auto"
        >
          ZAYRO
        </button>

        <div className="relative z-20 flex items-center justify-end -mr-1 sm:-mr-2 min-w-[40px] md:min-w-[260px]">
          <div className="relative group hidden md:block">
            <div
              className="flex items-center gap-1.5 text-[#1a1c1c] px-1.5 py-2 cursor-default"
              title={`Current Location: ${deliveryCity || 'Not set'}`}
            >
              <MapPin className="w-3.5 h-3.5 stroke-[1.5] shrink-0" />
              <span className="text-[11px] font-semibold tracking-wide hidden sm:inline max-w-[88px] truncate">
                Deliver to...
              </span>
            </div>
            <div className="zayro-dropdown-panel pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-1 z-[80] hidden group-hover:block whitespace-nowrap bg-black text-white text-[11px] tracking-wide px-3 py-2">
              Current Location: {deliveryCity || 'Not set'}
            </div>
          </div>
          <div className="hidden md:block">
            <LanguageSelector />
          </div>
          <ThemeToggle />
          <button
            type="button"
            aria-label={t('nav.search')}
            onClick={onOpenSearch}
            className="zayro-icon-btn relative text-[#1a1c1c] hover:opacity-70 p-1.5 sm:p-2 cursor-pointer flex items-center justify-center"
          >
            <Search className="w-6 h-6 stroke-[1.5]" />
          </button>
          <button
            type="button"
            aria-label={t('nav.account')}
            onClick={onAccountClick}
            className="zayro-icon-btn relative text-[#1a1c1c] hover:opacity-70 p-1.5 sm:p-2 cursor-pointer flex items-center justify-center"
          >
            <User className="w-6 h-6 stroke-[1.5]" />
          </button>
          <button
            id="cart-btn"
            aria-label={t('nav.bag')}
            onClick={onOpenCart}
            className="zayro-icon-btn relative text-[#1a1c1c] hover:opacity-70 p-1.5 sm:p-2 cursor-pointer flex items-center justify-center"
          >
            <ShoppingBag className="w-6 h-6 stroke-[1.5]" />
            {cartCount > 0 && (
              <span
                id="cart-count-badge"
                className="absolute -top-1 -right-1 bg-black text-white text-[10px] font-medium tracking-tight h-5 min-w-[20px] px-1 flex items-center justify-center"
              >
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <nav className="hidden md:flex flex-wrap justify-center items-center gap-x-5 lg:gap-x-8 gap-y-2 px-4 py-3.5 border-t border-[#cfc4c5]/20 bg-[#f9f9f9]">
        {navItems.map((item) => {
          const onShopScreen = currentScreen === 'category' || currentScreen === 'new-arrivals';
          const isActive =
            (item.screen === 'home' && currentScreen === 'home') ||
            (item.screen === 'new-arrivals' &&
              currentScreen === 'new-arrivals' &&
              !activeCategory &&
              !item.category) ||
            (activeCategory === item.category && onShopScreen) ||
            (item.id === 'women' && onShopScreen && isWomenCategory(activeCategory));

          if (item.id === 'women') {
            return (
              <div key={item.id} ref={womenMenuRef} className="relative">
                <button
                  type="button"
                  id={`nav-${item.id}`}
                  aria-haspopup="true"
                  aria-expanded={womenMenuOpen}
                  onClick={() => setWomenMenuOpen((open) => !open)}
                  className={`zayro-nav-link flex items-center gap-1 text-xs uppercase tracking-[0.15em] font-medium py-1 relative cursor-pointer ${
                    isActive ? 'is-active text-black font-semibold' : 'text-[#5d5f5f] hover:text-black'
                  }`}
                >
                  {t(item.key)}
                  <ChevronDown
                    className={`w-3.5 h-3.5 stroke-[1.8] transition-transform ${womenMenuOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {womenMenuOpen && (
                  <div className="absolute left-1/2 -translate-x-1/2 top-full mt-3 z-[80] w-64">
                  <div className="zayro-dropdown-panel bg-white border border-[#cfc4c5]/40 shadow-xl max-h-[70vh] overflow-y-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setWomenMenuOpen(false);
                        onNavigate('category', 'women');
                      }}
                      className="block w-full text-left px-6 py-3.5 text-sm font-semibold text-black border-b border-[#cfc4c5]/40 hover:bg-[#eeeeee] cursor-pointer"
                    >
                      View All
                    </button>
                    {WOMEN_SUBCATEGORIES.map((sub) => (
                      <button
                        key={sub.slug}
                        type="button"
                        onClick={() => {
                          setWomenMenuOpen(false);
                          onNavigate('category', sub.slug);
                        }}
                        className={`block w-full text-left px-6 py-3.5 text-sm border-b last:border-b-0 border-[#cfc4c5]/40 hover:bg-[#eeeeee] cursor-pointer ${
                          activeCategory === sub.slug ? 'text-black font-semibold' : 'text-[#5d5f5f]'
                        }`}
                      >
                        {sub.name}
                      </button>
                    ))}
                  </div>
                  </div>
                )}
              </div>
            );
          }

          return (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              onClick={() => onNavigate(item.screen, item.category)}
              className={`zayro-nav-link text-xs uppercase tracking-[0.15em] font-medium py-1 relative cursor-pointer ${
                item.isSale
                  ? 'zayro-nav-sale text-[#ba1a1a] hover:opacity-80'
                  : isActive
                    ? 'is-active text-black font-semibold'
                    : 'text-[#5d5f5f] hover:text-black'
              }`}
            >
              {t(item.key)}
            </button>
          );
        })}
      </nav>
    </header>
  );
};
