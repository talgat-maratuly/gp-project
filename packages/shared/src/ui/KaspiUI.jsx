import { Check, ChevronLeft } from 'lucide-react'

export function KaspiCard({ children, className = '', onClick }) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`gp-card-kaspi w-full text-left p-4 ${onClick ? 'active:scale-[0.99]' : ''} ${className}`}
    >
      {children}
    </Tag>
  )
}

export function KaspiButton({ children, variant = 'primary', className = '', size = 'lg', type = 'button', ...props }) {
  const base = 'w-full inline-flex items-center justify-center gap-2 font-bold transition disabled:opacity-50'
  const sizes = { md: 'py-3 px-5 text-sm rounded-2xl', lg: 'py-4 px-6 text-base rounded-2xl' }
  const variants = {
    primary: 'gp-btn-primary',
    secondary: 'bg-[var(--gp-surface)] text-[var(--gp-text)] border border-[var(--gp-border)] shadow-sm',
    ghost: 'text-[var(--gp-text-muted)]',
  }
  return (
    <button type={type} className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  )
}

export function StepBar({ step, total = 3 }) {
  return (
    <div className="flex gap-1.5 mb-6" aria-label={`Шаг ${step} из ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
            i < step ? 'gp-gradient-kaspi' : 'bg-[var(--gp-border)]'
          }`}
        />
      ))}
    </div>
  )
}

export function PageHeader({ title, subtitle, onBack }) {
  return (
    <div className="flex items-start gap-3 mb-5 gp-animate-in">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="w-11 h-11 rounded-2xl bg-[var(--gp-surface)] border border-[var(--gp-border)] flex items-center justify-center shrink-0 shadow-sm"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="text-xl font-extrabold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-[var(--gp-text-muted)] mt-0.5">{subtitle}</p>}
      </div>
    </div>
  )
}

export function StatusTimeline({ steps, currentIndex }) {
  return (
    <ol className="space-y-0">
      {steps.map((s, i) => {
        const done = i < currentIndex
        const active = i === currentIndex
        return (
          <li key={s.id} className="flex gap-3 relative pb-5 last:pb-0">
            {i < steps.length - 1 && (
              <span
                className={`absolute left-[15px] top-8 w-0.5 h-[calc(100%-1rem)] ${
                  done ? 'gp-gradient-kaspi' : 'bg-[var(--gp-border)]'
                }`}
              />
            )}
            <span
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 ${
                done ? 'gp-gradient-kaspi text-white' : active ? 'ring-2 ring-emerald-500 bg-[var(--gp-surface)]' : 'bg-[var(--gp-surface-2)] text-[var(--gp-text-muted)]'
              }`}
            >
              {done ? <Check className="w-4 h-4" /> : <span className="text-xs font-bold">{i + 1}</span>}
            </span>
            <div className="pt-0.5">
              <p className={`text-sm font-semibold ${active ? 'text-[var(--gp-text)]' : 'text-[var(--gp-text-muted)]'}`}>
                {s.label}
              </p>
              {s.hint && <p className="text-xs text-[var(--gp-text-muted)] mt-0.5">{s.hint}</p>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

export function SkeletonBlock({ className = 'h-20' }) {
  return <div className={`gp-skeleton ${className}`} />
}

export function Chip({ children, active, onClick, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2.5 rounded-2xl text-sm font-semibold whitespace-nowrap transition ${className} ${
        active
          ? 'gp-gradient-kaspi text-white shadow-md'
          : 'bg-[var(--gp-surface)] text-[var(--gp-text-muted)] border border-[var(--gp-border)]'
      }`}
    >
      {children}
    </button>
  )
}
