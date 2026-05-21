import { LANGUAGES } from '../i18n/translations'
import { useLanguage } from '../i18n/LanguageContext'

export default function LanguageSwitcher() {
  const { lang, setLang } = useLanguage()

  return (
    <div className="flex items-center rounded-xl border border-white/10 overflow-hidden text-xs font-bold">
      {LANGUAGES.map(({ code, label }) => (
        <button
          key={code}
          type="button"
          onClick={() => setLang(code)}
          className={`px-2.5 py-1.5 transition ${
            lang === code ? 'bg-sky-600 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
