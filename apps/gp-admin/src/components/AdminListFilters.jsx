import { useEffect, useState } from 'react'
import { api } from '@gp/shared/api'
import { useLanguage } from '../i18n/LanguageContext'

/**
 * Общие фильтры списков админки: регион, город, поиск.
 */
export default function AdminListFilters({ value, onChange, showCity = true, showStatus = false, statusOptions = [] }) {
  const { t } = useLanguage()
  const [regions, setRegions] = useState([])

  useEffect(() => {
    api.getRegions().then((rows) => setRegions(Array.isArray(rows) ? rows : [])).catch(() => setRegions([]))
  }, [])

  const set = (patch) => onChange({ ...value, ...patch })

  return (
    <div className="flex flex-wrap gap-2 mb-4 items-end">
      <label className="text-xs text-slate-400 block">
        {t('filter_region')}
        <select
          className="admin-input mt-1 min-w-[140px]"
          value={value.regionId || ''}
          onChange={(e) => set({ regionId: e.target.value || undefined })}
        >
          <option value="">{t('filter_all_regions')}</option>
          {regions.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
      </label>
      {showCity && (
        <label className="text-xs text-slate-400 block">
          {t('filter_city')}
          <input
            className="admin-input mt-1 min-w-[120px]"
            placeholder={t('filter_all_cities')}
            value={value.city || ''}
            onChange={(e) => set({ city: e.target.value || undefined })}
          />
        </label>
      )}
      {showStatus && (
        <label className="text-xs text-slate-400 block">
          {t('filter_status')}
          <select
            className="admin-input mt-1 min-w-[120px]"
            value={value.status || ''}
            onChange={(e) => set({ status: e.target.value || undefined })}
          >
            <option value="">{t('all')}</option>
            {statusOptions.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
      )}
      <label className="text-xs text-slate-400 block flex-1 min-w-[160px]">
        {t('filter_search')}
        <input
          className="admin-input mt-1 w-full"
          placeholder="…"
          value={value.q || ''}
          onChange={(e) => set({ q: e.target.value || undefined })}
        />
      </label>
    </div>
  )
}
