import { useTranslation as useI18nTranslation } from 'react-i18next';

export const useTranslation = (ns?: string | string[]) => {
  return useI18nTranslation(ns);
}; 