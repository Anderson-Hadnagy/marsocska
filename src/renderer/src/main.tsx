import './assets/main_window.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

// 2. We securely attach the window controls here to bypass Electron's security blocks
document.getElementById('btn-minimize')?.addEventListener('click', () => {
  // We use (window as any) so TypeScript doesn't panic about custom APIs
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