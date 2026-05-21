export default function StatCard({ label, value, sub, icon: Icon, accent = 'sky' }) {
  const accents = {
    sky: 'from-sky-500/20 to-sky-600/5 border-sky-500/20',
    emerald: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/20',
    amber: 'from-amber-500/20 to-amber-600/5 border-amber-500/20',
    violet: 'from-violet-500/20 to-violet-600/5 border-violet-500/20',
  }
  return (
    <div className={`admin-card bg-gradient-to-br ${accents[accent] || accents.sky}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold mt-1 text-white">{value}</p>
          {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
        </div>
        {Icon && (
          <div className="p-2 rounded-xl bg-white/5 text-slate-300">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  )
}
