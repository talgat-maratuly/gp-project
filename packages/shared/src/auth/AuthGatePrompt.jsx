import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { buildLoginTo, locationReturnPath, saveAuthReturnPath } from './redirect.js'

/**
 * Состояние «нужен вход» на защищённой странице (без жёсткого редиректа).
 */
export function AuthGatePrompt({
  appId,
  loginPath = '/login',
  title,
  hint,
  loginLabel = 'Войти',
  className = '',
  children,
}) {
  const location = useLocation()
  const returnPath = locationReturnPath(location)

  useEffect(() => {
    if (appId) saveAuthReturnPath(appId, returnPath)
  }, [appId, returnPath])

  return (
    <div className={`text-center space-y-3 ${className}`}>
      {title && <p className="text-[var(--gp-text,#f8fafc)] font-semibold">{title}</p>}
      {hint && <p className="text-sm text-[var(--gp-text-muted,#94a3b8)]">{hint}</p>}
      <Link
        to={buildLoginTo(loginPath, returnPath)}
        className="inline-block w-full max-w-xs mx-auto"
      >
        {children || (
          <span className="block w-full py-3 px-4 rounded-xl bg-emerald-600 text-white font-bold text-sm text-center">
            {loginLabel}
          </span>
        )}
      </Link>
    </div>
  )
}
