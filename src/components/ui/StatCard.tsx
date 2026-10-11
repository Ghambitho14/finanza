import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

interface Props {
  icon: LucideIcon
  /** Clases de fondo y color del ícono (p. ej. `TYPE_META[type].tint`). */
  tint: string
  label: string
  value: ReactNode
  /** Líneas de contexto bajo la cifra: % del ingreso, variación, pendientes. */
  children?: ReactNode
}

/** Cifra destacada con ícono: ingresos, gastos, ahorro, promedios. */
export function StatCard({ icon: Icon, tint, label, value, children }: Props) {
  return (
    <div className="card p-4">
      <dt className="flex items-center gap-2.5 text-xs font-medium text-ink-secondary">
        <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${tint}`} aria-hidden>
          <Icon size={15} />
        </span>
        {label}
      </dt>
      <dd className="amount mt-3 text-xl font-semibold tracking-tight">{value}</dd>
      {children}
    </div>
  )
}
