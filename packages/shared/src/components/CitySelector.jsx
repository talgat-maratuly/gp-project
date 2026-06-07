import { useMemo } from 'react'
import { useLanguage } from '../i18n/LanguageContext.jsx'
import { activeCities, activeOblasts, cityLabel, oblastLabel, resolveCitySelection } from '../geography/index.js'

/**
 * Область + қала каскад таңдау (Admin, GP Service).
 * value: { oblastId, cityId }
 */
export default function CitySelector({
  store,
  value = {},
  onChange,
  className = '',
  inputClassName = '',
  disabled = false,
}) {
  const { lang, t } = useLanguage()
  const oblasts = useMemo(() => activeOblasts(store), [store])
  const cities = useMemo(() => activeCities(store, value.oblastId), [store, value.oblastId])

  const onOblastChange = (oblastId) => {
    onChange({ oblastId, cityId: '' })
  }

  const onCityChange = (cityId) => {
    const resolved = resolveCitySelection(store, cityId, lang)
    onChange({
      oblastId: value.oblastId,
      cityId,
      city: resolved?.city || '',
      franchiseId: resolved?.franchiseId || null,
    })
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block">
        <span className="text-xs font-medium opacity-80">{t('oblast')}</span>
        <select
          className={inputClassName}
          value={value.oblastId || ''}
          disabled={disabled}
          onChange={(e) => onOblastChange(e.target.value)}
        >
          <option value="">{t('selectOblast')}</option>
          {oblasts.map((o) => (
            <option key={o.id} value={o.id}>{oblastLabel(o, lang)}</option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="text-xs font-medium opacity-80">{t('city')}</span>
        <select
          className={inputClassName}
          value={value.cityId || ''}
          disabled={disabled || !value.oblastId}
          onChange={(e) => onCityChange(e.target.value)}
        >
          <option value="">{t('selectCity')}</option>
          {cities.map((c) => (
            <option key={c.id} value={c.id}>{cityLabel(c, lang)}</option>
          ))}
        </select>
      </label>
    </div>
  )
}
