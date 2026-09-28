import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { INDIAN_LANGUAGES, TRANSLATIONS, LanguageOption, TranslationKeys } from '../data/languages';

interface LanguageContextType {
  currentLanguage: string;
  setLanguage: (code: string) => void;
  t: (key: TranslationKeys | string, fallback?: string) => string;
  languages: LanguageOption[];
  getLanguageInfo: (code: string) => LanguageOption;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguageState] = useState<string>(() => {
    return localStorage.getItem('krishakarya_language') || localStorage.getItem('krishikulture_language') || 'en';
  });

  const setLanguage = (code: string) => {
    setCurrentLanguageState(code);
    try {
      localStorage.setItem('krishakarya_language', code);
      window.dispatchEvent(new CustomEvent('krishakarya_language_changed', { detail: { language: code } }));
    } catch (e) {
      console.warn('Could not save language to localStorage:', e);
    }
  };

  useEffect(() => {
    document.documentElement.lang = currentLanguage;
    if (currentLanguage === 'ur') {
      document.documentElement.dir = 'rtl';
    } else {
      document.documentElement.dir = 'ltr';
    }
  }, [currentLanguage]);

  useEffect(() => {
    const handleLangSync = (e: Event) => {
      const customEvent = e as CustomEvent<{ language: string }>;
      if (customEvent.detail?.language && customEvent.detail.language !== currentLanguage) {
        setCurrentLanguageState(customEvent.detail.language);
      }
    };
    window.addEventListener('krishakarya_language_changed', handleLangSync);
    return () => window.removeEventListener('krishakarya_language_changed', handleLangSync);
  }, [currentLanguage]);

  const t = (key: TranslationKeys | string, fallback?: string): string => {
    const langDict = TRANSLATIONS[currentLanguage] || TRANSLATIONS['en'];
    const enDict = TRANSLATIONS['en'];
    if (langDict && langDict[key]) {
      return langDict[key];
    }
    if (enDict && enDict[key]) {
      return enDict[key];
    }
    return fallback !== undefined ? fallback : key;
  };

  const getLanguageInfo = (code: string): LanguageOption => {
    return INDIAN_LANGUAGES.find((l) => l.code === code) || INDIAN_LANGUAGES[0];
  };

  const isRTL = currentLanguage === 'ur';

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        setLanguage,
        t,
        languages: INDIAN_LANGUAGES,
        getLanguageInfo,
        isRTL,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
