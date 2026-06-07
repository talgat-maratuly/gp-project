import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { LanguageProvider } from '@gp/shared/i18n'
import { PartnerProvider } from './context/PartnerContext'
import App from './app/App'
import RootErrorBoundary from './components/RootErrorBoundary'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <RootErrorBoundary>
          <PartnerProvider>
            <App />
          </PartnerProvider>
        </RootErrorBoundary>
      </LanguageProvider>
    </BrowserRouter>
  </StrictMode>,
)
