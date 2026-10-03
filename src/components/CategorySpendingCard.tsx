import { Link } from 'react-router-dom'
import { CircleAlert, TriangleAlert } from 'lucide-react'
import { spendingByCategory } from '@/lib/calculations'
import { useFinance } from '@/lib/finance-store'
import { formatCLP } from '@/lib/format'
import { TYPE_META } from '@/lib/transaction-types'
import type { Transaction } from '@/types/finance'

/** Desde aquí el presupuesto se marca "por agotarse". */
const WARNING_RATIO = 0.8

export function CategorySpendingCard({ monthTransactions }: { monthTransactions: Transaction[] }) {
  const { categories } = useFinance()
  const rows = spendingByCategory(monthTransactions, categories)
  const maxSpent = Math.max(...rows.map((r) => r.spent), 1)
  const hasBudgets = categories.some((c) => c.type === 'variable' && c.budget)

  return (
    <section className="card">
      <div className="card-header">
        <h2 className="card-title">Gastos variables por categoría</h2>
        <Link to="/categorias" className="whitespace-nowrap text-xs font-medium text-accent hover:underline">
          {hasBudgets ? 'Editar presupuestos' : 'Definir presupuestos'}
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-ink-muted">
          Cuando anotes gastos variables verás aquí en qué se va tu plata. Ponles un presupuesto para saber cuánto te queda.
        </p>
      ) : (
        <ul className="space-y-4 p-4">
          {rows.map((row) => {
            const name = row.category?.name ?? 'Sin categoría'
            const ratio = row.budget ? row.spent / row.budget : row.spent / maxSpent
            const over = row.budget !== null && row.spent > row.budget
            const near = row.budget !== null && !over && ratio >= WARNING_RATIO
            const fill = over ? 'bg-status-critical' : near ? 'bg-status-warning' : TYPE_META[row.type].dot

            return (
              <li key={row.category?.id ?? `none-${row.type}`}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className={`h-2 w-2 shrink-0 rounded-sm ${TYPE_META[row.type].dot}`} aria-hidden />
                    <span className="truncate">{name}</span>
                  </span>
                  <span className="amount whitespace-nowrap">
                    {formatCLP(row.spent)}
                    {row.budget !== null && <span className="text-ink-muted"> / {formatCLP(row.budget)}</span>}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-hover">
                  <div
                    className={`h-full rounded-full transition-[width] duration-500 ${fill}`}
                    style={{ width: `${Math.min(ratio, 1) * 100}%` }}
                  />
                </div>
                {row.budget !== null && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-ink-muted">
                    {over ? (
                      <><CircleAlert size={12} className="text-status-critical" aria-hidden />Excedido por {formatCLP(row.spent - row.budget)}</>
                    ) : near ? (
                      <><TriangleAlert size={12} className="text-status-warning" aria-hidden />Quedan {formatCLP(row.budget - row.spent)}</>
                    ) : (
                      <>Quedan {formatCLP(row.budget - row.spent)}</>
                    )}
                  </p>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
