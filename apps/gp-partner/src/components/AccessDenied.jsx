import { Link } from 'react-router-dom'
import { ShieldOff } from 'lucide-react'

export default function AccessDenied({ title = 'Нет доступа', message, backTo = '/profile' }) {
  return (
    <div className="gp-animate-in flex flex-col items-center text-center py-10 px-4">
      <ShieldOff className="w-12 h-12 text-amber-500 mb-4" aria-hidden />
      <h1 className="text-lg font-bold text-[var(--gp-text)] mb-2">{title}</h1>
      <p className="text-sm text-[var(--gp-text-muted)] max-w-sm mb-6 leading-relaxed">{message}</p>
      <Link
        to={backTo}
        className="px-5 py-3 rounded-xl gp-gradient-kaspi text-white text-sm font-bold shadow-md"
      >
        В профиль
      </Link>
    </div>
  )
}
