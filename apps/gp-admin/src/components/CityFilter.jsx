import { useAccess } from '../context/AccessContext'
import { useLanguage } from '../i18n/LanguageContext'
import { useStore } from '../context/StoreContext'

export default function CityFilter() {
  const { isSuperAdmin, selectedFranchiseId, setSelectedFranchiseId, currentFranchise } = useAccess()
  const { store } = useStore()
  const { t } = useLanguage()

  if (!isSuperAdmin) {
    return currentFranchise ? (
      <span className="text-xs px-3 py-1.5 rounded-lg bg-sky-500/15 text-sky-200 border border-sky-500/30">
        {currentFranchise.city}
      </span>
    ) : null
  }

  return (
    <select
      className="admin-input text-xs py-1.5 max-w-[160px]"
      value={selectedFranchiseId}
      onChange={(e) => setSelectedFranchiseId(e.target.value)}
    >
      <option value="all">{t('allCities')}</option>
      {store.franchises.map((f) => (
        <option key={f.id} value={f.id}>
          {f.city}
        </option>
      ))}
    </select>
  )
}
