import { ClipboardList, Users, Briefcase, Wallet, CheckCircle, XCircle, Clock } from 'lucide-react'
import { useAccess } from '../context/AccessContext'
import { useLanguage } from '../i18n/LanguageContext'
import StatCard from '../components/ui/StatCard'
import { formatMoney } from '../lib/format'

export default function DashboardPage() {
  const { stats, isSuperAdmin, currentFranchise, franchiseList } = useAccess()
  const { t } = useLanguage()

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-400">
        {isSuperAdmin ? t('networkStats') : `${t('franchise')}: ${currentFranchise?.name || ''}`}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label={t('totalOrders')} value={stats.totalOrders} icon={ClipboardList} />
        <StatCard label={t('newOrders')} value={stats.newOrders} accent="sky" icon={Clock} />
        <StatCard label={t('inProgress')} value={stats.inProgress} accent="amber" icon={Briefcase} />
        <StatCard label={t('completedOrders')} value={stats.completed} accent="emerald" icon={CheckCircle} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label={t('cancelledOrders')} value={stats.cancelled} accent="violet" icon={XCircle} />
        <StatCard label={t('clients')} value={stats.clients} icon={Users} />
        <StatCard label={t('partners')} value={stats.partners} icon={Briefcase} />
        <StatCard label={t('turnover')} value={formatMoney(stats.turnover)} accent="emerald" icon={Wallet} />
      </div>
      <div className="admin-card">
        <h2 className="font-bold mb-2">{t('gpCommission')}</h2>
        <p className="text-3xl font-extrabold text-sky-300">{formatMoney(stats.gpCommission)}</p>
      </div>
      {isSuperAdmin && (
        <div className="admin-table-wrap overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t('franchiseName')}</th>
                <th>{t('city')}</th>
                <th>{t('clients')}</th>
                <th>{t('partners')}</th>
                <th>{t('orders')}</th>
                <th>{t('turnover')}</th>
              </tr>
            </thead>
            <tbody>
              {franchiseList.map((f) => (
                <tr key={f.id}>
                  <td>{f.name}</td>
                  <td>{f.city}</td>
                  <td>{f.stats.clients}</td>
                  <td>{f.stats.partners}</td>
                  <td>{f.stats.orders}</td>
                  <td>{formatMoney(f.stats.turnover)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
