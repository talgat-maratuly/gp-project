import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ServiceProvider } from './context/ServiceContext'
import App from './app/App'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ServiceProvider>
        <App />
      </ServiceProvider>
    </BrowserRouter>
  </StrictMode>,
)
