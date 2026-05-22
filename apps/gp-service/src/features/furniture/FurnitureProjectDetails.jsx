import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useLanguage } from '../../i18n'
import { useService } from '../../context/ServiceContext'
import * as spApi from '../../lib/serviceProjectsApi'
import FurnitureDrawing2D from './FurnitureDrawing2D'
import { KaspiCard } from '@gp/shared/ui/KaspiUI'

export default function FurnitureProjectDetails() {
  const { id } = useParams()
  const { t } = useLanguage()
  const { isDemoMode } = useService()
  const [bundle, setBundle] = useState(null)

  useEffect(() => {
    if (isDemoMode) spApi.demoGetProject(id).then(setBundle)
  }, [id, isDemoMode])

  if (!bundle?.furniture) return <p className="p-4">{t('loading')}</p>
  const { serviceProject: sp, furniture: f } = bundle

  return (
    <div className="px-4 py-4 space-y-4">
      <Link to="/services/furniture" className="text-sm font-semibold text-slate-700">← {t('back')}</Link>
      <h1 className="text-xl font-bold">{t('furniture_project')} #{sp.id.slice(-6)}</h1>
      <p className="text-sm">{t('status')}: {sp.status}</p>
      <FurnitureDrawing2D drawing={f.drawing2D} />
      <KaspiCard className="!p-4">
        <p className="font-bold text-lg">{f.estimate.total.toLocaleString()} ₸</p>
      </KaspiCard>
    </div>
  )
}
