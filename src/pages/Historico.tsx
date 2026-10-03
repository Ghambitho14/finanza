import { useMemo, useState } from 'react'
import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { TooltipProps } from 'recharts'
import { currentMonth, monthRange, summaryForMonth } from '@/lib/calculations'
import { useFinance } from '@/lib/finance-store'
import { formatCLP, formatCompactCLP, formatMonthLabel, formatMonthShort, formatPercent } from '@/lib/format'
import { colors } from '@/lib/theme'
import { TYPE_META } from '@/lib/transaction-types'
import type { MonthSummary, TransactionType } from '@/types/finance'

const RANGES = [6, 12, 24] as const
type Range = (typeof RANGES)[number]
const STACK: TransactionType[] = ['fixed', 'variable', 'savings']
const SERIES: TransactionType[] = ['income', 'fixed', 'variable', 'savings']

type Row = MonthSummary & { month: string; label: string }

const hasData = (r: MonthSummary) => r.income > 0 || r.expenses > 0 || r.savings > 0

interface SegmentProps {
  x?: number
  y?: number
  width?: number
  height?: number
  fill?: string
  payload?: Row
}

/**
 * Segmento de la pila: solo el de más arriba (con valor) lleva esquinas
 * redondeadas; el borde del color de la tarjeta deja un hueco de 2px entre segmentos.
 */
function stackSegment(key: TransactionType) {
  return function Segment({ x = 0, y = 0, width = 0, height = 0, fill, payload }: SegmentProps) {
    if (height <= 0 || !payload) return <g />
    const top = [...STACK].reverse().find((k) => payload[k] > 0)
    const r = key === top ? Math.min(4, height, width / 2) : 0
    const d = `M${x},${y + height} L${x},${y + r} Q${x},${y} ${x + r},${y} L${x + width - r},${y} Q${x + width},${y} ${x + width},${y + r} L${x + width},${y + height} Z`
    return <path d={d} fill={fill} stroke={colors.surface.DEFAULT} strokeWidth={2} />
  }
}

function ChartTooltip({ active, payload }: TooltipProps<number, string>) {
  const row = payload?.[0]?.payload as Row | undefined
  if (!active || !row) return null

  return (
    <div className="min-w-[200px] rounded-lg border border-line bg-surface-raised px-3 py-2.5 text-xs shadow-xl shadow-black/40">
      <p className="mb-2 font-medium text-ink">{formatMonthLabel(row.month)}</p>
      <dl className="space-y-1">
        {SERIES.map((key) => (
          <div key={key} className="flex items-center justify-between gap-4">
            <dt className="flex items-center gap-2 text-ink-secondary">
              <span className={`h-2 w-2 rounded-sm ${TYPE_META[key].dot}`} aria-hidden />
              {TYPE_META[key].plural}
            </dt>
            <dd className="amount text-ink">{formatCLP(row[key])}</dd>
          </div>
        ))}
        <div className="mt-1.5 flex justify-between gap-4 border-t border-line-muted pt-1.5">
          <dt className="text-ink-secondary">Disponible</dt>
          <dd className={`amount font-medium ${row.available < 0 ? 'text-negative' : 'text-ink'}`}>{formatCLP(row.available)}</dd>
        </div>
      </dl>
    </div>
  )
}

export function Historico() {
  const { transactions } = useFinance()
  const [range, setRange] = useState<Range>(12)

  const rows: Row[] = useMemo(() => {
    const all = monthRange(currentMonth(), range).map((month) => ({
      month,
      label: formatMonthShort(month),
      ...summaryForMonth(transactions, month),
    }))
    // Los meses anteriores al primer registro no son "cero ingresos": se omiten
    const first = all.findIndex(hasData)
    return first < 0 ? [] : all.slice(first)
  }, [transactions, range])

  // Promedios solo sobre meses con datos, para que los meses vacíos no los diluyan
  const active = rows.filter(hasData)
  const avg = (pick: (r: Row) => number) => (active.length ? active.reduce((s, r) => s + pick(r), 0) / active.length : 0)
  const totalIncome = active.reduce((s, r) => s + r.income, 0)
  const totalSavings = active.reduce((s, r) => s + r.savings, 0)
  const best = active.length ? active.reduce((a, b) => (b.available > a.available ? b : a)) : null

  const tiles = [
    { label: 'Gasto promedio al mes', value: formatCLP(Math.round(avg((r) => r.expenses))) },
    { label: 'Ahorro promedio al mes', value: formatCLP(Math.round(avg((r) => r.savings))) },
    { label: 'Tasa de ahorro', value: totalIncome > 0 ? formatPercent(totalSavings / totalIncome) : '—' },
    { label: 'Mejor mes', value: best ? formatMonthLabel(best.month) : '—', sub: best ? `${formatCLP(best.available)} disponible` : undefined },
  ]

  const header = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-xl font-semibold tracking-tight">Histórico</h1>
      <RangePicker value={range} onChange={setRange} />
    </div>
  )

  if (rows.length === 0) {
    return (
      <div className="space-y-5">
        {header}
        <div className="card px-4 py-16 text-center">
          <p className="font-medium">Aún no hay datos para mostrar</p>
          <p className="mt-1 text-ink-secondary">Registra tus movimientos y aquí verás cómo evolucionan mes a mes.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {header}

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="card p-4">
            <dt className="text-xs text-ink-secondary">{t.label}</dt>
            <dd className="mt-1 text-lg font-semibold tracking-tight">{t.value}</dd>
            {t.sub && <dd className="mt-0.5 text-xs text-ink-muted">{t.sub}</dd>}
          </div>
        ))}
      </dl>

      <section className="card p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="card-title">Ingresos frente a gastos y ahorro</h2>
            <p className="mt-0.5 text-xs text-ink-muted">Si la pila supera la línea de ingresos, ese mes gastaste más de lo que ganaste.</p>
          </div>
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-secondary" aria-label="Leyenda">
            <li className="flex items-center gap-1.5">
              <span className="h-0.5 w-3.5 rounded bg-series-income" aria-hidden />
              Ingresos
            </li>
            {STACK.map((key) => (
              <li key={key} className="flex items-center gap-1.5">
                <span className={`h-2.5 w-2.5 rounded-sm ${TYPE_META[key].dot}`} aria-hidden />
                {TYPE_META[key].plural}
              </li>
            ))}
          </ul>
        </div>

        <div className="h-72" role="img" aria-label="Gráfico mensual de ingresos, gastos y ahorro. Los valores están en la tabla de abajo.">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={rows} margin={{ top: 8, right: 4, bottom: 0, left: 4 }} barCategoryGap="30%">
              <CartesianGrid vertical={false} stroke={colors.line.muted} />
              <XAxis
                dataKey="label"
                tick={{ fill: colors.ink.muted, fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: colors.line.DEFAULT }}
                interval="preserveStartEnd"
                minTickGap={8}
              />
              <YAxis
                tick={{ fill: colors.ink.muted, fontSize: 11 }}
                tickFormatter={formatCompactCLP}
                tickLine={false}
                axisLine={false}
                width={64}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: colors.surface.hover, opacity: 0.6 }} />
              {STACK.map((key) => (
                <Bar
                  key={key}
                  dataKey={key}
                  stackId="out"
                  fill={colors.series[key]}
                  maxBarSize={24}
                  shape={stackSegment(key)}
                  isAnimationActive={false}
                />
              ))}
              <Line
                dataKey="income"
                type="linear"
                stroke={colors.series.income}
                strokeWidth={2}
                dot={{ r: 4, fill: colors.series.income, stroke: colors.surface.DEFAULT, strokeWidth: 2 }}
                activeDot={{ r: 5, fill: colors.series.income, stroke: colors.surface.DEFAULT, strokeWidth: 2 }}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="card overflow-hidden">
        <div className="card-header">
          <h2 className="card-title">Detalle por mes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-line-muted text-xs text-ink-secondary">
                <th scope="col" className="px-4 py-2.5 text-left font-medium">Mes</th>
                {SERIES.map((key) => (
                  <th key={key} scope="col" className="px-4 py-2.5 text-right font-medium">{TYPE_META[key].plural}</th>
                ))}
                <th scope="col" className="px-4 py-2.5 text-right font-medium">Disponible</th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">% ahorro</th>
              </tr>
            </thead>
            <tbody className="amount divide-y divide-line-muted">
              {[...rows].reverse().map((row) => (
                <tr key={row.month} className="hover:bg-surface-raised/50">
                  <th scope="row" className="px-4 py-2.5 text-left font-normal">{formatMonthLabel(row.month)}</th>
                  {SERIES.map((key) => (
                    <td key={key} className={`px-4 py-2.5 text-right ${row[key] ? '' : 'text-ink-muted'}`}>{formatCLP(row[key])}</td>
                  ))}
                  <td className={`px-4 py-2.5 text-right font-medium ${row.available < 0 ? 'text-negative' : ''}`}>
                    {formatCLP(row.available)}
                  </td>
                  <td className="px-4 py-2.5 text-right text-ink-secondary">
                    {row.savingsRate !== null ? formatPercent(row.savingsRate) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function RangePicker({ value, onChange }: { value: Range; onChange: (range: Range) => void }) {
  return (
    <div className="flex rounded-lg border border-line bg-surface-raised p-0.5" role="group" aria-label="Período">
      {RANGES.map((r) => (
        <button
          key={r}
          onClick={() => onChange(r)}
          aria-pressed={value === r}
          className={`rounded-md px-3 py-1 text-sm transition-colors ${
            value === r ? 'bg-surface-hover font-medium text-ink' : 'text-ink-secondary hover:text-ink'
          }`}
        >
          {r} meses
        </button>
      ))}
    </div>
  )
}
