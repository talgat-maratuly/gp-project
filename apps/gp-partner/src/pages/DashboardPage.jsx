import { getPartnerAccess } from '@gp/shared/constants'
import { isDemoMode } from '@gp/shared/demo'
import { Navigate } from 'react-router-dom'
import { usePartner } from '../context/PartnerContext'
import ShopDashboardPage from './ShopDashboardPage'
import ServiceDashboardPage from './ServiceDashboardPage'

export default function DashboardPage() {
  const { user } = usePartner()
  const access = getPartnerAccess(user || {}, { isDemoMode: isDemoMode() })
  if (access.nursery) return <Navigate to="/nursery/requests" replace />
  if (access.delivery) return <Navigate to="/delivery/orders" replace />
  if (access.shop && !access.service) return <ShopDashboardPage />
  return <ServiceDashboardPage />
}
