import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useI18n } from '../i18n/LanguageContext';
import { LANGUAGES, REGIONS, RegionCode } from '../i18n/languages';

function IndiaFlag({ className = 'w-[18px] h-[12px]' }: { className?: string }) {
  return (
    <svg viewBox="0 0 21 15" className={className} aria-hidden>
      <rect width="21" height="5" fill="#FF9933" />
      <rect y="5" width="21" height="5" fill="#FFFFFF" />
      <rect y="10" width="21" height="5" fill="#138808" />
      <circle cx="10.5" cy="7.5" r="1.6" fill="#000080" />
    </svg>
  );
}

function RegionFlag({ region, className = 'w-[18px] h-[12px]' }: { region: RegionCode; className?: string }) {
  if (region === 'IN') return <IndiaFlag className={className} />;
  if (region === 'US') {
    return (
      <svg viewBox="0 0 21 15" className={className} aria-hidden>
        <rect width="21" height="15" fill="#B22234" />
        <rect y="1.15" width="21" height="1.15" fill="#FFFFFF" />
        <rect y="3.45" width="21" height="1.15" fill="#FFFFFF" />
        <rect y="5.75" width="21" height="1.15" fill="#FFFFFF" />
        <rect y="8.05" width="21" height="1.15" fill="#FFFFFF" />
        <rect y="10.35" width="21" height="1.15" fill="#FFFFFF" />
        <rect y="12.65" width="21" height="1.15" fill="#FFFFFF" />
        <rect width="9" height="8" fill="#3C3B6E" />
      </svg>
    );
  }
  if (region === 'GB') {
    return (
      <svg viewBox="0 0 21 15" className={className} aria-hidden>
        <rect width="21" height="15" fill="#012169" />
        <path d="M0 0 L21 15 M21 0 L0 15" stroke="#FFFFFF" strokeWidth="3" />
        <path d="M0 0 L21 15 M21 0 L0 15" stroke="#C8102E" strokeWidth="1.2" />
        <path d="M10.5 0 V15 M0 7.5 H21" stroke="#FFFFFF" strokeWidth="5" />
        <path d="M10.5 0 V15 M0 7.5 H21" stroke="#C8102E" strokeWidth="2.4" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 21 15" className={className} aria-hidden>
      <rect width="7" height="15" fill="#00732F" />
      <rect x="7" width="7" height="15" fill="#FFFFFF" />
      <rect x="14" width="7" height="15" fill="#000000" />
      <polygon points="10.5,4.2 11.6,7.5 15,7.5 12.2,9.5 13.2,12.8 10.5,10.8 7.8,12.8 8.8,9.5 6,7.5 9.4,7.5" fill="#FF0000" />
    </svg>
  );
}

export const LanguageSelector: React.FC = () => {
  const { language, region, setLanguage, setRegion, t } = useI18n();
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState<'language' | 'region'>('language');
  const rootRef = useRef<HTMLDivElement>(null);
  const current = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];
  const currentRegion = REGIONS.find((r) => r.code === region) || REGIONS[0];

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setPanel('language');
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label={t('lang.changeLanguage')}
        aria-expanded={open}
        onClick={() => {
          setOpen((v) => !v);
          setPanel('language');
        }}
        className="flex items-center gap-1.5 text-[#1a1c1c] hover:opacity-70 transition-opacity px-1.5 py-2 cursor-pointer active:scale-95"
      >
        <RegionFlag region={region} />
        <span className="text-[11px] font-semibold tracking-wide">{current.latin}</span>
        <ChevronDown className={`w-3 h-3 stroke-[2] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
          <div className="zayro-dropdown-panel absolute right-0 top-full mt-1 z-[70] w-[260px]">
          <div className="absolute -top-1.5 right-6 w-3 h-3 bg-white border-l border-t border-[#d5d9d9] rotate-45" />
          <div className="relative bg-white border border-[#d5d9d9] shadow-[0_4px_14px_rgba(0,0,0,0.18)] rounded-sm overflow-hidden">
            {panel === 'language' ? (
              <>
                <p className="px-4 pt-3 pb-2 text-[13px] text-[#565959]">{t('lang.changeLanguage')}</p>
                <div className="pb-1">
                  {LANGUAGES.map((lang, index) => {
                    const selected = lang.code === language;
                    return (
                      <React.Fragment key={lang.code}>
                        {index === 1 && <div className="mx-4 my-1.5 border-t border-[#e7e7e7]" />}
                        <label className="flex items-center gap-3 px-4 py-1.5 cursor-pointer hover:bg-[#f7fafa]">
                          <input
                            type="radio"
                            name="zayro-language"
                            checked={selected}
                            onChange={() => setLanguage(lang.code)}
                            className="accent-[#ff9900] w-3.5 h-3.5"
                          />
                          <span className="text-[13px] text-[#0f1111]">
                            {lang.native} - {lang.latin}
                          </span>
                        </label>
                      </React.Fragment>
                    );
                  })}
                </div>
                <div className="border-t border-[#e7e7e7] px-4 py-3">
                  <p className="text-[12px] text-[#0f1111] flex items-center gap-2">
                    {t('lang.shoppingOn')} {currentRegion.domain}
                    <RegionFlag region={region} />
                  </p>
                  <button
                    type="button"
                    onClick={() => setPanel('region')}
                    className="mt-1 text-[13px] text-[#007185] hover:underline text-left cursor-pointer"
                  >
                    {t('lang.changeCountry')}
                  </button>
                </div>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setPanel('language')}
                  className="px-4 pt-3 pb-1 text-[13px] text-[#007185] hover:underline cursor-pointer"
                >
                  ← {t('lang.back')}
                </button>
                <p className="px-4 pb-2 text-[13px] text-[#565959]">{t('lang.chooseRegion')}</p>
                {REGIONS.map((item) => (
                  <label key={item.code} className="flex items-center gap-3 px-4 py-1.5 cursor-pointer hover:bg-[#f7fafa]">
                    <input
                      type="radio"
                      name="zayro-region"
                      checked={item.code === region}
                      onChange={() => {
                        setRegion(item.code);
                        setPanel('language');
                      }}
                      className="accent-[#ff9900] w-3.5 h-3.5"
                    />
                    <RegionFlag region={item.code} />
                    <span className="text-[13px] text-[#0f1111]">
                      {item.name} · {item.domain}
                    </span>
                  </label>
                ))}
                <div className="h-2" />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
