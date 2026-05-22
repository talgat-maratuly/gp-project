import { useEffect, useState } from 'react'
import { listServiceProjects, updateServiceProjectStatus, syncFromHub } from '@gp/shared/demo'
import { useLanguage } from '../i18n'
import { usePartner } from '../context/PartnerContext'
import { formatPrice } from '@gp/shared/utils'

const FLOW = { submitted: 'assigned', assigned: 'in_progress', in_progress: 'completed' }

export default function ServiceProjectsOrdersPage({ type }) {
  const { t } = useLanguage()
  const { user, isDemoMode, notify } = usePartner()
  const [list, setList] = useState([])

  const load = async () => {
    if (!isDemoMode || !user?.partnerId) return
    await syncFromHub()
    const all = listServiceProjects({ type, franchiseId: user.franchiseId })
    setList(all.filter((p) => p.partnerId === user.partnerId || p.status === 'submitted'))
  }

  useEffect(() => {
    load()
    const iv = setInterval(load, 4000)
    return () => clearInterval(iv)
  }, [type, user?.partnerId, isDemoMode])

  const advance = (id, status) => {
    const next = FLOW[status]
    if (!next) return
    updateServiceProjectStatus(id, next, user.partnerId)
    notify(t('notify_status_updated'))
    load()
  }

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">{type === 'hunter_irrigation' ? t('sp_orders_hunter') : t('sp_orders_furniture')}</h1>
      <ul className="space-y-2">
        {list.map((p) => (
          <li key={p.id} className="partner-card p-4">
            <p className="font-bold">{p.clientName}</p>
            <p className="text-sm partner-muted">{p.city} · {formatPrice(p.totalPrice)}</p>
            <p className="text-xs mt-1">{t('status')}: {p.status}</p>
            {FLOW[p.status] && (
              <button type="button" className="mt-2 w-full py-2 rounded-xl partner-gradient text-white text-sm font-semibold" onClick={() => advance(p.id, p.status)}>
                {t('market_next_status')}
              </button>
            )}
          </li>
        ))}
        {!list.length && <p className="partner-muted text-sm">{t('orders_empty')}</p>}
      </ul>
    </div>
  )
}
