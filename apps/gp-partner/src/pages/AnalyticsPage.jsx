import { BarChart3 } from 'lucide-react'
import { formatPrice } from '@gp/shared/utils'

export default function AnalyticsPage() {
  const bars = [40, 65, 45, 80, 55, 90, 70]
  return (
    <div>
      <h1 className="text-xl font-bold mb-4 flex items-center gap-2"><BarChart3 /> Аналитика</h1>
      <div className="partner-card p-5 mb-4">
        <p className="text-slate-400 text-sm">Выручка за неделю</p>
        <p className="text-2xl font-bold text-emerald-400">{formatPrice(342000)}</p>
      </div>
      <div className="partner-card p-4 flex items-end gap-2 h-40">
        {bars.map((h, i) => (
          <div key={i} className="flex-1 partner-gradient rounded-t-lg opacity-80" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  )
}
