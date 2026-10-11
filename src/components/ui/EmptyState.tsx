import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

interface Props {
  icon: LucideIcon
  title: string
  children?: ReactNode
  /** Botón o enlace para salir del estado vacío. */
  action?: ReactNode
  /** Menos aire, para usar dentro de una tarjeta. */
  compact?: boolean
}

export function EmptyState({ icon: Icon, title, children, action, compact = false }: Props) {
  return (
    <div className={`flex flex-col items-center text-center ${compact ? 'px-4 py-8' : 'px-6 py-14'}`}>
      <span className="grid h-11 w-11 place-items-center rounded-full bg-surface-raised text-ink-muted" aria-hidden>
        <Icon size={20} />
      </span>
      <p className="mt-3 font-medium text-ink">{title}</p>
      {children && <p className="mt-1 max-w-sm text-sm text-ink-secondary">{children}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
