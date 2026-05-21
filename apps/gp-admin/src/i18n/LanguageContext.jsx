import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { DEFAULT_LANG, LANG_STORAGE_KEY, translations } from './translations'

const LanguageContext = createContext(null)

function loadLang() {
  try {
    const saved = localStorage.getItem(LANG_STORAGE_KEY)
    if (saved && translations[saved]) return saved
  } catch {
    /* ignore */
  }
  return DEFAULT_LANG
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(loadLang)

  const setLang = useCallback((code) => {
    if (!translations[code]) return
    localStorage.setItem(LANG_STORAGE_KEY, code)
    setLangState(code)
  }, [])

  const t = useCallback(
    (key) => {
      const dict = translations[lang] || translations[DEFAULT_LANG]
      return dict[key] ?? translations[DEFAULT_LANG][key] ?? key
    },
    [lang],
  )

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}

/** Статус заявки: new → status_new */
export function useOrderStatusLabel() {
  const { t } = useLanguage()
  return (statusId) => t(`status_${statusId}`)
}

/** Услуга по id: septic → service_septic */
export function useServiceLabel() {
  const { t } = useLanguage()
  return (serviceId) => (serviceId ? t(`service_${serviceId}`) : '')
}
