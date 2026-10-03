import { Pencil, Repeat, Trash2 } from 'lucide-react'
import { useDeleteTransaction, useTransactionEditor } from '@/components/TransactionEditor'
import { useFinance } from '@/lib/finance-store'
import { formatCLP, formatShortDate } from '@/lib/format'
import { TYPE_META } from '@/lib/transaction-types'
import type { Transaction } from '@/types/finance'

interface Props {
  transaction: Transaction
  /** Punto de color del tipo: útil en listas que mezclan tipos. */
  showType?: boolean
  /** Qué mostrar como fecha en la línea secundaria. */
  dateStyle?: 'short' | 'none'
}

export function signedAmount(t: Transaction): string {
  if (t.type === 'income') return `+${formatCLP(t.amount)}`
  if (TYPE_META[t.type].isExpense) return `−${formatCLP(t.amount)}`
  return formatCLP(t.amount)
}

export function TransactionRow({ transaction: t, showType = false, dateStyle = 'short' }: Props) {
  const { categoryById } = useFinance()
  const { openEdit } = useTransactionEditor()
  const deleteWithUndo = useDeleteTransaction()

  const category = t.category_id ? categoryById.get(t.category_id) : undefined
  const dateText = dateStyle === 'short' ? formatShortDate(t.date) : null

  return (
    <li className="group flex items-center gap-1 pr-2 transition-colors hover:bg-surface-raised/60">
      <button
        onClick={() => openEdit(t)}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-md py-2.5 pl-4 text-left focus-visible:outline-offset-[-2px]"
        aria-label={`Editar ${t.description}, ${formatCLP(t.amount)}`}
      >
        {showType && <span className={`h-2 w-2 shrink-0 rounded-full ${TYPE_META[t.type].dot}`} aria-hidden />}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm text-ink">{t.description}</span>
          <span className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-muted">
            <span className="truncate">{category?.name ?? 'Sin categoría'}</span>
            {dateText && <><span aria-hidden>·</span><span className="whitespace-nowrap">{dateText}</span></>}
            {t.recurring && (
              <span className="inline-flex items-center gap-1 whitespace-nowrap" title="Se repite cada mes">
                <span aria-hidden>·</span>
                <Repeat size={11} aria-hidden />
                Mensual
              </span>
            )}
          </span>
        </span>
        <span className={`amount whitespace-nowrap text-sm font-medium ${t.type === 'income' ? 'text-positive' : 'text-ink'}`}>
          {signedAmount(t)}
        </span>
      </button>
      <div className="flex sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
        <button onClick={() => openEdit(t)} className="icon-btn hidden sm:inline-flex" aria-label={`Editar ${t.description}`}>
          <Pencil size={14} />
        </button>
        <button
          onClick={() => deleteWithUndo(t)}
          className="icon-btn hover:text-negative"
          aria-label={`Eliminar ${t.description}`}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </li>
  )
}
