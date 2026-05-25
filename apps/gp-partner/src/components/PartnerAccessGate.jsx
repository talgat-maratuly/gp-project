import { Link, Outlet } from 'react-router-dom'
import { isDemoMode } from '@gp/shared/demo'
import { usePartner } from '../context/PartnerContext'

const MESSAGES = {
  PENDING_REVIEW: {
    title: 'Заявка на проверке',
    text: 'Ваша заявка ожидает проверки администратором GP.',
  },
  NEEDS_REVISION: {
    title: 'Нужна доработка',
    text: 'Заявка возвращена на доработку.',
    action: { to: '/apply', label: 'Исправить и отправить повторно' },
  },
  REJECTED: {
    title: 'Заявка отклонена',
    text: 'К сожалению, заявка отклонена.',
  },
  SUSPENDED: {
    title: 'Аккаунт заблокирован',
    text: 'Ваш аккаунт временно заблокирован. Свяжитесь с GP Admin.',
  },
  DRAFT: {
    title: 'Завершите заявку',
    text: 'Отправьте анкету партнёра на модерацию.',
    action: { to: '/apply', label: 'Заполнить заявку' },
  },
}

export default function PartnerAccessGate() {
  const { user } = usePartner()
  const status = user?.partnerStatus || (isDemoMode() ? 'APPROVED' : 'DRAFT')

  if (!user || status === 'APPROVED') {
    return <Outlet />
  }

  const cfg = MESSAGES[status] || MESSAGES.DRAFT

  return (
    <div className="rounded-2xl border border-[var(--gp-border)] bg-[var(--gp-surface)] p-6 text-center space-y-4">
      <h2 className="text-lg font-bold text-[var(--gp-text)]">{cfg.title}</h2>
      <p className="text-sm text-[var(--gp-text-muted)]">{cfg.text}</p>
      {status === 'REJECTED' && user.rejectionReason && (
        <p className="text-sm text-red-400 bg-red-500/10 rounded-xl p-3">{user.rejectionReason}</p>
      )}
      {status === 'NEEDS_REVISION' && user.revisionComment && (
        <p className="text-sm text-amber-500 bg-amber-500/10 rounded-xl p-3 text-left">{user.revisionComment}</p>
      )}
      {cfg.action && (
        <Link to={cfg.action.to} className="inline-block px-5 py-3 rounded-xl gp-gradient-kaspi text-white font-bold text-sm">
          {cfg.action.label}
        </Link>
      )}
      <Link to="/profile" className="block text-sm text-[var(--gp-text-muted)] underline">Профиль</Link>
    </div>
  )
}
