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
import HunterServicePage from '../features/hunter-irrigation/HunterServicePage'
import HunterProjectWizard from '../features/hunter-irrigation/HunterProjectWizard'
import HunterProjectDetails from '../features/hunter-irrigation/HunterProjectDetails'
import FurnitureServicePage from '../features/furniture/FurnitureServicePage'
import FurnitureProjectWizard from '../features/furniture/FurnitureProjectWizard'
import FurnitureProjectDetails from '../features/furniture/FurnitureProjectDetails'
import ClientAuthPage from '../features/auth/ClientAuthPage'
import QrPublicPage from '../features/qr/QrPublicPage'
import { ForgotPasswordScreen, ResetPasswordScreen } from '@gp/shared/auth/passwordRecovery'

export default function App() {
  return (
    <Routes>
      <Route path="/qr/:qrCode" element={<QrPublicPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordScreen loginPath="/login" resetPath="/reset-password" />} />
      <Route path="/reset-password" element={<ResetPasswordScreen loginPath="/login" />} />
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
        <Route path="services/hunter-irrigation" element={<HunterServicePage />} />
        <Route path="services/hunter-irrigation/new" element={<HunterProjectWizard />} />
        <Route path="services/hunter-irrigation/:id" element={<HunterProjectDetails />} />
        <Route path="services/furniture" element={<FurnitureServicePage />} />
        <Route path="services/furniture/new" element={<FurnitureProjectWizard />} />
        <Route path="services/furniture/:id" element={<FurnitureProjectDetails />} />
        <Route path="market/category/:categoryId" element={<Navigate to="/shop/catalog/:categoryId" replace />} />
        <Route path="services/irrigation-install" element={<Navigate to="/services/irrigation-tuning" replace />} />
        <Route path="services/water-filter-install" element={<Navigate to="/services/filter-install" replace />} />
        <Route path="services/water-filter-cartridge" element={<Navigate to="/services/filter-cartridge" replace />} />
        <Route path="services/:serviceId" element={<ServiceOrderPage />} />
        <Route path="services/qr-order" element={<Navigate to="/orders" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
