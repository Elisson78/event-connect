import { useLanguage } from '../contexts/LanguageContext';

// Hook compatível para substituir o react-i18next
export const useTranslation = (ns?: string | string[]) => {
  const { language, setLanguage, t } = useLanguage();

  // Retorna uma interface compatível com o react-i18next
  return {
    t,
    i18n: {
      language,
      changeLanguage: setLanguage,
      // Propriedades adicionais para compatibilidade
      resolvedLanguage: language,
      isInitialized: true,
      options: { ns },
      on: () => {},
      off: () => {},
      store: { data: {} },
      hasLoadedNamespace: () => true,
      loadNamespaces: async () => Promise.resolve(),
      dir: () => 'ltr'
    }
  } as const;
};