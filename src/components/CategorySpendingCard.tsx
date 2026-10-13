import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CircleAlert, PieChart, TriangleAlert } from 'lucide-react'
import { Donut, type DonutSegment } from '@/components/ui/Donut'
import { EmptyState } from '@/components/ui/EmptyState'
import { spendingByCategory, summarize } from '@/lib/calculations'
import { useFinance } from '@/lib/finance-store'
import { formatCLP, formatPercent } from '@/lib/format'
import { TYPE_META } from '@/lib/transaction-types'
import type { Transaction } from '@/types/finance'
import { moneyBreakdown, spendingBreakdown, type MoneyKey } from '@shared/spending'

const STROKES: Record<MoneyKey, string> = {
  fixed: 'stroke-series-fixed',
  variable: 'stroke-series-variable',
  savings: 'stroke-series-savings',
}

export function CategorySpendingCard({ monthTransactions }: { monthTransactions: Transaction[] }) {
  const { categories } = useFinance()
  const [active, setActive] = useState<string | null>(null)
  const rows = spendingByCategory(monthTransactions, categories)
  const hasBudgets = categories.some((c) => c.type === 'variable' && c.budget)

  const money = moneyBreakdown(summarize(monthTransactions))
  const segments: DonutSegment[] = money.segments.map((s) => ({ ...s, stroke: STROKES[s.key] }))
  const { total: variableTotal, legend } = spendingBreakdown(rows)

  return (
    <section className="card">
      <div className="card-header">
        <div>
          <h2 className="card-title">En qué se va tu plata</h2>
          <p className="mt-0.5 text-xs text-ink-muted">Gastos fijos, variables y ahorro del mes</p>
        </div>
        <Link to="/categorias" className="whitespace-nowrap text-xs font-medium text-accent hover:underline">
          {hasBudgets ? 'Editar presupuestos' : 'Definir presupuestos'}
        </Link>
      </div>

      {money.total === 0 && rows.length === 0 ? (
        <EmptyState icon={PieChart} title="Sin gastos ni ahorro aún" compact>
          Cuando anotes gastos y ahorro verás aquí en qué se va tu plata. Ponles un presupuesto para saber cuánto te queda.
        </EmptyState>
      ) : (
        <div className="grid gap-x-6 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <div>
            {segments.length > 0 && (
              <div className="flex justify-center px-4 pt-5">
                <Donut
                  segments={segments}
                  activeKey={active}
                  onActiveChange={setActive}
                  center={
                    <div>
                      <p className="text-xs text-ink-secondary">Total</p>
                      <p className="amount mt-0.5 text-base font-semibold">{formatCLP(money.total)}</p>
                    </div>
                  }
                />
              </div>
            )}
            <ul className="space-y-1 p-2 pt-4">
              {money.parts.map((part) => (
                <li
                  key={part.key}
                  className={`flex items-baseline justify-between gap-3 rounded-lg px-2 py-2 text-sm transition-colors ${
                    active === part.key ? 'bg-surface-raised' : ''
                  }`}
                  onPointerEnter={() => part.value > 0 && setActive(part.key)}
                  onPointerLeave={() => setActive(null)}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span className={`h-2.5 w-2.5 shrink-0 rounded-sm ${TYPE_META[part.key].dot}`} aria-hidden />
                    <span className="truncate">{part.label}</span>
                    {money.total > 0 && part.value > 0 && (
                      <span className="text-xs text-ink-muted">{formatPercent(part.value / money.total)}</span>
                    )}
                  </span>
                  <span className="amount whitespace-nowrap font-medium">{formatCLP(part.value)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t border-line-muted md:border-l md:border-t-0">
            <p className="px-4 pt-4 text-xs font-medium text-ink-secondary">Gastos variables por categoría</p>
            {legend.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-ink-muted">Sin gastos variables este mes.</p>
            ) : (
              <ul className="space-y-1 p-2">
                {legend.map((row) => {
                  const { key, name, ratio, over, near } = row
                  const fill = over ? 'bg-status-critical' : near ? 'bg-status-warning' : 'bg-series-variable'

                  return (
                    <li key={key} className="rounded-lg px-2 py-2">
                      <div className="flex items-baseline justify-between gap-3 text-sm">
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="truncate">{name}</span>
                          {variableTotal > 0 && row.spent > 0 && (
                            <span className="text-xs text-ink-muted">{formatPercent(row.spent / variableTotal)}</span>
                          )}
                        </span>
                        <span className="amount whitespace-nowrap font-medium">
                          {formatCLP(row.spent)}
                          {row.budget !== null && <span className="font-normal text-ink-muted"> / {formatCLP(row.budget)}</span>}
                        </span>
                      </div>
                      {ratio !== null && (
                        <>
                          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-hover">
                            <div
                              className={`h-full rounded-full transition-[width] duration-500 ${fill}`}
                              style={{ width: `${Math.min(ratio, 1) * 100}%` }}
                            />
                          </div>
                          <p className="mt-1 flex items-center gap-1 text-xs text-ink-muted">
                            {over ? (
                              <><CircleAlert size={12} className="text-status-critical" aria-hidden />Excedido por {formatCLP(row.spent - row.budget!)}</>
                            ) : near ? (
                              <><TriangleAlert size={12} className="text-status-warning" aria-hidden />Quedan {formatCLP(row.budget! - row.spent)}</>
                            ) : (
                              <>Quedan {formatCLP(row.budget! - row.spent)}</>
                            )}
                          </p>
                        </>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
