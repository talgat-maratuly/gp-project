import { Navigate, useLocation } from 'react-router-dom'
import { buildLoginTo, locationReturnPath, saveAuthReturnPath } from '@gp/shared/auth/redirect'

/** Неавторизованный deep link → login с сохранением return URL */
export default function AuthReturnRedirect({ loginPath = '/login' }) {
  const location = useLocation()
  const returnPath = locationReturnPath(location)
  saveAuthReturnPath('admin', returnPath)
  return <Navigate to={buildLoginTo(loginPath, returnPath)} replace />
}
