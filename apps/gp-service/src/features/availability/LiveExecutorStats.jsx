import { useEffect, useState } from 'react'
import { Clock, RadioTower, ShieldCheck, Truck } from 'lucide-react'
import { api } from '@gp/shared/api'
import { useLanguage } from '../../i18n'

export default function LiveExecutorStats({ city, serviceId, category }) {
  const { t } = useLanguage()
  const [data, setData] = useState(null)

  useEffect(() => {
    let alive = true
    const load = async () => {
      try {
        const row = await api.getServiceAvailability({ city, serviceId, category })
        if (alive) setData(row)
      } catch {
        if (alive) setData(null)
      }
    }
    load()
    const iv = setInterval(load, 15000)
    return () => {
      alive = false
      clearInterval(iv)
    }
  }, [city, serviceId, category])

  if (!data) return null

  const stats = [
    [t('live_registered'), data.registered],
    [t('live_online'), data.online],
    [t('live_free'), data.free],
    [t('live_busy'), data.busy],
    [t('live_on_route'), data.onRoute],
  ]

  return (
    <section className="gp-card p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <RadioTower className="w-5 h-5 text-emerald-600" />
        <p className="font-bold">{t('live_executors')}</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-xl bg-[var(--gp-surface-2)] px-3 py-2">
            <p className="text-[11px] text-[var(--gp-text-muted)]">{label}</p>
            <p className="text-lg font-extrabold">{value ?? 0}</p>
          </div>
        ))}
      </div>
      {data.etaFreeMinutes && (
        <p className="mt-3 flex items-center gap-2 text-xs text-[var(--gp-text-muted)]">
          <Clock className="w-4 h-4" />
          {t('live_eta_free').replace('{n}', String(data.etaFreeMinutes))}
        </p>
      )}
      {data.vehicles?.length > 0 && (
        <div className="mt-3 rounded-xl border border-[var(--gp-border)] p-3">
          <p className="flex items-center gap-2 text-sm font-bold mb-2">
            <Truck className="w-4 h-4" />
            {t('live_vehicles')}
          </p>
          <div className="flex flex-wrap gap-2">
            {data.vehicles.map((v) => (
              <span key={v.volumeM3} className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                {v.volumeM3} м³ — {t('live_vehicle_count').replace('{n}', String(v.quantity))}
              </span>
            ))}
          </div>
        </div>
      )}
      <p className="mt-3 flex items-center gap-2 text-[11px] text-[var(--gp-text-muted)]">
        <ShieldCheck className="w-4 h-4" />
        {t('live_privacy_hint')}
      </p>
    </section>
  )
}
