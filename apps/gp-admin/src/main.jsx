import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { StoreProvider } from './context/StoreContext'
import { LanguageProvider } from '@gp/shared/i18n'
import { AccessProvider } from './context/AccessContext'
import { AdminToastProvider } from './context/AdminToastContext'
import App from './app/App'
<<<<<<< HEAD
import RootErrorBoundary from './components/RootErrorBoundary'
=======
import { initAdminTheme } from './hooks/useTheme'
>>>>>>> 61b771f4cabb203f1a879564c1f97476256ecdb8
import './index.css'

initAdminTheme()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <LanguageProvider>
<<<<<<< HEAD
        <RootErrorBoundary>
          <AuthProvider>
            <StoreProvider>
              <AccessProvider>
                <App />
              </AccessProvider>
            </StoreProvider>
          </AuthProvider>
        </RootErrorBoundary>
=======
        <AuthProvider>
          <StoreProvider>
            <AccessProvider>
              <AdminToastProvider>
                <App />
              </AdminToastProvider>
            </AccessProvider>
          </StoreProvider>
        </AuthProvider>
>>>>>>> 61b771f4cabb203f1a879564c1f97476256ecdb8
      </LanguageProvider>
    </BrowserRouter>
  </StrictMode>,
)
