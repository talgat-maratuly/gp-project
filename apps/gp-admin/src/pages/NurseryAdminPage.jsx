import { useEffect, useState } from 'react'
import { api } from '@gp/shared/api'
import { useLanguage } from '../i18n/LanguageContext'

export default function NurseryAdminPage() {
  const { t } = useLanguage()
  const [partners, setPartners] = useState([])
  const [requests, setRequests] = useState([])
  const [preorders, setPreorders] = useState([])

  const refresh = async () => {
    const [p, r, g] = await Promise.all([
      api.adminNurseryPartners().catch(() => []),
      api.adminNurseryRequests().catch(() => []),
      api.adminGrowingPreorders().catch(() => []),
    ])
    setPartners(Array.isArray(p) ? p : [])
    setRequests(Array.isArray(r) ? r : [])
    setPreorders(Array.isArray(g) ? g : [])
  }

  useEffect(() => {
    refresh()
  }, [])

  const act = async (id, kind) => {
    if (kind === 'approve') await api.adminApproveNursery(id)
    else await api.adminRejectNursery(id)
    await refresh()
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('nursery_admin')}</h1>
      <section className="admin-card p-4">
        <h2 className="font-bold mb-3">{t('nursery_apply')}</h2>
        <div className="space-y-2">
          {partners.map((n) => (
            <div key={n.id} className="rounded-xl border border-slate-700 p-3">
              <p className="font-semibold">{n.name} · {n.city}</p>
              <p className="text-xs text-slate-400">{n.bin || '—'} · {n.status} · {n.partner?.user?.phone || '—'}</p>
              <div className="flex gap-2 mt-3">
                <button onClick={() => act(n.id, 'approve')} className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm">{t('approve')}</button>
                <button onClick={() => act(n.id, 'reject')} className="px-3 py-2 rounded-lg bg-red-600 text-white text-sm">{t('reject')}</button>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="admin-card p-4">
        <h2 className="font-bold mb-3">{t('nursery_requests')}</h2>
        {requests.map((r) => (
          <div key={r.id} className="border-b border-slate-700 py-2">
            <p className="font-semibold">{r.plantName} · {r.quantity}</p>
            <p className="text-xs text-slate-400">{r.city} · {r.status} · {r.offers?.length || 0} offers</p>
          </div>
        ))}
      </section>
      <section className="admin-card p-4">
        <h2 className="font-bold mb-3">{t('growing_preorders')}</h2>
        {preorders.map((r) => (
          <div key={r.id} className="border-b border-slate-700 py-2">
            <p className="font-semibold">{r.plantName} · {r.quantity}</p>
            <p className="text-xs text-slate-400">{r.city} · {r.status} · {r.offers?.length || 0} offers</p>
          </div>
        ))}
      </section>
    </div>
  )
}
