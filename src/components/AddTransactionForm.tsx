import { useEffect, useRef, useState } from 'react'
import { formatAmountInput, parseAmountInput } from '@/lib/calculations'
import type { Category, Transaction, TransactionInput, TransactionType } from '@/types/finance'

export type TransactionFormData = Omit<TransactionInput, 'month'>

interface Props {
  categories: Category[]
  editing: Transaction | null
  saving: boolean
  /** Devuelve true si se guardó, para limpiar el formulario solo en ese caso. */
  onSubmit: (data: TransactionFormData) => Promise<boolean>
  onCancelEdit: () => void
}

const TYPE_OPTIONS: { value: TransactionType; label: string }[] = [
  { value: 'income', label: '+ ingreso' },
  { value: 'fixed', label: '− gasto fijo' },
  { value: 'variable', label: '− gasto variable' },
  { value: 'savings', label: '» ahorro' },
]

const TYPE_GROUP_LABEL: Record<TransactionType, string> = {
  income: 'ingresos',
  fixed: 'gastos fijos',
  variable: 'gastos variables',
  savings: 'ahorro',
}

const inputClass =
  'rounded-md border border-border bg-bg-elevated-2 px-2.5 py-1.5 font-mono text-xs text-txt-primary placeholder:text-txt-tertiary focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue focus-visible:outline-offset-1'

export function AddTransactionForm({ categories, editing, saving, onSubmit, onCancelEdit }: Props) {
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState<TransactionType>('variable')
  const [categoryId, setCategoryId] = useState('')
  const [recurring, setRecurring] = useState(false)
  const [error, setError] = useState('')
  const descriptionRef = useRef<HTMLInputElement>(null)

  const reset = () => {
    setDescription('')
    setAmount('')
    setType('variable')
    setCategoryId('')
    setRecurring(false)
    setError('')
  }

  useEffect(() => {
    if (!editing) {
      reset()
      return
    }
    setDescription(editing.description)
    setAmount(formatAmountInput(editing.amount))
    setType(editing.type)
    setCategoryId(editing.category_id ?? '')
    setRecurring(editing.recurring)
    setError('')
    descriptionRef.current?.focus()
  }, [editing])

  const handleTypeChange = (next: TransactionType) => {
    setType(next)
    // Los gastos fijos suelen repetirse cada mes
    setRecurring(next === 'fixed')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const parsed = parseAmountInput(amount)

    if (!description.trim()) {
      setError('falta la descripción')
      return
    }
    if (Number.isNaN(parsed) || parsed <= 0) {
      setError('el monto debe ser mayor a 0')
      return
    }

    setError('')
    const ok = await onSubmit({
      description: description.trim(),
      amount: parsed,
      type,
      category_id: categoryId || null,
      recurring,
    })

    if (ok && !editing) reset()
  }

  // El grupo del tipo elegido va primero, pero se permite cualquier categoría
  const groupOrder = [type, ...TYPE_OPTIONS.map((o) => o.value).filter((t) => t !== type)]

  return (
    <form
      onSubmit={handleSubmit}
      className={`border-t px-4 py-3 font-mono text-sm ${
        editing ? 'border-blue bg-blue/5' : 'border-border-muted'
      }`}
    >
      {editing && (
        <div className="mb-2 text-xs text-blue">
          git commit --amend · editando “{editing.description}”
        </div>
      )}

      <div className="grid grid-cols-[14px_1fr] items-center gap-2 sm:grid-cols-[14px_1fr_120px_130px_auto]">
        <span className={editing ? 'text-blue' : 'text-green'}>$</span>
        <input
          ref={descriptionRef}
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="descripción del movimiento"
          aria-label="Descripción"
          maxLength={500}
          className={`w-full ${inputClass}`}
        />
        <input
          type="text"
          inputMode="numeric"
          value={amount}
          onChange={(e) => setAmount(formatAmountInput(e.target.value))}
          placeholder="monto"
          aria-label="Monto en pesos"
          className={`col-span-2 w-full text-right sm:col-span-1 ${inputClass}`}
        />
        <select
          value={type}
          onChange={(e) => handleTypeChange(e.target.value as TransactionType)}
          aria-label="Tipo de movimiento"
          className={`col-span-2 w-full sm:col-span-1 ${inputClass}`}
        >
          {TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {/* En móvil el botón va al final (order-last); en escritorio, en la primera fila */}
        <button
          type="submit"
          disabled={saving}
          className={`order-last col-span-2 rounded-md border px-3.5 py-1.5 font-mono text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 sm:order-none sm:col-span-1 ${
            editing
              ? 'border-blue bg-blue/10 text-blue hover:bg-blue/20'
              : 'border-green bg-green-bg text-green hover:bg-green-hover'
          }`}
        >
          {saving ? 'guardando…' : editing ? 'amend' : 'commit'}
        </button>

        <div className="col-span-2 flex flex-wrap items-center gap-x-4 gap-y-2 sm:col-span-4 sm:col-start-2">
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            aria-label="Categoría"
            className={`min-w-[180px] ${inputClass}`}
          >
            <option value="">sin categoría</option>
            {groupOrder.map((t) => {
              const items = categories.filter((c) => c.type === t)
              if (items.length === 0) return null
              return (
                <optgroup key={t} label={TYPE_GROUP_LABEL[t]}>
                  {items.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </optgroup>
              )
            })}
          </select>

          <label className="flex cursor-pointer items-center gap-1.5 text-xs text-txt-secondary">
            <input
              type="checkbox"
              checked={recurring}
              onChange={(e) => setRecurring(e.target.checked)}
              className="accent-green"
            />
            ↻ recurrente
          </label>

          {editing && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="text-xs text-txt-tertiary transition-colors hover:text-txt-primary"
            >
              cancelar edición
            </button>
          )}

          {error && <span className="text-xs text-red">{error}</span>}
        </div>
      </div>
    </form>
  )
}
