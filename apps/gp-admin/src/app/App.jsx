import { Navigate, Route, Routes } from 'react-router-dom'
import { useAdmin } from '../context/AdminContext'
import LoginPage from '../pages/LoginPage'
import Shell from '../layout/Shell'
import DashboardPage from '../pages/DashboardPage'
import ClientsPage from '../pages/ClientsPage'
import PartnersPage from '../pages/PartnersPage'
import OrdersPage from '../pages/OrdersPage'
import CommissionsPage from '../pages/CommissionsPage'

export default function App() {
  const { user, ready } = useAdmin()

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500 text-sm">
        Загрузка…
      </div>
    )
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
        <Route path="clients" element={<ClientsPage />} />
        <Route path="partners" element={<PartnersPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="commissions" element={<CommissionsPage />} />
      </Route>
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
