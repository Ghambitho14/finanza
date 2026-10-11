import { createContext, useCallback, useContext, useState, type FormEvent, type ReactNode } from 'react'
import { Trash2 } from 'lucide-react'
import { AmountInput } from '@/components/AmountInput'
import { Modal } from '@/components/Modal'
import { useToast } from '@/components/Toaster'
import { errorMessage } from '@/lib/api'
import { useFinance } from '@/lib/finance-store'
import { formatAmountInput, todayISO } from '@/lib/format'
import { TYPE_META, TYPE_ORDER, recurringByDefault } from '@/lib/transaction-types'
import type { Transaction, TransactionType } from '@/types/finance'
import { DESCRIPTION_EXAMPLES, shiftDays, toInput, validateTransaction } from '@shared/transaction-form'

export { toInput }

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
    const result = validateTransaction({ type, description, amount, date, categoryId, recurring })
    if ('error' in result) return setError(result.error)
    const { input } = result

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

  const today = todayISO()
  const yesterday = shiftDays(today, -1)

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <fieldset>
        <legend className="sr-only">Tipo de movimiento</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {TYPE_ORDER.map((t) => {
            const Icon = TYPE_META[t].icon
            const selected = type === t
            return (
              <label
                key={t}
                className={`flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-center text-[13px] transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent ${
                  selected
                    ? 'border-ink bg-surface-raised font-medium text-ink'
                    : 'border-line text-ink-secondary hover:border-ink-muted/60 hover:text-ink'
                }`}
              >
                <input
                  type="radio"
                  name="type"
                  value={t}
                  checked={selected}
                  onChange={() => handleTypeChange(t)}
                  className="sr-only"
                />
                <span className={`grid h-8 w-8 place-items-center rounded-lg ${TYPE_META[t].tint}`} aria-hidden>
                  <Icon size={16} />
                </span>
                {TYPE_META[t].label}
              </label>
            )
          })}
        </div>
        <p className="mt-2 text-xs text-ink-muted">{TYPE_META[type].hint}</p>
      </fieldset>

      <div>
        <label htmlFor="tx-amount" className="label">Monto</label>
        <AmountInput id="tx-amount" size="lg" value={amount} onChange={setAmount} placeholder="0" data-autofocus />
      </div>

      <div>
        <label htmlFor="tx-description" className="label">Descripción</label>
        <input
          id="tx-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={DESCRIPTION_EXAMPLES[type]}
          maxLength={200}
          autoComplete="off"
          className="field w-full"
        />
      </div>

      <fieldset>
        <legend className="label">Categoría</legend>
        <div className="flex flex-wrap gap-1.5">
          <label className="chip">
            <input type="radio" name="category" checked={categoryId === ''} onChange={() => setCategoryId('')} className="sr-only" />
            Sin categoría
          </label>
          {typeCategories.map((c) => (
            <label key={c.id} className="chip">
              <input
                type="radio"
                name="category"
                checked={categoryId === c.id}
                onChange={() => setCategoryId(c.id)}
                className="sr-only"
              />
              {c.name}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="label">Fecha</legend>
        <div className="flex flex-wrap items-center gap-1.5">
          <button type="button" onClick={() => setDate(today)} aria-pressed={date === today} className="chip">Hoy</button>
          <button type="button" onClick={() => setDate(yesterday)} aria-pressed={date === yesterday} className="chip">Ayer</button>
          <input
            id="tx-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            aria-label="Otra fecha"
            className="field h-8 sm:h-8"
          />
        </div>
      </fieldset>

      <div className="flex items-center justify-between gap-4 rounded-xl border border-line px-4 py-3">
        <span id="tx-recurring-label">
          <span className="block text-sm text-ink">Se repite cada mes</span>
          <span className="block text-xs text-ink-muted">Podrás copiarlo al mes siguiente con un clic.</span>
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={recurring}
          aria-labelledby="tx-recurring-label"
          onClick={() => setRecurring((r) => !r)}
          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${recurring ? 'bg-accent' : 'bg-surface-hover ring-1 ring-inset ring-line'}`}
        >
          <span
            className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${recurring ? 'translate-x-5' : ''}`}
            aria-hidden
          />
        </button>
      </div>

      {error && (
        <p role="alert" className="text-sm text-negative">{error}</p>
      )}

      {/* Fijo abajo: en el teléfono el formulario puede ser más alto que la pantalla */}
      <div className="sticky bottom-0 -mx-5 flex items-center gap-2 border-t border-line-muted bg-surface px-5 pt-4 sm:static sm:mx-0 sm:px-0">
        {editing && (
          <button type="button" onClick={handleDelete} className="btn-ghost px-2.5 text-ink-secondary hover:text-negative">
            <Trash2 size={15} aria-hidden />
            Eliminar
          </button>
        )}
        <div className="ml-auto flex gap-2">
          <button type="button" onClick={onDone} className="btn-ghost">Cancelar</button>
          <button type="submit" disabled={saving} className="btn-primary min-w-[7rem]">
            {saving ? 'Guardando…' : editing ? 'Guardar cambios' : `Agregar ${TYPE_META[type].label.toLowerCase()}`}
          </button>
        </div>
      </div>
    </form>
  )
}
