import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const DirectI18nTest = () => {
  const { language, setLanguage, t } = useLanguage();
  const [currentLang, setCurrentLang] = useState(language);

  const changeLanguage = (lang) => {
    console.log('DirectI18nTest - Mudando idioma para:', lang);
    setLanguage(lang);
    setCurrentLang(lang);
  };

  return (
    <div className="p-6 bg-green-50 border-2 border-green-400 rounded-lg">
      <h2 className="text-xl font-bold mb-4 text-green-800">Teste Direto de Idioma (Simplificado)</h2>
      
      <div className="mb-4">
        <p><strong>Idioma atual:</strong> {currentLang}</p>
        <p><strong>Idioma HTML:</strong> {document.documentElement.lang}</p>
        <p><strong>LocalStorage:</strong> {localStorage.getItem('i18nextLng')}</p>
      </div>

      <div className="mb-4">
        <h3 className="font-semibold mb-2">Traduções:</h3>
        <div className="space-y-1 text-sm">
          <p><strong>welcome:</strong> {t('welcome')}</p>
          <p><strong>dashboard:</strong> {t('dashboard')}</p>
          <p><strong>login:</strong> {t('login')}</p>
          <p><strong>participant_overview:</strong> {t('participant_overview')}</p>
        </div>
      </div>
      
      <div className="mb-4">
        <h3 className="font-semibold mb-2">Controles Diretos:</h3>
        <div className="space-x-2">
          <button 
            onClick={() => changeLanguage('pt-BR')}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
          >
            PT-BR (Direto)
          </button>
          <button 
            onClick={() => changeLanguage('fr-CH')}
            className="px-3 py-1 bg-green-500 text-white rounded text-sm"
          >
            FR-CH (Direto)
          </button>
        </div>
      </div>

      <div className="text-xs text-green-700">
        <p>Este componente testa o sistema de idiomas diretamente, usando nossa nova implementação.</p>
      </div>
    </div>
  );
};

export default DirectI18nTest;