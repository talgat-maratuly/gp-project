import { Link, Outlet } from 'react-router-dom'
import { isDemoMode } from '@gp/shared/demo'
import { useLanguage } from '@gp/shared/i18n'
import { usePartner } from '../context/PartnerContext'

const STATUS_CFG = {
  PENDING_REVIEW: { titleKey: 'gatePendingTitle', textKey: 'gatePendingText' },
  NEEDS_REVISION: {
    titleKey: 'gateRevisionTitle',
    textKey: 'gateRevisionText',
    action: { to: '/apply/specialist', labelKey: 'gateRevisionAction' },
  },
  REJECTED: { titleKey: 'gateRejectedTitle', textKey: 'gateRejectedText' },
  SUSPENDED: { titleKey: 'gateSuspendedTitle', textKey: 'gateSuspendedText' },
  DRAFT: {
    titleKey: 'gateDraftTitle',
    textKey: 'gateDraftText',
    action: { to: '/apply/specialist', labelKey: 'gateDraftAction' },
  },
}

export default function PartnerAccessGate() {
  const { t } = useLanguage()
  const { user } = usePartner()
  const status = user?.partnerStatus || (isDemoMode() ? 'APPROVED' : 'DRAFT')

  if (!user || status === 'APPROVED') {
    return <Outlet />
  }

  const isShop = user?.partnerRole === 'SHOP'
  const base = STATUS_CFG[status] || STATUS_CFG.DRAFT
  const cfg = { ...base }
  if (status === 'DRAFT' && isShop) {
    cfg.action = { to: '/apply', labelKey: 'gateShopDraftAction' }
  }

  return (
    <div className="rounded-2xl border border-[var(--gp-border)] bg-[var(--gp-surface)] p-6 text-center space-y-4">
      <h2 className="text-lg font-bold text-[var(--gp-text)]">{t(cfg.titleKey)}</h2>
      <p className="text-sm text-[var(--gp-text-muted)]">{t(cfg.textKey)}</p>
      {status === 'REJECTED' && user.rejectionReason && (
        <p className="text-sm text-red-400 bg-red-500/10 rounded-xl p-3">{user.rejectionReason}</p>
      )}
      {status === 'NEEDS_REVISION' && user.revisionComment && (
        <p className="text-sm text-amber-500 bg-amber-500/10 rounded-xl p-3 text-left">{user.revisionComment}</p>
      )}
      {cfg.action && (
        <Link to={cfg.action.to} className="inline-block px-5 py-3 rounded-xl gp-gradient-kaspi text-white font-bold text-sm">
          {t(cfg.action.labelKey)}
        </Link>
      )}
      <Link to="/profile" className="block text-sm text-[var(--gp-text-muted)] underline">{t('gateProfileLink')}</Link>
    </div>
  )
}
