import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface Props {
  open: boolean
  title: string
  description?: string
  onClose: () => void
  children: ReactNode
  /** Ancho máximo del panel. */
  size?: 'sm' | 'md'
}

/**
 * `<dialog>` nativo: atrapa el foco, cierra con Escape y devuelve el foco al
 * elemento que lo abrió sin código extra.
 */
export function Modal({ open, title, description, onClose, children, size = 'md' }: Props) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
      // showModal enfoca el primer elemento enfocable (la X) y pisa el autoFocus
      // de React: el campo inicial se marca con data-autofocus
      dialog.querySelector<HTMLElement>('[data-autofocus]')?.focus()
    }
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onClick={(e) => {
        // Clic en el fondo (fuera del panel) cierra
        if (e.target === ref.current) onClose()
      }}
      aria-labelledby="modal-title"
      className={`m-auto w-[calc(100%-2rem)] rounded-xl border border-line bg-surface p-0 text-left text-ink shadow-2xl shadow-black/50 ${
        size === 'sm' ? 'max-w-sm' : 'max-w-lg'
      }`}
    >
      {open && (
        <div className="p-5">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 id="modal-title" className="text-base font-semibold">{title}</h2>
              {description && <p className="mt-1 text-sm text-ink-secondary">{description}</p>}
            </div>
            <button onClick={onClose} className="icon-btn -mr-1.5 -mt-1" aria-label="Cerrar">
              <X size={16} />
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  )
}
