import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CircleAlert, PieChart, TriangleAlert } from 'lucide-react'
import { Donut, type DonutSegment } from '@/components/ui/Donut'
import { EmptyState } from '@/components/ui/EmptyState'
import { spendingByCategory } from '@/lib/calculations'
import { useFinance } from '@/lib/finance-store'
import { formatCLP, formatPercent } from '@/lib/format'
import type { Transaction } from '@/types/finance'

/** Desde aquí el presupuesto se marca "por agotarse". */
const WARNING_RATIO = 0.8

/** Colores de la dona en orden; desde la sexta categoría se agrupan en "Otras". */
const SLOTS = [
  { fill: 'bg-chart-1', stroke: 'stroke-chart-1' },
  { fill: 'bg-chart-2', stroke: 'stroke-chart-2' },
  { fill: 'bg-chart-3', stroke: 'stroke-chart-3' },
  { fill: 'bg-chart-4', stroke: 'stroke-chart-4' },
  { fill: 'bg-chart-5', stroke: 'stroke-chart-5' },
]
const OTHER = { fill: 'bg-ink-muted/50', stroke: 'stroke-ink-muted/50' }

export function CategorySpendingCard({ monthTransactions }: { monthTransactions: Transaction[] }) {
  const { categories } = useFinance()
  const [active, setActive] = useState<string | null>(null)
  const rows = spendingByCategory(monthTransactions, categories)
  const hasBudgets = categories.some((c) => c.type === 'variable' && c.budget)

  const spending = rows.filter((r) => r.spent > 0)
  const total = spending.reduce((s, r) => s + r.spent, 0)
  const keyOf = (row: (typeof rows)[number]) => row.category?.id ?? `none-${row.type}`
  // Las filas ya vienen de mayor a menor gasto
  const slotOf = (index: number, spent: number) => (spent > 0 && index < SLOTS.length ? SLOTS[index] : OTHER)
  const otherTotal = spending.slice(SLOTS.length).reduce((s, r) => s + r.spent, 0)
  const segments: DonutSegment[] = [
    ...spending.slice(0, SLOTS.length).map((r, i) => ({
      key: keyOf(r),
      label: r.category?.name ?? 'Sin categoría',
      value: r.spent,
      stroke: SLOTS[i].stroke,
    })),
    ...(otherTotal > 0 ? [{ key: 'otras', label: 'Otras categorías', value: otherTotal, stroke: OTHER.stroke }] : []),
  ]

  return (
    <section className="card">
      <div className="card-header">
        <div>
          <h2 className="card-title">En qué se va tu plata</h2>
          <p className="mt-0.5 text-xs text-ink-muted">Gastos variables por categoría</p>
        </div>
        <Link to="/categorias" className="whitespace-nowrap text-xs font-medium text-accent hover:underline">
          {hasBudgets ? 'Editar presupuestos' : 'Definir presupuestos'}
        </Link>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={PieChart} title="Sin gastos variables aún" compact>
          Cuando anotes gastos verás aquí en qué se va tu plata. Ponles un presupuesto para saber cuánto te queda.
        </EmptyState>
      ) : (
        <>
          {segments.length > 0 && (
            <div className="flex justify-center px-4 pt-5">
              <Donut
                segments={segments}
                activeKey={active}
                onActiveChange={setActive}
                center={
                  <div>
                    <p className="text-xs text-ink-secondary">Total</p>
                    <p className="amount mt-0.5 text-base font-semibold">{formatCLP(total)}</p>
                  </div>
                }
              />
            </div>
          )}
          <ul className="space-y-1 p-2 pt-4">
            {rows.map((row, index) => {
              const key = keyOf(row)
              const name = row.category?.name ?? 'Sin categoría'
              const slot = slotOf(index, row.spent)
              const ratio = row.budget ? row.spent / row.budget : null
              const over = row.budget !== null && row.spent > row.budget
              const near = ratio !== null && !over && ratio >= WARNING_RATIO
              const fill = over ? 'bg-status-critical' : near ? 'bg-status-warning' : slot.fill
              const segmentKey = slot === OTHER ? 'otras' : key

              return (
                <li
                  key={key}
                  className={`rounded-lg px-2 py-2 transition-colors ${active === segmentKey ? 'bg-surface-raised' : ''}`}
                  onPointerEnter={() => row.spent > 0 && setActive(segmentKey)}
                  onPointerLeave={() => setActive(null)}
                >
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className={`h-2.5 w-2.5 shrink-0 rounded-sm ${slot.fill}`} aria-hidden />
                      <span className="truncate">{name}</span>
                      {total > 0 && row.spent > 0 && (
                        <span className="text-xs text-ink-muted">{formatPercent(row.spent / total)}</span>
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
        </>
      )}
    </section>
  )
}
