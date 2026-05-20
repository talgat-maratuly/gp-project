import { useState } from 'react'
import { ArrowDownCircle, ArrowUpCircle, Wallet } from 'lucide-react'
import { usePartner } from '../context/PartnerContext'
import { formatPrice } from '@gp/shared/utils'
import { calcSepticCommission } from '@gp/shared/constants'

const TOPUPS = [5000, 10000, 25000, 50000]

export default function BalancePage() {
  const { user, transactions, topupBalance } = usePartner()
  const [loading, setLoading] = useState(false)

  const topup = async (amount) => {
    setLoading(true)
    try {
      await topupBalance(amount)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-white mb-4">Баланс</h1>

      <div className="partner-card p-6 mb-4 partner-gradient relative overflow-hidden">
        <Wallet className="w-8 h-8 text-white/80 mb-2" />
        <p className="text-sm text-white/80">Текущий баланс</p>
        <p className="text-4xl font-extrabold text-white">{formatPrice(user?.balance ?? 0)}</p>
        <p className="text-xs text-white/70 mt-2">Списание комиссии GP после выполненных заказов</p>
      </div>

      <div className="partner-card p-4 mb-4 text-sm text-slate-400 space-y-2">
        <p className="font-semibold text-white">Комиссия GP</p>
        <ul className="space-y-1 text-xs">
          <li>Септик 3–4 м³ — {formatPrice(calcSepticCommission(4))}</li>
          <li>Септик 5–6 м³ — {formatPrice(calcSepticCommission(6))}</li>
          <li>Септик 7–10 м³ — {formatPrice(calcSepticCommission(10))}</li>
          <li>Газон (все виды) — {formatPrice(1000)}</li>
          <li>Консультация автополив / фильтр — {formatPrice(1000)}</li>
        </ul>
        <p className="text-[10px] text-slate-600 pt-1">Оплата клиента идёт вам напрямую (Kaspi / наличные). GP не держит деньги клиента.</p>
      </div>

      <p className="text-sm font-semibold text-slate-300 mb-2">Пополнить баланс</p>
      <div className="grid grid-cols-2 gap-2 mb-6">
        {TOPUPS.map((a) => (
          <button key={a} type="button" disabled={loading} onClick={() => topup(a)} className="py-3 rounded-xl bg-white/5 border border-white/10 text-sm font-semibold hover:border-emerald-500/40 disabled:opacity-50">
            +{formatPrice(a)}
          </button>
        ))}
      </div>

      <p className="text-sm font-semibold text-slate-300 mb-2">История</p>
      <ul className="space-y-2">
        {transactions.map((t) => (
          <li key={t.id} className="partner-card p-3 flex items-center gap-3 text-sm">
            {t.amount > 0 ? (
              <ArrowUpCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <ArrowDownCircle className="w-5 h-5 text-red-400 shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-slate-200 truncate">{t.note}</p>
              <p className="text-[10px] text-slate-500">{new Date(t.createdAt).toLocaleString('ru-KZ')}</p>
            </div>
            <span className={`font-bold shrink-0 ${t.amount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {t.amount > 0 ? '+' : ''}{formatPrice(Math.abs(t.amount))}
            </span>
          </li>
        ))}
        {!transactions.length && <p className="text-slate-500 text-sm">Пока нет операций</p>}
      </ul>
    </div>
  )
}
