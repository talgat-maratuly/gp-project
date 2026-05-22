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
        <p className="text-xs text-[var(--gp-text-muted)]">{h.area} м² · {h.zones} зон</p>
      </KaspiCard>
    </div>
  )
}
