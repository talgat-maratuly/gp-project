import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Droplets, Filter, Gauge, LandPlot, Lightbulb, RefreshCw, Scissors, Trees, Truck, UserCheck } from 'lucide-react'
import { formatPrice } from '@gp/shared/utils'
import { SERVICE_CATALOG, SERVICE_GROUPS } from '../../data/services'
import { useService } from '../../context/ServiceContext'
import { useLanguage } from '../../i18n'

const ICONS = {
  Droplets,
  Truck,
  LandPlot,
  Scissors,
  Filter,
  RefreshCw,
  Gauge,
  Trees,
  Lightbulb,
  UserCheck,
}

const SPECIAL = [
  { to: '/nursery', titleKey: 'nursery_title', descKey: 'nursery_find_plants', color: 'from-green-700 to-lime-700' },
  { to: '/delivery', titleKey: 'delivery_title', descKey: 'delivery_create_order', color: 'from-sky-700 to-emerald-700' },
  { to: '/services/plant-doctor', titleKey: 'plant_doctor_title', descKey: 'plant_doctor_desc', color: 'from-lime-600 to-emerald-700' },
  { to: '/services/hunter-irrigation', titleKey: 'hunter_title', descKey: 'hunter_subtitle', color: 'from-emerald-600 to-emerald-800' },
  { to: '/services/furniture', titleKey: 'furniture_title', descKey: 'furniture_subtitle', color: 'from-slate-600 to-slate-800' },
]

export default function ServicesPage() {
  const navigate = useNavigate()
  const { t, lang } = useLanguage()
  const { getCityCatalog, profile } = useService()

  const catalog = useMemo(
    () => getCityCatalog(SERVICE_CATALOG, lang),
    [getCityCatalog, lang, profile.franchiseId, profile.cityId],
  )
  const byId = useMemo(() => {
    const cityById = Object.fromEntries(catalog.map((s) => [s.id, s]))
    return Object.fromEntries(
      SERVICE_CATALOG.map((service) => [service.id, cityById[service.id] || service]),
    )
  }, [catalog])

  return (
    <div className="px-4 py-4">
      <h1 className="text-2xl font-bold mb-1">{t('nav_services')}</h1>
      <p className="text-sm text-slate-500 mb-1">{t('servicesPageDesc')}</p>
      {profile.city && (
        <p className="text-xs text-gp-green-700 font-semibold mb-6">{profile.city}</p>
      )}

      <section className="mb-6 space-y-2">
        {SPECIAL.map((s) => (
          <Link key={s.to} to={s.to} className={`block rounded-2xl bg-gradient-to-r ${s.color} text-white p-4 shadow-md`}>
            <p className="font-bold">{t(s.titleKey)}</p>
            <p className="text-xs opacity-90 mt-1">{t(s.descKey)}</p>
          </Link>
        ))}
      </section>

      {SERVICE_GROUPS.map((group) => {
        const items = group.services.map((sid) => byId[sid]).filter(Boolean)
        if (!items.length) return null
        return (
          <section key={group.id} className="mb-6">
            <h2 className="text-sm font-bold text-gp-green-700 uppercase tracking-wide mb-3">{group.title}</h2>
            <ul className="space-y-2">
              {items.map((s) => {
                const Icon = ICONS[s.icon] || Droplets
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => navigate(`/services/${s.id}`)}
                      className="w-full gp-card p-4 flex items-center gap-3 text-left active:bg-slate-50"
                    >
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-gp-green-100 to-gp-blue-100 flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-gp-green-700" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800">{s.name}</p>
                        <p className="text-xs text-slate-500">
                          {s.priceNote || `${t('priceFrom')} ${formatPrice(s.priceFrom)}`} · {s.duration}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
