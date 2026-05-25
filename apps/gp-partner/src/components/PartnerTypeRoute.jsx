import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { isPathAllowedForPartner, isShopPartner } from '@gp/shared/constants'
import { isDemoMode } from '@gp/shared/demo'
import { usePartner } from '../context/PartnerContext'

/** Блокирует маршруты, не соответствующие partnerType */
export function PartnerTypeRoute({ shopOnly = false, serviceOnly = false }) {
  const { user } = usePartner()
  const { pathname } = useLocation()
  const type = user?.partnerType || (isDemoMode() ? 'LAWN_MOWING' : null)

  if (shopOnly && !isShopPartner(type)) {
    return <Navigate to="/" replace />
  }
  if (serviceOnly && isShopPartner(type)) {
    return <Navigate to="/" replace />
  }
  if (!isPathAllowedForPartner(pathname, type, { isDemoMode: isDemoMode() })) {
    return <Navigate to="/" replace />
  }
  return <Outlet />
}
