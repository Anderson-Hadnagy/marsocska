import './assets/main_window.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

document.getElementById('btn-minimize')?.addEventListener('click', () => {
  (window as any).api.minimize()
})

document.getElementById('btn-close')?.addEventListener('click', () => {
  (window as any).api.close()
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
