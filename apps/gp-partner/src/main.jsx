import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { PartnerProvider } from './context/PartnerContext'
import App from './app/App'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <PartnerProvider>
        <App />
      </PartnerProvider>
    </BrowserRouter>
  </StrictMode>,
)
