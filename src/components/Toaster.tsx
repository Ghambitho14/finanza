import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { CircleAlert, CircleCheck, Info, X } from 'lucide-react'

type ToastKind = 'success' | 'error' | 'info'

interface ToastOptions {
  kind?: ToastKind
  text: string
  action?: { label: string; onClick: () => void }
}

interface Toast extends ToastOptions {
  id: number
  kind: ToastKind
}

const ToastContext = createContext<((options: ToastOptions) => void) | null>(null)

const ICONS = {
  success: <CircleCheck size={16} className="text-status-good" aria-hidden />,
  error: <CircleAlert size={16} className="text-status-critical" aria-hidden />,
  info: <Info size={16} className="text-accent" aria-hidden />,
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(1)

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id))
  }, [])

  const show = useCallback((options: ToastOptions) => {
    const id = nextId.current++
    const kind = options.kind ?? 'success'
    setToasts((list) => [...list.slice(-2), { ...options, kind, id }])
    // Los errores y los avisos con "deshacer" se quedan más tiempo
    const duration = kind === 'error' || options.action ? 7000 : 4000
    window.setTimeout(() => dismiss(id), duration)
  }, [dismiss])

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.kind === 'error' ? 'alert' : 'status'}
            className="pointer-events-auto flex w-full max-w-md animate-toast-in items-center gap-3 rounded-lg border border-line bg-surface-raised px-3.5 py-2.5 shadow-xl shadow-black/40"
          >
            {ICONS[t.kind]}
            <span className="flex-1 text-sm text-ink">{t.text}</span>
            {t.action && (
              <button
                onClick={() => {
                  t.action!.onClick()
                  dismiss(t.id)
                }}
                className="rounded-md px-2 py-1 text-sm font-semibold text-accent hover:bg-surface-hover"
              >
                {t.action.label}
              </button>
            )}
            <button onClick={() => dismiss(t.id)} className="icon-btn h-7 w-7" aria-label="Cerrar aviso">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast debe usarse dentro de ToastProvider')
  return ctx
}
