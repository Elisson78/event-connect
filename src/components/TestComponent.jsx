import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const TestComponent = () => {
  const { language, setLanguage, t } = useLanguage();

  const handleLanguageChange = (newLang) => {
    console.log('TestComponent - Mudando idioma para:', newLang);
    setLanguage(newLang);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">{t('participant_overview_title')}</h2>
      
      <div className="mb-4">
        <p><strong>Idioma atual:</strong> {language}</p>
        <p><strong>{t('welcome')}</strong></p>
        <p><strong>{t('dashboard')}</strong></p>
        <p><strong>{t('login')}</strong></p>
        <p><strong>{t('participant_profile')}</strong></p>
      </div>

      <div className="mb-4">
        <button 
          onClick={() => handleLanguageChange('pt-BR')}
          className="mr-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Português
        </button>
        <button 
          onClick={() => handleLanguageChange('fr-CH')}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Français
        </button>
      </div>

      <div className="text-sm text-gray-600">
        <p>Se as traduções acima mudarem quando você clicar nos botões, o sistema de tradução está funcionando!</p>
      </div>
    </div>
  );
};

export default TestComponent;