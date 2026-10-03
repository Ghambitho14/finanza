import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Coins, Plus, Repeat, X } from 'lucide-react'
import { CategorySpendingCard } from '@/components/CategorySpendingCard'
import { FixedBillsCard } from '@/components/FixedBillsCard'
import { MonthNav } from '@/components/MonthNav'
import { MonthOverview } from '@/components/MonthOverview'
import { QuickAddExpense } from '@/components/QuickAddExpense'
import { useToast } from '@/components/Toaster'
import { useTransactionEditor } from '@/components/TransactionEditor'
import { TransactionRow } from '@/components/TransactionRow'
import { errorMessage } from '@/lib/api'
import {
  SMALL_EXPENSE_LIMIT,
  byDateAsc,
  byDateDesc,
  currentMonth,
  defaultDateForMonth,
  fixedBillsForMonth,
  groupByDate,
  inMonth,
  isMonthKey,
  missingRecurring,
  prevMonth,
  smallExpenses,
  summarize,
} from '@/lib/calculations'
import { useFinance } from '@/lib/finance-store'
import { formatCLP, formatDayHeading, formatMonthName } from '@/lib/format'
import type { Transaction, TransactionType } from '@/types/finance'

const DISMISS_KEY = 'finanzas:recurrentes-ocultos'

function readDismissed(): string[] {
  try {
    return JSON.parse(localStorage.getItem(DISMISS_KEY) ?? '[]') as string[]
  } catch {
    return []
  }
}

export function Resumen() {
  const [params, setParams] = useSearchParams()
  const month = isMonthKey(params.get('mes')) ? params.get('mes')! : currentMonth()
  const setMonth = (next: string) => {
    setParams(next === currentMonth() ? {} : { mes: next }, { replace: true })
  }

  const { transactions, categories } = useFinance()
  const { openNew } = useTransactionEditor()

  const monthTxs = inMonth(transactions, month)
  const previous = prevMonth(month)
  const summary = summarize(monthTxs)
  const previousSummary = summarize(inMonth(transactions, previous))
  const ofType = (...types: TransactionType[]) => monthTxs.filter((t) => types.includes(t.type))

  const variable = ofType('variable').sort(byDateDesc)
  const fixed = fixedBillsForMonth(monthTxs, categories)
  const incomeAndSavings = ofType('income', 'savings').sort(byDateAsc)
  const small = smallExpenses(monthTxs)
  const newDefaults = (type: TransactionType) => ({ type, date: defaultDateForMonth(month) })

  return (
    <div className="space-y-6">
      <MonthNav month={month} onChange={setMonth} />

      <MonthOverview
        summary={summary}
        previous={previousSummary}
        previousMonth={previous}
        pendingFixed={fixed.pending}
      />

      <RecurringBanner key={month} month={month} transactions={transactions} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <section className="card">
            <div className="card-header">
              <div>
                <h2 className="card-title">Gastos variables</h2>
                <p className="mt-0.5 text-xs text-ink-muted">Compras del día a día: comida, antojos, transporte</p>
              </div>
              <span className="amount text-sm font-semibold">{formatCLP(summary.variable)}</span>
            </div>
            <QuickAddExpense month={month} />
            {small.count > 0 && (
              <p className="flex items-center gap-2 border-b border-line-muted bg-surface-raised/50 px-4 py-2.5 text-xs text-ink-secondary">
                <Coins size={14} className="shrink-0 text-ink-muted" aria-hidden />
                <span>
                  <span className="font-medium text-ink">Gastos hormiga:</span>{' '}
                  {small.count === 1 ? '1 compra' : `${small.count} compras`} de hasta {formatCLP(SMALL_EXPENSE_LIMIT)}{' '}
                  {small.count === 1 ? 'suma' : 'suman'}{' '}
                  <span className="amount font-medium text-ink">{formatCLP(small.total)}</span>
                </span>
              </p>
            )}
            {variable.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-ink-muted">
                Sin gastos variables este mes. Anota el primero arriba.
              </p>
            ) : (
              groupByDate(variable).map((group) => (
                <div key={group.date}>
                  <div className="flex justify-between bg-surface-raised/40 px-4 py-1.5 text-xs text-ink-muted">
                    <span>{formatDayHeading(group.date)}</span>
                    <span className="amount">{formatCLP(group.total)}</span>
                  </div>
                  <ul className="divide-y divide-line-muted">
                    {group.items.map((t) => <TransactionRow key={t.id} transaction={t} dateStyle="none" />)}
                  </ul>
                </div>
              ))
            )}
          </section>

          <FixedBillsCard month={month} bills={fixed.bills} others={fixed.others} />

          <TransactionListCard
            title="Ingresos y ahorro"
            total={null}
            items={incomeAndSavings}
            empty="Sin ingresos ni ahorro este mes."
            showType
            actions={[
              { label: 'Ingreso', onClick: () => openNew(newDefaults('income')) },
              { label: 'Ahorro', onClick: () => openNew(newDefaults('savings')) },
            ]}
          />
        </div>

        <aside className="space-y-6">
          <CategorySpendingCard monthTransactions={monthTxs} />
        </aside>
      </div>
    </div>
  )
}

interface ListCardProps {
  title: string
  subtitle?: string
  total: number | null
  items: Transaction[]
  empty: string
  showType?: boolean
  actions: { label: string; onClick: () => void }[]
}

function TransactionListCard({ title, subtitle, total, items, empty, showType, actions }: ListCardProps) {
  return (
    <section className="card">
      <div className="card-header">
        <div>
          <h2 className="card-title">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-ink-muted">{subtitle}</p>}
        </div>
        {total !== null && <span className="amount text-sm font-semibold">{formatCLP(total)}</span>}
      </div>
      {items.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-ink-muted">{empty}</p>
      ) : (
        <ul className="divide-y divide-line-muted">
          {items.map((t) => <TransactionRow key={t.id} transaction={t} showType={showType} />)}
        </ul>
      )}
      <div className="flex flex-wrap gap-1 border-t border-line-muted px-2 py-2">
        {actions.map((a) => (
          <button key={a.label} onClick={a.onClick} className="btn-ghost h-8 px-2.5 text-xs">
            <Plus size={14} aria-hidden />
            {a.label}
          </button>
        ))}
      </div>
    </section>
  )
}

/** Ofrece copiar los recurrentes del mes anterior que faltan en este mes. */
function RecurringBanner({ month, transactions }: { month: string; transactions: Transaction[] }) {
  const { cloneRecurring, categoryById } = useFinance()
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  const [dismissed, setDismissed] = useState(() => readDismissed().includes(month))

  const missing = missingRecurring(transactions, month, categoryById)
  if (missing.length === 0 || dismissed) return null

  const previous = prevMonth(month)
  const total = missing.reduce((s, t) => s + t.amount, 0)
  const names = missing.slice(0, 3).map((t) => t.description).join(', ')
  const rest = missing.length - 3

  const handleCopy = async () => {
    setBusy(true)
    try {
      const { cloned } = await cloneRecurring(month)
      toast({ text: `${cloned} ${cloned === 1 ? 'movimiento copiado' : 'movimientos copiados'} de ${formatMonthName(previous)}` })
    } catch (err) {
      toast({ kind: 'error', text: errorMessage(err, 'No se pudieron copiar') })
    } finally {
      setBusy(false)
    }
  }

  const handleDismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, JSON.stringify([...readDismissed(), month].slice(-24)))
    } catch {
      // Sin almacenamiento solo se oculta hasta recargar
    }
    setDismissed(true)
  }

  return (
    <div className="card flex flex-wrap items-center gap-3 border-accent/30 p-4 sm:flex-nowrap">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent/10 text-accent" aria-hidden>
        <Repeat size={16} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">
          {missing.length} {missing.length === 1 ? 'movimiento recurrente' : 'movimientos recurrentes'} de {formatMonthName(previous)} aún no {missing.length === 1 ? 'está' : 'están'} en {formatMonthName(month)}
        </p>
        <p className="mt-0.5 truncate text-xs text-ink-secondary">
          {names}{rest > 0 ? ` y ${rest} más` : ''} · <span className="amount">{formatCLP(total)}</span>
        </p>
      </div>
      <div className="flex gap-1">
        <button onClick={handleCopy} disabled={busy} className="btn-secondary">
          {busy ? 'Copiando…' : `Copiar a ${formatMonthName(month)}`}
        </button>
        <button onClick={handleDismiss} className="icon-btn h-9 w-9" aria-label="Ocultar sugerencia" title="Ocultar">
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
