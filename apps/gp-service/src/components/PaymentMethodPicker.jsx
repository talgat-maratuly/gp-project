import { PAYMENT_TO_PARTNER } from '@gp/shared/constants'

export default function PaymentMethodPicker({ value, onChange }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-2">
        {PAYMENT_TO_PARTNER.map((m) => {
          const active = value === m.id || (m.id === 'kaspi_partner' && value === 'kaspi')
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onChange(m.id)}
              className={`p-4 rounded-2xl border-2 text-left transition ${active ? 'border-gp-green-600 bg-gp-green-50' : 'border-slate-200 bg-white'}`}
            >
              <span className="block font-bold text-sm text-slate-800">{m.label}</span>
              <span className="block text-[11px] text-slate-500 mt-1 leading-snug">{m.note}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
