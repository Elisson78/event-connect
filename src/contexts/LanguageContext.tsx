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
  t: (key: string, options?: Record<string, string | number>) => string;
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
  const t = (key: string, options?: Record<string, string | number>) => {
    const currentTranslations = translations[language] || translations['pt-BR'];
    
    let value: string;
    
    // Verificar se a chave contém pontos (acesso aninhado)
    if (key.includes('.')) {
      const parts = key.split('.');
      let result = currentTranslations;
      
      // Navegar através das partes da chave
      for (const part of parts) {
        if (result && typeof result === 'object' && part in result) {
          result = result[part];
        } else {
          console.log('Chave não encontrada:', key);
          return key; // Retornar a chave original se não encontrada
        }
      }
      
      value = typeof result === 'string' ? result : key;
    } else {
      // Acesso direto para chaves simples
      value = currentTranslations[key] || key;
    }
    
    // Se não há opções para interpolação, retornar o valor diretamente
    if (!options || typeof value !== 'string') {
      return value;
    }
    
    // Realizar interpolação de template (substituir {{variável}} por valores)
    let interpolatedValue = value;
    for (const [variable, replacement] of Object.entries(options)) {
      const placeholder = `{{${variable}}}`;
      interpolatedValue = interpolatedValue.replace(new RegExp(placeholder, 'g'), String(replacement));
    }
    
    return interpolatedValue;
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