import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpApi from 'i18next-http-backend';

// Configuração do i18n
i18n
  .use(HttpApi)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'pt-BR',
    supportedLngs: ['pt-BR', 'fr-CH'],
    ns: ['common'],
    defaultNS: 'common',
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
    returnNull: false,
    returnEmptyString: false,
    debug: true,
  });

// Logs para debug
i18n.on('languageChanged', (lng) => {
  console.log('i18n - Idioma mudou para:', lng);
  console.log('i18n - Estado atual:', {
    language: i18n.language,
    languages: i18n.languages,
    resolvedLanguage: i18n.resolvedLanguage,
    dir: i18n.dir(),
    isInitialized: i18n.isInitialized,
  });
});

// Adicionar logs para eventos de carregamento
i18n.on('loaded', (loaded) => {
  console.log('i18n - Recursos carregados:', loaded);
});

i18n.on('failedLoading', (lng, ns, msg) => {
  console.error('i18n - Erro ao carregar recursos:', lng, ns, msg);
});

// Log para monitorar as requisições HTTP
console.log('i18n - Backend loadPath configurado como:', i18n.options.backend && typeof i18n.options.backend === 'object' ? 
  (i18n.options.backend as Record<string, any>).loadPath : 'não definido');

export default i18n; 