import { Navigate, Route, Routes } from 'react-router-dom'
import PartnerShell from '../components/PartnerShell'
import { PartnerTypeRoute } from '../components/PartnerTypeRoute'
import AuthPage from '../pages/AuthPage'
import DashboardPage from '../pages/DashboardPage'
import OrdersPage from '../pages/OrdersPage'
import NewOrdersPage from '../pages/NewOrdersPage'
import ServiceProjectsOrdersPage from '../pages/ServiceProjectsOrdersPage'
import MapPage from '../pages/MapPage'
import BalancePage from '../pages/BalancePage'
import MyShopPage from '../pages/MyShopPage'
import PartnerCabinetPage from '../pages/PartnerCabinetPage'
import CabinetShopPage from '../pages/cabinet/CabinetShopPage'
import AddProductPage from '../pages/AddProductPage'
import ProfilePage from '../pages/ProfilePage'
import PartnerApplyPage from '../pages/PartnerApplyPage'
import PartnerAccessGate from '../components/PartnerAccessGate'
import QrOrdersPage from '../pages/QrOrdersPage'
import FurnitureExecutorOrdersPage from '../pages/FurnitureExecutorOrdersPage'
import ServiceSchedulePage from '../pages/ServiceSchedulePage'
import ServicePhotosPage from '../pages/ServicePhotosPage'

export default function App() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage initialMode="register" />} />
      <Route path="/register" element={<AuthPage initialMode="register" />} />
      <Route path="/login" element={<AuthPage initialMode="login" />} />
      <Route path="/cabinet" element={<PartnerCabinetPage />}>
        <Route element={<PartnerTypeRoute shopOnly />}>
          <Route index element={<CabinetShopPage />} />
          <Route path="products" element={<CabinetShopPage />} />
          <Route path="stock" element={<CabinetShopPage />} />
          <Route path="orders" element={<CabinetShopPage />} />
          <Route path="delivery" element={<CabinetShopPage />} />
          <Route path="finance" element={<CabinetShopPage />} />
          <Route path="settings" element={<CabinetShopPage />} />
        </Route>
      </Route>
      <Route element={<PartnerShell />}>
        <Route path="apply" element={<PartnerApplyPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route element={<PartnerAccessGate />}>
          <Route index element={<DashboardPage />} />
          <Route element={<PartnerTypeRoute shopOnly />}>
            <Route path="shop" element={<MyShopPage />} />
            <Route path="shop/stock" element={<MyShopPage />} />
            <Route path="shop/orders" element={<MyShopPage />} />
            <Route path="shop/settings" element={<MyShopPage />} />
            <Route path="catalog/add" element={<AddProductPage />} />
          </Route>
          <Route element={<PartnerTypeRoute serviceOnly />}>
            <Route path="orders/new" element={<NewOrdersPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="orders/qr" element={<QrOrdersPage />} />
            <Route path="orders/filter-replacement" element={<QrOrdersPage />} />
            <Route path="orders/equipment-service" element={<QrOrdersPage />} />
            <Route path="orders/hunter-irrigation" element={<ServiceProjectsOrdersPage type="hunter_irrigation" />} />
            <Route path="orders/furniture" element={<ServiceProjectsOrdersPage type="furniture" />} />
            <Route path="orders/furniture-manufacturing" element={<FurnitureExecutorOrdersPage />} />
            <Route path="orders/furniture-assembly" element={<FurnitureExecutorOrdersPage />} />
            <Route path="orders/furniture-repair" element={<FurnitureExecutorOrdersPage />} />
            <Route path="schedule" element={<ServiceSchedulePage />} />
            <Route path="photos" element={<ServicePhotosPage />} />
            <Route path="map" element={<MapPage />} />
            <Route path="balance" element={<BalancePage />} />
          </Route>
        </Route>
        <Route path="payouts" element={<Navigate to="/balance" replace />} />
        <Route path="analytics" element={<Navigate to="/profile" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/auth" replace />} />
    </Routes>
  )
}
