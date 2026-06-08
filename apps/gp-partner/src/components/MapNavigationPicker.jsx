import { MAP_NAV_PROVIDERS, getPreferredMapProvider, openMapNavigation } from '@gp/shared/utils'

/**
 * Route: Google / Yandex / 2GIS choice persisted in localStorage.
 */
export default function MapNavigationPicker({ open, destination, onClose }) {
  if (!open || !destination) return null

  const preferred = getPreferredMapProvider()

  const pick = (providerId) => {
    if (openMapNavigation(providerId, destination)) onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Закрыть"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-2xl bg-[var(--gp-surface)] border border-[var(--gp-border)] p-4 shadow-xl">
        <p className="text-sm font-extrabold text-[var(--gp-text)] mb-1">Карта маршрута</p>
        <p className="text-xs text-[var(--gp-text-muted)] mb-4 truncate">
          {destination.address || `${destination.lat}, ${destination.lng}`}
        </p>
        <ul className="space-y-2">
          {MAP_NAV_PROVIDERS.map(({ id, label }) => (
            <li key={id}>
              <button
                type="button"
                onClick={() => pick(id)}
                className={`w-full py-3.5 px-4 rounded-xl text-sm font-bold text-left border transition ${
                  preferred === id
                    ? 'gp-gradient-kaspi text-white border-transparent'
                    : 'bg-[var(--gp-surface-2)] text-[var(--gp-text)] border-[var(--gp-border)] hover:border-emerald-500/40'
                }`}
              >
                {label}
                {preferred === id && (
                  <span className="ml-2 text-[10px] font-semibold opacity-90">· по умолчанию</span>
                )}
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={onClose}
          className="w-full mt-3 py-3 rounded-xl text-sm font-bold text-[var(--gp-text-muted)] border border-[var(--gp-border)]"
        >
          Отмена
        </button>
      </div>
    </div>
  )
}
