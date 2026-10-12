import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en/translation.json';
import fr from './locales/fr/translation.json';
import es from './locales/es/translation.json';
import ta from './locales/ta/translation.json';
import hi from './locales/hi/translation.json';

const savedLanguage = localStorage.getItem('webintel_lang') || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      fr: { translation: fr },
      es: { translation: es },
      ta: { translation: ta },
      hi: { translation: hi }
    },
    lng: savedLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
