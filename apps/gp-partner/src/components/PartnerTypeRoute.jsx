import { Navigate, Outlet, useLocation } from 'react-router-dom'
import {
  getPartnerAccess,
  isPathAllowedForPartner,
  pathRequiresService,
  pathRequiresShop,
} from '@gp/shared/constants'
import { isDemoMode } from '@gp/shared/demo'
import { usePartner } from '../context/PartnerContext'
import AccessDenied from './AccessDenied'

/** Блокирует маршруты по partnerRole (не только скрывает кнопки) */
export function PartnerTypeRoute({ shopOnly = false, serviceOnly = false }) {
  const { user } = usePartner()
  const { pathname } = useLocation()
  const access = getPartnerAccess(user || {}, { isDemoMode: isDemoMode() })

  if (shopOnly && !access.shop) {
    return (
      <AccessDenied
        message="Раздел магазина доступен только партнёрам типа «Магазин». Специалисты работают с услугами и заказами."
      />
    )
  }
  if (serviceOnly && !access.service) {
    return (
      <AccessDenied
        message="Раздел услуг и сервисных заказов недоступен для магазинов. Управляйте товарами в «Мой магазин»."
      />
    )
  }

  if (pathRequiresShop(pathname) && !access.shop) {
    return (
      <AccessDenied
        message="У вашего профиля нет доступа к магазину. Обратитесь в поддержку GP, если нужен смешанный профиль."
      />
    )
  }
  if (pathRequiresService(pathname) && !access.service) {
    return (
      <AccessDenied
        message="Сервисные заказы и услуги недоступны для вашего типа партнёра."
      />
    )
  }

  if (!isPathAllowedForPartner(pathname, user, { isDemoMode: isDemoMode() })) {
    return <Navigate to="/profile" replace />
  }
  return <Outlet />
}
