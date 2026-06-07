import { EMPTY_NAMES } from '@gp/shared/i18n'
import { useLanguage } from '../i18n/LanguageContext'

export default function LocalizedNameFields({ names = EMPTY_NAMES, onChange }) {
  const { t } = useLanguage()
  const fields = [
    { code: 'ru', label: t('nameRu') },
    { code: 'kk', label: t('nameKk') },
    { code: 'en', label: t('nameEn') },
  ]

  return (
    <div className="space-y-2">
      {fields.map(({ code, label }) => (
        <label key={code} className="block">
          <span className="text-xs text-slate-300 font-medium">{label}</span>
          <input
            className="admin-input mt-1"
            value={names[code] || ''}
            onChange={(e) => onChange({ ...names, [code]: e.target.value })}
          />
        </label>
      ))}
    </div>
  )
}
