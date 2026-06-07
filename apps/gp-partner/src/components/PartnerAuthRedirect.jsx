import { Navigate, useLocation } from 'react-router-dom'
import { buildLoginTo, locationReturnPath, saveAuthReturnPath } from '@gp/shared/auth/redirect'

export default function PartnerAuthRedirect({ loginPath = '/login' }) {
  const location = useLocation()
  const returnPath = locationReturnPath(location)
  saveAuthReturnPath('partner', returnPath)
  return <Navigate to={buildLoginTo(loginPath, returnPath)} replace />
}
