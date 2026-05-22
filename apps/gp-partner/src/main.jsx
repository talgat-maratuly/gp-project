import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { LanguageProvider } from '@gp/shared/i18n'
import { PartnerProvider } from './context/PartnerContext'
import App from './app/App'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <PartnerProvider>
          <App />
        </PartnerProvider>
      </LanguageProvider>
    </BrowserRouter>
  </StrictMode>,
)
