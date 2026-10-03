import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ToastProvider } from '@/components/Toaster'
import { AuthProvider } from '@/lib/auth'
import './index.css'
import App from './App'

const DEV_SW_RELOAD_KEY = 'finanzas_dev_sw_cleared'

async function clearDevServiceWorkers(): Promise<boolean> {
  if (!import.meta.env.DEV || !('serviceWorker' in navigator)) return false

  const regs = await navigator.serviceWorker.getRegistrations()
  await Promise.all(regs.map((r) => r.unregister()))

  let clearedCaches = false
  if ('caches' in window) {
    const keys = await caches.keys()
    if (keys.length > 0) {
      await Promise.all(keys.map((k) => caches.delete(k)))
      clearedCaches = true
    }
  }

  return regs.length > 0 || clearedCaches
}

function mountApp(): void {
  const rootEl = document.getElementById('root')
  if (!rootEl) {
    document.body.innerHTML =
      '<p style="font-family:monospace;padding:2rem;color:#f85149">' +
      'No se encontró #root. En DevTools → Application: Unregister service workers, ' +
      'Clear site data, luego recarga http://localhost:5173/</p>'
    return
  }

  createRoot(rootEl).render(
    <StrictMode>
      <ErrorBoundary>
        <BrowserRouter>
          <ToastProvider>
            <AuthProvider>
              <App />
            </AuthProvider>
          </ToastProvider>
        </BrowserRouter>
      </ErrorBoundary>
    </StrictMode>,
  )
}

clearDevServiceWorkers()
  .then((didClear) => {
    if (didClear && !sessionStorage.getItem(DEV_SW_RELOAD_KEY)) {
      sessionStorage.setItem(DEV_SW_RELOAD_KEY, '1')
      window.location.reload()
      return
    }
    mountApp()
  })
  .catch(() => {
    mountApp()
  })
