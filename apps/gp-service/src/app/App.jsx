import { Navigate, Route, Routes } from 'react-router-dom'
import AppShell from '../components/layout/AppShell'
import HomePage from '../features/home/HomePage'
import PartnerInfoPage from '../features/partner/PartnerInfoPage'
import ObjectsPage from '../features/objects/ObjectsPage'
import OrdersPage from '../features/orders/OrdersPage'
import FavoritesPage from '../features/favorites/FavoritesPage'
import AIConsultantPage from '../features/ai/AIConsultantPage'
import ProfilePage from '../features/profile/ProfilePage'
import CatalogPage from '../features/shop/CatalogPage'
import ProductPage from '../features/shop/ProductPage'
import CartPage from '../features/shop/CartPage'
import CheckoutFlow from '../features/shop/CheckoutFlow'
import ServicesPage from '../features/services/ServicesPage'
import ServiceOrderPage from '../features/services/ServiceOrderPage'
import ClientAuthPage from '../features/auth/ClientAuthPage'

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path="shop" element={<CatalogPage />} />
        <Route path="shop/catalog/:categoryId" element={<CatalogPage />} />
        <Route path="shop/product/:id" element={<ProductPage />} />
        <Route path="shop/cart" element={<CartPage />} />
        <Route path="shop/checkout" element={<CheckoutFlow />} />
        <Route path="objects" element={<ObjectsPage />} />
        <Route path="addresses" element={<Navigate to="/objects" replace />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="favorites" element={<FavoritesPage />} />
        <Route path="ai" element={<AIConsultantPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="login" element={<ClientAuthPage />} />
        <Route path="partner" element={<PartnerInfoPage />} />
        <Route path="services" element={<ServicesPage />} />
        <Route path="services/irrigation-install" element={<Navigate to="/services/irrigation-tuning" replace />} />
        <Route path="services/water-filter-install" element={<Navigate to="/services/filter-install" replace />} />
        <Route path="services/water-filter-cartridge" element={<Navigate to="/services/filter-cartridge" replace />} />
        <Route path="services/:serviceId" element={<ServiceOrderPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
