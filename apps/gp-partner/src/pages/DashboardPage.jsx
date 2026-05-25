import { isShopPartner } from '@gp/shared/constants'
import { isDemoMode } from '@gp/shared/demo'
import { usePartner } from '../context/PartnerContext'
import ShopDashboardPage from './ShopDashboardPage'
import ServiceDashboardPage from './ServiceDashboardPage'

export default function DashboardPage() {
  const { user } = usePartner()
  const type = user?.partnerType || (isDemoMode() ? 'LAWN_MOWING' : null)
  if (isShopPartner(type)) return <ShopDashboardPage />
  return <ServiceDashboardPage />
}
