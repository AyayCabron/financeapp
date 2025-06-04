import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(LanguageDetector) // Detecta idioma do navegador
  .use(initReactI18next)
  .init({
    fallbackLng: 'pt',
    interpolation: {
      escapeValue: false, // React já escapa por padrão
    },
    resources: {
      en: {
        translation: {
          income: 'Income',
          checking: 'Checking',
          savings: 'Savings',
        },
      },
      pt: {
        translation: {
          income: 'Receita',
          checking: 'Conta Corrente',
          savings: 'Poupança',
        },
      },
    },
  });

export default i18n;
