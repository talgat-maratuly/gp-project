import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, LogOut, ShoppingBag, Users, Wrench } from 'lucide-react'
import { useAdmin } from '../context/AdminContext'

const linkClass = ({ isActive }) =>
  `flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${
    isActive ? 'bg-sky-500/15 text-sky-300' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
  }`

export default function Shell() {
  const { user, logout } = useAdmin()

  return (
    <div className="min-h-screen flex">
      <aside className="w-56 shrink-0 border-r border-white/10 bg-slate-900/50 p-4 flex flex-col">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-wider text-slate-500">GP</p>
          <p className="font-bold text-lg text-white">Admin</p>
        </div>
        <nav className="flex flex-col gap-1 flex-1">
          <NavLink to="/" end className={linkClass}>
            <LayoutDashboard className="w-4 h-4" /> Обзор
          </NavLink>
          <NavLink to="/clients" className={linkClass}>
            <Users className="w-4 h-4" /> Клиенты
          </NavLink>
          <NavLink to="/partners" className={linkClass}>
            <Wrench className="w-4 h-4" /> Партнёры
          </NavLink>
          <NavLink to="/orders" className={linkClass}>
            <ShoppingBag className="w-4 h-4" /> Заказы
          </NavLink>
          <NavLink to="/commissions" className={linkClass}>
            <span className="w-4 h-4 text-center text-xs font-bold">₸</span> Комиссии
          </NavLink>
        </nav>
        <div className="mt-6 pt-4 border-t border-white/10 text-xs text-slate-500">
          <p className="text-slate-300 font-medium truncate">{user?.name}</p>
          <p className="truncate">{user?.email}</p>
          <button
            type="button"
            onClick={() => logout()}
            className="mt-3 flex items-center gap-2 text-rose-400 hover:text-rose-300 text-sm font-medium"
          >
            <LogOut className="w-4 h-4" /> Выйти
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  )
}
