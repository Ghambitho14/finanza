import { ArrowDownRight, ArrowUpRight, CircleAlert, CircleCheck, TriangleAlert } from 'lucide-react'
import { percentChange } from '@/lib/calculations'
import { formatCLP, formatMonthName, formatPercent } from '@/lib/format'
import { TYPE_META } from '@/lib/transaction-types'
import type { MonthSummary, TransactionType } from '@/types/finance'

interface Props {
  summary: MonthSummary
  previous: MonthSummary
  previousMonth: string
  /** Monto de las cuentas fijas que aún no se marcan como pagadas. */
  pendingFixed: number
}

const TILES: TransactionType[] = ['income', 'fixed', 'variable', 'savings']

export function MonthOverview({ summary, previous, previousMonth, pendingFixed }: Props) {
  const { income, available } = summary
  const afterBills = available - pendingFixed
  const outflow = summary.fixed + pendingFixed + summary.variable + summary.savings
  const scale = Math.max(income, outflow, 1)
  const overspent = income > 0 && available < 0
  const billsAtRisk = income > 0 && !overspent && afterBills < 0

  const segments = [
    { key: 'fixed', value: summary.fixed, className: 'bg-series-fixed', label: 'Gastos fijos pagados' },
    { key: 'pending', value: pendingFixed, className: 'bg-series-fixed/30', label: 'Gastos fijos por pagar' },
    { key: 'variable', value: summary.variable, className: 'bg-series-variable', label: 'Gastos variables' },
    { key: 'savings', value: summary.savings, className: 'bg-series-savings', label: 'Ahorro' },
  ].filter((s) => s.value > 0)

  return (
    <section className="card p-5" aria-label="Panorama del mes">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-ink-secondary">Disponible</p>
          <p className={`mt-1 text-4xl font-semibold tracking-tight sm:text-5xl ${overspent ? 'text-negative' : ''}`}>
            {formatCLP(available)}
          </p>
          <p className="mt-2 text-sm text-ink-secondary">
            {income > 0
              ? <>De {formatCLP(income)} en ingresos{summary.savingsRate ? <> · ahorras el {formatPercent(summary.savingsRate)}</> : null}</>
              : 'Aún no registras ingresos este mes'}
          </p>
          {pendingFixed > 0 && (
            <p className="mt-1 text-sm text-ink-secondary">
              Faltan <span className="amount font-medium text-ink">{formatCLP(pendingFixed)}</span> en cuentas por pagar
              {income > 0 && (afterBills >= 0
                ? <> · te quedarían <span className="amount font-medium text-ink">{formatCLP(afterBills)}</span></>
                : <> · te faltarían <span className="amount font-medium text-negative">{formatCLP(-afterBills)}</span></>)}
            </p>
          )}
        </div>
        {income > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-raised px-2.5 py-1 text-xs text-ink-secondary">
            {overspent
              ? <><CircleAlert size={14} className="text-status-critical" aria-hidden /> Gastas más de lo que ganas</>
              : billsAtRisk
                ? <><TriangleAlert size={14} className="text-status-warning" aria-hidden /> No alcanza para las cuentas pendientes</>
                : <><CircleCheck size={14} className="text-status-good" aria-hidden /> Dentro de tu ingreso</>}
          </span>
        )}
      </div>

      {/* Cómo se reparte el ingreso: cada segmento es su parte; el resto es lo disponible */}
      <div className="relative mt-5">
        {/* Sin fondo propio: el hueco de 2px entre segmentos deja ver la tarjeta */}
        <div
          className="flex h-2.5 gap-0.5 overflow-hidden rounded-full"
          role="img"
          aria-label={[
            ...segments.map((s) => `${s.label} ${formatCLP(s.value)}`),
            `disponible ${formatCLP(Math.max(afterBills, 0))}`,
          ].join(', ')}
        >
          {segments.map((s) => (
            <div
              key={s.key}
              title={`${s.label}: ${formatCLP(s.value)}`}
              className={`h-full min-w-[3px] transition-[flex-grow] duration-500 ease-out ${s.className}`}
              style={{ flex: `${s.value} 1 0%` }}
            />
          ))}
          {(afterBills > 0 || segments.length === 0) && (
            <div className="h-full bg-surface-hover" style={{ flex: `${Math.max(afterBills, 1)} 1 0%` }} />
          )}
        </div>
        {(overspent || billsAtRisk) && (
          <div
            className="absolute -top-1 h-[18px] w-0.5 rounded bg-ink"
            style={{ left: `calc(${(income / scale) * 100}% - 1px)` }}
            title="Tu ingreso del mes"
            aria-hidden
          />
        )}
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-line-muted pt-4 lg:grid-cols-4">
        {TILES.map((type) => {
          const value = summary[type]
          // Sin registros aún en el mes, "−100%" solo confunde
          const change = value > 0 ? percentChange(value, previous[type]) : null
          // En gastos, subir es malo; en ingresos y ahorro, subir es bueno
          const upIsGood = !TYPE_META[type].isExpense
          const good = change !== null && (change >= 0) === upIsGood
          const share = type !== 'income' && income > 0 ? value / income : null

          return (
            <div key={type}>
              <dt className="flex items-center gap-2 text-xs text-ink-secondary">
                <span className={`h-2 w-2 rounded-sm ${TYPE_META[type].dot}`} aria-hidden />
                {TYPE_META[type].plural}
              </dt>
              <dd className="mt-1 text-lg font-semibold tracking-tight">{formatCLP(value)}</dd>
              <dd className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-ink-muted">
                {share !== null && <span>{share > 0 && share < 0.005 ? '<1%' : formatPercent(share)} del ingreso</span>}
                {share !== null && change !== null && <span aria-hidden>·</span>}
                {change !== null && change !== 0 && (
                  <span className={`inline-flex items-center gap-0.5 ${good ? 'text-positive' : 'text-negative'}`}>
                    {change > 0 ? <ArrowUpRight size={12} aria-hidden /> : <ArrowDownRight size={12} aria-hidden />}
                    <span className="sr-only">{change > 0 ? 'Subió' : 'Bajó'}</span>
                    {formatPercent(Math.abs(change))}
                    <span className="text-ink-muted">vs {formatMonthName(previousMonth).slice(0, 3)}</span>
                  </span>
                )}
                {change === 0 && <span>Igual que {formatMonthName(previousMonth)}</span>}
              </dd>
              {type === 'fixed' && pendingFixed > 0 && (
                <dd className="mt-0.5 text-xs text-ink-muted">
                  <span className="amount">{formatCLP(pendingFixed)}</span> por pagar
                </dd>
              )}
            </div>
          )
        })}
      </dl>
    </section>
  )
}
