import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  LanguageCode,
  MessageKey,
  MESSAGES,
  RegionCode,
  REGIONS,
} from './languages';

const LANG_KEY = 'zayro_language';
const REGION_KEY = 'zayro_region';

interface LanguageContextValue {
  language: LanguageCode;
  region: RegionCode;
  setLanguage: (code: LanguageCode) => void;
  setRegion: (code: RegionCode) => void;
  t: (key: MessageKey) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function readLanguage(): LanguageCode {
  const stored = localStorage.getItem(LANG_KEY);
  if (stored && stored in MESSAGES) return stored as LanguageCode;
  return 'en';
}

function readRegion(): RegionCode {
  const stored = localStorage.getItem(REGION_KEY);
  if (stored && REGIONS.some((r) => r.code === stored)) return stored as RegionCode;
  return 'IN';
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>(() =>
    typeof window === 'undefined' ? 'en' : readLanguage()
  );
  const [region, setRegionState] = useState<RegionCode>(() =>
    typeof window === 'undefined' ? 'IN' : readRegion()
  );

  useEffect(() => {
    localStorage.setItem(LANG_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    localStorage.setItem(REGION_KEY, region);
  }, [region]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      region,
      setLanguage: setLanguageState,
      setRegion: setRegionState,
      t: (key) => MESSAGES[language][key] || MESSAGES.en[key],
    }),
    [language, region]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export function useI18n() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useI18n must be used within LanguageProvider');
  return ctx;
}
