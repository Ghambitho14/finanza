import type { ReactNode } from 'react'

interface Props {
  title: string
  description?: ReactNode
  /** Botones o controles a la derecha del título (abajo en el teléfono). */
  actions?: ReactNode
}

/** Encabezado común de cada sección: título, para qué sirve y sus acciones. */
export function PageHeader({ title, description, actions }: Props) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-ink-secondary">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
