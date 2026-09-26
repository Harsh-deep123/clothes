import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { ViewScreen } from '../../types';
import { InfoPageShell } from './InfoPageShell';

interface FaqPageProps {
  onNavigate: (screen: ViewScreen, category?: string) => void;
}

const FAQS = [
  {
    q: 'How can I track my order?',
    a: 'Once your order ships, we email a tracking number to the address used at checkout. Allow up to 24 hours for the first carrier scan. You can also review order status in My Account after signing in on this device.',
  },
  {
    q: 'How long does shipping take?',
    a: 'In-stock pieces typically leave our atelier within 1–2 business days. Standard delivery in the contiguous United States is 3–6 business days after dispatch. Express options and international windows are listed on our Shipping page.',
  },
  {
    q: 'Can I change my order after placing it?',
    a: 'We begin preparing orders quickly. If you need to update an address or cancel, contact concierge immediately with your order number. Changes are only possible before the parcel is dispatched.',
  },
  {
    q: 'What is your return policy?',
    a: 'Unworn items with tags attached may be returned within 14 days of delivery. Final-sale, custom, and worn pieces are not eligible. Full details are on our Returns page.',
  },
  {
    q: 'How do I exchange an item?',
    a: 'Request an exchange when you start a return, noting the preferred size or color. If the replacement is unavailable, we issue a refund to the original payment method.',
  },
  {
    q: 'How do I find my correct size?',
    a: 'Use our Size Guide to measure chest, waist, hip, shoulder, and sleeve, then compare with the charts for tees, shirts, jeans, and cargos. If you fall between sizes, we recommend the larger option.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'This storefront currently records orders locally on your device. Live card processing is not connected. When payments are enabled, we will accept major cards through a certified processor.',
  },
  {
    q: 'How can I contact customer support?',
    a: 'Write to support@zayrocollection.com or use the Contact page. Client services are available Monday–Friday, 9:00 AM–6:00 PM EST, and Saturday 10:00 AM–4:00 PM EST.',
  },
];

export const FaqPage: React.FC<FaqPageProps> = ({ onNavigate }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <InfoPageShell
      eyebrow="Support"
      title="HOW CAN WE HELP?"
      intro="Answers to the questions we hear most. If you still need us, our concierge is a message away."
      onNavigate={onNavigate}
    >
      <div className="max-w-3xl border-t border-[#cfc4c5]/30">
        {FAQS.map((item, index) => {
          const isOpen = openIndex === index;
          return (
            <div key={item.q} className="border-b border-[#cfc4c5]/30">
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="w-full flex items-center justify-between gap-4 py-5 text-left cursor-pointer"
                aria-expanded={isOpen}
              >
                <span className="text-sm sm:text-base font-medium text-black pr-4">{item.q}</span>
                <ChevronDown
                  className={`w-4 h-4 shrink-0 text-[#5d5f5f] transition-transform duration-200 ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              <div
                className={`grid transition-[grid-template-rows] duration-200 ease-out ${
                  isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                }`}
              >
                <div className="overflow-hidden">
                  <p className="pb-5 text-sm text-[#5d5f5f] font-light leading-relaxed">{item.a}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => onNavigate('contact')}
        className="mt-10 bg-black text-white text-xs font-semibold uppercase px-8 py-4 tracking-[0.2em] hover:bg-neutral-800 transition-colors cursor-pointer active:scale-95"
      >
        Contact Support
      </button>
    </InfoPageShell>
  );
};
