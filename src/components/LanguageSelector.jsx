import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { ChevronDown, Globe } from 'lucide-react';

const LANGUAGES = [
  { code: 'pt-BR', label: 'Português', flag: '🇧🇷', nativeName: 'Português' },
  { code: 'fr-CH', label: 'Français (CH)', flag: '🇨🇭', nativeName: 'Français' },
];

const LanguageSelector = () => {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const currentLanguage = LANGUAGES.find(lang => lang.code === language) || LANGUAGES[0];

  const handleLanguageChange = (langCode, event) => {
    // Prevenir propagação do evento para evitar que o overlay o capture
    event.stopPropagation();
    event.preventDefault();
    
    console.log('LanguageSelector - Clique no botão de idioma:', langCode);
    
    // Aplicar a mudança de idioma diretamente
    setLanguage(langCode);
    console.log('LanguageSelector - Idioma sendo alterado para:', langCode);
    
    // Fechar o dropdown após mudar o idioma
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors w-full md:w-auto"
      >
        <Globe className="h-4 w-4 text-gray-500" />
        <span className="text-lg">{currentLanguage.flag}</span>
        <span className="sm:inline">{currentLanguage.nativeName}</span>
        <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute mt-1 w-48 bg-white border border-gray-300 rounded-md shadow-lg z-[9999] md:right-0 left-0 sm:left-auto" onClick={(e) => e.stopPropagation()}>
          <div className="py-1">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={(e) => handleLanguageChange(lang.code, e)}
                className={`w-full flex items-center space-x-3 px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                  language === lang.code ? 'bg-orange-50 text-orange-700' : 'text-gray-700'
                }`}
              >
                <span className="text-lg">{lang.flag}</span>
                <div className="flex flex-col items-start">
                  <span className="font-medium">{lang.nativeName}</span>
                  <span className="text-xs text-gray-500">{lang.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Overlay para fechar o dropdown quando clicar fora */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[9998]"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default LanguageSelector;