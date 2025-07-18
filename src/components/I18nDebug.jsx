import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const I18nDebug = () => {
  const { language, setLanguage, t } = useLanguage();
  const [debugInfo, setDebugInfo] = useState({});

  // Teste de traduções básicas
  const testTranslations = [
    'welcome', 
    'dashboard', 
    'login', 
    'plans', 
    'for_organizers', 
    'participant_overview'
  ];

  const handleLanguageChange = (newLang) => {
    console.log('I18nDebug - Mudando idioma para:', newLang);
    setLanguage(newLang);
    
    // Atualizar informações de debug
    updateDebugInfo(newLang);
  };

  const updateDebugInfo = (lang) => {
    const currentLang = lang || language;
    const info = {
      currentLanguage: currentLang,
      documentLang: document.documentElement.lang,
      localStorageLang: localStorage.getItem('i18nextLng'),
      navigatorLanguage: navigator.language,
    };
    setDebugInfo(info);
  };

  return (
    <div className="p-6 bg-yellow-50 border-2 border-yellow-400 rounded-lg">
      <h2 className="text-xl font-bold mb-4 text-yellow-800">Debug i18n (Simplificado)</h2>
      
      <div className="mb-4">
        <h3 className="font-semibold mb-2">Informações do Sistema:</h3>
        <pre className="text-xs bg-white p-2 rounded border overflow-auto">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </div>

      <div className="mb-4">
        <h3 className="font-semibold mb-2">Teste de Traduções:</h3>
        <div className="space-y-1 text-sm">
          {testTranslations.map(key => (
            <p key={key}>
              <strong>{key}:</strong> {t(key)}
            </p>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <h3 className="font-semibold mb-2">Controles:</h3>
        <div className="space-x-2">
          <button 
            onClick={() => handleLanguageChange('pt-BR')}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
          >
            PT-BR
          </button>
          <button 
            onClick={() => handleLanguageChange('fr-CH')}
            className="px-3 py-1 bg-green-500 text-white rounded text-sm"
          >
            FR-CH
          </button>
          <button 
            onClick={() => updateDebugInfo()}
            className="px-3 py-1 bg-purple-500 text-white rounded text-sm"
          >
            Atualizar Info
          </button>
        </div>
      </div>

      <div className="text-xs text-yellow-700">
        <p>Verifique o console do navegador para logs detalhados.</p>
      </div>
    </div>
  );
};

export default I18nDebug;