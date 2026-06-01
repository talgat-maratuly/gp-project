import { LANGUAGES } from '../i18n/translations.js'
import { useLanguage } from '../i18n/LanguageContext.jsx'

export default function LanguageSwitcher({ className = '' }) {
  const { lang, setLang } = useLanguage()

  return (
    <div className={`flex items-center rounded-xl border border-[var(--gp-border)] overflow-hidden text-xs font-bold ${className}`}>
      {LANGUAGES.map(({ code, label }) => (
        <button
          key={code}
          type="button"
          onClick={() => setLang(code)}
          className={`px-2.5 py-1.5 transition ${
            lang === code
              ? 'gp-gradient-kaspi text-white'
              : 'text-[var(--gp-text-muted)] hover:bg-[var(--gp-surface-2)] hover:text-[var(--gp-text)]'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
