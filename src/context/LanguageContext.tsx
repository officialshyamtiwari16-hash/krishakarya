import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { INDIAN_LANGUAGES, TRANSLATIONS, LanguageOption, TranslationKeys } from '../data/languages';

interface LanguageContextType {
  currentLanguage: string;
  setLanguage: (code: string) => void;
  t: (key: TranslationKeys) => string;
  languages: LanguageOption[];
  getLanguageInfo: (code: string) => LanguageOption;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguageState] = useState<string>(() => {
    return localStorage.getItem('krishikulture_language') || 'en';
  });

  const setLanguage = (code: string) => {
    setCurrentLanguageState(code);
    localStorage.setItem('krishikulture_language', code);
  };

  useEffect(() => {
    // Optionally set lang attribute on document
    document.documentElement.lang = currentLanguage;
  }, [currentLanguage]);

  const t = (key: TranslationKeys): string => {
    const langDict = TRANSLATIONS[currentLanguage] || TRANSLATIONS['en'];
    return langDict[key] || TRANSLATIONS['en'][key] || key;
  };

  const getLanguageInfo = (code: string): LanguageOption => {
    return INDIAN_LANGUAGES.find((l) => l.code === code) || INDIAN_LANGUAGES[0];
  };

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        setLanguage,
        t,
        languages: INDIAN_LANGUAGES,
        getLanguageInfo,
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
