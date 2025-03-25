import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ToastProvider } from './admin/components/ToastContext.jsx'

createRoot(document.getElementById('root')).render(
  <ToastProvider>
 <StrictMode>
    <App />
  </StrictMode>
  </ToastProvider>
 
)
