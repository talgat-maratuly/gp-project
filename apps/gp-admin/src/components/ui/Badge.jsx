const COLORS = {
  sky: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
  violet: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  amber: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  emerald: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  slate: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  red: 'bg-red-500/20 text-red-300 border-red-500/30',
}

export default function Badge({ children, color = 'slate' }) {
  return (
    <span className={`inline-flex rounded-lg border px-2 py-0.5 text-xs font-semibold ${COLORS[color] || COLORS.slate}`}>
      {children}
    </span>
  )
}
