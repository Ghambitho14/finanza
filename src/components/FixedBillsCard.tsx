import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Plus } from 'lucide-react'
import { useToast } from '@/components/Toaster'
import { toInput, useTransactionEditor } from '@/components/TransactionEditor'
import { TransactionRow } from '@/components/TransactionRow'
import { errorMessage } from '@/lib/api'
import { byDateAsc, defaultDateForMonth, type FixedBill } from '@/lib/calculations'
import { useFinance } from '@/lib/finance-store'
import { formatCLP, formatShortDate } from '@/lib/format'
import type { Transaction } from '@/types/finance'

interface Props {
  month: string
  bills: FixedBill[]
  others: Transaction[]
}

/**
 * Cuentas fijas como lista de pendientes: marcar una registra el pago con su
 * monto mensual; desmarcarla elimina el pago. Cada mes parten pendientes.
 */
export function FixedBillsCard({ month, bills, others }: Props) {
  const { createTransaction, deleteTransaction } = useFinance()
  const { openNew, openEdit } = useTransactionEditor()
  const toast = useToast()
  const [busy, setBusy] = useState<Set<string>>(new Set())

  const paidTotal = bills.reduce((s, b) => s + b.paid, 0) + others.reduce((s, t) => s + t.amount, 0)
  const expectedTotal = bills.reduce((s, b) => s + (b.isPaid ? b.paid : b.category.budget), 0)
    + others.reduce((s, t) => s + t.amount, 0)
  const paidCount = bills.filter((b) => b.isPaid).length

  const setBillBusy = (id: string, value: boolean) =>
    setBusy((prev) => {
      const next = new Set(prev)
      if (value) next.add(id)
      else next.delete(id)
      return next
    })

  const undoFailed = (err: unknown) => toast({ kind: 'error', text: errorMessage(err, 'No se pudo deshacer') })

  const toggle = async (bill: FixedBill) => {
    const { category } = bill
    setBillBusy(category.id, true)
    try {
      if (!bill.isPaid) {
        const payment = await createTransaction({
          description: category.name,
          amount: category.budget,
          type: 'fixed',
          date: defaultDateForMonth(month),
          category_id: category.id,
          recurring: false,
        })
        toast({
          text: `${category.name}: pagado`,
          action: { label: 'Deshacer', onClick: () => void deleteTransaction(payment.id).catch(undoFailed) },
        })
      } else {
        const payments = bill.payments
        await Promise.all(payments.map((p) => deleteTransaction(p.id)))
        toast({
          text: `${category.name}: pendiente`,
          action: {
            label: 'Deshacer',
            onClick: () => payments.forEach((p) => void createTransaction(toInput(p)).catch(undoFailed)),
          },
        })
      }
    } catch (err) {
      toast({ kind: 'error', text: errorMessage(err, 'No se pudo actualizar la cuenta') })
    } finally {
      setBillBusy(category.id, false)
    }
  }

  // Sin pagar: abre un pago prellenado (para registrar otro monto o fecha).
  // Pagada: edita el pago.
  const openBill = (bill: FixedBill) => {
    if (bill.isPaid) {
      openEdit(bill.payments[0])
      return
    }
    openNew({
      type: 'fixed',
      date: defaultDateForMonth(month),
      description: bill.category.name,
      amount: bill.category.budget,
      category_id: bill.category.id,
    })
  }

  return (
    <section className="card">
      <div className="card-header">
        <div>
          <h2 className="card-title">Gastos fijos</h2>
          <p className="mt-0.5 text-xs text-ink-muted">
            {bills.length > 0
              ? `${paidCount} de ${bills.length} ${bills.length === 1 ? 'cuenta pagada' : 'cuentas pagadas'}`
              : 'Tus cuentas del mes: arriendo, luz, internet…'}
          </p>
        </div>
        <span className="amount whitespace-nowrap text-sm font-semibold">
          {formatCLP(paidTotal)}
          {expectedTotal > paidTotal && <span className="font-normal text-ink-muted"> de {formatCLP(expectedTotal)}</span>}
        </span>
      </div>

      {bills.length > 0 && (
        <div className="px-4 pt-3">
          <div className="h-1.5 overflow-hidden rounded-full bg-surface-hover" aria-hidden>
            <div
              className="h-full rounded-full bg-series-fixed transition-[width] duration-500"
              style={{ width: `${expectedTotal ? (paidTotal / expectedTotal) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {bills.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-ink-muted">
          Agrega tus cuentas con su monto mensual en{' '}
          <Link to="/categorias" className="font-medium text-accent hover:underline">Categorías</Link>{' '}
          y aquí podrás marcarlas como pagadas cada mes.
        </p>
      ) : (
        <ul className="py-1.5">
          {bills.map((bill) => {
            const { category, isPaid, paid } = bill
            const differs = isPaid && paid !== category.budget
            return (
              <li key={category.id} className="flex items-center gap-3 px-4 transition-colors hover:bg-surface-raised/60">
                <button
                  role="checkbox"
                  aria-checked={isPaid}
                  aria-label={`${category.name} pagado`}
                  disabled={busy.has(category.id)}
                  onClick={() => toggle(bill)}
                  className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-colors disabled:opacity-50 ${
                    isPaid
                      ? 'border-status-good bg-status-good text-page'
                      : 'border-ink-muted/60 hover:border-ink'
                  }`}
                >
                  {isPaid && <Check size={13} strokeWidth={3} aria-hidden />}
                </button>
                <button
                  onClick={() => openBill(bill)}
                  className="flex min-w-0 flex-1 items-center gap-3 rounded-md py-2.5 text-left focus-visible:outline-offset-[-2px]"
                  aria-label={isPaid ? `Editar pago de ${category.name}` : `Registrar pago de ${category.name} con otro monto`}
                >
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate text-sm ${isPaid ? 'text-ink-secondary' : 'text-ink'}`}>{category.name}</span>
                    <span className="mt-0.5 block text-xs text-ink-muted">
                      {isPaid ? `Pagado el ${formatShortDate(bill.payments[0].date)}` : 'Pendiente'}
                      {differs && ` · previsto ${formatCLP(category.budget)}`}
                    </span>
                  </span>
                  <span className={`amount whitespace-nowrap text-sm font-medium ${isPaid ? 'text-ink-secondary' : 'text-ink'}`}>
                    {formatCLP(isPaid ? paid : category.budget)}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {others.length > 0 && (
        <>
          <p className="border-t border-line-muted px-4 pb-1 pt-3 text-xs font-medium text-ink-muted">Otros gastos fijos</p>
          <ul className="divide-y divide-line-muted">
            {[...others].sort(byDateAsc).map((t) => <TransactionRow key={t.id} transaction={t} />)}
          </ul>
        </>
      )}

      <div className="flex flex-wrap gap-1 border-t border-line-muted px-2 py-2">
        <Link to="/categorias" className="btn-ghost h-8 px-2.5 text-xs">
          <Plus size={14} aria-hidden />
          Nueva cuenta fija
        </Link>
        <button
          onClick={() => openNew({ type: 'fixed', date: defaultDateForMonth(month) })}
          className="btn-ghost h-8 px-2.5 text-xs"
        >
          <Plus size={14} aria-hidden />
          Otro gasto fijo
        </button>
      </div>
    </section>
  )
}
