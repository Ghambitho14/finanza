import { createContext, useCallback, useContext, useState, type FormEvent, type ReactNode } from 'react'
import { Trash2 } from 'lucide-react'
import { AmountInput } from '@/components/AmountInput'
import { Modal } from '@/components/Modal'
import { useToast } from '@/components/Toaster'
import { errorMessage } from '@/lib/api'
import { useFinance } from '@/lib/finance-store'
import { formatAmountInput, parseAmountInput, todayISO } from '@/lib/format'
import { TYPE_META, TYPE_ORDER, recurringByDefault } from '@/lib/transaction-types'
import type { Transaction, TransactionInput, TransactionType } from '@/types/finance'

interface EditorDefaults {
  type?: TransactionType
  date?: string
  description?: string
  amount?: number
  category_id?: string
}

type EditorState =
  | { mode: 'new'; defaults: EditorDefaults }
  | { mode: 'edit'; transaction: Transaction }

interface EditorApi {
  openNew: (defaults?: EditorDefaults) => void
  openEdit: (transaction: Transaction) => void
}

const EditorContext = createContext<EditorApi | null>(null)

export const toInput = (t: Transaction): TransactionInput => ({
  description: t.description,
  amount: t.amount,
  type: t.type,
  date: t.date,
  category_id: t.category_id,
  recurring: t.recurring,
})

/** Elimina con un aviso que permite deshacer (vuelve a crear el movimiento). */
export function useDeleteTransaction() {
  const { deleteTransaction, createTransaction } = useFinance()
  const toast = useToast()

  return useCallback(async (t: Transaction): Promise<boolean> => {
    try {
      await deleteTransaction(t.id)
    } catch (err) {
      toast({ kind: 'error', text: errorMessage(err, 'No se pudo eliminar') })
      return false
    }
    toast({
      text: `Eliminado: ${t.description}`,
      action: {
        label: 'Deshacer',
        onClick: () => {
          createTransaction(toInput(t)).catch((err) =>
            toast({ kind: 'error', text: errorMessage(err, 'No se pudo restaurar') }),
          )
        },
      },
    })
    return true
  }, [deleteTransaction, createTransaction, toast])
}

export function TransactionEditorProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<EditorState | null>(null)

  const api: EditorApi = {
    openNew: useCallback((defaults: EditorDefaults = {}) => setState({ mode: 'new', defaults }), []),
    openEdit: useCallback((transaction: Transaction) => setState({ mode: 'edit', transaction }), []),
  }
  const close = () => setState(null)

  return (
    <EditorContext.Provider value={api}>
      {children}
      <Modal
        open={state !== null}
        title={state?.mode === 'edit' ? 'Editar movimiento' : 'Nuevo movimiento'}
        onClose={close}
      >
        {state && <TransactionForm state={state} onDone={close} />}
      </Modal>
    </EditorContext.Provider>
  )
}

export function useTransactionEditor(): EditorApi {
  const ctx = useContext(EditorContext)
  if (!ctx) throw new Error('useTransactionEditor debe usarse dentro de TransactionEditorProvider')
  return ctx
}

function TransactionForm({ state, onDone }: { state: EditorState; onDone: () => void }) {
  const { categories, createTransaction, updateTransaction } = useFinance()
  const deleteWithUndo = useDeleteTransaction()
  const toast = useToast()

  const editing = state.mode === 'edit' ? state.transaction : null
  const defaults = state.mode === 'new' ? state.defaults : {}
  const initialType = editing?.type ?? defaults.type ?? 'variable'
  const initialAmount = editing?.amount ?? defaults.amount
  // Si llega prellenado (p. ej. pagar una cuenta), lo usual es ajustar el monto
  const focusAmount = !editing && defaults.amount !== undefined

  const [type, setType] = useState<TransactionType>(initialType)
  const [description, setDescription] = useState(editing?.description ?? defaults.description ?? '')
  const [amount, setAmount] = useState(initialAmount ? formatAmountInput(initialAmount) : '')
  const [date, setDate] = useState(editing?.date ?? defaults.date ?? todayISO())
  const [categoryId, setCategoryId] = useState(editing?.category_id ?? defaults.category_id ?? '')
  const [recurring, setRecurring] = useState(editing?.recurring ?? recurringByDefault(initialType))
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const typeCategories = categories.filter((c) => c.type === type)

  const handleTypeChange = (next: TransactionType) => {
    setType(next)
    // Las categorías son por tipo: la elegida deja de valer al cambiarlo
    setCategoryId('')
    if (!editing) setRecurring(recurringByDefault(next))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const parsedAmount = parseAmountInput(amount)
    if (!description.trim()) return setError('Escribe una descripción')
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) return setError('El monto debe ser mayor a 0')
    if (!date) return setError('Elige una fecha')

    const input: TransactionInput = {
      description: description.trim(),
      amount: parsedAmount,
      type,
      date,
      category_id: categoryId || null,
      recurring,
    }

    setSaving(true)
    setError('')
    try {
      if (editing) {
        await updateTransaction(editing.id, input)
        toast({ text: 'Cambios guardados' })
      } else {
        await createTransaction(input)
        toast({ text: `${TYPE_META[type].label} agregado` })
      }
      onDone()
    } catch (err) {
      setError(errorMessage(err, 'No se pudo guardar'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (editing && (await deleteWithUndo(editing))) onDone()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <fieldset>
        <legend className="label">Tipo</legend>
        <div className="grid grid-cols-2 gap-1 rounded-lg border border-line bg-surface-raised p-1 sm:grid-cols-4">
          {TYPE_ORDER.map((t) => (
            <label
              key={t}
              className={`flex cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-1.5 py-1.5 text-[13px] transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent ${
                type === t ? 'bg-surface-hover font-medium text-ink' : 'text-ink-secondary hover:text-ink'
              }`}
            >
              <input
                type="radio"
                name="type"
                value={t}
                checked={type === t}
                onChange={() => handleTypeChange(t)}
                className="sr-only"
              />
              <span className={`h-2 w-2 rounded-full ${TYPE_META[t].dot}`} aria-hidden />
              {TYPE_META[t].label}
            </label>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-ink-muted">{TYPE_META[type].hint}</p>
      </fieldset>

      <div>
        <label htmlFor="tx-description" className="label">Descripción</label>
        <input
          id="tx-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={type === 'variable' ? 'Ej: chocolate en el kiosco' : type === 'fixed' ? 'Ej: arriendo' : ''}
          maxLength={200}
          data-autofocus={focusAmount ? undefined : true}
          autoComplete="off"
          className="field w-full"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="tx-amount" className="label">Monto</label>
          <AmountInput id="tx-amount" value={amount} onChange={setAmount} placeholder="0" data-autofocus={focusAmount ? true : undefined} />
        </div>
        <div>
          <label htmlFor="tx-date" className="label">Fecha</label>
          <input
            id="tx-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="field w-full"
          />
        </div>
      </div>

      <div>
        <label htmlFor="tx-category" className="label">Categoría</label>
        <select
          id="tx-category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="field w-full"
        >
          <option value="">Sin categoría</option>
          {typeCategories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <label className="flex cursor-pointer items-start gap-2.5">
        <input
          type="checkbox"
          checked={recurring}
          onChange={(e) => setRecurring(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-accent"
        />
        <span>
          <span className="block text-sm text-ink">Se repite cada mes</span>
          <span className="block text-xs text-ink-muted">Podrás copiarlo al mes siguiente con un clic.</span>
        </span>
      </label>

      {error && (
        <p role="alert" className="text-sm text-negative">{error}</p>
      )}

      <div className="flex items-center gap-2 border-t border-line-muted pt-4">
        {editing && (
          <button type="button" onClick={handleDelete} className="btn-ghost text-ink-secondary hover:text-negative">
            <Trash2 size={15} aria-hidden />
            Eliminar
          </button>
        )}
        <div className="ml-auto flex gap-2">
          <button type="button" onClick={onDone} className="btn-ghost">Cancelar</button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Agregar'}
          </button>
        </div>
      </div>
    </form>
  )
}
