import type { MonthSummary } from '@/types/finance'

interface Props {
  summary: MonthSummary
}

export function DiffBar({ summary }: Props) {
  const { income, fixed, variable, savings } = summary
  const total = Math.max(income, fixed + variable + savings, 1)

  const segments = [
    { key: 'in', width: (income / total) * 100, color: 'bg-green' },
    { key: 'fixed', width: (fixed / total) * 100, color: 'bg-red' },
    { key: 'var', width: (variable / total) * 100, color: 'bg-red opacity-55' },
    { key: 'save', width: (savings / total) * 100, color: 'bg-amber' },
  ]

  return (
    <>
      <div
        className="flex h-2 overflow-hidden rounded border border-border-muted bg-bg-elevated-2"
        role="img"
        aria-label="Distribución de ingresos y gastos del mes"
      >
        {segments.map((seg) => (
          <div
            key={seg.key}
            className={`h-full transition-[width] duration-500 ease-out ${seg.color}`}
            style={{ width: `${seg.width}%` }}
          />
        ))}
      </div>
      <div className="mt-2.5 flex flex-wrap gap-4 font-mono text-xs text-txt-secondary">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-sm bg-green" />
          ingresos
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-sm bg-red" />
          gastos fijos
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-sm bg-red opacity-55" />
          gastos variables
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-sm bg-amber" />
          ahorro
        </span>
      </div>
    </>
  )
}
