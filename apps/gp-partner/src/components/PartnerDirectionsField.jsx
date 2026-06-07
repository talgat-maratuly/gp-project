import { PARTNER_DIRECTIONS } from '@gp/shared/constants'

/**
 * Множественный выбор категорий услуг (направлений партнёра).
 * value — UI-идентификаторы: septic, lawn, irrigation, ...
 */
export default function PartnerDirectionsField({ value, onChange, disabled = false }) {
  const toggle = (id) => {
    if (disabled) return
    if (value.includes(id)) onChange(value.filter((d) => d !== id))
    else onChange([...value, id])
  }

  const count = value.length

  return (
    <fieldset className="border-0 p-0 m-0">
      <legend className="text-xs font-semibold text-[var(--gp-text-muted)] mb-2 uppercase tracking-wide">
        Категории услуг
      </legend>
      <p className="text-[11px] text-[var(--gp-text-muted)] mb-2 leading-snug">
        Отметьте все направления, в которых вы работаете — по ним будут приходить заявки. Можно выбрать несколько сразу.
      </p>
      <p className="text-xs text-emerald-600 font-medium mb-2" aria-live="polite">
        Выбрано категорий: {count}
      </p>
      <div className="grid grid-cols-1 gap-2 max-h-[min(52vh,22rem)] overflow-y-auto overscroll-contain pr-1 rounded-xl border border-[var(--gp-border)] bg-[var(--gp-surface-2)] p-2">
        {PARTNER_DIRECTIONS.map((d) => {
          const checked = value.includes(d.id)
          return (
            <label
              key={d.id}
              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                disabled ? 'opacity-50 cursor-not-allowed' : ''
              } ${
                checked ? 'border-emerald-500/60 bg-emerald-500/10' : 'border-[var(--gp-border)] bg-[var(--gp-surface)]'
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(d.id)}
                disabled={disabled}
                className="accent-emerald-500 w-4 h-4 shrink-0"
              />
              <span className="text-sm text-[var(--gp-text)]">{d.label}</span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
