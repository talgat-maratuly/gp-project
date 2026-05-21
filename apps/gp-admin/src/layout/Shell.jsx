import { useState } from 'react'
import { Outlet, useLocation, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { canAccess, PAGE_TITLE_KEYS } from '../lib/permissions'
import { useLanguage } from '../i18n/LanguageContext'
import Sidebar from './Sidebar'
import Header from './Header'

export default function Shell() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  if (!canAccess(user.role, location.pathname)) {
    return <Navigate to="/" replace />
  }

  const titleKey = PAGE_TITLE_KEYS[location.pathname]
  const title = titleKey ? t(titleKey) : t('appName')

  return (
    <div className="min-h-screen flex">
      <Sidebar role={user.role} open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
        <Header title={title} onMenuClick={() => setMenuOpen(true)} />
        <main className="flex-1 p-4 lg:p-6 overflow-x-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
