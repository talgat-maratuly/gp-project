import { useMemo, useState } from 'react'
import { useAccess } from '../context/AccessContext'
import { useLanguage } from '../i18n/LanguageContext'
import StatCard from '../components/ui/StatCard'
import { formatMoney } from '../lib/format'

export default function FinancePage() {
  const { scoped } = useAccess()
  const { t } = useLanguage()
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [partnerId, setPartnerId] = useState('')

  const filtered = useMemo(() => {
    return scoped.orders.filter((o) => {
      if (o.status !== 'completed') return false
      const d = o.scheduledAt?.slice(0, 10)
      if (dateFrom && d < dateFrom) return false
      if (dateTo && d > dateTo) return false
      if (partnerId && o.partnerId !== partnerId) return false
      return true
    })
  }, [scoped.orders, dateFrom, dateTo, partnerId])

  const ordersSum = filtered.reduce((s, o) => s + o.amount, 0)
  const gpIncome = filtered.reduce((s, o) => s + o.gpCommission, 0)
  const partnerPayouts = filtered.reduce((s, o) => s + Math.max(0, o.amount - o.gpCommission), 0)
  const debt = scoped.payouts?.filter((p) => p.status === 'pending').reduce((s, p) => s + p.amount, 0) ?? 0

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 admin-card">
        <label className="text-sm"><span className="text-slate-500 text-xs block">{t('dateFrom')}</span><input type="date" className="admin-input" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} /></label>
        <label className="text-sm"><span className="text-slate-500 text-xs block">{t('dateTo')}</span><input type="date" className="admin-input" value={dateTo} onChange={(e) => setDateTo(e.target.value)} /></label>
        <label className="text-sm flex-1 min-w-[200px]"><span className="text-slate-500 text-xs block">{t('partner')}</span>
          <select className="admin-input" value={partnerId} onChange={(e) => setPartnerId(e.target.value)}>
            <option value="">{t('all')}</option>
            {scoped.partners.map((p) => <option key={p.id} value={p.id}>{p.company || p.name}</option>)}
          </select>
        </label>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label={t('ordersSum')} value={formatMoney(ordersSum)} accent="sky" />
        <StatCard label={t('gpIncome')} value={formatMoney(gpIncome)} accent="emerald" />
        <StatCard label={t('partnerPayouts')} value={formatMoney(partnerPayouts)} accent="amber" />
        <StatCard label={t('debts')} value={formatMoney(debt)} accent="violet" />
      </div>
      <div className="admin-table-wrap overflow-x-auto">
        <table className="admin-table">
          <thead><tr><th>{t('order')}</th><th>{t('partner')}</th><th>{t('amount')}</th><th>GP</th><th>{t('toPartner')}</th></tr></thead>
          <tbody>
            {filtered.map((o) => (
              <tr key={o.id}>
                <td>{o.id}</td>
                <td>{o.partnerName || t('dash')}</td>
                <td>{formatMoney(o.amount)}</td>
                <td>{formatMoney(o.gpCommission)}</td>
                <td>{formatMoney(Math.max(0, o.amount - o.gpCommission))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
