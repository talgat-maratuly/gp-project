import { useMemo } from 'react'
import { useLanguage } from '../i18n/LanguageContext.jsx'
import {
  activeCities,
  activeDistricts,
  activeOblasts,
  cityLabel,
  districtLabel,
  oblastLabel,
  resolveCitySelection,
} from '../geography/index.js'

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
  showDistrict = false,
}) {
  const { lang, t } = useLanguage()
  const oblasts = useMemo(() => activeOblasts(store), [store])
  const cities = useMemo(() => activeCities(store, value.oblastId), [store, value.oblastId])
  const districts = useMemo(
    () => (showDistrict ? activeDistricts(store, value.cityId) : []),
    [store, value.cityId, showDistrict],
  )

  const onOblastChange = (oblastId) => {
    onChange({ oblastId, cityId: '', city: '', franchiseId: null, districtId: '', district: '' })
  }

  const onCityChange = (cityId) => {
    const resolved = resolveCitySelection(store, cityId, lang)
    onChange({
      oblastId: resolved?.oblastId || value.oblastId,
      cityId,
      city: resolved?.city || '',
      franchiseId: resolved?.franchiseId || null,
      districtId: '',
      district: '',
    })
  }

  const onDistrictChange = (districtId) => {
    const resolved = resolveCitySelection(store, value.cityId, lang, districtId)
    onChange({
      oblastId: resolved?.oblastId || value.oblastId,
      cityId: value.cityId || '',
      city: resolved?.city || value.city || '',
      franchiseId: resolved?.franchiseId || value.franchiseId || null,
      districtId: resolved?.districtId || '',
      district: resolved?.district || '',
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
      {showDistrict && districts.length > 0 && (
        <label className="block">
          <span className="text-xs font-medium opacity-80">{t('district')}</span>
          <select
            className={inputClassName}
            value={value.districtId || ''}
            disabled={disabled || !value.cityId}
            onChange={(e) => onDistrictChange(e.target.value)}
          >
            <option value="">{t('selectDistrict')}</option>
            {districts.map((d) => (
              <option key={d.id} value={d.id}>{districtLabel(d, lang)}</option>
            ))}
          </select>
        </label>
      )}
    </div>
  )
}
