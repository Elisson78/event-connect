import React, { createContext, useContext, useState, useEffect } from 'react';
import i18n from '../utils/i18n';

type LanguageContextType = {
  language: string;
  setLanguage: (lang: string) => void;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [language, setLanguageState] = useState(i18n.language);

  const setLanguage = (lang: string) => {
    console.log('LanguageContext - Mudando idioma para:', lang);
    i18n.changeLanguage(lang);
    setLanguageState(lang);
    localStorage.setItem('i18nextLng', lang);
    document.documentElement.lang = lang;
  };

  useEffect(() => {
    console.log('LanguageContext - Idioma inicial:', i18n.language);
    setLanguage(i18n.language);
  }, []);

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
}; 