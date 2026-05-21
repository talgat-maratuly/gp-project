import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../i18n/LanguageContext'
import LoginPage from '../pages/LoginPage'
import Shell from '../layout/Shell'
import DashboardPage from '../pages/DashboardPage'
import FranchisesPage from '../pages/FranchisesPage'
import ClientsPage from '../pages/ClientsPage'
import PartnersPage from '../pages/PartnersPage'
import OrdersPage from '../pages/OrdersPage'
import ServicesPage from '../pages/ServicesPage'
import DiscountsPage from '../pages/DiscountsPage'
import FinancePage from '../pages/FinancePage'
import ReviewsPage from '../pages/ReviewsPage'
import SettingsPage from '../pages/SettingsPage'

export default function App() {
  const { user, ready } = useAuth()
  const { t } = useLanguage()

  if (!ready) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500 text-sm">{t('loading')}</div>
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route element={<Shell />}>
        <Route index element={<DashboardPage />} />
        <Route path="franchises" element={<FranchisesPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="clients" element={<ClientsPage />} />
        <Route path="partners" element={<PartnersPage />} />
        <Route path="services" element={<ServicesPage />} />
        <Route path="discounts" element={<DiscountsPage />} />
        <Route path="finance" element={<FinancePage />} />
        <Route path="reviews" element={<ReviewsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
