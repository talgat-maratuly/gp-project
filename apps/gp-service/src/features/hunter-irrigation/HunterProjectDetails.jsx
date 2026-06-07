import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useLanguage } from '../../i18n'
import { useService } from '../../context/ServiceContext'
import * as spApi from '../../lib/serviceProjectsApi'
import HunterDrawing2D from './HunterDrawing2D'
import { KaspiCard } from '@gp/shared/ui/KaspiUI'

export default function HunterProjectDetails() {
  const { id } = useParams()
  const { t } = useLanguage()
  const { isDemoMode } = useService()
  const [bundle, setBundle] = useState(null)

  useEffect(() => {
    const load = isDemoMode ? spApi.demoGetProject : spApi.apiGetProject
    load(id).then(setBundle).catch(() => setBundle(null))
  }, [id, isDemoMode])

  if (!bundle?.hunter) return <p className="p-4">{t('loading')}</p>
  const { serviceProject: sp, hunter: h } = bundle

  return (
    <div className="px-4 py-4 space-y-4">
      <Link to="/services/hunter-irrigation" className="text-sm text-emerald-600 font-semibold">← {t('back')}</Link>
      <h1 className="text-xl font-bold">{t('hunter_project')} #{sp.id.slice(-6)}</h1>
      <p className="text-sm">{t('status')}: <strong>{sp.status}</strong></p>
      <HunterDrawing2D drawing={h.drawing2D} />
      <KaspiCard className="!p-4">
        <p className="font-bold text-lg text-emerald-700">{h.estimate.total.toLocaleString()} ₸</p>
        <p className="text-xs text-[var(--gp-text-muted)]">{h.area} м² газон · {h.zones} зон · {h.sprinklers?.length || 0} форсунок</p>
      </KaspiCard>
      <KaspiCard className="!p-4 space-y-2">
        <h2 className="font-bold">AI-проверка</h2>
        {(h.aiChecks || []).map((c) => (
          <p key={c.code} className={`text-sm ${c.level === 'error' ? 'text-red-600' : c.level === 'warning' ? 'text-amber-700' : 'text-emerald-700'}`}>
            {c.message}
          </p>
        ))}
      </KaspiCard>
      <KaspiCard className="!p-4">
        <h2 className="font-bold mb-2">Материалы и GP Market</h2>
        <ul className="space-y-2 text-sm">
          {(h.materials || h.estimate?.lines || []).filter((l) => l.type !== 'labor').map((l, i) => (
            <li key={i} className="border-b border-[var(--gp-border)] pb-2 last:border-0">
              <div className="flex justify-between gap-2">
                <span>{l.name} ×{l.qty}</span>
                <span>{Number(l.market?.price || l.price || 0).toLocaleString()} ₸</span>
              </div>
              {l.market && (
                <p className={`text-[11px] ${l.market.status === 'available' ? 'text-emerald-600' : 'text-amber-700'}`}>
                  {l.market.message || l.market.status}{l.market.storeName ? ` · ${l.market.storeName}` : ''}
                </p>
              )}
            </li>
          ))}
        </ul>
      </KaspiCard>
    </div>
  )
}
