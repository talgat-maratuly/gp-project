import { AppErrorBoundary } from '@gp/shared/ui/AppErrorBoundary'
import { useLanguage } from '../i18n'

export default function RootErrorBoundary({ children }) {
  const { t } = useLanguage()
  return (
    <AppErrorBoundary
      homeHref="/"
      labels={{
        title: t('app_error_title'),
        hint: t('app_error_hint'),
        retry: t('app_error_retry'),
        home: t('app_error_home'),
      }}
    >
      {children}
    </AppErrorBoundary>
  )
}
