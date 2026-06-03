import { Crosshair, MapPin } from 'lucide-react'
import { useLanguage } from '../i18n/LanguageContext.jsx'
import CitySelector from './CitySelector.jsx'
import { useOrderLocation } from '../hooks/useOrderLocation.js'
import { activeOblasts } from '../geography/index.js'

/**
 * Тапсырыс құру: облыс/қала + мекенжай.
 * Геолокация рұқсат етілсе — автоматты толтыру, өзгертуге болады.
 */
export default function OrderLocationFields({
  store,
  profile = {},
  objects = [],
  value = {},
  onChange,
  autoDetectGeo = true,
  showObjectPicker = false,
  showMap = false,
  mapSlot = null,
  inputClassName = 'w-full mt-1 p-3 rounded-xl border border-[var(--gp-border)] bg-[var(--gp-surface)]',
  addressClassName = 'w-full mt-1 p-3 rounded-xl border border-[var(--gp-border)] bg-[var(--gp-surface)]',
  className = '',
}) {
  const { lang, t } = useLanguage()
  const patch = (p) => onChange(p)

  const { geoStatus, detectLocation, applyObject, applyCitySelection } = useOrderLocation({
    store,
    profile,
    objects,
    autoDetect: autoDetectGeo,
    value,
    onChange: patch,
  })

  const statusHint = {
    detecting: t('geoDetecting'),
    granted: t('geoGranted'),
    denied: t('geoDenied'),
    unavailable: t('geoUnavailable'),
  }[geoStatus]

  const onObjectChange = (objectId) => {
    applyObject(objectId)
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-slate-600 min-h-[1.25rem]">
          <MapPin className="w-3.5 h-3.5 shrink-0 text-gp-green-600" />
          {statusHint && <span>{statusHint}</span>}
        </div>
        <button
          type="button"
          onClick={detectLocation}
          disabled={geoStatus === 'detecting'}
          className="flex items-center gap-1 text-xs font-semibold text-gp-blue-600 hover:underline shrink-0 disabled:opacity-50"
        >
          <Crosshair className="w-3.5 h-3.5" />
          {t('useMyLocation')}
        </button>
      </div>

      {store ? (
        <CitySelector
          store={store}
          value={{ oblastId: value.oblastId, cityId: value.cityId }}
          inputClassName={inputClassName}
          onChange={applyCitySelection}
        />
      ) : (
        <ManualCityFields
          store={store}
          value={value}
          onChange={patch}
          lang={lang}
          t={t}
          inputClassName={inputClassName}
        />
      )}

      {showObjectPicker && objects.length > 0 && (
        <label className="block text-sm">
          <span className="font-medium">{t('myObjects')}</span>
          <select
            value={value.objectId || ''}
            onChange={(e) => onObjectChange(e.target.value)}
            className={inputClassName}
          >
            {objects.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
        </label>
      )}

      <label className="block text-sm">
        <span className="font-medium">{t('address')}</span>
        <input
          type="text"
          value={value.address || ''}
          onChange={(e) => patch({ address: e.target.value })}
          placeholder={t('addressPlaceholder')}
          className={addressClassName}
          required
        />
      </label>

      {showMap && mapSlot}
    </div>
  )
}

function ManualCityFields({ store, value, onChange, lang, t, inputClassName }) {
  const oblasts = activeOblasts(store)
  if (store && oblasts.length) {
    return (
      <CitySelector
        store={store}
        value={{ oblastId: value.oblastId, cityId: value.cityId }}
        inputClassName={inputClassName}
        onChange={(sel) => onChange(sel)}
      />
    )
  }

  return (
    <div className="space-y-2">
      <label className="block">
        <span className="text-xs font-medium opacity-80">{t('oblast')}</span>
        <input
          type="text"
          value={value.oblastText || ''}
          onChange={(e) => onChange({ oblastText: e.target.value })}
          placeholder={t('selectOblast')}
          className={inputClassName}
        />
      </label>
      <label className="block">
        <span className="text-xs font-medium opacity-80">{t('city')}</span>
        <input
          type="text"
          value={value.city || ''}
          onChange={(e) => onChange({ city: e.target.value, cityId: '', oblastId: value.oblastId })}
          placeholder={t('selectCity')}
          className={inputClassName}
        />
      </label>
    </div>
  )
}
