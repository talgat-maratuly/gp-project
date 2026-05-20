import { useState } from 'react'
import { usePartner } from '../context/PartnerContext'
import { formatPrice } from '@gp/shared/utils'

const PAYOUT_METHODS = [
  { id: 'kaspi', label: 'Kaspi' },
  { id: 'halyk', label: 'Halyk Bank' },
  { id: 'forte', label: 'ForteBank' },
  { id: 'card', label: 'На карту' },
]

export default function PayoutsPage() {
  const { balance } = usePartner()
  const [method, setMethod] = useState('kaspi')

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Выплаты</h1>
      <p className="text-sm text-slate-400 mb-3">Куда вывести средства</p>
      <div className="grid grid-cols-2 gap-2 mb-4">
        {PAYOUT_METHODS.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMethod(m.id)}
            className={`py-2.5 rounded-xl text-xs font-semibold border ${method === m.id ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-white/10 text-slate-400'}`}
          >
            {m.label}
          </button>
        ))}
      </div>
      <button type="button" className="w-full py-4 rounded-2xl partner-gradient font-bold mb-6">
        Вывести {formatPrice(balance.available)} · {PAYOUT_METHODS.find((m) => m.id === method)?.label}
      </button>
      <ul className="space-y-2 text-sm">
        {[{ d: '12 мая', a: 45000, via: 'Kaspi' }, { d: '28 апр', a: 32000, via: 'Halyk' }].map((p, i) => (
          <li key={i} className="partner-card p-3 flex justify-between">
            <span className="text-slate-400">{p.d} · {p.via}</span>
            <span className="text-emerald-400">{formatPrice(p.a)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
