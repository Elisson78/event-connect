import React, { createContext, useContext, useState, useEffect } from 'react';

// Importar diretamente os objetos de tradução
import translationsPT from '../translations/pt-BR.json';
import translationsFR from '../translations/fr-CH.json';

const translations = {
  'pt-BR': translationsPT,
  'fr-CH': translationsFR
};

// Definir o tipo do contexto
type LanguageContextType = {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('i18nextLng') || 'pt-BR';
  });

  const setLanguage = (lang: string) => {
    console.log('LanguageContext - Mudando idioma para:', lang);
    
    // Atualizar estado
    setLanguageState(lang);
    
    // Atualizar localStorage
    localStorage.setItem('i18nextLng', lang);
    
    // Atualizar atributo lang do HTML
    document.documentElement.lang = lang;
  };

  // Função para obter uma tradução
  const t = (key: string) => {
    const currentTranslations = translations[language] || translations['pt-BR'];
    
    // Verificar se a chave contém pontos (acesso aninhado)
    if (key.includes('.')) {
      const parts = key.split('.');
      let value = currentTranslations;
      
      // Navegar através das partes da chave
      for (const part of parts) {
        if (value && typeof value === 'object' && part in value) {
          value = value[part];
        } else {
          console.log('Chave não encontrada:', key);
          return key; // Retornar a chave original se não encontrada
        }
      }
      
      return value;
    }
    
    // Acesso direto para chaves simples
    return currentTranslations[key] || key;
  };

  useEffect(() => {
    // Definir idioma inicial
    const storedLang = localStorage.getItem('i18nextLng');
    if (storedLang && (storedLang === 'pt-BR' || storedLang === 'fr-CH')) {
      setLanguageState(storedLang);
      document.documentElement.lang = storedLang;
    } else {
      setLanguageState('pt-BR');
      document.documentElement.lang = 'pt-BR';
    }
    
    console.log('LanguageContext - Idioma inicial:', language);
  }, []);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};