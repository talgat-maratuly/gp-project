import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { StoreProvider } from './context/StoreContext'
import { LanguageProvider } from '@gp/shared/i18n'
import { AccessProvider } from './context/AccessContext'
import { AdminToastProvider } from './context/AdminToastContext'
import App from './app/App'
import RootErrorBoundary from './components/RootErrorBoundary'
import { initAdminTheme } from './hooks/useTheme'
import './index.css'

initAdminTheme()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <RootErrorBoundary>
          <AuthProvider>
            <StoreProvider>
              <AccessProvider>
                <AdminToastProvider>
                  <App />
                </AdminToastProvider>
              </AccessProvider>
            </StoreProvider>
          </AuthProvider>
        </RootErrorBoundary>
      </LanguageProvider>
    </BrowserRouter>
  </StrictMode>,
)
