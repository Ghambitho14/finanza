import { useSyncExternalStore } from 'react'

/** Evento no estándar de Chrome, Edge y Android para instalar la PWA. */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/**
 * Cómo se puede instalar la app en este navegador:
 * - `prompt`: el navegador ofrece el diálogo de instalación (Chrome, Edge, Android).
 * - `ios`: iPhone o iPad, se instala desde el menú Compartir.
 * - `safari-mac`: Safari en macOS, desde Archivo → Agregar al Dock.
 * - `null`: ya está instalada o el navegador no permite instalarla.
 */
export type InstallMode = 'prompt' | 'ios' | 'safari-mac' | null

let deferred: BeforeInstallPromptEvent | null = null
let installed = false
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((listener) => listener())

// Se registra al cargar el módulo: el evento puede llegar antes de que React
// monte el botón y, si nadie lo guarda, se pierde
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault() // reemplaza la barra automática del navegador por el botón propio
    deferred = e as BeforeInstallPromptEvent
    notify()
  })
  window.addEventListener('appinstalled', () => {
    deferred = null
    installed = true
    notify()
  })
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

function manualMode(): InstallMode {
  const ua = navigator.userAgent
  // iPadOS se identifica como Mac: se distingue por la pantalla táctil
  const isIOS = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
  if (isIOS) return 'ios'
  const isSafari = /Safari/.test(ua) && !/Chrome|Chromium|Edg|OPR|Firefox|Android/.test(ua)
  if (isSafari && /Macintosh/.test(ua)) return 'safari-mac'
  return null
}

function getMode(): InstallMode {
  if (installed || isStandalone()) return null
  if (deferred) return 'prompt'
  return manualMode()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useInstallMode(): InstallMode {
  return useSyncExternalStore(subscribe, getMode, () => null)
}

/** Abre el diálogo de instalación del navegador. Devuelve si se aceptó. */
export async function promptInstall(): Promise<boolean> {
  const event = deferred
  if (!event) return false
  // El evento sirve una sola vez
  deferred = null
  notify()
  await event.prompt()
  const { outcome } = await event.userChoice
  return outcome === 'accepted'
}
