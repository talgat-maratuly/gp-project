import { useStore } from '../context/StoreContext'
import { useAccess } from '../context/AccessContext'
import { useLanguage } from '../i18n/LanguageContext'
import Badge from '../components/ui/Badge'

const STATUS_COLORS = { new: 'sky', resolved: 'emerald', attention: 'amber' }
const REVIEW_STATUS_KEYS = ['new', 'resolved', 'attention']

export default function ReviewsPage() {
  const { scoped } = useAccess()
  const { updateReviewStatus } = useStore()
  const { t } = useLanguage()

  return (
    <div className="space-y-4">
      {scoped.reviews.map((r) => (
        <div key={r.id} className="admin-card">
          <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
            <div>
              <p className="font-semibold">{r.clientName}</p>
              <p className="text-xs text-slate-500">{t('reviewOrder')} {r.orderId} · {r.partnerName} · ★ {r.rating}</p>
            </div>
            <Badge color={STATUS_COLORS[r.status]}>{t(`reviewStatus_${r.status}`)}</Badge>
          </div>
          <p className="text-sm text-slate-300 mb-3">{r.text}</p>
          <div className="flex flex-wrap gap-2">
            {REVIEW_STATUS_KEYS.map((st) => (
              <button key={st} type="button" className={`px-3 py-1.5 rounded-lg text-xs border ${r.status === st ? 'border-sky-500 bg-sky-500/20' : 'border-white/10'}`} onClick={() => updateReviewStatus(r.id, st)}>
                {t(`reviewStatus_${st}`)}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
