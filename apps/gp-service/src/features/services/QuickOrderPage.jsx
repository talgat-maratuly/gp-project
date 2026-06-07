import { useNavigate } from 'react-router-dom'
import { ArrowRight, Droplets, Filter, LandPlot, Scissors, Truck } from 'lucide-react'
import { formatPrice } from '@gp/shared/utils'
import { PageHeader } from '@gp/shared/ui/KaspiUI'
import { SERVICE_CATALOG } from '../../data/services'

const QUICK_SERVICE_IDS = [
  'septic-pumping',
  'irrigation-tuning',
  'lawn-trim',
  'grass-mowing',
  'filter-cartridge',
  'filter-install',
]

const ICONS = { Droplets, Truck, Scissors, LandPlot, Filter }

/** selectedService = null → список; выбор → экран оформления (/services/:id) */
export default function QuickOrderPage() {
  const navigate = useNavigate()
  const services = QUICK_SERVICE_IDS.map((id) => SERVICE_CATALOG.find((s) => s.id === id)).filter(Boolean)

  const pickService = (serviceId) => {
    navigate(`/services/${serviceId}`, { state: { fromQuickOrder: true } })
  }

  return (
    <div className="px-4 py-4 gp-animate-in">
      <PageHeader title="Быстрый заказ" subtitle="Выберите услугу" onBack={() => navigate(-1)} />
      <ul className="space-y-3">
        {services.map((s) => {
          const Icon = ICONS[s.icon] || Droplets
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => pickService(s.id)}
                className="w-full text-left rounded-2xl border border-[var(--gp-border)] bg-[var(--gp-surface)] p-4 flex items-center gap-3 active:scale-[0.99] transition cursor-pointer hover:ring-2 hover:ring-emerald-500/30"
              >
                <div className="w-11 h-11 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold">{s.name}</p>
                  <p className="text-xs text-[var(--gp-text-muted)] mt-0.5">от {formatPrice(s.priceFrom)}</p>
                </div>
                <ArrowRight className="w-5 h-5 text-emerald-600 shrink-0" />
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
