export default function StatCard({ label, value, sub, icon: Icon, accent = 'sky' }) {
  const accents = {
    sky: 'from-sky-500/15 to-sky-600/5 border-sky-500/25 dark:from-sky-500/20 dark:to-sky-600/5 dark:border-sky-500/20',
    emerald: 'from-emerald-500/15 to-emerald-600/5 border-emerald-500/25 dark:from-emerald-500/20 dark:to-emerald-600/5 dark:border-emerald-500/20',
    amber: 'from-amber-500/15 to-amber-600/5 border-amber-500/25 dark:from-amber-500/20 dark:to-amber-600/5 dark:border-amber-500/20',
    violet: 'from-violet-500/15 to-violet-600/5 border-violet-500/25 dark:from-violet-500/20 dark:to-violet-600/5 dark:border-violet-500/20',
  }
  return (
    <div className={`admin-card bg-gradient-to-br ${accents[accent] || accents.sky}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium admin-muted uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold mt-1 admin-heading">{value}</p>
          {sub && <p className="text-xs admin-muted mt-1">{sub}</p>}
        </div>
        {Icon && (
          <div className="p-2 rounded-xl admin-panel border" style={{ color: 'var(--gp-accent-text)' }}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  )
}
