const COLORS = {
  sky: 'bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-500/20 dark:text-sky-300 dark:border-sky-500/30',
  violet: 'bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-500/20 dark:text-violet-300 dark:border-violet-500/30',
  amber: 'bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30',
  emerald: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30',
  slate: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-500/20 dark:text-slate-300 dark:border-slate-500/30',
  red: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/30',
  orange: 'bg-orange-100 text-orange-900 border-orange-200 dark:bg-orange-500/20 dark:text-orange-300 dark:border-orange-500/30',
}

export default function Badge({ children, color = 'slate' }) {
  return (
    <span className={`inline-flex rounded-lg border px-2 py-0.5 text-xs font-semibold ${COLORS[color] || COLORS.slate}`}>
      {children}
    </span>
  )
}
