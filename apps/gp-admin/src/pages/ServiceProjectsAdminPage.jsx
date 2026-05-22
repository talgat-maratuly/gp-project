import { useEffect, useState } from 'react'
import { listServiceProjects, syncFromHub } from '@gp/shared/demo'
import { useAccess } from '../context/AccessContext'
import { useLanguage } from '../i18n/LanguageContext'
import { formatPrice } from '@gp/shared/utils'

export default function ServiceProjectsAdminPage({ type }) {
  const { t } = useLanguage()
  const { effectiveFranchiseId } = useAccess()
  const [list, setList] = useState([])

  useEffect(() => {
    syncFromHub().then(() => {
      let all = listServiceProjects({ type })
      if (effectiveFranchiseId) all = all.filter((p) => p.franchiseId === effectiveFranchiseId)
      setList(all)
    })
    const iv = setInterval(() => syncFromHub().then(() => {
      let all = listServiceProjects({ type })
      if (effectiveFranchiseId) all = all.filter((p) => p.franchiseId === effectiveFranchiseId)
      setList(all)
    }), 5000)
    return () => clearInterval(iv)
  }, [type, effectiveFranchiseId])

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">{type === 'hunter_irrigation' ? t('admin_hunter') : t('admin_furniture')}</h1>
      <ul className="space-y-2">
        {list.map((p) => (
          <li key={p.id} className="rounded-xl border border-white/10 p-4">
            <p className="font-bold">{p.clientName} · {p.city}</p>
            <p className="text-sm text-slate-400">{formatPrice(p.totalPrice)} · {p.status}</p>
            {p.hunter && <p className="text-xs mt-1">{p.hunter.area} м² · {p.hunter.zones} зон</p>}
            {p.furniture && <p className="text-xs mt-1">{p.furniture.furnitureLength}м · {p.furniture.material}</p>}
          </li>
        ))}
        {!list.length && <p className="text-slate-500">{t('orders_empty')}</p>}
      </ul>
    </div>
  )
}
