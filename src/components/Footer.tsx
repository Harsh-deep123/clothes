import React from 'react';
import { Camera, Mail } from 'lucide-react';
import { ViewScreen } from '../types';

interface FooterProps {
  onNavigate: (screen: ViewScreen, category?: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-white border-t border-[#cfc4c5]/30 w-full mt-auto">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-10 px-5 md:px-16 py-16 md:py-24 max-w-[1440px] mx-auto">
        {/* Col 1: Brand Info */}
        <div className="col-span-1 md:col-span-1 mb-4 md:mb-0">
          <button
            onClick={() => onNavigate('home')}
            className="font-serif-luxury text-3xl md:text-4xl text-black block mb-4 font-normal tracking-tight text-left cursor-pointer"
          >
            ZAYRO
          </button>
          <p className="text-sm text-[#5d5f5f] leading-relaxed max-w-xs mb-6 font-light">
            Minimalist luxury for the modern individual. Precision, quality, and forward-thinking style.
          </p>
          <div className="flex gap-4 text-[#5d5f5f]">
            <a
              href="#instagram"
              aria-label="Instagram"
              className="hover:text-black transition-colors"
            >
              <Camera className="w-5 h-5 stroke-[1.5]" />
            </a>
            <a
              href="#contact"
              aria-label="Email Concierge"
              className="hover:text-black transition-colors"
            >
              <Mail className="w-5 h-5 stroke-[1.5]" />
            </a>
          </div>
        </div>

        {/* Col 2: Shop */}
        <div className="flex flex-col gap-3">
          <h4 className="text-xs uppercase tracking-[0.2em] font-semibold text-black mb-2">
            Shop
          </h4>
          <button
            onClick={() => onNavigate('new-arrivals')}
            className="text-sm text-[#5d5f5f] hover:text-black hover:underline transition-all text-left cursor-pointer"
          >
            New Arrivals
          </button>
          <button
            onClick={() => onNavigate('category', 't-shirts')}
            className="text-sm text-[#5d5f5f] hover:text-black hover:underline transition-all text-left cursor-pointer"
          >
            T-Shirts
          </button>
          <button
            onClick={() => onNavigate('category', 'shirts')}
            className="text-sm text-[#5d5f5f] hover:text-black hover:underline transition-all text-left cursor-pointer"
          >
            Shirts
          </button>
          <button
            onClick={() => onNavigate('category', 'jeans')}
            className="text-sm text-[#5d5f5f] hover:text-black hover:underline transition-all text-left cursor-pointer"
          >
            Jeans
          </button>
          <button
            onClick={() => onNavigate('category', 'cargos')}
            className="text-sm text-[#5d5f5f] hover:text-black hover:underline transition-all text-left cursor-pointer"
          >
            Cargos
          </button>
          <button
            onClick={() => onNavigate('new-arrivals', 'sale')}
            className="text-sm text-[#ba1a1a] hover:opacity-80 hover:underline transition-all text-left cursor-pointer"
          >
            Sale
          </button>
        </div>

        {/* Col 3: Support */}
        <div className="flex flex-col gap-3">
          <h4 className="text-xs uppercase tracking-[0.2em] font-semibold text-black mb-2">
            Support
          </h4>
          <a
            href="#contact"
            className="text-sm text-[#5d5f5f] hover:text-black hover:underline transition-all"
          >
            Contact
          </a>
          <a
            href="#shipping"
            className="text-sm text-[#5d5f5f] hover:text-black hover:underline transition-all"
          >
            Shipping
          </a>
          <a
            href="#returns"
            className="text-sm text-[#5d5f5f] hover:text-black hover:underline transition-all"
          >
            Returns
          </a>
          <a
            href="#size-guide"
            className="text-sm text-[#5d5f5f] hover:text-black hover:underline transition-all"
          >
            Size Guide
          </a>
        </div>

        {/* Col 4: Company */}
        <div className="flex flex-col gap-3">
          <h4 className="text-xs uppercase tracking-[0.2em] font-semibold text-black mb-2">
            Company
          </h4>
          <a
            href="#about"
            className="text-sm text-[#5d5f5f] hover:text-black hover:underline transition-all"
          >
            About
          </a>
          <a
            href="#story"
            className="text-sm text-[#5d5f5f] hover:text-black hover:underline transition-all"
          >
            Story
          </a>
          <a
            href="#privacy"
            className="text-sm text-[#5d5f5f] hover:text-black hover:underline transition-all"
          >
            Privacy
          </a>
        </div>
      </div>

      {/* Bottom Copyright & Currency */}
      <div className="border-t border-[#cfc4c5]/20 px-5 md:px-16 py-6 max-w-[1440px] mx-auto flex flex-col md:flex-row justify-between items-center text-xs text-[#5d5f5f] gap-3">
        <p>© 2024 ZAYRO Collection. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <span className="cursor-pointer hover:text-black">EN / USD</span>
          <span>•</span>
          <span>Complimentary Global Shipping</span>
        </div>
      </div>
    </footer>
  );
};
