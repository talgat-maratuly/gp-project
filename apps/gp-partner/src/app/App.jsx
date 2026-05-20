import { Navigate, Route, Routes } from 'react-router-dom'
import PartnerShell from '../components/PartnerShell'
import AuthPage from '../pages/AuthPage'
import DashboardPage from '../pages/DashboardPage'
import OrdersPage from '../pages/OrdersPage'
import MapPage from '../pages/MapPage'
import BalancePage from '../pages/BalancePage'
import PartnerShopPage from '../pages/PartnerShopPage'
import AddProductPage from '../pages/AddProductPage'
import ProfilePage from '../pages/ProfilePage'

export default function App() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage initialMode="register" />} />
      <Route path="/register" element={<AuthPage initialMode="register" />} />
      <Route path="/login" element={<AuthPage initialMode="login" />} />
      <Route element={<PartnerShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="shop" element={<PartnerShopPage />} />
        <Route path="catalog/add" element={<AddProductPage />} />
        <Route path="map" element={<MapPage />} />
        <Route path="balance" element={<BalancePage />} />
        <Route path="profile" element={<ProfilePage />} />
        {/* legacy redirects */}
        <Route path="orders/new" element={<Navigate to="/orders" replace />} />
        <Route path="orders/*" element={<Navigate to="/orders" replace />} />
        <Route path="payouts" element={<Navigate to="/balance" replace />} />
        <Route path="analytics" element={<Navigate to="/profile" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/auth" replace />} />
    </Routes>
  )
}
