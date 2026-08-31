import React from 'react';
import { Menu, ShoppingBag } from 'lucide-react';
import { ViewScreen } from '../types';

interface HeaderProps {
  currentScreen: ViewScreen;
  activeCategory: string | null;
  onNavigate: (screen: ViewScreen, category?: string) => void;
  onOpenDrawer: () => void;
  onOpenCart: () => void;
  cartCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  activeCategory,
  onNavigate,
  onOpenDrawer,
  onOpenCart,
  cartCount,
}) => {
  const navItems = [
    { label: 'Home', screen: 'home' as ViewScreen, category: undefined },
    { label: 'New Arrivals', screen: 'new-arrivals' as ViewScreen, category: undefined },
    { label: 'Men', screen: 'new-arrivals' as ViewScreen, category: 'all' },
    { label: 'T-Shirts', screen: 'category' as ViewScreen, category: 't-shirts' },
    { label: 'Shirts', screen: 'category' as ViewScreen, category: 'shirts' },
    { label: 'Jeans', screen: 'category' as ViewScreen, category: 'jeans' },
    { label: 'Bottomwear', screen: 'category' as ViewScreen, category: 'bottomwear' },
    { label: 'Sale', screen: 'new-arrivals' as ViewScreen, category: 'sale', isSale: true },
  ];

  return (
    <header className="fixed top-0 w-full z-50 bg-[#f9f9f9]/95 backdrop-blur-md border-b border-[#cfc4c5]/30 transition-all">
      <div className="flex justify-between items-center px-5 md:px-16 h-20 w-full max-w-[1440px] mx-auto">
        {/* Leading Menu Button */}
        <button
          id="menu-btn"
          aria-label="Open menu"
          onClick={onOpenDrawer}
          className="text-[#1a1c1c] hover:opacity-70 transition-opacity p-2 cursor-pointer active:scale-95 flex items-center justify-center -ml-2"
        >
          <Menu className="w-6 h-6 stroke-[1.5]" />
        </button>

        {/* Brand Headline */}
        <button
          id="brand-logo-btn"
          onClick={() => onNavigate('home')}
          className="font-serif-luxury text-2xl md:text-3xl font-normal tracking-tight text-[#1a1c1c] hover:opacity-80 transition-opacity cursor-pointer text-center"
        >
          ZAYRO
        </button>

        {/* Trailing Shopping Bag Button */}
        <button
          id="cart-btn"
          aria-label="Shopping bag"
          onClick={onOpenCart}
          className="relative text-[#1a1c1c] hover:opacity-70 transition-opacity p-2 cursor-pointer active:scale-95 flex items-center justify-center -mr-2"
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

      {/* Desktop Secondary Navigation Bar */}
      <nav className="hidden md:flex justify-center items-center gap-8 py-3.5 border-t border-[#cfc4c5]/20 bg-[#f9f9f9]">
        {navItems.map((item) => {
          const isActive =
            (item.screen === 'home' && currentScreen === 'home') ||
            (item.screen === 'new-arrivals' && currentScreen === 'new-arrivals' && !activeCategory && !item.category) ||
            (activeCategory === item.category && (currentScreen === 'category' || currentScreen === 'new-arrivals'));

          return (
            <button
              key={item.label}
              id={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() => onNavigate(item.screen, item.category)}
              className={`text-xs uppercase tracking-[0.15em] font-medium transition-all duration-150 py-1 relative cursor-pointer ${
                item.isSale
                  ? 'text-[#ba1a1a] hover:opacity-80'
                  : isActive
                  ? 'text-black border-b border-black font-semibold'
                  : 'text-[#5d5f5f] hover:text-black'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
};
