import React from 'react';
import { Camera, Mail, Truck } from 'lucide-react';
import { ViewScreen } from '../types';
import { useI18n } from '../i18n/LanguageContext';
import { LANGUAGES, REGIONS } from '../i18n/languages';

interface FooterProps {
  onNavigate: (screen: ViewScreen, category?: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { t, language, region } = useI18n();
  const langLabel = LANGUAGES.find((l) => l.code === language)?.latin || 'EN';
  const regionLabel = REGIONS.find((r) => r.code === region)?.code || 'IN';
  const whatsappHref = `https://wa.me/917681987334?text=${encodeURIComponent(
    "Hello ZAYRO Store! 👋 Thank you for visiting ZAYRO Store. We're happy to have you here! 👋 How can we help you today?"
  )}`;

  return (
    <footer className="bg-white border-t border-[#cfc4c5]/30 w-full mt-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 px-5 md:px-16 py-16 md:py-24 max-w-[1440px] mx-auto">
        {/* Col 1: Brand Info */}
        <div className="col-span-1 md:col-span-1 mb-4 md:mb-0">
          <button
            onClick={() => onNavigate('home')}
            className="font-serif-luxury text-3xl md:text-4xl text-black block mb-4 font-normal tracking-tight text-left cursor-pointer"
          >
            ZAYRO
          </button>
          <p className="text-sm text-[#5d5f5f] leading-relaxed max-w-xs mb-6 font-light">
            {t('footer.tagline')}
          </p>
          <div className="flex gap-4 text-[#5d5f5f]">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              className="hover:text-black transition-colors"
            >
              <Camera className="w-5 h-5 stroke-[1.5]" />
            </a>
           <button
              type="button"
              aria-label="Email Concierge"
              onClick={() => onNavigate('contact')}
              className="hover:text-black transition-colors cursor-pointer"
            >
              <Mail className="w-5 h-5 stroke-[1.5]" />
            </button>
          </div>
        </div>

        {/* Col 2: Shop */}
        <div className="flex flex-col gap-3">
          <h4 className="text-xs uppercase tracking-[0.2em] font-semibold text-black mb-2">
            {t('footer.shop')}
          </h4>
          <button
            onClick={() => onNavigate('new-arrivals')}
            className="text-sm text-[#5d5f5f] hover:text-black hover:underline transition-all text-left cursor-pointer"
          >
            {t('nav.newArrivals')}
          </button>
          <button
            onClick={() => onNavigate('category', 't-shirts')}
            className="text-sm text-[#5d5f5f] hover:text-black hover:underline transition-all text-left cursor-pointer"
          >
            {t('nav.tshirts')}
          </button>
          <button
            onClick={() => onNavigate('category', 'shirts')}
            className="text-sm text-[#5d5f5f] hover:text-black hover:underline transition-all text-left cursor-pointer"
          >
            {t('nav.shirts')}
          </button>
          <button
            onClick={() => onNavigate('category', 'jeans')}
            className="text-sm text-[#5d5f5f] hover:text-black hover:underline transition-all text-left cursor-pointer"
          >
            {t('nav.jeans')}
          </button>
          <button
            onClick={() => onNavigate('category', 'cargos')}
            className="text-sm text-[#5d5f5f] hover:text-black hover:underline transition-all text-left cursor-pointer"
          >
            {t('footer.cargos')}
          </button>
          <button
            onClick={() => onNavigate('new-arrivals', 'sale')}
            className="text-sm text-[#ba1a1a] hover:opacity-80 hover:underline transition-all text-left cursor-pointer"
          >
            {t('nav.sale')}
          </button>
        </div>

        {/* Col 3: Support */}
        <div className="flex flex-col gap-3">
          <h4 className="text-xs uppercase tracking-[0.2em] font-semibold text-black mb-2">
            {t('footer.support')}
          </h4>
          <button
            type="button"
            onClick={() => onNavigate('contact')}
            className="text-sm text-[#5d5f5f] hover:text-black hover:underline transition-all text-left cursor-pointer"
          >
            {t('footer.contact')}
          </button>
          <button
            type="button"
            onClick={() => onNavigate('shipping')}
            className="text-sm text-[#5d5f5f] hover:text-black hover:underline transition-all text-left cursor-pointer"
          >
            {t('footer.shipping')}
          </button>
          <button
            type="button"
            onClick={() => onNavigate('account', 'orders')}
            className="text-sm text-[#5d5f5f] hover:text-black hover:underline transition-all text-left cursor-pointer"
          >
            {t('footer.trackOrder')}
          </button>
          <button
            type="button"
            onClick={() => onNavigate('returns')}
            className="text-sm text-[#5d5f5f] hover:text-black hover:underline transition-all text-left cursor-pointer"
          >
            {t('footer.returns')}
          </button>
          <button
            type="button"
            onClick={() => onNavigate('size-guide')}
            className="text-sm text-[#5d5f5f] hover:text-black hover:underline transition-all text-left cursor-pointer"
          >
            {t('footer.sizeGuide')}
          </button>
          <button
            type="button"
            onClick={() => onNavigate('faq')}
            className="text-sm text-[#5d5f5f] hover:text-black hover:underline transition-all text-left cursor-pointer"
          >
            {t('footer.faq')}
          </button>
        </div>

        {/* Col 4: Company */}
        <div className="flex flex-col gap-3">
          <h4 className="text-xs uppercase tracking-[0.2em] font-semibold text-black mb-2">
            {t('footer.company')}
          </h4>
          <button
            type="button"
            onClick={() => onNavigate('about')}
            className="text-sm text-[#5d5f5f] hover:text-black hover:underline transition-all text-left cursor-pointer"
          >
            {t('footer.about')}
          </button>
          <button
            type="button"
            onClick={() => onNavigate('story')}
            className="text-sm text-[#5d5f5f] hover:text-black hover:underline transition-all text-left cursor-pointer"
          >
            {t('footer.story')}
          </button>
          <button
            type="button"
            onClick={() => onNavigate('privacy')}
            className="text-sm text-[#5d5f5f] hover:text-black hover:underline transition-all text-left cursor-pointer"
          >
            {t('footer.privacy')}
          </button>
          <button
            type="button"
            onClick={() => onNavigate('terms')}
            className="text-sm text-[#5d5f5f] hover:text-black hover:underline transition-all text-left cursor-pointer"
          >
            {t('footer.terms')}
          </button>
        </div>

        {/* Col 5: Contact & Delivery */}
        <div className="flex flex-col gap-3">
          <h4 className="text-xs uppercase tracking-[0.2em] font-semibold text-black mb-2">
            Contact & Delivery
          </h4>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
            aria-label="WhatsApp Support +91 7681987334"
            className="text-sm text-[#5d5f5f] hover:text-black hover:underline transition-all text-left flex items-start gap-2"
          >
            <svg
              viewBox="0 0 24 24"
              className="w-4 h-4 mt-0.5 shrink-0"
              fill="currentColor"
              aria-hidden
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479s1.065 2.875 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
            </svg>
            <span>
              <span className="block">WhatsApp Support</span>
              <span className="block">+91 7681987334</span>
            </span>
          </a>
          <p className="text-sm text-[#5d5f5f] font-light leading-relaxed flex items-start gap-2">
            <Truck className="w-4 h-4 mt-0.5 shrink-0 stroke-[1.5]" aria-hidden />
            <span>
              <span className="block">Fast Delivery in Hoshiarpur</span>
              <span className="block">Orders delivered within 2 days.</span>
            </span>
          </p>
        </div>
      </div>

      {/* Bottom Copyright & Currency */}
      <div className="border-t border-[#cfc4c5]/20 px-5 md:px-16 py-6 max-w-[1440px] mx-auto flex flex-col md:flex-row justify-between items-center text-xs text-[#5d5f5f] gap-3">
        <p>{t('footer.copyright')}</p>
        <div className="flex items-center gap-4">
          <span>
            {langLabel} / {regionLabel}
          </span>
          <span>•</span>
          <span>{t('footer.shippingNote')}</span>
        </div>
      </div>
    </footer>
  );
};
