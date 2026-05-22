import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { LanguageProvider } from '@gp/shared/i18n'
import { ServiceProvider } from './context/ServiceContext'
import App from './app/App'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <ServiceProvider>
          <App />
        </ServiceProvider>
      </LanguageProvider>
    </BrowserRouter>
  </StrictMode>,
)
