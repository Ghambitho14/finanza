import { useState, type ReactNode } from 'react'
import { Download, Share, SquarePlus } from 'lucide-react'
import { Modal } from '@/components/Modal'
import { promptInstall, useInstallMode } from '@/lib/install'

interface Props {
  /** `menu`: ítem del menú de la cuenta. `link`: enlace bajo las pantallas de acceso. */
  variant: 'menu' | 'link'
  /** Se llama al terminar (para cerrar el menú que lo contiene). */
  onDone?: () => void
}

/**
 * Botón "Instalar app". Solo aparece si el navegador permite instalarla y aún
 * no está instalada. En iPhone, iPad y Safari de Mac muestra los pasos, porque
 * esos navegadores no ofrecen un diálogo de instalación.
 */
export function InstallAppButton({ variant, onDone }: Props) {
  const mode = useInstallMode()
  const [help, setHelp] = useState<'ios' | 'safari-mac' | null>(null)

  if (!mode && !help) return null

  const handleClick = async () => {
    if (mode === 'prompt') {
      await promptInstall()
      onDone?.()
    } else if (mode) {
      setHelp(mode)
    }
  }

  const closeHelp = () => {
    setHelp(null)
    onDone?.()
  }

  return (
    <>
      {variant === 'menu' ? (
        <button
          role="menuitem"
          onClick={handleClick}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-ink hover:bg-surface-hover"
        >
          <Download size={15} aria-hidden />
          Instalar app
        </button>
      ) : (
        <button
          onClick={handleClick}
          className="inline-flex items-center gap-1.5 text-sm text-ink-secondary transition-colors hover:text-ink"
        >
          <Download size={14} aria-hidden />
          Instalar la app en este dispositivo
        </button>
      )}

      <Modal
        open={help !== null}
        onClose={closeHelp}
        size="sm"
        title="Instalar Finanzas"
        description="Queda como una app más, con su ícono y en pantalla completa."
      >
        {help === 'ios' ? (
          <ol className="space-y-3 text-sm">
            <Step n={1}>
              Toca <Share size={15} className="mx-0.5 inline -translate-y-px" aria-label="Compartir" />{' '}
              <strong>Compartir</strong> en la barra del navegador.
            </Step>
            <Step n={2}>
              Elige <SquarePlus size={15} className="mx-0.5 inline -translate-y-px" aria-hidden />{' '}
              <strong>Agregar a inicio</strong>. Si no aparece, desliza la lista hacia abajo.
            </Step>
            <Step n={3}>
              Toca <strong>Agregar</strong>.
            </Step>
          </ol>
        ) : (
          <ol className="space-y-3 text-sm">
            <Step n={1}>
              En la barra de menús, abre <strong>Archivo</strong>.
            </Step>
            <Step n={2}>
              Elige <strong>Agregar al Dock</strong> y confirma.
            </Step>
          </ol>
        )}
        <div className="mt-5 flex justify-end">
          <button onClick={closeHelp} className="btn-secondary" data-autofocus>
            Entendido
          </button>
        </div>
      </Modal>
    </>
  )
}

function Step({ n, children }: { n: number; children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-surface-raised text-xs font-semibold text-ink-secondary">
        {n}
      </span>
      <span className="pt-0.5 text-ink-secondary">{children}</span>
    </li>
  )
}
