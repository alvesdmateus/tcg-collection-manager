import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from './locales/en.json';
import ptBRTranslations from './locales/pt-BR.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enTranslations,
      },
      'pt-BR': {
        translation: ptBRTranslations,
      },
    },
    lng: localStorage.getItem('language') || 'en', // Default language from localStorage or English
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
  });

export default i18n;
