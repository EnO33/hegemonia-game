import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from '../../locales/en/common.json'
import fr from '../../locales/fr/common.json'

const resources = {
  en: { common: en },
  fr: { common: fr },
}

i18n.use(initReactI18next).init({
  resources,
  lng: typeof window !== 'undefined'
    ? localStorage.getItem('hegemonia-locale') ?? 'en'
    : 'en',
  fallbackLng: 'en',
  defaultNS: 'common',
  ns: ['common'],
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
