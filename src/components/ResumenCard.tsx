import { formatCLP, typeColorClass, typeSign } from '@/lib/calculations'
import type { MonthSummary, TransactionType } from '@/types/finance'

interface Props {
  summary: MonthSummary
}

const ROWS: { type: TransactionType; label: string }[] = [
  { type: 'income', label: 'ingresos' },
  { type: 'fixed', label: 'gastos fijos' },
  { type: 'variable', label: 'gastos variables' },
  { type: 'savings', label: 'ahorro / reservas' },
]

export function ResumenCard({ summary }: Props) {
  const amounts: Record<TransactionType, number> = {
    income: summary.income,
    fixed: summary.fixed,
    variable: summary.variable,
    savings: summary.savings,
  }

  const base = Math.max(summary.income, 1)

  return (
    <section className="card">
      <div className="card-head">
        <span className="text-txt-primary">resumen.diff</span>
        <span>+1 −3</span>
      </div>
      <div className="py-1">
        {ROWS.map((row) => {
          const amount = amounts[row.type]
          const colors = typeColorClass(row.type)
          const pct = Math.min((amount / base) * 100, 100)

          return (
            <div
              key={row.type}
              className={`grid grid-cols-[20px_1fr_auto] items-center gap-3 border-l-[3px] px-4 py-2 font-mono text-[13.5px] sm:grid-cols-[20px_1fr_auto_90px] ${colors.bg} ${colors.border}`}
            >
              <span className={`sign font-bold ${colors.text}`}>
                {typeSign(row.type)}
              </span>
              <span className="text-txt-primary">{row.label}</span>
              <span className="text-right font-medium text-txt-primary">
                {formatCLP(amount)}
              </span>
              <span className={`mini-bar hidden h-[5px] overflow-hidden rounded bg-bg-elevated-2 sm:block ${colors.bar}`}>
                <div
                  className={`h-full ${colors.bar}`}
                  style={{ width: `${pct}%` }}
                />
              </span>
            </div>
          )
        })}
      </div>
    </section>
  )
}
