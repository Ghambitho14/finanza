import type { ReactNode } from 'react'

interface Option<T> {
  value: T
  label: ReactNode
}

interface Props<T> {
  options: readonly Option<T>[]
  value: T
  onChange: (value: T) => void
  /** Nombre del grupo para lectores de pantalla. */
  label: string
  className?: string
}

/** Grupo de botones donde uno queda elegido (períodos, vistas). */
export function SegmentedControl<T extends string | number>({ options, value, onChange, label, className = '' }: Props<T>) {
  return (
    <div className={`inline-flex rounded-lg border border-line bg-surface-raised p-0.5 ${className}`} role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={`flex-1 whitespace-nowrap rounded-md px-3 py-1.5 text-sm transition-colors sm:py-1 ${
            value === o.value ? 'bg-surface font-medium text-ink shadow-sm' : 'text-ink-secondary hover:text-ink'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
